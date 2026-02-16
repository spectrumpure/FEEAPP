
import React, { useState } from 'react';
import { useApp } from '../store';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  CheckCircle, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  UserCircle,
  AlertCircle
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  roles?: UserRole[];
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, roles }) => {
  const { currentUser } = useApp();
  if (roles && currentUser && !roles.includes(currentUser.role)) return null;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
};

export const Layout: React.FC<{ children: React.ReactNode, activeView: string, onViewChange: (view: string) => void }> = ({ 
  children, 
  activeView, 
  onViewChange 
}) => {
  const { currentUser, logout } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.PRINCIPAL] },
    { id: 'students', label: 'Student Directory', icon: <Users size={20} />, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.PRINCIPAL] },
    { id: 'fee-entry', label: 'Fee Entry', icon: <CreditCard size={20} />, roles: [UserRole.ACCOUNTANT] },
    { id: 'approvals', label: 'Approvals', icon: <CheckCircle size={20} />, roles: [UserRole.ACCOUNTANT] },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} />, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.PRINCIPAL] },
    { id: 'certificates', label: 'Certificates', icon: <FileText size={20} />, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'defaulters', label: 'Defaulter List', icon: <AlertCircle size={20} />, roles: [UserRole.ADMIN, UserRole.EXAM_CELL, UserRole.PRINCIPAL, UserRole.ACCOUNTANT] },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, roles: [UserRole.ADMIN] },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      <style>{`
        @media print {
          body, html, #root, .min-h-screen, .flex {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            display: block !important;
            background: white !important;
          }
          main {
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            padding: 0 !important;
            width: 100% !important;
          }
          aside, header, .no-print {
            display: none !important;
          }
          .p-8 {
            padding: 0 !important;
          }
        }
      `}</style>
      
      <div className="lg:hidden fixed top-4 left-4 z-50 no-print">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static no-print
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center space-x-3 mb-10 px-2">
            <img src="/mjcet-logo.png" alt="MJCET" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-slate-900 tracking-tight leading-none text-sm">MJCET FEE APP</h1>
              <p className="text-[9px] text-slate-400 font-medium mt-0.5 leading-tight">Fee Management System</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map(item => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeView === item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setIsSidebarOpen(false);
                }}
                roles={item.roles}
              />
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <UserCircle size={24} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{currentUser?.role}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen relative bg-[#f0f4f8]">
        <header className="sticky top-0 z-30 bg-[#f0f4f8]/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between no-print">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            {activeView.replace('-', ' ')}
          </h2>
        </header>

        <div className="p-8 print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
};
