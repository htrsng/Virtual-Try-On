/* Theo dõi có chọn lọc các điều kiện totalAmount; tắt trong chạy API thông thường.
 * Mỗi single_run_harness dùng tiến trình riêng, không chia sẻ trace giữa input.
 */
let enabled = false;
let events = [];

function start() { enabled = true; events = []; }
function branch(id, condition) {
  if (enabled) events.push({ id, taken: Boolean(condition) });
  return condition;
}
function snapshot() { return events.slice(); }

module.exports = { start, branch, snapshot };
