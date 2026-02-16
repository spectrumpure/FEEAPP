
import React, { useState } from 'react';
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
  Lock
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

  const chartData = [
    { name: 'CSE', collection: 4500000 },
    { name: 'ECE', collection: 3200000 },
    { name: 'EEE', collection: 2800000 },
    { name: 'MECH', collection: 2100000 },
    { name: 'CIVIL', collection: 1800000 },
  ];

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Fee Collection by Department</h3>
              <p className="text-sm text-slate-400">Total approved collection per department</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none">
              <option>Academic Year 2023-24</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `₹${val/100000}L`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="collection" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Payments</h3>
          <div className="space-y-6">
            {transactions.slice(-5).reverse().map((tx, idx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
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
          </div>
          <button className="w-full mt-8 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            View All Transactions
          </button>
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
