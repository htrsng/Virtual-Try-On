const fs = require('node:fs');
const path = require('node:path');
const { xml } = require('./policy.cjs');
class JunitReporter {
  onRunComplete(_, results) {
    const directory = process.env.CI_REPORT_DIR;
    if (!directory) throw new Error('CI_REPORT_DIR is required for CI Jest reporter');
    const suites = results.testResults.map(suite => {
      const cases = suite.testResults.map(test => {
        const skipped = ['pending', 'todo', 'disabled'].includes(test.status);
        return `<testcase classname="${xml(path.basename(suite.testFilePath))}" name="${xml(test.fullName)}" time="${(test.duration || 0) / 1000}">${skipped ? '<skipped/>' : test.status === 'failed' ? `<failure>${xml(test.failureMessages.join('\n'))}</failure>` : ''}</testcase>`;
      });
      if (!cases.length && suite.failureMessage) cases.push(`<testcase name="Suite initialization"><error>${xml(suite.failureMessage)}</error></testcase>`);
      return `<testsuite name="${xml(path.basename(suite.testFilePath))}" tests="${cases.length}" failures="${suite.numFailingTests}" skipped="${suite.numPendingTests}">${cases.join('')}</testsuite>`;
    });
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'backend.xml'), `<?xml version="1.0" encoding="UTF-8"?><testsuites>${suites.join('')}</testsuites>`);
  }
}
module.exports = JunitReporter;
