
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
import { FeeLockers } from './views/FeeLockers';
import { DatabaseAdmin } from './views/DatabaseAdmin';
import { BulkUpload } from './views/BulkUpload';
import { GraduationCap, Wallet, ShieldCheck, ClipboardCheck, Eye, EyeOff, Lock, ArrowLeft, AlertCircle, ArrowRight, Shield, Calculator, FileBarChart, BookCheck } from 'lucide-react';

const ROLE_CARDS = [
  { key: 'admin', label: 'Admin', subtitle: 'FULL SYSTEM ACCESS & ENTRY', icon: Shield, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', accentColor: 'bg-blue-500', username: 'admin' },
  { key: 'accountant', label: 'Accountant', subtitle: 'FEE APPROVALS & FINANCE', icon: Calculator, color: 'emerald', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', accentColor: 'bg-emerald-500', username: 'accountant' },
  { key: 'principal', label: 'Principal', subtitle: 'REPORTS & INSTITUTIONAL STATS', icon: FileBarChart, color: 'slate', bgColor: 'bg-slate-50', borderColor: 'border-slate-200', iconBg: 'bg-slate-100', iconColor: 'text-slate-600', accentColor: 'bg-slate-500', username: 'principal' },
  { key: 'examcell', label: 'Exam Branch', subtitle: 'CLEARANCE & DUES MONITORING', icon: BookCheck, color: 'amber', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', accentColor: 'bg-amber-500', username: 'examcell' },
];

const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectRole = (roleKey: string) => {
    const role = ROLE_CARDS.find(r => r.key === roleKey);
    if (role) {
      setSelectedRole(roleKey);
      setUsername(role.username);
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setUsername('');
    setPassword('');
    setError('');
    setShowPassword(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your password');
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

  const activeRole = ROLE_CARDS.find(r => r.key === selectedRole);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="relative w-full md:w-[45%] h-[30vh] md:h-screen md:sticky md:top-0 overflow-hidden">
        <img src="/mjcet-college.png" alt="MJCET Campus" className="w-full h-full object-cover" style={{objectPosition: 'center 40%'}} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1f3d] via-[#1a365d]/60 to-[#1a365d]/30"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
          <div className="text-center">
            <img src="/mjcet-logo.png" alt="MJCET Logo" className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white p-2 shadow-2xl mx-auto mb-5 object-contain" />
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
        <div className="w-full max-w-lg">
          <p className="text-center text-slate-400 text-sm font-medium mb-8 tracking-wide uppercase">Centralized College Fee Management & Governance System</p>

          {!selectedRole ? (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Select Your Role</h2>
                <p className="text-sm text-slate-400 mt-1">Choose your role to sign in</p>
              </div>
              <div className="space-y-3">
                {ROLE_CARDS.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.key}
                      onClick={() => handleSelectRole(role.key)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 ${role.borderColor} bg-white hover:${role.bgColor} transition-all duration-200 group cursor-pointer relative overflow-hidden`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${role.accentColor} rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                      <div className={`w-12 h-12 ${role.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon size={22} className={role.iconColor} />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-lg font-bold text-slate-800">{role.label}</h3>
                        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{role.subtitle}</p>
                      </div>
                      <ArrowRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-10">
              <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 font-medium mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Role Selection
              </button>
              <div className="text-center mb-8">
                {activeRole && (
                  <>
                    <div className={`w-16 h-16 ${activeRole.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <activeRole.icon size={28} className={activeRole.iconColor} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">{activeRole.label}</h2>
                    <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-1">{activeRole.subtitle}</p>
                  </>
                )}
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    className="w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
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
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                    <AlertCircle size={16} className="flex-shrink-0" />{error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-[#1a365d] to-[#2c5282] text-white rounded-xl font-bold text-sm hover:from-[#2c5282] hover:to-[#3b6cb5] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 mt-2">
                  {loading ? 'Signing in...' : 'Sign In'}
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
  const getDefaultView = () => {
    if (currentUser?.role === UserRole.EXAM_CELL) return 'defaulters';
    if (currentUser?.role === UserRole.ACCOUNTANT) return 'students';
    if (currentUser?.role === UserRole.PRINCIPAL) return 'students';
    return 'dashboard';
  };
  const [activeView, setActiveView] = useState(getDefaultView());
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
      case 'bulk-upload': return <BulkUpload />;
      case 'approvals': return <Approvals />;
      case 'reports': return <Reports />;
      case 'certificates': return <Certificates />;
      case 'fee-lockers': return <FeeLockers />;
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
