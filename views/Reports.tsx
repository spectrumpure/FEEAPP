
import React, { useState } from 'react';
import { useApp } from '../store';
import {
  FileText,
  Download,
  Building2,
  Calendar,
  Users,
  AlertTriangle,
  Layers,
  ContactRound,
  IndianRupee,
  Filter,
  Printer,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { Student } from '../types';

type ReportTab = 'dept_summary' | 'financial_year' | 'batch_wise' | 'student_master' | 'student_info' | 'defaulters' | 'category_analysis' | 'date_range';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const COLLEGE_HEADER = {
  logo: '/mjcet-logo.png',
  society: "SULTAN-UL-ULOOM EDUCATION SOCIETY",
  name: "MUFFAKHAM JAH COLLEGE OF ENGINEERING AND TECHNOLOGY",
  address: "Road No.3, Banjara Hills, Hyderabad - 500034, Telangana, India",
  accreditation1: "Autonomous & Accredited by NAAC with A+ and NBA",
  accreditation2: "Affiliated to Osmania University & Approved by AICTE",
};

const exportPDF = (title: string, tableHtml: string) => {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
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
  <div class="header-text">
    <div class="society">${COLLEGE_HEADER.society}</div>
    <div class="college">${COLLEGE_HEADER.name}</div>
    <div class="address">${COLLEGE_HEADER.address}</div>
    <div class="accreditation">${COLLEGE_HEADER.accreditation1}</div>
    <div class="accreditation">${COLLEGE_HEADER.accreditation2}</div>
  </div>
</div>
<div class="report-title">${title}</div>
<div class="report-meta">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} | MJCET Fee App</div>
${tableHtml}
<div class="footer">This is a computer-generated document. No signature is required.</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
};

const thClass = "px-4 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider";
const tdClass = "px-4 py-3 text-sm";
const selectClass = "bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer";

const matchesDept = (studentDept: string, dept: { name: string; code: string }) =>
  studentDept && (studentDept === dept.name || studentDept === dept.code || studentDept.toUpperCase() === dept.code.toUpperCase());

const findDeptForStudent = (studentDept: string, deptList: { name: string; code: string; duration?: number; courseType?: string }[]) =>
  deptList.find(d => matchesDept(studentDept, d));

export const Reports: React.FC = () => {
  const { students, departments, transactions, getFeeTargets } = useApp();
  const [activeTab, setActiveTab] = useState<ReportTab>('dept_summary');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [drYearFilter, setDrYearFilter] = useState<string>('all');
  const [drDeptFilter, setDrDeptFilter] = useState<string>('all');
  const [drBatchFilter, setDrBatchFilter] = useState<string>('all');
  const [expandedDrDept, setExpandedDrDept] = useState<string | null>(null);

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'dept_summary', label: 'Dept Summary', icon: <Building2 size={16} />, desc: 'Revenue by department' },
    { id: 'financial_year', label: 'Financial Year', icon: <Calendar size={16} />, desc: 'Year-on-year breakdown' },
    { id: 'batch_wise', label: 'Batch Wise', icon: <Layers size={16} />, desc: 'Batch fee analysis' },
    { id: 'student_master', label: 'Fee List', icon: <IndianRupee size={16} />, desc: 'Student fee details' },
    { id: 'student_info', label: 'Student List', icon: <ContactRound size={16} />, desc: 'Personal details' },
    { id: 'defaulters', label: 'Defaulters', icon: <AlertTriangle size={16} />, desc: 'Outstanding dues' },
    { id: 'category_analysis', label: 'Category Analysis', icon: <Users size={16} />, desc: 'Management vs Convenor' },
    { id: 'date_range', label: 'Date Range', icon: <Calendar size={16} />, desc: 'Custom period report' },
  ];

  const allBatches = Array.from(new Set(students.map(s => s.batch))).filter(Boolean).sort();
  const allFinYears = Array.from(new Set(transactions.map(t => t.financialYear))).filter(Boolean).sort();

  const getStudentTargets = (s: Student, filterYear: number | null) => {
    let tTarget = 0, uTarget = 0, tPaid = 0, uPaid = 0;
    const dept = departments.find(d => matchesDept(s.department, d));
    const duration = dept?.duration || 4;
    const isLateral = s.entryType === 'LATERAL';
    const startYear = isLateral ? 2 : 1;
    const lockers = filterYear ? s.feeLockers.filter(l => l.year === filterYear) : s.feeLockers;
    if (filterYear && (filterYear > duration || (isLateral && filterYear < startYear))) {
      return { tTarget: 0, uTarget: 0, tPaid: 0, uPaid: 0 };
    }
    if (lockers.length > 0) {
      lockers.forEach(l => {
        tTarget += l.tuitionTarget;
        uTarget += l.universityTarget;
        l.transactions.filter(t => t.status === 'APPROVED').forEach(t => {
          if (t.feeType === 'Tuition') tPaid += t.amount;
          else if (t.feeType === 'University') uPaid += t.amount;
        });
      });
    } else {
      if (filterYear) {
        const targets = getFeeTargets(s.department, filterYear, s.entryType, s.admissionYear);
        tTarget = targets.tuition;
        uTarget = targets.university;
      } else {
        for (let y = startYear; y <= Math.min(s.currentYear, duration); y++) {
          const targets = getFeeTargets(s.department, y, s.entryType, s.admissionYear);
          tTarget += targets.tuition;
          uTarget += targets.university;
        }
      }
    }
    return { tTarget, uTarget, tPaid, uPaid };
  };

  const getDeptSummaryData = () => {
    const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter);
    const rows: { department: string; code: string; courseType: string; entryLabel: string; count: number; tTarget: number; uTarget: number; tPaid: number; uPaid: number; totalReceived: number; totalBalance: number }[] = [];
    departments.forEach(dept => {
      let deptStudents = students.filter(s => matchesDept(s.department, dept));
      if (batchFilter !== 'all') deptStudents = deptStudents.filter(s => s.batch === batchFilter);
      const regularStudents = deptStudents.filter(s => s.entryType !== 'LATERAL');
      const lateralStudents = (filterYear === 1) ? [] : deptStudents.filter(s => s.entryType === 'LATERAL');
      const calcRow = (subset: typeof deptStudents, label: string) => {
        let tTarget = 0, uTarget = 0, tPaid = 0, uPaid = 0;
        subset.forEach(s => {
          const t = getStudentTargets(s, filterYear);
          tTarget += t.tTarget; uTarget += t.uTarget; tPaid += t.tPaid; uPaid += t.uPaid;
        });
        rows.push({
          department: dept.name, code: dept.code, courseType: dept.courseType, entryLabel: label,
          count: subset.length, tTarget, uTarget, tPaid, uPaid,
          totalReceived: tPaid + uPaid, totalBalance: (tTarget + uTarget) - (tPaid + uPaid),
        });
      };
      if (lateralStudents.length > 0) {
        calcRow(regularStudents, 'Regular');
        calcRow(lateralStudents, 'Lateral');
      } else {
        calcRow(filterYear === 1 ? regularStudents : deptStudents, '');
      }
    });
    return rows;
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
      financialYear: fy, ...data, total: data.tuition + data.university + data.other,
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
        const t = getStudentTargets(s, null);
        totalTarget += t.tTarget + t.uTarget;
        totalPaid += t.tPaid + t.uPaid;
      });
      return { batch, count: batchStudents.length, totalTarget, totalPaid, balance: totalTarget - totalPaid };
    }).sort((a, b) => a.batch.localeCompare(b.batch));
  };

  const getStudentMasterData = () => {
    let filtered = [...students];
    if (deptFilter !== 'all') {
      const filterDeptObj = departments.find(d => d.name === deptFilter);
      if (filterDeptObj) filtered = filtered.filter(s => matchesDept(s.department, filterDeptObj));
      else filtered = filtered.filter(s => s.department === deptFilter);
    }
    if (batchFilter !== 'all') filtered = filtered.filter(s => s.batch === batchFilter);
    const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter);
    return filtered.map(s => {
      const t = getStudentTargets(s, filterYear);
      return { ...s, tTarget: t.tTarget, tPaid: t.tPaid, tBalance: t.tTarget - t.tPaid, uTarget: t.uTarget, uPaid: t.uPaid, uBalance: t.uTarget - t.uPaid, totalPaid: t.tPaid + t.uPaid, totalBalance: (t.tTarget + t.uTarget) - (t.tPaid + t.uPaid) };
    }).sort((a, b) => (a.hallTicketNumber || '').localeCompare(b.hallTicketNumber || ''));
  };

  const getStudentInfoData = () => {
    let filtered = [...students];
    if (deptFilter !== 'all') {
      const filterDeptObj = departments.find(d => d.name === deptFilter);
      if (filterDeptObj) filtered = filtered.filter(s => matchesDept(s.department, filterDeptObj));
      else filtered = filtered.filter(s => s.department === deptFilter);
    }
    if (batchFilter !== 'all') filtered = filtered.filter(s => s.batch === batchFilter);
    return filtered.sort((a, b) => (a.hallTicketNumber || '').localeCompare(b.hallTicketNumber || ''));
  };

  const getDefaultersData = () => {
    const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter);
    const filterDeptObj = deptFilter === 'all' ? null : departments.find(d => d.name === deptFilter);
    return students.filter(s => {
      if (batchFilter !== 'all' && s.batch !== batchFilter) return false;
      if (filterDeptObj && !matchesDept(s.department, filterDeptObj)) return false;
      const t = getStudentTargets(s, filterYear);
      const totalTarget = t.tTarget + t.uTarget;
      const totalPaid = t.tPaid + t.uPaid;
      return totalPaid < totalTarget;
    }).map(s => {
      const t = getStudentTargets(s, filterYear);
      const totalTarget = t.tTarget + t.uTarget;
      const totalPaid = t.tPaid + t.uPaid;
      return { ...s, totalTarget, totalPaid, balance: totalTarget - totalPaid };
    }).sort((a, b) => (a.hallTicketNumber || '').localeCompare(b.hallTicketNumber || ''));
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
      <td class="text-center">${d.count}</td>
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
      <td>GRAND TOTAL</td><td class="text-center">${total.count}</td>
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
      <td class="text-center">${(s.department || '').replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', '')}</td>
      <td class="text-center">${s.admissionCategory || '-'}</td>
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
      <th class="text-center">Dept</th><th class="text-center">Category</th>
      <th class="text-right">T.Target</th><th class="text-right">T.Paid</th><th class="text-right">T.Balance</th>
      <th class="text-right">U.Target</th><th class="text-right">U.Paid</th><th class="text-right">U.Balance</th>
      <th class="text-right">Total Paid</th><th class="text-right">Total Balance</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row">
      <td colspan="5" class="text-right font-bold">GRAND TOTAL</td>
      <td class="text-right">${formatCurrency(totals.tTarget)}</td><td class="text-right">${formatCurrency(totals.tPaid)}</td><td class="text-right">${formatCurrency(totals.tBalance)}</td>
      <td class="text-right">${formatCurrency(totals.uTarget)}</td><td class="text-right">${formatCurrency(totals.uPaid)}</td><td class="text-right">${formatCurrency(totals.uBalance)}</td>
      <td class="text-right">${formatCurrency(totals.totalPaid)}</td><td class="text-right">${formatCurrency(totals.totalBalance)}</td>
    </tr></tbody></table>
    <div style="margin-top:12px;font-size:9px;color:#718096;text-align:right;">Total Students: ${data.length}</div>`;
    exportPDF(`Student Master Fee List${deptFilter !== 'all' ? ` - ${deptFilter}` : ''}${yearFilter !== 'all' ? ` - Year ${yearFilter}` : ''}`, html);
  };

  const handleExportStudentInfo = () => {
    const data = getStudentInfoData();
    const rows = data.map((s, i) => `<tr>
      <td class="text-center">${i + 1}</td>
      <td class="font-bold" style="font-size:9px">${s.hallTicketNumber}</td>
      <td>${s.name}</td>
      <td style="font-size:8px">${s.fatherName}</td>
      <td style="font-size:8px">${s.motherName}</td>
      <td class="text-center">${s.sex || '-'}</td>
      <td class="text-center">${s.dob || '-'}</td>
      <td class="text-center">${(s.department || '').replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', '')}</td>
      <td class="text-center">${s.batch || '-'}</td>
      <td class="text-center">${s.admissionCategory || '-'}</td>
      <td>${s.mobile || '-'}</td>
      <td>${s.fatherMobile || '-'}</td>
      <td style="font-size:7px;max-width:120px">${s.address || '-'}</td>
    </tr>`).join('');
    const html = `<table><thead><tr>
      <th class="text-center">S.No</th><th>Hall Ticket</th><th>Student Name</th><th>Father Name</th><th>Mother Name</th>
      <th class="text-center">Sex</th><th class="text-center">DOB</th>
      <th class="text-center">Dept</th><th class="text-center">Batch</th><th class="text-center">Admission</th>
      <th>Mobile</th><th>Father Mobile</th><th>Address</th>
    </tr></thead><tbody>${rows}</tbody></table>
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
      <td class="text-center">${(s.department || '').replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', '')}</td>
      <td class="text-center">${s.admissionCategory || '-'}</td>
      <td class="text-center">${s.currentYear}</td>
      <td class="text-right">${formatCurrency(s.totalTarget)}</td>
      <td class="text-right text-green">${formatCurrency(s.totalPaid)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(s.balance)}</td>
    </tr>`).join('');
    const html = `<table><thead><tr>
      <th class="text-center">S.No</th><th>Hall Ticket</th><th>Student Name</th>
      <th class="text-center">Dept</th><th class="text-center">Category</th><th class="text-center">Year</th>
      <th class="text-right">Target</th><th class="text-right">Paid</th><th class="text-right">Balance</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row"><td colspan="6" class="text-right font-bold">GRAND TOTAL (${data.length} defaulters)</td>
      <td class="text-right">${formatCurrency(totals.totalTarget)}</td>
      <td class="text-right">${formatCurrency(totals.totalPaid)}</td>
      <td class="text-right">${formatCurrency(totals.balance)}</td>
    </tr></tbody></table>`;
    exportPDF(`Fee Defaulters Report${deptFilter !== 'all' ? ` - ${deptFilter}` : ''}${yearFilter !== 'all' ? ` - Year ${yearFilter}` : ''}`, html);
  };

  const getCategoryAnalysisData = () => {
    const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter);
    const isManagement = (cat: string) => { const u = (cat || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); return u.includes('MANAGEMENT') || u === 'MQ' || u === 'SPOT'; };
    const isConvenor = (cat: string) => { const u = (cat || '').trim().toUpperCase().replace(/[^A-Z]/g, ''); return u.includes('CONVENOR') || u.includes('CONVENER') || u === 'CON'; };
    const isTSMFC = (cat: string) => { const u = (cat || '').trim().toUpperCase(); return u.includes('TSMFC') || u.includes('TSECET'); };

    const result: Array<{
      department: string; code: string; courseType: string; entryLabel: string;
      tsmfcCount: number; tsmfcTarget: number; tsmfcTuiPaid: number; tsmfcUniPaid: number; tsmfcBalance: number;
      mgmtCount: number; mgmtTarget: number; mgmtTuiPaid: number; mgmtUniPaid: number; mgmtBalance: number;
      convCount: number; convTarget: number; convTuiPaid: number; convUniPaid: number; convBalance: number;
      totalCount: number;
    }> = [];

    const getCatFees = (sList: typeof students, fy: number | null) => {
      let tuiTarget = 0, uniTarget = 0, tuiPaid = 0, uniPaid = 0;
      sList.forEach(s => {
        const t = getStudentTargets(s, fy);
        tuiTarget += t.tTarget;
        uniTarget += t.uTarget;
        tuiPaid += t.tPaid;
        uniPaid += t.uPaid;
      });
      const target = tuiTarget + uniTarget;
      return { target, tuiPaid, uniPaid, balance: target - tuiPaid - uniPaid };
    };

    const pushRow = (subset: typeof students, dept: { name: string; code: string; courseType: string }, label: string) => {
      const tsmfcStudents = subset.filter(s => isTSMFC(s.admissionCategory));
      const mgmtStudents = subset.filter(s => isManagement(s.admissionCategory));
      const convStudents = subset.filter(s => isConvenor(s.admissionCategory));
      const tf = getCatFees(tsmfcStudents, filterYear);
      const mf = getCatFees(mgmtStudents, filterYear);
      const cf = getCatFees(convStudents, filterYear);
      if (tsmfcStudents.length > 0 || mgmtStudents.length > 0 || convStudents.length > 0) {
        result.push({
          department: dept.name, code: dept.code, courseType: dept.courseType, entryLabel: label,
          tsmfcCount: tsmfcStudents.length, tsmfcTarget: tf.target, tsmfcTuiPaid: tf.tuiPaid, tsmfcUniPaid: tf.uniPaid, tsmfcBalance: tf.balance,
          mgmtCount: mgmtStudents.length, mgmtTarget: mf.target, mgmtTuiPaid: mf.tuiPaid, mgmtUniPaid: mf.uniPaid, mgmtBalance: mf.balance,
          convCount: convStudents.length, convTarget: cf.target, convTuiPaid: cf.tuiPaid, convUniPaid: cf.uniPaid, convBalance: cf.balance,
          totalCount: tsmfcStudents.length + mgmtStudents.length + convStudents.length,
        });
      }
    };

    departments.forEach(dept => {
      let deptStudents = students.filter(s => matchesDept(s.department, dept));
      if (batchFilter !== 'all') deptStudents = deptStudents.filter(s => s.batch === batchFilter);
      const regularStudents = deptStudents.filter(s => s.entryType !== 'LATERAL');
      const lateralStudents = (filterYear === 1) ? [] : deptStudents.filter(s => s.entryType === 'LATERAL');
      if (lateralStudents.length > 0) {
        pushRow(regularStudents, dept, 'Regular');
        pushRow(lateralStudents, dept, 'Lateral');
      } else {
        pushRow(filterYear === 1 ? regularStudents : deptStudents, dept, '');
      }
    });
    return result;
  };

  const handleExportCategoryAnalysis = () => {
    const data = getCategoryAnalysisData();
    const total = data.reduce((acc, d) => ({
      tsmfcCount: acc.tsmfcCount + d.tsmfcCount, tsmfcTarget: acc.tsmfcTarget + d.tsmfcTarget,
      tsmfcTuiPaid: acc.tsmfcTuiPaid + d.tsmfcTuiPaid, tsmfcUniPaid: acc.tsmfcUniPaid + d.tsmfcUniPaid, tsmfcBalance: acc.tsmfcBalance + d.tsmfcBalance,
      mgmtCount: acc.mgmtCount + d.mgmtCount, mgmtTarget: acc.mgmtTarget + d.mgmtTarget,
      mgmtTuiPaid: acc.mgmtTuiPaid + d.mgmtTuiPaid, mgmtUniPaid: acc.mgmtUniPaid + d.mgmtUniPaid, mgmtBalance: acc.mgmtBalance + d.mgmtBalance,
      convCount: acc.convCount + d.convCount, convTarget: acc.convTarget + d.convTarget,
      convTuiPaid: acc.convTuiPaid + d.convTuiPaid, convUniPaid: acc.convUniPaid + d.convUniPaid, convBalance: acc.convBalance + d.convBalance,
      all: acc.all + d.totalCount,
    }), { tsmfcCount: 0, tsmfcTarget: 0, tsmfcTuiPaid: 0, tsmfcUniPaid: 0, tsmfcBalance: 0, mgmtCount: 0, mgmtTarget: 0, mgmtTuiPaid: 0, mgmtUniPaid: 0, mgmtBalance: 0, convCount: 0, convTarget: 0, convTuiPaid: 0, convUniPaid: 0, convBalance: 0, all: 0 });
    const rows = data.map(d => `<tr>
      <td class="font-bold">${d.courseType}(${d.code})</td>
      <td class="text-center">${d.tsmfcCount}</td>
      <td class="text-right">${formatCurrency(d.tsmfcTarget)}</td>
      <td class="text-right text-green">${formatCurrency(d.tsmfcTuiPaid)}</td>
      <td class="text-right text-green">${formatCurrency(d.tsmfcUniPaid)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(d.tsmfcBalance)}</td>
      <td class="text-center">${d.mgmtCount}</td>
      <td class="text-right">${formatCurrency(d.mgmtTarget)}</td>
      <td class="text-right text-green">${formatCurrency(d.mgmtTuiPaid)}</td>
      <td class="text-right text-green">${formatCurrency(d.mgmtUniPaid)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(d.mgmtBalance)}</td>
      <td class="text-center">${d.convCount}</td>
      <td class="text-right">${formatCurrency(d.convTarget)}</td>
      <td class="text-right text-green">${formatCurrency(d.convTuiPaid)}</td>
      <td class="text-right text-green">${formatCurrency(d.convUniPaid)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(d.convBalance)}</td>
      <td class="text-center font-bold">${d.totalCount}</td>
    </tr>`).join('');
    const html = `<table><thead><tr>
      <th rowspan="2">Department</th>
      <th colspan="5" class="text-center" style="background:#dbeafe;color:#1e40af">TSMFC</th>
      <th colspan="5" class="text-center" style="background:#fef3c7;color:#92400e">Management Quota</th>
      <th colspan="5" class="text-center" style="background:#ede9fe;color:#5b21b6">Convenor</th>
      <th rowspan="2" class="text-center">Total</th>
    </tr><tr>
      <th class="text-center">Count</th><th class="text-right">Target</th><th class="text-right">Tui. Paid</th><th class="text-right">Uni. Paid</th><th class="text-right">Pending</th>
      <th class="text-center">Count</th><th class="text-right">Target</th><th class="text-right">Tui. Paid</th><th class="text-right">Uni. Paid</th><th class="text-right">Pending</th>
      <th class="text-center">Count</th><th class="text-right">Target</th><th class="text-right">Tui. Paid</th><th class="text-right">Uni. Paid</th><th class="text-right">Pending</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row">
      <td class="font-bold">GRAND TOTAL</td>
      <td class="text-center">${total.tsmfcCount}</td><td class="text-right">${formatCurrency(total.tsmfcTarget)}</td>
      <td class="text-right">${formatCurrency(total.tsmfcTuiPaid)}</td><td class="text-right">${formatCurrency(total.tsmfcUniPaid)}</td><td class="text-right">${formatCurrency(total.tsmfcBalance)}</td>
      <td class="text-center">${total.mgmtCount}</td><td class="text-right">${formatCurrency(total.mgmtTarget)}</td>
      <td class="text-right">${formatCurrency(total.mgmtTuiPaid)}</td><td class="text-right">${formatCurrency(total.mgmtUniPaid)}</td><td class="text-right">${formatCurrency(total.mgmtBalance)}</td>
      <td class="text-center">${total.convCount}</td><td class="text-right">${formatCurrency(total.convTarget)}</td>
      <td class="text-right">${formatCurrency(total.convTuiPaid)}</td><td class="text-right">${formatCurrency(total.convUniPaid)}</td><td class="text-right">${formatCurrency(total.convBalance)}</td>
      <td class="text-center font-bold">${total.all}</td>
    </tr></tbody></table>`;
    exportPDF(`Admission Category Fee Analysis${yearFilter !== 'all' ? ` - Year ${yearFilter}` : ''}`, html);
  };

  const getDateRangeData = () => {
    const filterYear = drYearFilter === 'all' ? null : parseInt(drYearFilter);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;

    return departments
      .filter(dept => drDeptFilter === 'all' || matchesDept(drDeptFilter, dept))
      .map(dept => {
        let deptStudents = students.filter(s => matchesDept(s.department, dept));
        if (drBatchFilter !== 'all') deptStudents = deptStudents.filter(s => s.batch === drBatchFilter);

        const results = deptStudents.map(s => {
          const d = departments.find(dd => matchesDept(s.department, dd));
          const duration = d?.duration || 4;
          const isLateral = s.entryType === 'LATERAL';
          const startYear = isLateral ? 2 : 1;
          let tTarget = 0, uTarget = 0, tPaid = 0, uPaid = 0;

          const lockers = filterYear ? s.feeLockers.filter(l => l.year === filterYear) : s.feeLockers;
          if (filterYear && (filterYear > duration || (isLateral && filterYear < startYear))) {
            return null;
          }

          lockers.forEach(l => {
            tTarget += l.tuitionTarget;
            uTarget += l.universityTarget;
            l.transactions.filter(t => t.status === 'APPROVED').forEach(t => {
              const txDate = new Date(t.paymentDate);
              const inRange = (!from || txDate >= from) && (!to || txDate <= to);
              if (inRange) {
                if (t.feeType === 'Tuition') tPaid += t.amount;
                else if (t.feeType === 'University') uPaid += t.amount;
              }
            });
          });

          if (lockers.length === 0) {
            if (filterYear) {
              const targets = getFeeTargets(s.department, filterYear, s.entryType, s.admissionYear);
              tTarget = targets.tuition; uTarget = targets.university;
            } else {
              for (let y = startYear; y <= Math.min(s.currentYear, duration); y++) {
                const targets = getFeeTargets(s.department, y, s.entryType, s.admissionYear);
                tTarget += targets.tuition; uTarget += targets.university;
              }
            }
          }

          const totalTarget = tTarget + uTarget;
          const totalPaid = tPaid + uPaid;
          return { student: s, tTarget, uTarget, tPaid, uPaid, totalTarget, totalPaid, balance: totalTarget - totalPaid, hasPaid: totalPaid > 0 };
        }).filter(Boolean) as { student: Student; tTarget: number; uTarget: number; tPaid: number; uPaid: number; totalTarget: number; totalPaid: number; balance: number; hasPaid: boolean }[];

        const totalStudents = results.length;
        const paidCount = results.filter(r => r.hasPaid).length;
        const balanceCount = totalStudents - paidCount;
        const totalTarget = results.reduce((s, r) => s + r.totalTarget, 0);
        const totalCollected = results.reduce((s, r) => s + r.totalPaid, 0);
        const totalPending = totalTarget - totalCollected;

        return { dept, results, totalStudents, paidCount, balanceCount, totalTarget, totalCollected, totalPending };
      }).filter(d => d.totalStudents > 0);
  };

  const handleExportDateRange = () => {
    const data = getDateRangeData();
    const dateLabel = (dateFrom || dateTo) ? ` (${dateFrom || '...'} to ${dateTo || '...'})` : '';
    let rows = '';
    let gTotal = 0, gPaid = 0, gBal = 0, gTarget = 0, gCollected = 0, gPending = 0;
    data.forEach(d => {
      gTotal += d.totalStudents; gPaid += d.paidCount; gBal += d.balanceCount;
      gTarget += d.totalTarget; gCollected += d.totalCollected; gPending += d.totalPending;
      rows += `<tr>
        <td style="font-weight:600">${d.dept.name} (${d.dept.code})</td>
        <td class="text-center">${d.totalStudents}</td>
        <td class="text-center text-green">${d.paidCount}</td>
        <td class="text-center text-red">${d.balanceCount}</td>
        <td class="text-right">${formatCurrency(d.totalTarget)}</td>
        <td class="text-right text-green">${formatCurrency(d.totalCollected)}</td>
        <td class="text-right text-red">${formatCurrency(d.totalPending)}</td>
      </tr>`;
    });
    rows += `<tr class="summary-row">
      <td class="font-bold">GRAND TOTAL</td>
      <td class="text-center font-bold">${gTotal}</td>
      <td class="text-center font-bold text-green">${gPaid}</td>
      <td class="text-center font-bold text-red">${gBal}</td>
      <td class="text-right font-bold">${formatCurrency(gTarget)}</td>
      <td class="text-right font-bold text-green">${formatCurrency(gCollected)}</td>
      <td class="text-right font-bold text-red">${formatCurrency(gPending)}</td>
    </tr>`;
    const html = `<table><thead><tr>
      <th>Department</th><th class="text-center">Total Students</th><th class="text-center">Paid</th><th class="text-center">Balance</th>
      <th class="text-right">Target</th><th class="text-right">Collected</th><th class="text-right">Pending</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
    exportPDF(`Date Range Financial Report${dateLabel}${drYearFilter !== 'all' ? ` - Year ${drYearFilter}` : ''}`, html);
  };

  const renderDateRange = () => {
    const data = getDateRangeData();
    const gTotal = data.reduce((s, d) => s + d.totalStudents, 0);
    const gPaid = data.reduce((s, d) => s + d.paidCount, 0);
    const gBal = data.reduce((s, d) => s + d.balanceCount, 0);
    const gTarget = data.reduce((s, d) => s + d.totalTarget, 0);
    const gCollected = data.reduce((s, d) => s + d.totalCollected, 0);
    const gPending = gTarget - gCollected;

    return (
      <div>
        <div className="flex flex-wrap items-end gap-4 mb-5 px-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 self-end pb-2">
            <Filter size={13} />
            <span>Filters</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Year</label>
            <select value={drYearFilter} onChange={e => setDrYearFilter(e.target.value)} className={selectClass}>
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Department</label>
            <select value={drDeptFilter} onChange={e => setDrDeptFilter(e.target.value)} className={selectClass}>
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Batch</label>
            <select value={drBatchFilter} onChange={e => setDrBatchFilter(e.target.value)} className={selectClass}>
              <option value="all">All Batches</option>
              {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {(dateFrom || dateTo) && (
          <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            Showing fee collections from <strong>{dateFrom || 'beginning'}</strong> to <strong>{dateTo || 'present'}</strong>. Targets reflect full fee obligation. "Paid" = students who made payments in this period.
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-2xl font-bold text-blue-800">{gTotal}</p>
            <p className="text-xs text-blue-500 font-medium">Total Students</p>
            <div className="flex gap-4 mt-2">
              <span className="text-xs text-emerald-600 font-semibold">{gPaid} Paid</span>
              <span className="text-xs text-red-500 font-semibold">{gBal} Balance</span>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-2xl font-bold text-emerald-800">{formatCurrency(gCollected)}</p>
            <p className="text-xs text-emerald-500 font-medium">{(dateFrom || dateTo) ? 'Collected in Period' : 'Total Collected'}</p>
            <p className="text-xs text-slate-400 mt-2">Target: {formatCurrency(gTarget)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-2xl font-bold text-red-700">{formatCurrency(gPending)}</p>
            <p className="text-xs text-red-500 font-medium">Total Pending</p>
            <p className="text-xs text-slate-400 mt-2">{gTarget > 0 ? Math.round((gPending / gTarget) * 100) : 0}% outstanding</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className={thClass + ' text-left'}>Department</th>
                <th className={thClass + ' text-center'}>Total</th>
                <th className={thClass + ' text-center'}>Paid</th>
                <th className={thClass + ' text-center'}>Balance</th>
                <th className={thClass + ' text-right'}>Target</th>
                <th className={thClass + ' text-right'}>Collected</th>
                <th className={thClass + ' text-right'}>Pending</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No data found for selected filters</td></tr>
              ) : (
                <>
                  {data.map((d, idx) => (
                    <React.Fragment key={d.dept.code}>
                      <tr
                        className={`cursor-pointer hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                        onClick={() => setExpandedDrDept(expandedDrDept === d.dept.code ? null : d.dept.code)}
                      >
                        <td className={tdClass}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{d.dept.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{d.dept.code}</span>
                          </div>
                        </td>
                        <td className={tdClass + ' text-center font-bold'}>{d.totalStudents}</td>
                        <td className={tdClass + ' text-center font-bold text-emerald-600'}>{d.paidCount}</td>
                        <td className={tdClass + ' text-center font-bold text-red-500'}>{d.balanceCount}</td>
                        <td className={tdClass + ' text-right'}>{formatCurrency(d.totalTarget)}</td>
                        <td className={tdClass + ' text-right text-emerald-600 font-semibold'}>{formatCurrency(d.totalCollected)}</td>
                        <td className={tdClass + ' text-right text-red-500 font-semibold'}>{formatCurrency(d.totalPending)}</td>
                      </tr>
                      {expandedDrDept === d.dept.code && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <div className="bg-blue-50/30 p-3">
                              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-slate-100">
                                      <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase text-left">Roll No</th>
                                      <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase text-left">Name</th>
                                      <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase text-center">Year</th>
                                      <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase text-center">Entry</th>
                                      <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase text-right">Target</th>
                                      <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase text-right">Paid</th>
                                      <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase text-right">Balance</th>
                                      <th className="px-3 py-2 text-[9px] font-semibold text-slate-500 uppercase text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {d.results.sort((a, b) => (a.student.hallTicketNumber || '').localeCompare(b.student.hallTicketNumber || '')).map((r, ri) => (
                                      <tr key={r.student.hallTicketNumber} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                        <td className="px-3 py-2 text-xs font-mono text-slate-600">{r.student.hallTicketNumber}</td>
                                        <td className="px-3 py-2 text-xs text-slate-700 font-medium">{r.student.name}</td>
                                        <td className="px-3 py-2 text-xs text-center">{r.student.currentYear}</td>
                                        <td className="px-3 py-2 text-xs text-center">
                                          {r.student.entryType === 'LATERAL' ? <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">LE</span> : <span className="text-slate-400">R</span>}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-right">{formatCurrency(r.totalTarget)}</td>
                                        <td className="px-3 py-2 text-xs text-right text-emerald-600 font-semibold">{formatCurrency(r.totalPaid)}</td>
                                        <td className="px-3 py-2 text-xs text-right text-red-500 font-semibold">{formatCurrency(r.balance)}</td>
                                        <td className="px-3 py-2 text-center">
                                          {r.balance <= 0
                                            ? <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">Paid</span>
                                            : r.hasPaid
                                              ? <span className="text-[9px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">Partial</span>
                                              : <span className="text-[9px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-semibold">Unpaid</span>
                                          }
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  <tr className="bg-[#1a365d] text-white">
                    <td className={tdClass + ' font-bold'}>GRAND TOTAL</td>
                    <td className={tdClass + ' text-center font-bold'}>{gTotal}</td>
                    <td className={tdClass + ' text-center font-bold text-emerald-300'}>{gPaid}</td>
                    <td className={tdClass + ' text-center font-bold text-red-300'}>{gBal}</td>
                    <td className={tdClass + ' text-right font-bold'}>{formatCurrency(gTarget)}</td>
                    <td className={tdClass + ' text-right font-bold text-emerald-300'}>{formatCurrency(gCollected)}</td>
                    <td className={tdClass + ' text-right font-bold text-red-300'}>{formatCurrency(gPending)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const exportHandlers: Record<ReportTab, () => void> = {
    dept_summary: handleExportDeptSummary,
    financial_year: handleExportFinYear,
    batch_wise: handleExportBatchWise,
    student_master: handleExportStudentMaster,
    student_info: handleExportStudentInfo,
    defaulters: handleExportDefaulters,
    category_analysis: handleExportCategoryAnalysis,
    date_range: handleExportDateRange,
  };

  const EmptyState = ({ message }: { message: string }) => (
    <tr>
      <td colSpan={20} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText size={20} className="text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">{message}</p>
        </div>
      </td>
    </tr>
  );

  const FilterBar = ({ children, count, countLabel }: { children: React.ReactNode; count?: number; countLabel?: string }) => (
    <div className="flex items-end gap-4 mb-5 flex-wrap px-1">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 self-end pb-2">
        <Filter size={13} />
        <span>Filters</span>
      </div>
      {children}
      {count !== undefined && (
        <div className="ml-auto">
          <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            {count} {countLabel || 'records'}
          </span>
        </div>
      )}
    </div>
  );

  const SelectFilter = ({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) => (
    <div>
      <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={selectClass}>
        {children}
      </select>
    </div>
  );

  const renderDeptSummary = () => {
    const data = getDeptSummaryData();
    const total = data.reduce((acc, d) => ({
      count: acc.count + d.count, tTarget: acc.tTarget + d.tTarget, tPaid: acc.tPaid + d.tPaid,
      uTarget: acc.uTarget + d.uTarget, uPaid: acc.uPaid + d.uPaid,
      totalReceived: acc.totalReceived + d.totalReceived, totalBalance: acc.totalBalance + d.totalBalance,
    }), { count: 0, tTarget: 0, tPaid: 0, uTarget: 0, uPaid: 0, totalReceived: 0, totalBalance: 0 });

    return (
      <div>
        <FilterBar>
          <SelectFilter label="Batch" value={batchFilter} onChange={setBatchFilter}>
            <option value="all">All Batches</option>
            {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
          </SelectFilter>
          <SelectFilter label="Year" value={yearFilter} onChange={setYearFilter}>
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </SelectFilter>
        </FilterBar>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                <th className={thClass}>Department</th>
                <th className={`${thClass} text-center`}>Students</th>
                <th className={`${thClass} text-right`}>T.Target</th>
                <th className={`${thClass} text-right`}>T.Paid</th>
                <th className={`${thClass} text-right`}>U.Target</th>
                <th className={`${thClass} text-right`}>U.Paid</th>
                <th className={`${thClass} text-right`}>Total Received</th>
                <th className={`${thClass} text-right`}>Total Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={`${d.code}-${d.entryLabel}`} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className={`${tdClass} font-semibold text-slate-800`}>{d.courseType}({d.code}){d.entryLabel ? <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${d.entryLabel === 'Lateral' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{d.entryLabel}</span> : ''}</td>
                  <td className={`${tdClass} text-slate-500 text-center`}>{d.count}</td>
                  <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.tTarget)}</td>
                  <td className={`${tdClass} font-semibold text-amber-600 text-right`}>{formatCurrency(d.tPaid)}</td>
                  <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.uTarget)}</td>
                  <td className={`${tdClass} font-semibold text-blue-600 text-right`}>{formatCurrency(d.uPaid)}</td>
                  <td className={`${tdClass} font-semibold text-emerald-600 text-right`}>{formatCurrency(d.totalReceived)}</td>
                  <td className={`${tdClass} font-semibold text-right ${d.totalBalance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatCurrency(d.totalBalance)}</td>
                </tr>
              ))}
              <tr className="bg-[#1a365d] text-white">
                <td className={`${tdClass} font-bold`}>GRAND TOTAL</td>
                <td className={`${tdClass} font-bold text-center`}>{total.count}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.tTarget)}</td>
                <td className={`${tdClass} font-bold text-right text-amber-200`}>{formatCurrency(total.tPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.uTarget)}</td>
                <td className={`${tdClass} font-bold text-right text-blue-200`}>{formatCurrency(total.uPaid)}</td>
                <td className={`${tdClass} font-bold text-right text-emerald-200`}>{formatCurrency(total.totalReceived)}</td>
                <td className={`${tdClass} font-bold text-right text-red-200`}>{formatCurrency(total.totalBalance)}</td>
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
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80">
              <th className={thClass}>Financial Year</th>
              <th className={`${thClass} text-center`}>Transactions</th>
              <th className={`${thClass} text-right`}>Tuition Collected</th>
              <th className={`${thClass} text-right`}>University Collected</th>
              <th className={`${thClass} text-right`}>Other</th>
              <th className={`${thClass} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && <EmptyState message="No approved transactions found." />}
            {data.map((d, i) => (
              <tr key={d.financialYear} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                <td className={`${tdClass} font-semibold text-slate-800`}>{d.financialYear}</td>
                <td className={`${tdClass} text-slate-500 text-center`}>{d.count}</td>
                <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.tuition)}</td>
                <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.university)}</td>
                <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.other)}</td>
                <td className={`${tdClass} font-semibold text-emerald-600 text-right`}>{formatCurrency(d.total)}</td>
              </tr>
            ))}
            {data.length > 0 && (
              <tr className="bg-[#1a365d] text-white">
                <td className={`${tdClass} font-bold`}>GRAND TOTAL</td>
                <td className={`${tdClass} font-bold text-center`}>{total.count}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.tuition)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.university)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.other)}</td>
                <td className={`${tdClass} font-bold text-right text-emerald-200`}>{formatCurrency(total.total)}</td>
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
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80">
              <th className={thClass}>Batch</th>
              <th className={`${thClass} text-center`}>Students</th>
              <th className={`${thClass} text-right`}>Total Target</th>
              <th className={`${thClass} text-right`}>Total Paid</th>
              <th className={`${thClass} text-right`}>Balance</th>
              <th className={`${thClass} text-right`}>Collection %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => {
              const pct = d.totalTarget > 0 ? (d.totalPaid / d.totalTarget) * 100 : 0;
              return (
                <tr key={d.batch} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className={`${tdClass} font-semibold text-slate-800`}>{d.batch}</td>
                  <td className={`${tdClass} text-slate-500 text-center`}>{d.count}</td>
                  <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.totalTarget)}</td>
                  <td className={`${tdClass} font-semibold text-emerald-600 text-right`}>{formatCurrency(d.totalPaid)}</td>
                  <td className={`${tdClass} font-semibold text-right ${d.balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatCurrency(d.balance)}</td>
                  <td className={`${tdClass} text-right`}>
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className={`text-xs font-semibold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {data.length > 0 && (
              <tr className="bg-[#1a365d] text-white">
                <td className={`${tdClass} font-bold`}>GRAND TOTAL</td>
                <td className={`${tdClass} font-bold text-center`}>{total.count}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.totalTarget)}</td>
                <td className={`${tdClass} font-bold text-right text-emerald-200`}>{formatCurrency(total.totalPaid)}</td>
                <td className={`${tdClass} font-bold text-right text-red-200`}>{formatCurrency(total.balance)}</td>
                <td className={`${tdClass} font-bold text-right`}>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
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
        <FilterBar count={data.length} countLabel="students">
          <SelectFilter label="Department" value={deptFilter} onChange={setDeptFilter}>
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </SelectFilter>
          <SelectFilter label="Batch" value={batchFilter} onChange={setBatchFilter}>
            <option value="all">All Batches</option>
            {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
          </SelectFilter>
          <SelectFilter label="Year" value={yearFilter} onChange={setYearFilter}>
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </SelectFilter>
        </FilterBar>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className={`${thClass} text-center w-10`}>S.No</th>
                <th className={thClass}>Hall Ticket</th>
                <th className={thClass}>Name</th>
                <th className={`${thClass} text-center`}>Dept</th>
                <th className={`${thClass} text-center`}>Category</th>
                <th className={`${thClass} text-right`}>T.Target</th>
                <th className={`${thClass} text-right`}>T.Paid</th>
                <th className={`${thClass} text-right`}>T.Bal</th>
                <th className={`${thClass} text-right`}>U.Target</th>
                <th className={`${thClass} text-right`}>U.Paid</th>
                <th className={`${thClass} text-right`}>U.Bal</th>
                <th className={`${thClass} text-right`}>Total Paid</th>
                <th className={`${thClass} text-right`}>Total Bal</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <EmptyState message="No students match the selected filters." />}
              {data.map((s, i) => (
                <tr key={s.hallTicketNumber} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="px-3 py-2.5 text-xs text-slate-400 text-center">{i + 1}</td>
                  <td className="px-3 py-2.5 text-xs font-mono font-semibold text-slate-700">{s.hallTicketNumber}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">{s.name}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 text-center">{(s.department || '').replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', '')}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${s.admissionCategory?.includes('MANAGEMENT') ? 'bg-amber-50 text-amber-700 border border-amber-200' : s.admissionCategory?.includes('CONVENOR') || s.admissionCategory?.includes('CONVENER') ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {s.admissionCategory || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 text-right">{formatCurrency(s.tTarget)}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-emerald-600 text-right">{formatCurrency(s.tPaid)}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-right" style={{ color: s.tBalance > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(s.tBalance)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 text-right">{formatCurrency(s.uTarget)}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-blue-600 text-right">{formatCurrency(s.uPaid)}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-right" style={{ color: s.uBalance > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(s.uBalance)}</td>
                  <td className="px-3 py-2.5 text-xs font-bold text-emerald-600 text-right">{formatCurrency(s.totalPaid)}</td>
                  <td className="px-3 py-2.5 text-xs font-bold text-right" style={{ color: s.totalBalance > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(s.totalBalance)}</td>
                </tr>
              ))}
              {data.length > 0 && (
                <tr className="bg-[#1a365d] text-white">
                  <td colSpan={5} className="px-3 py-3 text-xs font-bold text-right">GRAND TOTAL ({data.length} students)</td>
                  <td className="px-3 py-3 text-xs font-bold text-right">{formatCurrency(totals.tTarget)}</td>
                  <td className="px-3 py-3 text-xs font-bold text-right text-emerald-200">{formatCurrency(totals.tPaid)}</td>
                  <td className="px-3 py-3 text-xs font-bold text-right text-red-200">{formatCurrency(totals.tBalance)}</td>
                  <td className="px-3 py-3 text-xs font-bold text-right">{formatCurrency(totals.uTarget)}</td>
                  <td className="px-3 py-3 text-xs font-bold text-right text-blue-200">{formatCurrency(totals.uPaid)}</td>
                  <td className="px-3 py-3 text-xs font-bold text-right text-red-200">{formatCurrency(totals.uBalance)}</td>
                  <td className="px-3 py-3 text-xs font-bold text-right text-emerald-200">{formatCurrency(totals.totalPaid)}</td>
                  <td className="px-3 py-3 text-xs font-bold text-right text-red-200">{formatCurrency(totals.totalBalance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStudentInfo = () => {
    const data = getStudentInfoData();
    return (
      <div>
        <FilterBar count={data.length} countLabel="students">
          <SelectFilter label="Department" value={deptFilter} onChange={setDeptFilter}>
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </SelectFilter>
          <SelectFilter label="Batch" value={batchFilter} onChange={setBatchFilter}>
            <option value="all">All Batches</option>
            {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
          </SelectFilter>
        </FilterBar>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className={`${thClass} text-center w-10`}>S.No</th>
                <th className={thClass}>Hall Ticket</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Father</th>
                <th className={thClass}>Mother</th>
                <th className={`${thClass} text-center`}>Sex</th>
                <th className={`${thClass} text-center`}>DOB</th>
                <th className={`${thClass} text-center`}>Dept</th>
                <th className={`${thClass} text-center`}>Batch</th>
                <th className={`${thClass} text-center`}>Category</th>
                <th className={thClass}>Mobile</th>
                <th className={thClass}>Father Mobile</th>
                <th className={thClass}>Address</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <EmptyState message="No students match the selected filters." />}
              {data.map((s, i) => (
                <tr key={s.hallTicketNumber} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="px-3 py-2.5 text-xs text-slate-400 text-center">{i + 1}</td>
                  <td className="px-3 py-2.5 text-xs font-mono font-semibold text-slate-700">{s.hallTicketNumber}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">{s.name}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{s.fatherName}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{s.motherName}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 text-center">{s.sex}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 text-center">{s.dob}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 text-center">{(s.department || '').replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', '')}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 text-center">{s.batch}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${(s.admissionCategory || '').includes('MANAGEMENT') ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {s.admissionCategory || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{s.mobile}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{s.fatherMobile}</td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-400 max-w-[140px] truncate" title={s.address}>{s.address}</td>
                </tr>
              ))}
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
        <FilterBar count={data.length} countLabel="defaulters">
          <SelectFilter label="Batch" value={batchFilter} onChange={setBatchFilter}>
            <option value="all">All Batches</option>
            {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
          </SelectFilter>
          <SelectFilter label="Department" value={deptFilter} onChange={setDeptFilter}>
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </SelectFilter>
          <SelectFilter label="Year" value={yearFilter} onChange={setYearFilter}>
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </SelectFilter>
          {data.length > 0 && (
            <div className="ml-2 self-end pb-0.5">
              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                Outstanding: {formatCurrency(totals.balance)}
              </span>
            </div>
          )}
        </FilterBar>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                <th className={`${thClass} text-center w-12`}>S.No</th>
                <th className={thClass}>Hall Ticket</th>
                <th className={thClass}>Student Name</th>
                <th className={`${thClass} text-center`}>Dept</th>
                <th className={`${thClass} text-center`}>Category</th>
                <th className={`${thClass} text-center`}>Year</th>
                <th className={`${thClass} text-right`}>Target</th>
                <th className={`${thClass} text-right`}>Paid</th>
                <th className={`${thClass} text-right`}>Balance Due</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <EmptyState message="No fee defaulters found." />}
              {data.map((s, i) => (
                <tr key={s.hallTicketNumber} className={`border-b border-slate-100 hover:bg-red-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="px-4 py-2.5 text-xs text-slate-400 text-center">{i + 1}</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-semibold text-slate-700">{s.hallTicketNumber}</td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-slate-800">{s.name}{s.entryType === 'LATERAL' && <span className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded bg-purple-100 text-purple-700">LE</span>}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 text-center">{(s.department || '').replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', '')}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${s.admissionCategory?.includes('MANAGEMENT') ? 'bg-amber-50 text-amber-700 border border-amber-200' : s.admissionCategory?.includes('CONVENOR') || s.admissionCategory?.includes('CONVENER') ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {s.admissionCategory || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 text-center">{s.currentYear}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600 text-right">{formatCurrency(s.totalTarget)}</td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-emerald-600 text-right">{formatCurrency(s.totalPaid)}</td>
                  <td className="px-4 py-2.5 text-sm font-bold text-red-500 text-right">{formatCurrency(s.balance)}</td>
                </tr>
              ))}
              {data.length > 0 && (
                <tr className="bg-[#1a365d] text-white">
                  <td colSpan={6} className={`${tdClass} font-bold text-right`}>GRAND TOTAL ({data.length} defaulters)</td>
                  <td className={`${tdClass} font-bold text-right`}>{formatCurrency(totals.totalTarget)}</td>
                  <td className={`${tdClass} font-bold text-right text-emerald-200`}>{formatCurrency(totals.totalPaid)}</td>
                  <td className={`${tdClass} font-bold text-right text-red-200`}>{formatCurrency(totals.balance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCategoryAnalysis = () => {
    const data = getCategoryAnalysisData();
    const total = data.reduce((acc, d) => ({
      tsmfcCount: acc.tsmfcCount + d.tsmfcCount, tsmfcTarget: acc.tsmfcTarget + d.tsmfcTarget,
      tsmfcTuiPaid: acc.tsmfcTuiPaid + d.tsmfcTuiPaid, tsmfcUniPaid: acc.tsmfcUniPaid + d.tsmfcUniPaid, tsmfcBalance: acc.tsmfcBalance + d.tsmfcBalance,
      mgmtCount: acc.mgmtCount + d.mgmtCount, mgmtTarget: acc.mgmtTarget + d.mgmtTarget,
      mgmtTuiPaid: acc.mgmtTuiPaid + d.mgmtTuiPaid, mgmtUniPaid: acc.mgmtUniPaid + d.mgmtUniPaid, mgmtBalance: acc.mgmtBalance + d.mgmtBalance,
      convCount: acc.convCount + d.convCount, convTarget: acc.convTarget + d.convTarget,
      convTuiPaid: acc.convTuiPaid + d.convTuiPaid, convUniPaid: acc.convUniPaid + d.convUniPaid, convBalance: acc.convBalance + d.convBalance,
      all: acc.all + d.totalCount,
    }), { tsmfcCount: 0, tsmfcTarget: 0, tsmfcTuiPaid: 0, tsmfcUniPaid: 0, tsmfcBalance: 0, mgmtCount: 0, mgmtTarget: 0, mgmtTuiPaid: 0, mgmtUniPaid: 0, mgmtBalance: 0, convCount: 0, convTarget: 0, convTuiPaid: 0, convUniPaid: 0, convBalance: 0, all: 0 });

    return (
      <div>
        <FilterBar count={total.all} countLabel="students">
          <SelectFilter label="Batch" value={batchFilter} onChange={setBatchFilter}>
            <option value="all">All Batches</option>
            {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
          </SelectFilter>
          <SelectFilter label="Year" value={yearFilter} onChange={setYearFilter}>
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </SelectFilter>
        </FilterBar>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className={thClass} rowSpan={2}>Department</th>
                <th className="px-2 py-2 text-[9px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50 text-center border-b border-blue-200" colSpan={5}>TSMFC</th>
                <th className="px-2 py-2 text-[9px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 text-center border-b border-amber-200" colSpan={5}>Management Quota</th>
                <th className="px-2 py-2 text-[9px] font-bold text-purple-800 uppercase tracking-wider bg-purple-50 text-center border-b border-purple-200" colSpan={5}>Convenor</th>
                <th className="px-2 py-2 text-[9px] font-bold text-slate-700 uppercase tracking-wider bg-slate-100 text-center border-b border-slate-300" rowSpan={2}>Total</th>
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
              {data.length === 0 && <EmptyState message="No TSMFC, Management or Convenor students found." />}
              {data.map((d, i) => (
                <tr key={`${d.code}-${d.entryLabel}`} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="px-3 py-2.5 text-xs font-bold text-slate-800">{d.courseType}({d.code}){d.entryLabel ? <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${d.entryLabel === 'Lateral' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{d.entryLabel}</span> : ''}</td>
                  <td className="px-1.5 py-2.5 text-xs text-blue-700 font-semibold text-center bg-blue-50/20">{d.tsmfcCount}</td>
                  <td className="px-1.5 py-2.5 text-xs text-slate-600 text-right bg-blue-50/20">{formatCurrency(d.tsmfcTarget)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-semibold text-emerald-600 text-right bg-blue-50/20">{formatCurrency(d.tsmfcTuiPaid)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-semibold text-teal-600 text-right bg-blue-50/20">{formatCurrency(d.tsmfcUniPaid)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-bold text-right bg-blue-50/20" style={{ color: d.tsmfcBalance > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(d.tsmfcBalance)}</td>
                  <td className="px-1.5 py-2.5 text-xs text-amber-700 font-semibold text-center bg-amber-50/20">{d.mgmtCount}</td>
                  <td className="px-1.5 py-2.5 text-xs text-slate-600 text-right bg-amber-50/20">{formatCurrency(d.mgmtTarget)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-semibold text-emerald-600 text-right bg-amber-50/20">{formatCurrency(d.mgmtTuiPaid)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-semibold text-teal-600 text-right bg-amber-50/20">{formatCurrency(d.mgmtUniPaid)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-bold text-right bg-amber-50/20" style={{ color: d.mgmtBalance > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(d.mgmtBalance)}</td>
                  <td className="px-1.5 py-2.5 text-xs text-purple-700 font-semibold text-center bg-purple-50/20">{d.convCount}</td>
                  <td className="px-1.5 py-2.5 text-xs text-slate-600 text-right bg-purple-50/20">{formatCurrency(d.convTarget)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-semibold text-emerald-600 text-right bg-purple-50/20">{formatCurrency(d.convTuiPaid)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-semibold text-teal-600 text-right bg-purple-50/20">{formatCurrency(d.convUniPaid)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-bold text-right bg-purple-50/20" style={{ color: d.convBalance > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(d.convBalance)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-bold text-slate-800 text-center bg-slate-50">{d.totalCount}</td>
                </tr>
              ))}
              {data.length > 0 && (
                <tr className="bg-[#1a365d] text-white">
                  <td className="px-3 py-3 text-xs font-bold">GRAND TOTAL</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-center">{total.tsmfcCount}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right">{formatCurrency(total.tsmfcTarget)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right text-emerald-200">{formatCurrency(total.tsmfcTuiPaid)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right text-teal-200">{formatCurrency(total.tsmfcUniPaid)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right text-red-200">{formatCurrency(total.tsmfcBalance)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-center">{total.mgmtCount}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right">{formatCurrency(total.mgmtTarget)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right text-emerald-200">{formatCurrency(total.mgmtTuiPaid)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right text-teal-200">{formatCurrency(total.mgmtUniPaid)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right text-red-200">{formatCurrency(total.mgmtBalance)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-center">{total.convCount}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right">{formatCurrency(total.convTarget)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right text-emerald-200">{formatCurrency(total.convTuiPaid)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right text-teal-200">{formatCurrency(total.convUniPaid)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-right text-red-200">{formatCurrency(total.convBalance)}</td>
                  <td className="px-1.5 py-3 text-xs font-bold text-center text-yellow-200">{total.all}</td>
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
    student_info: renderStudentInfo,
    defaulters: renderDefaulters,
    category_analysis: renderCategoryAnalysis,
    date_range: renderDateRange,
  };

  const reportTitles: Record<ReportTab, { title: string; subtitle: string }> = {
    dept_summary: { title: 'Department Summary', subtitle: 'Institutional revenue analysis across all departments' },
    financial_year: { title: 'Financial Year Wise', subtitle: 'Year-on-year fee collection breakdown' },
    batch_wise: { title: 'Batch Wise Report', subtitle: 'Admission batch fee analysis & collection rate' },
    student_master: { title: 'Student Master Fee List', subtitle: 'Year wise fee details per student' },
    student_info: { title: 'Student Master List', subtitle: 'Complete student personal information directory' },
    defaulters: { title: 'Fee Defaulters', subtitle: 'Department & year wise outstanding balance' },
    category_analysis: { title: 'Category Analysis', subtitle: 'Management vs Convenor fee payment & pending summary' },
    date_range: { title: 'Date Range Financial Report', subtitle: 'Fee collection within a custom date period vs overall targets' },
  };

  const activeReport = reportTitles[activeTab];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#1a365d] to-[#2c5282] rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <BarChart3 size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Reports & Analytics</h1>
              <p className="text-blue-200 text-xs mt-0.5">Generate, filter and export institutional fee reports</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-blue-200 text-xs">
            <TrendingUp size={14} />
            <span>{students.length} students | {transactions.filter(t => t.status === 'APPROVED').length} transactions</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setYearFilter('all'); setDeptFilter('all'); setBatchFilter('all'); }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all border ${
              activeTab === tab.id
                ? 'bg-[#1a365d] text-white border-[#1a365d] shadow-md shadow-blue-900/20'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === tab.id ? 'bg-white/15' : 'bg-slate-100'}`}>
              {tab.icon}
            </div>
            <span className="text-[11px] font-semibold leading-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-[#2c5282] rounded-lg">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{activeReport.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{activeReport.subtitle}</p>
            </div>
          </div>
          <button
            onClick={exportHandlers[activeTab]}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <Printer size={15} />
            <span>Export PDF</span>
          </button>
        </div>
        <div className="p-5">
          {renderContent[activeTab]()}
        </div>
      </div>
    </div>
  );
};
