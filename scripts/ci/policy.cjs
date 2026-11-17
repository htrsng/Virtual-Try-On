function classify({ phase, exitCode, counts, minimum = 0, reportRequired = false, text = '', blockedReason }) {
  if (blockedReason) return { status: 'Blocked', reason: blockedReason };
  if (phase !== 'run') return { status: exitCode === 0 ? 'Passed' : 'InfrastructureFailure', reason: `${phase} exit ${exitCode}` };
  if (exitCode !== 0 && /DownloadError|MongoBinaryDownload|Readiness timeout|EADDRINUSE|Executable doesn't exist|Host system is missing dependencies|Unsupported platform/i.test(text))
    return { status: 'InfrastructureFailure', reason: 'Recognized service/browser provisioning failure; inspect raw log' };
  if (counts) {
    const total = counts.passed + counts.failed + counts.skipped;
    if (total === 0) return { status: exitCode === 0 ? 'Blocked' : 'InfrastructureFailure', reason: 'No test cases executed; runner/setup did not produce case results' };
    if (counts.failed || exitCode !== 0) return { status: 'Failed', reason: 'Runner or test cases failed' };
    if (counts.skipped === total) return { status: 'Skipped', reason: 'All collected cases skipped; mandatory gate is not satisfied' };
    if (counts.skipped) return { status: 'Failed', reason: 'Unexpected skipped cases in mandatory suite; counts preserved' };
    if (counts.passed < minimum) return { status: 'Blocked', reason: `Under-collected suite: ${counts.passed} cases, minimum ${minimum}` };
  } else if (reportRequired) return { status: exitCode === 0 ? 'Blocked' : 'InfrastructureFailure', reason: 'Required machine-readable report missing; cannot assert suite coverage' };
  return { status: exitCode === 0 ? 'Passed' : 'Failed', reason: `run exit ${exitCode}` };
}
const xml = value => String(value ?? '').replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
module.exports = { classify, xml };
