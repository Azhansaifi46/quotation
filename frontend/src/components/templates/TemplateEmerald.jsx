import React from 'react';
import { formatINR, formatNumberOnly } from '../../utils/numberToWords';
import { calculateLineItem } from '../../utils/taxCalculator';
import GstSummaryTable from '../GstSummaryTable';

export default function TemplateEmerald({
  quotationData,
  company,
  qrSrc,
  isInterState,
}) {
  const {
    documentType = 'Estimate',
    quotationNumber,
    quotationDate,
    validUntil,
    dueDate,
    placeOfSupply,
    placeOfSupplyCode,
    customer = {},
    items = [],
    customFields = [],
    summary = {},
    taxRows = [],
    gstSummary = [],
    termsAndConditions = '',
    paymentInfo = {},
    notes = '',
  } = quotationData;

  const docTitle = documentType.toUpperCase();

  return (
    <div className="bg-white text-slate-800 text-xs font-sans leading-normal p-6 space-y-5 w-full box-border" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* 1. Emerald Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-5 rounded-2xl flex flex-row justify-between items-center gap-4 shadow-md no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="flex items-center gap-3.5">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1 shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
              {company.name?.charAt(0) || 'E'}
            </div>
          )}
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white leading-tight">{company.name}</h1>
            <p className="text-[10.5px] font-semibold text-emerald-300 uppercase tracking-wider">{company.tagline || company.businessCategory}</p>
          </div>
        </div>

        <div className="text-right bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shrink-0">
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">{docTitle}</div>
          <div className="text-white font-mono font-extrabold text-sm">#{quotationNumber}</div>
        </div>
      </div>

      {/* 2. Info Grid */}
      <div className="grid grid-cols-2 gap-5 pb-2 no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="space-y-1 text-slate-600 text-[11px]">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Company Details</span>
          <div className="font-bold text-slate-900">{company.name}</div>
          <div>{company.address}</div>
          <div>Phone: {company.mobile} | Email: {company.email}</div>
          {company.gstin && <div>GSTIN: <span className="font-mono font-semibold">{company.gstin}</span></div>}
        </div>

        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 space-y-1 text-[11px]">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Billed To</span>
          <div className="font-bold text-sm text-slate-900">{customer.name || '--'}</div>
          {customer.mobile && <div>Mobile: {customer.mobile}</div>}
          {customer.email && <div>Email: {customer.email}</div>}
          {customer.billingAddress && <div className="leading-relaxed">{customer.billingAddress}</div>}
          <div className="flex justify-between pt-1 border-t border-emerald-200/60 font-semibold text-emerald-950">
            <span>Date: {quotationDate}</span>
            <span>Place of Supply: {placeOfSupply}</span>
          </div>
        </div>
      </div>

      {/* 3. Items Table */}
      <div className="quotation-items-table border border-slate-200 rounded-xl overflow-x-auto overflow-y-visible bg-white">
        <table className="w-full border-collapse text-left text-[11px]" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-200 text-[10px]">
              <th style={{ width: '4%' }} className="py-2.5 px-1.5 text-center">#</th>
              <th style={{ width: '24%' }} className="py-2.5 px-2.5">Item / Service Description</th>
              <th style={{ width: '8%' }} className="py-2.5 px-1 text-center">HSN</th>
              <th style={{ width: '10%' }} className="py-2.5 px-1.5 text-right">Rate (₹)</th>
              <th style={{ width: '5%' }} className="py-2.5 px-1 text-center">Qty</th>
              <th style={{ width: '5%' }} className="py-2.5 px-1 text-center">Unit</th>
              <th style={{ width: '12%' }} className="py-2.5 px-1.5 text-right">Taxable Value (₹)</th>
              <th style={{ width: '6%' }} className="py-2.5 px-1 text-center">Tax %</th>
              <th style={{ width: '11%' }} className="py-2.5 px-1.5 text-right">Taxable Amount (₹)</th>
              <th style={{ width: '15%' }} className="py-2.5 px-2 text-right">Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {items && items.length > 0 ? (
              items.map((item, idx) => {
                const calculatedItem = calculateLineItem(item, isInterState);

                return (
                  <tr key={idx} className="hover:bg-emerald-50/20" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <td className="py-2 px-1.5 text-center text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="py-2 px-2.5 font-medium text-slate-900 leading-snug break-words">{item.description || item.name || '--'}</td>
                    <td className="py-2 px-1 text-center text-slate-600 font-mono text-[10px]">{item.hsnSac || '--'}</td>
                    <td className="py-2 px-1.5 text-right font-mono text-slate-700">{formatNumberOnly(item.rate)}</td>
                    <td className="py-2 px-1 text-center font-medium text-slate-800">{item.quantity}</td>
                    <td className="py-2 px-1 text-center text-slate-600">{item.unit || 'Nos'}</td>
                    <td className="py-2 px-1.5 text-right font-mono font-medium text-slate-800">{formatNumberOnly(calculatedItem.taxableValue)}</td>
                    <td className="py-2 px-1 text-center text-slate-600">{item.taxRate}%</td>
                    <td className="py-2 px-1.5 text-right font-mono text-slate-700">{formatNumberOnly(calculatedItem.taxAmount)}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">{formatNumberOnly(calculatedItem.totalAmount)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-400">
                  No items added.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Totals & Tax Rows */}
      <div className="grid grid-cols-12 gap-5 items-start no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="col-span-7 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
          <span className="font-bold text-slate-600 text-[10px] uppercase tracking-wider block">
            Amount in Words:
          </span>
          <div className="text-[11.5px] font-semibold text-slate-800 italic leading-relaxed">
            {summary.amountInWords || 'Zero Rupees Only'}
          </div>
          {notes && <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">Notes: {notes}</div>}
        </div>

        <div className="col-span-5 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-1.5 text-[11px]">
          <div className="flex justify-between py-0.5">
            <span className="text-slate-600 font-medium">Taxable Amount</span>
            <span className="font-mono font-bold text-slate-900">{formatINR(summary.taxableAmount || summary.subtotal)}</span>
          </div>

          {taxRows && taxRows.length > 0 ? (
            taxRows.map((t, idx) => (
              <div key={idx} className="flex justify-between py-0.5 text-slate-700">
                <span>{t.type || 'GST'} @ {t.rate}%</span>
                <span className="font-mono font-semibold text-slate-900">{formatINR(t.taxAmount)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between py-0.5">
              <span>Total Tax</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(summary.totalTax)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t-2 border-emerald-300">
            <span className="font-extrabold text-slate-900 text-xs">Grand Total</span>
            <span className="font-extrabold text-emerald-800 text-sm font-mono">
              {formatINR(summary.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. GST Summary Table */}
      <GstSummaryTable
        gstSummary={gstSummary}
        isInterState={isInterState}
        title="GST Summary"
        titleColor="text-emerald-950"
      />

      {/* 6. Payment Details & Signatory */}
      <div className="grid grid-cols-12 gap-5 pt-3 border-t border-slate-200 items-center no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="col-span-8 flex flex-row gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[10.5px]">
          <div className="space-y-0.5 flex-1">
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-1">Bank Payment Info</div>
            <div>Bank: <span className="font-semibold text-slate-900">{paymentInfo.bankName || company.bankName || '--'}</span></div>
            <div>A/C No: <span className="font-mono font-semibold text-slate-900">{paymentInfo.accountNumber || company.accountNumber || '--'}</span></div>
            <div>IFSC: <span className="font-mono font-semibold text-slate-900">{paymentInfo.ifscCode || company.ifscCode || '--'}</span></div>
          </div>
          {qrSrc && (
            <div className="text-center shrink-0">
              <img src={qrSrc} alt="UPI QR" className="w-16 h-16 rounded border border-slate-300 bg-white p-1" style={{ width: '65px', height: '65px' }} />
              {(paymentInfo.upiId || company.upiId) && (
                <div className="mt-1 max-w-24 text-[9px] leading-tight text-slate-600 break-all">
                  UPI: <span className="font-mono font-semibold text-emerald-800">{paymentInfo.upiId || company.upiId}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="col-span-4 text-right space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold">For {company.name}</div>
          <div className="pt-2 flex flex-col items-end">
            {(company.signature || company.signatureUrl) && (
              <img
                src={company.signature || company.signatureUrl}
                alt="Signature"
                className="max-h-12 max-w-[140px] object-contain mb-1"
              />
            )}
            <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-800 min-w-[140px] text-center">
              {company.authorizedSignatory || 'Authorized Signatory'}
            </div>
          </div>
        </div>
      </div>

      {termsAndConditions && (
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 whitespace-pre-line leading-relaxed no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <span className="font-bold text-slate-700">Terms & Conditions: </span>
          {termsAndConditions}
        </div>
      )}
    </div>
  );
}
