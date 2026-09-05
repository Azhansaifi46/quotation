import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Trash2,
  Copy,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Menu,
  FileSpreadsheet,
  Share2,
} from 'lucide-react';
import { quotationsAPI } from '../api/client';
import { formatINR } from '../utils/numberToWords';
import { exportQuotationToPDF } from '../utils/pdfExport';
import QuotationPreview from '../components/QuotationPreview';
import Toast from '../components/Toast';

export default function InvoicesPage({ onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const timer = setTimeout(fetchInvoices, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await quotationsAPI.getAll({
        documentType: 'Invoice',
        search,
        status: statusFilter,
      });
      if (res.data?.data) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      showToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await quotationsAPI.updateStatus(id, newStatus);
      showToast(`Invoice status updated to ${newStatus}`);
      fetchInvoices();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await quotationsAPI.duplicate(id);
      showToast(res.data?.message || 'Invoice duplicated successfully!');
      fetchInvoices();
    } catch (err) {
      showToast('Failed to duplicate invoice', 'error');
    }
  };

  const handleDelete = async (id, number) => {
    if (window.confirm(`Are you sure you want to delete Invoice #${number}?`)) {
      try {
        await quotationsAPI.delete(id);
        showToast('Invoice deleted successfully');
        fetchInvoices();
      } catch (err) {
        showToast('Failed to delete invoice', 'error');
      }
    }
  };

  const handleDownloadPDF = async (inv) => {
    setPreviewInvoice(inv);
    setTimeout(async () => {
      try {
        showToast('Generating PDF...', 'info');
        await exportQuotationToPDF('modal-invoice-preview', inv.quotationNumber);
        showToast('PDF downloaded successfully!');
      } catch (e) {
        showToast('PDF export failed', 'error');
      }
    }, 400);
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.summary?.grandTotal || 0), 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + (inv.summary?.grandTotal || 0), 0);

  const statuses = ['All', 'Unpaid', 'Paid', 'Partial', 'Overdue', 'Draft'];

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
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Invoices & Billing
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Manage tax invoices, track client payments, and export PDFs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/create?type=Invoice')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Invoice</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        {/* KPI Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Total Invoices</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{invoices.length}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Total Invoiced Amount</span>
            <div className="text-2xl font-black text-indigo-700 font-mono mt-1">{formatINR(totalInvoiced)}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Total Collected (Paid)</span>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{formatINR(totalPaid)}</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, customer name, mobile, email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
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

        {/* Invoices List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50/70">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Client / Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading invoices...
                    </td>
                  </tr>
                ) : invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                        {inv.quotationNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.customer?.name || '--'}</div>
                        <div className="text-[11px] text-slate-500">{inv.customer?.mobile}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {inv.quotationDate}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {inv.dueDate || '--'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(inv.summary?.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={inv.status || 'Unpaid'}
                          onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.status === 'Unpaid'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Paid">Paid</option>
                          <option value="Partial">Partial</option>
                          <option value="Overdue">Overdue</option>
                          <option value="Draft">Draft</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/edit/${inv._id}`)}
                            title="Edit Invoice"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(inv)}
                            title="Download PDF"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(inv._id)}
                            title="Duplicate Invoice"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(inv._id, inv.quotationNumber)}
                            title="Delete Invoice"
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
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">No invoices generated yet</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          You can create fresh tax invoices directly or convert approved quotations into invoices with 1 click.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/create?type=Invoice')}
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Create Invoice</span>
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
      {previewInvoice && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <QuotationPreview
            quotationData={previewInvoice}
            companyData={previewInvoice.company}
            previewId="modal-invoice-preview"
          />
        </div>
      )}

      {/* Toast Alert */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
