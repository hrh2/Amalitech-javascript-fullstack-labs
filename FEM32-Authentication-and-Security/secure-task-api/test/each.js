const { test } = require('node:test');
const { format } = require('node:util');

// node:test has no built-in "run this test for each case" helper, so this is a tiny one.
// forEach(cases, 'title with %s', fn) registers one test per case; fn receives that case.
function forEach(cases, title, fn) {
  for (const testCase of cases) {
    const label = format(title, ...(Array.isArray(testCase) ? testCase : [testCase]));
    test(label, () => fn(testCase));
  }
}

module.exports = { forEach };
