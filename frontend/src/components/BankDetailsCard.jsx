import React, { useRef, useEffect, useState } from 'react';
import { Upload, QrCode, Image, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';

export default function BankDetailsCard({ paymentInfo, grandTotal, onChange, companyName = 'Business' }) {
  const fileInputRef = useRef(null);
  const [generatedQR, setGeneratedQR] = useState('');

  // Auto-generate QR if UPI ID is present and no custom uploaded image
  useEffect(() => {
    if (paymentInfo.upiId && !paymentInfo.upiQrCode) {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(paymentInfo.upiId)}&pn=${encodeURIComponent(companyName || 'Business')}&cu=INR${
        grandTotal > 0 ? `&am=${grandTotal}` : ''
      }`;
      QRCode.toDataURL(upiUrl, { width: 140, margin: 1 })
        .then((url) => setGeneratedQR(url))
        .catch((err) => console.error('QR generation error:', err));
    } else {
      setGeneratedQR('');
    }
  }, [paymentInfo.upiId, paymentInfo.upiQrCode, grandTotal, companyName]);

  const handleFieldChange = (field, val) => {
    onChange(`paymentInfo.${field}`, val);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        onChange('paymentInfo.upiQrCode', uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveQR = () => {
    onChange('paymentInfo.upiQrCode', '');
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
      <h2 className="text-base font-bold text-slate-900 mb-4 tracking-tight">
        Payment Information / Bank Details
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Bank Inputs */}
        <div className="lg:col-span-8 space-y-4">
          {/* Bank Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bank Name
            </label>
            <input
              type="text"
              value={paymentInfo.bankName || ''}
              onChange={(e) => handleFieldChange('bankName', e.target.value)}
              placeholder="Enter bank name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
          </div>

          {/* Account Number & IFSC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                value={paymentInfo.accountNumber || ''}
                onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                placeholder="Enter account number"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                IFSC Code
              </label>
              <input
                type="text"
                value={paymentInfo.ifscCode || ''}
                onChange={(e) => handleFieldChange('ifscCode', e.target.value)}
                placeholder="Enter IFSC code"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all uppercase font-mono"
              />
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Branch
            </label>
            <input
              type="text"
              value={paymentInfo.branch || ''}
              onChange={(e) => handleFieldChange('branch', e.target.value)}
              placeholder="Enter branch name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
          </div>

          {/* UPI ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              UPI ID
            </label>
            <input
              type="text"
              value={paymentInfo.upiId || ''}
              onChange={(e) => handleFieldChange('upiId', e.target.value)}
              placeholder="Enter UPI ID"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
          </div>
        </div>

        {/* Right: UPI QR Code Box */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center">
          <label className="block text-xs font-semibold text-slate-700 mb-2 w-full text-center">
            UPI QR Code
          </label>

          <div className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[190px] bg-slate-50/50 hover:bg-purple-50/30 transition-colors relative group">
            {paymentInfo.upiQrCode ? (
              <div className="flex flex-col items-center">
                <img
                  src={paymentInfo.upiQrCode}
                  alt="Custom UPI QR"
                  className="w-28 h-28 object-contain rounded-lg shadow-2xs border border-slate-200 bg-white p-1"
                />
                <button
                  type="button"
                  onClick={handleRemoveQR}
                  className="mt-2 text-[11px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Custom QR
                </button>
              </div>
            ) : generatedQR ? (
              <div className="flex flex-col items-center">
                <img
                  src={generatedQR}
                  alt="Auto UPI QR"
                  className="w-28 h-28 object-contain rounded-lg shadow-2xs border border-slate-200 bg-white p-1"
                />
                <span className="text-[10px] text-slate-500 mt-1">Auto-generated QR</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 text-[11px] text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Upload custom instead
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center text-slate-400 hover:text-purple-600 transition-colors p-3"
              >
                <div className="p-3 bg-white rounded-xl shadow-2xs border border-slate-200 text-purple-600 mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Upload QR Code</span>
                <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 2MB</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
