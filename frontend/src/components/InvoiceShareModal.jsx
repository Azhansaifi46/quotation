import React, { useState } from 'react';
import { X, MessageSquare, Mail, Copy, Check, Share2 } from 'lucide-react';
import { formatINR } from '../utils/numberToWords';

export default function InvoiceShareModal({ invoice, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!invoice) return null;

  const customerName = invoice.customer?.name || 'Customer';
  const customerMobile = invoice.customer?.mobile ? invoice.customer.mobile.replace(/[^0-9]/g, '') : '';
  const invoiceNumber = invoice.quotationNumber;
  const grandTotal = invoice.summary?.grandTotal || 0;
  const paidAmount = invoice.paidAmount || (invoice.status === 'Paid' ? grandTotal : 0);
  const balanceDue = invoice.balanceDue !== undefined ? invoice.balanceDue : Math.max(0, grandTotal - paidAmount);
  const dueDate = invoice.dueDate || 'Upon Receipt';
  const companyName = invoice.company?.name || 'SUN BRIGHT ENTERPRISE';
  const upiId = invoice.paymentInfo?.upiId || invoice.company?.upiId || '';

  const shareText = `Dear ${customerName},\n\nPlease find your Tax Invoice #${invoiceNumber} from *${companyName}*.\n\n📄 *Invoice Details:*\n- Total Amount: ${formatINR(grandTotal)}\n- Amount Paid: ${formatINR(paidAmount)}\n- Balance Due: ${formatINR(balanceDue)}\n- Due Date: ${dueDate}\n\n💳 *Payment Options:*\n${upiId ? `- UPI ID: ${upiId}\n` : ''}${invoice.paymentInfo?.bankName ? `- Bank: ${invoice.paymentInfo.bankName}\n- A/C No: ${invoice.paymentInfo.accountNumber}\n- IFSC: ${invoice.paymentInfo.ifscCode}\n` : ''}\nThank you for your business!\n*${companyName}*`;

  const handleWhatsAppShare = () => {
    const cleanPhone = customerMobile.length === 10 ? `91${customerMobile}` : customerMobile;
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Tax Invoice #${invoiceNumber} from ${companyName}`);
    const body = encodeURIComponent(shareText);
    const email = invoice.customer?.email || '';
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Share Invoice</h3>
              <p className="text-[11px] text-slate-500 font-mono">Invoice #{invoiceNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share Channels */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold transition-all active:scale-95 text-center"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Share WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleEmailShare}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold transition-all active:scale-95 text-center"
            >
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Send via Email</span>
            </button>
          </div>

          {/* Pre-formatted text preview */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Message Preview</label>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] font-mono text-slate-800 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
              {shareText}
            </div>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Formatted Details'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
