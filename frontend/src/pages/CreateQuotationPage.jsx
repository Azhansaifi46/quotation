import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FileEdit, Eye, Download, Save, Plus } from 'lucide-react';
import Header from '../components/Header';
import CustomerDetailsCard from '../components/CustomerDetailsCard';
import QuotationDetailsCard from '../components/QuotationDetailsCard';
import ItemsTableCard from '../components/ItemsTableCard';
import CustomFieldsCard from '../components/CustomFieldsCard';
import TermsCard from '../components/TermsCard';
import BankDetailsCard from '../components/BankDetailsCard';
import QuotationPreview from '../components/QuotationPreview';
import AddProductModal from '../components/AddProductModal';
import Toast from '../components/Toast';

import { settingsAPI, quotationsAPI } from '../api/client';
import {
  calculateQuotationTotals,
  calculateTaxRowAmount,
  autoSplitGST,
} from '../utils/taxCalculator';
import { exportQuotationToPDF } from '../utils/pdfExport';
import { numberToWordsIndian } from '../utils/numberToWords';

export default function CreateQuotationPage({ onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const editId = params.id;
  const searchParams = new URLSearchParams(location.search);
  const initialType = searchParams.get('type') || 'Quotation';

  const [companySettings, setCompanySettings] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState(null);

  // Mobile active tab ('editor' | 'preview')
  const [mobileTab, setMobileTab] = useState('editor');

  // Form State
  const [quotation, setQuotation] = useState({
    documentType: initialType,
    templateId: 'navy',
    quotationNumber: '',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    placeOfSupply: 'Maharashtra',
    placeOfSupplyCode: '27',
    customer: {
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
        taxRate: 18,
        taxAmount: '',
        amount: '',
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
    status: initialType === 'Invoice' ? 'Unpaid' : 'Draft',
    notes: '',
  });

  // Dynamic Multiple Tax Rows State
  const [taxRows, setTaxRows] = useState([]);
  const [hasCustomTaxRows, setHasCustomTaxRows] = useState(false);

  const [summary, setSummary] = useState({
    subtotal: 0,
    totalDiscount: 0,
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalTax: 0,
    grandTotal: 0,
    amountInWords: '',
    taxRows: [],
  });

  const [gstSummary, setGstSummary] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Initial Settings or Existing Document for Editing
  useEffect(() => {
    async function loadInitialData() {
      try {
        const settingsRes = await settingsAPI.get();
        if (settingsRes.data?.data) {
          const s = settingsRes.data.data;
          setCompanySettings(s);

          if (!editId) {
            // New document defaults
            const numRes = await settingsAPI.getNextNumber(initialType);
            const defaultCustoms = s.defaultCustomFields?.map((f) => ({
              label: f.label,
              value: f.defaultValue,
            })) || [];

            setQuotation((prev) => ({
              ...prev,
              documentType: initialType,
              templateId: s.defaultTemplate || 'navy',
              quotationNumber:
                numRes.data?.documentNumber ||
                numRes.data?.quotationNumber ||
                `QT-${new Date().getFullYear()}-1001`,
              customFields: defaultCustoms,
              termsAndConditions: s.defaultTerms || '',
              paymentInfo: {
                bankName: s.bankName || '',
                accountNumber: s.accountNumber || '',
                ifscCode: s.ifscCode || '',
                branch: s.branch || '',
                upiId: s.upiId || '',
                upiQrCode: s.upiQrCode || '',
              },
            }));
          }
        }

        // If editing an existing document
        if (editId) {
          const qRes = await quotationsAPI.getById(editId);
          if (qRes.data?.data) {
            const q = qRes.data.data;
            setQuotation(q);

            if (q.taxRows && q.taxRows.length > 0) {
              setTaxRows(q.taxRows);
              setHasCustomTaxRows(true);
            } else if (q.summary?.taxRows && q.summary.taxRows.length > 0) {
              setTaxRows(q.summary.taxRows);
              setHasCustomTaxRows(true);
            }
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    }

    loadInitialData();
  }, [editId, initialType]);

  // Recalculate totals whenever items, placeOfSupply, or taxRows change
  useEffect(() => {
    const compStateCode = companySettings?.stateCode || '27';
    const placeCode = quotation.placeOfSupplyCode || '27';

    const customRows = hasCustomTaxRows ? taxRows : null;
    const computed = calculateQuotationTotals(
      quotation.items,
      compStateCode,
      placeCode,
      customRows,
      quotation.discount
    );
    const inWords = numberToWordsIndian(computed.grandTotal);

    if (!hasCustomTaxRows) {
      setTaxRows((previousRows) =>
        JSON.stringify(previousRows) === JSON.stringify(computed.taxRows)
          ? previousRows
          : computed.taxRows,
      );
    }

    setSummary({
      ...computed,
      amountInWords: inWords,
    });
    setGstSummary(computed.gstSummary);
  }, [
    quotation.items,
    quotation.placeOfSupplyCode,
    quotation.discount,
    companySettings,
    hasCustomTaxRows,
    taxRows,
  ]);

  // Handle Document Type change
  const handleDocumentTypeChange = async (newType) => {
    try {
      const numRes = await settingsAPI.getNextNumber(newType);
      const nextNum =
        numRes.data?.documentNumber ||
        numRes.data?.quotationNumber ||
        `${newType.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-1001`;

      setQuotation((prev) => ({
        ...prev,
        documentType: newType,
        quotationNumber: nextNum,
        status: newType === 'Invoice' ? 'Unpaid' : 'Draft',
      }));
      showToast(`Switched document type to ${newType}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Document fields
  const handleQuotationChange = (field, val) => {
    setQuotation((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  // Handle Customer fields
  const handleCustomerChange = (field, val) => {
    setQuotation((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: val,
      },
    }));
  };

  // Select customer from saved directory
  const handleSelectCustomer = (c) => {
    setQuotation((prev) => ({
      ...prev,
      customer: {
        id: c._id,
        name: c.name,
        mobile: c.mobile,
        email: c.email || '',
        billingAddress: c.billingAddress,
        shippingAddress: c.shippingAddress || c.billingAddress,
        gstin: c.gstin || '',
        pan: c.pan || '',
      },
      placeOfSupply: c.placeOfSupply || prev.placeOfSupply,
      placeOfSupplyCode: c.placeOfSupplyCode || prev.placeOfSupplyCode,
    }));
    showToast(`Loaded customer: ${c.name}`);
  };

  // Handle Payment info fields
  const handlePaymentChange = (path, val) => {
    const field = path.replace('paymentInfo.', '');
    setQuotation((prev) => ({
      ...prev,
      paymentInfo: {
        ...prev.paymentInfo,
        [field]: val,
      },
    }));
  };

  // Handle Items changes
  const handleUpdateItem = (index, field, value) => {
    setQuotation((prev) => {
      const newItems = [...prev.items];
      const target = { ...newItems[index] };

      target[field] = value;

      if (field === 'taxAmount' || field === 'amount') {
        target.isManualOverride = true;
      }

      if (
        field === 'rate' ||
        field === 'quantity' ||
        field === 'taxRate' ||
        field === 'discountPercent'
      ) {
        const rate = parseFloat(target.rate) || 0;
        const qty = parseFloat(target.quantity) || 0;
        const taxRate = parseFloat(target.taxRate) || 0;
        const discPercent = parseFloat(target.discountPercent) || 0;

        const gross = rate * qty;
        const discAmount = Math.round(((gross * discPercent) / 100) * 100) / 100;
        const taxable = Math.max(0, Math.round((gross - discAmount) * 100) / 100);
        const tax = Math.round(((taxable * taxRate) / 100) * 100) / 100;
        const amt = Math.round((taxable + tax) * 100) / 100;

        target.discountAmount = discAmount;
        target.taxAmount = tax;
        target.amount = amt;
        target.isManualOverride = false;
      }

      newItems[index] = target;
      return {
        ...prev,
        items: newItems,
      };
    });
  };

  // Add Item Row
  const handleAddItem = () => {
    setQuotation((prev) => ({
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
          taxRate: 18,
          taxAmount: '',
          amount: '',
          isManualOverride: false,
        },
      ],
    }));
  };

  // Add from product catalog
  const handleSelectProduct = (product) => {
    const rate = Number(product.rate) || 0;
    const qty = 1;
    const taxRate = Number(product.gstRate) || 18;
    const taxable = rate * qty;
    const tax = Math.round(((taxable * taxRate) / 100) * 100) / 100;
    const amt = Math.round((taxable + tax) * 100) / 100;

    const newItem = {
      itemIndex: quotation.items.length + 1,
      description: `${product.name}${product.description ? ' - ' + product.description : ''}`,
      hsnSac: product.hsnSac || '',
      rate: rate,
      quantity: qty,
      unit: product.unit || 'Nos',
      discountPercent: 0,
      discountAmount: 0,
      taxRate: taxRate,
      taxAmount: tax,
      amount: amt,
      isManualOverride: false,
    };

    setQuotation((prev) => {
      if (
        prev.items.length === 1 &&
        !prev.items[0].description &&
        (!prev.items[0].rate || prev.items[0].rate === '')
      ) {
        return { ...prev, items: [{ ...newItem, itemIndex: 1 }] };
      }
      return { ...prev, items: [...prev.items, newItem] };
    });

    showToast(`Added "${product.name}" to items`);
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    if (quotation.items.length <= 1) return;
    setQuotation((prev) => {
      const newItems = prev.items
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, itemIndex: idx + 1 }));
      return { ...prev, items: newItems };
    });
  };

  // Custom Business Fields Handlers
  const handleAddCustomField = (field) => {
    setQuotation((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), field],
    }));
  };

  const handleRemoveCustomField = (index) => {
    setQuotation((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, idx) => idx !== index),
    }));
  };

  // Dynamic Tax Row Handlers
  const handleAddTaxRow = () => {
    const compStateCode = companySettings?.stateCode || '27';
    const placeCode = quotation.placeOfSupplyCode || '27';
    const isInter = compStateCode !== placeCode;

    const currentTaxable = summary.taxableAmount || 0;
    const defaultRate = isInter ? 18 : 9;
    const defaultAmount = calculateTaxRowAmount(currentTaxable, defaultRate);

    const newRow = {
      id: `tax_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: isInter ? 'IGST' : 'CGST',
      rate: defaultRate,
      taxableAmount: currentTaxable,
      taxAmount: defaultAmount,
    };

    setTaxRows((prev) => [...prev, newRow]);
    setHasCustomTaxRows(true);
    showToast(`Added new ${newRow.type} tax row`);
  };

  // Auto Split GST Mode (e.g. 18% -> CGST 9% + SGST 9%)
  const handleAutoSplitGST = () => {
    const compStateCode = companySettings?.stateCode || '27';
    const placeCode = quotation.placeOfSupplyCode || '27';
    const isInter = compStateCode !== placeCode;
    const currentTaxable = summary.taxableAmount || 0;

    const splitted = autoSplitGST(18, isInter).map((r) => ({
      ...r,
      taxableAmount: currentTaxable,
      taxAmount: calculateTaxRowAmount(currentTaxable, r.rate),
    }));

    setTaxRows(splitted);
    setHasCustomTaxRows(true);
    showToast('Auto-split GST applied (CGST 9% + SGST 9%)');
  };

  const handleUpdateTaxRow = (index, field, value) => {
    setTaxRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };
      row[field] = value;

      if (field === 'rate' || field === 'taxableAmount') {
        const r = parseFloat(row.rate) || 0;
        const t =
          parseFloat(
            row.taxableAmount !== undefined && row.taxableAmount !== ''
              ? row.taxableAmount
              : summary.taxableAmount
          ) || 0;
        row.taxAmount = calculateTaxRowAmount(t, r);
      }

      updated[index] = row;
      return updated;
    });
    setHasCustomTaxRows(true);
  };

  const handleRemoveTaxRow = (index) => {
    setTaxRows((prev) => prev.filter((_, idx) => idx !== index));
    setHasCustomTaxRows(true);
  };

  // Save Document to MongoDB
  const handleSave = async () => {
    if (!quotation.quotationNumber?.trim()) {
      showToast(`${quotation.documentType || 'Document'} Number is required`, 'error');
      return;
    }
    if (!quotation.customer?.name?.trim()) {
      showToast('Customer Name is required', 'error');
      return;
    }
    if (!quotation.customer?.billingAddress?.trim()) {
      showToast('Customer Billing Address is required', 'error');
      return;
    }

    try {
      setIsSaving(true);

      const compStateCode = companySettings?.stateCode || '27';
      const placeCode = quotation.placeOfSupplyCode || '27';
      const isInter = compStateCode !== placeCode;

      const payload = {
        ...quotation,
        isInterState: isInter,
        taxRows: taxRows,
        company: {
          name: companySettings?.companyName || 'My Business Enterprise',
          ownerName: companySettings?.ownerName || '',
          businessCategory: companySettings?.businessCategory || 'General',
          tagline: companySettings?.tagline || '',
          address: companySettings?.companyAddress || '',
          mobile: companySettings?.mobile || '',
          email: companySettings?.email || '',
          website: companySettings?.website || '',
          gstin: companySettings?.gstin || '',
          pan: companySettings?.pan || '',
          state: companySettings?.state || 'Maharashtra',
          stateCode: compStateCode,
          logoUrl: companySettings?.logoUrl || '',
          signatureUrl: companySettings?.signature || '',
          authorizedSignatory:
            companySettings?.authorizedSignatory || 'Authorized Signatory',
        },
        summary: {
          ...summary,
          taxRows: taxRows,
        },
        gstSummary: gstSummary,
      };

      if (editId) {
        await quotationsAPI.update(editId, payload);
        showToast(`${quotation.documentType || 'Document'} updated successfully!`);
      } else {
        const res = await quotationsAPI.create(payload);
        showToast(`${quotation.documentType || 'Document'} saved to database!`);
        if (res.data?.data?._id) {
          if (quotation.documentType === 'Invoice') {
            navigate('/invoices');
          } else {
            navigate('/quotations');
          }
        }
      }
    } catch (err) {
      console.error('Error saving document:', err);
      showToast(err.response?.data?.message || 'Failed to save document', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      showToast(`Generating professional ${quotation.documentType} PDF...`, 'info');
      await exportQuotationToPDF(
        'quotation-preview-a4',
        quotation.quotationNumber || quotation.documentType || 'Document'
      );
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('PDF export failed, please try again', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Reset to New Document
  const handleNewDocument = async () => {
    if (window.confirm('Start a new document? Unsaved changes will be cleared.')) {
      try {
        const numRes = await settingsAPI.getNextNumber(quotation.documentType || 'Quotation');
        const nextNum =
          numRes.data?.documentNumber ||
          numRes.data?.quotationNumber ||
          `QT-${new Date().getFullYear()}-1001`;

        setQuotation({
          documentType: quotation.documentType || 'Quotation',
          templateId: companySettings?.defaultTemplate || 'navy',
          quotationNumber: nextNum,
          quotationDate: new Date().toISOString().split('T')[0],
          validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          placeOfSupply: 'Maharashtra',
          placeOfSupplyCode: '27',
          customer: {
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
              taxRate: 18,
              taxAmount: '',
              amount: '',
              isManualOverride: false,
            },
          ],
          customFields: companySettings?.defaultCustomFields || [],
          discount: { type: 'percentage', rate: 0, amount: 0 },
          termsAndConditions: companySettings?.defaultTerms || '',
          paymentInfo: {
            bankName: companySettings?.bankName || '',
            accountNumber: companySettings?.accountNumber || '',
            ifscCode: companySettings?.ifscCode || '',
            branch: companySettings?.branch || '',
            upiId: companySettings?.upiId || '',
            upiQrCode: companySettings?.upiQrCode || '',
          },
          status: quotation.documentType === 'Invoice' ? 'Unpaid' : 'Draft',
          notes: '',
        });

        setHasCustomTaxRows(false);
        setTaxRows([]);

        if (editId) {
          navigate('/create');
        }

        showToast('New document workspace ready');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handlePreviewClick = () => {
    if (window.innerWidth < 1280) {
      setMobileTab('preview');
    }
    const previewEl = document.getElementById('quotation-preview-a4');
    if (previewEl) {
      previewEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isInterState =
    (companySettings?.stateCode || '27') !== (quotation.placeOfSupplyCode || '27');

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] pb-20 xl:pb-6">
      {/* Top Header */}
      <Header
        onSave={handleSave}
        onDownloadPDF={handleDownloadPDF}
        onNewQuotation={handleNewDocument}
        onPreviewClick={handlePreviewClick}
        isSaving={isSaving}
        isExporting={isExporting}
        onToggleMobileSidebar={onToggleMobileSidebar}
      />

      {/* Mobile Tab Switcher */}
      <div className="xl:hidden px-4 pt-3">
        <div className="flex bg-slate-200/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              mobileTab === 'editor'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Editor Form</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              mobileTab === 'preview'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Live A4 Preview</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 p-3 sm:p-6 md:p-8 max-w-[1700px] w-full mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* Left Column: Editor Form */}
          <div
            className={`xl:col-span-6 space-y-6 ${
              mobileTab === 'editor' ? 'block' : 'hidden xl:block'
            }`}
          >
            {/* Top row: Customer Details + Quotation / Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomerDetailsCard
                customer={quotation.customer}
                onChange={handleCustomerChange}
                onSelectCustomer={handleSelectCustomer}
              />

              <QuotationDetailsCard
                documentType={quotation.documentType}
                templateId={quotation.templateId}
                quotationNumber={quotation.quotationNumber}
                quotationDate={quotation.quotationDate}
                validUntil={quotation.validUntil}
                dueDate={quotation.dueDate}
                placeOfSupply={quotation.placeOfSupply}
                placeOfSupplyCode={quotation.placeOfSupplyCode}
                onChange={handleQuotationChange}
                onDocumentTypeChange={handleDocumentTypeChange}
              />
            </div>

            {/* Custom Business Fields Card */}
            <CustomFieldsCard
              customFields={quotation.customFields}
              onChange={(fields) => handleQuotationChange('customFields', fields)}
              onAddField={handleAddCustomField}
              onRemoveField={handleRemoveCustomField}
            />

            {/* Items Table Card */}
            <ItemsTableCard
              items={quotation.items}
              summary={summary}
              taxRows={taxRows}
              discount={quotation.discount}
              onAddItem={handleAddItem}
              onOpenProductModal={() => setIsProductModalOpen(true)}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
              onAddTaxRow={handleAddTaxRow}
              onAutoSplitGST={handleAutoSplitGST}
              onUpdateTaxRow={handleUpdateTaxRow}
              onRemoveTaxRow={handleRemoveTaxRow}
              onUpdateDiscount={(disc) => handleQuotationChange('discount', disc)}
              isInterState={isInterState}
            />

            {/* Terms & Conditions + Bank Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <TermsCard
                terms={quotation.termsAndConditions}
                onChange={handleQuotationChange}
              />

              <BankDetailsCard
                paymentInfo={quotation.paymentInfo}
                grandTotal={summary.grandTotal}
                companyName={companySettings?.companyName || 'Business'}
                onChange={handlePaymentChange}
              />
            </div>
          </div>

          {/* Right Column: Live A4 Quotation / Billing Preview */}
          <div
            className={`xl:col-span-6 xl:sticky xl:top-20 ${
              mobileTab === 'preview' ? 'block' : 'hidden xl:block'
            }`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Live {quotation.documentType} Preview
              </span>
              <span className="text-[11px] text-slate-500 font-medium bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                Template: <strong className="text-purple-700 uppercase">{quotation.templateId}</strong>
              </span>
            </div>

            <div className="overflow-x-auto pb-4">
              <QuotationPreview
                quotationData={{
                  ...quotation,
                  summary,
                  taxRows,
                  gstSummary,
                }}
                companyData={companySettings}
                selectedTemplate={quotation.templateId}
                isInterState={isInterState}
                previewId="quotation-preview-a4"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Floating Bar on Mobile */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setMobileTab(mobileTab === 'editor' ? 'preview' : 'editor')}
          className="flex-1 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold"
        >
          {mobileTab === 'editor' ? 'Show Live Preview' : 'Back to Edit Form'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>PDF</span>
        </button>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelectProduct={handleSelectProduct}
      />

      {/* Toast Alert */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
