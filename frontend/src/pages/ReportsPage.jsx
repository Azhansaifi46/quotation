import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, FileSpreadsheet, Calendar, Menu } from 'lucide-react';
import { quotationsAPI } from '../api/client';
import { formatINR } from '../utils/numberToWords';

export default function ReportsPage({ onToggleMobileSidebar }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quotationsAPI.getAll().then((res) => {
      if (res.data?.data) {
        setQuotations(res.data.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  const totalValue = quotations.reduce((sum, q) => sum + (q.summary?.grandTotal || 0), 0);
  const totalTaxCollected = quotations.reduce((sum, q) => sum + (q.summary?.totalTax || 0), 0);
  const totalTaxable = quotations.reduce((sum, q) => sum + (q.summary?.taxableAmount || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
      <header className="bg-white/80 lg:bg-transparent backdrop-blur-xs lg:backdrop-blur-none sticky top-0 z-30 py-3.5 sm:py-5 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200/60 shrink-0">
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit'] tracking-tight">
              Quotation & Sales Reports
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Financial analytics, GST collection metrics, and quotation conversion summaries
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 md:p-8 max-w-[1700px] w-full mx-auto space-y-6 sm:space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Quotation Value
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {formatINR(totalValue)}
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Taxable Value
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {formatINR(totalTaxable)}
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 sm:col-span-2 md:col-span-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estimated GST Output
            </span>
            <div className="text-xl sm:text-2xl font-bold text-purple-700 font-mono">
              {formatINR(totalTaxCollected)}
            </div>
          </div>
        </div>

        {/* Breakdown by Status */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Quotation Summary Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Place of Supply</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">GST Tax</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold font-mono">{q.quotationNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{q.customer?.name}</td>
                    <td className="py-3 px-4 text-slate-600">{q.placeOfSupply}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatINR(q.summary?.taxableAmount || 0)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatINR(q.summary?.totalTax || 0)}</td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-purple-700">
                      {formatINR(q.summary?.grandTotal || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
