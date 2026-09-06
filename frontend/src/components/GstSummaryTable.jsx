import React from 'react';
import { formatINR } from '../utils/numberToWords';

/**
 * Professional Multi-Level GST Summary Table
 * Exactly adheres to Indian GST Compliance & Multi-Tier Columns:
 * - Intra-State: Taxable Value | Central Tax (Rate, Amount) | State Tax (Rate, Amount) | Total Tax Amount
 * - Inter-State: Taxable Value | Integrated Tax (Rate, Amount) | Total Tax Amount
 * - Separate rows for each distinct GST slab (0%, 5%, 12%, 18%, 28%, custom)
 * - Highlights bottom Total Taxable Value, Total Central Tax, Total State Tax, Total Integrated Tax & Total Tax Amount
 */
export default function GstSummaryTable({
  gstSummary = [],
  items = [],
  isInterState = false,
  title = 'GST SUMMARY',
  titleColor = 'text-slate-900',
  className = '',
}) {
  // Aggregate items by GST taxRate slab with 100% calculation accuracy
  const slabRows = React.useMemo(() => {
    // 1. If raw line items are provided, calculate directly from items
    if (items && items.length > 0) {
      const rateMap = {};

      items.forEach((it) => {
        const rate = parseFloat(it.rate) || 0;
        const qty = parseFloat(it.quantity) || 0;
        const gross = rate * qty;
        let disc = parseFloat(it.discountAmount) || 0;
        const discPct = parseFloat(it.discountPercent) || 0;
        if (discPct > 0 && (!it.discountAmount || it.discountAmount === '0')) {
          disc = (gross * discPct) / 100;
        }
        const taxable = Math.max(0, parseFloat(it.taxableValue || it.taxableAmount) || (gross - disc));
        const taxRate = parseFloat(it.taxRate) || 0;

        if (!rateMap[taxRate]) {
          rateMap[taxRate] = {
            taxRate,
            taxableValue: 0,
          };
        }
        rateMap[taxRate].taxableValue += taxable;
      });

      return Object.values(rateMap)
        .sort((a, b) => a.taxRate - b.taxRate)
        .map((slab) => {
          const taxableVal = Math.round(slab.taxableValue * 100) / 100;
          const taxRate = slab.taxRate;

          if (isInterState) {
            const igstAmt = Math.round(((taxableVal * taxRate) / 100) * 100) / 100;
            return {
              taxRate,
              taxableValue: taxableVal,
              cgstRate: 0,
              cgstAmount: 0,
              sgstRate: 0,
              sgstAmount: 0,
              igstRate: taxRate,
              igstAmount: igstAmt,
              totalTax: igstAmt,
            };
          } else {
            const halfRate = Math.round((taxRate / 2) * 100) / 100;
            const totalTaxAmt = Math.round(((taxableVal * taxRate) / 100) * 100) / 100;
            const cgstAmt = Math.round((totalTaxAmt / 2) * 100) / 100;
            const sgstAmt = Math.round((totalTaxAmt - cgstAmt) * 100) / 100;
            return {
              taxRate,
              taxableValue: taxableVal,
              cgstRate: halfRate,
              cgstAmount: cgstAmt,
              sgstRate: halfRate,
              sgstAmount: sgstAmt,
              igstRate: 0,
              igstAmount: 0,
              totalTax: totalTaxAmt,
            };
          }
        });
    }

    // 2. Otherwise aggregate and group the provided gstSummary array by tax rate
    if (gstSummary && gstSummary.length > 0) {
      const rateMap = {};

      gstSummary.forEach((g) => {
        const rate = parseFloat(
          g.taxRate !== undefined
            ? g.taxRate
            : isInterState
            ? g.igstRate || 0
            : (parseFloat(g.cgstRate || 0) + parseFloat(g.sgstRate || 0))
        ) || 0;
        const taxable = parseFloat(g.taxableValue) || 0;
        const cgst = parseFloat(g.cgstAmount) || 0;
        const sgst = parseFloat(g.sgstAmount) || 0;
        const igst = parseFloat(g.igstAmount) || 0;
        const totTax = parseFloat(g.totalTax) || (cgst + sgst + igst);

        if (!rateMap[rate]) {
          rateMap[rate] = {
            taxRate: rate,
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
        rateMap[rate].taxableValue += taxable;
        rateMap[rate].cgstAmount += cgst;
        rateMap[rate].sgstAmount += sgst;
        rateMap[rate].igstAmount += igst;
        rateMap[rate].totalTax += totTax;
      });

      return Object.values(rateMap).sort((a, b) => a.taxRate - b.taxRate);
    }

    return [];
  }, [items, gstSummary, isInterState]);

  if (slabRows.length === 0) {
    return null;
  }

  // Calculate totals across all slabs
  const totalTaxable = slabRows.reduce((sum, row) => sum + (parseFloat(row.taxableValue) || 0), 0);
  const totalCGST = slabRows.reduce((sum, row) => sum + (parseFloat(row.cgstAmount) || 0), 0);
  const totalSGST = slabRows.reduce((sum, row) => sum + (parseFloat(row.sgstAmount) || 0), 0);
  const totalIGST = slabRows.reduce((sum, row) => sum + (parseFloat(row.igstAmount) || 0), 0);
  const totalTaxAll = slabRows.reduce((sum, row) => sum + (parseFloat(row.totalTax) || 0), 0);

  return (
    <div className={`space-y-2 no-break ${className}`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      {/* Title */}
      <h4 className={`text-xs font-bold tracking-wider uppercase ${titleColor}`}>
        {title}
      </h4>

      {/* Table Container */}
      <div className="gst-summary-table border border-slate-250 rounded-xl overflow-x-auto overflow-y-visible bg-white shadow-2xs">
        <table className="w-full border-collapse text-left text-[11px]" style={{ tableLayout: 'fixed' }}>
          {isInterState ? (
            /* Inter-State Column Structure: Taxable Value | Integrated Tax | Total Tax Amount */
            <>
              <colgroup>
                <col style={{ width: '34%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>

              <thead>
                {/* Header Tier 1 */}
                <tr className="bg-[#F1F4F9] text-slate-800 font-bold border-b border-slate-250">
                  <th
                    rowSpan={2}
                    className="py-2.5 px-3 text-right align-middle font-bold text-[10px] uppercase text-slate-800"
                  >
                    Taxable Value
                  </th>
                  <th
                    colSpan={2}
                    className="py-1.5 px-2 text-center text-slate-800 font-bold border-l border-r border-slate-200 uppercase text-[10px]"
                  >
                    Integrated Tax
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2.5 px-3 text-right align-middle font-bold text-[10px] uppercase text-slate-800"
                  >
                    Total Tax Amount
                  </th>
                </tr>

                {/* Header Tier 2 */}
                <tr className="bg-[#F1F4F9] text-slate-700 font-bold border-b border-slate-250 text-[10px]">
                  <th className="py-1.5 px-2 text-center border-l border-slate-200 uppercase">
                    Rate
                  </th>
                  <th className="py-1.5 px-2.5 text-right border-r border-slate-200 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-150">
                {slabRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 transition-colors"
                    style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                  >
                    {/* Taxable Value */}
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatINR(row.taxableValue)}
                    </td>

                    {/* Integrated Tax (Rate + Amount) */}
                    <td className="py-2.5 px-2 text-center text-slate-700 font-medium border-l border-slate-100 font-mono">
                      {row.taxRate > 0 ? `${row.igstRate}%` : '0%'}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 border-r border-slate-100">
                      {formatINR(row.igstAmount)}
                    </td>

                    {/* Total Tax Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-950">
                      {formatINR(row.igstAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr
                  className="bg-slate-100/95 text-slate-900 font-bold border-t-2 border-slate-300 text-[11px]"
                  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                >
                  {/* Total Taxable Value */}
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block tracking-wider -mb-0.5">Total Taxable</span>
                    {formatINR(totalTaxable)}
                  </td>

                  {/* Total Integrated Tax */}
                  <td className="py-2.5 px-2 text-center text-slate-400 font-medium border-l border-slate-250">
                    —
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-950 border-r border-slate-250">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block tracking-wider -mb-0.5">Total IGST</span>
                    {formatINR(totalIGST)}
                  </td>

                  {/* Total Tax Amount */}
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                    <span className="text-[9px] font-extrabold text-purple-700 uppercase block tracking-wider -mb-0.5">Total Tax</span>
                    {formatINR(totalTaxAll)}
                  </td>
                </tr>
              </tfoot>
            </>
          ) : (
            /* Intra-State Column Structure: Taxable Value | Central Tax | State Tax | Total Tax Amount */
            <>
              <colgroup>
                <col style={{ width: '24%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>

              <thead>
                {/* Header Tier 1: Main Multi-Level Categories */}
                <tr className="bg-[#F1F4F9] text-slate-800 font-bold border-b border-slate-250">
                  <th
                    rowSpan={2}
                    className="py-2.5 px-3 text-right align-middle font-bold text-[10px] uppercase text-slate-800"
                  >
                    Taxable Value
                  </th>
                  <th
                    colSpan={2}
                    className="py-1.5 px-2 text-center text-slate-800 font-bold border-l border-r border-slate-200 uppercase text-[10px]"
                  >
                    Central Tax
                  </th>
                  <th
                    colSpan={2}
                    className="py-1.5 px-2 text-center text-slate-800 font-bold border-r border-slate-200 uppercase text-[10px]"
                  >
                    State Tax
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2.5 px-3 text-right align-middle font-bold text-[10px] uppercase text-slate-800"
                  >
                    Total Tax Amount
                  </th>
                </tr>

                {/* Header Tier 2: Column Sub-Headers */}
                <tr className="bg-[#F1F4F9] text-slate-700 font-bold border-b border-slate-250 text-[10px]">
                  {/* Central Tax Sub-headers */}
                  <th className="py-1.5 px-2 text-center border-l border-slate-200 uppercase">
                    Rate
                  </th>
                  <th className="py-1.5 px-2.5 text-right border-r border-slate-200 uppercase">
                    Amount
                  </th>

                  {/* State Tax Sub-headers */}
                  <th className="py-1.5 px-2 text-center uppercase">
                    Rate
                  </th>
                  <th className="py-1.5 px-2.5 text-right border-r border-slate-200 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-150">
                {slabRows.map((row, idx) => {
                  const rowTotalTax = Math.round(((parseFloat(row.cgstAmount) || 0) + (parseFloat(row.sgstAmount) || 0)) * 100) / 100;
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 transition-colors"
                      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                    >
                      {/* Taxable Value */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatINR(row.taxableValue)}
                      </td>

                      {/* Central Tax (Rate + Amount) */}
                      <td className="py-2.5 px-2 text-center text-slate-700 font-medium border-l border-slate-100 font-mono">
                        {row.taxRate > 0 ? `${row.cgstRate}%` : '0%'}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 border-r border-slate-100">
                        {formatINR(row.cgstAmount)}
                      </td>

                      {/* State Tax (Rate + Amount) */}
                      <td className="py-2.5 px-2 text-center text-slate-700 font-medium font-mono">
                        {row.taxRate > 0 ? `${row.sgstRate}%` : '0%'}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 border-r border-slate-100">
                        {formatINR(row.sgstAmount)}
                      </td>

                      {/* Total Tax Amount (Central Tax + State Tax) */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-950">
                        {formatINR(rowTotalTax)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Bottom Highlighted TOTAL Row */}
              <tfoot>
                <tr
                  className="bg-slate-100/95 text-slate-900 font-bold border-t-2 border-slate-300 text-[11px]"
                  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                >
                  {/* Total Taxable Value */}
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block tracking-wider -mb-0.5">Total Taxable</span>
                    {formatINR(totalTaxable)}
                  </td>

                  {/* Total Central Tax */}
                  <td className="py-2.5 px-2 text-center text-slate-400 font-medium border-l border-slate-250">
                    —
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-950 border-r border-slate-250">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block tracking-wider -mb-0.5">Total CGST</span>
                    {formatINR(totalCGST)}
                  </td>

                  {/* Total State Tax */}
                  <td className="py-2.5 px-2 text-center text-slate-400 font-medium">
                    —
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-950 border-r border-slate-250">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block tracking-wider -mb-0.5">Total SGST</span>
                    {formatINR(totalSGST)}
                  </td>

                  {/* Total Tax Amount (Central Tax + State Tax Total) */}
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                    <span className="text-[9px] font-extrabold text-purple-700 uppercase block tracking-wider -mb-0.5">Total Tax</span>
                    {formatINR(totalTaxAll)}
                  </td>
                </tr>
              </tfoot>
            </>
          )}
        </table>
      </div>
    </div>
  );
}
