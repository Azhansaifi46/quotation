import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Download,
  Trash2,
  Copy,
  Edit,
  ArrowRight,
  Menu,
  CheckCircle2,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { quotationsAPI } from '../api/client';
import { formatINR } from '../utils/numberToWords';
import { exportQuotationToPDF } from '../utils/pdfExport';
import QuotationPreview from '../components/QuotationPreview';
import Toast from '../components/Toast';

export default function QuotationsListPage({ onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const timer = setTimeout(fetchQuotations, 250);
    return () => clearTimeout(timer);
  }, [search, docTypeFilter, statusFilter]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await quotationsAPI.getAll({
        documentType: docTypeFilter === 'All' ? '' : docTypeFilter,
        search,
        status: statusFilter,
      });
      if (res.data?.data) {
        setQuotations(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await quotationsAPI.updateStatus(id, newStatus);
      showToast(`Status updated to ${newStatus}`);
      fetchQuotations();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleConvertToInvoice = async (id) => {
    try {
      const res = await quotationsAPI.convertToInvoice(id);
      showToast(res.data?.message || 'Converted to Invoice!');
      fetchQuotations();
      navigate('/invoices');
    } catch (err) {
      showToast('Conversion failed', 'error');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await quotationsAPI.duplicate(id);
      showToast(res.data?.message || 'Document duplicated!');
      fetchQuotations();
    } catch (err) {
      showToast('Duplication failed', 'error');
    }
  };

  const handleDelete = async (id, number) => {
    if (window.confirm(`Are you sure you want to delete Document #${number}?`)) {
      try {
        await quotationsAPI.delete(id);
        showToast('Document deleted successfully');
        fetchQuotations();
      } catch (err) {
        showToast('Failed to delete', 'error');
      }
    }
  };

  const handleDownloadPDF = async (q) => {
    setPreviewDoc(q);
    setTimeout(async () => {
      try {
        showToast('Generating PDF...', 'info');
        await exportQuotationToPDF('modal-doc-preview', q.quotationNumber);
        showToast('PDF downloaded successfully!');
      } catch (e) {
        showToast('PDF export failed', 'error');
      }
    }, 400);
  };

  const docTypes = ['All', 'Quotation', 'Estimate', 'Proforma Invoice', 'Purchase Order', 'Receipt'];
  const statuses = ['All', 'Draft', 'Sent', 'Approved', 'Rejected', 'Expired'];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Quotations & Estimates
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Create, duplicate, track status, and convert quotations directly to Tax Invoices
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/create?type=Quotation')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Quotation</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Document Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {docTypes.map((dt) => (
            <button
              key={dt}
              type="button"
              onClick={() => setDocTypeFilter(dt)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                docTypeFilter === dt
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {dt}
            </button>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by number, customer name, mobile..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {statuses.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Quotations List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50/70">
                  <th className="py-3.5 px-4">Doc #</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading documents...
                    </td>
                  </tr>
                ) : quotations.length > 0 ? (
                  quotations.map((q) => (
                    <tr key={q._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                        {q.quotationNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                          {q.documentType || 'Quotation'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{q.customer?.name || '--'}</div>
                        <div className="text-[11px] text-slate-500">{q.customer?.mobile}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {q.quotationDate}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(q.summary?.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={q.status || 'Draft'}
                          onChange={(e) => handleStatusChange(q._id, e.target.value)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                            q.status === 'Approved' || q.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : q.status === 'Sent'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : q.status === 'Rejected' || q.status === 'Expired'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Expired">Expired</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Convert to Invoice Button */}
                          {q.documentType !== 'Invoice' && (
                            <button
                              type="button"
                              onClick={() => handleConvertToInvoice(q._id)}
                              title="Convert to Tax Invoice"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-bold transition-all"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>To Invoice</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate(`/edit/${q._id}`)}
                            title="Edit Document"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(q)}
                            title="Download PDF"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(q._id)}
                            title="Duplicate"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(q._id, q.quotationNumber)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                          <FileText className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">No quotations yet</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          You haven't created any quotations or estimates yet. Click below to generate your first document.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/create?type=Quotation')}
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Create Quotation</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hidden container for background PDF rendering */}
      {previewDoc && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <QuotationPreview
            quotationData={previewDoc}
            companyData={previewDoc.company}
            previewId="modal-doc-preview"
          />
        </div>
      )}

      {/* Toast Alert */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
