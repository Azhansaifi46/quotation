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
  CreditCard,
  Layers,
  ArrowUpRight,
  Send,
  MessageSquare,
  TrendingUp,
  Printer,
  Calendar,
} from 'lucide-react';
import { quotationsAPI, settingsAPI } from '../api/client';
import { formatINR } from '../utils/numberToWords';
import { exportQuotationToPDF } from '../utils/pdfExport';
import InvoicePreview from '../components/InvoicePreview';
import RecordPaymentModal from '../components/RecordPaymentModal';
import PaymentReceiptModal from '../components/PaymentReceiptModal';
import InvoiceShareModal from '../components/InvoiceShareModal';
import InvoiceDetailsModal from '../components/InvoiceDetailsModal';
import Toast from '../components/Toast';

export default function InvoicesPage({ onToggleMobileSidebar }) {
  const navigate = useNavigate();

  // Active Main Tab: 'invoices' | 'ledger' | 'aging'
  const [activeTab, setActiveTab] = useState('invoices');

  const [invoices, setInvoices] = useState([]);
  const [billingLedger, setBillingLedger] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals state
  const [activePaymentInvoice, setActivePaymentInvoice] = useState(null);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState(null);
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState(null);
  const [activeShareInvoice, setActiveShareInvoice] = useState(null);
  const [activeDetailsInvoice, setActiveDetailsInvoice] = useState(null);
  const [previewInvoiceForPDF, setPreviewInvoiceForPDF] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    settingsAPI.get().then((res) => {
      if (res.data?.data) setCompanySettings(res.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
      if (activeTab === 'ledger') fetchLedger();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, activeTab]);

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

  const fetchLedger = async () => {
    try {
      const res = await quotationsAPI.getBillingLedger();
      if (res.data?.data) {
        setBillingLedger(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching billing ledger:', err);
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
    if (window.confirm(`Are you sure you want to delete Tax Invoice #${number}?`)) {
      try {
        await quotationsAPI.delete(id);
        showToast('Invoice deleted successfully');
        fetchInvoices();
      } catch (err) {
        showToast('Failed to delete invoice', 'error');
      }
    }
  };

  const handleDeletePayment = async (invoiceId, paymentId) => {
    if (window.confirm('Are you sure you want to remove this payment entry?')) {
      try {
        await quotationsAPI.deletePayment(invoiceId, paymentId);
        showToast('Payment record removed successfully');
        fetchInvoices();
        fetchLedger();
        if (activeDetailsInvoice) {
          const updated = await quotationsAPI.getById(invoiceId);
          if (updated.data?.data) setActiveDetailsInvoice(updated.data.data);
        }
      } catch (err) {
        showToast('Failed to remove payment record', 'error');
      }
    }
  };

  const handleDownloadPDF = async (inv) => {
    setPreviewInvoiceForPDF(inv);
    setTimeout(async () => {
      try {
        showToast('Generating Tax Invoice PDF...', 'info');
        await exportQuotationToPDF('modal-invoice-preview-export', inv.quotationNumber);
        showToast('PDF downloaded successfully!');
      } catch (e) {
        showToast('PDF export failed', 'error');
      }
    }, 400);
  };

  // Payment Recorded Success Callback
  const handlePaymentSuccess = (updatedInvoice, newPayment) => {
    setActivePaymentInvoice(null);
    showToast(`Payment of ₹${newPayment.amount} recorded!`);
    fetchInvoices();
    fetchLedger();

    // Prompt receipt view
    setActiveReceiptPayment(newPayment);
    setActiveReceiptInvoice(updatedInvoice);
  };

  // CSV Exporter for Invoices
  const exportInvoicesToCSV = () => {
    if (invoices.length === 0) {
      showToast('No invoices to export', 'warning');
      return;
    }

    const headers = ['Invoice #', 'Customer Name', 'Mobile', 'GSTIN', 'Date', 'Due Date', 'Grand Total', 'Paid Amount', 'Balance Due', 'Status'];
    const rows = invoices.map((inv) => [
      inv.quotationNumber,
      `"${inv.customer?.name || ''}"`,
      inv.customer?.mobile || '',
      inv.customer?.gstin || '',
      inv.quotationDate || '',
      inv.dueDate || '',
      inv.summary?.grandTotal || 0,
      inv.paidAmount || (inv.status === 'Paid' ? inv.summary?.grandTotal : 0) || 0,
      inv.balanceDue !== undefined ? inv.balanceDue : ((inv.summary?.grandTotal || 0) - (inv.paidAmount || 0)),
      inv.status || 'Unpaid',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tax_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Invoices exported to CSV!');
  };

  // CSV Exporter for Billing Ledger
  const exportLedgerToCSV = () => {
    if (billingLedger.length === 0) {
      showToast('No payment transactions to export', 'warning');
      return;
    }

    const headers = ['Receipt #', 'Date', 'Invoice #', 'Customer Name', 'Payment Mode', 'Reference / UTR', 'Amount (₹)', 'Notes'];
    const rows = billingLedger.map((p) => [
      p.receiptNumber || p.paymentId,
      p.paymentDate || '',
      p.invoiceNumber || '',
      `"${p.customer?.name || ''}"`,
      p.paymentMode || 'UPI',
      `"${p.referenceNo || ''}"`,
      p.amount || 0,
      `"${p.notes || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Billing_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Billing Ledger exported to CSV!');
  };

  // Financial KPI Metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.summary?.grandTotal || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => {
    const paid = inv.paidAmount || (inv.status === 'Paid' ? inv.summary?.grandTotal : 0) || 0;
    return sum + paid;
  }, 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueInvoices = invoices.filter(
    (inv) => inv.status !== 'Paid' && inv.dueDate && inv.dueDate < todayStr
  );
  const overdueAmount = overdueInvoices.reduce((sum, inv) => {
    const total = inv.summary?.grandTotal || 0;
    const paid = inv.paidAmount || 0;
    return sum + Math.max(0, total - paid);
  }, 0);

  const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  // Aging Buckets Calculation
  const agingGroups = React.useMemo(() => {
    const buckets = {
      current: [], // not due yet or due within 7 days
      days15: [], // 1-15 days overdue
      days30: [], // 16-30 days overdue
      days30plus: [], // > 30 days overdue
    };

    invoices.forEach((inv) => {
      const grandTotal = inv.summary?.grandTotal || 0;
      const paid = inv.paidAmount || (inv.status === 'Paid' ? grandTotal : 0) || 0;
      const balance = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, grandTotal - paid);

      if (balance > 0 && inv.status !== 'Paid') {
        const due = inv.dueDate ? new Date(inv.dueDate) : null;
        const now = new Date();
        const diffDays = due ? Math.floor((now - due) / (1000 * 60 * 60 * 24)) : 0;

        const entry = { ...inv, balance, diffDays };

        if (diffDays <= 0) {
          buckets.current.push(entry);
        } else if (diffDays <= 15) {
          buckets.days15.push(entry);
        } else if (diffDays <= 30) {
          buckets.days30.push(entry);
        } else {
          buckets.days30plus.push(entry);
        }
      }
    });

    return buckets;
  }, [invoices]);

  const statuses = ['All', 'Unpaid', 'Partial', 'Paid', 'Overdue', 'Draft'];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between shadow-2xs">
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
              Invoices & Billing Hub
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              GST Tax Invoices • Real-time Payment Ledgers • Aging & Receivables Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/invoices/create')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Tax Invoice</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="flex-1 p-4 sm:p-8 max-w-[1700px] w-full mx-auto space-y-6">
        {/* Financial KPI Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Invoiced */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">{formatINR(totalInvoiced)}</div>
            <p className="text-[11px] text-slate-500">{invoices.length} Total Invoices generated</p>
          </div>

          {/* Total Collected (Paid) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 font-mono">{formatINR(totalPaid)}</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, collectionRate)}%` }} />
              </div>
              <span className="text-[10px] font-bold text-emerald-700">{collectionRate}% Paid</span>
            </div>
          </div>

          {/* Outstanding Receivables */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Due</span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 font-mono">{formatINR(totalOutstanding)}</div>
            <p className="text-[11px] text-slate-500">Pending client balance</p>
          </div>

          {/* Overdue Amount */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Balance</span>
              <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 font-mono">{formatINR(overdueAmount)}</div>
            <p className="text-[11px] text-rose-600 font-bold">{overdueInvoices.length} Invoices past due date</p>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'invoices'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Tax Invoices ({invoices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ledger');
                fetchLedger();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payments & Billing Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('aging')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'aging'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Aging & Receivables</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'invoices' && (
              <button
                type="button"
                onClick={exportInvoicesToCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            )}

            {activeTab === 'ledger' && (
              <button
                type="button"
                onClick={exportLedgerToCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Ledger CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: TAX INVOICES TABLE */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {/* Search & Status Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by invoice #, customer name, mobile, GSTIN..."
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
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50/70">
                      <th className="py-3.5 px-4">Invoice #</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4 text-right">Grand Total</th>
                      <th className="py-3.5 px-4 text-right">Paid (₹)</th>
                      <th className="py-3.5 px-4 text-right">Balance (₹)</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          Loading invoices...
                        </td>
                      </tr>
                    ) : invoices.length > 0 ? (
                      invoices.map((inv) => {
                        const grandTotal = inv.summary?.grandTotal || 0;
                        const paid = inv.paidAmount || (inv.status === 'Paid' ? grandTotal : 0) || 0;
                        const balance = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, grandTotal - paid);
                        const isOverdue = inv.status !== 'Paid' && inv.dueDate && inv.dueDate < todayStr;

                        return (
                          <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Invoice Number */}
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => setActiveDetailsInvoice(inv)}
                                className="font-mono font-bold text-purple-700 hover:text-purple-900 hover:underline text-left block"
                              >
                                {inv.quotationNumber}
                              </button>
                              {inv.poNumber && (
                                <span className="text-[10px] text-slate-400 block font-mono">PO: {inv.poNumber}</span>
                              )}
                            </td>

                            {/* Customer */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{inv.customer?.name || '--'}</div>
                              <div className="text-[11px] text-slate-500">
                                {inv.customer?.mobile} {inv.customer?.gstin ? `• ${inv.customer.gstin}` : ''}
                              </div>
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-4 text-slate-600 font-medium">
                              {inv.quotationDate || inv.documentDate}
                            </td>

                            {/* Due Date with Overdue Indicator */}
                            <td className="py-3.5 px-4">
                              <div className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                                {inv.dueDate || '--'}
                              </div>
                              {isOverdue && (
                                <span className="text-[10px] font-black text-rose-600 uppercase">Overdue</span>
                              )}
                            </td>

                            {/* Grand Total */}
                            <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                              {formatINR(grandTotal)}
                            </td>

                            {/* Paid Amount */}
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                              {formatINR(paid)}
                            </td>

                            {/* Balance Due */}
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                              {formatINR(balance)}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              <select
                                value={inv.status || 'Unpaid'}
                                onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                                  inv.status === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : inv.status === 'Partial'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : inv.status === 'Overdue' || isOverdue
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : inv.status === 'Draft'
                                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                <option value="Unpaid">Unpaid</option>
                                <option value="Partial">Partial</option>
                                <option value="Paid">Paid</option>
                                <option value="Overdue">Overdue</option>
                                <option value="Draft">Draft</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>

                            {/* Actions Toolbar */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Record Payment Button */}
                                {balance > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setActivePaymentInvoice(inv)}
                                    title="Record Payment"
                                    className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-bold transition-colors"
                                  >
                                    + Pay
                                  </button>
                                )}

                                {/* Details / View Button */}
                                <button
                                  type="button"
                                  onClick={() => setActiveDetailsInvoice(inv)}
                                  title="View Details & Ledger"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Download PDF */}
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPDF(inv)}
                                  title="Download Tax Invoice PDF"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                </button>

                                {/* Share Modal */}
                                <button
                                  type="button"
                                  onClick={() => setActiveShareInvoice(inv)}
                                  title="Share on WhatsApp/Email"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => navigate(`/invoices/edit/${inv._id}`)}
                                  title="Edit Invoice"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                {/* Duplicate */}
                                <button
                                  type="button"
                                  onClick={() => handleDuplicate(inv._id)}
                                  title="Duplicate Invoice"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>

                                {/* Delete */}
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
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                              <Receipt className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-800">No Tax Invoices Found</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Generate professional GST Tax Invoices with scan-to-pay UPI QR codes, or convert existing quotations directly.
                            </p>
                            <button
                              type="button"
                              onClick={() => navigate('/invoices/create')}
                              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all active:scale-95"
                            >
                              <Plus className="w-4 h-4" />
                              <span>+ Create Tax Invoice</span>
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
        )}

        {/* TAB 2: PAYMENTS & BILLING LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Recorded Client Payments Ledger</h3>
                  <p className="text-[11px] text-slate-500">Chronological history of all received funds and payment receipts</p>
                </div>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                  {billingLedger.length} Payment Transactions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50/70">
                      <th className="py-3.5 px-4">Receipt #</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Invoice #</th>
                      <th className="py-3.5 px-4">Customer Name</th>
                      <th className="py-3.5 px-4">Payment Method</th>
                      <th className="py-3.5 px-4">Reference / UTR</th>
                      <th className="py-3.5 px-4 text-right">Amount Received</th>
                      <th className="py-3.5 px-4 text-right">Receipt Voucher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {billingLedger.length > 0 ? (
                      billingLedger.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                            {p.receiptNumber || p.paymentId}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {p.paymentDate}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                            {p.invoiceNumber}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {p.customer?.name || '--'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {p.paymentMode || 'UPI'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {p.referenceNo || '--'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                            {formatINR(p.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReceiptPayment(p);
                                setActiveReceiptInvoice({
                                  quotationNumber: p.invoiceNumber,
                                  customer: p.customer,
                                  company: p.company || companySettings,
                                  summary: { grandTotal: p.invoiceTotal },
                                  balanceDue: p.balanceDue,
                                });
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400">
                          <div className="max-w-sm mx-auto space-y-2">
                            <CreditCard className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="font-bold text-slate-700">No payment transactions recorded yet</p>
                            <p className="text-xs text-slate-400">
                              When you record payments against invoices, each transaction is logged here and payment receipts can be printed with 1 click.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AGING & RECEIVABLES */}
        {activeTab === 'aging' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Current / Upcoming</span>
                <div className="text-xl font-black text-slate-900 font-mono mt-1">
                  {formatINR(agingGroups.current.reduce((s, x) => s + x.balance, 0))}
                </div>
                <span className="text-[11px] text-slate-400">{agingGroups.current.length} Invoices</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-xs">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">1 - 15 Days Overdue</span>
                <div className="text-xl font-black text-amber-600 font-mono mt-1">
                  {formatINR(agingGroups.days15.reduce((s, x) => s + x.balance, 0))}
                </div>
                <span className="text-[11px] text-slate-400">{agingGroups.days15.length} Invoices</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-orange-200 shadow-xs">
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wider block">16 - 30 Days Overdue</span>
                <div className="text-xl font-black text-orange-600 font-mono mt-1">
                  {formatINR(agingGroups.days30.reduce((s, x) => s + x.balance, 0))}
                </div>
                <span className="text-[11px] text-slate-400">{agingGroups.days30.length} Invoices</span>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-xs">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">30+ Days Overdue</span>
                <div className="text-xl font-black text-rose-600 font-mono mt-1">
                  {formatINR(agingGroups.days30plus.reduce((s, x) => s + x.balance, 0))}
                </div>
                <span className="text-[11px] text-slate-400">{agingGroups.days30plus.length} Invoices</span>
              </div>
            </div>

            {/* Overdue Invoices List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Pending Receivables Follow-Up Queue</h3>

              <div className="space-y-3">
                {[...agingGroups.days30plus, ...agingGroups.days30, ...agingGroups.days15, ...agingGroups.current].map((inv, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-700">{inv.quotationNumber}</span>
                        <span className="font-bold text-slate-900">• {inv.customer?.name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          inv.diffDays > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {inv.diffDays > 0 ? `${inv.diffDays} Days Overdue` : 'Due Soon'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Due Date: {inv.dueDate} | Mobile: {inv.customer?.mobile || 'N/A'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Balance Due</span>
                        <span className="text-base font-mono font-black text-rose-600">{formatINR(inv.balance)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveShareInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp Reminder</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePaymentInvoice(inv)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all active:scale-95"
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>
                ))}

                {[...agingGroups.days30plus, ...agingGroups.days30, ...agingGroups.days15, ...agingGroups.current].length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                    <p className="font-bold text-slate-700">All invoices are settled!</p>
                    <p className="text-xs">No outstanding balances or overdue receivables.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {activePaymentInvoice && (
        <RecordPaymentModal
          invoice={activePaymentInvoice}
          onClose={() => setActivePaymentInvoice(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Payment Receipt Modal */}
      {activeReceiptPayment && activeReceiptInvoice && (
        <PaymentReceiptModal
          payment={activeReceiptPayment}
          invoice={activeReceiptInvoice}
          onClose={() => {
            setActiveReceiptPayment(null);
            setActiveReceiptInvoice(null);
          }}
        />
      )}

      {/* Share Modal */}
      {activeShareInvoice && (
        <InvoiceShareModal
          invoice={activeShareInvoice}
          onClose={() => setActiveShareInvoice(null)}
        />
      )}

      {/* Invoice Details & Payment Ledger Modal */}
      {activeDetailsInvoice && (
        <InvoiceDetailsModal
          invoice={activeDetailsInvoice}
          onClose={() => setActiveDetailsInvoice(null)}
          onRecordPayment={(inv) => {
            setActiveDetailsInvoice(null);
            setActivePaymentInvoice(inv);
          }}
          onViewTaxInvoice={(inv) => {
            setPreviewInvoiceForPDF(inv);
          }}
          onDownloadPDF={handleDownloadPDF}
          onShare={(inv) => {
            setActiveDetailsInvoice(null);
            setActiveShareInvoice(inv);
          }}
          onEdit={(id) => navigate(`/invoices/edit/${id}`)}
          onViewReceipt={(payment, inv) => {
            setActiveReceiptPayment(payment);
            setActiveReceiptInvoice(inv);
          }}
          onDeletePayment={handleDeletePayment}
        />
      )}

      {/* Hidden Container for Tax Invoice PDF Generation */}
      {previewInvoiceForPDF && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <InvoicePreview
            invoiceData={previewInvoiceForPDF}
            companyData={previewInvoiceForPDF.company || companySettings}
            previewId="modal-invoice-preview-export"
          />
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
