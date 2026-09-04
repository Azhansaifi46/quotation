import React from 'react';
import { Plus, Trash2, Sliders } from 'lucide-react';

export default function CustomFieldsCard({
  customFields = [],
  onChange,
  onAddField,
  onRemoveField,
}) {
  const handleFieldChange = (index, key, val) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [key]: val };
    onChange(updated);
  };

  const handleAdd = () => {
    onAddField({ label: 'Custom Field', value: '' });
  };

  const handleRemove = (index) => {
    onRemoveField(index);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-600" />
          <span>Business Custom Fields</span>
        </h2>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Field</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 mb-3">
        Add custom information specific to your business (e.g. System Capacity, Vehicle Model, Project Name, Service Duration).
      </p>

      {customFields && customFields.length > 0 ? (
        <div className="space-y-2.5">
          {customFields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-50/70 p-2 rounded-xl border border-slate-200/70">
              <input
                type="text"
                value={field.label}
                onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                placeholder="Field Label (e.g. Capacity)"
                className="w-1/3 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
              <input
                type="text"
                value={field.value}
                onChange={(e) => handleFieldChange(idx, 'value', e.target.value)}
                placeholder="Field Value (e.g. 5 kW On-Grid)"
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remove field"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
          No custom fields added. Click <strong>+ Add Field</strong> to create specialized business attributes.
        </div>
      )}
    </div>
  );
}
