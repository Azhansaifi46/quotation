import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Receipt,
  FileEdit,
  Eye,
  Download,
  Save,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Users,
  CreditCard,
  QrCode,
  CheckCircle2,
  ArrowLeft,
  Share2,
  Sparkles,
} from 'lucide-react';
import { settingsAPI, quotationsAPI, customersAPI, productsAPI } from '../api/client';
import { calculateLineItem, calculateTaxRowAmount, autoSplitGST } from '../utils/taxCalculator';
import { exportQuotationToPDF } from '../utils/pdfExport';
import { formatINR, numberToWordsIndian } from '../utils/numberToWords';
import InvoicePreview from '../components/InvoicePreview';
import AddProductModal from '../components/AddProductModal';
import Toast from '../components/Toast';

const INDIAN_STATES = [
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' },
  { name: 'Bihar', code: '10' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Delhi', code: '07' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jammu and Kashmir', code: '01' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Odisha', code: '21' },
  { name: 'Punjab', code: '03' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Ladakh', code: '38' },
  { name: 'Puducherry', code: '34' },
];

export default function CreateInvoicePage({ onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const params = useParams();
  const editId = params.id;

  const [companySettings, setCompanySettings] = useState(null);
  const [customersList, setCustomersList] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Form State
  const [invoice, setInvoice] = useState({
    documentType: 'Invoice',
    templateId: 'navy',
    quotationNumber: '',
    quotationDate: new Date().toISOString().split('T')[0],
    paymentTerms: 'Due on Receipt',
    dueDate: new Date().toISOString().split('T')[0],
    poNumber: '',
    poDate: '',
    reverseCharge: false,
    eWayBill: '',
    placeOfSupply: 'Maharashtra',
    placeOfSupplyCode: '27',
    isInterState: false,
    shippingCharges: 0,
    packagingCharges: 0,
    roundOff: 0,
    customer: {
      id: '',
      name: '',
      mobile: '',
      email: '',
      billingAddress: '',
      shippingAddress: '',
      gstin: '',
      pan: '',
    },
    items: [
      {
        itemIndex: 1,
        description: '',
        hsnSac: '',
        rate: '',
        quantity: 1,
        unit: 'Nos',
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 0,
        taxableAmount: 0,
        taxRate: 18,
        taxAmount: '',
        amount: '',
        totalAmount: '',
        isManualOverride: false,
      },
    ],
    customFields: [],
    discount: {
      type: 'percentage',
      rate: 0,
      amount: 0,
    },
    termsAndConditions: '',
    paymentInfo: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branch: '',
      upiId: '',
      upiQrCode: '',
    },
    status: 'Unpaid',
    notes: '',
  });

  const [summary, setSummary] = useState({
    subtotal: 0,
    totalDiscount: 0,
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalTax: 0,
    shippingCharges: 0,
    packagingCharges: 0,
    roundOff: 0,
    grandTotal: 0,
    amountInWords: '',
  });

  // Calculate Due Date based on Payment Terms
  const calculateDueDateFromTerms = (terms, baseDate) => {
    const d = new Date(baseDate || new Date());
    if (terms === 'Net 7') d.setDate(d.getDate() + 7);
    else if (terms === 'Net 15') d.setDate(d.getDate() + 15);
    else if (terms === 'Net 30') d.setDate(d.getDate() + 30);
    else if (terms === 'Net 45') d.setDate(d.getDate() + 45);
    else if (terms === 'Net 60') d.setDate(d.getDate() + 60);
    return d.toISOString().split('T')[0];
  };

  // Load initial settings, next number, customers, products
  useEffect(() => {
    async function loadData() {
      try {
        const [setRes, custRes, prodRes] = await Promise.all([
          settingsAPI.get(),
          customersAPI.getAll(),
          productsAPI.getAll(),
        ]);

        if (setRes.data?.data) {
          const s = setRes.data.data;
          setCompanySettings(s);

          if (!editId) {
            // Fetch next invoice number
            const numRes = await settingsAPI.getNextNumber('Invoice');
            const nextNum = numRes.data?.data?.number || `INV-${new Date().getFullYear()}-1001`;

            setInvoice((prev) => ({
              ...prev,
              quotationNumber: nextNum,
              placeOfSupply: s.state || 'Maharashtra',
              placeOfSupplyCode: s.stateCode || '27',
              paymentInfo: {
                bankName: s.bankName || '',
                accountNumber: s.accountNumber || '',
                ifscCode: s.ifscCode || '',
                branch: s.branch || '',
                upiId: s.upiId || '',
                upiQrCode: s.upiQrCode || '',
              },
              termsAndConditions: s.defaultTerms || '1. Payment due within specified terms.\n2. Late payments subject to interest @ 18% p.a.',
            }));
          }
        }

        if (custRes.data?.data) setCustomersList(custRes.data.data);
        if (prodRes.data?.data) setProductsCatalog(prodRes.data.data);

        // If editing an existing document
        if (editId) {
          const docRes = await quotationsAPI.getById(editId);
          if (docRes.data?.data) {
            const doc = docRes.data.data;
            setInvoice({
              ...doc,
              paymentTerms: doc.paymentTerms || 'Due on Receipt',
              shippingCharges: doc.shippingCharges || 0,
              packagingCharges: doc.packagingCharges || 0,
              roundOff: doc.roundOff || 0,
            });
          }
        }
      } catch (err) {
        console.error('Error loading invoice data:', err);
      }
    }
    loadData();
  }, [editId]);

  // Recalculate Invoice Summary whenever items, discount, shipping, roundOff, or placeOfSupply change
  useEffect(() => {
    const isInterState = invoice.isInterState || (companySettings?.state && invoice.placeOfSupply && companySettings.state.toLowerCase() !== invoice.placeOfSupply.toLowerCase());

    let rawSubtotal = 0;
    let itemDiscountsTotal = 0;
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const calculatedItems = (invoice.items || []).map((it) => {
      const rate = parseFloat(it.rate) || 0;
      const qty = parseFloat(it.quantity) || 0;
      const gross = rate * qty;
      rawSubtotal += gross;

      let discAmt = parseFloat(it.discountAmount) || 0;
      const discPct = parseFloat(it.discountPercent) || 0;
      if (discPct > 0 && !it.discountAmount) {
        discAmt = (gross * discPct) / 100;
      }
      itemDiscountsTotal += discAmt;

      const taxable = Math.max(0, gross - discAmt);
      taxableTotal += taxable;

      const taxRate = parseFloat(it.taxRate) || 0;
      let taxAmt = (taxable * taxRate) / 100;
      if (it.isManualOverride && it.taxAmount !== undefined && it.taxAmount !== '') {
        taxAmt = parseFloat(it.taxAmount) || 0;
      }

      if (isInterState) {
        igstTotal += taxAmt;
      } else {
        cgstTotal += taxAmt / 2;
        sgstTotal += taxAmt / 2;
      }

      const lineTotal = taxable + taxAmt;
      return {
        ...it,
        grossAmount: gross,
        discountAmount: discAmt,
        taxableValue: taxable,
        taxableAmount: taxable,
        taxAmount: taxAmt,
        amount: lineTotal,
        totalAmount: lineTotal,
      };
    });

    // Invoice-level discount
    let extraDiscount = 0;
    if (invoice.discount?.type === 'percentage') {
      const pct = parseFloat(invoice.discount.rate) || 0;
      extraDiscount = (taxableTotal * pct) / 100;
    } else {
      extraDiscount = parseFloat(invoice.discount?.amount) || 0;
    }

    const netTaxable = Math.max(0, taxableTotal - extraDiscount);
    const totalTax = isInterState ? igstTotal : cgstTotal + sgstTotal;
    const shipping = parseFloat(invoice.shippingCharges) || 0;
    const packaging = parseFloat(invoice.packagingCharges) || 0;
    const roundOff = parseFloat(invoice.roundOff) || 0;

    const grandTotal = Math.max(0, Math.round((netTaxable + totalTax + shipping + packaging + roundOff) * 100) / 100);
    const amountInWords = grandTotal > 0 ? numberToWordsIndian(grandTotal) : 'Zero Rupees Only';

    setSummary({
      subtotal: Math.round(rawSubtotal * 100) / 100,
      totalDiscount: Math.round((itemDiscountsTotal + extraDiscount) * 100) / 100,
      taxableAmount: Math.round(netTaxable * 100) / 100,
      cgstAmount: Math.round(cgstTotal * 100) / 100,
      sgstAmount: Math.round(sgstTotal * 100) / 100,
      igstAmount: Math.round(igstTotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      shippingCharges: shipping,
      packagingCharges: packaging,
      roundOff: roundOff,
      grandTotal: grandTotal,
      amountInWords: amountInWords,
    });
  }, [
    invoice.items,
    invoice.discount,
    invoice.shippingCharges,
    invoice.packagingCharges,
    invoice.roundOff,
    invoice.placeOfSupply,
    invoice.isInterState,
    companySettings?.state,
  ]);

  // Customer Auto-fill
  const handleSelectCustomer = (cust) => {
    if (!cust) return;
    const isInter = companySettings?.state && cust.state && companySettings.state.toLowerCase() !== cust.state.toLowerCase();

    setInvoice((prev) => ({
      ...prev,
      customer: {
        id: cust._id || '',
        name: cust.name || '',
        mobile: cust.mobile || '',
        email: cust.email || '',
        billingAddress: cust.address || '',
        shippingAddress: cust.shippingAddress || cust.address || '',
        gstin: cust.gstin || '',
        pan: cust.pan || '',
      },
      placeOfSupply: cust.state || prev.placeOfSupply,
      placeOfSupplyCode: cust.stateCode || prev.placeOfSupplyCode,
      isInterState: isInter || prev.isInterState,
    }));
  };

  // Payment Terms Change
  const handleTermsChange = (newTerms) => {
    const newDueDate = calculateDueDateFromTerms(newTerms, invoice.quotationDate);
    setInvoice((prev) => ({
      ...prev,
      paymentTerms: newTerms,
      dueDate: newDueDate,
    }));
  };

  // Item management
  const handleItemChange = (idx, field, value) => {
    setInvoice((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };

      // Recompute line
      const line = calculateLineItem(items[idx], prev.isInterState);
      items[idx] = line;
      return { ...prev, items };
    });
  };

  const handleAddItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemIndex: prev.items.length + 1,
          description: '',
          hsnSac: '',
          rate: '',
          quantity: 1,
          unit: 'Nos',
          discountPercent: 0,
          discountAmount: 0,
          taxableValue: 0,
          taxableAmount: 0,
          taxRate: 18,
          taxAmount: '',
          amount: '',
          totalAmount: '',
          isManualOverride: false,
        },
      ],
    }));
  };

  const handleRemoveItem = (idx) => {
    if (invoice.items.length <= 1) {
      showToast('Invoice must have at least one line item', 'warning');
      return;
    }
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleAddProductFromCatalog = (prod) => {
    setInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemIndex: prev.items.length + 1,
          description: prod.name + (prod.description ? ` - ${prod.description}` : ''),
          hsnSac: prod.hsnSac || '',
          rate: prod.rate || 0,
          quantity: 1,
          unit: prod.unit || 'Nos',
          discountPercent: 0,
          discountAmount: 0,
          taxableValue: prod.rate || 0,
          taxableAmount: prod.rate || 0,
          taxRate: prod.gstRate || 18,
          taxAmount: ((prod.rate || 0) * (prod.gstRate || 18)) / 100,
          amount: (prod.rate || 0) * (1 + (prod.gstRate || 18) / 100),
          totalAmount: (prod.rate || 0) * (1 + (prod.gstRate || 18) / 100),
          isManualOverride: false,
        },
      ],
    }));
    setIsProductModalOpen(false);
    showToast(`Added "${prod.name}" to invoice!`);
  };

  // Save / Submit Invoice
  const handleSaveInvoice = async (targetStatus = null) => {
    if (!invoice.customer?.name?.trim()) {
      showToast('Please enter customer name', 'error');
      return;
    }
    if (!invoice.quotationNumber?.trim()) {
      showToast('Please enter invoice number', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...invoice,
        documentType: 'Invoice',
        status: targetStatus || invoice.status || 'Unpaid',
        summary,
        company: companySettings
          ? {
              name: companySettings.companyName,
              tagline: companySettings.tagline,
              address: companySettings.companyAddress,
              mobile: companySettings.mobile,
              email: companySettings.email,
              website: companySettings.website,
              gstin: companySettings.gstin,
              pan: companySettings.pan,
              state: companySettings.state,
              stateCode: companySettings.stateCode,
              logoUrl: companySettings.logoUrl,
              signatureUrl: companySettings.signatureUrl,
              authorizedSignatory: companySettings.authorizedSignatory || 'Authorized Signatory',
            }
          : undefined,
      };

      if (editId) {
        await quotationsAPI.update(editId, payload);
        showToast('Tax Invoice updated successfully!');
      } else {
        await quotationsAPI.create(payload);
        showToast('Tax Invoice created successfully!');
      }

      navigate('/invoices');
    } catch (err) {
      console.error('Error saving invoice:', err);
      showToast(err.response?.data?.message || 'Failed to save invoice', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Direct PDF Export
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      showToast('Generating Tax Invoice PDF...', 'info');
      await exportQuotationToPDF('invoice-preview-live', invoice.quotationNumber || 'Tax_Invoice');
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('PDF generation failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] pb-20">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="Back to Invoices"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {editId ? `Edit Invoice #${invoice.quotationNumber}` : 'Create Tax Invoice'}
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                GST Tax Invoice
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Full GST Compliance • E-Way & PO references • Scan-to-Pay UPI Integration
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Tab Toggle */}
          <div className="flex lg:hidden bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMobileTab('editor')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mobileTab === 'editor' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mobileTab === 'preview' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Preview
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveInvoice('Draft')}
            disabled={isSaving}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveInvoice('Unpaid')}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Finalize Invoice'}</span>
          </button>
        </div>
      </header>

      {/* Main Form & Live Preview Layout */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Editor */}
        <div className={`lg:col-span-6 space-y-6 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          {/* 1. Invoice Meta & Tax Configuration */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-600" />
                Invoice Identification & Terms
              </span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-600">Inter-State (IGST):</label>
                <input
                  type="checkbox"
                  checked={invoice.isInterState}
                  onChange={(e) => setInvoice({ ...invoice, isInterState: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoice.quotationNumber}
                  onChange={(e) => setInvoice({ ...invoice, quotationNumber: e.target.value })}
                  placeholder="INV-2026-1001"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-purple-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={invoice.quotationDate}
                  onChange={(e) => {
                    const d = e.target.value;
                    const due = calculateDueDateFromTerms(invoice.paymentTerms, d);
                    setInvoice({ ...invoice, quotationDate: d, dueDate: due });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Terms</label>
                <select
                  value={invoice.paymentTerms || 'Due on Receipt'}
                  onChange={(e) => handleTermsChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                >
                  <option value="Due on Receipt">Due on Receipt (Immediate)</option>
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 45">Net 45 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="Custom">Custom Date</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value, paymentTerms: 'Custom' })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">PO Reference # (Optional)</label>
                <input
                  type="text"
                  value={invoice.poNumber}
                  onChange={(e) => setInvoice({ ...invoice, poNumber: e.target.value })}
                  placeholder="e.g. PO-84920"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Place of Supply</label>
                <select
                  value={invoice.placeOfSupply}
                  onChange={(e) => {
                    const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                    const isInter = companySettings?.state && st && companySettings.state.toLowerCase() !== st.name.toLowerCase();
                    setInvoice({
                      ...invoice,
                      placeOfSupply: e.target.value,
                      placeOfSupplyCode: st ? st.code : '27',
                      isInterState: isInter,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">E-Way Bill Number (Optional)</label>
                <input
                  type="text"
                  value={invoice.eWayBill}
                  onChange={(e) => setInvoice({ ...invoice, eWayBill: e.target.value })}
                  placeholder="e.g. 281920394819"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-5">
                <span className="font-bold text-slate-700 text-[11px]">Reverse Charge Applicable (RCM):</span>
                <input
                  type="checkbox"
                  checked={invoice.reverseCharge}
                  onChange={(e) => setInvoice({ ...invoice, reverseCharge: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 2. Customer & Billing/Shipping Address */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                Customer & Addresses
              </span>

              {/* Quick Customer Select Dropdown */}
              {customersList.length > 0 && (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const c = customersList.find((cust) => cust._id === e.target.value);
                      if (c) handleSelectCustomer(c);
                    }}
                    defaultValue=""
                    className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-bold text-[11px] outline-none cursor-pointer"
                  >
                    <option value="" disabled>
                      ⚡ Auto-Fill From Saved Customer
                    </option>
                    {customersList.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.mobile ? `(${c.mobile})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Customer / Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={invoice.customer.name}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      customer: { ...invoice.customer, name: e.target.value },
                    })
                  }
                  placeholder="Client or Company Name"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile / Phone</label>
                <input
                  type="text"
                  value={invoice.customer.mobile}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      customer: { ...invoice.customer, mobile: e.target.value },
                    })
                  }
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={invoice.customer.email}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      customer: { ...invoice.customer, email: e.target.value },
                    })
                  }
                  placeholder="billing@client.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer GSTIN</label>
                <input
                  type="text"
                  value={invoice.customer.gstin}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      customer: { ...invoice.customer, gstin: e.target.value.toUpperCase() },
                    })
                  }
                  placeholder="27AABCS1429B1Z8"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">PAN Number</label>
                <input
                  type="text"
                  value={invoice.customer.pan}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      customer: { ...invoice.customer, pan: e.target.value.toUpperCase() },
                    })
                  }
                  placeholder="ABCDE1234F"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={invoice.customer.billingAddress}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      customer: { ...invoice.customer, billingAddress: e.target.value },
                    })
                  }
                  placeholder="Complete billing address with city & pin"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Shipping Address</label>
                  <button
                    type="button"
                    onClick={() =>
                      setInvoice({
                        ...invoice,
                        customer: {
                          ...invoice.customer,
                          shippingAddress: invoice.customer.billingAddress,
                        },
                      })
                    }
                    className="text-[10px] font-bold text-purple-600 hover:text-purple-700 underline"
                  >
                    Same as Billing
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={invoice.customer.shippingAddress}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      customer: { ...invoice.customer, shippingAddress: e.target.value },
                    })
                  }
                  placeholder="Delivery or shipping destination"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Line Items */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
                Line Items & Products ({invoice.items.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Catalog</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {invoice.items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2 relative group hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-500 text-[11px]">Item #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12 sm:col-span-8">
                      <input
                        type="text"
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="Product / Service Description"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-4">
                      <input
                        type="text"
                        value={it.hsnSac}
                        onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                        placeholder="HSN / SAC"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Quantity</label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Unit</label>
                      <input
                        type="text"
                        value={it.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        placeholder="Nos"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Rate (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={it.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Disc (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={it.discountAmount}
                        onChange={(e) => handleItemChange(idx, 'discountAmount', e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">GST%</label>
                      <select
                        value={it.taxRate}
                        onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-xl border border-slate-200 font-bold text-purple-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Total (₹)</label>
                      <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-mono font-black text-slate-900 text-right truncate">
                        {formatINR(it.amount || it.totalAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Extra Charges & Adjustments */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs block border-b border-slate-150 pb-2">
              Extra Charges & Adjustments
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Shipping / Freight (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={invoice.shippingCharges || ''}
                  onChange={(e) => setInvoice({ ...invoice, shippingCharges: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Packaging / Handling (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={invoice.packagingCharges || ''}
                  onChange={(e) => setInvoice({ ...invoice, packagingCharges: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Round Off (+/- ₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={invoice.roundOff || ''}
                  onChange={(e) => setInvoice({ ...invoice, roundOff: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 5. Payment Details & Notes */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-xs block border-b border-slate-150 pb-2">
              Payment Instructions & Terms
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={invoice.paymentInfo.bankName}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      paymentInfo: { ...invoice.paymentInfo, bankName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-medium text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">UPI ID</label>
                <input
                  type="text"
                  value={invoice.paymentInfo.upiId}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      paymentInfo: { ...invoice.paymentInfo, upiId: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-medium text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Terms & Conditions</label>
              <textarea
                rows={3}
                value={invoice.termsAndConditions}
                onChange={(e) => setInvoice({ ...invoice, termsAndConditions: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Tax Invoice Preview */}
        <div className={`lg:col-span-6 ${mobileTab === 'editor' ? 'hidden lg:block' : 'block'}`}>
          <div className="sticky top-20">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs mb-4 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                Live GST Tax Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-700">
                  Total: {formatINR(summary.grandTotal)}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-140px)] rounded-2xl border border-slate-200 bg-slate-100 p-2">
              <InvoicePreview
                invoiceData={{
                  ...invoice,
                  summary,
                  company: companySettings
                    ? {
                        name: companySettings.companyName,
                        tagline: companySettings.tagline,
                        address: companySettings.companyAddress,
                        mobile: companySettings.mobile,
                        email: companySettings.email,
                        website: companySettings.website,
                        gstin: companySettings.gstin,
                        pan: companySettings.pan,
                        state: companySettings.state,
                        stateCode: companySettings.stateCode,
                        logoUrl: companySettings.logoUrl,
                        signatureUrl: companySettings.signatureUrl,
                        authorizedSignatory: companySettings.authorizedSignatory,
                      }
                    : null,
                }}
                companyData={companySettings}
                isInterState={invoice.isInterState}
                previewId="invoice-preview-live"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal from Catalog */}
      <AddProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onAddProduct={handleAddProductFromCatalog}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
