"""Xử lý file và quản lý tiến trình dùng chung cho harness bán hàng mô phỏng."""
from contextlib import contextmanager
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
HARNESS_DIR = ROOT / "node_harness"
ENVIRONMENT = "node_harness_stub"
RESULT_MARKER = "===RESULT==="
WORK_DIR = ROOT / ".runtime"
HIDDEN_PROCESS = {"creationflags": subprocess.CREATE_NO_WINDOW} if os.name == "nt" else {}


class HarnessError(RuntimeError):
    """A runner/setup failure, distinct from an HTTP or business violation."""

    def __init__(self, message, kind="PROCESS_ERROR"):
        super().__init__(message)
        self.kind = kind


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


# Ghi xong file tạm mới thay kết quả cũ để tránh mất bằng chứng.
def write_json(path, value):
    """Replace a JSON artifact only after the entire new document is written."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile("w",
             encoding="utf-8",
             dir=path.parent,
             suffix=".tmp",
             delete=False) as stream:
            temporary = Path(stream.name)
            json.dump(value, stream, ensure_ascii=False, indent=2)
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return path


def load_seed(filename):
    return read_json(ROOT / "seed_corpus" / filename)


@contextmanager
# Tạo file trao đổi Python–Node và dọn file sau khi dùng.
def job_file(payload):
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    path = WORK_DIR / (uuid.uuid4().hex + ".json")
    try:
        write_json(path, payload)
        yield path
    finally:
        path.unlink(missing_ok=True)


# Kiểm tra định dạng kết quả và định danh môi trường mô phỏng.
def parse_result(stdout, stderr="", returncode=0):
    if RESULT_MARKER not in stdout:
        raise HarnessError(f"Missing result marker; exit={returncode}; {stderr[-1000:]}",
             "PROTOCOL_ERROR")
    try:
        result = json.loads(stdout.rsplit(RESULT_MARKER, 1)[1].strip())
    except json.JSONDecodeError as error:
        raise HarnessError("Invalid runner JSON", "PROTOCOL_ERROR") from error
    if not isinstance(result, dict):
        raise HarnessError("Runner result must be an object", "PROTOCOL_ERROR")
    if not result.get("ok") or returncode:
        raise HarnessError(result.get("error",
             f"Node exited with {returncode}"),
             result.get("error_kind",
             "PROCESS_ERROR"))
    if result.get("environment") != ENVIRONMENT:
        raise HarnessError("Runner did not use the simulated node_harness", "PROTOCOL_ERROR")
    return result


# Gọi Node, chờ kết quả và xử lý timeout.
def run_node(script, payload, timeout=35):
    try:
        with job_file(payload) as path:
            process = subprocess.run(
                ["node", script, str(path)], cwd=HARNESS_DIR, capture_output=True,
                text=True, encoding="utf-8", errors="replace", timeout=timeout,
                **HIDDEN_PROCESS,
            )
        return parse_result(process.stdout, process.stderr, process.returncode)
    except subprocess.TimeoutExpired as error:
        raise HarnessError(f"Harness exceeded {timeout}s", "TIMEOUT") from error
    except OSError as error:
        raise HarnessError(str(error)) from error


@contextmanager
# Mở HTTP harness và đóng tiến trình sau khi sử dụng.
def simulated_http_server(log_path, startup_timeout=15):
    """Start only node_harness on an ephemeral loopback port; close it on exit."""
    log_path = Path(log_path)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with job_file({}) as ready_path, log_path.open("w", encoding="utf-8") as log:
        process = subprocess.Popen(
            ["node", "http_server.js", str(ready_path)], cwd=HARNESS_DIR,
            stdout=log, stderr=subprocess.STDOUT, **HIDDEN_PROCESS,
        )
        try:
            deadline = time.monotonic() + startup_timeout
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    raise HarnessError(f"HTTP harness exited; see {log_path}", "SETUP_ERROR")
                try:
                    ready = read_json(ready_path)
                    if ready.get("environment") == ENVIRONMENT and ready.get("url"):
                        break
                except (FileNotFoundError, json.JSONDecodeError):
                    pass
                time.sleep(0.05)
            else:
                raise HarnessError(f"HTTP harness did not become ready; see {log_path}",
                     "SETUP_ERROR")
            yield ready["url"]
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
