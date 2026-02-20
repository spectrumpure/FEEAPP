
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { StudentRemark, UserRole } from '../types';
import { DEPARTMENTS } from '../constants';
import { 
  Users, 
  BadgeDollarSign, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Search,
  X,
  FileText,
  MessageSquarePlus,
  StickyNote,
  Trash2,
  Send,
  AlertCircle
} from 'lucide-react';
import { Student } from '../types';
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
  const { students, transactions, currentUser, getFeeTargets } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [deptYearFilter, setDeptYearFilter] = useState<string>('all');
  const [deptBatchFilter, setDeptBatchFilter] = useState<string>('all');
  const [catYearFilter, setCatYearFilter] = useState<string>('all');
  const [catBatchFilter, setCatBatchFilter] = useState<string>('all');

  const allBatches = Array.from(new Set(students.map(s => s.batch))).filter(Boolean).sort();

  const [remarkHTN, setRemarkHTN] = useState('');
  const [remarkText, setRemarkText] = useState('');
  const [remarkError, setRemarkError] = useState('');
  const [remarkSuccess, setRemarkSuccess] = useState('');
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [remarkStudentName, setRemarkStudentName] = useState('');

  const [studentRemarks, setStudentRemarks] = useState<StudentRemark[]>([]);
  const [remarksLoading, setRemarksLoading] = useState(false);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const loadRemarks = async (htn: string) => {
    setRemarksLoading(true);
    try {
      const res = await fetch(`/api/remarks/${encodeURIComponent(htn)}`);
      if (res.ok) {
        const data = await res.json();
        setStudentRemarks(data);
      }
    } catch (err) {
      console.error('Failed to load remarks:', err);
    }
    setRemarksLoading(false);
  };

  const handleRemarkHTNChange = (val: string) => {
    setRemarkHTN(val);
    setRemarkError('');
    setRemarkSuccess('');
    const found = students.find(s => s.hallTicketNumber.toLowerCase() === val.toLowerCase());
    setRemarkStudentName(found ? found.name : '');
  };

  const handleAddRemark = async () => {
    if (!remarkHTN.trim()) { setRemarkError('Please enter the student roll number'); return; }
    if (!remarkText.trim()) { setRemarkError('Please enter a remark/note'); return; }
    setRemarkError('');
    setRemarkSuccess('');
    setRemarkLoading(true);
    try {
      const res = await fetch('/api/remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentHTN: remarkHTN.trim(), remark: remarkText.trim(), addedBy: currentUser?.name || 'Admin' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRemarkError(data.error || 'Failed to add remark');
      } else {
        setRemarkSuccess('Remark added successfully');
        setRemarkText('');
        if (selectedStudent && selectedStudent.hallTicketNumber === remarkHTN.trim()) {
          loadRemarks(remarkHTN.trim());
        }
      }
    } catch {
      setRemarkError('Connection error');
    }
    setRemarkLoading(false);
  };

  const handleDeleteRemark = async (id: number) => {
    try {
      await fetch(`/api/remarks/${id}`, { method: 'DELETE' });
      setStudentRemarks(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete remark:', err);
    }
  };

  const searchResults = searchTerm.trim().length >= 2
    ? students.filter(s => {
        const term = searchTerm.toLowerCase();
        return (s.name || '').toLowerCase().includes(term) ||
          (s.rollNumber || '').toLowerCase().includes(term) ||
          (s.hallTicketNumber || '').toLowerCase().includes(term);
      }).slice(0, 8)
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

  const matchDept = (sDept: string, dept: { name: string; code: string }) =>
    sDept === dept.name || sDept === dept.code || sDept.toUpperCase() === dept.code.toUpperCase();

  const getStudentTotalTarget = (s: typeof students[0]) => {
    if (s.feeLockers.length > 0) {
      return s.feeLockers.reduce((lSum, l) => lSum + l.tuitionTarget + l.universityTarget, 0);
    }
    const dept = DEPARTMENTS.find(d => matchDept(s.department, d));
    const duration = dept?.duration || 4;
    let total = 0;
    for (let y = 1; y <= Math.min(s.currentYear, duration); y++) {
      const targets = getFeeTargets(s.department, y, s.entryType);
      total += targets.tuition + targets.university;
    }
    return total;
  };

  const totalStudents = students.length;
  const pendingApprovals = transactions.filter(t => t.status === 'PENDING').length;
  const approvedTotal = transactions
    .filter(t => t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const targetTotal = students.reduce((sum, s) => sum + getStudentTotalTarget(s), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const deptShort = (d: string) => {
    const m = d.match(/\(([^)]+)\)/);
    return m ? m[1] : d.replace('B.E ', '').replace('M.E ', '').slice(0, 6);
  };

  const deptTableData = (() => {
    const rows: { name: string; fullName: string; code: string; courseType: string; entryLabel: string; count: number; target: number; collection: number; balance: number; defaulters: number; pct: number }[] = [];
    const yr = deptYearFilter === 'all' ? 0 : parseInt(deptYearFilter);
    const calcRow = (deptStudents: typeof students, dept: typeof DEPARTMENTS[0], label: string) => {
      const count = deptStudents.length;
      const target = yr === 0
        ? deptStudents.reduce((sum, s) => sum + getStudentTotalTarget(s), 0)
        : deptStudents.reduce((sum, s) => {
            const locker = s.feeLockers.find(l => l.year === yr);
            return sum + (locker ? locker.tuitionTarget + locker.universityTarget + locker.otherTarget : 0);
          }, 0);
      const collection = deptStudents.reduce((sum, s) => {
        const lockers = yr === 0 ? s.feeLockers : s.feeLockers.filter(l => l.year === yr);
        return sum + lockers.reduce((lSum, l) => {
          return lSum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tSum, t) => tSum + t.amount, 0);
        }, 0);
      }, 0);
      const balance = target - collection;
      const defaulters = deptStudents.filter(s => {
        const lockers = yr === 0 ? s.feeLockers : s.feeLockers.filter(l => l.year === yr);
        const st = yr === 0 ? getStudentTotalTarget(s) : lockers.reduce((sum, l) => sum + l.tuitionTarget + l.universityTarget + l.otherTarget, 0);
        const sp = lockers.reduce((sum, l) => sum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tS, t) => tS + t.amount, 0), 0);
        return st > 0 && sp < st;
      }).length;
      const pct = target > 0 ? ((collection / target) * 100) : 0;
      rows.push({ name: deptShort(dept.name), fullName: dept.name, code: dept.code, courseType: dept.courseType, entryLabel: label, count, target, collection, balance, defaulters, pct });
    };
    DEPARTMENTS.forEach(dept => {
      let allDeptStudents = students.filter(s => matchDept(s.department, dept));
      if (deptBatchFilter !== 'all') allDeptStudents = allDeptStudents.filter(s => s.batch === deptBatchFilter);
      const filtered = yr === 0 ? allDeptStudents : allDeptStudents.filter(s => s.feeLockers.some(l => l.year === yr));
      const lateralStudents = filtered.filter(s => s.entryType === 'LATERAL');
      if (lateralStudents.length > 0) {
        calcRow(filtered.filter(s => s.entryType !== 'LATERAL'), dept, 'Regular');
        calcRow(lateralStudents, dept, 'Lateral');
      } else {
        calcRow(filtered, dept, '');
      }
    });
    return rows.filter(d => d.count > 0);
  })();

  const deptTableTotals = deptTableData.reduce((acc, d) => ({
    count: acc.count + d.count, target: acc.target + d.target, collection: acc.collection + d.collection,
    balance: acc.balance + d.balance, defaulters: acc.defaulters + d.defaulters
  }), { count: 0, target: 0, collection: 0, balance: 0, defaulters: 0 });

  const deptCollectionData = deptTableData.map(d => ({ name: d.name, collection: d.collection, target: d.target, fullName: d.fullName })).filter(d => d.target > 0 || d.collection > 0);

  const deptDefaulterData = deptTableData.map(d => ({ name: d.name, defaulters: d.defaulters, fullName: d.fullName })).filter(d => d.defaulters > 0);

  const COLORS_BLUE = ['#1a365d', '#2c5282', '#2b6cb0', '#3182ce', '#4299e1', '#63b3ed', '#90cdf4', '#bee3f8', '#1e40af', '#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
  const COLORS_RED = ['#9b2c2c', '#c53030', '#e53e3e', '#fc8181', '#feb2b2', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a'];

  const collectionPct = targetTotal > 0 ? ((approvedTotal / targetTotal) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-[#1a365d] via-[#2c5282] to-[#2b6cb0] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
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
                const totalTarget = getStudentTotalTarget(s);
                const totalPaid = s.feeLockers.reduce((sum, l) => {
                  return sum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tS, t) => tS + t.amount, 0);
                }, 0);
                const pending = totalTarget - totalPaid;
                return (
                  <div key={s.hallTicketNumber} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                    onClick={() => { setSelectedStudent(s); setShowResults(false); setSearchTerm(''); loadRemarks(s.hallTicketNumber); }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.hallTicketNumber} | {s.department}</p>
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

      {selectedStudent && (() => {
        const s = selectedStudent;
        const lifetimePaid = s.feeLockers.reduce((sum, l) => {
          return sum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tS, t) => tS + t.amount, 0);
        }, 0);
        const lifetimeTarget = getStudentTotalTarget(s);
        const dept = DEPARTMENTS.find(d => d.name === s.department);
        const lockerStatus = (locker: typeof s.feeLockers[0]) => {
          const paid = locker.transactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0);
          const target = locker.tuitionTarget + locker.universityTarget;
          if (target === 0) return 'PENDING';
          if (paid >= target) return 'PAID';
          if (paid > 0) return 'PARTIAL';
          return 'PENDING';
        };
        const statusColor = (st: string) => {
          if (st === 'PAID') return 'text-green-600 bg-green-50';
          if (st === 'PARTIAL') return 'text-orange-600 bg-orange-50';
          return 'text-slate-500 bg-slate-100';
        };
        const yearColors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-violet-600'];
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1a365d] via-[#2c5282] to-[#2b6cb0] p-6 text-white relative">
              <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded">{s.admissionCategory || 'TSMFC'}</span>
                    <span className="text-blue-200 text-xs">ADM YEAR: {s.admissionYear}</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">{s.name}</h2>
                  <div className="flex items-center gap-2 mt-2 text-blue-200 text-sm flex-wrap">
                    <FileText size={14} />
                    <span>HTN: {s.hallTicketNumber}</span>
                    <span className="text-blue-300/50">|</span>
                    <span>{s.department}</span>
                    <span className="text-blue-300/50">|</span>
                    <span>{s.course}</span>
                  </div>
                  <div className="flex gap-6 mt-2 text-xs text-blue-200/80">
                    <span><strong className="text-blue-100">FATHER:</strong> {s.fatherName}</span>
                    <span><strong className="text-blue-100">BATCH:</strong> {s.batch}</span>
                  </div>
                </div>
                <div className="text-right bg-white/10 rounded-xl p-4 min-w-[180px]">
                  <p className="text-blue-200 text-xs uppercase tracking-wider mb-1">Lifetime Collection</p>
                  <p className="text-3xl font-bold">{formatCurrency(lifetimePaid)}</p>
                  <p className="text-blue-200/80 text-xs mt-1">of {formatCurrency(lifetimeTarget)} Total Target</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {s.feeLockers.map((locker, idx) => {
                  const tuitionPaid = locker.transactions.filter(t => t.status === 'APPROVED' && t.feeType === 'Tuition').reduce((sum, t) => sum + t.amount, 0);
                  const universityPaid = locker.transactions.filter(t => t.status === 'APPROVED' && t.feeType === 'University').reduce((sum, t) => sum + t.amount, 0);
                  const totalPaid = locker.transactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0);
                  const totalTarget = locker.tuitionTarget + locker.universityTarget;
                  const balanceDue = Math.max(0, totalTarget - totalPaid);
                  const progress = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;
                  const status = lockerStatus(locker);
                  const lastTxn = [...locker.transactions].filter(t => t.status === 'APPROVED').sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
                  return (
                    <div key={locker.year} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 ${yearColors[idx] || 'bg-blue-600'} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                            Y{locker.year}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">Year {locker.year}</p>
                            <p className="text-[10px] text-slate-400">Locker: {formatCurrency(totalTarget)}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColor(status)}`}>{status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tuition</p>
                          <p className="text-sm font-bold text-slate-800">{formatCurrency(tuitionPaid)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">University</p>
                          <p className="text-sm font-bold text-slate-800">{formatCurrency(universityPaid)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3 pt-3 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Balance Due</p>
                          <p className={`text-sm font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(balanceDue)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Progress</p>
                          <p className="text-sm font-bold text-slate-800">{progress}%</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Last Record</p>
                        {lastTxn ? (
                          <p className="text-xs text-slate-600 mt-0.5">{lastTxn.feeType} - {formatCurrency(lastTxn.amount)}</p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-0.5 italic">No activity</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {studentRemarks.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <StickyNote size={14} className="text-amber-500" />
                    Admin Remarks / Notes
                  </h4>
                  <div className="space-y-2">
                    {studentRemarks.map(r => (
                      <div key={r.id} className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <StickyNote size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700">{r.remark}</p>
                          <p className="text-[10px] text-slate-400 mt-1">By {r.addedBy} on {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        {isAdmin && (
                          <button onClick={() => handleDeleteRemark(r.id)} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {remarksLoading && (
                <div className="mt-4 text-center text-slate-400 text-xs">Loading remarks...</div>
              )}
            </div>
          </div>
        );
      })()}

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

      {deptTableData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Department Summary</h3>
              <p className="text-sm text-slate-400">Complete department-wise fee overview</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Batch:</span>
                <select
                  value={deptBatchFilter}
                  onChange={(e) => setDeptBatchFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                >
                  <option value="all">All Batches</option>
                  {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Year:</span>
                <select
                  value={deptYearFilter}
                  onChange={(e) => setDeptYearFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                >
                  <option value="all">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#1a365d] to-[#2c5282] text-white">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">S.No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">Department</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider">Type</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider">Students</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider">Target Fee</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider">Collected</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider">Balance</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider">Collection %</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider">Defaulters</th>
                </tr>
              </thead>
              <tbody>
                {deptTableData.map((d, idx) => (
                  <tr key={d.code + d.entryLabel} className={`border-t border-slate-100 hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">{d.code}</span>
                      <span className="text-slate-400 ml-1 text-xs hidden lg:inline">({d.fullName.match(/\(([^)]+)\)/)?.[1] || d.fullName})</span>
                      {d.entryLabel === 'Regular' && <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">Regular</span>}
                      {d.entryLabel === 'Lateral' && <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">Lateral</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${d.courseType === 'B.E' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {d.courseType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{d.count}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(d.target)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(d.collection)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(d.balance)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#1a365d] to-[#3182ce] rounded-full" style={{ width: `${Math.min(d.pct, 100)}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-slate-600 w-10">{d.pct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.defaulters > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{d.defaulters}</span>
                      ) : (
                        <span className="text-green-500 text-xs font-semibold">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-[#1a365d] to-[#2c5282] text-white font-bold">
                  <td className="px-4 py-3" colSpan={3}>TOTAL</td>
                  <td className="px-4 py-3 text-center">{deptTableTotals.count}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(deptTableTotals.target)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(deptTableTotals.collection)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(deptTableTotals.balance)}</td>
                  <td className="px-4 py-3 text-center">{deptTableTotals.target > 0 ? ((deptTableTotals.collection / deptTableTotals.target) * 100).toFixed(1) : '0.0'}%</td>
                  <td className="px-4 py-3 text-center">{deptTableTotals.defaulters}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {(() => {
        const isManagement = (cat: string) => { const u = (cat || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); return u.includes('MANAGEMENT') || u === 'MQ' || u === 'SPOT'; };
        const isConvenor = (cat: string) => { const u = (cat || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); return u.includes('CONVENOR') || u.includes('CONVENER') || u === 'CON'; };
        const isTSMFC = (cat: string) => { const u = (cat || '').trim().toUpperCase(); return u.includes('TSMFC') || u.includes('TSECET'); };
        const catYr = catYearFilter === 'all' ? 0 : parseInt(catYearFilter);
        const getCatPaid = (sList: typeof students) => {
          let tuiPaid = 0, uniPaid = 0, tuiTarget = 0, uniTarget = 0;
          let batchFiltered = catBatchFilter !== 'all' ? sList.filter(s => s.batch === catBatchFilter) : sList;
          const filtered = catYr > 0 ? batchFiltered.filter(s => s.feeLockers.some(l => l.year === catYr)) : batchFiltered;
          filtered.forEach(s => {
            const lockers = catYr > 0 ? s.feeLockers.filter(l => l.year === catYr) : s.feeLockers;
            lockers.forEach(l => {
              tuiTarget += l.tuitionTarget;
              uniTarget += l.universityTarget;
              l.transactions.filter(tx => tx.status === 'APPROVED').forEach(tx => {
                if (tx.feeType === 'University') uniPaid += tx.amount; else tuiPaid += tx.amount;
              });
            });
            if (lockers.length === 0 && catYr === 0) {
              const dept = DEPARTMENTS.find(d => matchDept(s.department, d));
              const duration = dept?.duration || 4;
              for (let y = 1; y <= Math.min(s.currentYear, duration); y++) {
                const targets = getFeeTargets(s.department, y, s.entryType);
                tuiTarget += targets.tuition;
                uniTarget += targets.university;
              }
            }
          });
          const target = tuiTarget + uniTarget;
          return { target, tuiTarget, uniTarget, tuiPaid, uniPaid, totalPaid: tuiPaid + uniPaid, count: filtered.length };
        };
        const catData: { name: string; code: string; courseType: string; entryLabel: string; tsmfcCount: number; tTarget: number; tTuiPaid: number; tUniPaid: number; tBal: number; mgmtCount: number; mTarget: number; mTuiPaid: number; mUniPaid: number; mBal: number; convCount: number; cTarget: number; cTuiPaid: number; cUniPaid: number; cBal: number; totalCount: number }[] = [];
        DEPARTMENTS.forEach(dept => {
          const ds = students.filter(s => matchDept(s.department, dept));
          const buildRow = (subset: typeof students, label: string) => {
            const mgmt = subset.filter(s => isManagement(s.admissionCategory));
            const conv = subset.filter(s => isConvenor(s.admissionCategory));
            const tsmfc = subset.filter(s => isTSMFC(s.admissionCategory));
            const mp = getCatPaid(mgmt), cp = getCatPaid(conv), tp = getCatPaid(tsmfc);
            if (mp.count > 0 || cp.count > 0 || tp.count > 0) {
              catData.push({ name: deptShort(dept.name), code: dept.code, courseType: dept.courseType, entryLabel: label,
                tsmfcCount: tp.count, tTarget: tp.target, tTuiPaid: tp.tuiPaid, tUniPaid: tp.uniPaid, tBal: tp.target - tp.totalPaid,
                mgmtCount: mp.count, mTarget: mp.target, mTuiPaid: mp.tuiPaid, mUniPaid: mp.uniPaid, mBal: mp.target - mp.totalPaid,
                convCount: cp.count, cTarget: cp.target, cTuiPaid: cp.tuiPaid, cUniPaid: cp.uniPaid, cBal: cp.target - cp.totalPaid,
                totalCount: tp.count + mp.count + cp.count });
            }
          };
          const lateralStudents = ds.filter(s => s.entryType === 'LATERAL');
          if (lateralStudents.length > 0) {
            buildRow(ds.filter(s => s.entryType !== 'LATERAL'), 'Regular');
            buildRow(lateralStudents, 'Lateral');
          } else {
            buildRow(ds, '');
          }
        });
        const catTotals = catData.reduce((a, d) => ({
          tc: a.tc + d.tsmfcCount, tt: a.tt + d.tTarget, ttp: a.ttp + d.tTuiPaid, tup: a.tup + d.tUniPaid, tb: a.tb + d.tBal,
          mc: a.mc + d.mgmtCount, mt: a.mt + d.mTarget, mtp: a.mtp + d.mTuiPaid, mup: a.mup + d.mUniPaid, mb: a.mb + d.mBal,
          cc: a.cc + d.convCount, ct: a.ct + d.cTarget, ctp: a.ctp + d.cTuiPaid, cup: a.cup + d.cUniPaid, cb: a.cb + d.cBal,
          all: a.all + d.totalCount
        }), { tc: 0, tt: 0, ttp: 0, tup: 0, tb: 0, mc: 0, mt: 0, mtp: 0, mup: 0, mb: 0, cc: 0, ct: 0, ctp: 0, cup: 0, cb: 0, all: 0 });
        if (catData.length === 0) return null;
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Category Analysis</h3>
                <p className="text-sm text-slate-400">TSMFC vs Management Quota vs Convenor - Fee payment & pending summary</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Batch:</span>
                  <select value={catBatchFilter} onChange={e => setCatBatchFilter(e.target.value)} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                    <option value="all">All Batches</option>
                    {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-500">Year:</span>
                  <select value={catYearFilter} onChange={e => setCatYearFilter(e.target.value)} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                    <option value="all">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100" rowSpan={2}>Dept</th>
                    <th className="px-2 py-2 text-[10px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50 text-center border-b border-blue-200" colSpan={5}>TSMFC</th>
                    <th className="px-2 py-2 text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 text-center border-b border-amber-200" colSpan={5}>Management Quota</th>
                    <th className="px-2 py-2 text-[10px] font-bold text-purple-800 uppercase tracking-wider bg-purple-50 text-center border-b border-purple-200" colSpan={5}>Convenor</th>
                    <th className="px-2 py-2 text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-slate-100 text-center border-b border-slate-300" rowSpan={2}>Total</th>
                  </tr>
                  <tr className="bg-slate-50/80">
                    <th className="px-1.5 py-2 text-[8px] font-bold text-blue-700 bg-blue-50/50 text-center">Count</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-blue-700 bg-blue-50/50 text-right">Target</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-blue-700 bg-blue-50/50 text-right">Tui. Paid</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-blue-700 bg-blue-50/50 text-right">Uni. Paid</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-blue-700 bg-blue-50/50 text-right">Pending</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-amber-700 bg-amber-50/50 text-center">Count</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-amber-700 bg-amber-50/50 text-right">Target</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-amber-700 bg-amber-50/50 text-right">Tui. Paid</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-amber-700 bg-amber-50/50 text-right">Uni. Paid</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-amber-700 bg-amber-50/50 text-right">Pending</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-purple-700 bg-purple-50/50 text-center">Count</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-purple-700 bg-purple-50/50 text-right">Target</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-purple-700 bg-purple-50/50 text-right">Tui. Paid</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-purple-700 bg-purple-50/50 text-right">Uni. Paid</th>
                    <th className="px-1.5 py-2 text-[8px] font-bold text-purple-700 bg-purple-50/50 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {catData.map((d, i) => (
                    <tr key={d.code + d.entryLabel} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="px-3 py-2.5 text-xs font-bold text-slate-800">{d.courseType}({d.code}){d.entryLabel === 'Regular' && <span className="ml-1 text-[8px] font-bold px-1 py-0.5 rounded bg-blue-50 text-blue-600">R</span>}{d.entryLabel === 'Lateral' && <span className="ml-1 text-[8px] font-bold px-1 py-0.5 rounded bg-purple-100 text-purple-700">LE</span>}</td>
                      <td className="px-1.5 py-2.5 text-xs text-blue-700 font-semibold text-center bg-blue-50/20">{d.tsmfcCount}</td>
                      <td className="px-1.5 py-2.5 text-xs text-slate-600 text-right bg-blue-50/20">{formatCurrency(d.tTarget)}</td>
                      <td className="px-1.5 py-2.5 text-xs font-semibold text-emerald-600 text-right bg-blue-50/20">{formatCurrency(d.tTuiPaid)}</td>
                      <td className="px-1.5 py-2.5 text-xs font-semibold text-teal-600 text-right bg-blue-50/20">{formatCurrency(d.tUniPaid)}</td>
                      <td className="px-1.5 py-2.5 text-xs font-bold text-right bg-blue-50/20" style={{ color: d.tBal > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(d.tBal)}</td>
                      <td className="px-1.5 py-2.5 text-xs text-amber-700 font-semibold text-center bg-amber-50/20">{d.mgmtCount}</td>
                      <td className="px-1.5 py-2.5 text-xs text-slate-600 text-right bg-amber-50/20">{formatCurrency(d.mTarget)}</td>
                      <td className="px-1.5 py-2.5 text-xs font-semibold text-emerald-600 text-right bg-amber-50/20">{formatCurrency(d.mTuiPaid)}</td>
                      <td className="px-1.5 py-2.5 text-xs font-semibold text-teal-600 text-right bg-amber-50/20">{formatCurrency(d.mUniPaid)}</td>
                      <td className="px-1.5 py-2.5 text-xs font-bold text-right bg-amber-50/20" style={{ color: d.mBal > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(d.mBal)}</td>
                      <td className="px-1.5 py-2.5 text-xs text-purple-700 font-semibold text-center bg-purple-50/20">{d.convCount}</td>
                      <td className="px-1.5 py-2.5 text-xs text-slate-600 text-right bg-purple-50/20">{formatCurrency(d.cTarget)}</td>
                      <td className="px-1.5 py-2.5 text-xs font-semibold text-emerald-600 text-right bg-purple-50/20">{formatCurrency(d.cTuiPaid)}</td>
                      <td className="px-1.5 py-2.5 text-xs font-semibold text-teal-600 text-right bg-purple-50/20">{formatCurrency(d.cUniPaid)}</td>
                      <td className="px-1.5 py-2.5 text-xs font-bold text-right bg-purple-50/20" style={{ color: d.cBal > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(d.cBal)}</td>
                      <td className="px-1.5 py-2.5 text-xs font-bold text-slate-800 text-center bg-slate-50">{d.totalCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-[#1a365d] to-[#2c5282] text-white font-bold">
                    <td className="px-3 py-3 text-xs">TOTAL</td>
                    <td className="px-1.5 py-3 text-xs text-center">{catTotals.tc}</td>
                    <td className="px-1.5 py-3 text-xs text-right">{formatCurrency(catTotals.tt)}</td>
                    <td className="px-1.5 py-3 text-xs text-right text-emerald-200">{formatCurrency(catTotals.ttp)}</td>
                    <td className="px-1.5 py-3 text-xs text-right text-teal-200">{formatCurrency(catTotals.tup)}</td>
                    <td className="px-1.5 py-3 text-xs text-right text-red-200">{formatCurrency(catTotals.tb)}</td>
                    <td className="px-1.5 py-3 text-xs text-center">{catTotals.mc}</td>
                    <td className="px-1.5 py-3 text-xs text-right">{formatCurrency(catTotals.mt)}</td>
                    <td className="px-1.5 py-3 text-xs text-right text-emerald-200">{formatCurrency(catTotals.mtp)}</td>
                    <td className="px-1.5 py-3 text-xs text-right text-teal-200">{formatCurrency(catTotals.mup)}</td>
                    <td className="px-1.5 py-3 text-xs text-right text-red-200">{formatCurrency(catTotals.mb)}</td>
                    <td className="px-1.5 py-3 text-xs text-center">{catTotals.cc}</td>
                    <td className="px-1.5 py-3 text-xs text-right">{formatCurrency(catTotals.ct)}</td>
                    <td className="px-1.5 py-3 text-xs text-right text-emerald-200">{formatCurrency(catTotals.ctp)}</td>
                    <td className="px-1.5 py-3 text-xs text-right text-teal-200">{formatCurrency(catTotals.cup)}</td>
                    <td className="px-1.5 py-3 text-xs text-right text-red-200">{formatCurrency(catTotals.cb)}</td>
                    <td className="px-1.5 py-3 text-xs text-center text-yellow-200">{catTotals.all}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}

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

      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <MessageSquarePlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Student Remarks / Notes</h3>
              <p className="text-sm text-slate-400">Add a remark or note for any student using their roll number</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Student Roll Number / HTN</label>
              <input
                type="text"
                value={remarkHTN}
                onChange={(e) => handleRemarkHTNChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all"
                placeholder="e.g. 24011A0501"
              />
              {remarkStudentName && (
                <p className="text-xs text-green-600 mt-1 font-medium">Student: {remarkStudentName}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Remark / Note</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={remarkText}
                  onChange={(e) => { setRemarkText(e.target.value); setRemarkError(''); setRemarkSuccess(''); }}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all"
                  placeholder="Enter remark or note for this student..."
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddRemark(); }}
                />
                <button
                  onClick={handleAddRemark}
                  disabled={remarkLoading}
                  className="px-5 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center gap-2 shadow-sm"
                >
                  <Send size={16} />
                  {remarkLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>

          {remarkError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 mb-3">
              <AlertCircle size={16} />
              {remarkError}
            </div>
          )}
          {remarkSuccess && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 px-4 py-2.5 rounded-xl border border-green-100 mb-3">
              <StickyNote size={16} />
              {remarkSuccess}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
