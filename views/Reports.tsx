
import React, { useState } from 'react';
import { useApp } from '../store';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Filter, 
  Download, 
  Search,
  PieChart as PieChartIcon,
  IndianRupee,
  Users,
  AlertCircle
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { students, transactions } = useApp();
  const [filterDept, setFilterDept] = useState('All');

  // Calculations
  const approvedTxs = transactions.filter(t => t.status === 'APPROVED');
  const totalCollected = approvedTxs.reduce((sum, t) => sum + t.amount, 0);
  
  const totalTargeted = students.reduce((sum, s) => {
    return sum + s.feeLockers.reduce((lSum, l) => lSum + l.tuitionTarget + l.universityTarget, 0);
  }, 0);

  const totalOutstanding = totalTargeted - totalCollected;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // Dept Analysis
  // Fix: Explicitly type depts as string array to avoid unknown type error on split
  const depts: string[] = Array.from(new Set(students.map(s => s.department)));
  const deptData = depts.map((dept: string) => {
    const deptStudents = students.filter(s => s.department === dept);
    const collection = approvedTxs
      .filter(t => deptStudents.some(s => s.hallTicketNumber === t.studentHTN))
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: dept.split(' ')[0], full: dept, collection };
  }).sort((a, b) => b.collection - a.collection);

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  const filteredTransactions = approvedTxs.filter(t => {
    if (filterDept === 'All') return true;
    const student = students.find(s => s.hallTicketNumber === t.studentHTN);
    return student?.department === filterDept;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <IndianRupee size={24} />
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={14} className="mr-1" /> 8.2%
            </div>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Collected</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalCollected)}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Net approved receipts to date</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <BarChart3 size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Targeted</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalTargeted)}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Aggregated yearly locker targets</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <AlertCircle size={24} />
            </div>
            <div className="flex items-center text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">
              <TrendingDown size={14} className="mr-1" /> 12%
            </div>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Outstanding Balance</p>
          <h3 className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(totalOutstanding)}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Unpaid/Pending amounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dept Collection Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Collection by Stream</h3>
              <p className="text-xs text-slate-400 mt-1">Cross-departmental financial performance</p>
            </div>
            <PieChartIcon className="text-slate-300" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [formatCurrency(value), 'Collected']}
                />
                <Bar dataKey="collection" radius={[0, 4, 4, 0]} barSize={24}>
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Advanced Filters</h3>
            <button className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-200">
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <option value="All">All Departments</option>
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            <div className="p-6 bg-blue-600 rounded-2xl text-white relative overflow-hidden mt-auto">
              <div className="relative z-10">
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Active Academic Cycle</p>
                <h4 className="text-2xl font-black mt-1">2023-24</h4>
                <div className="flex items-center space-x-2 mt-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[10px] font-bold">LIVE SYNC ENABLED</span>
                </div>
              </div>
              <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Approved Transaction Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll No</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono font-bold text-xs text-slate-600">{tx.studentHTN}</td>
                  <td className="px-6 py-3 font-bold text-xs text-slate-800">{tx.feeType}</td>
                  <td className="px-6 py-3 font-medium text-[10px] text-slate-500">{tx.paymentMode}</td>
                  <td className="px-6 py-3 text-[10px] text-slate-400">{tx.paymentDate}</td>
                  <td className="px-6 py-3 text-right font-black text-slate-900 text-sm">{formatCurrency(tx.amount)}</td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-xs">No transactions match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
