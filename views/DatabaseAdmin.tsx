
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import {
  Database,
  Table2,
  Users,
  Wallet,
  StickyNote,
  Shield,
  Settings,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Layers
} from 'lucide-react';

interface TableInfo {
  students: number;
  year_lockers: number;
  fee_transactions: number;
  student_remarks: number;
  app_users: number;
  fee_locker_config: number;
}

interface DeptBreakdown {
  department: string;
  count: string;
}

interface TableData {
  total: number;
  rows: any[];
  columns: string[];
}

const TABLE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  students: { label: 'Students', icon: <Users size={16} />, color: 'blue' },
  year_lockers: { label: 'Year Lockers (Fee Targets)', icon: <Layers size={16} />, color: 'emerald' },
  fee_transactions: { label: 'Fee Transactions', icon: <Wallet size={16} />, color: 'indigo' },
  student_remarks: { label: 'Student Remarks', icon: <StickyNote size={16} />, color: 'amber' },
  app_users: { label: 'App Users', icon: <Shield size={16} />, color: 'rose' },
  fee_locker_config: { label: 'Fee Locker Config', icon: <Settings size={16} />, color: 'teal' },
};

const colorClasses: Record<string, { bg: string; text: string; border: string; light: string }> = {
  blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-200', light: 'bg-indigo-50' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-200', light: 'bg-rose-50' },
  teal: { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-200', light: 'bg-teal-50' },
};

export const DatabaseAdmin: React.FC = () => {
  const { currentUser } = useApp();
  const [overview, setOverview] = useState<{ tables: TableInfo; departmentBreakdown: DeptBreakdown[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'all' | 'dept'; dept?: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const PAGE_SIZE = 50;

  const adminHeaders = { 'x-user-role': currentUser?.role || '' };

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/db-overview', { headers: adminHeaders });
      if (res.ok) setOverview(await res.json());
    } catch (err) {
      console.error('Failed to load overview:', err);
    }
    setLoading(false);
  };

  useEffect(() => { loadOverview(); }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadTable = async (tableName: string, offset = 0) => {
    setTableLoading(true);
    try {
      const res = await fetch(`/api/admin/table/${tableName}?limit=${PAGE_SIZE}&offset=${offset}`, { headers: adminHeaders });
      if (res.ok) setTableData(await res.json());
    } catch (err) {
      console.error('Failed to load table:', err);
    }
    setTableLoading(false);
  };

  const handleViewTable = (tableName: string) => {
    setActiveTable(tableName);
    setPage(0);
    loadTable(tableName, 0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (activeTable) loadTable(activeTable, newPage * PAGE_SIZE);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const url = deleteConfirm.type === 'all'
        ? '/api/admin/students/all'
        : `/api/admin/students/department/${encodeURIComponent(deleteConfirm.dept!)}`;
      const res = await fetch(url, { method: 'DELETE', headers: adminHeaders });
      if (res.ok) {
        const data = await res.json();
        setToast({ message: deleteConfirm.type === 'all' ? 'All student data deleted successfully' : `Deleted ${data.deleted} students from ${deleteConfirm.dept}`, type: 'success' });
        loadOverview();
        if (activeTable) loadTable(activeTable, page * PAGE_SIZE);
        window.location.reload();
      } else {
        setToast({ message: 'Delete failed', type: 'error' });
      }
    } catch {
      setToast({ message: 'Delete failed', type: 'error' });
    }
    setDeleteLoading(false);
    setDeleteConfirm(null);
  };

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val).substring(0, 100);
    const s = String(val);
    return s.length > 60 ? s.substring(0, 60) + '...' : s;
  };

  if (currentUser?.role !== 'ADMIN') {
    return <div className="p-8 text-center text-slate-400">Access restricted to administrators only.</div>;
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#2c5282] text-white rounded-xl"><Database size={22} /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Database Administration</h1>
            <p className="text-xs text-slate-400">View and manage backend data</p>
          </div>
        </div>
        <button onClick={loadOverview} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : overview && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(overview.tables).map(([key, count]) => {
              const meta = TABLE_META[key];
              const colors = colorClasses[meta.color];
              return (
                <button
                  key={key}
                  onClick={() => handleViewTable(key)}
                  className={`p-4 bg-white rounded-xl border ${activeTable === key ? `${colors.border} ring-2 ring-${meta.color}-100` : 'border-slate-200'} hover:shadow-md transition-all text-left`}
                >
                  <div className={`p-2 ${colors.light} ${colors.text} rounded-lg inline-flex mb-2`}>{meta.icon}</div>
                  <p className="text-2xl font-bold text-slate-800">{count}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{meta.label}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Table2 size={16} className="text-slate-400" />
                Department Breakdown
              </h3>
              {overview.departmentBreakdown.length === 0 ? (
                <p className="text-xs text-slate-300 py-4 text-center">No students in database</p>
              ) : (
                <div className="space-y-2">
                  {overview.departmentBreakdown.map(d => (
                    <div key={d.department} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                      <span className="text-xs font-semibold text-slate-700">{d.department}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{d.count}</span>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'dept', dept: d.department })}
                          className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                          title={`Delete all ${d.department} students`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {overview.departmentBreakdown.length > 0 && (
                <button
                  onClick={() => setDeleteConfirm({ type: 'all' })}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete All Student Data
                </button>
              )}
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
              {!activeTable ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <Eye size={32} className="mb-2" />
                  <p className="text-sm font-medium">Click a table card above to view its data</p>
                </div>
              ) : (
                <>
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 ${colorClasses[TABLE_META[activeTable].color].light} ${colorClasses[TABLE_META[activeTable].color].text} rounded-lg`}>
                        {TABLE_META[activeTable].icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{TABLE_META[activeTable].label}</h3>
                        <p className="text-[10px] text-slate-400">{tableData?.total || 0} total records</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handlePageChange(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50"><ChevronLeft size={14} /></button>
                      <span className="text-[10px] text-slate-400 font-medium">Page {page + 1} of {Math.max(1, Math.ceil((tableData?.total || 0) / PAGE_SIZE))}</span>
                      <button onClick={() => handlePageChange(page + 1)} disabled={!tableData || (page + 1) * PAGE_SIZE >= tableData.total} className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50"><ChevronRight size={14} /></button>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    {tableLoading ? (
                      <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : tableData && tableData.rows.length > 0 ? (
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="sticky top-0 bg-white z-10">
                          <tr className="border-b border-slate-200">
                            <th className="px-3 py-2 text-[9px] font-semibold text-slate-400 uppercase">#</th>
                            {tableData.columns.map(col => (
                              <th key={col} className="px-3 py-2 text-[9px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{col.replace(/_/g, ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {tableData.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-3 py-2 text-[10px] text-slate-300">{page * PAGE_SIZE + idx + 1}</td>
                              {tableData.columns.map(col => (
                                <td key={col} className="px-3 py-2 text-[11px] text-slate-600 whitespace-nowrap max-w-[200px] truncate" title={String(row[col] ?? '')}>
                                  {col === 'password' ? '********' : formatValue(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-center py-12 text-slate-300 text-sm">No records found</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl"><AlertTriangle size={20} /></div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Confirm Delete</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              {deleteConfirm.type === 'all'
                ? 'Are you sure you want to delete ALL student data? This will remove all students, fee lockers, transactions, and remarks.'
                : `Are you sure you want to delete all students from the "${deleteConfirm.dept}" department? This will also remove their fee lockers, transactions, and remarks.`
              }
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 bg-slate-100 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
