
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
import { GraduationCap, Wallet, ShieldCheck, ClipboardCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useApp();

  const roles = [
    { id: UserRole.ADMIN, title: 'Administrator', icon: <ShieldCheck size={32} />, color: 'bg-indigo-600', desc: 'System configuration & user management' },
    { id: UserRole.ACCOUNTANT, title: 'Accountant', icon: <Wallet size={32} />, color: 'bg-blue-600', desc: 'Fee entries, uploads & approvals' },
    { id: UserRole.PRINCIPAL, title: 'Principal', icon: <GraduationCap size={32} />, color: 'bg-emerald-600', desc: 'Financial reports & dashboard oversight' },
    { id: UserRole.EXAM_CELL, title: 'Exam Cell', icon: <ClipboardCheck size={32} />, color: 'bg-amber-600', desc: 'Defaulter checks & fee clearance' },
  ];

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
        <p className="text-slate-500 mb-8 text-base font-medium">Centralized College Fee Management & Governance System</p>

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => login(role.id)}
              className="bg-white group p-8 rounded-3xl border border-slate-200 text-left hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-50 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`w-14 h-14 ${role.color} text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {role.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800">{role.title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{role.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center text-slate-400 text-sm font-medium">
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
