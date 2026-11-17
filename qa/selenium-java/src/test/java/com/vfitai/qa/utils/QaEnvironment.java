package com.vfitai.qa.utils;

import com.google.gson.*;
import java.nio.file.*;
import java.util.concurrent.TimeUnit;

public final class QaEnvironment {
    private final Path manifest;
    public QaEnvironment() {
        String value = System.getenv("QA_MANIFEST");
        if (value == null) throw new IllegalStateException("Run through node scripts/qa-selenium.cjs");
        manifest = Path.of(value).toAbsolutePath();
    }
    public JsonObject data() throws Exception {
        JsonObject data = JsonParser.parseString(Files.readString(manifest)).getAsJsonObject();
        if (!"ready".equals(data.get("status").getAsString())) throw new IllegalStateException("QA environment not ready");
        return data;
    }
    public String ui() throws Exception { return data().get("uiURL").getAsString(); }
    public JsonObject customer() throws Exception { return data().getAsJsonObject("accounts").getAsJsonObject("customer"); }
    public void control(String command) throws Exception {
        if (!command.equals("reset") && !command.equals("clear")) throw new IllegalArgumentException(command);
        Path root = manifest.getParent().getParent().getParent().getParent();
        ProcessBuilder builder = new ProcessBuilder("node", "scripts/qa-environment.cjs", command).directory(root.toFile());
        builder.environment().put("QA_RUN_ID", data().get("runId").getAsString());
        Path log = Path.of("target", "qa-control.log");
        Files.createDirectories(log.getParent());
        builder.redirectErrorStream(true).redirectOutput(ProcessBuilder.Redirect.appendTo(log.toFile()));
        Process process = builder.start();
        if (!process.waitFor(75, TimeUnit.SECONDS)) { process.destroyForcibly(); throw new IllegalStateException("QA control timeout"); }
        if (process.exitValue() != 0) throw new IllegalStateException("QA control failed; inspect target/qa-control.log");
    }
}
