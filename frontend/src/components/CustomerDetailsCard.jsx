import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Search } from 'lucide-react';
import { customersAPI } from '../api/client';

export default function CustomerDetailsCard({ customer, onChange, onSelectCustomer }) {
  const [savedCustomers, setSavedCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    customersAPI.getAll().then((res) => {
      if (res.data?.data) {
        setSavedCustomers(res.data.data);
      }
    }).catch(err => console.error('Error fetching customers:', err));
  }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    onChange('name', val);
    setShowSuggestions(val.trim().length > 0);
  };

  const filteredCustomers = savedCustomers.filter((c) =>
    c.name.toLowerCase().includes((customer.name || '').toLowerCase()) ||
    c.mobile.includes(customer.name || '')
  );

  const handleSelect = (c) => {
    onSelectCustomer(c);
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs relative">
      <h2 className="text-base font-bold text-slate-900 mb-4 tracking-tight">
        Customer Details
      </h2>

      <div className="space-y-4">
        {/* Customer Name */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Customer Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={customer.name || ''}
            onChange={handleNameChange}
            onFocus={() => setShowSuggestions((customer.name || '').trim().length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Enter customer name"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
          />

          {/* Customer Autocomplete Dropdown */}
          {showSuggestions && filteredCustomers.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
              <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3 h-3" /> Select Existing Customer
              </div>
              {filteredCustomers.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="w-full text-left px-3.5 py-2 hover:bg-purple-50 flex flex-col gap-0.5 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-800">{c.name}</span>
                  <span className="text-[11px] text-slate-500">{c.mobile} • {c.email || 'No email'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Mobile Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={customer.mobile || ''}
            onChange={(e) => onChange('mobile', e.target.value)}
            placeholder="Enter mobile number"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={customer.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="Enter email address"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
          />
        </div>

        {/* Billing Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Billing Address <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={customer.billingAddress || ''}
            onChange={(e) => onChange('billingAddress', e.target.value)}
            placeholder="Enter billing address"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all auto-expand"
          />
        </div>
      </div>
    </div>
  );
}
