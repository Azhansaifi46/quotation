import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Save,
  QrCode,
  Landmark,
  FileText,
  Menu,
  Sliders,
  Plus,
  Trash2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  PenTool,
  Palette,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { settingsAPI } from '../api/client';
import { INDIAN_STATES } from '../utils/indianStates';
import Toast from '../components/Toast';

export default function SettingsPage({ onToggleMobileSidebar }) {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const qrInputRef = useRef(null);

  const [settings, setSettings] = useState({
    companyName: '',
    ownerName: '',
    businessCategory: 'Services',
    tagline: '',
    companyAddress: '',
    mobile: '',
    email: '',
    website: '',
    gstin: '',
    pan: '',
    state: 'Maharashtra',
    stateCode: '27',
    logoUrl: '',
    signature: '',
    authorizedSignatory: 'Authorized Signatory',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    upiId: '',
    upiQrCode: '',
    defaultTemplate: 'navy',
    defaultTerms: '',
    quotationPrefix: 'QT-',
    invoicePrefix: 'INV-',
    estimatePrefix: 'EST-',
    proformaPrefix: 'PI-',
    poPrefix: 'PO-',
    receiptPrefix: 'REC-',
    defaultCustomFields: [],
  });

  const businessCategories = [
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
  ];

  const templatesList = [
    {
      id: 'navy',
      name: 'Navy Blue Classic',
      desc: 'Dark navy banner, high-contrast typography, ideal for engineering & tech',
      badge: 'Popular',
      color: 'bg-slate-900 border-purple-500',
    },
    {
      id: 'corporate',
      name: 'Corporate Indigo',
      desc: 'Clean corporate layout, top colored accent, sleek table styling',
      badge: 'Professional',
      color: 'bg-indigo-700 border-indigo-500',
    },
    {
      id: 'minimal',
      name: 'Minimalist Monochrome',
      desc: 'Black & white ultra clean layout, fast printing, compact data rows',
      badge: 'Ink-Saver',
      color: 'bg-neutral-900 border-neutral-400',
    },
    {
      id: 'emerald',
      name: 'Emerald Executive',
      desc: 'Teal & green gradient headers, modern rounded cards, premium billing',
      badge: 'Executive',
      color: 'bg-emerald-800 border-emerald-500',
    },
  ];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsAPI.get();
      if (res.data?.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  // Image upload handler for Logo, Signature, QR
  const handleFileUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 3MB for base64 storage)
    if (file.size > 3 * 1024 * 1024) {
      showToast('Image file size should be less than 3MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      handleChange(field, uploadEvent.target.result);
      showToast(`${field === 'logoUrl' ? 'Logo' : field === 'signature' ? 'Signature' : 'QR code'} uploaded!`);
    };
    reader.onerror = () => {
      showToast('Failed to read image file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleStateChange = (e) => {
    const selectedStateName = e.target.value;
    const stateObj = INDIAN_STATES.find((s) => s.name === selectedStateName);
    handleChange('state', selectedStateName);
    if (stateObj) {
      handleChange('stateCode', stateObj.code);
    }
  };

  const handleAddDefaultCustomField = () => {
    setSettings((prev) => ({
      ...prev,
      defaultCustomFields: [
        ...(prev.defaultCustomFields || []),
        { label: 'Field Name', defaultValue: '' },
      ],
    }));
  };

  const handleUpdateDefaultCustomField = (index, key, val) => {
    setSettings((prev) => {
      const updated = [...(prev.defaultCustomFields || [])];
      updated[index] = { ...updated[index], [key]: val };
      return { ...prev, defaultCustomFields: updated };
    });
  };

  const handleRemoveDefaultCustomField = (index) => {
    setSettings((prev) => ({
      ...prev,
      defaultCustomFields: prev.defaultCustomFields.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!settings.companyName.trim()) {
      showToast('Business / Company Name is required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await settingsAPI.update(settings);
      
      // Dispatch event so Sidebar and Header update immediately
      window.dispatchEvent(new Event('company_settings_updated'));
      showToast('Business Profile & Logo updated successfully!');
    } catch (err) {
      console.error('Error updating settings:', err);
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label="Open sidebar"
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Business Profile & Branding
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Upload your logo, set your custom company name, signature, and default billing preferences
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </header>

      {/* Main Settings Form */}
      <div className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Card 1: Visual Identity & Brand Assets (Logo & Signature) */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span>Brand Identity: Logo & Digital Signature</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Appears on all quotations, invoices & PDF exports
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Logo Upload */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Official Business Logo</span>
                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('logoUrl', '')}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Remove Logo
                    </button>
                  )}
                </label>

                <div className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-4 bg-slate-50/60 transition-all flex flex-col items-center justify-center min-h-[170px] relative group">
                  {settings.logoUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-32 h-24 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
                        <img
                          src={settings.logoUrl}
                          alt="Business Logo Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Logo Active
                      </span>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="text-xs text-purple-600 hover:text-purple-700 font-bold underline"
                      >
                        Change Logo Image
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 mb-0.5">Click to upload company logo</p>
                      <p className="text-[11px] text-slate-400">PNG, JPG, SVG, WebP (Max 3MB)</p>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="mt-3 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-purple-700 text-xs font-bold shadow-2xs hover:bg-purple-50 transition-colors"
                      >
                        Choose File
                      </button>
                    </div>
                  )}

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logoUrl')}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Or direct image URL:
                  </label>
                  <input
                    type="text"
                    value={settings.logoUrl || ''}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                  />
                </div>
              </div>

              {/* Digital Signature Upload */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Authorized Digital Signature</span>
                  {settings.signature && (
                    <button
                      type="button"
                      onClick={() => handleChange('signature', '')}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Remove Signature
                    </button>
                  )}
                </label>

                <div className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-4 bg-slate-50/60 transition-all flex flex-col items-center justify-center min-h-[170px] relative group">
                  {settings.signature ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-36 h-20 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
                        <img
                          src={settings.signature}
                          alt="Signature Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Signature Active
                      </span>
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className="text-xs text-purple-600 hover:text-purple-700 font-bold underline"
                      >
                        Change Signature File
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <PenTool className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 mb-0.5">Upload signature image</p>
                      <p className="text-[11px] text-slate-400">Transparent PNG or JPG of signature</p>
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className="mt-3 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-purple-700 text-xs font-bold shadow-2xs hover:bg-purple-50 transition-colors"
                      >
                        Choose File
                      </button>
                    </div>
                  )}

                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'signature')}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Or signature image URL:
                  </label>
                  <input
                    type="text"
                    value={settings.signature || ''}
                    onChange={(e) => handleChange('signature', e.target.value)}
                    placeholder="https://example.com/signature.png"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Live Brand Preview Card */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
              <div className="flex items-center gap-3.5">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1 shrink-0 border border-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center font-bold text-lg text-white shadow-md shrink-0">
                    {settings.companyName ? settings.companyName.charAt(0).toUpperCase() : 'B'}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide uppercase">
                    {settings.companyName || 'YOUR BUSINESS NAME'}
                  </h3>
                  <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mt-0.5">
                    {settings.tagline || `${settings.businessCategory || 'Commercial'} Enterprise`}
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-400">
                <span className="inline-block px-2.5 py-1 rounded bg-purple-900/60 text-purple-300 font-bold border border-purple-700/50">
                  {settings.businessCategory} Suite
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Business Profile & Industry Category */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Business Information & Industry</span>
              </h2>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                Category: {settings.businessCategory}
              </span>
            </div>

            {/* Business Category Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Primary Business Industry <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {businessCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleChange('businessCategory', cat)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                      settings.businessCategory === cat
                        ? 'bg-purple-600 text-white shadow-xs scale-102'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Business / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={settings.companyName || ''}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="e.g. Apex Global Engineering"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Owner / Representative Name
                </label>
                <input
                  type="text"
                  value={settings.ownerName || ''}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Tagline / Business Slogan
                </label>
                <input
                  type="text"
                  value={settings.tagline || ''}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="e.g. Complete Engineering & Turnkey Solutions"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Authorized Signatory Title
                </label>
                <input
                  type="text"
                  value={settings.authorizedSignatory || ''}
                  onChange={(e) => handleChange('authorizedSignatory', e.target.value)}
                  placeholder="e.g. Authorized Signatory / Director"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Full Registered Office Address
              </label>
              <textarea
                rows={2}
                value={settings.companyAddress || ''}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
                placeholder="Plot / Street / City / State / PIN..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Phone Number</label>
                <input
                  type="text"
                  value={settings.mobile || ''}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@mycompany.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Website</label>
                <input
                  type="text"
                  value={settings.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="www.mycompany.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">GSTIN</label>
                <input
                  type="text"
                  value={settings.gstin || ''}
                  onChange={(e) => handleChange('gstin', e.target.value)}
                  placeholder="27AABCS1429B1Z8"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">PAN</label>
                <input
                  type="text"
                  value={settings.pan || ''}
                  onChange={(e) => handleChange('pan', e.target.value)}
                  placeholder="AABCS1429B"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">State</label>
                <select
                  value={settings.state || 'Maharashtra'}
                  onChange={handleStateChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none bg-white"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Default Document Template Selection */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>Default Quotation & Invoice Template Style</span>
              </h2>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                Active: {templatesList.find((t) => t.id === settings.defaultTemplate)?.name || 'Navy Classic'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {templatesList.map((tpl) => {
                const isSelected = settings.defaultTemplate === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleChange('defaultTemplate', tpl.id)}
                    className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-6 h-6 rounded-lg ${tpl.color} border shadow-2xs`} />
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {tpl.badge}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 mb-1">{tpl.name}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{tpl.desc}</p>
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-purple-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selected Default</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Document Numbering Prefixes */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Document Numbering Prefixes</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Quotation</label>
                <input
                  type="text"
                  value={settings.quotationPrefix || 'QT-'}
                  onChange={(e) => handleChange('quotationPrefix', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Tax Invoice</label>
                <input
                  type="text"
                  value={settings.invoicePrefix || 'INV-'}
                  onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Estimate</label>
                <input
                  type="text"
                  value={settings.estimatePrefix || 'EST-'}
                  onChange={(e) => handleChange('estimatePrefix', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Proforma</label>
                <input
                  type="text"
                  value={settings.proformaPrefix || 'PI-'}
                  onChange={(e) => handleChange('proformaPrefix', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">PO</label>
                <input
                  type="text"
                  value={settings.poPrefix || 'PO-'}
                  onChange={(e) => handleChange('poPrefix', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Receipt</label>
                <input
                  type="text"
                  value={settings.receiptPrefix || 'REC-'}
                  onChange={(e) => handleChange('receiptPrefix', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Card 5: Default Business Custom Fields */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>Default Custom Business Fields</span>
              </h2>
              <button
                type="button"
                onClick={handleAddDefaultCustomField}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 hover:bg-purple-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Default Field</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              These custom fields will be auto-populated in every new quotation or invoice you create.
            </p>

            {settings.defaultCustomFields && settings.defaultCustomFields.length > 0 ? (
              <div className="space-y-2">
                {settings.defaultCustomFields.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => handleUpdateDefaultCustomField(idx, 'label', e.target.value)}
                      placeholder="Field Label (e.g. Model / Capacity / Serial No)"
                      className="w-1/3 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800"
                    />
                    <input
                      type="text"
                      value={f.defaultValue}
                      onChange={(e) => handleUpdateDefaultCustomField(idx, 'defaultValue', e.target.value)}
                      placeholder="Default Value (optional)"
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDefaultCustomField(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                No default custom fields configured.
              </div>
            )}
          </div>

          {/* Card 6: Bank & Payment Accounts */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-purple-600" />
              <span>Bank & Payment Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Bank Name</label>
                <input
                  type="text"
                  value={settings.bankName || ''}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  placeholder="e.g. State Bank of India / HDFC"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Account Number</label>
                <input
                  type="text"
                  value={settings.accountNumber || ''}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                  placeholder="4098765432198"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">IFSC Code</label>
                <input
                  type="text"
                  value={settings.ifscCode || ''}
                  onChange={(e) => handleChange('ifscCode', e.target.value)}
                  placeholder="SBIN0001429"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Branch</label>
                <input
                  type="text"
                  value={settings.branch || ''}
                  onChange={(e) => handleChange('branch', e.target.value)}
                  placeholder="Main Branch"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">UPI ID</label>
                <input
                  type="text"
                  value={settings.upiId || ''}
                  onChange={(e) => handleChange('upiId', e.target.value)}
                  placeholder="enterprise@sbi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-purple-700 font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 7: Terms & Conditions */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Default Terms & Conditions
            </h2>
            <textarea
              rows={5}
              value={settings.defaultTerms || ''}
              onChange={(e) => handleChange('defaultTerms', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none leading-relaxed"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-lg shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save All Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Toast Alert */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
