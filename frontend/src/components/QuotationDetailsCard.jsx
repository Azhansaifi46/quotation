import React from 'react';
import { Calendar, Hash, MapPin, FileText, LayoutTemplate } from 'lucide-react';
import { INDIAN_STATES } from '../utils/indianStates';

export default function QuotationDetailsCard({
  documentType = 'Quotation',
  templateId = 'navy',
  quotationNumber,
  quotationDate,
  validUntil,
  dueDate,
  placeOfSupply,
  placeOfSupplyCode,
  onChange,
  onDocumentTypeChange,
}) {
  const handleStateChange = (e) => {
    const selectedStateName = e.target.value;
    const stateObj = INDIAN_STATES.find((s) => s.name === selectedStateName);
    onChange('placeOfSupply', selectedStateName);
    if (stateObj) {
      onChange('placeOfSupplyCode', stateObj.code);
    }
  };

  const documentTypes = [
    { value: 'Quotation', label: 'Quotation' },
    { value: 'Invoice', label: 'Tax Invoice' },
    { value: 'Estimate', label: 'Estimate' },
    { value: 'Proforma Invoice', label: 'Proforma Invoice' },
    { value: 'Purchase Order', label: 'Purchase Order' },
    { value: 'Receipt', label: 'Receipt' },
  ];

  const templates = [
    { value: 'navy', label: 'Navy Executive' },
    { value: 'corporate', label: 'Modern Corporate' },
    { value: 'minimal', label: 'Minimalist Clean' },
    { value: 'emerald', label: 'Emerald Tech' },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-600" />
          <span>Document Details</span>
        </h2>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          {documentType}
        </span>
      </div>

      {/* Row 0: Document Type & Template Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Document Type</span>
          </label>
          <select
            value={documentType}
            onChange={(e) => onDocumentTypeChange ? onDocumentTypeChange(e.target.value) : onChange('documentType', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
          >
            {documentTypes.map((dt) => (
              <option key={dt.value} value={dt.value}>
                {dt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <LayoutTemplate className="w-3.5 h-3.5 text-slate-400" />
            <span>Template Style</span>
          </label>
          <select
            value={templateId}
            onChange={(e) => onChange('templateId', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-purple-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
          >
            {templates.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 1: Document Number & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>{documentType} Number <span className="text-rose-500">*</span></span>
          </label>
          <input
            type="text"
            required
            value={quotationNumber || ''}
            onChange={(e) => onChange('quotationNumber', e.target.value)}
            placeholder="QT-2026-1001"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date of Issue</span>
          </label>
          <input
            type="date"
            value={quotationDate || ''}
            onChange={(e) => onChange('quotationDate', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Row 2: Valid Until / Due Date & Place of Supply */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{documentType === 'Invoice' ? 'Payment Due Date' : 'Valid Until'}</span>
          </label>
          <input
            type="date"
            value={documentType === 'Invoice' ? dueDate || '' : validUntil || ''}
            onChange={(e) =>
              onChange(documentType === 'Invoice' ? 'dueDate' : 'validUntil', e.target.value)
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Place of Supply (State)</span>
          </label>
          <select
            value={placeOfSupply || 'Maharashtra'}
            onChange={handleStateChange}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all shadow-2xs"
          >
            {INDIAN_STATES.map((state) => (
              <option key={state.code} value={state.name}>
                {state.name} ({state.code})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
