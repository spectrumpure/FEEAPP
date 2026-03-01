
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import { StudentRemark, UserRole } from '../types';
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
  AlertCircle,
  Download,
  GraduationCap,
  IndianRupee,
  AlertTriangle
} from 'lucide-react';
import { Student } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import { Calendar } from 'lucide-react';

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
  const { students, departments, transactions, currentUser, getFeeTargets } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [remarkHTN, setRemarkHTN] = useState('');
  const [remarkText, setRemarkText] = useState('');
  const [remarkError, setRemarkError] = useState('');
  const [remarkSuccess, setRemarkSuccess] = useState('');
  const [remarkLoading, setRemarkLoading] = useState(false);
  const [remarkStudentName, setRemarkStudentName] = useState('');

  const [studentRemarks, setStudentRemarks] = useState<StudentRemark[]>([]);
  const [remarksLoading, setRemarksLoading] = useState(false);

  const [yearFilter, setYearFilter] = useState<number>(0);
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [fyFilter, setFyFilter] = useState<string>('all');
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
    const dept = departments.find(d => matchDept(s.department, d));
    const duration = dept?.duration || 4;
    let total = 0;
    for (let y = 1; y <= Math.min(s.currentYear, duration); y++) {
      const targets = getFeeTargets(s.department, y, s.entryType, s.admissionYear);
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

  const formatCompact = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)} K`;
    return `₹${val}`;
  };

  const filteredStudents = useMemo(() => {
    if (yearFilter === 0) return students;
    return students.filter(s => s.feeLockers.some(l => l.year === yearFilter));
  }, [students, yearFilter]);

  const filteredTotalStudents = filteredStudents.length;
  const filteredApprovedTotal = filteredStudents.reduce((sum, s) => {
    return sum + s.feeLockers
      .filter(l => yearFilter === 0 || l.year === yearFilter)
      .reduce((lSum, l) => lSum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tSum, t) => tSum + t.amount, 0), 0);
  }, 0);
  const filteredTargetTotal = filteredStudents.reduce((sum, s) => {
    if (yearFilter === 0) return sum + getStudentTotalTarget(s);
    const locker = s.feeLockers.find(l => l.year === yearFilter);
    return sum + (locker ? locker.tuitionTarget + locker.universityTarget : 0);
  }, 0);
  const filteredPendingApprovals = transactions.filter(t => {
    if (t.status !== 'PENDING') return false;
    if (yearFilter === 0) return true;
    return t.targetYear === yearFilter;
  }).length;
  const filteredPendingTotal = Math.max(0, filteredTargetTotal - filteredApprovedTotal);
  const filteredCollectionPct = filteredTargetTotal > 0 ? ((filteredApprovedTotal / filteredTargetTotal) * 100).toFixed(1) : '0.0';

  const collectionPct = targetTotal > 0 ? ((approvedTotal / targetTotal) * 100).toFixed(1) : '0.0';

  const fyCollectionData = useMemo(() => {
    const fyMap: Record<string, { tuition: number; university: number; other: number; count: number }> = {};
    const relevantStudents = yearFilter === 0 ? students : filteredStudents;
    relevantStudents.forEach(s => {
      s.feeLockers
        .filter(l => yearFilter === 0 || l.year === yearFilter)
        .forEach(l => {
          l.transactions.filter(t => t.status === 'APPROVED').forEach(t => {
            const fy = t.financialYear || 'Unknown';
            if (!fyMap[fy]) fyMap[fy] = { tuition: 0, university: 0, other: 0, count: 0 };
            if (t.feeType === 'Tuition') fyMap[fy].tuition += t.amount;
            else if (t.feeType === 'University') fyMap[fy].university += t.amount;
            else fyMap[fy].other += t.amount;
            fyMap[fy].count++;
          });
        });
    });
    return Object.entries(fyMap)
      .map(([fy, data]) => ({ fy, ...data, total: data.tuition + data.university + data.other }))
      .sort((a, b) => a.fy.localeCompare(b.fy));
  }, [students, filteredStudents, yearFilter]);

  const allFYs = useMemo(() => fyCollectionData.map(d => d.fy), [fyCollectionData]);

  const filteredFYData = useMemo(() => {
    if (fyFilter === 'all') return fyCollectionData;
    return fyCollectionData.filter(d => d.fy === fyFilter);
  }, [fyCollectionData, fyFilter]);

  const fySummaryCards = useMemo(() => {
    return filteredFYData.map(d => ({
      fy: d.fy,
      collected: d.total,
      tuition: d.tuition,
      university: d.university,
      txCount: d.count
    }));
  }, [filteredFYData]);

  const isManagement = (cat: string) => { const u = (cat || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); return u.includes('MANAGEMENT') || u === 'MQ' || u === 'SPOT'; };
  const isConvenor = (cat: string) => { const u = (cat || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); return u.includes('CONVENOR') || u.includes('CONVENER') || u === 'CON'; };
  const isTSMFC = (cat: string) => { const u = (cat || '').trim().toUpperCase(); return u.includes('TSMFC') || u.includes('TSECET'); };

  const allBatches = useMemo(() => {
    return Array.from(new Set(students.map(s => s.batch))).filter(Boolean).sort().reverse();
  }, [students]);

  const displayBatches = useMemo(() => {
    if (batchFilter === 'all') return allBatches.slice(0, 4);
    return allBatches.filter(b => b === batchFilter);
  }, [allBatches, batchFilter]);

  const batchSummaries = useMemo(() => {
    return displayBatches.map(batch => {
      const batchStudents = students.filter(s => s.batch === batch);
      const totalCount = batchStudents.length;

      const getGroupStats = (filterFn: (cat: string) => boolean) => {
        const group = batchStudents.filter(s => filterFn(s.admissionCategory));
        const count = group.length;
        const collected = group.reduce((sum, s) => {
          return sum + s.feeLockers.reduce((lSum, l) => {
            return lSum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tSum, t) => tSum + t.amount, 0);
          }, 0);
        }, 0);
        const target = group.reduce((sum, s) => sum + getStudentTotalTarget(s), 0);
        const pending = target - collected;
        return { count, collected, target, pending: Math.max(0, pending) };
      };

      const totalCollected = batchStudents.reduce((sum, s) => {
        return sum + s.feeLockers.reduce((lSum, l) => {
          return lSum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tSum, t) => tSum + t.amount, 0);
        }, 0);
      }, 0);
      const totalTarget = batchStudents.reduce((sum, s) => sum + getStudentTotalTarget(s), 0);
      const totalPending = Math.max(0, totalTarget - totalCollected);
      const pct = totalTarget > 0 ? ((totalCollected / totalTarget) * 100) : 0;

      return {
        batch,
        totalCount,
        totalCollected,
        totalTarget,
        totalPending,
        pct,
        management: getGroupStats(isManagement),
        convenor: getGroupStats(isConvenor),
        tsmfc: getGroupStats(isTSMFC),
      };
    });
  }, [displayBatches, students]);

  const deptShort = (d: string) => {
    const m = d.match(/\(([^)]+)\)/);
    return m ? m[1] : d.replace('B.E ', '').replace('M.E ', '').slice(0, 6);
  };

  const deptCollectionData = useMemo(() => {
    return departments.map(dept => {
      const deptStudents = filteredStudents.filter(s => matchDept(s.department, dept));
      const collection = deptStudents.reduce((sum, s) => {
        return sum + s.feeLockers
          .filter(l => yearFilter === 0 || l.year === yearFilter)
          .reduce((lSum, l) => {
            return lSum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tSum, t) => tSum + t.amount, 0);
          }, 0);
      }, 0);
      const target = deptStudents.reduce((sum, s) => {
        if (yearFilter === 0) return sum + getStudentTotalTarget(s);
        const locker = s.feeLockers.find(l => l.year === yearFilter);
        return sum + (locker ? locker.tuitionTarget + locker.universityTarget : 0);
      }, 0);
      return { name: deptShort(dept.name), collection, target, fullName: dept.name };
    }).filter(d => d.target > 0 || d.collection > 0);
  }, [departments, filteredStudents, yearFilter]);

  const deptDefaulterData = useMemo(() => {
    return departments.map(dept => {
      const deptStudents = filteredStudents.filter(s => matchDept(s.department, dept));
      const defaulters = deptStudents.filter(s => {
        if (yearFilter === 0) {
          const st = getStudentTotalTarget(s);
          const sp = s.feeLockers.reduce((sum, l) => sum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tS, t) => tS + t.amount, 0), 0);
          return st > 0 && sp < st;
        }
        const locker = s.feeLockers.find(l => l.year === yearFilter);
        if (!locker) return false;
        const st = locker.tuitionTarget + locker.universityTarget;
        const sp = locker.transactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0);
        return st > 0 && sp < st;
      }).length;
      return { name: deptShort(dept.name), defaulters, fullName: dept.name };
    }).filter(d => d.defaulters > 0);
  }, [departments, filteredStudents, yearFilter]);

  const categoryPieData = useMemo(() => {
    const mgmt = filteredStudents.filter(s => isManagement(s.admissionCategory)).length;
    const conv = filteredStudents.filter(s => isConvenor(s.admissionCategory)).length;
    const tsmfc = filteredStudents.filter(s => isTSMFC(s.admissionCategory)).length;
    const other = filteredStudents.length - mgmt - conv - tsmfc;
    const data = [];
    if (tsmfc > 0) data.push({ name: 'TSMFC', value: tsmfc, fill: '#3b82f6' });
    if (mgmt > 0) data.push({ name: 'Management', value: mgmt, fill: '#f59e0b' });
    if (conv > 0) data.push({ name: 'Convenor', value: conv, fill: '#8b5cf6' });
    if (other > 0) data.push({ name: 'Other', value: other, fill: '#94a3b8' });
    return data;
  }, [filteredStudents]);

  const COLORS_BLUE = ['#1a365d', '#2c5282', '#2b6cb0', '#3182ce', '#4299e1', '#63b3ed', '#90cdf4', '#bee3f8', '#1e40af', '#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
  const COLORS_RED = ['#9b2c2c', '#c53030', '#e53e3e', '#fc8181', '#feb2b2', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a'];

  const batchColors = ['from-blue-600 to-blue-800', 'from-indigo-600 to-indigo-800', 'from-purple-600 to-purple-800', 'from-slate-600 to-slate-800'];
  const batchBgColors = ['bg-blue-50 border-blue-200', 'bg-indigo-50 border-indigo-200', 'bg-purple-50 border-purple-200', 'bg-slate-50 border-slate-200'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-[#1a365d] via-[#2c5282] to-[#2b6cb0] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Muffakham Jah College of Engineering & Technology</h1>
            <p className="text-blue-200 text-xs mt-0.5">Autonomous & Accredited by NAAC with A+ and NBA | Affiliated to Osmania University & Approved by AICTE</p>
            <p className="text-blue-300/70 text-[10px] mt-0.5 font-medium uppercase tracking-wider">Sultan-Ul-Uloom Education Society | Fee Management System</p>
          </div>
          {isAdmin && (
            <button onClick={() => {
              fetch('/api/export/students-csv')
                .then(r => r.blob())
                .then(blob => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'students_export.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                });
            }} className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm cursor-pointer shrink-0">
              <Download size={16} />
              <span>Export Data</span>
            </button>
          )}
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-[#1a365d]" />
          <span className="text-sm font-bold text-slate-700">Filter by Student Year</span>
        </div>
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3, 4].map(y => (
            <button
              key={y}
              onClick={() => setYearFilter(y)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                yearFilter === y
                  ? 'bg-[#1a365d] text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {y === 0 ? 'All Years' : `${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard 
          icon={<Users size={24} />} 
          label={yearFilter === 0 ? "Total Students" : `Year ${yearFilter} Students`} 
          value={filteredTotalStudents.toString()} 
          subValue={yearFilter === 0 ? `Across ${departments.length} Departments` : `of ${totalStudents} total students`} 
          color="bg-blue-600"
        />
        <StatCard 
          icon={<BadgeDollarSign size={24} />} 
          label={yearFilter === 0 ? "Total Collection" : `Year ${yearFilter} Collection`} 
          value={formatCurrency(filteredApprovedTotal)} 
          subValue={`Target: ${formatCurrency(filteredTargetTotal)}`} 
          color="bg-emerald-600"
        />
        <StatCard 
          icon={<AlertTriangle size={24} />} 
          label={yearFilter === 0 ? "Total Pending" : `Year ${yearFilter} Pending`} 
          value={formatCurrency(filteredPendingTotal)} 
          subValue={`${filteredCollectionPct}% collected so far`} 
          color="bg-rose-600"
        />
        <StatCard 
          icon={<Clock size={24} />} 
          label="Pending Approvals" 
          value={filteredPendingApprovals.toString()} 
          subValue="Transactions awaiting review" 
          color="bg-amber-600"
        />
        <StatCard 
          icon={<CreditCard size={24} />} 
          label="Collection Efficiency" 
          value={`${filteredCollectionPct}%`} 
          subValue="Approved vs Total Target" 
          color="bg-violet-600"
        />
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">{yearFilter === 0 ? 'Overall' : `Year ${yearFilter}`} Collection Progress</h3>
          <span className="text-xs font-bold text-[#1a365d]">{filteredCollectionPct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#1a365d] to-[#2b6cb0] rounded-full transition-all duration-700" style={{width: `${Math.min(parseFloat(filteredCollectionPct), 100)}%`}}></div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
          <span>Collected: {formatCurrency(filteredApprovedTotal)}</span>
          <span className="text-rose-500 font-semibold">Pending: {formatCurrency(filteredPendingTotal)}</span>
          <span>Target: {formatCurrency(filteredTargetTotal)}</span>
        </div>
      </div>

      {allBatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <GraduationCap size={20} className="text-[#1a365d]" />
              <div>
                <h3 className="text-lg font-bold text-slate-800">Batch-wise Fee Overview</h3>
                <p className="text-sm text-slate-400">{batchFilter === 'all' ? `Last ${displayBatches.length} batches` : `Batch ${batchFilter}`} - Category wise breakdown</p>
              </div>
            </div>
            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none cursor-pointer"
            >
              <option value="all">Last 4 Batches</option>
              {allBatches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {batchSummaries.map((bs, bIdx) => (
              <div key={bs.batch} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className={`bg-gradient-to-r ${batchColors[bIdx]} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold">Batch</p>
                      <h4 className="text-xl font-bold">{bs.batch}</h4>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="bg-white/20 rounded-lg px-3 py-1.5">
                          <p className="text-[10px] text-white/70 uppercase">Students</p>
                          <p className="text-lg font-bold">{bs.totalCount}</p>
                        </div>
                        <div className="bg-white/20 rounded-lg px-3 py-1.5">
                          <p className="text-[10px] text-white/70 uppercase">Efficiency</p>
                          <p className="text-lg font-bold">{bs.pct.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-white/80 rounded-full transition-all duration-500" style={{ width: `${Math.min(bs.pct, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-white/70">
                      <span>Collected: {formatCompact(bs.totalCollected)}</span>
                      <span>Pending: {formatCompact(bs.totalPending)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gradient-to-b from-blue-50 to-white rounded-xl border border-blue-100">
                      <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1">TSMFC</p>
                      <p className="text-lg font-bold text-blue-800">{bs.tsmfc.count}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">students</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-b from-amber-50 to-white rounded-xl border border-amber-100">
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Management</p>
                      <p className="text-lg font-bold text-amber-800">{bs.management.count}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">students</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-b from-purple-50 to-white rounded-xl border border-purple-100">
                      <p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest mb-1">Convenor</p>
                      <p className="text-lg font-bold text-purple-800">{bs.convenor.count}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">students</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: 'TSMFC', data: bs.tsmfc, bgClass: 'bg-blue-50/50 border-blue-100/50', barClass: 'bg-blue-500', textClass: 'text-blue-700' },
                      { label: 'Management', data: bs.management, bgClass: 'bg-amber-50/50 border-amber-100/50', barClass: 'bg-amber-500', textClass: 'text-amber-700' },
                      { label: 'Convenor', data: bs.convenor, bgClass: 'bg-purple-50/50 border-purple-100/50', barClass: 'bg-purple-500', textClass: 'text-purple-700' },
                    ].map(cat => (
                      cat.data.count > 0 && (
                        <div key={cat.label} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${cat.bgClass}`}>
                          <div className={`w-1.5 h-8 rounded-full ${cat.barClass}`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${cat.textClass}`}>{cat.label}</span>
                              <span className="text-[10px] text-slate-400">{cat.data.target > 0 ? ((cat.data.collected / cat.data.target) * 100).toFixed(0) : 0}%</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-xs font-semibold text-green-600">{formatCompact(cat.data.collected)}</span>
                              <span className="text-xs font-semibold text-red-500">{formatCompact(cat.data.pending)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-slate-400">Collected</span>
                              <span className="text-[9px] text-slate-400">Pending</span>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fyCollectionData.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <IndianRupee size={20} className="text-[#1a365d]" />
              <div>
                <h3 className="text-lg font-bold text-slate-800">Financial Year-Wise Collection</h3>
                <p className="text-sm text-slate-400">{fyFilter === 'all' ? 'All financial years' : `FY ${fyFilter}`}{yearFilter === 0 ? '' : ` · Year ${yearFilter} students`} - Tuition & University fee breakdown</p>
              </div>
            </div>
            <select
              value={fyFilter}
              onChange={e => setFyFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none cursor-pointer"
            >
              <option value="all">All Financial Years</option>
              {allFYs.map(fy => (
                <option key={fy} value={fy}>FY {fy}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
            {fySummaryCards.map((card, idx) => {
              const cardColors = ['border-blue-200 bg-blue-50', 'border-indigo-200 bg-indigo-50', 'border-purple-200 bg-purple-50', 'border-teal-200 bg-teal-50', 'border-cyan-200 bg-cyan-50'];
              const textColors = ['text-blue-800', 'text-indigo-800', 'text-purple-800', 'text-teal-800', 'text-cyan-800'];
              const labelColors = ['text-blue-600', 'text-indigo-600', 'text-purple-600', 'text-teal-600', 'text-cyan-600'];
              return (
                <div key={card.fy} className={`rounded-xl border p-4 ${cardColors[idx % 5]}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${labelColors[idx % 5]} mb-1`}>FY {card.fy}</p>
                  <p className={`text-xl font-bold ${textColors[idx % 5]}`}>{formatCompact(card.collected)}</p>
                  <div className="mt-2 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500">Tuition</span>
                      <span className="text-[10px] font-semibold text-slate-700">{formatCompact(card.tuition)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500">University</span>
                      <span className="text-[10px] font-semibold text-slate-700">{formatCompact(card.university)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[9px] text-slate-400">Transactions</span>
                      <span className="text-[10px] font-bold text-slate-600">{card.txCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredFYData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="fy" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 600}} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(val: number) => `₹${(val/100000).toFixed(0)}L`} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}} formatter={(val: number) => formatCurrency(val)} />
                  <Legend wrapperStyle={{fontSize: '11px', fontWeight: 600}} />
                  <Bar dataKey="tuition" name="Tuition Fee" fill="#2c5282" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="university" name="University Fee" fill="#63b3ed" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Fee Collection by Department</h3>
            <p className="text-sm text-slate-400">{yearFilter === 0 ? 'Total' : `Year ${yearFilter}`} approved collection per department</p>
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
            <h3 className="text-lg font-bold text-slate-800">Category Distribution</h3>
            <p className="text-sm text-slate-400">Student count by admission category</p>
          </div>
          <div className="h-72">
            {categoryPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No category data.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Fee Defaulters by Department
            </h3>
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
