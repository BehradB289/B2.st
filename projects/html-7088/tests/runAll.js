/**
 * Master Test Runner: Executes Unit and Integration Test Suites
 * Studio: B2.st
 */

import './unit.test.js';
import './integration.test.js';
import { runAll } from './testRunner.js';

runAll().then((summary) => {
  if (summary.failed === 0) {
    console.log('\n\x1b[32m✔ All automated test suites passed successfully with 0 defects!\x1b[0m\n');
  } else {
    console.error(`\n\x1b[31m✖ Pipeline failure: ${summary.failed} tests failed!\x1b[0m\n`);
  }
});