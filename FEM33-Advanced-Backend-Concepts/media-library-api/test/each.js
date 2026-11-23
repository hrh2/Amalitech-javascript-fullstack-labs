// node:test has no table-driven helper, so this is a small one: forEach(cases, title, fn) -> one test per case.
const { test } = require('node:test');

function forEach(cases, title, fn) {
  for (const c of cases) test(title(c), () => fn(c));
}

module.exports = { forEach };
