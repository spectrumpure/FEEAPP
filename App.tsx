
import React, { useState } from 'react';
import { AppProvider, useApp } from './store';
import { UserRole } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { StudentDirectory } from './views/StudentDirectory';
import { FeeEntry } from './views/FeeEntry';
import { FeeLedger } from './views/FeeLedger';
import { Reports } from './views/Reports';
import { Approvals } from './views/Approvals';
import { Certificates } from './views/Certificates';
import { DefaulterList } from './views/DefaulterList';
import { GraduationCap, Wallet, ShieldCheck, ClipboardCheck, Eye, EyeOff, Lock, KeyRound, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (!resetUsername.trim() || !currentPwd || !newPwd || !confirmPwd) {
      setResetError('Please fill in all fields');
      return;
    }
    if (newPwd !== confirmPwd) {
      setResetError('New passwords do not match');
      return;
    }
    if (newPwd.length < 8) {
      setResetError('New password must be at least 8 characters');
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: resetUsername.trim(), currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || 'Reset failed');
      } else {
        setResetSuccess('Password changed successfully! You can now login with your new password.');
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
      }
    } catch {
      setResetError('Connection error. Please try again.');
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img src="/mjcet-college.png" alt="MJCET Campus" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a365d]/70 via-[#1a365d]/50 to-slate-50"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <img src="/mjcet-logo.png" alt="MJCET" className="w-16 h-16 object-contain mx-auto mb-3 bg-white/15 rounded-xl p-1.5" />
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg">MJCET FEE APP</h1>
            <p className="font-semibold text-sm mt-1 text-white/90">Muffakham Jah College of Engineering & Technology</p>
            <p className="text-white/70 mt-1 text-xs">Autonomous & Accredited by NAAC with A+ and NBA</p>
            <p className="text-white/70 text-xs">Affiliated to Osmania University & Approved by AICTE</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-6">
        <p className="text-slate-500 mb-6 text-base font-medium">Centralized College Fee Management & Governance System</p>

        {!showResetPassword ? (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#1a365d] rounded-2xl flex items-center justify-center">
                  <Lock size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Sign In</h2>
                  <p className="text-sm text-slate-400">Enter your credentials to continue</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    placeholder="Enter username"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#1a365d] text-white rounded-xl font-bold text-sm hover:bg-[#2c5282] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-100"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => { setShowResetPassword(true); setError(''); }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                >
                  Forgot / Reset Password?
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
              <button
                onClick={() => { setShowResetPassword(false); setResetError(''); setResetSuccess(''); }}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-medium mb-4 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Login
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                  <KeyRound size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Reset Password</h2>
                  <p className="text-sm text-slate-400">Enter current password to set a new one</p>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                  <input
                    type="text"
                    value={resetUsername}
                    onChange={(e) => { setResetUsername(e.target.value); setResetError(''); setResetSuccess(''); }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPwd}
                    onChange={(e) => { setCurrentPwd(e.target.value); setResetError(''); setResetSuccess(''); }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPwd}
                    onChange={(e) => { setNewPwd(e.target.value); setResetError(''); setResetSuccess(''); }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => { setConfirmPwd(e.target.value); setResetError(''); setResetSuccess(''); }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    placeholder="Re-enter new password"
                  />
                </div>

                {resetError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
                    <AlertCircle size={16} />
                    {resetError}
                  </div>
                )}
                {resetSuccess && (
                  <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 px-4 py-2.5 rounded-xl border border-green-100">
                    <CheckCircle size={16} />
                    {resetSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-100"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-slate-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} MJCET Fee Management System. All Rights Reserved.
        </div>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { currentUser, students } = useApp();
  const [activeView, setActiveView] = useState(currentUser?.role === UserRole.EXAM_CELL ? 'defaulters' : 'dashboard');
  const [selectedStudentHTN, setSelectedStudentHTN] = useState<string | null>(null);
  const [preSelectedFeeHTN, setPreSelectedFeeHTN] = useState<string | null>(null);

  if (!currentUser) return <LoginPage />;

  const renderView = () => {
    // Shared view for specific student ledger
    if (activeView === 'students' && selectedStudentHTN) {
      const student = students.find(s => s.hallTicketNumber === selectedStudentHTN);
      if (student) return (
        <div>
          <button 
            onClick={() => setSelectedStudentHTN(null)}
            className="mb-4 text-blue-600 font-bold text-sm flex items-center hover:underline no-print"
          >
            &larr; Back to Directory
          </button>
          <FeeLedger student={student} />
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'students': return (
        <StudentDirectory 
          onFeeEntry={(htn) => {
            setPreSelectedFeeHTN(htn);
            setActiveView('fee-entry');
          }}
          onViewStudent={(htn) => {
            setSelectedStudentHTN(htn);
          }}
        />
      );
      case 'fee-entry': return <FeeEntry preSelectedHTN={preSelectedFeeHTN} />;
      case 'approvals': return <Approvals />;
      case 'reports': return <Reports />;
      case 'certificates': return <Certificates />;
      case 'defaulters': return <DefaulterList />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={(view) => {
      setActiveView(view);
      setSelectedStudentHTN(null);
      if (view !== 'fee-entry') setPreSelectedFeeHTN(null);
    }}>
      {renderView()}
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
