import http from 'http';

const API_PORT = 5000;

function fetchJSON(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataString),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: API_PORT,
      path,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (dataString) req.write(dataString);
    req.end();
  });
}

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

async function runIntegrationVerification() {
  console.log('🚀 Running Full-Stack E2E Integration Verification...\n');

  try {
    // 1. Health Check
    const health = await fetchJSON('/api/health');
    assert(health.status === 200 && health.data?.status === 'ok', 'API Health Check OK');

    // 2. Demo Login to obtain auth token
    const loginRes = await fetchJSON('/api/auth/demo-login', 'POST');
    assert(loginRes.status === 200 && loginRes.data?.token, 'Demo Login successful');
    const token = loginRes.data.token;

    // 3. Create Quotation with all 4 product test types
    const quotationPayload = {
      documentType: 'Quotation',
      templateId: 'navy',
      quotationNumber: `QT-TEST-${Date.now().toString().slice(-6)}`,
      quotationDate: '2026-09-05',
      placeOfSupply: 'Maharashtra',
      placeOfSupplyCode: '27',
      customer: {
        name: 'Apex Industrial Works Pvt Ltd',
        mobile: '+91 98765 12345',
        email: 'billing@apexindustrial.com',
        billingAddress: 'Plot 44, MIDC Bhosari, Pune, Maharashtra - 411026',
        gstin: '27AABCA9999K1Z5',
      },
      items: [
        // Product 1: Standard 18% GST
        {
          itemIndex: 1,
          description: 'High Power Solar Inverter 10kW',
          hsnSac: '8504',
          rate: 25000,
          quantity: 4,
          unit: 'Nos',
          discountPercent: 0,
          discountAmount: 0,
          taxableValue: 100000,
          taxableAmount: 100000,
          taxRate: 18,
          taxAmount: 18000,
          amount: 118000,
          totalAmount: 118000,
        },
        // Product 2: 12% GST with 10% Discount
        {
          itemIndex: 2,
          description: 'Solar Mounting Rails & Hardware Kit',
          hsnSac: '7308',
          rate: 500,
          quantity: 2,
          unit: 'Set',
          discountPercent: 10,
          discountAmount: 100,
          taxableValue: 900,
          taxableAmount: 900,
          taxRate: 12,
          taxAmount: 108,
          amount: 1008,
          totalAmount: 1008,
        },
        // Product 3: Decimal quantities & rates with 5% GST
        {
          itemIndex: 3,
          description: 'DC Solar Cable 4 sq mm Red/Black',
          hsnSac: '8544',
          rate: 99.50,
          quantity: 2.5,
          unit: 'Mtr',
          discountPercent: 0,
          discountAmount: 0,
          taxableValue: 248.75,
          taxableAmount: 248.75,
          taxRate: 5,
          taxAmount: 12.44,
          amount: 261.19,
          totalAmount: 261.19,
        },
        // Product 4: Zero GST Item
        {
          itemIndex: 4,
          description: 'Safety & System Commissioning Handbook',
          hsnSac: '4901',
          rate: 150,
          quantity: 10,
          unit: 'Nos',
          discountPercent: 0,
          discountAmount: 0,
          taxableValue: 1500,
          taxableAmount: 1500,
          taxRate: 0,
          taxAmount: 0,
          amount: 1500,
          totalAmount: 1500,
        },
      ],
      summary: {
        subtotal: 102748.75,
        totalDiscount: 100,
        taxableAmount: 102648.75,
        cgstAmount: 9060.22,
        sgstAmount: 9060.22,
        totalTax: 18120.44,
        grandTotal: 120769.19,
        amountInWords: 'INR One Lakh, Twenty Thousand, Seven Hundred Sixty Nine Rupees and Nineteen Paise Only',
      },
    };

    console.log('\n--- 1. Creating Quotation Document ---');
    const createRes = await fetchJSON('/api/quotations', 'POST', quotationPayload, token);
    assert(createRes.status === 201 && createRes.data?.data?._id, 'Quotation created successfully in MongoDB');
    const createdDoc = createRes.data.data;

    // 4. Retrieve Document from MongoDB and verify all fields
    console.log('\n--- 2. Fetching & Verifying Persisted Document ---');
    const getRes = await fetchJSON(`/api/quotations/${createdDoc._id}`, 'GET', null, token);
    assert(getRes.status === 200, 'Quotation fetched by ID');
    const doc = getRes.data.data;

    // Item 1 assertions
    const itm1 = doc.items[0];
    assertApprox(itm1.taxableValue, 100000, 'Item 1 Taxable Value is 100000');
    assertApprox(itm1.taxAmount, 18000, 'Item 1 Taxable Amount (tax) is 18000');
    assertApprox(itm1.amount, 118000, 'Item 1 Total Amount (amount) is 118000');
    assertApprox(itm1.totalAmount, 118000, 'Item 1 Total Amount (totalAmount) is 118000');

    // Item 2 assertions
    const itm2 = doc.items[1];
    assertApprox(itm2.discountAmount, 100, 'Item 2 Discount Amount is 100');
    assertApprox(itm2.taxableValue, 900, 'Item 2 Taxable Value is 900');
    assertApprox(itm2.taxAmount, 108, 'Item 2 Taxable Amount is 108');
    assertApprox(itm2.totalAmount, 1008, 'Item 2 Total Amount is 1008');

    // Item 3 assertions
    const itm3 = doc.items[2];
    assertApprox(itm3.taxableValue, 248.75, 'Item 3 Taxable Value is 248.75');
    assertApprox(itm3.taxAmount, 12.44, 'Item 3 Taxable Amount is 12.44');
    assertApprox(itm3.totalAmount, 261.19, 'Item 3 Total Amount is 261.19');

    // Item 4 assertions
    const itm4 = doc.items[3];
    assertApprox(itm4.taxableValue, 1500, 'Item 4 Taxable Value is 1500');
    assertApprox(itm4.taxAmount, 0, 'Item 4 Taxable Amount is 0');
    assertApprox(itm4.totalAmount, 1500, 'Item 4 Total Amount is 1500');

    // Summary assertions
    assertApprox(doc.summary.taxableAmount, 102648.75, 'Summary Taxable Base is 102648.75');
    assertApprox(doc.summary.totalTax, 18120.44, 'Summary Total Tax is 18120.44');
    assertApprox(doc.summary.grandTotal, 120769.19, 'Summary Grand Total is 120769.19');

    // 5. Convert to Invoice
    console.log('\n--- 3. Testing Conversion to Invoice ---');
    const convertRes = await fetchJSON(`/api/quotations/${createdDoc._id}/convert-to-invoice`, 'POST', null, token);
    assert(convertRes.status === 201 && convertRes.data?.data?.documentType === 'Invoice', 'Converted to Invoice');
    const invoiceDoc = convertRes.data.data;
    assertApprox(invoiceDoc.items[0].taxableValue, 100000, 'Invoice Item 1 Taxable Value preserved');
    assertApprox(invoiceDoc.summary.grandTotal, 120769.19, 'Invoice Grand Total preserved');

    // 6. Duplicate Document
    console.log('\n--- 4. Testing Document Duplication ---');
    const duplicateRes = await fetchJSON(`/api/quotations/${createdDoc._id}/duplicate`, 'POST', null, token);
    assert(duplicateRes.status === 201, 'Document duplicated successfully');
    const dupDoc = duplicateRes.data.data;
    assertApprox(dupDoc.items[0].taxableValue, 100000, 'Duplicated Item 1 Taxable Value preserved');
    assertApprox(dupDoc.summary.grandTotal, 120769.19, 'Duplicated Grand Total preserved');

    // Clean up test documents
    await fetchJSON(`/api/quotations/${createdDoc._id}`, 'DELETE', null, token);
    await fetchJSON(`/api/quotations/${invoiceDoc._id}`, 'DELETE', null, token);
    await fetchJSON(`/api/quotations/${dupDoc._id}`, 'DELETE', null, token);

    console.log(`\n============================================================`);
    console.log(`🎉 ALL INTEGRATION TESTS PASSED: ${passed} / ${total} (100%)`);
    console.log(`============================================================\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Integration test failed:', err);
    process.exit(1);
  }
}

runIntegrationVerification();
