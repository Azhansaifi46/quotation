import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { formatINR, numberToWordsIndian } from '../utils/numberToWords';

export default function InvoicePreview({
  invoiceData = {},
  companyData = null,
  isInterState = false,
  previewId = 'tax-invoice-preview-a4',
  copyType = 'Original for Recipient', // 'Original for Recipient' | 'Duplicate for Transporter' | 'Triplicate for Supplier'
  showCopySwitcher = true,
}) {
  const [selectedCopy, setSelectedCopy] = useState(copyType);
  const [qrSrc, setQrSrc] = useState('');
  const previewViewportRef = useRef(null);
  const previewDocumentRef = useRef(null);
  const [mobileFit, setMobileFit] = useState(null);

  const company = companyData || invoiceData.company || {
    name: 'SUN BRIGHT ENTERPRISE',
    tagline: 'Quotation, Invoicing & Billing Solutions',
    address: 'Plot No. 42, Phase-II, Industrial Energy Park, Pune, Maharashtra - 411028',
    mobile: '+91 98765 43210',
    email: 'contact@sunbrightenterprise.com',
    website: 'www.sunbrightenterprise.com',
    gstin: '27AABCS1429B1Z8',
    pan: 'AABCS1429B',
    state: 'Maharashtra',
    stateCode: '27',
    bankName: 'State Bank of India',
    accountNumber: '4098765432198',
    ifscCode: 'SBIN0001429',
    branch: 'Industrial Park Branch, Pune',
    upiId: 'sunbrightenterprise@sbi',
    authorizedSignatory: 'Authorized Signatory',
  };

  const customer = invoiceData.customer || {};
  const items = invoiceData.items || [];
  const summary = invoiceData.summary || {};
  const grandTotal = summary.grandTotal || 0;
  const paidAmount = invoiceData.paidAmount || (invoiceData.status === 'Paid' ? grandTotal : 0);
  const balanceDue = invoiceData.balanceDue !== undefined ? invoiceData.balanceDue : Math.max(0, grandTotal - paidAmount);
  const paymentInfo = invoiceData.paymentInfo || {};
  const upiId = paymentInfo.upiId || company.upiId || '';

  // Generate Scan-to-Pay UPI QR Code with exact amount
  useEffect(() => {
    if (paymentInfo?.upiQrCode) {
      setQrSrc(paymentInfo.upiQrCode);
    } else if (upiId) {
      const payAmount = balanceDue > 0 ? balanceDue : grandTotal;
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
        company?.name || 'Business'
      )}&cu=INR${payAmount > 0 ? `&am=${payAmount}` : ''}&tn=${encodeURIComponent(`Invoice ${invoiceData.quotationNumber || ''}`)}`;

      QRCode.toDataURL(upiUrl, { width: 130, margin: 1 })
        .then((url) => setQrSrc(url))
        .catch(() => setQrSrc(''));
    } else {
      setQrSrc('');
    }
  }, [paymentInfo, company.name, company.upiId, grandTotal, balanceDue, upiId, invoiceData.quotationNumber]);

  // Responsive mobile scaling
  useLayoutEffect(() => {
    const viewport = previewViewportRef.current;
    const documentElement = previewDocumentRef.current;
    if (!viewport || !documentElement) return undefined;

    const updateMobileFit = () => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        documentElement.style.removeProperty('width');
        documentElement.style.removeProperty('max-width');
        setMobileFit(null);
        return;
      }

      documentElement.style.setProperty('width', '800px', 'important');
      documentElement.style.setProperty('max-width', 'none', 'important');
      const scale = Math.min(1, viewport.clientWidth / 800);
      setMobileFit({
        scale,
        height: documentElement.scrollHeight * scale,
      });
    };

    const observer = new ResizeObserver(updateMobileFit);
    observer.observe(viewport);
    observer.observe(documentElement);
    updateMobileFit();

    return () => observer.disconnect();
  }, []);

  // Compute HSN/SAC GST Breakdown Summary if not pre-provided
  const gstBreakdown = React.useMemo(() => {
    if (invoiceData.gstSummary && invoiceData.gstSummary.length > 0) {
      return invoiceData.gstSummary;
    }
    const hsnMap = {};
    items.forEach((it) => {
      const hsn = it.hsnSac || 'OTHER';
      const taxable = parseFloat(it.taxableValue || it.taxableAmount) || 0;
      const rate = parseFloat(it.taxRate) || 0;
      const taxAmt = parseFloat(it.taxAmount) || (taxable * rate) / 100;

      if (!hsnMap[hsn]) {
        hsnMap[hsn] = {
          hsnSac: hsn,
          taxableValue: 0,
          cgstRate: isInterState ? 0 : rate / 2,
          cgstAmount: 0,
          sgstRate: isInterState ? 0 : rate / 2,
          sgstAmount: 0,
          igstRate: isInterState ? rate : 0,
          igstAmount: 0,
          totalTax: 0,
        };
      }
      hsnMap[hsn].taxableValue += taxable;
      hsnMap[hsn].totalTax += taxAmt;
      if (isInterState) {
        hsnMap[hsn].igstAmount += taxAmt;
      } else {
        hsnMap[hsn].cgstAmount += taxAmt / 2;
        hsnMap[hsn].sgstAmount += taxAmt / 2;
      }
    });
    return Object.values(hsnMap);
  }, [items, invoiceData.gstSummary, isInterState]);

  const words = summary.amountInWords || (grandTotal > 0 ? numberToWordsIndian(grandTotal) : '');

  // Status Badge / Watermark helper
  const getStatusBadge = () => {
    const status = invoiceData.status || (balanceDue <= 0 ? 'Paid' : 'Unpaid');
    switch (status) {
      case 'Paid':
        return { text: 'PAID', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'Partial':
        return { text: 'PARTIALLY PAID', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'Overdue':
        return { text: 'OVERDUE', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'Draft':
        return { text: 'DRAFT', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
      default:
        return { text: 'UNPAID', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="flex flex-col items-center w-full">
      {/* Copy Type Selector (Interactive bar before printing) */}
      {showCopySwitcher && (
        <div className="w-full max-w-[800px] mb-3 flex items-center justify-between bg-slate-100 p-2 rounded-xl border border-slate-200 text-xs print:hidden">
          <span className="font-bold text-slate-700 ml-1">Invoice Copy:</span>
          <div className="flex items-center gap-1.5">
            {['Original for Recipient', 'Duplicate for Transporter', 'Triplicate for Supplier'].map((cp) => (
              <button
                key={cp}
                type="button"
                onClick={() => setSelectedCopy(cp)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedCopy === cp
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cp}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* A4 Tax Invoice Document Container */}
      <div
        ref={previewViewportRef}
        className="tax-invoice-viewport w-full flex justify-center py-2 px-1 print:p-0"
        style={mobileFit ? { height: `${mobileFit.height}px` } : undefined}
      >
        <div
          ref={previewDocumentRef}
          id={previewId}
          className="tax-invoice-document w-full max-w-[800px] min-h-[1130px] bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-8 font-sans print:p-6 print:shadow-none print:border-none print:rounded-none relative flex flex-col justify-between"
          style={{
            boxSizing: 'border-box',
            ...(mobileFit
              ? {
                  width: '800px',
                  maxWidth: 'none',
                  flexShrink: 0,
                  minHeight: 0,
                  transform: `scale(${mobileFit.scale})`,
                  transformOrigin: 'top center',
                  transition: 'none',
                }
              : {}),
          }}
        >
          <div>
            {/* Top Bar: TAX INVOICE & COPY INDICATOR */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black tracking-tight text-slate-950 uppercase font-mono">
                  TAX INVOICE
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border ${statusBadge.bg}`}>
                  {statusBadge.text}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                  {selectedCopy}
                </span>
              </div>
            </div>

            {/* Company & Invoice Meta Header */}
            <div className="grid grid-cols-12 gap-6 pb-5 border-b border-slate-200">
              {/* Left: Company Details */}
              <div className="col-span-7 space-y-1.5">
                <div className="flex items-center gap-3">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt="Logo"
                      className="w-12 h-12 object-contain rounded-lg border border-slate-200 p-1"
                    />
                  ) : null}
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase">
                      {company.name || 'SUN BRIGHT ENTERPRISE'}
                    </h2>
                    {company.tagline && (
                      <p className="text-[11px] font-medium text-slate-500">{company.tagline}</p>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 leading-relaxed pt-1 space-y-0.5">
                  <p className="text-slate-700">{company.address}</p>
                  <p>
                    {company.mobile && <span><strong>Ph:</strong> {company.mobile} </span>}
                    {company.email && <span>| <strong>Email:</strong> {company.email}</span>}
                  </p>
                  <div className="flex items-center gap-3 font-semibold text-slate-800 pt-0.5">
                    {company.gstin && <span><strong>GSTIN:</strong> {company.gstin}</span>}
                    {company.pan && <span>| <strong>PAN:</strong> {company.pan}</span>}
                  </div>
                  <p className="text-slate-700">
                    <strong>State:</strong> {company.state || 'Maharashtra'} ({company.stateCode || '27'})
                  </p>
                </div>
              </div>

              {/* Right: Invoice Reference Box */}
              <div className="col-span-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between border-b border-slate-200/80 pb-1">
                  <span className="text-slate-500 font-semibold">Invoice No:</span>
                  <span className="font-mono font-black text-purple-700 text-xs">
                    {invoiceData.quotationNumber || 'INV-2026-0001'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1">
                  <span className="text-slate-500 font-semibold">Invoice Date:</span>
                  <span className="font-bold text-slate-900">
                    {invoiceData.quotationDate || invoiceData.documentDate || new Date().toISOString().split('T')[0]}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1">
                  <span className="text-slate-500 font-semibold">Payment Terms:</span>
                  <span className="font-bold text-slate-800">
                    {invoiceData.paymentTerms || 'Due on Receipt'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1">
                  <span className="text-slate-500 font-semibold">Due Date:</span>
                  <span className="font-bold text-slate-900">
                    {invoiceData.dueDate || '--'}
                  </span>
                </div>
                {invoiceData.poNumber && (
                  <div className="flex justify-between border-b border-slate-200/80 pb-1">
                    <span className="text-slate-500 font-semibold">PO Ref #:</span>
                    <span className="font-bold text-slate-900">{invoiceData.poNumber}</span>
                  </div>
                )}
                {invoiceData.eWayBill && (
                  <div className="flex justify-between border-b border-slate-200/80 pb-1">
                    <span className="text-slate-500 font-semibold">E-Way Bill:</span>
                    <span className="font-bold text-slate-900">{invoiceData.eWayBill}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Reverse Charge:</span>
                  <span className="font-bold text-slate-800">
                    {invoiceData.reverseCharge ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Billed To & Shipped To Panels */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-[11px]">
              {/* Billed To */}
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                  Billed To (Customer Details)
                </span>
                <div className="font-bold text-slate-900 text-xs">
                  {customer.name || 'Cash Customer'}
                </div>
                <div className="text-slate-600 leading-relaxed">
                  {customer.billingAddress || customer.address || 'Address Not Provided'}
                </div>
                <div className="pt-0.5 space-y-0.5 text-slate-700">
                  {customer.mobile && <div><strong>Mobile:</strong> {customer.mobile}</div>}
                  {customer.email && <div><strong>Email:</strong> {customer.email}</div>}
                  {customer.gstin && <div><strong>GSTIN:</strong> {customer.gstin}</div>}
                  {customer.pan && <div><strong>PAN:</strong> {customer.pan}</div>}
                  <div>
                    <strong>Place of Supply:</strong> {invoiceData.placeOfSupply || 'Maharashtra'} ({invoiceData.placeOfSupplyCode || '27'})
                  </div>
                </div>
              </div>

              {/* Shipped To */}
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Shipped To (Delivery Destination)
                </span>
                <div className="font-bold text-slate-900 text-xs">
                  {customer.shippingAddress ? (customer.name || 'Recipient') : (customer.name || 'Same as Billed To')}
                </div>
                <div className="text-slate-600 leading-relaxed">
                  {customer.shippingAddress || customer.billingAddress || customer.address || 'Same as Billing Address'}
                </div>
                <div className="pt-0.5 text-slate-700">
                  <div><strong>State:</strong> {invoiceData.placeOfSupply || 'Maharashtra'} ({invoiceData.placeOfSupplyCode || '27'})</div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-8">#</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-2 text-center w-16">HSN/SAC</th>
                    <th className="py-2.5 px-2 text-center w-12">Qty</th>
                    <th className="py-2.5 px-2 text-center w-12">Unit</th>
                    <th className="py-2.5 px-3 text-right w-20">Rate (₹)</th>
                    <th className="py-2.5 px-2 text-right w-16">Disc (₹)</th>
                    <th className="py-2.5 px-3 text-right w-20">Taxable (₹)</th>
                    <th className="py-2.5 px-2 text-center w-12">GST%</th>
                    <th className="py-2.5 px-3 text-right w-20">Tax (₹)</th>
                    <th className="py-2.5 px-3 text-right w-24">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((it, idx) => {
                    const taxable = parseFloat(it.taxableValue || it.taxableAmount) || 0;
                    const taxAmt = parseFloat(it.taxAmount) || 0;
                    const lineTotal = parseFloat(it.amount || it.totalAmount) || (taxable + taxAmt);
                    const disc = parseFloat(it.discountAmount) || 0;

                    return (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                        <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{it.description || it.name || 'Item'}</div>
                          {it.name && it.description && it.name !== it.description && (
                            <div className="text-[10px] text-slate-500">{it.name}</div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600">{it.hsnSac || '--'}</td>
                        <td className="py-2 px-2 text-center font-bold text-slate-800">{it.quantity}</td>
                        <td className="py-2 px-2 text-center text-slate-600">{it.unit || 'Nos'}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-800">{formatINR(it.rate)}</td>
                        <td className="py-2 px-2 text-right font-mono text-slate-600">{disc > 0 ? formatINR(disc) : '-'}</td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">{formatINR(taxable)}</td>
                        <td className="py-2 px-2 text-center font-mono text-purple-700 font-bold">{it.taxRate}%</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">{formatINR(taxAmt)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">{formatINR(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations & Summary Grid */}
            <div className="grid grid-cols-12 gap-6 mt-4 pt-2">
              {/* Left Column: Words & HSN GST Table */}
              <div className="col-span-7 space-y-3">
                {/* Amount in Words */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                    Invoice Amount in Words:
                  </span>
                  <div className="text-[11px] font-bold text-slate-900 italic">
                    INR {words || 'Zero Rupees Only'}
                  </div>
                </div>

                {/* HSN/SAC Summary Table */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    GST Tax Summary
                  </div>
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <th className="py-1.5 px-2 font-bold">HSN/SAC</th>
                        <th className="py-1.5 px-2 text-right font-bold">Taxable (₹)</th>
                        {!isInterState ? (
                          <>
                            <th className="py-1.5 px-2 text-right font-bold">CGST (₹)</th>
                            <th className="py-1.5 px-2 text-right font-bold">SGST (₹)</th>
                          </>
                        ) : (
                          <th className="py-1.5 px-2 text-right font-bold">IGST (₹)</th>
                        )}
                        <th className="py-1.5 px-2 text-right font-bold">Total Tax (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {gstBreakdown.map((row, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-2 font-mono font-bold text-slate-700">{row.hsnSac}</td>
                          <td className="py-1.5 px-2 text-right font-mono">{formatINR(row.taxableValue)}</td>
                          {!isInterState ? (
                            <>
                              <td className="py-1.5 px-2 text-right font-mono">{formatINR(row.cgstAmount)}</td>
                              <td className="py-1.5 px-2 text-right font-mono">{formatINR(row.sgstAmount)}</td>
                            </>
                          ) : (
                            <td className="py-1.5 px-2 text-right font-mono">{formatINR(row.igstAmount)}</td>
                          )}
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">{formatINR(row.totalTax)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Totals & Payments Breakdown */}
              <div className="col-span-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Amount (Subtotal):</span>
                  <span className="font-mono font-semibold text-slate-900">{formatINR(summary.taxableAmount)}</span>
                </div>

                {!isInterState ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST Total:</span>
                      <span className="font-mono font-semibold text-slate-900">{formatINR(summary.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST Total:</span>
                      <span className="font-mono font-semibold text-slate-900">{formatINR(summary.sgstAmount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST Total:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatINR(summary.igstAmount || summary.totalTax)}</span>
                  </div>
                )}

                {(invoiceData.shippingCharges || summary.shippingCharges) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping / Freight:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatINR(invoiceData.shippingCharges || summary.shippingCharges)}
                    </span>
                  </div>
                )}

                {(invoiceData.roundOff || summary.roundOff) !== 0 && (invoiceData.roundOff || summary.roundOff) !== undefined && (
                  <div className="flex justify-between text-slate-600">
                    <span>Round Off:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatINR(invoiceData.roundOff || summary.roundOff)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900 font-bold text-xs">
                  <span className="text-slate-950 font-black">Invoice Grand Total:</span>
                  <span className="font-mono font-black text-purple-700 text-sm">{formatINR(grandTotal)}</span>
                </div>

                {/* Paid & Balance Breakdown */}
                <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[11px]">
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Amount Paid / Received:</span>
                    <span className="font-mono">{formatINR(paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-extrabold text-xs">
                    <span>Balance Due / Payable:</span>
                    <span className="font-mono">{formatINR(balanceDue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer: Bank Info + UPI QR + Signatory */}
          <div className="mt-6 pt-4 border-t-2 border-slate-900 grid grid-cols-12 gap-6 text-[11px]">
            {/* Bank Details & Dynamic UPI QR */}
            <div className="col-span-8 flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              {qrSrc && (
                <div className="shrink-0 text-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                  <img src={qrSrc} alt="UPI QR Code" className="w-20 h-20" />
                  <span className="text-[9px] font-bold text-purple-700 block mt-0.5">Scan to Pay</span>
                </div>
              )}
              <div className="space-y-0.5 text-slate-700">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                  Bank & Payment Details
                </span>
                <div><strong>Bank Name:</strong> {paymentInfo.bankName || company.bankName || 'State Bank of India'}</div>
                <div><strong>A/C No:</strong> {paymentInfo.accountNumber || company.accountNumber || '4098765432198'}</div>
                <div><strong>IFSC Code:</strong> {paymentInfo.ifscCode || company.ifscCode || 'SBIN0001429'}</div>
                <div><strong>UPI ID:</strong> {upiId || 'enterprise@upi'}</div>
              </div>
            </div>

            {/* Authorized Signatory */}
            <div className="col-span-4 flex flex-col justify-between items-center text-center p-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                For {company.name || 'SUN BRIGHT ENTERPRISE'}
              </span>
              <div className="h-12 flex items-center justify-center">
                {company.signatureUrl ? (
                  <img src={company.signatureUrl} alt="Signature" className="max-h-12 object-contain" />
                ) : (
                  <span className="text-[10px] font-mono text-slate-300 italic">[Company Seal & Signature]</span>
                )}
              </div>
              <div className="border-t border-slate-300 w-full pt-1">
                <span className="text-[10px] font-bold text-slate-800 uppercase block">
                  {company.authorizedSignatory || 'Authorized Signatory'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
