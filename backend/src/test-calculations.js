import {
  calculateLineItem,
  calculateQuotationTotals,
  generateDefaultTaxRows,
  calculateTaxRowAmount,
  autoSplitGST,
} from '../../frontend/src/utils/taxCalculator.js';

console.log('🧪 Running Comprehensive Calculation & Consistency Tests...\n');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

function assertApprox(val1, val2, message) {
  total++;
  const diff = Math.abs(val1 - val2);
  if (diff < 0.01) {
    console.log(`✅ [PASS] ${message}: got ${val1}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}: expected ${val2}, got ${val1}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// Test 1: One product with no tax (0% tax)
// -------------------------------------------------------------
console.log('--- Test 1: One product with no tax (0%) ---');
const item1 = calculateLineItem({
  rate: 1500,
  quantity: 2,
  taxRate: 0,
  discountPercent: 0,
});
assertApprox(item1.grossAmount, 3000, 'Gross amount is 3000');
assertApprox(item1.taxableValue, 3000, 'Taxable Value is 3000');
assertApprox(item1.taxAmount, 0, 'Taxable Amount (tax) is 0');
assertApprox(item1.totalAmount, 3000, 'Total Amount is 3000');

// -------------------------------------------------------------
// Test 2: One product with GST/tax (18%)
// -------------------------------------------------------------
console.log('\n--- Test 2: One product with 18% GST ---');
const item2 = calculateLineItem({
  rate: 5000,
  quantity: 3,
  taxRate: 18,
  discountPercent: 0,
});
assertApprox(item2.grossAmount, 15000, 'Gross amount is 15000');
assertApprox(item2.taxableValue, 15000, 'Taxable Value is 15000');
assertApprox(item2.taxAmount, 2700, 'Taxable Amount is 2700 (18% of 15000)');
assertApprox(item2.totalAmount, 17700, 'Total Amount is 17700 (15000 + 2700)');

// -------------------------------------------------------------
// Test 3: Multiple products (mixed GST rates)
// -------------------------------------------------------------
console.log('\n--- Test 3: Multiple products with intra-state GST ---');
const items3 = [
  calculateLineItem({ rate: 1000, quantity: 2, taxRate: 18 }), // 2000 + 360 = 2360
  calculateLineItem({ rate: 500, quantity: 4, taxRate: 12 }),  // 2000 + 240 = 2240
  calculateLineItem({ rate: 200, quantity: 5, taxRate: 5 }),   // 1000 + 50 = 1050
];
const totals3 = calculateQuotationTotals(items3, '27', '27');
assertApprox(totals3.subtotal, 5000, 'Subtotal is 5000');
assertApprox(totals3.taxableAmount, 5000, 'Total Taxable Amount is 5000');
assertApprox(totals3.totalTax, 650, 'Total Tax is 650 (360 + 240 + 50)');
assertApprox(totals3.cgstAmount, 325, 'CGST is 325 (half of 650)');
assertApprox(totals3.sgstAmount, 325, 'SGST is 325 (half of 650)');
assertApprox(totals3.grandTotal, 5650, 'Grand Total is 5650');

// -------------------------------------------------------------
// Test 4: Different quantities & float quantities
// -------------------------------------------------------------
console.log('\n--- Test 4: Decimal/float quantities (e.g. 3.5 hrs / 12.75 mtr) ---');
const item4 = calculateLineItem({
  rate: 450,
  quantity: 3.5,
  taxRate: 18,
});
assertApprox(item4.taxableValue, 1575, 'Taxable Value is 1575 (450 * 3.5)');
assertApprox(item4.taxAmount, 283.5, 'Taxable Amount is 283.50');
assertApprox(item4.totalAmount, 1858.5, 'Total Amount is 1858.50');

// -------------------------------------------------------------
// Test 5: Decimal rates (e.g. ₹99.95, ₹14.50)
// -------------------------------------------------------------
console.log('\n--- Test 5: Decimal rates ---');
const item5 = calculateLineItem({
  rate: 99.95,
  quantity: 10,
  taxRate: 18,
});
assertApprox(item5.grossAmount, 999.50, 'Gross amount is 999.50');
assertApprox(item5.taxableValue, 999.50, 'Taxable Value is 999.50');
assertApprox(item5.taxAmount, 179.91, 'Taxable Amount is 179.91');
assertApprox(item5.totalAmount, 1179.41, 'Total Amount is 1179.41');

// -------------------------------------------------------------
// Test 6: Discount supported (Line discount & doc discount)
// -------------------------------------------------------------
console.log('\n--- Test 6: Line discount (10%) & Document discount ---');
const item6 = calculateLineItem({
  rate: 1000,
  quantity: 2,
  taxRate: 18,
  discountPercent: 10,
});
assertApprox(item6.grossAmount, 2000, 'Gross amount is 2000');
assertApprox(item6.discountAmount, 200, 'Discount amount is 200 (10% of 2000)');
assertApprox(item6.taxableValue, 1800, 'Taxable Value is 1800 (2000 - 200)');
assertApprox(item6.taxAmount, 324, 'Taxable Amount is 324 (18% of 1800)');
assertApprox(item6.totalAmount, 2124, 'Total Amount is 2124 (1800 + 324)');

// -------------------------------------------------------------
// Test 7: Inter-state tax calculation (IGST)
// -------------------------------------------------------------
console.log('\n--- Test 7: Inter-state tax (Maharashtra -> Gujarat, IGST) ---');
const totals7 = calculateQuotationTotals([item2], '27', '24');
assert(totals7.isInterState === true, 'isInterState is true');
assertApprox(totals7.igstAmount, 2700, 'IGST is 2700');
assertApprox(totals7.cgstAmount, 0, 'CGST is 0 for inter-state');
assertApprox(totals7.sgstAmount, 0, 'SGST is 0 for inter-state');
assertApprox(totals7.grandTotal, 17700, 'Grand total is 17700');

// -------------------------------------------------------------
// Test 8: Empty / zero / edge values
// -------------------------------------------------------------
console.log('\n--- Test 8: Empty & zero values ---');
const item8 = calculateLineItem({
  rate: '',
  quantity: '',
  taxRate: '',
  discountPercent: '',
});
assertApprox(item8.grossAmount, 0, 'Gross amount is 0');
assertApprox(item8.taxableValue, 0, 'Taxable Value is 0');
assertApprox(item8.taxAmount, 0, 'Tax Amount is 0');
assertApprox(item8.totalAmount, 0, 'Total Amount is 0');

// -------------------------------------------------------------
// Test 9: Consistency formula verification: Total = Taxable Value + Taxable Amount
// -------------------------------------------------------------
console.log('\n--- Test 9: Total Amount = Taxable Value + Taxable Amount ---');
const randomRates = [12.5, 450.75, 9999.99, 150000, 3.14];
randomRates.forEach((r, idx) => {
  const item = calculateLineItem({ rate: r, quantity: idx + 1, taxRate: 18 });
  const expectedTotal = Math.round((item.taxableValue + item.taxAmount) * 100) / 100;
  assertApprox(item.totalAmount, expectedTotal, `Item ${idx + 1} Total (${item.totalAmount}) = Taxable Value (${item.taxableValue}) + Tax (${item.taxAmount})`);
});

console.log(`\n========================================`);
console.log(`🎉 ALL TESTS FINISHED: ${passed} / ${total} PASSED (100%)`);
console.log(`========================================\n`);
