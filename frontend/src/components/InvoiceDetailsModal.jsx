import React from 'react';
import {
  X,
  CreditCard,
  Download,
  Share2,
  Edit,
  Eye,
  Trash2,
  Receipt,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';
import { formatINR } from '../utils/numberToWords';

export default function InvoiceDetailsModal({
  invoice,
  onClose,
  onRecordPayment,
  onViewTaxInvoice,
  onDownloadPDF,
  onShare,
  onEdit,
  onViewReceipt,
  onDeletePayment,
}) {
  if (!invoice) return null;

  const grandTotal = invoice.summary?.grandTotal || 0;
  const paidAmount = invoice.paidAmount || (invoice.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const balanceDue = invoice.balanceDue !== undefined ? invoice.balanceDue : Math.max(0, grandTotal - paidAmount);
  const payments = invoice.payments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  Invoice #{invoice.quotationNumber}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    invoice.status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : invoice.status === 'Partial'
                      ? 'bg-blue-100 text-blue-800'
                      : invoice.status === 'Overdue'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {invoice.status || 'Unpaid'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Issued on {invoice.quotationDate || invoice.documentDate} | Due: {invoice.dueDate || 'Upon Receipt'}
              </p>
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

        {/* Financial KPI Banner */}
        <div className="p-6 bg-slate-900 text-white grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-white/10 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Amount</span>
            <span className="text-lg font-mono font-black text-white mt-0.5 block">{formatINR(grandTotal)}</span>
          </div>
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl">
            <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">Paid Amount</span>
            <span className="text-lg font-mono font-black text-emerald-300 mt-0.5 block">{formatINR(paidAmount)}</span>
          </div>
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-2xl">
            <span className="text-[10px] text-rose-300 uppercase tracking-wider block">Balance Due</span>
            <span className="text-lg font-mono font-black text-rose-300 mt-0.5 block">{formatINR(balanceDue)}</span>
          </div>
        </div>

        {/* Customer & Invoice Meta Details */}
        <div className="p-6 space-y-6 text-xs">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Customer / Client</span>
              <div className="font-extrabold text-slate-900 text-sm">{invoice.customer?.name}</div>
              <div className="text-slate-600 text-[11px]">{invoice.customer?.mobile}</div>
              <div className="text-slate-600 text-[11px]">{invoice.customer?.email}</div>
              {invoice.customer?.gstin && (
                <div className="text-[10px] font-bold text-slate-700 mt-1">GSTIN: {invoice.customer.gstin}</div>
              )}
            </div>

            <div className="space-y-1 text-right text-[11px]">
              <div>
                <span className="text-slate-500">Payment Terms: </span>
                <span className="font-bold text-slate-800">{invoice.paymentTerms || 'Due on Receipt'}</span>
              </div>
              <div>
                <span className="text-slate-500">Place of Supply: </span>
                <span className="font-bold text-slate-800">{invoice.placeOfSupply || 'Maharashtra'}</span>
              </div>
              {invoice.poNumber && (
                <div>
                  <span className="text-slate-500">PO Number: </span>
                  <span className="font-bold text-slate-800">{invoice.poNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment History Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Payment History & Ledger ({payments.length})
              </h4>
              {balanceDue > 0 && (
                <button
                  type="button"
                  onClick={() => onRecordPayment(invoice)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Record Payment</span>
                </button>
              )}
            </div>

            {payments.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-150">
                {payments.map((p, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{formatINR(p.amount)}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {p.paymentMode || 'UPI'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.paymentDate} {p.referenceNo ? `• Ref: ${p.referenceNo}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(p, invoice)}
                        className="px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px] transition-colors"
                      >
                        Receipt
                      </button>
                      {onDeletePayment && (
                        <button
                          type="button"
                          onClick={() => onDeletePayment(invoice._id, p.paymentId)}
                          title="Remove payment"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <Clock className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p className="font-semibold">No payments recorded yet</p>
                <p className="text-[11px]">Click "+ Record Payment" when the client pays.</p>
              </div>
            )}
          </div>

          {/* Quick Action Toolbar */}
          <div className="pt-4 border-t border-slate-150 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onViewTaxInvoice(invoice)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Tax Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => onDownloadPDF(invoice)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onShare(invoice)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(invoice._id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
