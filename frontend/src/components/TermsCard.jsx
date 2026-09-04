import React from 'react';

export default function TermsCard({ terms, onChange }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
      <h2 className="text-base font-bold text-slate-900 mb-4 tracking-tight">
        Terms & Conditions
      </h2>

      <div>
        <textarea
          rows={7}
          value={terms || ''}
          onChange={(e) => onChange('termsAndConditions', e.target.value)}
          placeholder="Enter terms and conditions"
          className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all full-text-wrap resize-y leading-relaxed font-normal"
        />
      </div>
    </div>
  );
}
