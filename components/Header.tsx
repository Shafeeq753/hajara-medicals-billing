
import React, { useState } from 'react';
import { View } from '../types';
import { DashboardIcon, SalesIcon, PurchasesIcon, CustomersIcon, MenuIcon, CloseIcon, ProductIcon, SupplierIcon, UserIcon, HistoryIcon, LogoutIcon } from './icons/Icons';
import { User } from '../types';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
  currentUser: User;
  onLogout: () => void;
}

const NavItem = ({ view, label, icon, activeView, onClick }: {
  view: View;
  label: string;
  icon: React.ReactNode;
  activeView: View;
  onClick: (view: View) => void;
}) => (
  <button
    onClick={() => onClick(view)}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      activeView === view
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-black hover:bg-slate-100'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const Header = ({ activeView, setActiveView, currentUser, onLogout }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (view: View) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  }

  const navContent = (
    <>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-black">Hajara Medicals</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <NavItem view="dashboard" label="Dashboard" icon={<DashboardIcon />} activeView={activeView} onClick={handleNavClick} />
        <NavItem view="sales" label="Sales / Billing" icon={<SalesIcon />} activeView={activeView} onClick={handleNavClick} />
        <NavItem view="purchases" label="Purchases" icon={<PurchasesIcon />} activeView={activeView} onClick={handleNavClick} />
        <NavItem view="products" label="Products" icon={<ProductIcon />} activeView={activeView} onClick={handleNavClick} />
        <NavItem view="suppliers" label="Suppliers" icon={<SupplierIcon />} activeView={activeView} onClick={handleNavClick} />
        <NavItem view="customers" label="Customers" icon={<CustomersIcon />} activeView={activeView} onClick={handleNavClick} />
        <NavItem view="users" label="Users" icon={<UserIcon />} activeView={activeView} onClick={handleNavClick} />
        <NavItem view="history" label="History Log" icon={<HistoryIcon />} activeView={activeView} onClick={handleNavClick} />
      </nav>
      <div className="px-4 py-4 mt-auto border-t">
        <div className="text-sm text-black mb-2">Logged in as: <span className="font-bold">{currentUser.name}</span></div>
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-black hover:bg-red-50"
        >
          <LogoutIcon />
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white shadow-md">
        <h1 className="text-xl font-bold text-black">Hajara Medicals</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 shadow-lg">
        {navContent}
      </aside>

      {/* Mobile Menu (Overlay) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
          {navContent}
          <div className="p-4 mt-auto">
            <button onClick={() => setIsMobileMenuOpen(false)} className="w-full py-2 px-4 bg-red-500 text-white rounded-lg">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;