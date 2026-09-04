import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Receipt,
  Users,
  Package,
  Layers,
  LayoutTemplate,
  BarChart3,
  Settings,
  User,
  LogOut,
  X,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../api/client';

export default function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState(null);

  useEffect(() => {
    async function loadCompany() {
      try {
        const res = await settingsAPI.get();
        if (res.data?.data) {
          setCompanyData(res.data.data);
        }
      } catch (err) {
        // silently fallback
      }
    }
    loadCompany();

    const handleSettingsUpdated = () => {
      loadCompany();
    };
    window.addEventListener('company_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('company_settings_updated', handleSettingsUpdated);
  }, []);

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Create Quotation',
      path: '/create',
      icon: FilePlus,
    },
    {
      label: 'Quotations',
      path: '/quotations',
      icon: FileText,
    },
    {
      label: 'Invoices & Billing',
      path: '/invoices',
      icon: Receipt,
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: Users,
    },
    {
      label: 'Products / Items',
      path: '/products',
      icon: Package,
    },
    {
      label: 'Inventory',
      path: '/inventory',
      icon: Layers,
    },
    {
      label: 'Templates',
      path: '/templates',
      icon: LayoutTemplate,
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: BarChart3,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: User,
    },
  ];

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0D1222] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/60">
            <div className="flex items-center gap-3 min-w-0">
              {companyData?.logoUrl ? (
                <img
                  src={companyData.logoUrl}
                  alt="Business Logo"
                  className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1 shrink-0 border border-slate-700/50"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0 font-bold text-white text-base">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-extrabold text-white text-xs tracking-wider uppercase leading-tight truncate">
                  {companyData?.companyName || 'MY BUSINESS'}
                </h1>
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest truncate">
                  {companyData?.tagline || (companyData?.businessCategory ? `${companyData.businessCategory} Suite` : 'Billing & Quotations')}
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden shrink-0 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Area: Logout & Business Card */}
        <div className="p-3 space-y-3 border-t border-slate-800/60 bg-[#0A0E1A]">
          {/* Logout Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>

          {/* Business Quotations Pro Card */}
          <div className="bg-slate-900/90 text-slate-300 p-3.5 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col items-center text-center">
            <div className="w-8 h-8 mb-1 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <p className="text-[11px] font-medium text-slate-300 leading-snug">
              Fast & professional business quotation generator.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
