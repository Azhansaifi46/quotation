import mongoose from 'mongoose';
import Product from './models/Product.js';
import Customer from './models/Customer.js';
import Settings from './models/Settings.js';
import Quotation from './models/Quotation.js';
import User from './models/User.js';

export const seedInitialData = async () => {
  try {
    // 0. Seed Default Admin User if not exists
    let adminUser = await User.findOne({ email: 'admin@sunbrightsolar.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Sun Bright Administrator',
        email: 'admin@sunbrightsolar.com',
        password: 'admin123',
        phone: '+91 98765 43210',
        designation: 'Enterprise System Administrator',
        role: 'admin',
        isVerified: true,
      });
      console.log('✅ Default Admin user created: admin@sunbrightsolar.com (Password: admin123)');
    }

    // 1. Seed Business Profile / Settings if not exists
    const settingsCount = await Settings.countDocuments({ userId: adminUser._id });
    let currentSettings;
    if (settingsCount === 0) {
      currentSettings = await Settings.create({
        userId: adminUser._id,
        companyName: 'SUN BRIGHT ENTERPRISE',
        ownerName: 'Rajesh Sharma',
        businessCategory: 'Solar',
        tagline: 'QUOTATION, INVOICING & BILLING SOLUTIONS',
        companyAddress: 'Plot No. 42, Phase-II, Industrial Energy Park, Pune, Maharashtra - 411028',
        mobile: '+91 98765 43210',
        email: 'contact@sunbrightenterprise.com',
        website: 'www.sunbrightenterprise.com',
        gstin: '27AABCS1429B1Z8',
        pan: 'AABCS1429B',
        state: 'Maharashtra',
        stateCode: '27',
        bankName: 'State Bank of India',
        accountNumber: '4098765432198',
        ifscCode: 'SBIN0001429',
        branch: 'Industrial Park Branch, Pune',
        upiId: 'sunbrightenterprise@sbi',
        quotationPrefix: 'QT-',
        invoicePrefix: 'INV-',
        estimatePrefix: 'EST-',
        proformaPrefix: 'PI-',
        poPrefix: 'PO-',
        receiptPrefix: 'REC-',
        nextQuotationNumber: 1002,
        nextInvoiceNumber: 1001,
        nextEstimateNumber: 1001,
        defaultTemplate: 'navy',
        defaultCustomFields: [
          { label: 'Project Name / Reference', defaultValue: 'Turnkey Project' },
          { label: 'System Capacity / Model', defaultValue: '5 kW' },
        ],
        defaultTerms: `1. Validity: Quotation / Estimate valid for 15 days from the date of issue.
2. Payment Terms: 50% advance along with work order, 40% on material delivery, 10% after commissioning/delivery.
3. Delivery & Execution: Within 10-15 working days after receipt of advance.
4. Warranty: Standard manufacturer warranty & 1 Year comprehensive after-sales service.
5. Taxes: GST as applicable at the time of invoicing.`,
      });
      console.log('✅ Business Profile seeded successfully');
    } else {
      currentSettings = await Settings.findOne({ userId: adminUser._id });
    }

    // 2. Seed Multi-Industry Products & Services if not exists
    const productCount = await Product.countDocuments({ userId: adminUser._id });
    if (productCount === 0) {
      const defaultProducts = [
        // Solar
        {
          name: 'Mono PERC Solar Panels (545W Tier-1 Half-Cut)',
          type: 'Product',
          sku: 'SOL-PNL-545',
          description: 'High efficiency 545W Mono PERC Half-Cut photovoltaic solar modules with 25-year performance warranty.',
          hsnSac: '8419',
          rate: 15500,
          unit: 'Nos',
          gstRate: 12,
          category: 'Solar',
          stock: 120,
        },
        {
          name: '5kW On-Grid Solar Inverter (Dual MPPT, WiFi)',
          type: 'Product',
          sku: 'SOL-INV-5KW',
          description: '5kW Single/Three Phase Grid-Tied Solar Inverter with built-in DC switch, surge protection & cloud monitoring.',
          hsnSac: '8504',
          rate: 42000,
          unit: 'Nos',
          gstRate: 12,
          category: 'Solar',
          stock: 45,
        },
        {
          name: 'HDG Solar Mounting Structure (Module Mounting)',
          type: 'Product',
          sku: 'SOL-STR-HDG',
          description: 'Hot Dip Galvanized (80 Micron) elevated roof mounting structure designed for 150 km/h wind speed.',
          hsnSac: '7308',
          rate: 8500,
          unit: 'Set',
          gstRate: 18,
          category: 'Solar',
          stock: 60,
        },
        // Electronics / IT
        {
          name: 'Commercial Ultra-HD IPS Display Monitor (27-inch)',
          type: 'Product',
          sku: 'ELE-MON-27',
          description: '4K UHD 27-inch Professional IPS Display with USB-C 90W charging, HDMI 2.1 & height-adjustable stand.',
          hsnSac: '8528',
          rate: 28500,
          unit: 'Nos',
          gstRate: 18,
          category: 'Electronics',
          stock: 35,
        },
        {
          name: 'Network Server Rack 42U with Smart PDU & Cable Management',
          type: 'Product',
          sku: 'ELE-RCK-42U',
          description: 'Heavy duty 42U 19-inch Server Rack Enclosure with digital temperature sensor, smart PDU and glass door.',
          hsnSac: '8537',
          rate: 34000,
          unit: 'Nos',
          gstRate: 18,
          category: 'Electronics',
          stock: 15,
        },
        // Hardware / Electrical
        {
          name: 'Complete Distribution Board (ACDB / DCDB Dual String IP65)',
          type: 'Product',
          sku: 'ELC-DB-IP65',
          description: 'Weatherproof IP65 outdoor enclosure with Schneider SPD Type-II, MCB & fuse protection.',
          hsnSac: '8537',
          rate: 6500,
          unit: 'Set',
          gstRate: 18,
          category: 'Electrical',
          stock: 80,
        },
        {
          name: 'Copper Bonded Chemical Earthing Electrode with BFC Compound',
          type: 'Product',
          sku: 'HRD-EARTH-KIT',
          description: '3-Meter Pure Copper Bonded Earth Electrode (250 Micron) with 25kg carbon backfill ground enhancement compound.',
          hsnSac: '8535',
          rate: 3800,
          unit: 'Set',
          gstRate: 18,
          category: 'Hardware',
          stock: 150,
        },
        // Furniture
        {
          name: 'Executive Ergonomic High-Back Mesh Chair',
          type: 'Product',
          sku: 'FUR-CHR-EXEC',
          description: 'Breathable mesh high-back executive chair with 4D adjustable armrests, lumbar support, and tilt lock.',
          hsnSac: '9403',
          rate: 14500,
          unit: 'Nos',
          gstRate: 18,
          category: 'Furniture',
          stock: 50,
        },
        {
          name: 'Modular Conference Table with Wire Management (8-Seater)',
          type: 'Product',
          sku: 'FUR-TBL-CONF8',
          description: 'Pre-laminated teak finish modular boardroom conference table with integrated pop-up power boxes.',
          hsnSac: '9403',
          rate: 32000,
          unit: 'Nos',
          gstRate: 18,
          category: 'Furniture',
          stock: 12,
        },
        // Services
        {
          name: 'Turnkey Installation, Testing & Commissioning Service',
          type: 'Service',
          sku: 'SRV-INSTALL-TURNKEY',
          description: 'Complete on-site turnkey installation, cabling, termination, testing, and system commissioning by certified engineers.',
          hsnSac: '9987',
          rate: 18000,
          unit: 'Job',
          gstRate: 18,
          category: 'Services',
          stock: 999,
        },
        {
          name: 'Annual Maintenance Contract (AMC) & Performance Auditing',
          type: 'Service',
          sku: 'SRV-AMC-YEAR',
          description: 'Quarterly comprehensive preventive inspection, thermal drone imaging, cleaning, and breakdown support for 1 Year.',
          hsnSac: '9987',
          rate: 12000,
          unit: 'Job',
          gstRate: 18,
          category: 'Services',
          stock: 999,
        },
      ];

      await Product.insertMany(defaultProducts.map((p) => ({ ...p, userId: adminUser._id })));
      console.log('✅ Multi-industry products and services seeded successfully');
    }

    // 3. Seed Customers if not exists
    const customerCount = await Customer.countDocuments({ userId: adminUser._id });
    if (customerCount === 0) {
      const defaultCustomers = [
        {
          name: 'Greenfield Eco Agro Farms Pvt Ltd',
          mobile: '+91 98220 12345',
          email: 'purchase@greenfieldeco.com',
          billingAddress: 'Gate No. 108, Pune-Solapur Highway, Yawat, Dist. Pune, Maharashtra - 412214',
          gstin: '27AABCG1234F1Z5',
          pan: 'AABCG1234F',
          placeOfSupply: 'Maharashtra',
          placeOfSupplyCode: '27',
        },
        {
          name: 'Apex Precision Engineering Works',
          mobile: '+91 94231 78901',
          email: 'accounts@apexprecision.in',
          billingAddress: 'W-44, MIDC Industrial Area, Bhosari, Pune, Maharashtra - 411026',
          gstin: '27AABCA5678K1Z2',
          pan: 'AABCA5678K',
          placeOfSupply: 'Maharashtra',
          placeOfSupplyCode: '27',
        },
        {
          name: 'Sunlight Textile Mills Pvt Ltd',
          mobile: '+91 98250 67890',
          email: 'commercial@sunlighttextile.com',
          billingAddress: 'Plot 12, GIDC Industrial Estate, Sachin, Surat, Gujarat - 394230',
          gstin: '24AAACT9988P1Z3',
          pan: 'AAACT9988P',
          placeOfSupply: 'Gujarat',
          placeOfSupplyCode: '24',
        },
      ];

      await Customer.insertMany(defaultCustomers.map((c) => ({ ...c, userId: adminUser._id })));
      console.log('✅ Customers seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
};
