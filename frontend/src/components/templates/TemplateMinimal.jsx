import React from 'react';
import { formatINR, formatNumberOnly } from '../../utils/numberToWords';
import { calculateLineItem } from '../../utils/taxCalculator';
import GstSummaryTable from '../GstSummaryTable';

export default function TemplateMinimal({
  quotationData,
  company,
  qrSrc,
  isInterState,
}) {
  const {
    documentType = 'Quotation',
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
    <div className="bg-white text-black text-xs font-sans leading-normal p-6 space-y-5 w-full box-border" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* 1. Minimal Header */}
      <div className="flex flex-row justify-between items-start border-b-2 border-black pb-4 no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="flex items-start gap-4">
          {company.logoUrl && (
            <img
              src={company.logoUrl}
              alt="Logo"
              className="w-12 h-12 object-contain rounded border border-neutral-200 p-0.5 shrink-0"
            />
          )}
          <div>
            <h1 className="font-bold text-2xl tracking-tight text-black leading-tight">{company.name}</h1>
            <p className="text-[11px] text-neutral-600 uppercase tracking-widest">{company.tagline || company.businessCategory}</p>
            <div className="text-[11px] text-neutral-600 pt-1 leading-relaxed">
              <div>{company.address}</div>
              <div>Phone: {company.mobile} | Email: {company.email}</div>
              {company.gstin && <div>GSTIN: {company.gstin}</div>}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-black tracking-tight">{docTitle}</div>
          <div className="font-mono text-sm font-bold mt-1">#{quotationNumber}</div>
          <div className="text-[11px] text-neutral-600 mt-2 space-y-0.5">
            <div>Date: <span className="font-semibold text-black">{quotationDate}</span></div>
            {validUntil && <div>Valid Till: <span className="font-semibold text-black">{validUntil}</span></div>}
            {dueDate && <div>Due Date: <span className="font-bold text-black">{dueDate}</span></div>}
          </div>
        </div>
      </div>

      {/* 2. Client & Supply */}
      <div className="grid grid-cols-2 gap-6 pb-2 no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="border-l-2 border-black pl-3 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">Billed To</span>
          <div className="font-bold text-sm text-black">{customer.name || '--'}</div>
          {customer.mobile && <div className="text-[11px] text-neutral-600">{customer.mobile}</div>}
          {customer.email && <div className="text-[11px] text-neutral-600">{customer.email}</div>}
          {customer.billingAddress && <div className="text-[11px] text-neutral-600 leading-relaxed">{customer.billingAddress}</div>}
          {customer.gstin && <div className="text-[11px] text-black font-mono font-semibold pt-0.5">GSTIN: {customer.gstin}</div>}
        </div>

        <div className="border-l-2 border-neutral-300 pl-3 space-y-1 text-[11px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">Details</span>
          <div>Place of Supply: <span className="font-semibold">{placeOfSupply} ({placeOfSupplyCode || '27'})</span></div>
          {customFields && customFields.map((cf, idx) => (
            <div key={idx}>{cf.label}: <span className="font-semibold">{cf.value}</span></div>
          ))}
        </div>
      </div>

      {/* 3. Items Table */}
      <div className="quotation-items-table overflow-x-auto overflow-y-visible">
      <table className="w-full border-collapse text-left text-[11px] border-t border-b border-black" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="border-b border-black font-bold uppercase text-[10px] text-neutral-800">
            <th style={{ width: '4%' }} className="py-2 px-1 text-center">#</th>
            <th style={{ width: '24%' }} className="py-2 px-2">Description</th>
            <th style={{ width: '8%' }} className="py-2 px-1 text-center">HSN</th>
            <th style={{ width: '10%' }} className="py-2 px-1.5 text-right">Rate (₹)</th>
            <th style={{ width: '5%' }} className="py-2 px-1 text-center">Qty</th>
            <th style={{ width: '5%' }} className="py-2 px-1 text-center">Unit</th>
            <th style={{ width: '12%' }} className="py-2 px-1.5 text-right">Taxable Value (₹)</th>
            <th style={{ width: '6%' }} className="py-2 px-1 text-center">Tax %</th>
            <th style={{ width: '11%' }} className="py-2 px-1.5 text-right">Taxable Amount (₹)</th>
            <th style={{ width: '15%' }} className="py-2 px-2 text-right">Total Amount (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {items && items.length > 0 ? (
            items.map((item, idx) => {
              const calculatedItem = calculateLineItem(item, isInterState);

              return (
                <tr key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <td className="py-2 px-1 text-center font-mono text-neutral-500">{idx + 1}</td>
                  <td className="py-2 px-2 font-medium leading-snug break-words">{item.description || item.name || '--'}</td>
                  <td className="py-2 px-1 text-center font-mono text-neutral-600 text-[10px]">{item.hsnSac || '--'}</td>
                  <td className="py-2 px-1.5 text-right font-mono">{formatNumberOnly(item.rate)}</td>
                  <td className="py-2 px-1 text-center">{item.quantity}</td>
                  <td className="py-2 px-1 text-center text-neutral-600">{item.unit || 'Nos'}</td>
                  <td className="py-2 px-1.5 text-right font-mono font-medium">{formatNumberOnly(calculatedItem.taxableValue)}</td>
                  <td className="py-2 px-1 text-center">{item.taxRate}%</td>
                  <td className="py-2 px-1.5 text-right font-mono">{formatNumberOnly(calculatedItem.taxAmount)}</td>
                  <td className="py-2 px-2 text-right font-mono font-bold">{formatNumberOnly(calculatedItem.totalAmount)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={10} className="py-6 text-center text-neutral-400">
                No items added.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      {/* 4. Totals & Tax Rows */}
      <div className="grid grid-cols-12 gap-6 items-start no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="col-span-7 space-y-2">
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold block text-[10px] uppercase text-neutral-500">Amount in Words:</span>
            <span className="italic font-medium">{summary.amountInWords || 'Zero Rupees Only'}</span>
          </div>
          {notes && <div className="text-[11px] text-neutral-600">Note: {notes}</div>}
        </div>

        <div className="col-span-5 space-y-1.5 text-[11px] border-l border-neutral-300 pl-4">
          <div className="flex justify-between py-0.5">
            <span className="text-neutral-600">Taxable Amount</span>
            <span className="font-mono font-bold">{formatINR(summary.taxableAmount || summary.subtotal)}</span>
          </div>

          {taxRows && taxRows.length > 0 ? (
            taxRows.map((t, idx) => (
              <div key={idx} className="flex justify-between py-0.5 text-neutral-700">
                <span>{t.type || 'GST'} @ {t.rate}%</span>
                <span className="font-mono">{formatINR(t.taxAmount)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between py-0.5">
              <span>Total Tax</span>
              <span className="font-mono">{formatINR(summary.totalTax)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t-2 border-black font-extrabold text-sm">
            <span>Grand Total</span>
            <span className="font-mono">{formatINR(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* 5. GST Summary Table */}
      <GstSummaryTable
        gstSummary={gstSummary}
        isInterState={isInterState}
        title="GST Summary"
        titleColor="text-neutral-900"
      />

      {/* 6. Payment & Signature */}
      <div className="flex flex-row justify-between items-end pt-5 border-t border-neutral-300 no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="space-y-0.5 text-[10.5px] text-neutral-700">
          <span className="font-bold text-black uppercase block text-[10px]">Payment Details</span>
          <div>Bank: <span className="font-medium">{paymentInfo.bankName || company.bankName || '--'}</span></div>
          <div>A/C: <span className="font-mono font-medium">{paymentInfo.accountNumber || company.accountNumber || '--'}</span></div>
          <div>IFSC: <span className="font-mono font-medium">{paymentInfo.ifscCode || company.ifscCode || '--'}</span></div>
          {paymentInfo.upiId && <div>UPI: <span className="font-mono font-medium">{paymentInfo.upiId}</span></div>}
        </div>

        <div className="text-right space-y-1">
          <div className="text-[10px] uppercase text-neutral-500">Authorized Signature</div>
          <div className="pt-2 flex flex-col items-end">
            {(company.signature || company.signatureUrl) && (
              <img
                src={company.signature || company.signatureUrl}
                alt="Signature"
                className="max-h-12 max-w-[140px] object-contain mb-1"
              />
            )}
            <div className="border-t border-black pt-1 font-bold text-[11px] min-w-[150px] text-center">
              {company.authorizedSignatory || 'For ' + company.name}
            </div>
          </div>
        </div>
      </div>

      {termsAndConditions && (
        <div className="pt-2 border-t border-neutral-200 text-[10px] text-neutral-600 whitespace-pre-line leading-relaxed no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <span className="font-bold text-black">Terms: </span>
          {termsAndConditions}
        </div>
      )}
    </div>
  );
}

