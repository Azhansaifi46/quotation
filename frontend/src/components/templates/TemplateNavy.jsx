import React from 'react';
import { Building2, Phone, Mail, Globe, MapPin } from 'lucide-react';
import { formatINR, formatNumberOnly } from '../../utils/numberToWords';
import { calculateLineItem } from '../../utils/taxCalculator';
import GstSummaryTable from '../GstSummaryTable';

export default function TemplateNavy({
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
    <div className="bg-white text-slate-800 text-xs font-sans leading-normal w-full box-border relative" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Tag: ORIGINAL FOR RECIPIENT */}
      <div className="flex justify-end pr-6 pt-3 pb-1 no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400">
          ORIGINAL FOR RECIPIENT
        </span>
      </div>

      {/* 1. Header Banner */}
      <div className="px-6 py-4 flex flex-row justify-between items-start gap-4 border-b border-slate-200 no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="flex items-start gap-3.5">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt="Logo"
              className="w-14 h-14 rounded-xl object-contain bg-white p-1 shrink-0 border border-slate-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-lg text-white shadow-md shrink-0">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-extrabold text-lg tracking-wide uppercase font-['Outfit'] text-slate-900 leading-tight">
              {company.name || 'Your Company Name'}
            </h1>
            <div className="text-[10.5px] text-slate-500 space-y-0.5 mt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{company.address || 'Your Address Goes Here'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{company.mobile || '+91 00000 00000'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{company.email || 'your.email@example.com'}</span>
              </div>
              {company.gstin && (
                <div className="font-medium text-slate-700 pt-0.5">
                  GSTIN: <span className="font-mono font-bold">{company.gstin}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Document Meta */}
        <div className="text-right shrink-0 space-y-1 text-[11px]">
          <div className="text-slate-600">
            <span className="text-slate-400 font-medium">Quotation No. :</span>{' '}
            <span className="font-mono font-bold text-slate-900">{quotationNumber || '--'}</span>
          </div>
          <div className="text-slate-600">
            <span className="text-slate-400 font-medium">Quotation Date :</span>{' '}
            <span className="font-semibold text-slate-900">{quotationDate || '--'}</span>
          </div>
          {validUntil && (
            <div className="text-slate-600">
              <span className="text-slate-400 font-medium">Valid Until :</span>{' '}
              <span className="font-semibold text-slate-900">{validUntil}</span>
            </div>
          )}
          {dueDate && (
            <div className="text-slate-600">
              <span className="text-slate-400 font-medium">Due Date :</span>{' '}
              <span className="font-bold text-rose-700">{dueDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Content Container */}
      <div className="p-6 space-y-4">
        {/* Document Title Header */}
        <div className="pt-1 pb-1">
          <h2 className="text-sm font-black tracking-widest text-[#5B21B6] uppercase">
            {docTitle}
          </h2>
        </div>

        {/* Bill To & Place of Supply Grid */}
        <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200 no-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          {/* Bill To */}
          <div className="space-y-0.5 text-[11px] text-slate-700">
            <div className="text-[10.5px] font-bold text-slate-900 uppercase tracking-wider mb-1">
              Bill To,
            </div>
            <div className="font-bold text-slate-900 text-xs">{customer.name || '--'}</div>
            {customer.mobile && <div>Phone: {customer.mobile}</div>}
            {customer.email && <div>Email: {customer.email}</div>}
            {customer.billingAddress && (
              <div className="text-slate-600 leading-snug pt-0.5">{customer.billingAddress}</div>
            )}
            {customer.gstin && (
              <div className="font-medium text-slate-800 pt-0.5">
                GSTIN: <span className="font-mono font-bold">{customer.gstin}</span>
                {customer.pan && <span className="ml-2">| PAN: <span className="font-mono">{customer.pan}</span></span>}
              </div>
            )}
          </div>

          {/* Place of Supply */}
          <div className="space-y-0.5 text-[11px] text-slate-700">
            <div className="text-[10.5px] font-bold text-slate-900 uppercase tracking-wider mb-1">
              Place of Supply
            </div>
            <div className="font-semibold text-slate-900">
              {placeOfSupply || '--'} ({placeOfSupplyCode || '27'})
            </div>

            {/* Custom Business Fields */}
            {customFields && customFields.length > 0 && (
              <div className="pt-2 mt-1 border-t border-slate-200 space-y-0.5">
                {customFields.map((cf, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-500">{cf.label}:</span>
                    <span className="font-semibold text-slate-800">{cf.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Items Table */}
        <div className="quotation-items-table border border-slate-200 rounded-lg overflow-x-auto overflow-y-visible bg-white">
          <table className="w-full border-collapse text-left text-[11px]" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10px]">
                <th style={{ width: '4%' }} className="py-2 px-1.5 text-center">#</th>
                <th style={{ width: '24%' }} className="py-2 px-2">Item / Description</th>
                <th style={{ width: '8%' }} className="py-2 px-1 text-center">HSN / SAC</th>
                <th style={{ width: '10%' }} className="py-2 px-1.5 text-right">Rate (₹)</th>
                <th style={{ width: '5%' }} className="py-2 px-1 text-center">Qty</th>
                <th style={{ width: '5%' }} className="py-2 px-1 text-center">Unit</th>
                <th style={{ width: '12%' }} className="py-2 px-1.5 text-right">Taxable Value (₹)</th>
                <th style={{ width: '6%' }} className="py-2 px-1 text-center">Tax %</th>
                <th style={{ width: '11%' }} className="py-2 px-1.5 text-right">Taxable Amount (₹)</th>
                <th style={{ width: '15%' }} className="py-2 px-2 text-right">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {items && items.length > 0 ? (
                items.map((item, idx) => {
                  const calculatedItem = calculateLineItem(item, isInterState);

                  return (
                    <tr key={idx} className="align-top hover:bg-slate-50/50" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <td className="py-2 px-1.5 text-center text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-2 px-2 font-medium text-slate-900 leading-snug break-words">
                        {item.description || item.name || '--'}
                      </td>
                      <td className="py-2 px-1 text-center text-slate-600 font-mono text-[10px]">
                        {item.hsnSac || '--'}
                      </td>
                      <td className="py-2 px-1.5 text-right font-mono text-slate-700">{formatNumberOnly(item.rate)}</td>
                      <td className="py-2 px-1 text-center font-medium text-slate-800">{item.quantity}</td>
                      <td className="py-2 px-1 text-center text-slate-600">{item.unit || 'Nos'}</td>
                      <td className="py-2 px-1.5 text-right font-mono font-medium text-slate-800">{formatNumberOnly(calculatedItem.taxableValue)}</td>
                      <td className="py-2 px-1 text-center text-slate-600">{item.taxRate}%</td>
                      <td className="py-2 px-1.5 text-right font-mono text-slate-700">{formatNumberOnly(calculatedItem.taxAmount)}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                        {formatNumberOnly(calculatedItem.totalAmount)}
                      </td>
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

        {/* 4. Totals, Tax Breakdown & Amount in Words */}
        <div className="grid grid-cols-12 gap-5 items-start no-break pt-1" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          {/* Amount in words & notes */}
          <div className="col-span-7 space-y-2">
            <div>
              <span className="font-bold text-slate-800 text-[11px] block mb-0.5">
                Amount in Words :
              </span>
              <div className="text-[11.5px] font-semibold text-slate-800 italic leading-relaxed">
                {summary.amountInWords || '--'}
              </div>
            </div>

            {notes && (
              <div className="pt-2 text-[11px] text-slate-600 leading-snug">
                <span className="font-bold text-slate-700">Notes: </span>
                <span>{notes}</span>
              </div>
            )}
          </div>

          {/* Right Totals Panel */}
          <div className="col-span-5 space-y-1 text-[11px] pl-4">
            <div className="flex justify-between items-center py-0.5 text-slate-700">
              <span className="font-medium">Taxable Amount</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(summary.taxableAmount || summary.subtotal)}</span>
            </div>

            {/* Individual Tax Rows */}
            {taxRows && taxRows.length > 0 ? (
              taxRows.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center py-0.5 text-slate-700">
                  <span>{t.type || 'GST'} ({t.rate}%)</span>
                  <span className="font-mono font-semibold text-slate-900">{formatINR(t.taxAmount)}</span>
                </div>
              ))
            ) : (
              <>
                {!isInterState ? (
                  <>
                    <div className="flex justify-between items-center py-0.5 text-slate-700">
                      <span>CGST (0%)</span>
                      <span className="font-mono font-semibold text-slate-900">{formatINR(summary.cgstAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 text-slate-700">
                      <span>SGST (0%)</span>
                      <span className="font-mono font-semibold text-slate-900">{formatINR(summary.sgstAmount || 0)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center py-0.5 text-slate-700">
                    <span>IGST (0%)</span>
                    <span className="font-mono font-semibold text-slate-900">{formatINR(summary.igstAmount || 0)}</span>
                  </div>
                )}
              </>
            )}

            {summary.roundOff !== 0 && summary.roundOff !== undefined && (
              <div className="flex justify-between items-center py-0.5 text-slate-600">
                <span>Round Off</span>
                <span className="font-mono">{formatNumberOnly(summary.roundOff)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-300">
              <span className="font-black text-slate-900 text-xs">Grand Total</span>
              <span className="font-black text-[#5B21B6] text-sm font-mono">
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
          titleColor="text-purple-900"
        />

        {/* 6. Bank Details & UPI QR Code */}
        <div className="grid grid-cols-12 gap-5 pt-3 border-t border-slate-200 no-break items-start" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          {/* Payment Information */}
          <div className="col-span-7 space-y-1 text-[11px] text-slate-700">
            <div className="font-bold text-slate-900 text-xs mb-1">
              Payment Information
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-5 text-slate-500 font-medium">Bank Name</span>
              <span className="col-span-1">:</span>
              <span className="col-span-6 font-semibold text-slate-900">{paymentInfo.bankName || company.bankName || '--'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-5 text-slate-500 font-medium">Account Number</span>
              <span className="col-span-1">:</span>
              <span className="col-span-6 font-mono font-semibold text-slate-900">{paymentInfo.accountNumber || company.accountNumber || '--'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-5 text-slate-500 font-medium">IFSC Code</span>
              <span className="col-span-1">:</span>
              <span className="col-span-6 font-mono font-semibold text-slate-900">{paymentInfo.ifscCode || company.ifscCode || '--'}</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-5 text-slate-500 font-medium">Branch</span>
              <span className="col-span-1">:</span>
              <span className="col-span-6 text-slate-800">{paymentInfo.branch || company.branch || '--'}</span>
            </div>
          </div>

          {/* UPI QR Code Container */}
          <div className="col-span-5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              UPI QR Code
            </span>
            <div className="border border-dashed border-slate-300 rounded-xl p-2 w-28 h-28 flex items-center justify-center bg-slate-50/50">
              {qrSrc ? (
                <img src={qrSrc} alt="UPI QR" className="w-24 h-24 object-contain rounded" />
              ) : (
                <span className="text-slate-400 text-xs font-mono">--</span>
              )}
            </div>
            {(paymentInfo.upiId || company.upiId) && (
              <div className="mt-1 max-w-32 text-[9px] leading-tight text-slate-600 break-all">
                UPI: <span className="font-mono font-semibold text-purple-900">{paymentInfo.upiId || company.upiId}</span>
              </div>
            )}
          </div>
        </div>

        {/* 7. Footer: Terms & Authorized Signature */}
        <div className="grid grid-cols-12 gap-5 pt-4 border-t border-slate-200 no-break items-end" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          {/* Terms & Conditions */}
          <div className="col-span-8 text-[10px] text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-0.5">
              Terms & Conditions
            </span>
            <div className="whitespace-pre-line text-slate-600">
              {termsAndConditions || '--'}
            </div>
          </div>

          {/* Authorized Signature */}
          <div className="col-span-4 text-right flex flex-col items-end">
            <div className="text-[10.5px] font-bold text-slate-800 mb-6">
              Authorized Signature
            </div>
            {(company.signature || company.signatureUrl) ? (
              <img
                src={company.signature || company.signatureUrl}
                alt="Authorized Signature"
                className="max-h-12 max-w-[130px] object-contain mb-1"
              />
            ) : (
              <div className="text-slate-400 text-xs font-mono mb-2">--</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

