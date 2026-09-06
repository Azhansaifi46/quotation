import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Package,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Menu,
  Building2,
  Sparkles,
} from 'lucide-react';
import { dashboardAPI, settingsAPI } from '../api/client';
import { formatINR } from '../utils/numberToWords';

export default function DashboardPage({ onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashRes, setRes] = await Promise.all([
          dashboardAPI.getStats(),
          settingsAPI.get(),
        ]);
        if (dashRes.data?.data) {
          setStats(dashRes.data.data);
        }
        if (setRes.data?.data) {
          setCompany(setRes.data.data);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] pb-20">
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
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {company?.companyName || 'Business Dashboard'}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Industry Category: <strong className="text-purple-700">{company?.businessCategory || 'Commercial'}</strong> | Real-time Quotation & Billing Metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/invoices/create')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all active:scale-95"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>+ Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/create?type=Quotation')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Quotation</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-8 max-w-[1700px] w-full mx-auto space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Quotations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Total Quotations</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats?.totalQuotations || 0}
              </div>
              <div className="text-[11px] text-purple-700 font-semibold mt-1 flex items-center gap-1">
                <span>{stats?.statusCounts?.Draft || 0} Drafts</span>
                <span>•</span>
                <span>{stats?.statusCounts?.Approved || 0} Approved</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Total Invoices */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Tax Invoices</span>
              <div className="text-2xl font-black text-indigo-700 mt-1">
                {stats?.totalInvoices || 0}
              </div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                {stats?.statusCounts?.Paid || 0} Paid • {stats?.statusCounts?.Unpaid || 0} Pending
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Total Sales Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Total Pipeline Value</span>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {formatINR(stats?.totalValue || 0)}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                Total Quotations & Billing
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Customers & Products */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Clients & Catalog</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats?.totalCustomers || 0} <span className="text-sm font-normal text-slate-400">Clients</span>
              </div>
              <div className="text-[11px] text-slate-500 font-semibold mt-1">
                {stats?.totalProducts || 0} Products & Services
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Business Actions */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Business Platform</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Create professional quotations & billing in seconds
            </h2>
            <p className="text-xs text-purple-200 mt-1">
              Customized for {company?.businessCategory || 'any'} business with automatic GST calculation, multiple templates, and A4 PDF export.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/create?type=Quotation')}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-extrabold shadow-md transition-all active:scale-95"
            >
              + Create Quotation
            </button>
            <button
              type="button"
              onClick={() => navigate('/invoices/create')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md transition-all active:scale-95"
            >
              + Create Invoice
            </button>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all active:scale-95"
            >
              Catalog
            </button>
          </div>
        </div>

        {/* Recent Documents Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Recent Quotations & Invoices</h3>
              <p className="text-[11px] text-slate-500">Latest active documents created across your business</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/quotations')}
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50/70">
                  <th className="py-3 px-6">Doc #</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
                  stats.recentDocuments.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-purple-700">
                        {doc.quotationNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                          {doc.documentType || 'Quotation'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {doc.customer?.name || '--'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {doc.quotationDate}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(doc.summary?.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                            doc.status === 'Approved' || doc.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : doc.status === 'Sent'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {doc.status || 'Draft'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/edit/${doc._id}`)}
                          className="text-xs font-bold text-purple-700 hover:text-purple-900"
                        >
                          Open ➔
                        </button>
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
                        <h4 className="text-sm font-bold text-slate-800">No quotations or invoices yet</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Your account is ready! Create your first professional quotation or estimate with custom pricing and automated GST calculations.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/create?type=Quotation')}
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create First Quotation</span>
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
    </div>
  );
}
