import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

import LoginPage from './pages/LoginPage';
import CreateQuotationPage from './pages/CreateQuotationPage';
import QuotationsListPage from './pages/QuotationsListPage';
import InvoicesPage from './pages/InvoicesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import TemplatesPage from './pages/TemplatesPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';

function PageRoute({ Component }) {
  const { toggleMobileSidebar } = useOutletContext();
  return <Component onToggleMobileSidebar={toggleMobileSidebar} />;
}

function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-sans relative overflow-x-hidden">
      {/* Left Sidebar (Drawer on mobile, fixed column on desktop) */}
      <Sidebar mobileOpen={isMobileSidebarOpen} onCloseMobile={closeMobileSidebar} />

      {/* Main Content View with desktop margin for sidebar */}
      <main className="flex-1 flex flex-col min-w-0 lg:pl-64 overflow-y-auto min-h-screen">
        <Outlet context={{ toggleMobileSidebar }} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login & Register Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Main App Layout & Nested Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PageRoute Component={DashboardPage} />} />
            <Route path="dashboard" element={<PageRoute Component={DashboardPage} />} />
            <Route path="create" element={<PageRoute Component={CreateQuotationPage} />} />
            <Route path="edit/:id" element={<PageRoute Component={CreateQuotationPage} />} />
            <Route path="create/:id" element={<PageRoute Component={CreateQuotationPage} />} />
            <Route path="quotations" element={<PageRoute Component={QuotationsListPage} />} />
            <Route path="invoices" element={<PageRoute Component={InvoicesPage} />} />
            <Route path="invoices/create" element={<PageRoute Component={CreateInvoicePage} />} />
            <Route path="invoices/edit/:id" element={<PageRoute Component={CreateInvoicePage} />} />
            <Route path="customers" element={<PageRoute Component={CustomersPage} />} />
            <Route path="products" element={<PageRoute Component={ProductsPage} />} />
            <Route path="templates" element={<PageRoute Component={TemplatesPage} />} />
            <Route path="inventory" element={<PageRoute Component={InventoryPage} />} />
            <Route path="reports" element={<PageRoute Component={ReportsPage} />} />
            <Route path="settings" element={<PageRoute Component={SettingsPage} />} />
            <Route path="profile" element={<PageRoute Component={ProfilePage} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


