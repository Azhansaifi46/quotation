import React, { useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import PaymentReceiptPreview from './PaymentReceiptPreview';
import { exportQuotationToPDF } from '../utils/pdfExport';
import Toast from './Toast';

export default function PaymentReceiptModal({ payment, invoice, onClose }) {
  const [toast, setToast] = useState(null);

  if (!payment || !invoice) return null;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      showToast('Generating Receipt PDF...', 'info');
      await exportQuotationToPDF('payment-receipt-modal-view', `Receipt_${payment.receiptNumber || payment.paymentId}`);
      showToast('Receipt PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to export PDF', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Payment Receipt Voucher</h3>
            <p className="text-[11px] text-slate-500 font-mono">Receipt #{payment.receiptNumber || payment.paymentId}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto flex justify-center bg-slate-200/60">
          <PaymentReceiptPreview
            paymentData={payment}
            invoiceData={invoice}
            previewId="payment-receipt-modal-view"
          />
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
