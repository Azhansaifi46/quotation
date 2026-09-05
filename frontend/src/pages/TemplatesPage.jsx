import React, { useState, useEffect } from 'react';
import {
  LayoutTemplate,
  Check,
  Eye,
  Menu,
  Sparkles,
  ArrowRight,
  Download,
} from 'lucide-react';
import { settingsAPI } from '../api/client';
import QuotationPreview from '../components/QuotationPreview';
import Toast from '../components/Toast';

export default function TemplatesPage({ onToggleMobileSidebar }) {
  const [settings, setSettings] = useState(null);
  const [selectedDefault, setSelectedDefault] = useState('navy');
  const [previewTemplate, setPreviewTemplate] = useState('navy');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      if (res.data?.data) {
        setSettings(res.data.data);
        setSelectedDefault(res.data.data.defaultTemplate || 'navy');
        setPreviewTemplate(res.data.data.defaultTemplate || 'navy');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetDefault = async (templateId) => {
    try {
      await settingsAPI.update({ defaultTemplate: templateId });
      setSelectedDefault(templateId);
      setPreviewTemplate(templateId);
      showToast(`Default template updated to ${templateId.toUpperCase()}`);
    } catch (e) {
      showToast('Failed to update default template', 'error');
    }
  };

  const templateCards = [
    {
      id: 'navy',
      name: 'Navy Executive',
      description: 'Signature executive dark navy header with purple accents, QR code, and barcode.',
      color: 'bg-slate-900 border-purple-500',
      badge: 'Most Popular',
    },
    {
      id: 'corporate',
      name: 'Modern Corporate',
      description: 'Sleek slate & indigo corporate style with boxed totals and modern table styling.',
      color: 'bg-indigo-900 border-indigo-500',
      badge: 'Corporate',
    },
    {
      id: 'minimal',
      name: 'Minimalist Clean',
      description: 'Clean monochrome high-contrast layout, perfect for wholesale, retail, legal, and trade.',
      color: 'bg-neutral-800 border-black',
      badge: 'Clean B&W',
    },
    {
      id: 'emerald',
      name: 'Emerald Tech & Services',
      description: 'Vibrant modern emerald & teal theme with geometric banners for services and modern tech.',
      color: 'bg-emerald-900 border-emerald-500',
      badge: 'Modern',
    },
  ];

  // Sample mock document for live visual template preview
  const sampleDoc = {
    documentType: 'Quotation',
    templateId: previewTemplate,
    quotationNumber: 'QT-2026-DEMO',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    placeOfSupply: 'Maharashtra',
    placeOfSupplyCode: '27',
    customer: {
      name: 'Apex Precision Engineering Works',
      mobile: '+91 94231 78901',
      email: 'contact@apexprecision.in',
      billingAddress: 'W-44, MIDC Industrial Area, Bhosari, Pune, Maharashtra - 411026',
      gstin: '27AABCA5678K1Z2',
    },
    items: [
      {
        itemIndex: 1,
        description: 'Complete Turnkey Commercial Installation & Commissioning Kit',
        hsnSac: '8419',
        rate: 85000,
        quantity: 1,
        unit: 'Set',
        taxableValue: 85000,
        taxableAmount: 85000,
        taxRate: 18,
        taxAmount: 15300,
        amount: 100300,
        totalAmount: 100300,
      },
      {
        itemIndex: 2,
        description: 'High-Performance Annual Maintenance & Remote Monitoring Support',
        hsnSac: '9987',
        rate: 15000,
        quantity: 1,
        unit: 'Job',
        taxableValue: 15000,
        taxableAmount: 15000,
        taxRate: 18,
        taxAmount: 2700,
        amount: 17700,
        totalAmount: 17700,
      },
    ],
    customFields: [
      { label: 'Project Reference', value: 'Phase-I Industrial Expansion' },
      { label: 'Estimated Timeline', value: '10 Business Days' },
    ],
    summary: {
      subtotal: 100000,
      taxableAmount: 100000,
      cgstAmount: 9000,
      sgstAmount: 9000,
      totalTax: 18000,
      grandTotal: 118000,
      amountInWords: 'INR One Lakh, Eighteen Thousand Rupees Only',
    },
    taxRows: [
      { type: 'CGST', rate: 9, taxableAmount: 100000, taxAmount: 9000 },
      { type: 'SGST', rate: 9, taxableAmount: 100000, taxAmount: 9000 },
    ],
    gstSummary: [
      {
        hsnSac: '8419',
        taxableValue: 85000,
        cgstRate: 9,
        cgstAmount: 7650,
        sgstRate: 9,
        sgstAmount: 7650,
        totalTax: 15300,
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
    termsAndConditions: '1. Standard 15-day validity.\n2. 50% advance with work order.',
    paymentInfo: {
      bankName: settings?.bankName || 'State Bank of India',
      accountNumber: settings?.accountNumber || '4098765432198',
      ifscCode: settings?.ifscCode || 'SBIN0001429',
      branch: 'Industrial Area Branch',
      upiId: settings?.upiId || 'enterprise@sbi',
    },
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Document Templates Gallery
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Select and preview professional quotation & billing A4 templates
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-8 max-w-[1700px] w-full mx-auto space-y-8">
        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {templateCards.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                previewTemplate === t.id
                  ? 'border-purple-600 shadow-md shadow-purple-600/10 ring-2 ring-purple-500/20'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {t.badge}
                  </span>
                  {selectedDefault === t.id && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-3 h-3" />
                      <span>Default</span>
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  {t.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {t.description}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(t.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    previewTemplate === t.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetDefault(t.id)}
                  disabled={selectedDefault === t.id}
                  className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold disabled:opacity-40 transition-all"
                >
                  Set Default
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Interactive A4 Template Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Live Interactive Preview</span>
              </h2>
              <p className="text-xs text-slate-500">
                Displaying: <strong className="text-purple-700 capitalize">{previewTemplate}</strong> Template
              </p>
            </div>
          </div>

          <div className="bg-slate-200/50 p-4 sm:p-8 rounded-3xl border border-slate-300/80 overflow-x-auto flex justify-center">
            <QuotationPreview
              quotationData={sampleDoc}
              companyData={settings}
              selectedTemplate={previewTemplate}
              isInterState={false}
              previewId="template-live-preview"
            />
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
