import React from 'react';
import { formatNumberOnly } from '../utils/numberToWords';

/**
 * Pixel-Perfect Professional GST Summary Table
 * Matches exact multi-level header layout:
 * - Two-tier header with "Central Tax" (Rate | Amount) & "State Tax" (Rate | Amount)
 * - Clean HSN/Tax breakdown for all items
 * - Bottom highlighted TOTAL row with full sums
 */
export default function GstSummaryTable({
  gstSummary = [],
  isInterState = false,
  title = 'GST SUMMARY',
  titleColor = 'text-purple-900',
  className = '',
}) {
  if (!gstSummary || gstSummary.length === 0) {
    return null;
  }

  // Calculate totals for the summary footer
  const totalTaxable = gstSummary.reduce((sum, g) => sum + (parseFloat(g.taxableValue) || 0), 0);
  const totalCGST = gstSummary.reduce((sum, g) => sum + (parseFloat(g.cgstAmount) || 0), 0);
  const totalSGST = gstSummary.reduce((sum, g) => sum + (parseFloat(g.sgstAmount) || 0), 0);
  const totalIGST = gstSummary.reduce((sum, g) => sum + (parseFloat(g.igstAmount) || 0), 0);
  const totalTaxAll = gstSummary.reduce((sum, g) => sum + (parseFloat(g.totalTax) || 0), 0);

  return (
    <div className={`space-y-2 no-break ${className}`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      {/* Title */}
      <h4 className={`text-xs font-bold tracking-wider uppercase ${titleColor}`}>
        {title}
      </h4>

      {/* Table Container */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <table className="w-full border-collapse text-left text-[11px]" style={{ tableLayout: 'fixed' }}>
          <thead>
            {/* Header Tier 1: Main Categories */}
            <tr className="bg-[#F1F4F9] text-slate-800 font-bold border-b border-slate-200">
              <th rowSpan={2} style={{ width: '16%' }} className="py-2 px-3 text-center align-middle font-bold text-[10px]">
                HSN / SAC
              </th>
              <th rowSpan={2} style={{ width: '22%' }} className="py-2 px-3 text-right align-middle font-bold text-[10px]">
                Taxable Value
              </th>
              {!isInterState ? (
                <>
                  <th
                    colSpan={2}
                    style={{ width: '26%' }}
                    className="py-1.5 px-2 text-center text-slate-800 font-bold border-l border-r border-slate-200"
                  >
                    Central Tax
                  </th>
                  <th
                    colSpan={2}
                    style={{ width: '26%' }}
                    className="py-1.5 px-2 text-center text-slate-800 font-bold border-r border-slate-200"
                  >
                    State Tax
                  </th>
                </>
              ) : (
                <th
                  colSpan={2}
                  style={{ width: '42%' }}
                  className="py-1.5 px-2 text-center text-slate-800 font-bold border-l border-r border-slate-200"
                >
                  Integrated Tax
                </th>
              )}
              <th rowSpan={2} style={{ width: '10%' }} className="py-2 px-3 text-right align-middle font-bold text-[10px]">
                Total Tax
              </th>
            </tr>

            {/* Header Tier 2: Column Subheaders */}
            <tr className="bg-[#F1F4F9] text-slate-700 font-bold border-b border-slate-200 text-[10px]">
              {!isInterState ? (
                <>
                  <th style={{ width: '10%' }} className="py-1.5 px-2 text-center border-l border-slate-200">
                    Rate
                  </th>
                  <th style={{ width: '16%' }} className="py-1.5 px-2.5 text-right border-r border-slate-200">
                    Amount
                  </th>
                  <th style={{ width: '10%' }} className="py-1.5 px-2 text-center">
                    Rate
                  </th>
                  <th style={{ width: '16%' }} className="py-1.5 px-2.5 text-right border-r border-slate-200">
                    Amount
                  </th>
                </>
              ) : (
                <>
                  <th style={{ width: '16%' }} className="py-1.5 px-2 text-center border-l border-slate-200">
                    Rate
                  </th>
                  <th style={{ width: '26%' }} className="py-1.5 px-2.5 text-right border-r border-slate-200">
                    Amount
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-150">
            {gstSummary.map((g, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                {/* HSN / SAC */}
                <td className="py-2.5 px-3 text-center font-mono text-slate-800 font-medium">
                  {g.hsnSac || 'General'}
                </td>

                {/* Taxable Value */}
                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                  {formatNumberOnly(g.taxableValue)}
                </td>

                {/* Central Tax / Integrated Tax */}
                {!isInterState ? (
                  <>
                    <td className="py-2.5 px-2 text-center text-slate-700 font-medium border-l border-slate-100">
                      {g.cgstRate}%
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 border-r border-slate-100">
                      {formatNumberOnly(g.cgstAmount)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-700 font-medium">
                      {g.sgstRate}%
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 border-r border-slate-100">
                      {formatNumberOnly(g.sgstAmount)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2.5 px-2 text-center text-slate-700 font-medium border-l border-slate-100">
                      {g.igstRate}%
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-slate-900 border-r border-slate-100">
                      {formatNumberOnly(g.igstAmount)}
                    </td>
                  </>
                )}

                {/* Total Tax for this group */}
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {formatNumberOnly(g.totalTax)}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Footer TOTAL Row */}
          <tfoot>
            <tr className="bg-slate-100/90 text-slate-900 font-bold border-t-2 border-slate-250 text-[11px]" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <td className="py-2.5 px-3 text-center font-black tracking-wider text-slate-900 uppercase">
                TOTAL
              </td>
              <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                {formatNumberOnly(totalTaxable)}
              </td>
              {!isInterState ? (
                <>
                  <td className="py-2.5 px-2 text-center text-slate-500 font-medium border-l border-slate-200">
                    --
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-900 border-r border-slate-200">
                    {formatNumberOnly(totalCGST)}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-500 font-medium">
                    --
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-900 border-r border-slate-200">
                    {formatNumberOnly(totalSGST)}
                  </td>
                </>
              ) : (
                <>
                  <td className="py-2.5 px-2 text-center text-slate-500 font-medium border-l border-slate-200">
                    --
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-900 border-r border-slate-200">
                    {formatNumberOnly(totalIGST)}
                  </td>
                </>
              )}
              <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                {formatNumberOnly(totalTaxAll)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
