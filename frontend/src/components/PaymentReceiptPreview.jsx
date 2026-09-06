import React from 'react';
import { formatINR, numberToWordsIndian } from '../utils/numberToWords';

export default function PaymentReceiptPreview({
  paymentData = {},
  invoiceData = {},
  companyData = null,
  previewId = 'payment-receipt-preview',
}) {
  const company = companyData || invoiceData.company || {
    name: 'SUN BRIGHT ENTERPRISE',
    tagline: 'Quotation, Invoicing & Billing Solutions',
    address: 'Plot No. 42, Phase-II, Industrial Energy Park, Pune, Maharashtra - 411028',
    mobile: '+91 98765 43210',
    email: 'contact@sunbrightenterprise.com',
    gstin: '27AABCS1429B1Z8',
    pan: 'AABCS1429B',
    state: 'Maharashtra',
    stateCode: '27',
    authorizedSignatory: 'Authorized Signatory',
  };

  const customer = invoiceData.customer || {};
  const amount = parseFloat(paymentData.amount) || 0;
  const words = amount > 0 ? numberToWordsIndian(amount) : 'Zero Rupees Only';
  const receiptNo = paymentData.receiptNumber || `REC-${Date.now().toString().slice(-6)}`;
  const invoiceNumber = invoiceData.quotationNumber || paymentData.invoiceNumber || 'INV-0001';
  const invoiceTotal = invoiceData.summary?.grandTotal || paymentData.invoiceTotal || 0;
  const balanceDue = paymentData.balanceDue !== undefined ? paymentData.balanceDue : invoiceData.balanceDue;

  return (
    <div
      id={previewId}
      className="payment-receipt-document w-full max-w-[700px] bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-8 font-sans print:p-6 print:shadow-none print:border-none print:rounded-none relative"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Top Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {company.logoUrl && (
            <img src={company.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg border border-slate-200 p-1" />
          )}
          <div>
            <h2 className="text-base font-black uppercase text-slate-900 leading-tight">
              {company.name || 'SUN BRIGHT ENTERPRISE'}
            </h2>
            <p className="text-[10px] text-slate-500">{company.address}</p>
            {company.gstin && <p className="text-[10px] font-bold text-slate-700">GSTIN: {company.gstin}</p>}
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-black uppercase tracking-tight text-purple-700 block font-mono">
            PAYMENT RECEIPT
          </span>
          <span className="text-[11px] font-bold text-slate-500 font-mono">
            Voucher #{receiptNo}
          </span>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-5">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Received From:</span>
          <div className="font-extrabold text-slate-900 text-sm">{customer.name || 'Client / Customer'}</div>
          <div className="text-slate-600 text-[11px]">{customer.mobile || customer.email}</div>
          {customer.billingAddress && (
            <div className="text-slate-500 text-[11px] mt-0.5 leading-snug">{customer.billingAddress}</div>
          )}
          {customer.gstin && <div className="text-[10px] font-bold text-slate-700 mt-1">GSTIN: {customer.gstin}</div>}
        </div>

        <div className="space-y-1.5 text-right text-[11px]">
          <div>
            <span className="text-slate-500 font-semibold">Receipt Date: </span>
            <span className="font-bold text-slate-900">
              {paymentData.paymentDate || new Date().toISOString().split('T')[0]}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Against Invoice #: </span>
            <span className="font-mono font-bold text-purple-700">{invoiceNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Payment Mode: </span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {paymentData.paymentMode || 'UPI'}
            </span>
          </div>
          {paymentData.referenceNo && (
            <div>
              <span className="text-slate-500 font-semibold">Reference / UTR #: </span>
              <span className="font-mono font-bold text-slate-800">{paymentData.referenceNo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Amount Highlight Box */}
      <div className="bg-purple-50/70 border border-purple-200 p-5 rounded-2xl text-center space-y-2 mb-5">
        <span className="text-xs font-black uppercase tracking-wider text-purple-800">
          Amount Received
        </span>
        <div className="text-3xl font-black text-purple-900 font-mono tracking-tight">
          {formatINR(amount)}
        </div>
        <div className="text-xs font-bold text-purple-700 italic">
          INR {words}
        </div>
      </div>

      {/* Financial Ledger Context Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden text-xs mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
              <th className="py-2.5 px-3">Invoice Total</th>
              <th className="py-2.5 px-3 text-right">Payment Received</th>
              {balanceDue !== undefined && (
                <th className="py-2.5 px-3 text-right">Remaining Balance</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 font-mono font-bold">
            <tr>
              <td className="py-2.5 px-3 text-slate-800">{formatINR(invoiceTotal)}</td>
              <td className="py-2.5 px-3 text-right text-emerald-700">{formatINR(amount)}</td>
              {balanceDue !== undefined && (
                <td className="py-2.5 px-3 text-right text-rose-700">{formatINR(balanceDue)}</td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {paymentData.notes && (
        <div className="text-[11px] text-slate-600 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <strong>Remarks:</strong> {paymentData.notes}
        </div>
      )}

      {/* Footer & Signature */}
      <div className="flex items-end justify-between pt-4 border-t-2 border-slate-900 text-xs">
        <div className="text-[10px] text-slate-500 max-w-[280px]">
          <p>This is a computer generated official payment receipt acknowledgment voucher.</p>
        </div>

        <div className="text-center">
          <div className="h-10 flex items-center justify-center">
            {company.signatureUrl ? (
              <img src={company.signatureUrl} alt="Signature" className="max-h-10 object-contain" />
            ) : (
              <span className="text-[10px] font-mono text-slate-300 italic">[Authorized Seal & Sign]</span>
            )}
          </div>
          <div className="border-t border-slate-300 pt-1 min-w-[160px]">
            <span className="text-[10px] font-bold text-slate-800 uppercase block">
              {company.authorizedSignatory || 'Authorized Signatory'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
