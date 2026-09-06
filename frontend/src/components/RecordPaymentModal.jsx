import React, { useState } from 'react';
import { X, CheckCircle2, CreditCard, IndianRupee, Calendar, Hash, FileText } from 'lucide-react';
import { quotationsAPI } from '../api/client';
import { formatINR } from '../utils/numberToWords';

export default function RecordPaymentModal({ invoice, onClose, onSuccess, onViewReceipt }) {
  if (!invoice) return null;

  const grandTotal = invoice.summary?.grandTotal || 0;
  const currentPaid = invoice.paidAmount || (invoice.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remainingBalance = Math.max(0, Math.round((grandTotal - currentPaid) * 100) / 100);

  const [amount, setAmount] = useState(remainingBalance > 0 ? remainingBalance : '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than ₹0');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const res = await quotationsAPI.recordPayment(invoice._id, {
        amount: numAmount,
        paymentDate,
        paymentMode,
        referenceNo: referenceNo.trim(),
        notes: notes.trim(),
      });

      if (res.data?.success) {
        const updatedInvoice = res.data.data;
        const newPayment = res.data.payment;
        if (onSuccess) onSuccess(updatedInvoice, newPayment);
      }
    } catch (err) {
      console.error('Payment recording error:', err);
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentModes = [
    'UPI',
    'Bank Transfer',
    'NEFT',
    'RTGS',
    'IMPS',
    'Cash',
    'Cheque',
    'Credit Card',
    'Debit Card',
    'Online',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Record Invoice Payment</h3>
              <p className="text-[11px] text-slate-500 font-mono">Invoice #{invoice.quotationNumber}</p>
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

        {/* Invoice Summary Pill Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-white/10 rounded-xl">
            <span className="text-[10px] text-slate-300 font-medium block">Total Amount</span>
            <span className="font-mono font-bold text-white mt-0.5 block">{formatINR(grandTotal)}</span>
          </div>
          <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
            <span className="text-[10px] text-emerald-300 font-medium block">Already Paid</span>
            <span className="font-mono font-bold text-emerald-300 mt-0.5 block">{formatINR(currentPaid)}</span>
          </div>
          <div className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-xl">
            <span className="text-[10px] text-rose-300 font-medium block">Balance Due</span>
            <span className="font-mono font-black text-rose-300 mt-0.5 block">{formatINR(remainingBalance)}</span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Payment Amount Received (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
              />
            </div>
            {remainingBalance > 0 && parseFloat(amount) !== remainingBalance && (
              <button
                type="button"
                onClick={() => setAmount(remainingBalance)}
                className="mt-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 underline"
              >
                Set full remaining balance ({formatINR(remainingBalance)})
              </button>
            )}
          </div>

          {/* Payment Date & Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
              >
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference / UTR Number */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Transaction ID / UTR / Cheque Ref Number
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. UPI Ref 418293849102 or Cheque #004921"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Payment Remarks (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received via PhonePe, verified in bank account"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-150">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
