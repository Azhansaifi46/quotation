import React, { useState, useEffect } from 'react';
import { Layers, Search, AlertTriangle, CheckCircle, Package, Menu } from 'lucide-react';
import { productsAPI } from '../api/client';
import { formatINR } from '../utils/numberToWords';

export default function InventoryPage({ onToggleMobileSidebar }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    productsAPI.getAll(search).then((res) => {
      if (res.data?.data) setProducts(res.data.data);
    });
  }, [search]);

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
              Inventory & Stock
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Monitor stock levels, warehouse quantities, and product availability
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 md:p-8 max-w-[1700px] w-full mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search inventory items..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3.5 px-6">Item</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">HSN</th>
                  <th className="py-3.5 px-6 text-right">Standard Rate</th>
                  <th className="py-3.5 px-6 text-center">In Stock</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-6 text-slate-600">{p.category}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-500">{p.hsnSac}</td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-800">
                      {formatINR(p.rate)}
                    </td>
                    <td className="py-3.5 px-6 text-center font-bold text-slate-900">
                      {p.stock} {p.unit}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> In Stock
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
