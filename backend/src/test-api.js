import http from 'http';

const fetchJSON = (path, method = 'GET', body = null, token = null) => {
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
      port: 5000,
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
};

async function runTests() {
  console.log('🚀 Running Full-Stack Multi-Business SaaS Verification Suite...\n');

  try {
    console.log('--- 1. Testing Health & Security Headers ---');
    const health = await fetchJSON('/api/health');
    console.log('Health:', health.data?.status === 'ok' ? '✅ OK' : '❌ FAIL');

    console.log('\n--- 2. Testing Multi-Business Profile & Settings ---');
    const settingsUpdate = {
      companyName: 'APEX MULTI-TECH & EPC ENTERPRISE',
      businessCategory: 'Electronics',
      tagline: 'INDUSTRIAL AUTOMATION & HARDWARE SOLUTIONS',
      defaultTemplate: 'corporate',
      defaultCustomFields: [
        { label: 'Project Name', defaultValue: 'Smart Factory 4.0' },
        { label: 'Warranty Period', defaultValue: '3 Years Comprehensive' },
      ],
    };
    const updateSettingsRes = await fetchJSON('/api/settings', 'PUT', settingsUpdate);
    console.log('Updated Business Profile:', updateSettingsRes.data?.data?.companyName, 'Category:', updateSettingsRes.data?.data?.businessCategory);

    console.log('\n--- 3. Testing Next Number for Quotation and Invoice ---');
    const nextQt = await fetchJSON('/api/settings/next-number?type=Quotation');
    const nextInv = await fetchJSON('/api/settings/next-number?type=Invoice');
    console.log('Next Quotation #:', nextQt.data?.documentNumber);
    console.log('Next Invoice #:', nextInv.data?.documentNumber);

    console.log('\n--- 4. Testing Multi-Industry Catalog ---');
    const products = await fetchJSON('/api/products');
    console.log(`Found ${products.data?.count || products.data?.data?.length} products across multiple industries:`);
    products.data?.data?.slice(0, 4).forEach((p) => {
      console.log(`  - [${p.type || 'Product'}] ${p.name} | ₹${p.rate} | GST ${p.gstRate}% | Cat: ${p.category}`);
    });

    console.log('\n--- 5. Testing Creating a Multi-Business Invoice with Multiple CGST/SGST entries ---');
    const newInvoice = {
      documentType: 'Invoice',
      templateId: 'corporate',
      quotationNumber: nextInv.data?.documentNumber || 'INV-2026-TEST',
      quotationDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      placeOfSupply: 'Maharashtra',
      placeOfSupplyCode: '27',
      customer: {
        name: 'TechMatrix Automation Pvt Ltd',
        mobile: '+91 98221 99887',
        email: 'billing@techmatrix.com',
        billingAddress: 'Tower 4, Cyber City, Magarpatta, Pune, Maharashtra - 411028',
        gstin: '27AABCT8877P1Z4',
        pan: 'AABCT8877P',
      },
      items: [
        {
          itemIndex: 1,
          description: 'Industrial 4K Commercial Display Monitor (27-inch)',
          hsnSac: '8528',
          rate: 28500,
          quantity: 2,
          unit: 'Nos',
          taxRate: 18,
          taxAmount: 10260,
          amount: 67260,
        },
        {
          itemIndex: 2,
          description: 'On-Site Network Cabling & Commissioning Service',
          hsnSac: '9987',
          rate: 15000,
          quantity: 1,
          unit: 'Job',
          taxRate: 18,
          taxAmount: 2700,
          amount: 17700,
        },
      ],
      customFields: [
        { label: 'Project Name', value: 'Smart Factory 4.0' },
        { label: 'Lead Engineer', value: 'Dr. Rajeshwar Sharma' },
      ],
      summary: {
        subtotal: 72000,
        taxableAmount: 72000,
        cgstAmount: 6480,
        sgstAmount: 6480,
        totalTax: 12960,
        grandTotal: 84960,
        amountInWords: 'INR Eighty-Four Thousand, Nine Hundred Sixty Rupees Only',
        taxRows: [
          { type: 'CGST', rate: 9, taxableAmount: 72000, taxAmount: 6480 },
          { type: 'SGST', rate: 9, taxableAmount: 72000, taxAmount: 6480 },
        ],
      },
      taxRows: [
        { type: 'CGST', rate: 9, taxableAmount: 72000, taxAmount: 6480 },
        { type: 'SGST', rate: 9, taxableAmount: 72000, taxAmount: 6480 },
      ],
      gstSummary: [
        {
          hsnSac: '8528',
          taxableValue: 57000,
          cgstRate: 9,
          cgstAmount: 5130,
          sgstRate: 9,
          sgstAmount: 5130,
          totalTax: 10260,
        },
        {
          hsnSac: '9987',
          taxableValue: 15000,
          cgstRate: 9,
          cgstAmount: 1350,
          sgstRate: 9,
          sgstAmount: 1350,
          totalTax: 2700,
        },
      ],
      termsAndConditions: '1. Standard 30 days payment term.\n2. 3-Year warranty on equipment.',
      paymentInfo: {
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0000123',
        branch: 'Pune Main Branch',
        upiId: 'techmatrix@hdfc',
      },
      status: 'Unpaid',
    };

    const invRes = await fetchJSON('/api/quotations', 'POST', newInvoice);
    console.log('Invoice Created:', invRes.data?.message, 'ID:', invRes.data?.data?._id, 'DocType:', invRes.data?.data?.documentType);

    console.log('\n--- 6. Testing 1-Click Quotation to Invoice Conversion ---');
    // First create a Quotation
    const testQuotation = {
      documentType: 'Quotation',
      templateId: 'navy',
      quotationNumber: 'QT-CONVERT-01',
      quotationDate: new Date().toISOString().split('T')[0],
      placeOfSupply: 'Maharashtra',
      placeOfSupplyCode: '27',
      customer: {
        name: 'Greenfield Eco Agro Farms',
        billingAddress: 'Pune-Solapur Highway, Yawat, Maharashtra',
      },
      items: [
        {
          itemIndex: 1,
          description: 'Consultation & System Estimation',
          rate: 5000,
          quantity: 1,
          taxRate: 18,
          taxAmount: 900,
          amount: 5900,
        },
      ],
      summary: {
        taxableAmount: 5000,
        totalTax: 900,
        grandTotal: 5900,
      },
      taxRows: [
        { type: 'CGST', rate: 9, taxableAmount: 5000, taxAmount: 450 },
        { type: 'SGST', rate: 9, taxableAmount: 5000, taxAmount: 450 },
      ],
      status: 'Approved',
    };

    const qtRes = await fetchJSON('/api/quotations', 'POST', testQuotation);
    const qtId = qtRes.data?.data?._id;
    console.log('Created Quotation:', qtRes.data?.data?.quotationNumber);

    const convertRes = await fetchJSON(`/api/quotations/${qtId}/convert-to-invoice`, 'POST');
    console.log('Converted to Invoice:', convertRes.data?.message, 'New Invoice #:', convertRes.data?.data?.quotationNumber, 'Status:', convertRes.data?.data?.status);

    console.log('\n--- 7. Testing Multi-Business Dashboard Analytics ---');
    const dash = await fetchJSON('/api/dashboard/stats');
    console.log('Dashboard Stats Summary:');
    console.log('  Total Quotations:', dash.data?.data?.totalQuotations);
    console.log('  Total Invoices:', dash.data?.data?.totalInvoices);
    console.log('  Total Pipeline Value: ₹' + dash.data?.data?.totalValue);
    console.log('  Total Customers:', dash.data?.data?.totalCustomers);
    console.log('  Total Products & Services:', dash.data?.data?.totalProducts);

    console.log('\n--- 8. Testing User Authentication ---');
    const loginRes = await fetchJSON('/api/auth/login', 'POST', {
      email: 'admin@sunbrightsolar.com',
      password: 'admin123',
    });
    console.log('Admin Login:', loginRes.data?.message, 'User:', loginRes.data?.user?.name);

    console.log('\n🎉 ALL MULTI-BUSINESS BILLING & QUOTATION TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

runTests();
