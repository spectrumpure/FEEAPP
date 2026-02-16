
import React from 'react';
import { useApp } from '../store';
import { 
  Users, 
  BadgeDollarSign, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  CreditCard
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
  const { students, transactions } = useApp();

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users size={24} />} 
          label="Total Students" 
          value={totalStudents.toString()} 
          subValue="Across 4 Departments" 
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
          value={`${((approvedTotal / targetTotal) * 100).toFixed(1)}%`} 
          subValue="Approved vs Total Target" 
          color="bg-violet-600"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Collection Chart */}
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
    </div>
  );
};
