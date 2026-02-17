
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
import { DatabaseAdmin } from './views/DatabaseAdmin';
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
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="relative w-full md:w-1/2 h-[35vh] md:h-screen md:sticky md:top-0 overflow-hidden">
        <img src="/mjcet-college.png" alt="MJCET Campus" className="w-full h-full object-cover" style={{objectPosition: 'center 40%'}} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1f3d] via-[#1a365d]/60 to-[#1a365d]/30"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">MJCET FEE APP</h1>
            <div className="w-16 h-1 bg-amber-400 mx-auto my-4 rounded-full"></div>
            <p className="font-semibold text-base md:text-lg text-white/90">Muffakham Jah College of Engineering & Technology</p>
            <p className="text-white/60 mt-2 text-xs md:text-sm">Autonomous & Accredited by NAAC with A+ and NBA</p>
            <p className="text-white/60 text-xs md:text-sm">Affiliated to Osmania University & Approved by AICTE</p>
          </div>
          <div className="hidden md:flex items-center gap-6 mt-10">
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <ShieldCheck size={14} />
              <span>Secure Access</span>
            </div>
            <div className="w-1 h-1 bg-white/30 rounded-full"></div>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <ClipboardCheck size={14} />
              <span>Fee Management</span>
            </div>
            <div className="w-1 h-1 bg-white/30 rounded-full"></div>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <GraduationCap size={14} />
              <span>Student Records</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 md:p-12">
        <div className="w-full max-w-md">
          <p className="text-center text-slate-400 text-sm font-medium mb-8 tracking-wide uppercase">Centralized College Fee Management & Governance System</p>

          {!showResetPassword ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1a365d] to-[#2c5282] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/20">
                  <Lock size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
                <p className="text-sm text-slate-400 mt-1">Sign in to your account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setError(''); }}
                      className="w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                      placeholder="Enter your username"
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      className="w-full px-4 py-3.5 pr-12 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#1a365d] to-[#2c5282] text-white rounded-xl font-bold text-sm hover:from-[#2c5282] hover:to-[#3b6cb5] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 mt-2"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setShowResetPassword(true); setError(''); }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                >
                  Forgot / Reset Password?
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-10">
              <button
                onClick={() => { setShowResetPassword(false); setResetError(''); setResetSuccess(''); }}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 font-medium mb-6 transition-colors"
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>

              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                  <KeyRound size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
                <p className="text-sm text-slate-400 mt-1">Enter your current password to set a new one</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                  <input
                    type="text"
                    value={resetUsername}
                    onChange={(e) => { setResetUsername(e.target.value); setResetError(''); setResetSuccess(''); }}
                    className="w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Password</label>
                  <input
                    type="password"
                    value={currentPwd}
                    onChange={(e) => { setCurrentPwd(e.target.value); setResetError(''); setResetSuccess(''); }}
                    className="w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPwd}
                    onChange={(e) => { setNewPwd(e.target.value); setResetError(''); setResetSuccess(''); }}
                    className="w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => { setConfirmPwd(e.target.value); setResetError(''); setResetSuccess(''); }}
                    className="w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                    placeholder="Re-enter new password"
                  />
                </div>

                {resetError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {resetError}
                  </div>
                )}
                {resetSuccess && (
                  <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                    <CheckCircle size={16} className="flex-shrink-0" />
                    {resetSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-bold text-sm hover:from-amber-500 hover:to-amber-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 mt-2"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          )}

          <div className="mt-8 text-center text-slate-300 text-xs font-medium">
            &copy; {new Date().getFullYear()} Sultan-Ul-Uloom Education Society. All Rights Reserved.
          </div>
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
      case 'database': return <DatabaseAdmin />;
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
