
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import {
  GraduationCap,
  Users,
  UserPlus,
  Building2,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react';

export const StudentEnrollment: React.FC = () => {
  const { students, departments } = useApp();
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const batches = useMemo(() => {
    const batchSet = new Set(students.map(s => s.batch).filter(Boolean));
    return Array.from(batchSet).sort().reverse();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (batchFilter === 'all') return students;
    return students.filter(s => s.batch === batchFilter);
  }, [students, batchFilter]);

  const enrollmentData = useMemo(() => {
    return departments.map(dept => {
      const deptStudents = filteredStudents.filter(
        s => s.department === dept.name || s.department === dept.code || s.department.toUpperCase() === dept.code.toUpperCase()
      );
      const regular = deptStudents.filter(s => s.entryType !== 'LATERAL');
      const lateral = deptStudents.filter(s => s.entryType === 'LATERAL');

      const yearBreakdown: Record<number, { regular: number; lateral: number; total: number }> = {};
      for (let y = 1; y <= dept.duration; y++) {
        const yearRegular = regular.filter(s => s.currentYear === y).length;
        const yearLateral = lateral.filter(s => s.currentYear === y).length;
        yearBreakdown[y] = { regular: yearRegular, lateral: yearLateral, total: yearRegular + yearLateral };
      }

      return {
        dept,
        total: deptStudents.length,
        regular: regular.length,
        lateral: lateral.length,
        yearBreakdown,
      };
    }).filter(d => d.total > 0 || batchFilter === 'all');
  }, [departments, filteredStudents, batchFilter]);

  const totals = useMemo(() => {
    return enrollmentData.reduce(
      (acc, d) => ({
        total: acc.total + d.total,
        regular: acc.regular + d.regular,
        lateral: acc.lateral + d.lateral,
      }),
      { total: 0, regular: 0, lateral: 0 }
    );
  }, [enrollmentData]);

  const beData = enrollmentData.filter(d => d.dept.courseType === 'BE');
  const meData = enrollmentData.filter(d => d.dept.courseType === 'ME');

  const beTotals = beData.reduce((acc, d) => ({ total: acc.total + d.total, regular: acc.regular + d.regular, lateral: acc.lateral + d.lateral }), { total: 0, regular: 0, lateral: 0 });
  const meTotals = meData.reduce((acc, d) => ({ total: acc.total + d.total, regular: acc.regular + d.regular, lateral: acc.lateral + d.lateral }), { total: 0, regular: 0, lateral: 0 });

  const toggleDept = (code: string) => {
    setExpandedDept(expandedDept === code ? null : code);
  };

  const exportEnrollmentData = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    let tableRows = '';
    enrollmentData.forEach(d => {
      tableRows += `<tr>
        <td style="font-weight:600">${d.dept.name} (${d.dept.code})</td>
        <td class="text-center">${d.dept.courseType}</td>
        <td class="text-center">${d.regular}</td>
        <td class="text-center">${d.lateral}</td>
        <td class="text-center font-bold">${d.total}</td>
      </tr>`;
    });

    tableRows += `<tr class="summary-row">
      <td style="font-weight:700">B.E Total</td><td class="text-center">B.E</td>
      <td class="text-center">${beTotals.regular}</td><td class="text-center">${beTotals.lateral}</td>
      <td class="text-center font-bold">${beTotals.total}</td>
    </tr>`;
    tableRows += `<tr class="summary-row">
      <td style="font-weight:700">M.E Total</td><td class="text-center">M.E</td>
      <td class="text-center">${meTotals.regular}</td><td class="text-center">${meTotals.lateral}</td>
      <td class="text-center font-bold">${meTotals.total}</td>
    </tr>`;
    tableRows += `<tr style="background:#1a365d;color:white">
      <td style="font-weight:700" colspan="2">Grand Total</td>
      <td class="text-center font-bold">${totals.regular}</td><td class="text-center font-bold">${totals.lateral}</td>
      <td class="text-center font-bold">${totals.total}</td>
    </tr>`;

    win.document.write(`<!DOCTYPE html><html><head><title>Student Enrollment Summary</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1a202c; }
  .header { display: flex; align-items: center; justify-content: center; gap: 14px; border-bottom: 3px double #1a365d; padding-bottom: 12px; margin-bottom: 16px; }
  .header img { width: 64px; height: 64px; object-fit: contain; flex-shrink: 0; }
  .header-text { text-align: center; }
  .header .society { font-size: 10px; font-weight: 600; color: #4a5568; letter-spacing: 2px; text-transform: uppercase; }
  .header .college { font-size: 15px; font-weight: 800; color: #1a365d; margin: 2px 0; }
  .header .address { font-size: 9px; color: #718096; }
  .header .accreditation { font-size: 8px; color: #000; margin-top: 1px; font-weight: 600; }
  .report-title { text-align: center; font-size: 13px; font-weight: 700; color: #2c5282; text-transform: uppercase; letter-spacing: 1.5px; margin: 16px 0 4px; }
  .report-meta { text-align: center; font-size: 9px; color: #a0aec0; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #edf2f7; color: #2d3748; padding: 8px 10px; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e0; }
  td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f7fafc; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 700; }
  .summary-row { background: #edf2f7 !important; font-weight: 700; }
  .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 8px; color: #a0aec0; }
  @media print { body { padding: 10px; } @page { margin: 10mm; size: A4 portrait; } }
</style></head><body>
<div class="header">
  <img src="/mjcet-logo.png" alt="Logo" />
  <div class="header-text">
    <div class="society">SULTAN-UL-ULOOM EDUCATION SOCIETY</div>
    <div class="college">MUFFAKHAM JAH COLLEGE OF ENGINEERING AND TECHNOLOGY</div>
    <div class="address">Road No.3, Banjara Hills, Hyderabad - 500034, Telangana, India</div>
    <div class="accreditation">Autonomous & Accredited by NAAC with A+ and NBA</div>
    <div class="accreditation">Affiliated to Osmania University & Approved by AICTE</div>
  </div>
</div>
<div class="report-title">Student Enrollment Summary${batchFilter !== 'all' ? ` - Batch ${batchFilter}` : ''}</div>
<div class="report-meta">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} | MJCET Fee App</div>
<table>
  <thead><tr>
    <th>Department</th><th class="text-center">Course</th><th class="text-center">Regular</th><th class="text-center">Lateral Entry</th><th class="text-center">Total Registered</th>
  </tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<div class="footer">This is a computer-generated document. No signature is required.</div>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string; sub?: string }> = ({ label, value, icon, color, sub }) => (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4`}>
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value.toLocaleString()}</p>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        {sub && <p className="text-[10px] text-slate-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  const DeptRow: React.FC<{ data: typeof enrollmentData[0]; index: number }> = ({ data, index }) => {
    const isExpanded = expandedDept === data.dept.code;
    const maxYear = data.dept.duration;
    const pct = data.total > 0 ? 100 : 0;

    return (
      <>
        <tr
          className={`cursor-pointer hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
          onClick={() => toggleDept(data.dept.code)}
        >
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2">
              {isExpanded ? <ChevronUp size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-slate-400" />}
              <span className="font-semibold text-sm text-slate-700">{data.dept.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">{data.dept.code}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${data.dept.courseType === 'BE' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{data.dept.courseType}</span>
            </div>
          </td>
          <td className="px-4 py-3.5 text-center">
            <span className="text-sm font-bold text-slate-700">{data.regular}</span>
          </td>
          <td className="px-4 py-3.5 text-center">
            <span className={`text-sm font-bold ${data.lateral > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{data.lateral}</span>
          </td>
          <td className="px-4 py-3.5 text-center">
            <span className="text-sm font-extrabold text-blue-700">{data.total}</span>
          </td>
        </tr>
        {isExpanded && (
          <tr className="bg-blue-50/30">
            <td colSpan={4} className="px-6 py-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: maxYear }, (_, i) => i + 1).map(y => {
                  const yb = data.yearBreakdown[y] || { regular: 0, lateral: 0, total: 0 };
                  return (
                    <div key={y} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Year {y}</p>
                      <p className="text-lg font-bold text-slate-800">{yb.total}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-blue-600">Regular: {yb.regular}</span>
                        {(data.dept.courseType === 'BE' || y >= 2) && (
                          <span className="text-[10px] text-amber-600">LE: {yb.lateral}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
            <GraduationCap size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Student Enrollment</h2>
            <span className="text-[10px] text-slate-400 font-medium">Department-wise enrollment summary</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
            >
              <option value="all">All Batches</option>
              {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
            </select>
          </div>
          <button
            onClick={exportEnrollmentData}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download size={14} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={totals.total} icon={<Users size={22} className="text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Regular Entry" value={totals.regular} icon={<GraduationCap size={22} className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard label="Lateral Entry" value={totals.lateral} icon={<UserPlus size={22} className="text-amber-600" />} color="bg-amber-50" />
        <StatCard label="Departments" value={departments.length} icon={<Building2 size={22} className="text-indigo-600" />} color="bg-indigo-50" sub={`${beData.length} B.E + ${meData.length} M.E`} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-700">B.E Programs</h3>
            <span className="text-xs text-slate-400">({beTotals.total} students)</span>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Department</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Regular</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Lateral Entry</th>
              <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {beData.map((d, i) => <DeptRow key={d.dept.code} data={d} index={i} />)}
            <tr className="bg-blue-50 border-t-2 border-blue-200">
              <td className="px-4 py-3 font-bold text-sm text-blue-800">B.E Total</td>
              <td className="px-4 py-3 text-center font-bold text-sm text-blue-800">{beTotals.regular}</td>
              <td className="px-4 py-3 text-center font-bold text-sm text-amber-700">{beTotals.lateral}</td>
              <td className="px-4 py-3 text-center font-extrabold text-sm text-blue-900">{beTotals.total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {meData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-600" />
              <h3 className="text-sm font-bold text-slate-700">M.E Programs</h3>
              <span className="text-xs text-slate-400">({meTotals.total} students)</span>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-left">Department</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Regular</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Lateral Entry</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {meData.map((d, i) => <DeptRow key={d.dept.code} data={d} index={i} />)}
              <tr className="bg-purple-50 border-t-2 border-purple-200">
                <td className="px-4 py-3 font-bold text-sm text-purple-800">M.E Total</td>
                <td className="px-4 py-3 text-center font-bold text-sm text-purple-800">{meTotals.regular}</td>
                <td className="px-4 py-3 text-center font-bold text-sm text-amber-700">{meTotals.lateral}</td>
                <td className="px-4 py-3 text-center font-extrabold text-sm text-purple-900">{meTotals.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">Grand Total</p>
            <p className="text-3xl font-extrabold mt-1">{totals.total.toLocaleString()}</p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold">{totals.regular.toLocaleString()}</p>
              <p className="text-[10px] text-blue-200 font-medium">Regular</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-300">{totals.lateral.toLocaleString()}</p>
              <p className="text-[10px] text-blue-200 font-medium">Lateral Entry</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{departments.length}</p>
              <p className="text-[10px] text-blue-200 font-medium">Departments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
