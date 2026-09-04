import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      default: 'My Business Enterprise',
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      default: 'Business Owner',
    },
    businessCategory: {
      type: String,
      enum: [
        'Solar',
        'Electronics',
        'Electrical',
        'Hardware',
        'Furniture',
        'Construction',
        'Automobile',
        'Mobile & Computer',
        'Clothing',
        'Wholesale',
        'Retail',
        'Services',
        'Custom',
      ],
      default: 'Services',
    },
    tagline: {
      type: String,
      default: 'Professional Quotations & Invoicing Solutions',
    },
    companyAddress: {
      type: String,
      default: 'Industrial Area, Phase-II, Pune, Maharashtra - 411028',
    },
    mobile: {
      type: String,
      default: '+91 98765 43210',
    },
    email: {
      type: String,
      default: 'contact@mybusiness.com',
    },
    website: {
      type: String,
      default: 'www.mybusiness.com',
    },
    gstin: {
      type: String,
      default: '27AABCS1429B1Z8',
    },
    pan: {
      type: String,
      default: 'AABCS1429B',
    },
    state: {
      type: String,
      default: 'Maharashtra',
    },
    stateCode: {
      type: String,
      default: '27',
    },
    bankName: {
      type: String,
      default: 'State Bank of India',
    },
    accountNumber: {
      type: String,
      default: '4098765432198',
    },
    ifscCode: {
      type: String,
      default: 'SBIN0001429',
    },
    branch: {
      type: String,
      default: 'Main Industrial Branch',
    },
    upiId: {
      type: String,
      default: 'enterprise@sbi',
    },
    upiQrCode: {
      type: String,
      default: '',
    },
    signature: {
      type: String,
      default: '',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    authorizedSignatory: {
      type: String,
      default: 'Authorized Signatory',
    },
    defaultTemplate: {
      type: String,
      enum: ['navy', 'corporate', 'minimal', 'emerald'],
      default: 'navy',
    },
    defaultTerms: {
      type: String,
      default: `1. Validity: Quotation / Estimate valid for 15 days from the date of issue.
2. Payment Terms: 50% advance along with order confirmation, 50% upon delivery/completion.
3. Delivery / Service: Standard delivery within 7-14 business days from confirmation.
4. Warranty / Support: Standard manufacturer warranty & after-sales service as per company policy.
5. Taxes: GST as applicable at the time of invoicing.`,
    },
    // Document Prefixes
    quotationPrefix: {
      type: String,
      default: 'QT-',
    },
    invoicePrefix: {
      type: String,
      default: 'INV-',
    },
    estimatePrefix: {
      type: String,
      default: 'EST-',
    },
    proformaPrefix: {
      type: String,
      default: 'PI-',
    },
    poPrefix: {
      type: String,
      default: 'PO-',
    },
    receiptPrefix: {
      type: String,
      default: 'REC-',
    },
    nextQuotationNumber: {
      type: Number,
      default: 1001,
    },
    nextInvoiceNumber: {
      type: Number,
      default: 1001,
    },
    nextEstimateNumber: {
      type: Number,
      default: 1001,
    },
    nextProformaNumber: {
      type: Number,
      default: 1001,
    },
    nextPoNumber: {
      type: Number,
      default: 1001,
    },
    nextReceiptNumber: {
      type: Number,
      default: 1001,
    },
    // Configurable business custom fields
    defaultCustomFields: {
      type: [
        {
          label: String,
          defaultValue: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
