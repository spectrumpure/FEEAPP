
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  CheckSquare, 
  Square,
  User,
  IndianRupee,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { FeeTransaction } from '../types';

export const Approvals: React.FC = () => {
  const { transactions, students, approveTransaction, rejectTransaction, bulkApproveTransactions, bulkRejectTransactions, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const pendingTxs = useMemo(() => 
    transactions.filter(t => t.status === 'PENDING'),
    [transactions]
  );

  const filteredTxs = pendingTxs.filter(t => 
    t.studentHTN.includes(searchTerm) || 
    t.challanNumber.includes(searchTerm)
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTxs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTxs.map(t => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    if (!currentUser) return;
    if (window.confirm(`Are you sure you want to approve ${selectedIds.length} transactions?`)) {
      bulkApproveTransactions(selectedIds, currentUser.name);
      setSelectedIds([]);
    }
  };

  const handleBulkReject = () => {
    if (window.confirm(`Are you sure you want to reject ${selectedIds.length} transactions?`)) {
      bulkRejectTransactions(selectedIds);
      setSelectedIds([]);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search HTN or Challan No..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pending Review</p>
            <p className="text-lg font-black text-blue-600 leading-none">{pendingTxs.length}</p>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-20 bg-blue-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-4 ml-2">
            <CheckSquare size={20} />
            <div>
              <p className="text-sm font-bold">{selectedIds.length} Transactions Selected</p>
              <p className="text-[10px] opacity-80 font-medium">Ready for bulk processing</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleBulkReject}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors border border-white/20"
            >
              Bulk Reject
            </button>
            <button 
              onClick={handleBulkApprove}
              className="px-6 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-black transition-colors shadow-lg"
            >
              Bulk Approve
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600 transition-colors">
                    {selectedIds.length === filteredTxs.length && filteredTxs.length > 0 ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student HTN</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Challan / Mode</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTxs.map(tx => {
                const isSelected = selectedIds.includes(tx.id);
                const student = students.find(s => s.hallTicketNumber === tx.studentHTN);
                
                return (
                  <tr key={tx.id} className={`transition-colors hover:bg-slate-50/30 ${isSelected ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleSelect(tx.id)} className="text-slate-300 hover:text-blue-600 transition-colors">
                        {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-bold text-slate-800">{tx.studentHTN}</span>
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{student?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                        {tx.feeType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(tx.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{tx.challanNumber}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{tx.paymentMode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">{tx.paymentDate}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => rejectTransaction(tx.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                        <button 
                          onClick={() => approveTransaction(tx.id, currentUser?.name || 'Accountant')}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                          title="Approve"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTxs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                      <ShieldCheck size={48} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">No Pending Approvals</p>
                        <p className="text-xs text-slate-400">All recent fee records have been processed.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
