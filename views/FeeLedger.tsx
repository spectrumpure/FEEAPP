
import React from 'react';
import { useApp } from '../store';
import { Search, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, FileText, IndianRupee, Printer, Download, Share2, Calendar, User } from 'lucide-react';
import { Student, YearLocker } from '../types';

const YearSummaryCard: React.FC<{ locker: YearLocker }> = ({ locker }) => {
  const approvedTxs = locker.transactions.filter(t => t.status === 'APPROVED');
  const tuitionPaid = approvedTxs.filter(t => t.feeType === 'Tuition').reduce((sum, t) => sum + t.amount, 0);
  const univPaid = approvedTxs.filter(t => t.feeType === 'University').reduce((sum, t) => sum + t.amount, 0);
  
  const totalPaid = tuitionPaid + univPaid;
  const totalTarget = locker.tuitionTarget + locker.universityTarget + locker.otherTarget;
  const balance = totalTarget - totalPaid;
  const status = balance <= 0 ? 'Fully Paid' : totalPaid > 0 ? 'Partial' : 'Pending';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full print:border-slate-300 print:shadow-none">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm ${
            status === 'Fully Paid' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
          }`}>
            Y{locker.year}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-xs leading-tight">Year {locker.year}</h4>
            <p className="text-[9px] text-slate-400 font-medium">Locker: {formatCurrency(totalTarget)}</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
          status === 'Fully Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
          status === 'Partial' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'
        }`}>
          {status}
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1">
        <div className="grid grid-cols-2 gap-3">
           <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tuition</p>
              <p className="text-xs font-bold text-slate-800">{formatCurrency(tuitionPaid)}</p>
              <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${Math.min((tuitionPaid / Math.max(locker.tuitionTarget, 1)) * 100, 100)}%` }}
                />
              </div>
           </div>
           <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">University</p>
              <p className="text-xs font-bold text-slate-800">{formatCurrency(univPaid)}</p>
              <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full" 
                  style={{ width: `${Math.min((univPaid / Math.max(locker.universityTarget, 1)) * 100, 100)}%` }}
                />
              </div>
           </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
           <div className="flex justify-between items-center">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Balance Due</p>
                <p className={`text-sm font-black ${balance <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Progress</p>
                <p className="text-xs font-black text-slate-800">{(totalPaid / Math.max(totalTarget, 1) * 100).toFixed(0)}%</p>
              </div>
           </div>
        </div>
      </div>
      
      <div className="bg-slate-50/50 p-3 border-t border-slate-50 print:bg-white">
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Last Record</p>
        {locker.transactions.length > 0 ? (
          <div className="flex justify-between items-center text-[8px]">
            <span className="font-bold text-slate-600 truncate mr-2">{locker.transactions[0].feeType} • {locker.transactions[0].paymentDate}</span>
            <span className="font-black text-slate-800 whitespace-nowrap">{formatCurrency(locker.transactions[0].amount)}</span>
          </div>
        ) : (
          <p className="text-[7px] text-slate-300 italic">No activity</p>
        )}
      </div>
    </div>
  );
};

export const FeeLedger: React.FC<{ student: Student }> = ({ student }) => {
  const handlePrint = () => {
    window.print();
  };

  const totalPaidAllYears = student.feeLockers.reduce((sum, locker) => {
    return sum + locker.transactions.filter(t => t.status === 'APPROVED').reduce((tSum, t) => tSum + t.amount, 0);
  }, 0);

  const totalTargetAllYears = student.feeLockers.reduce((sum, locker) => {
    return sum + locker.tuitionTarget + locker.universityTarget + locker.otherTarget;
  }, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .printable-content {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Year Summary Grid tuning for A4 width */
          .year-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .rounded-3xl { border-radius: 12px !important; }
          .student-header { margin-bottom: 20px !important; }
        }
      `}</style>

      <div className="printable-content space-y-6">
        {/* Header Summary */}
        <div className="student-header bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm print:border-slate-300">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest print:bg-blue-600">
                  {student.admissionCategory}
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                  ADM YEAR: {student.admissionYear}
                </span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{student.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-sm font-medium">
                <span className="flex items-center"><FileText size={14} className="mr-1" /> HTN: <span className="font-mono font-bold text-slate-700 ml-1">{student.hallTicketNumber}</span></span>
                <span>• {student.department}</span>
                <span>• {student.course}</span>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 pt-1 border-t border-slate-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  FATHER: <span className="text-slate-800 ml-1">{student.fatherName}</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  BATCH: <span className="text-slate-800 ml-1">{student.batch}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 md:border-l border-slate-100 md:pl-8">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Collection</p>
                <h3 className="text-3xl font-black text-slate-900 leading-none">{formatCurrency(totalPaidAllYears)}</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">of {formatCurrency(totalTargetAllYears)} Total Target</p>
              </div>
              <div className="no-print">
                 <button 
                  onClick={handlePrint}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2 font-bold text-sm"
                 >
                   <Printer size={18} />
                   <span>Export PDF</span>
                 </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Year Grid */}
        <div className="year-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {student.feeLockers.map((locker) => (
            <YearSummaryCard key={locker.year} locker={locker} />
          ))}
          {(() => {
            const maxYears = student.department.startsWith('M.E') || student.course === 'M.E' ? 2 : 4;
            const existingYears = new Set(student.feeLockers.map(l => l.year));
            const emptyYears = Array.from({ length: maxYears }, (_, i) => i + 1).filter(y => !existingYears.has(y));
            return emptyYears.map(y => {
              const emptyLocker: YearLocker = {
                year: y,
                tuitionTarget: student.admissionCategory.includes('MANAGEMENT') ? 125000 : 100000,
                universityTarget: 12650,
                otherTarget: 0,
                transactions: []
              };
              return <YearSummaryCard key={`future-${y}`} locker={emptyLocker} />;
            });
          })()}
        </div>

        {/* Master Ledger List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:border-slate-300">
           <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:bg-slate-50">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center">
                <Clock size={14} className="mr-2 text-blue-600" />
                Full Academic Financial Ledger
              </h4>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Year</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Challan / Ref</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {student.feeLockers.flatMap(l => l.transactions.map(t => ({...t, year: l.year}))).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-2.5">
                        <span className="text-[10px] font-black text-blue-600">YEAR {tx.year}</span>
                      </td>
                      <td className="px-6 py-2.5">
                        <span className="text-xs font-bold text-slate-700">{tx.feeType}</span>
                      </td>
                      <td className="px-6 py-2.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500">{tx.challanNumber}</span>
                      </td>
                      <td className="px-6 py-2.5 text-xs text-slate-500">{tx.paymentDate}</td>
                      <td className="px-6 py-2.5 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                  {student.feeLockers.every(l => l.transactions.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-300 text-xs italic">No transactions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};
