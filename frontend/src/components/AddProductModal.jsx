import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Package, Layers } from 'lucide-react';
import { productsAPI } from '../api/client';
import { formatINR } from '../utils/numberToWords';

export default function AddProductModal({ isOpen, onClose, onSelectProduct }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  const categories = [
    'All',
    'Solar',
    'Electronics',
    'Electrical',
    'Hardware',
    'Furniture',
    'Services',
    'General',
  ];

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, search, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const cat = selectedCategory === 'All' ? '' : selectedCategory;
      const res = await productsAPI.getAll(search, cat);
      if (res.data?.data) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Select from Products & Services Catalog
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any item to add it directly to the quotation or billing document
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or services by name, SKU, HSN/SAC..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading catalog...</div>
          ) : products.length > 0 ? (
            products.map((p) => (
              <div
                key={p._id}
                onClick={() => {
                  onSelectProduct(p);
                  onClose();
                }}
                className="pt-2 first:pt-0 p-3 rounded-xl hover:bg-purple-50/50 transition-colors cursor-pointer flex items-center justify-between gap-4 group border border-transparent hover:border-purple-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-purple-700">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {p.type || 'Product'}
                    </span>
                    {p.category && (
                      <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                        {p.category}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {p.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10.5px] text-slate-400 mt-1 font-mono">
                    <span>HSN: {p.hsnSac || '--'}</span>
                    <span>GST: {p.gstRate}%</span>
                    <span>Unit: {p.unit || 'Nos'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-extrabold text-sm text-slate-900 font-mono">
                    {formatINR(p.rate)}
                  </div>
                  <button
                    type="button"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 group-hover:text-purple-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Select</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No products found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
