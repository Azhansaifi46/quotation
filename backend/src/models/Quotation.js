import mongoose from 'mongoose';

const documentItemSchema = new mongoose.Schema(
  {
    itemIndex: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
      default: '',
    },
    hsnSac: {
      type: String,
      default: '',
    },
    rate: {
      type: Number,
      required: true,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    unit: {
      type: String,
      default: 'Nos',
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    taxableValue: {
      type: Number,
      default: 0,
    },
    taxableAmount: {
      type: Number,
      default: 0,
    },
    taxRate: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    isManualOverride: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const gstSummaryItemSchema = new mongoose.Schema(
  {
    hsnSac: {
      type: String,
      default: '',
    },
    taxableValue: {
      type: Number,
      default: 0,
    },
    cgstRate: {
      type: Number,
      default: 0,
    },
    cgstAmount: {
      type: Number,
      default: 0,
    },
    sgstRate: {
      type: Number,
      default: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
    },
    igstRate: {
      type: Number,
      default: 0,
    },
    igstAmount: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const taxRowSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'CGST',
    },
    rate: {
      type: Number,
      default: 0,
    },
    taxableAmount: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const customFieldSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const paymentRecordSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      default: () => `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    receiptNumber: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentDate: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split('T')[0],
    },
    paymentMode: {
      type: String,
      enum: ['UPI', 'Bank Transfer', 'NEFT', 'RTGS', 'IMPS', 'Cash', 'Cheque', 'Credit Card', 'Debit Card', 'Online', 'Other'],
      default: 'UPI',
    },
    referenceNo: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: [
        'Quotation',
        'Invoice',
        'Estimate',
        'Proforma Invoice',
        'Purchase Order',
        'Receipt',
      ],
      default: 'Quotation',
      index: true,
    },
    templateId: {
      type: String,
      enum: ['navy', 'corporate', 'minimal', 'emerald'],
      default: 'navy',
    },
    quotationNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    documentDate: {
      type: String,
      default: '',
    },
    quotationDate: {
      type: String,
      required: true,
    },
    validUntil: {
      type: String,
      default: '',
    },
    dueDate: {
      type: String,
      default: '',
    },
    paymentTerms: {
      type: String,
      default: 'Due on Receipt',
    },
    poNumber: {
      type: String,
      default: '',
    },
    poDate: {
      type: String,
      default: '',
    },
    reverseCharge: {
      type: Boolean,
      default: false,
    },
    eWayBill: {
      type: String,
      default: '',
    },
    placeOfSupply: {
      type: String,
      required: true,
      default: 'Maharashtra',
    },
    placeOfSupplyCode: {
      type: String,
      default: '27',
    },
    isInterState: {
      type: Boolean,
      default: false,
    },
    // Customer snapshot
    customer: {
      id: {
        type: String,
        default: '',
      },
      name: {
        type: String,
        required: true,
        default: '',
      },
      mobile: {
        type: String,
        default: '',
      },
      email: {
        type: String,
        default: '',
      },
      billingAddress: {
        type: String,
        required: true,
        default: '',
      },
      shippingAddress: {
        type: String,
        default: '',
      },
      gstin: {
        type: String,
        default: '',
      },
      pan: {
        type: String,
        default: '',
      },
    },
    // Company snapshot
    company: {
      name: {
        type: String,
        default: 'Sun Bright Enterprise',
      },
      ownerName: {
        type: String,
        default: '',
      },
      businessCategory: {
        type: String,
        default: 'General',
      },
      tagline: {
        type: String,
        default: '',
      },
      address: {
        type: String,
        default: '',
      },
      mobile: {
        type: String,
        default: '',
      },
      email: {
        type: String,
        default: '',
      },
      website: {
        type: String,
        default: '',
      },
      gstin: {
        type: String,
        default: '',
      },
      pan: {
        type: String,
        default: '',
      },
      state: {
        type: String,
        default: 'Maharashtra',
      },
      stateCode: {
        type: String,
        default: '27',
      },
      logoUrl: {
        type: String,
        default: '',
      },
      signatureUrl: {
        type: String,
        default: '',
      },
      authorizedSignatory: {
        type: String,
        default: 'Authorized Signatory',
      },
    },
    items: [documentItemSchema],
    // Dynamic Custom Business Fields
    customFields: [customFieldSchema],
    // Discount info
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage',
      },
      rate: {
        type: Number,
        default: 0,
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
    // Summary
    summary: {
      subtotal: {
        type: Number,
        default: 0,
      },
      totalDiscount: {
        type: Number,
        default: 0,
      },
      taxableAmount: {
        type: Number,
        required: true,
        default: 0,
      },
      cgstAmount: {
        type: Number,
        default: 0,
      },
      sgstAmount: {
        type: Number,
        default: 0,
      },
      igstAmount: {
        type: Number,
        default: 0,
      },
      totalTax: {
        type: Number,
        required: true,
        default: 0,
      },
      grandTotal: {
        type: Number,
        required: true,
        default: 0,
      },
      shippingCharges: {
        type: Number,
        default: 0,
      },
      packagingCharges: {
        type: Number,
        default: 0,
      },
      roundOff: {
        type: Number,
        default: 0,
      },
      amountInWords: {
        type: String,
        default: '',
      },
      taxRows: [taxRowSchema],
    },
    taxRows: [taxRowSchema],
    gstSummary: [gstSummaryItemSchema],
    // Shipping & round off adjustments (top-level aliases)
    shippingCharges: {
      type: Number,
      default: 0,
    },
    packagingCharges: {
      type: Number,
      default: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    // Payment ledger & tracking
    payments: [paymentRecordSchema],
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    termsAndConditions: {
      type: String,
      default: '',
    },
    paymentInfo: {
      bankName: {
        type: String,
        default: '',
      },
      accountNumber: {
        type: String,
        default: '',
      },
      ifscCode: {
        type: String,
        default: '',
      },
      branch: {
        type: String,
        default: '',
      },
      upiId: {
        type: String,
        default: '',
      },
      upiQrCode: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Approved', 'Paid', 'Unpaid', 'Partial', 'Overdue', 'Rejected', 'Expired', 'Cancelled'],
      default: 'Draft',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Quotation', quotationSchema);
