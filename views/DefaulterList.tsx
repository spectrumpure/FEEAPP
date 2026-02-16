
import React, { useState } from 'react';
import { useApp } from '../store';
import { DEPARTMENTS } from '../constants';
import { AlertCircle, Search, ChevronDown, ChevronRight, FileText } from 'lucide-react';

export const DefaulterList: React.FC = () => {
  const { students } = useApp();
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const getDefaulters = () => {
    return students.filter(s => {
      const totalTarget = s.feeLockers.reduce((sum, l) => sum + l.tuitionTarget + l.universityTarget, 0);
      const totalPaid = s.feeLockers.reduce((sum, l) => {
        return sum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tS, t) => tS + t.amount, 0);
      }, 0);
      return totalTarget > 0 && totalPaid < totalTarget;
    });
  };

  const allDefaulters = getDefaulters();

  const filteredDefaulters = allDefaulters.filter(s => {
    const matchesSearch = searchTerm.trim().length === 0 ||
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.hallTicketNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'all' || s.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const deptGroups = DEPARTMENTS.map(dept => {
    const deptDefaulters = filteredDefaulters.filter(s => s.department === dept.name);
    const totalDue = deptDefaulters.reduce((sum, s) => {
      const target = s.feeLockers.reduce((sm, l) => sm + l.tuitionTarget + l.universityTarget, 0);
      const paid = s.feeLockers.reduce((sm, l) => {
        return sm + l.transactions.filter(t => t.status === 'APPROVED').reduce((tS, t) => tS + t.amount, 0);
      }, 0);
      return sum + (target - paid);
    }, 0);
    return { dept, defaulters: deptDefaulters, totalDue };
  }).filter(g => g.defaulters.length > 0);

  const totalDefaulterCount = filteredDefaulters.length;
  const totalOutstanding = filteredDefaulters.reduce((sum, s) => {
    const target = s.feeLockers.reduce((sm, l) => sm + l.tuitionTarget + l.universityTarget, 0);
    const paid = s.feeLockers.reduce((sm, l) => {
      return sm + l.transactions.filter(t => t.status === 'APPROVED').reduce((tS, t) => tS + t.amount, 0);
    }, 0);
    return sum + (target - paid);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1a365d] via-[#2c5282] to-[#2b6cb0] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
          <img src="/mjcet-logo.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <img src="/mjcet-logo.png" alt="MJCET" className="w-14 h-14 object-contain bg-white/10 rounded-xl p-1.5" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Fee Defaulter List - Department Wise</h1>
            <p className="text-blue-200 text-xs mt-0.5">Muffakham Jah College of Engineering & Technology</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Defaulters</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalDefaulterCount}</p>
          <p className="text-xs text-slate-400 mt-1">out of {students.length} students</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalOutstanding)}</p>
          <p className="text-xs text-slate-400 mt-1">pending fee collection</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Departments Affected</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{deptGroups.length}</p>
          <p className="text-xs text-slate-400 mt-1">out of {DEPARTMENTS.length} departments</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by Name or HTN..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm text-slate-700"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="all">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {deptGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-semibold">No Fee Defaulters Found</p>
            <p className="text-slate-400 text-sm mt-1">All students are up to date with their fee payments.</p>
          </div>
        ) : (
          deptGroups.map(({ dept, defaulters, totalDue }) => {
            const isExpanded = expandedDept === dept.name;
            return (
              <div key={dept.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setExpandedDept(isExpanded ? null : dept.name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                    <div className="text-left">
                      <p className="font-semibold text-slate-800 text-sm">{dept.name}</p>
                      <p className="text-xs text-slate-400">{dept.courseType} - {dept.duration} Year Program</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Defaulters</p>
                      <p className="text-sm font-bold text-red-600">{defaulters.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Outstanding</p>
                      <p className="text-sm font-bold text-red-600">{formatCurrency(totalDue)}</p>
                    </div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">S.No</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hall Ticket No</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Father Name</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Target</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance Due</th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Year Wise</th>
                        </tr>
                      </thead>
                      <tbody>
                        {defaulters.map((s, idx) => {
                          const totalTarget = s.feeLockers.reduce((sum, l) => sum + l.tuitionTarget + l.universityTarget, 0);
                          const totalPaid = s.feeLockers.reduce((sum, l) => {
                            return sum + l.transactions.filter(t => t.status === 'APPROVED').reduce((tS, t) => tS + t.amount, 0);
                          }, 0);
                          const balanceDue = totalTarget - totalPaid;
                          return (
                            <tr key={s.hallTicketNumber} className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors">
                              <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-slate-700">{s.hallTicketNumber}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{s.name}</td>
                              <td className="px-4 py-3 text-slate-600">{s.fatherName}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(totalTarget)}</td>
                              <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(totalPaid)}</td>
                              <td className="px-4 py-3 text-right text-red-600 font-bold">{formatCurrency(balanceDue)}</td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center gap-1">
                                  {s.feeLockers.map(l => {
                                    const lTarget = l.tuitionTarget + l.universityTarget;
                                    const lPaid = l.transactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0);
                                    const lDue = lTarget - lPaid;
                                    let bgColor = 'bg-slate-200 text-slate-500';
                                    if (lTarget > 0 && lDue <= 0) bgColor = 'bg-green-100 text-green-700';
                                    else if (lTarget > 0 && lPaid > 0) bgColor = 'bg-orange-100 text-orange-700';
                                    else if (lTarget > 0) bgColor = 'bg-red-100 text-red-700';
                                    return (
                                      <span key={l.year} className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-[10px] font-bold ${bgColor}`} title={`Y${l.year}: Due ${formatCurrency(lDue)}`}>
                                        Y{l.year}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
