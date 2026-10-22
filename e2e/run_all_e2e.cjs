const { runAuthJourney } = require('./journeys/01_auth.e2e.cjs');
const { runRepairJourney } = require('./journeys/02_repair.e2e.cjs');
const { runPosJourney } = require('./journeys/03_pos.e2e.cjs');
const { runPurchaseOrderJourney } = require('./journeys/04_purchaseOrder.e2e.cjs');
const { runStockTakeJourney } = require('./journeys/05_stockTake.e2e.cjs');
const { runPublicWarrantyJourney } = require('./journeys/06_publicWarranty.e2e.cjs');
const { runWarehouseTransferJourney } = require('./journeys/07_warehouseTransfer.e2e.cjs');
const { runMobileJourney } = require('./journeys/08_mobile.e2e.cjs');
const { runDesktopJourney } = require('./journeys/09_desktop.e2e.cjs');

async function runAllE2E() {
  console.log('===============================================================');
  console.log('PHASE 11: FULL END-TO-END BROWSER VERIFICATION SUITE');
  console.log('===============================================================');

  const start = Date.now();
  const suiteResults = [];

  const journeys = [
    runAuthJourney,
    runRepairJourney,
    runPosJourney,
    runPurchaseOrderJourney,
    runStockTakeJourney,
    runPublicWarrantyJourney,
    runWarehouseTransferJourney,
    runMobileJourney,
    runDesktopJourney,
  ];

  for (const journeyFn of journeys) {
    try {
      const res = await journeyFn();
      suiteResults.push(res);
    } catch (err) {
      console.error('Journey execution fatal error:', err);
      suiteResults.push({ journey: journeyFn.name, results: [{ test: 'FATAL', desc: err.message, pass: false }] });
    }
  }

  console.log('\n===============================================================');
  console.log('PHASE 11 E2E EXECUTION SUMMARY');
  console.log('===============================================================');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const suite of suiteResults) {
    console.log(`\n--- Journey: ${suite.journey} ---`);
    for (const r of suite.results) {
      totalTests++;
      if (r.pass) {
        passedTests++;
        console.log(`  ✅ PASS [${r.test}] ${r.desc}`);
      } else {
        failedTests++;
        console.log(`  ❌ FAIL [${r.test}] ${r.desc}`);
      }
    }
  }

  const durationSec = ((Date.now() - start) / 1000).toFixed(1);
  console.log('\n===============================================================');
  console.log(`Total E2E Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Duration: ${durationSec}s`);
  console.log('===============================================================');

  if (failedTests > 0) {
    console.error(`\n❌ E2E Suite finished with ${failedTests} failures.`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL E2E JOURNEYS PASSED WITH 100% REAL BROWSER PROOF!');
    process.exit(0);
  }
}

runAllE2E();
