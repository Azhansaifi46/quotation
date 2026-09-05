import React from 'react';
import { Plus, Trash2, PackagePlus, ReceiptText, Sparkles, Percent } from 'lucide-react';
import { formatINR, formatNumberOnly } from '../utils/numberToWords';
import { calculateLineItem } from '../utils/taxCalculator';

export default function ItemsTableCard({
  items,
  summary,
  taxRows = [],
  discount = { type: 'percentage', rate: 0, amount: 0 },
  onAddItem,
  onOpenProductModal,
  onUpdateItem,
  onRemoveItem,
  onAddTaxRow,
  onAutoSplitGST,
  onUpdateTaxRow,
  onRemoveTaxRow,
  onUpdateDiscount,
  isInterState = false,
}) {
  const taxOptions = [0, 5, 12, 18, 28];
  const unitOptions = [
    'Nos',
    'Pcs',
    'Set',
    'Kg',
    'Mtr',
    'SqFt',
    'Hours',
    'Days',
    'Box',
    'Lot',
    'Job',
  ];

  const handleFieldChange = (index, field, value) => {
    onUpdateItem(index, field, value);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Products & Services Items
        </h2>
        <span className="text-[11px] text-slate-400 font-medium sm:hidden">
          Scroll table horizontally ➔
        </span>
      </div>

      {/* Items Table Responsive Container */}
      <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2">
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-2 w-8 text-center">#</th>
              <th className="py-3 px-2.5 min-w-[200px]">
                Item / Service Description <span className="text-rose-500">*</span>
              </th>
              <th className="py-3 px-2 w-20">HSN / SAC</th>
              <th className="py-3 px-2 w-24 text-right">Rate (₹)</th>
              <th className="py-3 px-2 w-16 text-center">Qty</th>
              <th className="py-3 px-2 w-20">Unit</th>
              <th className="py-3 px-2 w-16 text-right">Disc %</th>
              <th className="py-3 px-2 w-28 text-right">Taxable Value (₹)</th>
              <th className="py-3 px-2 w-20">Tax %</th>
              <th className="py-3 px-2 w-28 text-right">Taxable Amount (₹)</th>
              <th className="py-3 px-2 w-32 text-right">Total Amount (₹)</th>
              <th className="py-3 px-2 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const calculatedItem = calculateLineItem(item);

              return (
                <tr
                  key={item._id || idx}
                  className="hover:bg-slate-50/70 transition-colors group align-top"
                >
                  {/* Row Number */}
                  <td className="py-3 px-2 text-center text-xs font-semibold text-slate-400 pt-4">
                    {idx + 1}
                  </td>

                  {/* Description */}
                  <td className="py-2.5 px-2.5">
                    <textarea
                      rows={2}
                      required
                      value={item.description || ''}
                      onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                      placeholder="Item / service description..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all resize-y min-h-[44px]"
                    />
                  </td>

                  {/* HSN / SAC */}
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={item.hsnSac || ''}
                      onChange={(e) => handleFieldChange(idx, 'hsnSac', e.target.value)}
                      placeholder="HSN"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                    />
                  </td>

                  {/* Rate */}
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={item.rate}
                      onChange={(e) => handleFieldChange(idx, 'rate', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-right text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={item.quantity}
                      onChange={(e) => handleFieldChange(idx, 'quantity', e.target.value)}
                      className="w-full px-1.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-center text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                    />
                  </td>

                  {/* Unit */}
                  <td className="py-2.5 px-2">
                    <select
                      value={item.unit || 'Nos'}
                      onChange={(e) => handleFieldChange(idx, 'unit', e.target.value)}
                      className="w-full px-1.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none bg-white font-medium"
                    >
                      {unitOptions.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Line Discount % */}
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={item.discountPercent || ''}
                      onChange={(e) => handleFieldChange(idx, 'discountPercent', e.target.value)}
                      placeholder="0%"
                      className="w-full px-1.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-right text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                    />
                  </td>

                  {/* Taxable Value (Amount Before Tax) */}
                  <td className="py-2.5 px-2">
                    <div className="w-full px-2 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-right text-slate-800 select-all">
                      {formatNumberOnly(calculatedItem.taxableValue)}
                    </div>
                  </td>

                  {/* Tax Rate % */}
                  <td className="py-2.5 px-2">
                    <select
                      value={item.taxRate !== undefined ? item.taxRate : 18}
                      onChange={(e) => handleFieldChange(idx, 'taxRate', Number(e.target.value))}
                      className="w-full px-1.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none bg-white font-semibold"
                    >
                      {taxOptions.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}%
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Taxable Amount (Calculated Tax) */}
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      step="any"
                      value={calculatedItem.taxAmount}
                      onChange={(e) => handleFieldChange(idx, 'taxAmount', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-mono text-right text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none font-medium"
                    />
                  </td>

                  {/* Total Amount (Taxable Value + Taxable Amount) */}
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      step="any"
                      value={calculatedItem.totalAmount}
                      onChange={(e) => handleFieldChange(idx, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-right text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                    />
                  </td>

                  {/* Delete */}
                  <td className="py-2.5 px-2 text-center pt-3.5">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      disabled={items.length <= 1}
                      title="Delete item"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-purple-600" />
          <span>+ Add Item</span>
        </button>

        <button
          type="button"
          onClick={onOpenProductModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 text-purple-700 text-xs font-semibold shadow-2xs transition-all active:scale-95"
        >
          <PackagePlus className="w-4 h-4 text-purple-700" />
          <span>+ Add from Products</span>
        </button>
      </div>

      {/* Dynamic Tax Rows & GST Breakdown Section */}
      <div className="mt-6 pt-5 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-purple-600" />
              <span>Taxes & GST Breakdown</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Add multiple independent CGST / SGST / IGST / VAT tax rows, or click Auto Split GST.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAutoSplitGST}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-semibold shadow-2xs transition-all active:scale-95"
              title="Split total tax rate into CGST (50%) + SGST (50%)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Auto Split GST</span>
            </button>

            <button
              type="button"
              onClick={onAddTaxRow}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-purple-300 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Tax Row</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tax Rows List and Right Summary */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Tax Rows List */}
          <div className="flex-1 space-y-2.5">
            {taxRows && taxRows.length > 0 ? (
              taxRows.map((tRow, tIdx) => (
                <div
                  key={tRow.id || tIdx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 hover:border-purple-200"
                >
                  {/* Tax Type */}
                  <div className="w-full sm:w-28 shrink-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Tax Type
                    </label>
                    <select
                      value={tRow.type || 'CGST'}
                      onChange={(e) => onUpdateTaxRow(tIdx, 'type', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    >
                      <option value="CGST">CGST</option>
                      <option value="SGST">SGST</option>
                      <option value="IGST">IGST</option>
                      <option value="VAT">VAT</option>
                      <option value="Cess">Cess</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Rate % */}
                  <div className="w-full sm:w-24 shrink-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Rate %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={tRow.rate !== undefined ? tRow.rate : ''}
                        onChange={(e) => onUpdateTaxRow(tIdx, 'rate', e.target.value)}
                        placeholder="9"
                        className="w-full px-2.5 py-1.5 pr-6 rounded-lg border border-slate-300 bg-white text-xs font-mono font-medium text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Taxable Amount */}
                  <div className="w-full sm:flex-1 min-w-[120px]">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Taxable Base (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={tRow.taxableAmount !== undefined ? tRow.taxableAmount : ''}
                        onChange={(e) => onUpdateTaxRow(tIdx, 'taxableAmount', e.target.value)}
                        placeholder="Taxable amount"
                        className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                      />
                    </div>
                  </div>

                  {/* Calculated Tax Amount */}
                  <div className="w-full sm:w-36 shrink-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Tax Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={tRow.taxAmount !== undefined ? tRow.taxAmount : ''}
                        onChange={(e) => onUpdateTaxRow(tIdx, 'taxAmount', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                      />
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="pt-2 sm:pt-4 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onRemoveTaxRow(tIdx)}
                      title="Delete tax row"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                No tax rows added. Click <strong>"+ Add Tax Row"</strong> or <strong>"Auto Split GST"</strong>.
              </div>
            )}
          </div>

          {/* Right Summary Box */}
          <div className="w-full lg:w-80 space-y-2 text-xs font-medium text-slate-600 bg-slate-50/90 p-4 rounded-xl border border-slate-200 shrink-0">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-700">Subtotal (Gross)</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatINR(summary.subtotal || summary.taxableAmount)}
              </span>
            </div>

            {/* Document Discount Field */}
            {onUpdateDiscount && (
              <div className="flex justify-between items-center py-1 text-slate-700">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3 text-purple-600" />
                  <span>Doc Discount (%):</span>
                </span>
                <div className="w-24">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={discount?.rate || ''}
                    onChange={(e) => onUpdateDiscount({ ...discount, rate: e.target.value })}
                    placeholder="0%"
                    className="w-full px-2 py-1 text-right text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-700">Taxable Base</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatINR(summary.taxableAmount)}
              </span>
            </div>

            {/* Dynamic Tax Rows */}
            <div className="space-y-1.5 py-1">
              {taxRows && taxRows.length > 0 ? (
                taxRows.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span>
                      {t.type} @ {t.rate}%
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {formatINR(t.taxAmount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-slate-400 italic">No tax rows</div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-700">Total Tax</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatINR(summary.totalTax)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300">
              <span className="font-bold text-slate-900 text-sm">Grand Total</span>
              <span className="font-extrabold text-[#6d28d9] text-base font-mono">
                {formatINR(summary.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
