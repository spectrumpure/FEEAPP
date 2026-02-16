
import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { DEPARTMENTS } from '../constants';
import {
  FileText,
  Download,
  Building2,
  Calendar,
  Users,
  AlertTriangle,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Student } from '../types';

type ReportTab = 'dept_summary' | 'financial_year' | 'batch_wise' | 'student_master' | 'defaulters';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const COLLEGE_HEADER = {
  logo: '/mjcet-logo.png',
  society: "SULTAN-UL-ULOOM EDUCATION SOCIETY",
  name: "MUFFAKHAM JAH COLLEGE OF ENGINEERING AND TECHNOLOGY",
  address: "Road No.3, Banjara Hills, Hyderabad - 500034, Telangana, India",
  accreditation: "Accredited by NAAC with 'A' Grade | Affiliated to Osmania University",
};

const exportPDF = (title: string, tableHtml: string) => {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1a202c; }
  .header { text-align: center; border-bottom: 3px double #1a365d; padding-bottom: 16px; margin-bottom: 20px; }
  .header img { width: 70px; height: 70px; object-fit: contain; margin-bottom: 6px; }
  .header .society { font-size: 10px; font-weight: 600; color: #4a5568; letter-spacing: 2px; text-transform: uppercase; }
  .header .college { font-size: 16px; font-weight: 800; color: #1a365d; margin: 4px 0; }
  .header .address { font-size: 9px; color: #718096; }
  .header .accreditation { font-size: 8px; color: #a0aec0; margin-top: 2px; }
  .report-title { text-align: center; font-size: 13px; font-weight: 700; color: #2c5282; text-transform: uppercase; letter-spacing: 1.5px; margin: 16px 0 12px; }
  .report-meta { text-align: center; font-size: 9px; color: #a0aec0; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #edf2f7; color: #2d3748; padding: 8px 10px; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e0; }
  td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f7fafc; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 700; }
  .text-red { color: #e53e3e; }
  .text-green { color: #38a169; }
  .text-blue { color: #3182ce; }
  .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 8px; color: #a0aec0; }
  .summary-row { background: #edf2f7 !important; font-weight: 700; }
  @media print { body { padding: 10px; } @page { margin: 10mm; size: A4 landscape; } }
</style></head><body>
<div class="header">
  <img src="${COLLEGE_HEADER.logo}" alt="Logo" />
  <div class="society">${COLLEGE_HEADER.society}</div>
  <div class="college">${COLLEGE_HEADER.name}</div>
  <div class="address">${COLLEGE_HEADER.address}</div>
  <div class="accreditation">${COLLEGE_HEADER.accreditation}</div>
</div>
<div class="report-title">${title}</div>
<div class="report-meta">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} | EduFee Enterprise</div>
${tableHtml}
<div class="footer">This is a computer-generated document. No signature is required.</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
};

export const Reports: React.FC = () => {
  const { students, transactions, getFeeTargets } = useApp();
  const [activeTab, setActiveTab] = useState<ReportTab>('dept_summary');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dept_summary', label: 'Dept Summary', icon: <Building2 size={16} /> },
    { id: 'financial_year', label: 'Financial Year', icon: <Calendar size={16} /> },
    { id: 'batch_wise', label: 'Batch Wise', icon: <Layers size={16} /> },
    { id: 'student_master', label: 'Student Master List', icon: <Users size={16} /> },
    { id: 'defaulters', label: 'Fee Defaulters', icon: <AlertTriangle size={16} /> },
  ];

  const allBatches = Array.from(new Set(students.map(s => s.batch))).filter(Boolean).sort();
  const allFinYears = Array.from(new Set(transactions.map(t => t.financialYear))).filter(Boolean).sort();

  const getDeptSummaryData = () => {
    const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter);
    return DEPARTMENTS.map(dept => {
      const deptStudents = students.filter(s => s.department === dept.name);
      const count = deptStudents.length;

      let tTarget = 0, uTarget = 0, tPaid = 0, uPaid = 0;
      deptStudents.forEach(s => {
        const lockers = filterYear ? s.feeLockers.filter(l => l.year === filterYear) : s.feeLockers;
        if (filterYear && lockers.length === 0) {
          const targets = getFeeTargets(s.department, filterYear);
          tTarget += targets.tuition;
          uTarget += targets.university;
        }
        lockers.forEach(l => {
          tTarget += l.tuitionTarget;
          uTarget += l.universityTarget;
          l.transactions.filter(t => t.status === 'APPROVED').forEach(t => {
            if (t.feeType === 'Tuition') tPaid += t.amount;
            else if (t.feeType === 'University') uPaid += t.amount;
          });
        });
      });

      return {
        department: dept.name,
        code: dept.code,
        courseType: dept.courseType,
        count,
        tTarget, uTarget, tPaid, uPaid,
        totalReceived: tPaid + uPaid,
        totalBalance: (tTarget + uTarget) - (tPaid + uPaid),
      };
    });
  };

  const getFinancialYearData = () => {
    const grouped: Record<string, { tuition: number; university: number; other: number; count: number }> = {};
    const approvedTxs = transactions.filter(t => t.status === 'APPROVED');
    approvedTxs.forEach(t => {
      const fy = t.financialYear || 'Unknown';
      if (!grouped[fy]) grouped[fy] = { tuition: 0, university: 0, other: 0, count: 0 };
      grouped[fy].count++;
      if (t.feeType === 'Tuition') grouped[fy].tuition += t.amount;
      else if (t.feeType === 'University') grouped[fy].university += t.amount;
      else grouped[fy].other += t.amount;
    });
    return Object.entries(grouped).map(([fy, data]) => ({
      financialYear: fy,
      ...data,
      total: data.tuition + data.university + data.other,
    })).sort((a, b) => a.financialYear.localeCompare(b.financialYear));
  };

  const getBatchWiseData = () => {
    const grouped: Record<string, Student[]> = {};
    students.forEach(s => {
      const b = s.batch || 'Unknown';
      if (!grouped[b]) grouped[b] = [];
      grouped[b].push(s);
    });
    return Object.entries(grouped).map(([batch, batchStudents]) => {
      let totalTarget = 0, totalPaid = 0;
      batchStudents.forEach(s => {
        s.feeLockers.forEach(l => {
          totalTarget += l.tuitionTarget + l.universityTarget;
          l.transactions.filter(t => t.status === 'APPROVED').forEach(t => { totalPaid += t.amount; });
        });
      });
      return { batch, count: batchStudents.length, totalTarget, totalPaid, balance: totalTarget - totalPaid };
    }).sort((a, b) => a.batch.localeCompare(b.batch));
  };

  const getStudentMasterData = () => {
    let filtered = [...students];
    if (deptFilter !== 'all') filtered = filtered.filter(s => s.department === deptFilter);
    if (batchFilter !== 'all') filtered = filtered.filter(s => s.batch === batchFilter);
    return filtered.map(s => {
      let tTarget = 0, tPaid = 0, uTarget = 0, uPaid = 0;
      s.feeLockers.forEach(l => {
        tTarget += l.tuitionTarget;
        uTarget += l.universityTarget;
        l.transactions.filter(t => t.status === 'APPROVED').forEach(t => {
          if (t.feeType === 'Tuition') tPaid += t.amount;
          else if (t.feeType === 'University') uPaid += t.amount;
        });
      });
      return { ...s, tTarget, tPaid, tBalance: tTarget - tPaid, uTarget, uPaid, uBalance: uTarget - uPaid, totalPaid: tPaid + uPaid, totalBalance: (tTarget + uTarget) - (tPaid + uPaid) };
    }).sort((a, b) => a.hallTicketNumber.localeCompare(b.hallTicketNumber));
  };

  const getDefaultersData = () => {
    const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter);
    const filterDept = deptFilter === 'all' ? null : deptFilter;

    return students.filter(s => {
      if (filterDept && s.department !== filterDept) return false;
      const lockers = filterYear ? s.feeLockers.filter(l => l.year === filterYear) : s.feeLockers;
      if (lockers.length === 0 && filterYear) {
        return true;
      }
      const totalTarget = lockers.reduce((sum, l) => sum + l.tuitionTarget + l.universityTarget, 0);
      const totalPaid = lockers.reduce((sum, l) =>
        sum + l.transactions.filter(t => t.status === 'APPROVED').reduce((s2, t) => s2 + t.amount, 0), 0);
      return totalPaid < totalTarget;
    }).map(s => {
      const lockers = filterYear ? s.feeLockers.filter(l => l.year === filterYear) : s.feeLockers;
      let totalTarget = 0, totalPaid = 0;
      if (lockers.length === 0 && filterYear) {
        const targets = getFeeTargets(s.department, filterYear);
        totalTarget = targets.tuition + targets.university;
      } else {
        lockers.forEach(l => {
          totalTarget += l.tuitionTarget + l.universityTarget;
          l.transactions.filter(t => t.status === 'APPROVED').forEach(t => { totalPaid += t.amount; });
        });
      }
      return { ...s, totalTarget, totalPaid, balance: totalTarget - totalPaid };
    }).sort((a, b) => b.balance - a.balance);
  };

  const handleExportDeptSummary = () => {
    const data = getDeptSummaryData();
    const total = data.reduce((acc, d) => ({
      count: acc.count + d.count, tTarget: acc.tTarget + d.tTarget, tPaid: acc.tPaid + d.tPaid,
      uTarget: acc.uTarget + d.uTarget, uPaid: acc.uPaid + d.uPaid,
      totalReceived: acc.totalReceived + d.totalReceived, totalBalance: acc.totalBalance + d.totalBalance,
    }), { count: 0, tTarget: 0, tPaid: 0, uTarget: 0, uPaid: 0, totalReceived: 0, totalBalance: 0 });

    const rows = data.map(d => `<tr>
      <td class="font-bold">${d.courseType}(${d.code})</td>
      <td class="text-center">${d.count} students</td>
      <td class="text-right">${formatCurrency(d.tTarget)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(d.tPaid)}</td>
      <td class="text-right">${formatCurrency(d.uTarget)}</td>
      <td class="text-right text-blue font-bold">${formatCurrency(d.uPaid)}</td>
      <td class="text-right text-green font-bold">${formatCurrency(d.totalReceived)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(d.totalBalance)}</td>
    </tr>`).join('');

    const html = `<table><thead><tr>
      <th>Department</th><th class="text-center">Students</th>
      <th class="text-right">T.Target</th><th class="text-right">T.Paid</th>
      <th class="text-right">U.Target</th><th class="text-right">U.Paid</th>
      <th class="text-right">Total Received</th><th class="text-right">Total Balance</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row">
      <td>GRAND TOTAL</td><td class="text-center">${total.count} students</td>
      <td class="text-right">${formatCurrency(total.tTarget)}</td><td class="text-right">${formatCurrency(total.tPaid)}</td>
      <td class="text-right">${formatCurrency(total.uTarget)}</td><td class="text-right">${formatCurrency(total.uPaid)}</td>
      <td class="text-right">${formatCurrency(total.totalReceived)}</td><td class="text-right">${formatCurrency(total.totalBalance)}</td>
    </tr></tbody></table>`;
    exportPDF(`Dept Summary Report${yearFilter !== 'all' ? ` - Year ${yearFilter}` : ' - All Years'}`, html);
  };

  const handleExportFinYear = () => {
    const data = getFinancialYearData();
    const total = data.reduce((acc, d) => ({
      tuition: acc.tuition + d.tuition, university: acc.university + d.university,
      other: acc.other + d.other, count: acc.count + d.count, total: acc.total + d.total,
    }), { tuition: 0, university: 0, other: 0, count: 0, total: 0 });

    const rows = data.map(d => `<tr>
      <td class="font-bold">${d.financialYear}</td>
      <td class="text-center">${d.count}</td>
      <td class="text-right">${formatCurrency(d.tuition)}</td>
      <td class="text-right">${formatCurrency(d.university)}</td>
      <td class="text-right">${formatCurrency(d.other)}</td>
      <td class="text-right font-bold text-green">${formatCurrency(d.total)}</td>
    </tr>`).join('');

    const html = `<table><thead><tr>
      <th>Financial Year</th><th class="text-center">Transactions</th>
      <th class="text-right">Tuition</th><th class="text-right">University</th>
      <th class="text-right">Other</th><th class="text-right">Total</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row"><td>GRAND TOTAL</td><td class="text-center">${total.count}</td>
      <td class="text-right">${formatCurrency(total.tuition)}</td><td class="text-right">${formatCurrency(total.university)}</td>
      <td class="text-right">${formatCurrency(total.other)}</td><td class="text-right">${formatCurrency(total.total)}</td>
    </tr></tbody></table>`;
    exportPDF('Financial Year Wise Report', html);
  };

  const handleExportBatchWise = () => {
    const data = getBatchWiseData();
    const total = data.reduce((acc, d) => ({
      count: acc.count + d.count, totalTarget: acc.totalTarget + d.totalTarget,
      totalPaid: acc.totalPaid + d.totalPaid, balance: acc.balance + d.balance,
    }), { count: 0, totalTarget: 0, totalPaid: 0, balance: 0 });

    const rows = data.map(d => `<tr>
      <td class="font-bold">${d.batch}</td>
      <td class="text-center">${d.count}</td>
      <td class="text-right">${formatCurrency(d.totalTarget)}</td>
      <td class="text-right text-green font-bold">${formatCurrency(d.totalPaid)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(d.balance)}</td>
    </tr>`).join('');

    const html = `<table><thead><tr>
      <th>Batch</th><th class="text-center">Students</th>
      <th class="text-right">Total Target</th><th class="text-right">Total Paid</th><th class="text-right">Balance</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row"><td>GRAND TOTAL</td><td class="text-center">${total.count}</td>
      <td class="text-right">${formatCurrency(total.totalTarget)}</td><td class="text-right">${formatCurrency(total.totalPaid)}</td>
      <td class="text-right">${formatCurrency(total.balance)}</td>
    </tr></tbody></table>`;
    exportPDF('Batch Wise Fee Report', html);
  };

  const handleExportStudentMaster = () => {
    const data = getStudentMasterData();
    const totals = data.reduce((acc, s) => ({
      tTarget: acc.tTarget + s.tTarget, tPaid: acc.tPaid + s.tPaid, tBalance: acc.tBalance + s.tBalance,
      uTarget: acc.uTarget + s.uTarget, uPaid: acc.uPaid + s.uPaid, uBalance: acc.uBalance + s.uBalance,
      totalPaid: acc.totalPaid + s.totalPaid, totalBalance: acc.totalBalance + s.totalBalance,
    }), { tTarget: 0, tPaid: 0, tBalance: 0, uTarget: 0, uPaid: 0, uBalance: 0, totalPaid: 0, totalBalance: 0 });

    const rows = data.map((s, i) => `<tr>
      <td class="text-center">${i + 1}</td>
      <td class="font-bold" style="font-size:9px">${s.hallTicketNumber}</td>
      <td>${s.name}</td>
      <td class="text-center">${s.department.replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', '')}</td>
      <td class="text-right">${formatCurrency(s.tTarget)}</td>
      <td class="text-right text-green">${formatCurrency(s.tPaid)}</td>
      <td class="text-right text-red">${formatCurrency(s.tBalance)}</td>
      <td class="text-right">${formatCurrency(s.uTarget)}</td>
      <td class="text-right text-green">${formatCurrency(s.uPaid)}</td>
      <td class="text-right text-red">${formatCurrency(s.uBalance)}</td>
      <td class="text-right text-green font-bold">${formatCurrency(s.totalPaid)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(s.totalBalance)}</td>
    </tr>`).join('');

    const html = `<table><thead><tr>
      <th class="text-center">S.No</th><th>Hall Ticket</th><th>Student Name</th>
      <th class="text-center">Dept</th>
      <th class="text-right">T.Target</th><th class="text-right">T.Paid</th><th class="text-right">T.Balance</th>
      <th class="text-right">U.Target</th><th class="text-right">U.Paid</th><th class="text-right">U.Balance</th>
      <th class="text-right">Total Paid</th><th class="text-right">Total Balance</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row">
      <td colspan="4" class="text-right font-bold">GRAND TOTAL</td>
      <td class="text-right">${formatCurrency(totals.tTarget)}</td><td class="text-right">${formatCurrency(totals.tPaid)}</td><td class="text-right">${formatCurrency(totals.tBalance)}</td>
      <td class="text-right">${formatCurrency(totals.uTarget)}</td><td class="text-right">${formatCurrency(totals.uPaid)}</td><td class="text-right">${formatCurrency(totals.uBalance)}</td>
      <td class="text-right">${formatCurrency(totals.totalPaid)}</td><td class="text-right">${formatCurrency(totals.totalBalance)}</td>
    </tr></tbody></table>
    <div style="margin-top:12px;font-size:9px;color:#718096;text-align:right;">Total Students: ${data.length}</div>`;
    exportPDF(`Student Master List${deptFilter !== 'all' ? ` - ${deptFilter}` : ''}`, html);
  };

  const handleExportDefaulters = () => {
    const data = getDefaultersData();
    const totals = data.reduce((acc, s) => ({
      totalTarget: acc.totalTarget + s.totalTarget, totalPaid: acc.totalPaid + s.totalPaid, balance: acc.balance + s.balance,
    }), { totalTarget: 0, totalPaid: 0, balance: 0 });

    const rows = data.map((s, i) => `<tr>
      <td class="text-center">${i + 1}</td>
      <td class="font-bold" style="font-size:9px">${s.hallTicketNumber}</td>
      <td>${s.name}</td>
      <td class="text-center">${s.department.replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', '')}</td>
      <td class="text-center">${s.currentYear}</td>
      <td class="text-right">${formatCurrency(s.totalTarget)}</td>
      <td class="text-right text-green">${formatCurrency(s.totalPaid)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(s.balance)}</td>
    </tr>`).join('');

    const html = `<table><thead><tr>
      <th class="text-center">S.No</th><th>Hall Ticket</th><th>Student Name</th>
      <th class="text-center">Dept</th><th class="text-center">Year</th>
      <th class="text-right">Target</th><th class="text-right">Paid</th><th class="text-right">Balance</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row"><td colspan="5" class="text-right font-bold">GRAND TOTAL (${data.length} defaulters)</td>
      <td class="text-right">${formatCurrency(totals.totalTarget)}</td>
      <td class="text-right">${formatCurrency(totals.totalPaid)}</td>
      <td class="text-right">${formatCurrency(totals.balance)}</td>
    </tr></tbody></table>`;
    exportPDF(`Fee Defaulters Report${deptFilter !== 'all' ? ` - ${deptFilter}` : ''}${yearFilter !== 'all' ? ` - Year ${yearFilter}` : ''}`, html);
  };

  const exportHandlers: Record<ReportTab, () => void> = {
    dept_summary: handleExportDeptSummary,
    financial_year: handleExportFinYear,
    batch_wise: handleExportBatchWise,
    student_master: handleExportStudentMaster,
    defaulters: handleExportDefaulters,
  };

  const renderDeptSummary = () => {
    const data = getDeptSummaryData();
    const total = data.reduce((acc, d) => ({
      count: acc.count + d.count, tTarget: acc.tTarget + d.tTarget, tPaid: acc.tPaid + d.tPaid,
      uTarget: acc.uTarget + d.uTarget, uPaid: acc.uPaid + d.uPaid,
      totalReceived: acc.totalReceived + d.totalReceived, totalBalance: acc.totalBalance + d.totalBalance,
    }), { count: 0, tTarget: 0, tPaid: 0, uTarget: 0, uPaid: 0, totalReceived: 0, totalBalance: 0 });

    return (
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year Filter</label>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Students</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">T.Target</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">T.Paid</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">U.Target</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">U.Paid</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total Received</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(d => (
                <tr key={d.code} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">{d.courseType}({d.code})</td>
                  <td className="px-4 py-3 text-sm text-slate-500 text-center">{d.count} students</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">{formatCurrency(d.tTarget)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">{formatCurrency(d.tPaid)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">{formatCurrency(d.uTarget)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">{formatCurrency(d.uPaid)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">{formatCurrency(d.totalReceived)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">{formatCurrency(d.totalBalance)}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td className="px-4 py-3 text-sm text-slate-800">GRAND TOTAL</td>
                <td className="px-4 py-3 text-sm text-slate-700 text-center">{total.count} students</td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(total.tTarget)}</td>
                <td className="px-4 py-3 text-sm text-red-700 text-right">{formatCurrency(total.tPaid)}</td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(total.uTarget)}</td>
                <td className="px-4 py-3 text-sm text-blue-700 text-right">{formatCurrency(total.uPaid)}</td>
                <td className="px-4 py-3 text-sm text-green-700 text-right">{formatCurrency(total.totalReceived)}</td>
                <td className="px-4 py-3 text-sm text-red-700 text-right">{formatCurrency(total.totalBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFinancialYear = () => {
    const data = getFinancialYearData();
    const total = data.reduce((acc, d) => ({
      tuition: acc.tuition + d.tuition, university: acc.university + d.university,
      other: acc.other + d.other, count: acc.count + d.count, total: acc.total + d.total,
    }), { tuition: 0, university: 0, other: 0, count: 0, total: 0 });

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Financial Year</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Transactions</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Tuition Collected</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">University Collected</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Other</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(d => (
              <tr key={d.financialYear} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-bold text-slate-800">{d.financialYear}</td>
                <td className="px-4 py-3 text-sm text-slate-500 text-center">{d.count}</td>
                <td className="px-4 py-3 text-sm text-slate-600 text-right">{formatCurrency(d.tuition)}</td>
                <td className="px-4 py-3 text-sm text-slate-600 text-right">{formatCurrency(d.university)}</td>
                <td className="px-4 py-3 text-sm text-slate-600 text-right">{formatCurrency(d.other)}</td>
                <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">{formatCurrency(d.total)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 italic text-xs">No approved transactions found.</td></tr>
            )}
            {data.length > 0 && (
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td className="px-4 py-3 text-sm text-slate-800">GRAND TOTAL</td>
                <td className="px-4 py-3 text-sm text-slate-700 text-center">{total.count}</td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(total.tuition)}</td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(total.university)}</td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(total.other)}</td>
                <td className="px-4 py-3 text-sm text-green-700 text-right">{formatCurrency(total.total)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBatchWise = () => {
    const data = getBatchWiseData();
    const total = data.reduce((acc, d) => ({
      count: acc.count + d.count, totalTarget: acc.totalTarget + d.totalTarget,
      totalPaid: acc.totalPaid + d.totalPaid, balance: acc.balance + d.balance,
    }), { count: 0, totalTarget: 0, totalPaid: 0, balance: 0 });

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Batch</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Students</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total Target</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total Paid</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Balance</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Collection %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(d => (
              <tr key={d.batch} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-bold text-slate-800">{d.batch}</td>
                <td className="px-4 py-3 text-sm text-slate-500 text-center">{d.count}</td>
                <td className="px-4 py-3 text-sm text-slate-600 text-right">{formatCurrency(d.totalTarget)}</td>
                <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">{formatCurrency(d.totalPaid)}</td>
                <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">{formatCurrency(d.balance)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${d.totalTarget > 0 ? (d.totalPaid / d.totalTarget >= 0.8 ? 'bg-green-50 text-green-600' : d.totalPaid / d.totalTarget >= 0.5 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600') : 'bg-slate-50 text-slate-400'}`}>
                    {d.totalTarget > 0 ? `${((d.totalPaid / d.totalTarget) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </td>
              </tr>
            ))}
            {data.length > 0 && (
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td className="px-4 py-3 text-sm text-slate-800">GRAND TOTAL</td>
                <td className="px-4 py-3 text-sm text-slate-700 text-center">{total.count}</td>
                <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(total.totalTarget)}</td>
                <td className="px-4 py-3 text-sm text-green-700 text-right">{formatCurrency(total.totalPaid)}</td>
                <td className="px-4 py-3 text-sm text-red-700 text-right">{formatCurrency(total.balance)}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                    {total.totalTarget > 0 ? `${((total.totalPaid / total.totalTarget) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStudentMaster = () => {
    const data = getStudentMasterData();
    const totals = data.reduce((acc, s) => ({
      tTarget: acc.tTarget + s.tTarget, tPaid: acc.tPaid + s.tPaid, tBalance: acc.tBalance + s.tBalance,
      uTarget: acc.uTarget + s.uTarget, uPaid: acc.uPaid + s.uPaid, uBalance: acc.uBalance + s.uBalance,
      totalPaid: acc.totalPaid + s.totalPaid, totalBalance: acc.totalBalance + s.totalBalance,
    }), { tTarget: 0, tPaid: 0, tBalance: 0, uTarget: 0, uPaid: 0, uBalance: 0, totalPaid: 0, totalBalance: 0 });

    return (
      <div>
        <div className="flex items-center space-x-4 mb-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
              <option value="all">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Batch</label>
            <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
              <option value="all">All Batches</option>
              {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="ml-auto self-end">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">{data.length} students</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center w-10">S.No</th>
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Hall Ticket</th>
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Student Name</th>
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Dept</th>
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">T.Target</th>
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">T.Paid</th>
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">T.Balance</th>
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">U.Target</th>
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">U.Paid</th>
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">U.Balance</th>
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Total Paid</th>
                <th className="px-2 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Total Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((s, i) => (
                <tr key={s.hallTicketNumber} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2 py-2 text-xs text-slate-400 text-center">{i + 1}</td>
                  <td className="px-2 py-2 text-[11px] font-mono font-bold text-slate-700">{s.hallTicketNumber}</td>
                  <td className="px-2 py-2 text-[11px] font-bold text-slate-800">{s.name}</td>
                  <td className="px-2 py-2 text-[10px] text-slate-600 text-center">{s.department.replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', '')}</td>
                  <td className="px-2 py-2 text-[11px] text-slate-600 text-right">{formatCurrency(s.tTarget)}</td>
                  <td className="px-2 py-2 text-[11px] font-bold text-green-600 text-right">{formatCurrency(s.tPaid)}</td>
                  <td className="px-2 py-2 text-[11px] font-bold text-red-600 text-right">{formatCurrency(s.tBalance)}</td>
                  <td className="px-2 py-2 text-[11px] text-slate-600 text-right">{formatCurrency(s.uTarget)}</td>
                  <td className="px-2 py-2 text-[11px] font-bold text-blue-600 text-right">{formatCurrency(s.uPaid)}</td>
                  <td className="px-2 py-2 text-[11px] font-bold text-red-600 text-right">{formatCurrency(s.uBalance)}</td>
                  <td className="px-2 py-2 text-[11px] font-bold text-green-600 text-right">{formatCurrency(s.totalPaid)}</td>
                  <td className="px-2 py-2 text-[11px] font-bold text-red-600 text-right">{formatCurrency(s.totalBalance)}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-12 text-center text-slate-400 italic text-xs">No students match the selected filters.</td></tr>
              )}
              {data.length > 0 && (
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td colSpan={4} className="px-2 py-3 text-[11px] text-slate-800 text-right">GRAND TOTAL ({data.length} students)</td>
                  <td className="px-2 py-3 text-[11px] text-slate-700 text-right">{formatCurrency(totals.tTarget)}</td>
                  <td className="px-2 py-3 text-[11px] text-green-700 text-right">{formatCurrency(totals.tPaid)}</td>
                  <td className="px-2 py-3 text-[11px] text-red-700 text-right">{formatCurrency(totals.tBalance)}</td>
                  <td className="px-2 py-3 text-[11px] text-slate-700 text-right">{formatCurrency(totals.uTarget)}</td>
                  <td className="px-2 py-3 text-[11px] text-blue-700 text-right">{formatCurrency(totals.uPaid)}</td>
                  <td className="px-2 py-3 text-[11px] text-red-700 text-right">{formatCurrency(totals.uBalance)}</td>
                  <td className="px-2 py-3 text-[11px] text-green-700 text-right">{formatCurrency(totals.totalPaid)}</td>
                  <td className="px-2 py-3 text-[11px] text-red-700 text-right">{formatCurrency(totals.totalBalance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDefaulters = () => {
    const data = getDefaultersData();
    const totals = data.reduce((acc, s) => ({
      totalTarget: acc.totalTarget + s.totalTarget, totalPaid: acc.totalPaid + s.totalPaid, balance: acc.balance + s.balance,
    }), { totalTarget: 0, totalPaid: 0, balance: 0 });

    return (
      <div>
        <div className="flex items-center space-x-4 mb-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
              <option value="all">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Year</label>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100">
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div className="ml-auto self-end flex items-center space-x-4">
            <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl">{data.length} defaulters</span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">Outstanding: {formatCurrency(totals.balance)}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-12">S.No</th>
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hall Ticket</th>
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Name</th>
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Dept</th>
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Year</th>
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Target</th>
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Paid</th>
                <th className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((s, i) => (
                <tr key={s.hallTicketNumber} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-3 py-2.5 text-xs text-slate-400 text-center">{i + 1}</td>
                  <td className="px-3 py-2.5 text-xs font-mono font-bold text-slate-700">{s.hallTicketNumber}</td>
                  <td className="px-3 py-2.5 text-xs font-bold text-slate-800">{s.name}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 text-center">{s.department.replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', '')}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 text-center">{s.currentYear}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 text-right">{formatCurrency(s.totalTarget)}</td>
                  <td className="px-3 py-2.5 text-xs font-bold text-green-600 text-right">{formatCurrency(s.totalPaid)}</td>
                  <td className="px-3 py-2.5 text-sm font-bold text-red-600 text-right">{formatCurrency(s.balance)}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 italic text-xs">No defaulters found for the selected filters.</td></tr>
              )}
              {data.length > 0 && (
                <tr className="bg-red-50 font-bold border-t-2 border-red-200">
                  <td colSpan={5} className="px-3 py-3 text-sm text-red-800 text-right">GRAND TOTAL ({data.length} defaulters)</td>
                  <td className="px-3 py-3 text-sm text-slate-700 text-right">{formatCurrency(totals.totalTarget)}</td>
                  <td className="px-3 py-3 text-sm font-bold text-green-700 text-right">{formatCurrency(totals.totalPaid)}</td>
                  <td className="px-3 py-3 text-sm font-bold text-red-700 text-right">{formatCurrency(totals.balance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent: Record<ReportTab, () => React.ReactNode> = {
    dept_summary: renderDeptSummary,
    financial_year: renderFinancialYear,
    batch_wise: renderBatchWise,
    student_master: renderStudentMaster,
    defaulters: renderDefaulters,
  };

  const reportTitles: Record<ReportTab, { title: string; subtitle: string }> = {
    dept_summary: { title: 'DEPT SUMMARY SUMMARY', subtitle: 'INSTITUTIONAL REVENUE ANALYSIS' },
    financial_year: { title: 'FINANCIAL YEAR WISE', subtitle: 'YEAR-ON-YEAR COLLECTION BREAKDOWN' },
    batch_wise: { title: 'BATCH WISE REPORT', subtitle: 'ADMISSION BATCH FEE ANALYSIS' },
    student_master: { title: 'STUDENT MASTER LIST', subtitle: 'COMPLETE STUDENT DIRECTORY' },
    defaulters: { title: 'FEE DEFAULTERS', subtitle: 'DEPARTMENT & YEAR WISE OUTSTANDING' },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setYearFilter('all'); setDeptFilter('all'); setBatchFilter('all'); }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[#2c5282] text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#2c5282]/10 text-[#2c5282] rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{reportTitles[activeTab].title}</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{reportTitles[activeTab].subtitle}</p>
            </div>
          </div>
          <button
            onClick={exportHandlers[activeTab]}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <Download size={16} />
            <span>EXPORT PDF REPORT</span>
          </button>
        </div>
        <div className="p-5">
          {renderContent[activeTab]()}
        </div>
      </div>
    </div>
  );
};
