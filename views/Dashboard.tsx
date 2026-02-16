
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { FeeLockerConfig } from '../types';
import { DEPARTMENTS } from '../constants';
import { 
  Users, 
  BadgeDollarSign, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Settings,
  XCircle,
  Save,
  Lock,
  Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, subValue: string, trend?: 'up' | 'down', color: string }> = ({ 
  icon, label, value, subValue, trend, color 
}) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        {icon}
      </div>
      {trend && (
        <span className={`flex items-center text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <TrendingUp size={14} className="mr-1 rotate-180" />}
          12%
        </span>
      )}
    </div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    <p className="text-slate-400 text-xs mt-1">{subValue}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const { students, transactions, feeLockerConfig, updateFeeLockerConfig } = useApp();
  const [showLockerConfig, setShowLockerConfig] = useState(false);
  const [editConfig, setEditConfig] = useState<FeeLockerConfig>(feeLockerConfig);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchResults = searchTerm.trim().length >= 2
    ? students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.hallTicketNumber.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalStudents = students.length;
  const pendingApprovals = transactions.filter(t => t.status === 'PENDING').length;
  const approvedTotal = transactions
    .filter(t => t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const targetTotal = students.reduce((sum, s) => {
    return sum + s.feeLockers.reduce((lSum, l) => lSum + l.tuitionTarget + l.universityTarget, 0);
  }, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const deptShort = (d: string) => {
    const m = d.match(/\(([^)]+)\)/);
    return m ? m[1] : d.replace('B.E ', '').replace('M.E ', '').slice(0, 6);
  };

  const deptSummaryData = DEPARTMENTS.map(dept => {
    const count = students.filter(s => s.department === dept.name).length;
    return { name: deptShort(dept.name), students: count, fullName: dept.name };
  }).filter(d => d.students > 0);

  const deptCollectionData = DEPARTMENTS.map(dept => {
    const deptStudents = students.filter(s => s.department === dept.name);
    const collection = deptStudents.reduce((sum, s) => {
      return sum + s.feeLockers.reduce((lSum, l) => {
        return lSum + l.transactions
          .filter(t => t.status === 'APPROVED')
          .reduce((tSum, t) => tSum + t.amount, 0);
      }, 0);
    }, 0);
    const target = deptStudents.reduce((sum, s) => {
      return sum + s.feeLockers.reduce((lSum, l) => lSum + l.tuitionTarget + l.universityTarget, 0);
    }, 0);
    return { name: deptShort(dept.name), collection, target, fullName: dept.name };
  }).filter(d => d.target > 0 || d.collection > 0);

  const deptDefaulterData = DEPARTMENTS.map(dept => {
    const deptStudents = students.filter(s => s.department === dept.name);
    const defaulters = deptStudents.filter(s => {
      const totalTarget = s.feeLockers.reduce((sum, l) => sum + l.tuitionTarget + l.universityTarget, 0);
      const totalPaid = s.feeLockers.reduce((sum, l) => {
        return sum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tS, t) => tS + t.amount, 0);
      }, 0);
      return totalTarget > 0 && totalPaid < totalTarget;
    }).length;
    return { name: deptShort(dept.name), defaulters, fullName: dept.name };
  }).filter(d => d.defaulters > 0);

  const COLORS_BLUE = ['#1a365d', '#2c5282', '#2b6cb0', '#3182ce', '#4299e1', '#63b3ed', '#90cdf4', '#bee3f8', '#1e40af', '#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
  const COLORS_RED = ['#9b2c2c', '#c53030', '#e53e3e', '#fc8181', '#feb2b2', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a'];

  const collectionPct = targetTotal > 0 ? ((approvedTotal / targetTotal) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-[#1a365d] via-[#2c5282] to-[#2b6cb0] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
          <img src="/mjcet-logo.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <img src="/mjcet-logo.png" alt="MJCET" className="w-16 h-16 object-contain bg-white/10 rounded-xl p-1.5" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Muffakham Jah College of Engineering & Technology</h1>
            <p className="text-blue-200 text-xs mt-0.5">Autonomous & Accredited by NAAC with A+ and NBA | Affiliated to Osmania University & Approved by AICTE</p>
            <p className="text-blue-300/70 text-[10px] mt-0.5 font-medium uppercase tracking-wider">Sultan-Ul-Uloom Education Society | Fee Management System</p>
          </div>
        </div>
      </div>

      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Roll No or Name..." 
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm shadow-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
          />
        </div>
        {showResults && searchTerm.trim().length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map(s => {
                const totalTarget = s.feeLockers.reduce((sum, l) => sum + l.tuitionTarget + l.universityTarget, 0);
                const totalPaid = s.feeLockers.reduce((sum, l) => {
                  return sum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tS, t) => tS + t.amount, 0);
                }, 0);
                const pending = totalTarget - totalPaid;
                return (
                  <div key={s.id} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.rollNumber} | {s.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-green-600">Paid: {formatCurrency(totalPaid)}</p>
                        {pending > 0 && <p className="text-xs font-medium text-red-500">Due: {formatCurrency(pending)}</p>}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-slate-400 text-sm">No students found</div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          icon={<Users size={24} />} 
          label="Total Students" 
          value={totalStudents.toString()} 
          subValue={`Across ${DEPARTMENTS.length} Departments`} 
          color="bg-blue-600"
          trend="up"
        />
        <StatCard 
          icon={<BadgeDollarSign size={24} />} 
          label="Total Collection" 
          value={formatCurrency(approvedTotal)} 
          subValue={`Target: ${formatCurrency(targetTotal)}`} 
          color="bg-emerald-600"
        />
        <StatCard 
          icon={<Clock size={24} />} 
          label="Pending Approvals" 
          value={pendingApprovals.toString()} 
          subValue="Review needed immediately" 
          color="bg-amber-600"
        />
        <StatCard 
          icon={<CreditCard size={24} />} 
          label="Collection Efficiency" 
          value={`${collectionPct}%`} 
          subValue="Approved vs Total Target" 
          color="bg-violet-600"
          trend="up"
        />
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">Overall Collection Progress</h3>
          <span className="text-xs font-bold text-[#1a365d]">{collectionPct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#1a365d] to-[#2b6cb0] rounded-full transition-all duration-700" style={{width: `${Math.min(parseFloat(collectionPct), 100)}%`}}></div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
          <span>Collected: {formatCurrency(approvedTotal)}</span>
          <span>Target: {formatCurrency(targetTotal)}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-800">Department Summary</h3>
          <p className="text-sm text-slate-400">Student count per department</p>
        </div>
        <div className="h-72">
          {deptSummaryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptSummaryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                <Bar dataKey="students" name="Students" radius={[6, 6, 0, 0]} barSize={32}>
                  {deptSummaryData.map((_e, i) => (
                    <Cell key={`ds-${i}`} fill={COLORS_BLUE[i % COLORS_BLUE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No student data available. Upload students to see department summary.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Fee Collection by Department</h3>
            <p className="text-sm text-slate-400">Total approved collection per department</p>
          </div>
          <div className="h-72">
            {deptCollectionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptCollectionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(val: number) => `₹${(val/100000).toFixed(0)}L`} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}} formatter={(val: number) => formatCurrency(val)} />
                  <Bar dataKey="collection" name="Collection" radius={[6, 6, 0, 0]} barSize={28}>
                    {deptCollectionData.map((_e, i) => (
                      <Cell key={`fc-${i}`} fill={COLORS_BLUE[i % COLORS_BLUE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No collection data available yet.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Fee Defaulters by Department</h3>
            <p className="text-sm text-slate-400">Students with pending fee balance</p>
          </div>
          <div className="h-72">
            {deptDefaulterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptDefaulterData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                  <Bar dataKey="defaulters" name="Defaulters" radius={[6, 6, 0, 0]} barSize={28}>
                    {deptDefaulterData.map((_e, i) => (
                      <Cell key={`df-${i}`} fill={COLORS_RED[i % COLORS_RED.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No defaulters found.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Payments</h3>
        <div className="space-y-4">
          {transactions.slice(-5).reverse().map((tx) => (
            <div key={tx.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  tx.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                  tx.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {tx.studentHTN.slice(-2)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{tx.studentHTN}</p>
                  <p className="text-xs text-slate-400">{tx.paymentDate}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{formatCurrency(tx.amount)}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  tx.status === 'APPROVED' ? 'text-emerald-500' : 
                  tx.status === 'PENDING' ? 'text-amber-500' : 'text-rose-500'
                }`}>{tx.status}</p>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No transactions yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Fee Locker Configuration</h3>
              <p className="text-sm text-slate-400">Manage tuition and university fee targets by department group</p>
            </div>
          </div>
          <button
            onClick={() => { setEditConfig(feeLockerConfig); setShowLockerConfig(true); }}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#2c5282] text-white rounded-xl font-medium text-sm hover:bg-[#1a365d] transition-colors shadow-sm"
          >
            <Settings size={16} />
            <span>Configure Fee Lockers</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Locker A (Group A - B.E.)</h4>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">Tuition</p>
                <p className="text-sm font-bold text-slate-800">{formatCurrency(feeLockerConfig.groupA.tuition)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">University</p>
                <p className="text-sm font-bold text-slate-800">{formatCurrency(feeLockerConfig.groupA.university)}</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-400">Applies to: {feeLockerConfig.groupA.departments.map(c => `B.E(${c})`).join(', ')}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Locker B (Group B - B.E.)</h4>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">Tuition</p>
                <p className="text-sm font-bold text-slate-800">{formatCurrency(feeLockerConfig.groupB.tuition)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">University</p>
                <p className="text-sm font-bold text-slate-800">{formatCurrency(feeLockerConfig.groupB.university)}</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-400">Applies to: {feeLockerConfig.groupB.departments.map(c => `B.E(${c})`).join(', ')}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-3">Locker C (M.E Programs)</h4>
            <div className="grid grid-cols-2 gap-3 mb-1">
              <div>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">1st Yr Tuition</p>
                <p className="text-sm font-bold text-slate-800">{formatCurrency(feeLockerConfig.groupC.year1Tuition)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">1st Yr Univ</p>
                <p className="text-sm font-bold text-slate-800">{formatCurrency(feeLockerConfig.groupC.year1University)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">2nd Yr Tuition</p>
                <p className="text-sm font-bold text-slate-800">{formatCurrency(feeLockerConfig.groupC.year2Tuition)}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-semibold uppercase">2nd Yr Univ</p>
                <p className="text-sm font-bold text-slate-800">{formatCurrency(feeLockerConfig.groupC.year2University)}</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-400">Applies to: {feeLockerConfig.groupC.departments.map(c => `M.E(${c.replace('ME-', '')})`).join(', ')}</p>
          </div>
        </div>
      </div>

      {showLockerConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Configure Fee Lockers</h3>
              <button onClick={() => setShowLockerConfig(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-4">Locker A (Group A - B.E.)</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tuition Fee Target (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" value={editConfig.groupA.tuition} onChange={e => setEditConfig({...editConfig, groupA: {...editConfig.groupA, tuition: parseInt(e.target.value) || 0}})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">University Fee Target (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" value={editConfig.groupA.university} onChange={e => setEditConfig({...editConfig, groupA: {...editConfig.groupA, university: parseInt(e.target.value) || 0}})} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">Applies to: {editConfig.groupA.departments.map(c => `B.E(${c})`).join(', ')}</p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-4">Locker B (Group B - B.E.)</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tuition Fee Target (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" value={editConfig.groupB.tuition} onChange={e => setEditConfig({...editConfig, groupB: {...editConfig.groupB, tuition: parseInt(e.target.value) || 0}})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">University Fee Target (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" value={editConfig.groupB.university} onChange={e => setEditConfig({...editConfig, groupB: {...editConfig.groupB, university: parseInt(e.target.value) || 0}})} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">Applies to: {editConfig.groupB.departments.map(c => `B.E(${c})`).join(', ')}</p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4">Locker C (M.E Programs)</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">1st Year Tuition (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" value={editConfig.groupC.year1Tuition} onChange={e => setEditConfig({...editConfig, groupC: {...editConfig.groupC, year1Tuition: parseInt(e.target.value) || 0}})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">1st Year University (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" value={editConfig.groupC.year1University} onChange={e => setEditConfig({...editConfig, groupC: {...editConfig.groupC, year1University: parseInt(e.target.value) || 0}})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">2nd Year Tuition (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" value={editConfig.groupC.year2Tuition} onChange={e => setEditConfig({...editConfig, groupC: {...editConfig.groupC, year2Tuition: parseInt(e.target.value) || 0}})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">2nd Year University (₹)</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" value={editConfig.groupC.year2University} onChange={e => setEditConfig({...editConfig, groupC: {...editConfig.groupC, year2University: parseInt(e.target.value) || 0}})} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">Applies to: {editConfig.groupC.departments.map(c => `M.E(${c.replace('ME-', '')})`).join(', ')}</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setShowLockerConfig(false)} className="px-6 py-2.5 bg-slate-100 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
              <button
                onClick={() => { updateFeeLockerConfig(editConfig); setShowLockerConfig(false); }}
                className="px-8 py-2.5 bg-[#2c5282] text-white rounded-xl font-medium text-sm shadow-sm hover:bg-[#1a365d] transition-colors flex items-center space-x-2"
              >
                <Save size={16} />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
