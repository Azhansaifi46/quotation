import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Save, Download, Plus, Loader2, Menu } from 'lucide-react';

export default function Header({
  title = 'Create Quotation',
  breadcrumb = [
    { label: 'Dashboard', link: '/dashboard' },
    { label: 'Quotations', link: '/quotations' },
    { label: 'Create', link: '' },
  ],
  onPreview,
  onSave,
  onDownloadPDF,
  onNewQuotation,
  onToggleMobileSidebar,
  isSaving = false,
  isExporting = false,
  showActions = true,
}) {
  return (
    <header className="bg-white/80 lg:bg-transparent backdrop-blur-xs lg:backdrop-blur-none sticky top-0 z-30 py-3.5 sm:py-5 px-4 sm:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 border-b border-slate-200/60 shrink-0">
      {/* Title & Breadcrumb & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit'] tracking-tight leading-tight">
            {title}
          </h1>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium overflow-x-auto whitespace-nowrap">
            {breadcrumb.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300">&gt;</span>}
                {crumb.link ? (
                  <Link to={crumb.link} className="hover:text-purple-600 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Preview Button */}
          <button
            type="button"
            onClick={onPreview}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all duration-150 active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
            <span>Preview</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all duration-150 active:scale-95 disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={onDownloadPDF}
            disabled={isExporting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4.5 py-2 rounded-xl bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-xs font-semibold shadow-md shadow-purple-600/25 transition-all duration-150 active:scale-95 disabled:opacity-60 whitespace-nowrap"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            )}
            <span>{isExporting ? 'Generating...' : 'Download PDF'}</span>
          </button>

          {/* New Quotation Button */}
          <button
            type="button"
            onClick={onNewQuotation}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4.5 py-2 rounded-xl bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-xs font-semibold shadow-md shadow-purple-600/25 transition-all duration-150 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            <span>+ New Quotation</span>
          </button>
        </div>
      )}
    </header>
  );
}
