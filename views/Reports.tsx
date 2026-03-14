
import React, { useMemo, useState } from 'react';
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
  TrendingUp,
  GraduationCap,
  X
} from 'lucide-react';
import { Student } from '../types';
import { normalizeDepartment } from '../constants';

type ReportTab = 'dept_summary' | 'financial_year' | 'batch_wise' | 'academic_year' | 'academic_year_count' | 'student_master' | 'student_info' | 'defaulters' | 'category_analysis' | 'date_range';

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

const FEE_LABELS = {
  tTarget: 'Tuition Fee (Actual)',
  tPaid: 'Tuition Fee (Paid)',
  tBalance: 'Tuition Fee Balance',
  uTarget: 'O.U Fee (Actual)',
  uPaid: 'O.U Fee (Paid)',
  uBalance: 'O.U Fee Balance',
  convT: 'Conv (Tuition)',
  convU: 'Conv (OU)',
  mgmtT: 'M.Q (Tuition)',
  mgmtU: 'M.Q(OU)',
  tsmfcT: 'TSMFC (Tuition Fee)',
  tsmfcU: 'TSMFC(OU Fee)',
  otherT: 'Other (Tuition Fee)',
  otherU: 'Other(OU Fee)',
  receivedSplit: 'Received Fee Category Wise',
  tuitionCollected: 'Tuition Fee Collected',
  ouCollected: 'O.U Fee Collected',
  tuition: 'Tuition Fee',
  ou: 'O.U Fee',
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

const parsePaymentDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const dotMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) return new Date(parseInt(dotMatch[3]), parseInt(dotMatch[2]) - 1, parseInt(dotMatch[1]));
  const dashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) return new Date(parseInt(dashMatch[3]), parseInt(dashMatch[2]) - 1, parseInt(dashMatch[1]));
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const matchesDept = (studentDept: string, dept: { name: string; code: string }) =>
  !!studentDept && normalizeDepartment(studentDept) === normalizeDepartment(dept.code);

const normalizeAdmissionCategory = (category: string | null | undefined): string => {
  const raw = (category || '').trim();
  const key = raw.toUpperCase().replace(/[^A-Z0-9&]/g, '');
  if (!key) return '';
  if (key === 'CON' || key.includes('CONVENOR') || key.includes('CONVENER')) return 'CONVENOR';
  if (key.includes('DETAIN')) return 'DETAINED';
  return raw.toUpperCase();
};

const isManagementCategory = (category: string | null | undefined) => {
  const normalized = normalizeAdmissionCategory(category);
  const key = normalized.replace(/[^A-Z0-9]/g, '');
  return key.includes('MANAGEMENT') || key === 'MQ' || key === 'SPOT';
};

const isConvenorCategory = (category: string | null | undefined) => {
  const normalized = normalizeAdmissionCategory(category);
  const key = normalized.replace(/[^A-Z0-9]/g, '');
  return key.includes('CONVENOR') || key.includes('CONVENER') || key === 'CON';
};

const isTSMFCCategory = (category: string | null | undefined) => {
  const normalized = normalizeAdmissionCategory(category);
  const key = normalized.replace(/[^A-Z0-9]/g, '');
  return key.includes('TSMFC') || key.includes('TSECET');
};

const getAdmissionCategoryBucket = (category: string | null | undefined): 'CONV' | 'MGMT' | 'TSMFC' | 'OTHER' => {
  if (isConvenorCategory(category)) return 'CONV';
  if (isManagementCategory(category)) return 'MGMT';
  if (isTSMFCCategory(category)) return 'TSMFC';
  return 'OTHER';
};

const getDisplayBatch = (student: Pick<Student, 'batch' | 'entryType' | 'course'>): string => {
  return (student.batch || '').trim();
};

const getBatchStartYear = (student: Pick<Student, 'batch'>): number | null => {
  const start = parseInt(((student.batch || '').split('-')[0] || '').trim(), 10);
  return Number.isNaN(start) ? null : start;
};

const getBatchEndYear = (student: Pick<Student, 'batch'>): number | null => {
  const end = parseInt(((student.batch || '').split('-')[1] || '').trim(), 10);
  return Number.isNaN(end) ? null : end;
};

const getAcademicStudyYear = (
  student: Pick<Student, 'batch' | 'entryType' | 'course' | 'currentYear'>,
  ayStartYear: number,
  duration: number
): number | null => {
  const batchStart = getBatchStartYear(student);
  const batchEnd = getBatchEndYear(student);
  if (batchStart === null || batchEnd === null) return null;
  if (ayStartYear < batchStart || ayStartYear >= batchEnd) return null;
  if (student.currentYear >= 1 && student.currentYear <= duration) {
    if (student.course === 'B.E' && student.entryType === 'LATERAL' && student.currentYear < 2) return null;
    return student.currentYear;
  }
  const studyYear = student.course === 'B.E' && student.entryType === 'LATERAL'
    ? ayStartYear - batchStart + 2
    : ayStartYear - batchStart + 1;
  if (studyYear < 1 || studyYear > duration) return null;
  if (student.course === 'B.E' && student.entryType === 'LATERAL' && studyYear < 2) return null;
  return studyYear;
};

const isHistoricalForAcademicYear = (
  student: Pick<Student, 'batch'>,
  ayStartYear: number,
  _duration: number
): boolean => {
  const batchEnd = getBatchEndYear(student);
  if (batchEnd === null) return false;
  return ayStartYear >= batchEnd;
};

const findDeptForStudent = (studentDept: string, deptList: { name: string; code: string; duration?: number; courseType?: string }[]) =>
  deptList.find(d => matchesDept(studentDept, d));

const getStudentCourseType = (student: Pick<Student, 'course'>) =>
  student.course === 'M.E' ? 'M.E' : 'B.E';

export const Reports: React.FC = () => {
  const { students, departments, transactions, getFeeTargets } = useApp();
  const [activeTab, setActiveTab] = useState<ReportTab>('dept_summary');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [drYearFilter, setDrYearFilter] = useState<string>('all');
  const [drDeptFilter, setDrDeptFilter] = useState<string>('all');
  const [drBatchFilter, setDrBatchFilter] = useState<string>('all');
  const [expandedDrDept, setExpandedDrDept] = useState<string | null>(null);
  const [expandedFY, setExpandedFY] = useState<string | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [ayFilter, setAyFilter] = useState<string>('2025-26');
  const [selectedAyDetailKey, setSelectedAyDetailKey] = useState<string | null>(null);
  const [selectedAyDetailCategory, setSelectedAyDetailCategory] = useState<'ALL' | 'CONV' | 'MGMT' | 'TSMFC' | 'OTHER'>('ALL');
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<{ rowKey: string; bucket: 'TSMFC' | 'MGMT' | 'CONV' } | null>(null);
  const [selectedDeptDetail, setSelectedDeptDetail] = useState<{ rowKey: string; bucket: 'ALL' | 'CONV' | 'MGMT' | 'TSMFC' | 'OTHER' } | null>(null);

  const reportDepartments = useMemo(() => {
    const extras: typeof departments = [];
    const hasUnassignedBE = students.some(s => !findDeptForStudent(s.department, departments) && getStudentCourseType(s) === 'B.E');
    const hasUnassignedME = students.some(s => !findDeptForStudent(s.department, departments) && getStudentCourseType(s) === 'M.E');
    if (hasUnassignedBE) {
      extras.push({ id: '__UNASSIGNED_BE__', name: 'Unassigned', code: 'UNASSIGNED-BE', duration: 4, courseType: 'B.E' });
    }
    if (hasUnassignedME) {
      extras.push({ id: '__UNASSIGNED_ME__', name: 'Unassigned (M.E)', code: 'UNASSIGNED-ME', duration: 2, courseType: 'M.E' });
    }
    return [...departments, ...extras];
  }, [departments, students]);

  const studentMatchesReportDept = (student: Student, dept: typeof reportDepartments[number]) => {
    if (dept.code === 'UNASSIGNED-BE') {
      return !findDeptForStudent(student.department, departments) && getStudentCourseType(student) === 'B.E';
    }
    if (dept.code === 'UNASSIGNED-ME') {
      return !findDeptForStudent(student.department, departments) && getStudentCourseType(student) === 'M.E';
    }
    return matchesDept(student.department, dept);
  };

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'dept_summary', label: 'Dept Summary', icon: <Building2 size={16} />, desc: 'Revenue by department' },
    { id: 'financial_year', label: 'Financial Year', icon: <Calendar size={16} />, desc: 'Year-on-year breakdown' },
    { id: 'batch_wise', label: 'Batch Wise', icon: <Layers size={16} />, desc: 'Batch fee analysis' },
    { id: 'academic_year', label: 'Academic Year', icon: <GraduationCap size={16} />, desc: 'Year-wise collection' },
    { id: 'academic_year_count', label: 'AY Count', icon: <Users size={16} />, desc: 'Student count by AY' },
    { id: 'student_master', label: 'Fee List', icon: <IndianRupee size={16} />, desc: 'Student fee details' },
    { id: 'student_info', label: 'Student List', icon: <ContactRound size={16} />, desc: 'Personal details' },
    { id: 'defaulters', label: 'Defaulters', icon: <AlertTriangle size={16} />, desc: 'Outstanding dues' },
    { id: 'category_analysis', label: 'Category Analysis', icon: <Users size={16} />, desc: 'Management vs Convenor' },
    { id: 'date_range', label: 'Date Range', icon: <Calendar size={16} />, desc: 'Custom period report' },
  ];

  const allBatches = Array.from(new Set(students.map(s => getDisplayBatch(s)).filter(Boolean))).sort();
  const batchOptions = allBatches.map(batch => ({
    value: batch,
    count: students.filter(s => getDisplayBatch(s) === batch).length,
  }));
  const allFinYears = Array.from(new Set(transactions.map(t => t.financialYear))).filter(Boolean).sort();
  const allCategories = Array.from(new Set(
    students
      .map(s => normalizeAdmissionCategory(s.admissionCategory))
      .filter(Boolean)
  )).sort();

  const getStudentTargets = (s: Student, filterYear: number | null, fromDate?: Date | null, toDate?: Date | null) => {
    let tTarget = 0, uTarget = 0, tPaid = 0, uPaid = 0;
    const dept = reportDepartments.find(d => studentMatchesReportDept(s, d));
    const duration = dept?.duration || (getStudentCourseType(s) === 'M.E' ? 2 : 4);
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
          if (fromDate || toDate) {
            const txDate = parsePaymentDate(t.paymentDate);
            if (txDate) {
              if (fromDate && txDate < fromDate) return;
              if (toDate && txDate > toDate) return;
            } else {
              return;
            }
          }
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

  type DeptSummaryRow = {
    department: string;
    code: string;
    courseType: string;
    entryLabel: string;
    count: number;
    tTarget: number;
    uTarget: number;
    tPaid: number;
    uPaid: number;
    totalReceived: number;
    totalBalance: number;
    convCount: number;
    mgmtCount: number;
    tsmfcCount: number;
    otherCount: number;
    convTPaid: number;
    convUPaid: number;
    mgmtTPaid: number;
    mgmtUPaid: number;
    tsmfcTPaid: number;
    tsmfcUPaid: number;
    otherTPaid: number;
    otherUPaid: number;
  };

  const getDeptSummaryRowKey = (row: DeptSummaryRow) =>
    [row.courseType, row.code, row.entryLabel || 'ALL'].join('|');

  const getDeptSummaryData = () => {
    const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    const rows: DeptSummaryRow[] = [];
    reportDepartments.forEach(dept => {
      let deptStudents = students.filter(s => studentMatchesReportDept(s, dept));
      if (batchFilter !== 'all') deptStudents = deptStudents.filter(s => getDisplayBatch(s) === batchFilter);
      const regularStudents = deptStudents.filter(s => s.entryType !== 'LATERAL');
      const lateralStudents = (filterYear === 1) ? [] : deptStudents.filter(s => s.entryType === 'LATERAL');
      const calcRow = (subset: typeof deptStudents, label: string) => {
        let tTarget = 0, uTarget = 0, tPaid = 0, uPaid = 0;
        let convCount = 0, mgmtCount = 0, tsmfcCount = 0, otherCount = 0;
        let convTPaid = 0, convUPaid = 0, mgmtTPaid = 0, mgmtUPaid = 0, tsmfcTPaid = 0, tsmfcUPaid = 0, otherTPaid = 0, otherUPaid = 0;
        subset.forEach(s => {
          const t = getStudentTargets(s, filterYear, from, to);
          tTarget += t.tTarget; uTarget += t.uTarget; tPaid += t.tPaid; uPaid += t.uPaid;
          const bucket = getAdmissionCategoryBucket(s.admissionCategory);
          if (bucket === 'CONV') {
            convCount++;
            convTPaid += t.tPaid;
            convUPaid += t.uPaid;
          } else if (bucket === 'MGMT') {
            mgmtCount++;
            mgmtTPaid += t.tPaid;
            mgmtUPaid += t.uPaid;
          } else if (bucket === 'TSMFC') {
            tsmfcCount++;
            tsmfcTPaid += t.tPaid;
            tsmfcUPaid += t.uPaid;
          } else {
            otherCount++;
            otherTPaid += t.tPaid;
            otherUPaid += t.uPaid;
          }
        });
        rows.push({
          department: dept.name, code: dept.code, courseType: dept.courseType, entryLabel: label,
          count: subset.length, tTarget, uTarget, tPaid, uPaid,
          totalReceived: tPaid + uPaid, totalBalance: (tTarget + uTarget) - (tPaid + uPaid),
          convCount, mgmtCount, tsmfcCount, otherCount,
          convTPaid, convUPaid, mgmtTPaid, mgmtUPaid, tsmfcTPaid, tsmfcUPaid, otherTPaid, otherUPaid,
        });
      };
      if (dept.courseType === 'B.E') {
        calcRow(regularStudents, 'Regular');
        if (filterYear !== 1) {
          calcRow(lateralStudents, 'Lateral');
        }
      } else {
        calcRow(deptStudents, '');
      }
    });
    return rows;
  };

  const getDeptSummaryDetailStudents = (
    row: DeptSummaryRow,
    bucket: 'ALL' | 'CONV' | 'MGMT' | 'TSMFC' | 'OTHER'
  ) => {
    const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    const dept = reportDepartments.find(d => d.code === row.code && d.courseType === row.courseType);
    if (!dept) return [];

    return students
      .filter(s => {
        if (!studentMatchesReportDept(s, dept)) return false;
        if (batchFilter !== 'all' && getDisplayBatch(s) !== batchFilter) return false;
        if (row.entryLabel === 'Regular' && s.entryType === 'LATERAL') return false;
        if (row.entryLabel === 'Lateral' && s.entryType !== 'LATERAL') return false;
        if (bucket === 'ALL') return true;
        return getAdmissionCategoryBucket(s.admissionCategory) === bucket;
      })
      .map(s => {
        const t = getStudentTargets(s, filterYear, from, to);
        return {
          hallTicketNumber: s.hallTicketNumber,
          name: s.name,
          fatherName: s.fatherName,
          department: (s.department || '').replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', ''),
          batch: getDisplayBatch(s) || '-',
          entryType: s.entryType === 'LATERAL' ? 'L.E' : 'R',
          admissionCategory: normalizeAdmissionCategory(s.admissionCategory) || '-',
          tTarget: t.tTarget,
          tPaid: t.tPaid,
          uTarget: t.uTarget,
          uPaid: t.uPaid,
          totalPaid: t.tPaid + t.uPaid,
          totalBalance: (t.tTarget + t.uTarget) - (t.tPaid + t.uPaid),
        };
      })
      .sort((a, b) => a.hallTicketNumber.localeCompare(b.hallTicketNumber));
  };

  const exportDeptSummaryDetailPDF = (
    row: DeptSummaryRow,
    bucket: 'ALL' | 'CONV' | 'MGMT' | 'TSMFC' | 'OTHER'
  ) => {
    const detailStudents = getDeptSummaryDetailStudents(row, bucket);
    const totals = detailStudents.reduce((acc, s) => ({
      tTarget: acc.tTarget + s.tTarget,
      tPaid: acc.tPaid + s.tPaid,
      uTarget: acc.uTarget + s.uTarget,
      uPaid: acc.uPaid + s.uPaid,
      totalPaid: acc.totalPaid + s.totalPaid,
      totalBalance: acc.totalBalance + s.totalBalance,
    }), { tTarget: 0, tPaid: 0, uTarget: 0, uPaid: 0, totalPaid: 0, totalBalance: 0 });

    const rows = detailStudents.map((s, idx) => `<tr>
      <td class="text-center">${idx + 1}</td>
      <td>${s.hallTicketNumber}</td>
      <td>${s.name}</td>
      <td>${s.fatherName || '-'}</td>
      <td class="text-center">${s.department}</td>
      <td class="text-center">${s.batch}</td>
      <td class="text-center">${s.entryType}</td>
      <td class="text-center">${s.admissionCategory}</td>
      <td class="text-right">${formatCurrency(s.tTarget)}</td>
      <td class="text-right">${formatCurrency(s.tPaid)}</td>
      <td class="text-right">${formatCurrency(s.uTarget)}</td>
      <td class="text-right">${formatCurrency(s.uPaid)}</td>
      <td class="text-right">${formatCurrency(s.totalPaid)}</td>
      <td class="text-right">${formatCurrency(s.totalBalance)}</td>
    </tr>`).join('');

    const html = `<table><thead><tr>
      <th class="text-center">S.No</th><th>Hall Ticket</th><th>Name</th><th>Father</th>
      <th class="text-center">Dept</th><th class="text-center">Batch</th><th class="text-center">Entry</th><th class="text-center">Category</th>
      <th class="text-right">${FEE_LABELS.tTarget}</th><th class="text-right">${FEE_LABELS.tPaid}</th><th class="text-right">${FEE_LABELS.uTarget}</th><th class="text-right">${FEE_LABELS.uPaid}</th>
      <th class="text-right">Total Paid</th><th class="text-right">Balance</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row">
      <td colspan="8" class="text-right font-bold">GRAND TOTAL</td>
      <td class="text-right">${formatCurrency(totals.tTarget)}</td>
      <td class="text-right">${formatCurrency(totals.tPaid)}</td>
      <td class="text-right">${formatCurrency(totals.uTarget)}</td>
      <td class="text-right">${formatCurrency(totals.uPaid)}</td>
      <td class="text-right">${formatCurrency(totals.totalPaid)}</td>
      <td class="text-right">${formatCurrency(totals.totalBalance)}</td>
    </tr></tbody></table>`;

    exportPDF(`Dept Summary Students - ${row.courseType}(${row.code}) ${row.entryLabel || 'All'} ${bucket}`, html);
  };

  const getFinancialYearData = () => {
    const grouped: Record<string, {
      tuition: number; university: number; other: number; count: number;
      convAmount: number; mgmtAmount: number; tsmfcAmount: number; otherAmount: number;
      convStudents: Set<string>; mgmtStudents: Set<string>; tsmfcStudents: Set<string>; otherStudents: Set<string>;
    }> = {};
    students.forEach(s => {
      const bucket = getAdmissionCategoryBucket(s.admissionCategory);
      s.feeLockers.forEach(l => {
        l.transactions.filter(t => t.status === 'APPROVED').forEach(t => {
          const fy = t.financialYear || 'Unknown';
          if (!grouped[fy]) {
            grouped[fy] = {
              tuition: 0, university: 0, other: 0, count: 0,
              convAmount: 0, mgmtAmount: 0, tsmfcAmount: 0, otherAmount: 0,
              convStudents: new Set(), mgmtStudents: new Set(), tsmfcStudents: new Set(), otherStudents: new Set(),
            };
          }
          grouped[fy].count++;
          if (t.feeType === 'Tuition') grouped[fy].tuition += t.amount;
          else if (t.feeType === 'University') grouped[fy].university += t.amount;
          else grouped[fy].other += t.amount;

          if (bucket === 'CONV') {
            grouped[fy].convAmount += t.amount;
            grouped[fy].convStudents.add(s.hallTicketNumber);
          } else if (bucket === 'MGMT') {
            grouped[fy].mgmtAmount += t.amount;
            grouped[fy].mgmtStudents.add(s.hallTicketNumber);
          } else if (bucket === 'TSMFC') {
            grouped[fy].tsmfcAmount += t.amount;
            grouped[fy].tsmfcStudents.add(s.hallTicketNumber);
          } else {
            grouped[fy].otherAmount += t.amount;
            grouped[fy].otherStudents.add(s.hallTicketNumber);
          }
        });
      });
    });
    return Object.entries(grouped).map(([fy, data]) => ({
      financialYear: fy,
      tuition: data.tuition,
      university: data.university,
      other: data.other,
      count: data.count,
      total: data.tuition + data.university + data.other,
      convCount: data.convStudents.size,
      mgmtCount: data.mgmtStudents.size,
      tsmfcCount: data.tsmfcStudents.size,
      otherCount: data.otherStudents.size,
      convAmount: data.convAmount,
      mgmtAmount: data.mgmtAmount,
      tsmfcAmount: data.tsmfcAmount,
      otherAmount: data.otherAmount,
    })).sort((a, b) => a.financialYear.localeCompare(b.financialYear));
  };

  const getStudentsForFY = (fy: string) => {
    const studentMap: Record<string, { htn: string; name: string; department: string; batch: string; tuition: number; university: number; other: number; total: number; txCount: number }> = {};
    students.forEach(s => {
      s.feeLockers.forEach(l => {
        l.transactions.filter(t => t.status === 'APPROVED' && (t.financialYear || 'Unknown') === fy).forEach(t => {
          const key = s.hallTicketNumber;
          if (!studentMap[key]) {
            studentMap[key] = {
              htn: s.hallTicketNumber,
              name: s.name,
              department: (s.department || '').replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', ''),
              batch: getDisplayBatch(s) || '-',
              tuition: 0, university: 0, other: 0, total: 0, txCount: 0
            };
          }
          studentMap[key].txCount++;
          if (t.feeType === 'Tuition') studentMap[key].tuition += t.amount;
          else if (t.feeType === 'University') studentMap[key].university += t.amount;
          else studentMap[key].other += t.amount;
          studentMap[key].total += t.amount;
        });
      });
    });
    return Object.values(studentMap).sort((a, b) => a.htn.localeCompare(b.htn));
  };

  const getStudentsForBatch = (batch: string) => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    return students.filter(s => (getDisplayBatch(s) || 'Unknown') === batch).map(s => {
      const t = getStudentTargets(s, null, from, to);
      return {
        htn: s.hallTicketNumber,
        name: s.name,
        department: (s.department || '').replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', ''),
        batch: getDisplayBatch(s) || '-',
        totalTarget: t.tTarget + t.uTarget,
        totalPaid: t.tPaid + t.uPaid,
        balance: (t.tTarget + t.uTarget) - (t.tPaid + t.uPaid),
      };
    }).sort((a, b) => a.htn.localeCompare(b.htn));
  };

  const getBatchWiseData = () => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    const grouped: Record<string, Student[]> = {};
    students.forEach(s => {
      const b = getDisplayBatch(s) || 'Unknown';
      if (!grouped[b]) grouped[b] = [];
      grouped[b].push(s);
    });
    return Object.entries(grouped).map(([batch, batchStudents]) => {
      let totalTarget = 0, totalPaid = 0;
      let convCount = 0, mgmtCount = 0, tsmfcCount = 0, otherCount = 0;
      let convTPaid = 0, convUPaid = 0, mgmtTPaid = 0, mgmtUPaid = 0, tsmfcTPaid = 0, tsmfcUPaid = 0, otherTPaid = 0, otherUPaid = 0;
      batchStudents.forEach(s => {
        const t = getStudentTargets(s, null, from, to);
        totalTarget += t.tTarget + t.uTarget;
        totalPaid += t.tPaid + t.uPaid;
        const bucket = getAdmissionCategoryBucket(s.admissionCategory);
        if (bucket === 'CONV') {
          convCount += 1;
          convTPaid += t.tPaid;
          convUPaid += t.uPaid;
        } else if (bucket === 'MGMT') {
          mgmtCount += 1;
          mgmtTPaid += t.tPaid;
          mgmtUPaid += t.uPaid;
        } else if (bucket === 'TSMFC') {
          tsmfcCount += 1;
          tsmfcTPaid += t.tPaid;
          tsmfcUPaid += t.uPaid;
        } else {
          otherCount += 1;
          otherTPaid += t.tPaid;
          otherUPaid += t.uPaid;
        }
      });
      return {
        batch,
        count: batchStudents.length,
        totalTarget,
        totalPaid,
        balance: totalTarget - totalPaid,
        convCount,
        mgmtCount,
        tsmfcCount,
        otherCount,
        convTPaid,
        convUPaid,
        mgmtTPaid,
        mgmtUPaid,
        tsmfcTPaid,
        tsmfcUPaid,
        otherTPaid,
        otherUPaid,
      };
    }).sort((a, b) => a.batch.localeCompare(b.batch));
  };

  const getStudentMasterData = () => {
    let filtered = [...students];
    if (deptFilter !== 'all') {
      const filterDeptObj = reportDepartments.find(d => d.name === deptFilter);
      if (filterDeptObj) filtered = filtered.filter(s => studentMatchesReportDept(s, filterDeptObj));
      else filtered = filtered.filter(s => s.department === deptFilter);
    }
    if (batchFilter !== 'all') filtered = filtered.filter(s => getDisplayBatch(s) === batchFilter);
    if (categoryFilter !== 'all') filtered = filtered.filter(s => normalizeAdmissionCategory(s.admissionCategory) === categoryFilter);
    const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter);
    return filtered.map(s => {
      const t = getStudentTargets(s, filterYear);
      return { ...s, tTarget: t.tTarget, tPaid: t.tPaid, tBalance: t.tTarget - t.tPaid, uTarget: t.uTarget, uPaid: t.uPaid, uBalance: t.uTarget - t.uPaid, totalPaid: t.tPaid + t.uPaid, totalBalance: (t.tTarget + t.uTarget) - (t.tPaid + t.uPaid) };
    }).sort((a, b) => (a.hallTicketNumber || '').localeCompare(b.hallTicketNumber || ''));
  };

  const getStudentInfoData = () => {
    let filtered = [...students];
    if (deptFilter !== 'all') {
      const filterDeptObj = reportDepartments.find(d => d.name === deptFilter);
      if (filterDeptObj) filtered = filtered.filter(s => studentMatchesReportDept(s, filterDeptObj));
      else filtered = filtered.filter(s => s.department === deptFilter);
    }
    if (batchFilter !== 'all') filtered = filtered.filter(s => getDisplayBatch(s) === batchFilter);
    return filtered.sort((a, b) => (a.hallTicketNumber || '').localeCompare(b.hallTicketNumber || ''));
  };

  const getDefaultersData = () => {
    const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter);
    const filterDeptObj = deptFilter === 'all' ? null : reportDepartments.find(d => d.name === deptFilter);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    return students.filter(s => {
      if (batchFilter !== 'all' && getDisplayBatch(s) !== batchFilter) return false;
      if (filterDeptObj && !studentMatchesReportDept(s, filterDeptObj)) return false;
      const t = getStudentTargets(s, filterYear, from, to);
      const totalTarget = t.tTarget + t.uTarget;
      const totalPaid = t.tPaid + t.uPaid;
      return totalPaid < totalTarget;
    }).map(s => {
      const t = getStudentTargets(s, filterYear, from, to);
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
      convCount: acc.convCount + d.convCount, mgmtCount: acc.mgmtCount + d.mgmtCount,
      tsmfcCount: acc.tsmfcCount + d.tsmfcCount, otherCount: acc.otherCount + d.otherCount,
      convTPaid: acc.convTPaid + d.convTPaid, convUPaid: acc.convUPaid + d.convUPaid,
      mgmtTPaid: acc.mgmtTPaid + d.mgmtTPaid, mgmtUPaid: acc.mgmtUPaid + d.mgmtUPaid,
      tsmfcTPaid: acc.tsmfcTPaid + d.tsmfcTPaid, tsmfcUPaid: acc.tsmfcUPaid + d.tsmfcUPaid,
      otherTPaid: acc.otherTPaid + d.otherTPaid, otherUPaid: acc.otherUPaid + d.otherUPaid,
    }), {
      count: 0, tTarget: 0, tPaid: 0, uTarget: 0, uPaid: 0, totalReceived: 0, totalBalance: 0,
      convCount: 0, mgmtCount: 0, tsmfcCount: 0, otherCount: 0,
      convTPaid: 0, convUPaid: 0, mgmtTPaid: 0, mgmtUPaid: 0, tsmfcTPaid: 0, tsmfcUPaid: 0, otherTPaid: 0, otherUPaid: 0,
    });
    const rows = data.map(d => `<tr>
      <td class="font-bold">${d.courseType}(${d.code})</td>
      <td class="text-center">${d.count}</td>
      <td class="text-center">${d.convCount}</td>
      <td class="text-center">${d.mgmtCount}</td>
      <td class="text-center">${d.tsmfcCount}</td>
      <td class="text-center">${d.otherCount}</td>
      <td class="text-right">${formatCurrency(d.tTarget)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(d.tPaid)}</td>
      <td class="text-right">${formatCurrency(d.uTarget)}</td>
      <td class="text-right text-blue font-bold">${formatCurrency(d.uPaid)}</td>
      <td class="text-right">${formatCurrency(d.convTPaid)}</td>
      <td class="text-right">${formatCurrency(d.convUPaid)}</td>
      <td class="text-right">${formatCurrency(d.mgmtTPaid)}</td>
      <td class="text-right">${formatCurrency(d.mgmtUPaid)}</td>
      <td class="text-right">${formatCurrency(d.tsmfcTPaid)}</td>
      <td class="text-right">${formatCurrency(d.tsmfcUPaid)}</td>
      <td class="text-right">${formatCurrency(d.otherTPaid)}</td>
      <td class="text-right">${formatCurrency(d.otherUPaid)}</td>
      <td class="text-right text-green font-bold">${formatCurrency(d.totalReceived)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(d.totalBalance)}</td>
    </tr>`).join('');
    const html = `<table><thead><tr>
      <th>Department</th><th class="text-center">Students</th>
      <th class="text-center">Conv</th><th class="text-center">Mgmt</th><th class="text-center">TSMFC</th><th class="text-center">Other</th>
      <th class="text-right">${FEE_LABELS.tTarget}</th><th class="text-right">${FEE_LABELS.tPaid}</th>
      <th class="text-right">${FEE_LABELS.uTarget}</th><th class="text-right">${FEE_LABELS.uPaid}</th>
      <th class="text-right">${FEE_LABELS.convT}</th><th class="text-right">${FEE_LABELS.convU}</th>
      <th class="text-right">${FEE_LABELS.mgmtT}</th><th class="text-right">${FEE_LABELS.mgmtU}</th>
      <th class="text-right">${FEE_LABELS.tsmfcT}</th><th class="text-right">${FEE_LABELS.tsmfcU}</th>
      <th class="text-right">${FEE_LABELS.otherT}</th><th class="text-right">${FEE_LABELS.otherU}</th>
      <th class="text-right">Total Received</th><th class="text-right">Total Balance</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row">
      <td>GRAND TOTAL</td><td class="text-center">${total.count}</td>
      <td class="text-center">${total.convCount}</td><td class="text-center">${total.mgmtCount}</td><td class="text-center">${total.tsmfcCount}</td><td class="text-center">${total.otherCount}</td>
      <td class="text-right">${formatCurrency(total.tTarget)}</td><td class="text-right">${formatCurrency(total.tPaid)}</td>
      <td class="text-right">${formatCurrency(total.uTarget)}</td><td class="text-right">${formatCurrency(total.uPaid)}</td>
      <td class="text-right">${formatCurrency(total.convTPaid)}</td><td class="text-right">${formatCurrency(total.convUPaid)}</td>
      <td class="text-right">${formatCurrency(total.mgmtTPaid)}</td><td class="text-right">${formatCurrency(total.mgmtUPaid)}</td>
      <td class="text-right">${formatCurrency(total.tsmfcTPaid)}</td><td class="text-right">${formatCurrency(total.tsmfcUPaid)}</td>
      <td class="text-right">${formatCurrency(total.otherTPaid)}</td><td class="text-right">${formatCurrency(total.otherUPaid)}</td>
      <td class="text-right">${formatCurrency(total.totalReceived)}</td><td class="text-right">${formatCurrency(total.totalBalance)}</td>
    </tr></tbody></table>`;
    exportPDF(`Dept Summary Report${yearFilter !== 'all' ? ` - Year ${yearFilter}` : ' - All Years'}`, html);
  };

  const handleExportFinYear = () => {
    const data = getFinancialYearData();
    const total = data.reduce((acc, d) => ({
      tuition: acc.tuition + d.tuition, university: acc.university + d.university,
      other: acc.other + d.other, count: acc.count + d.count, total: acc.total + d.total,
      convCount: acc.convCount + d.convCount, mgmtCount: acc.mgmtCount + d.mgmtCount,
      tsmfcCount: acc.tsmfcCount + d.tsmfcCount, otherCount: acc.otherCount + d.otherCount,
      convAmount: acc.convAmount + d.convAmount, mgmtAmount: acc.mgmtAmount + d.mgmtAmount,
      tsmfcAmount: acc.tsmfcAmount + d.tsmfcAmount, otherAmount: acc.otherAmount + d.otherAmount,
    }), {
      tuition: 0, university: 0, other: 0, count: 0, total: 0,
      convCount: 0, mgmtCount: 0, tsmfcCount: 0, otherCount: 0,
      convAmount: 0, mgmtAmount: 0, tsmfcAmount: 0, otherAmount: 0,
    });
    const rows = data.map(d => `<tr>
      <td class="font-bold">${d.financialYear}</td>
      <td class="text-center">${d.count}</td>
      <td class="text-center">${d.convCount}</td>
      <td class="text-center">${d.mgmtCount}</td>
      <td class="text-center">${d.tsmfcCount}</td>
      <td class="text-center">${d.otherCount}</td>
      <td class="text-right">${formatCurrency(d.tuition)}</td>
      <td class="text-right">${formatCurrency(d.university)}</td>
      <td class="text-right">${formatCurrency(d.other)}</td>
      <td class="text-right">${formatCurrency(d.convAmount)}</td>
      <td class="text-right">${formatCurrency(d.mgmtAmount)}</td>
      <td class="text-right">${formatCurrency(d.tsmfcAmount)}</td>
      <td class="text-right">${formatCurrency(d.otherAmount)}</td>
      <td class="text-right font-bold text-green">${formatCurrency(d.total)}</td>
    </tr>`).join('');
    const html = `<table><thead><tr>
      <th>Financial Year</th><th class="text-center">Transactions</th>
      <th class="text-center">Conv</th><th class="text-center">Mgmt</th><th class="text-center">TSMFC</th><th class="text-center">Other</th>
      <th class="text-right">${FEE_LABELS.tuition}</th><th class="text-right">${FEE_LABELS.ou}</th>
      <th class="text-right">Other</th>
      <th class="text-right">Conv Amt</th><th class="text-right">Mgmt Amt</th><th class="text-right">TSMFC Amt</th><th class="text-right">Other Amt</th>
      <th class="text-right">Total</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row"><td>GRAND TOTAL</td><td class="text-center">${total.count}</td>
      <td class="text-center">${total.convCount}</td><td class="text-center">${total.mgmtCount}</td><td class="text-center">${total.tsmfcCount}</td><td class="text-center">${total.otherCount}</td>
      <td class="text-right">${formatCurrency(total.tuition)}</td><td class="text-right">${formatCurrency(total.university)}</td>
      <td class="text-right">${formatCurrency(total.other)}</td>
      <td class="text-right">${formatCurrency(total.convAmount)}</td><td class="text-right">${formatCurrency(total.mgmtAmount)}</td><td class="text-right">${formatCurrency(total.tsmfcAmount)}</td><td class="text-right">${formatCurrency(total.otherAmount)}</td>
      <td class="text-right">${formatCurrency(total.total)}</td>
    </tr></tbody></table>`;
    exportPDF('Financial Year Wise Report', html);
  };

  const handleExportBatchWise = () => {
    const data = getBatchWiseData();
    const total = data.reduce((acc, d) => ({
      count: acc.count + d.count, totalTarget: acc.totalTarget + d.totalTarget,
      totalPaid: acc.totalPaid + d.totalPaid, balance: acc.balance + d.balance,
      convCount: acc.convCount + d.convCount, mgmtCount: acc.mgmtCount + d.mgmtCount,
      tsmfcCount: acc.tsmfcCount + d.tsmfcCount, otherCount: acc.otherCount + d.otherCount,
      convTPaid: acc.convTPaid + d.convTPaid, convUPaid: acc.convUPaid + d.convUPaid,
      mgmtTPaid: acc.mgmtTPaid + d.mgmtTPaid, mgmtUPaid: acc.mgmtUPaid + d.mgmtUPaid,
      tsmfcTPaid: acc.tsmfcTPaid + d.tsmfcTPaid, tsmfcUPaid: acc.tsmfcUPaid + d.tsmfcUPaid,
      otherTPaid: acc.otherTPaid + d.otherTPaid, otherUPaid: acc.otherUPaid + d.otherUPaid,
    }), {
      count: 0, totalTarget: 0, totalPaid: 0, balance: 0,
      convCount: 0, mgmtCount: 0, tsmfcCount: 0, otherCount: 0,
      convTPaid: 0, convUPaid: 0, mgmtTPaid: 0, mgmtUPaid: 0, tsmfcTPaid: 0, tsmfcUPaid: 0, otherTPaid: 0, otherUPaid: 0,
    });
    const rows = data.map(d => `<tr>
      <td class="font-bold">${d.batch}</td>
      <td class="text-center">${d.count}</td>
      <td class="text-center">${d.convCount}</td>
      <td class="text-center">${d.mgmtCount}</td>
      <td class="text-center">${d.tsmfcCount}</td>
      <td class="text-center">${d.otherCount}</td>
      <td class="text-right">${formatCurrency(d.totalTarget)}</td>
      <td class="text-right text-green font-bold">${formatCurrency(d.totalPaid)}</td>
      <td class="text-right">${formatCurrency(d.convTPaid)}</td>
      <td class="text-right">${formatCurrency(d.convUPaid)}</td>
      <td class="text-right">${formatCurrency(d.mgmtTPaid)}</td>
      <td class="text-right">${formatCurrency(d.mgmtUPaid)}</td>
      <td class="text-right">${formatCurrency(d.tsmfcTPaid)}</td>
      <td class="text-right">${formatCurrency(d.tsmfcUPaid)}</td>
      <td class="text-right">${formatCurrency(d.otherTPaid)}</td>
      <td class="text-right">${formatCurrency(d.otherUPaid)}</td>
      <td class="text-right text-red font-bold">${formatCurrency(d.balance)}</td>
    </tr>`).join('');
    const html = `<table><thead><tr>
      <th>Batch</th><th class="text-center">Students</th>
      <th class="text-center">Conv</th><th class="text-center">Mgmt</th><th class="text-center">TSMFC</th><th class="text-center">Other</th>
      <th class="text-right">Total Target</th><th class="text-right">Total Paid</th>
      <th class="text-right">${FEE_LABELS.convT}</th><th class="text-right">${FEE_LABELS.convU}</th>
      <th class="text-right">${FEE_LABELS.mgmtT}</th><th class="text-right">${FEE_LABELS.mgmtU}</th>
      <th class="text-right">${FEE_LABELS.tsmfcT}</th><th class="text-right">${FEE_LABELS.tsmfcU}</th>
      <th class="text-right">${FEE_LABELS.otherT}</th><th class="text-right">${FEE_LABELS.otherU}</th>
      <th class="text-right">Balance</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row"><td>GRAND TOTAL</td><td class="text-center">${total.count}</td>
      <td class="text-center">${total.convCount}</td><td class="text-center">${total.mgmtCount}</td><td class="text-center">${total.tsmfcCount}</td><td class="text-center">${total.otherCount}</td>
      <td class="text-right">${formatCurrency(total.totalTarget)}</td><td class="text-right">${formatCurrency(total.totalPaid)}</td>
      <td class="text-right">${formatCurrency(total.convTPaid)}</td><td class="text-right">${formatCurrency(total.convUPaid)}</td>
      <td class="text-right">${formatCurrency(total.mgmtTPaid)}</td><td class="text-right">${formatCurrency(total.mgmtUPaid)}</td>
      <td class="text-right">${formatCurrency(total.tsmfcTPaid)}</td><td class="text-right">${formatCurrency(total.tsmfcUPaid)}</td>
      <td class="text-right">${formatCurrency(total.otherTPaid)}</td><td class="text-right">${formatCurrency(total.otherUPaid)}</td>
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
      <th class="text-right">${FEE_LABELS.tTarget}</th><th class="text-right">${FEE_LABELS.tPaid}</th><th class="text-right">${FEE_LABELS.tBalance}</th>
      <th class="text-right">${FEE_LABELS.uTarget}</th><th class="text-right">${FEE_LABELS.uPaid}</th><th class="text-right">${FEE_LABELS.uBalance}</th>
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
      <td class="text-center">${getDisplayBatch(s) || '-'}</td>
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
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
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
        const t = getStudentTargets(s, fy, from, to);
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

    reportDepartments.forEach(dept => {
      let deptStudents = students.filter(s => studentMatchesReportDept(s, dept));
      if (batchFilter !== 'all') deptStudents = deptStudents.filter(s => getDisplayBatch(s) === batchFilter);
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
      <th class="text-center">Students</th><th class="text-right">Actual Fee</th><th class="text-right">${FEE_LABELS.tPaid}</th><th class="text-right">${FEE_LABELS.uPaid}</th><th class="text-right">Due</th>
      <th class="text-center">Students</th><th class="text-right">Actual Fee</th><th class="text-right">${FEE_LABELS.tPaid}</th><th class="text-right">${FEE_LABELS.uPaid}</th><th class="text-right">Due</th>
      <th class="text-center">Students</th><th class="text-right">Actual Fee</th><th class="text-right">${FEE_LABELS.tPaid}</th><th class="text-right">${FEE_LABELS.uPaid}</th><th class="text-right">Due</th>
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

  type CategoryAnalysisRow = {
    department: string;
    code: string;
    courseType: string;
    entryLabel: string;
    tsmfcCount: number; tsmfcTarget: number; tsmfcTuiPaid: number; tsmfcUniPaid: number; tsmfcBalance: number;
    mgmtCount: number; mgmtTarget: number; mgmtTuiPaid: number; mgmtUniPaid: number; mgmtBalance: number;
    convCount: number; convTarget: number; convTuiPaid: number; convUniPaid: number; convBalance: number;
    totalCount: number;
  };

  const getCategoryAnalysisRowKey = (row: CategoryAnalysisRow) =>
    [row.courseType, row.code, row.entryLabel || 'ALL'].join('|');

  const getCategoryAnalysisDetailStudents = (
    row: CategoryAnalysisRow,
    bucket: 'TSMFC' | 'MGMT' | 'CONV'
  ) => {
    const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    const dept = reportDepartments.find(d => d.code === row.code && d.courseType === row.courseType);
    if (!dept) return [];

    return students
      .filter(s => {
        if (!studentMatchesReportDept(s, dept)) return false;
        if (batchFilter !== 'all' && getDisplayBatch(s) !== batchFilter) return false;
        if (row.entryLabel === 'Regular' && s.entryType === 'LATERAL') return false;
        if (row.entryLabel === 'Lateral' && s.entryType !== 'LATERAL') return false;
        const studentBucket = getAdmissionCategoryBucket(s.admissionCategory);
        return studentBucket === bucket;
      })
      .map(s => {
        const t = getStudentTargets(s, filterYear, from, to);
        return {
          hallTicketNumber: s.hallTicketNumber,
          name: s.name,
          fatherName: s.fatherName,
          department: (s.department || '').replace('B.E(', '').replace('M.E(', '').replace('M.E ', '').replace(')', ''),
          batch: getDisplayBatch(s) || '-',
          entryType: s.entryType === 'LATERAL' ? 'L.E' : 'R',
          admissionCategory: normalizeAdmissionCategory(s.admissionCategory) || '-',
          tTarget: t.tTarget,
          tPaid: t.tPaid,
          uTarget: t.uTarget,
          uPaid: t.uPaid,
          totalPaid: t.tPaid + t.uPaid,
          totalBalance: (t.tTarget + t.uTarget) - (t.tPaid + t.uPaid),
        };
      })
      .sort((a, b) => a.hallTicketNumber.localeCompare(b.hallTicketNumber));
  };

  const exportCategoryAnalysisDetailPDF = (
    row: CategoryAnalysisRow,
    bucket: 'TSMFC' | 'MGMT' | 'CONV'
  ) => {
    const detailStudents = getCategoryAnalysisDetailStudents(row, bucket);
    const totals = detailStudents.reduce((acc, s) => ({
      tTarget: acc.tTarget + s.tTarget,
      tPaid: acc.tPaid + s.tPaid,
      uTarget: acc.uTarget + s.uTarget,
      uPaid: acc.uPaid + s.uPaid,
      totalPaid: acc.totalPaid + s.totalPaid,
      totalBalance: acc.totalBalance + s.totalBalance,
    }), { tTarget: 0, tPaid: 0, uTarget: 0, uPaid: 0, totalPaid: 0, totalBalance: 0 });

    const rows = detailStudents.map((s, idx) => `<tr>
      <td class="text-center">${idx + 1}</td>
      <td>${s.hallTicketNumber}</td>
      <td>${s.name}</td>
      <td>${s.fatherName || '-'}</td>
      <td class="text-center">${s.department}</td>
      <td class="text-center">${s.batch}</td>
      <td class="text-center">${s.entryType}</td>
      <td class="text-center">${s.admissionCategory}</td>
      <td class="text-right">${formatCurrency(s.tTarget)}</td>
      <td class="text-right">${formatCurrency(s.tPaid)}</td>
      <td class="text-right">${formatCurrency(s.uTarget)}</td>
      <td class="text-right">${formatCurrency(s.uPaid)}</td>
      <td class="text-right">${formatCurrency(s.totalPaid)}</td>
      <td class="text-right">${formatCurrency(s.totalBalance)}</td>
    </tr>`).join('');

    const html = `<table><thead><tr>
      <th class="text-center">S.No</th><th>Hall Ticket</th><th>Name</th><th>Father</th>
      <th class="text-center">Dept</th><th class="text-center">Batch</th><th class="text-center">Entry</th><th class="text-center">Category</th>
      <th class="text-right">${FEE_LABELS.tTarget}</th><th class="text-right">${FEE_LABELS.tPaid}</th><th class="text-right">${FEE_LABELS.uTarget}</th><th class="text-right">${FEE_LABELS.uPaid}</th>
      <th class="text-right">Total Paid</th><th class="text-right">Balance</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row">
      <td colspan="8" class="text-right font-bold">GRAND TOTAL</td>
      <td class="text-right">${formatCurrency(totals.tTarget)}</td>
      <td class="text-right">${formatCurrency(totals.tPaid)}</td>
      <td class="text-right">${formatCurrency(totals.uTarget)}</td>
      <td class="text-right">${formatCurrency(totals.uPaid)}</td>
      <td class="text-right">${formatCurrency(totals.totalPaid)}</td>
      <td class="text-right">${formatCurrency(totals.totalBalance)}</td>
    </tr></tbody></table>`;

    exportPDF(`Category Analysis Students - ${row.courseType}(${row.code}) ${row.entryLabel || 'All'} ${bucket}`, html);
  };

  const getDateRangeData = () => {
    const filterYear = drYearFilter === 'all' ? null : parseInt(drYearFilter);
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;

    return reportDepartments
      .filter(dept => drDeptFilter === 'all' || dept.code === drDeptFilter)
      .map(dept => {
        let deptStudents = students.filter(s => studentMatchesReportDept(s, dept));
        if (drBatchFilter !== 'all') deptStudents = deptStudents.filter(s => getDisplayBatch(s) === drBatchFilter);

        const results = deptStudents.map(s => {
          const d = reportDepartments.find(dd => studentMatchesReportDept(s, dd));
          const duration = d?.duration || (getStudentCourseType(s) === 'M.E' ? 2 : 4);
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
              const txDate = parsePaymentDate(t.paymentDate);
              const inRange = txDate ? ((!from || txDate >= from) && (!to || txDate <= to)) : false;
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
      <th class="text-right">Actual Fee</th><th class="text-right">Collected</th><th class="text-right">Due</th>
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
              {reportDepartments.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Batch</label>
            <select value={drBatchFilter} onChange={e => setDrBatchFilter(e.target.value)} className={selectClass}>
              <option value="all">All Batches</option>
              {batchOptions.map(b => <option key={b.value} value={b.value}>{b.value} ({b.count})</option>)}
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
            <p className="text-xs text-red-500 font-medium">Total Due</p>
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
                <th className={thClass + ' text-right'}>Due</th>
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

  const getAcademicYearOptions = () => {
    const startYears = students.map(s => parseInt((getDisplayBatch(s) || '').split('-')[0])).filter(y => !isNaN(y));
    const minYear = Math.min(...startYears);
    const maxYear = Math.max(...startYears);
    const options: string[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      options.push(`${y}-${String(y + 1).slice(2)}`);
    }
    return options;
  };

  const getAcademicYearData = () => {
    const ayStartYear = parseInt(ayFilter.split('-')[0]);

    type CategorySplit = {
      convCount: number;
      mgmtCount: number;
      tsmfcCount: number;
      otherCount: number;
      convTPaid: number;
      convUPaid: number;
      mgmtTPaid: number;
      mgmtUPaid: number;
      tsmfcTPaid: number;
      tsmfcUPaid: number;
      otherTPaid: number;
      otherUPaid: number;
    };

    type AYRow = {
      deptName: string;
      deptCode: string;
      courseType: string;
      studyYear: number;
      batch: string;
      entryLabel: string;
      count: number;
      tTarget: number;
      uTarget: number;
      tPaid: number;
      uPaid: number;
      totalReceived: number;
      totalBalance: number;
    } & CategorySplit;

    const getCategorySplit = (subset: Student[]): CategorySplit => {
      const split: CategorySplit = {
        convCount: 0, mgmtCount: 0, tsmfcCount: 0, otherCount: 0,
        convTPaid: 0, convUPaid: 0, mgmtTPaid: 0, mgmtUPaid: 0,
        tsmfcTPaid: 0, tsmfcUPaid: 0, otherTPaid: 0, otherUPaid: 0,
      };
      subset.forEach(s => {
        const totals = getStudentTargets(s, null);
        if (isConvenorCategory(s.admissionCategory)) {
          split.convCount += 1;
          split.convTPaid += totals.tPaid;
          split.convUPaid += totals.uPaid;
        } else if (isManagementCategory(s.admissionCategory)) {
          split.mgmtCount += 1;
          split.mgmtTPaid += totals.tPaid;
          split.mgmtUPaid += totals.uPaid;
        } else if (isTSMFCCategory(s.admissionCategory)) {
          split.tsmfcCount += 1;
          split.tsmfcTPaid += totals.tPaid;
          split.tsmfcUPaid += totals.uPaid;
        } else {
          split.otherCount += 1;
          split.otherTPaid += totals.tPaid;
          split.otherUPaid += totals.uPaid;
        }
      });
      return split;
    };

    const rows: AYRow[] = [];
    const beDepts = reportDepartments.filter(d => d.courseType === 'B.E');
    const meDepts = reportDepartments.filter(d => d.courseType === 'M.E');

    const processGroup = (dept: typeof departments[0], studyYear: number, maxYears: number) => {
      const regularStudents = students.filter(s =>
        studentMatchesReportDept(s, dept) &&
        s.entryType !== 'LATERAL' &&
        getAcademicStudyYear(s, ayStartYear, maxYears) === studyYear
      );
      const lateralStudents = students.filter(s =>
        studentMatchesReportDept(s, dept) &&
        s.entryType === 'LATERAL' &&
        getAcademicStudyYear(s, ayStartYear, maxYears) === studyYear
      );

      const calcRow = (subset: Student[], label: string) => {
        let tTarget = 0, uTarget = 0, tPaid = 0, uPaid = 0;
        const batchLabel = subset.length > 0
          ? getDisplayBatch(subset[0])
          : '-';
        const categorySplit = getCategorySplit(subset);
        subset.forEach(s => {
          const totals = getStudentTargets(s, null);
          tTarget += totals.tTarget;
          uTarget += totals.uTarget;
          tPaid += totals.tPaid;
          uPaid += totals.uPaid;
        });
        rows.push({
          deptName: dept.name, deptCode: dept.code, courseType: dept.courseType,
          studyYear, batch: batchLabel, entryLabel: label,
          count: subset.length, tTarget, uTarget, tPaid, uPaid,
          totalReceived: tPaid + uPaid, totalBalance: (tTarget + uTarget) - (tPaid + uPaid),
          ...categorySplit,
        });
      };

      if (dept.courseType === 'B.E') {
        calcRow(regularStudents, 'Regular');
        if (studyYear > 1) {
          calcRow(lateralStudents, 'Lateral');
        }
      } else {
        calcRow(regularStudents, '');
      }
    };

    beDepts.forEach(dept => {
      for (let sy = 1; sy <= 4; sy++) {
        processGroup(dept, sy, 4);
      }
    });

    meDepts.forEach(dept => {
      for (let sy = 1; sy <= 2; sy++) {
        processGroup(dept, sy, 2);
      }
    });

    return rows;
  };

  const getHistoricalAcademicYearData = () => {
    const ayStartYear = parseInt(ayFilter.split('-')[0]);
    const rows: {
      deptName: string;
      deptCode: string;
      courseType: string;
      batch: string;
      entryLabel: string;
      count: number;
      tTarget: number;
      uTarget: number;
      tPaid: number;
      uPaid: number;
      totalReceived: number;
      totalBalance: number;
      convCount: number;
      mgmtCount: number;
      tsmfcCount: number;
      otherCount: number;
      convTPaid: number;
      convUPaid: number;
      mgmtTPaid: number;
      mgmtUPaid: number;
      tsmfcTPaid: number;
      tsmfcUPaid: number;
      otherTPaid: number;
      otherUPaid: number;
    }[] = [];

    reportDepartments.forEach(dept => {
      const maxYears = dept.courseType === 'B.E' ? 4 : 2;
      const matchingStudents = students.filter(s => {
        if (!studentMatchesReportDept(s, dept)) return false;
        return isHistoricalForAcademicYear(s, ayStartYear, maxYears);
      });

      const pushRow = (subset: Student[], entryLabel: string) => {
        if (subset.length === 0) return;
        let tTarget = 0, uTarget = 0, tPaid = 0, uPaid = 0;
        let convCount = 0, mgmtCount = 0, tsmfcCount = 0, otherCount = 0;
        let convTPaid = 0, convUPaid = 0, mgmtTPaid = 0, mgmtUPaid = 0;
        let tsmfcTPaid = 0, tsmfcUPaid = 0, otherTPaid = 0, otherUPaid = 0;
        subset.forEach(s => {
          const totals = getStudentTargets(s, null);
          tTarget += totals.tTarget;
          uTarget += totals.uTarget;
          tPaid += totals.tPaid;
          uPaid += totals.uPaid;
          if (isConvenorCategory(s.admissionCategory)) {
            convCount += 1;
            convTPaid += totals.tPaid;
            convUPaid += totals.uPaid;
          } else if (isManagementCategory(s.admissionCategory)) {
            mgmtCount += 1;
            mgmtTPaid += totals.tPaid;
            mgmtUPaid += totals.uPaid;
          } else if (isTSMFCCategory(s.admissionCategory)) {
            tsmfcCount += 1;
            tsmfcTPaid += totals.tPaid;
            tsmfcUPaid += totals.uPaid;
          } else {
            otherCount += 1;
            otherTPaid += totals.tPaid;
            otherUPaid += totals.uPaid;
          }
        });
        rows.push({
          deptName: dept.name,
          deptCode: dept.code,
          courseType: dept.courseType,
          batch: getDisplayBatch(subset[0]) || '-',
          entryLabel,
          count: subset.length,
          tTarget,
          uTarget,
          tPaid,
          uPaid,
          totalReceived: tPaid + uPaid,
          totalBalance: (tTarget + uTarget) - (tPaid + uPaid),
          convCount,
          mgmtCount,
          tsmfcCount,
          otherCount,
          convTPaid,
          convUPaid,
          mgmtTPaid,
          mgmtUPaid,
          tsmfcTPaid,
          tsmfcUPaid,
          otherTPaid,
          otherUPaid,
        });
      };

      if (dept.courseType === 'B.E') {
        const regularStudents = matchingStudents.filter(s => s.entryType !== 'LATERAL');
        const lateralStudents = matchingStudents.filter(s => s.entryType === 'LATERAL');
        const regularByBatch = Array.from(new Set(regularStudents.map(s => getDisplayBatch(s)).filter(Boolean)));
        const lateralByBatch = Array.from(new Set(lateralStudents.map(s => getDisplayBatch(s)).filter(Boolean)));
        regularByBatch.forEach(batch => pushRow(regularStudents.filter(s => getDisplayBatch(s) === batch), 'Regular'));
        lateralByBatch.forEach(batch => pushRow(lateralStudents.filter(s => getDisplayBatch(s) === batch), 'Lateral'));
      } else {
        const byBatch = Array.from(new Set(matchingStudents.map(s => getDisplayBatch(s)).filter(Boolean)));
        byBatch.forEach(batch => pushRow(matchingStudents.filter(s => getDisplayBatch(s) === batch), ''));
      }
    });

    return rows;
  };

  const getAcademicYearCountData = () => {
    const ayStartYear = parseInt(ayFilter.split('-')[0]);
    const rows: {
      deptName: string;
      deptCode: string;
      courseType: string;
      studyYear: number;
      batch: string;
      entryLabel: string;
      count: number;
      convCount: number;
      mgmtCount: number;
      tsmfcCount: number;
      otherCount: number;
    }[] = [];

    const processRow = (dept: typeof departments[0], studyYear: number, batchStartYear: number, maxYears: number, studentsSubset: Student[], entryLabel: string) => {
      if (studentsSubset.length === 0) return;
      const convCount = studentsSubset.filter(s => getAdmissionCategoryBucket(s.admissionCategory) === 'CONV').length;
      const mgmtCount = studentsSubset.filter(s => getAdmissionCategoryBucket(s.admissionCategory) === 'MGMT').length;
      const tsmfcCount = studentsSubset.filter(s => getAdmissionCategoryBucket(s.admissionCategory) === 'TSMFC').length;
      const otherCount = studentsSubset.length - convCount - mgmtCount - tsmfcCount;
      rows.push({
        deptName: dept.name,
        deptCode: dept.code,
        courseType: dept.courseType,
        studyYear,
        batch: getDisplayBatch(studentsSubset[0]) || `${batchStartYear}-${batchStartYear + maxYears}`,
        entryLabel,
        count: studentsSubset.length,
        convCount,
        mgmtCount,
        tsmfcCount,
        otherCount,
      });
    };

    reportDepartments.filter(d => d.courseType === 'B.E').forEach(dept => {
      for (let sy = 1; sy <= 4; sy++) {
        const regularStudents = students.filter(s =>
          studentMatchesReportDept(s, dept) &&
          s.entryType !== 'LATERAL' &&
          getAcademicStudyYear(s, ayStartYear, 4) === sy
        );
        const lateralStudents = students.filter(s =>
          studentMatchesReportDept(s, dept) &&
          s.entryType === 'LATERAL' &&
          getAcademicStudyYear(s, ayStartYear, 4) === sy
        );
        processRow(dept, sy, ayStartYear, 4, regularStudents, 'Regular');
        if (sy > 1) {
          processRow(dept, sy, ayStartYear, 4, lateralStudents, 'Lateral');
        }
      }
    });

    reportDepartments.filter(d => d.courseType === 'M.E').forEach(dept => {
      for (let sy = 1; sy <= 2; sy++) {
        const matchingStudents = students.filter(s =>
          studentMatchesReportDept(s, dept) &&
          getAcademicStudyYear(s, ayStartYear, 2) === sy
        );
        processRow(dept, sy, ayStartYear, 2, matchingStudents, '');
      }
    });

    return rows;
  };

  type AcademicYearDetailRow = {
    deptName: string;
    deptCode: string;
    courseType: string;
    studyYear?: number;
    batch: string;
    entryLabel: string;
  };

  const getAcademicYearDetailStudents = (row: AcademicYearDetailRow, categoryBucket: 'ALL' | 'CONV' | 'MGMT' | 'TSMFC' | 'OTHER' = 'ALL') => {
    const ayStartYear = parseInt(ayFilter.split('-')[0]);
    const dept = reportDepartments.find(d => d.code === row.deptCode && d.courseType === row.courseType);
    if (!dept) return [];

    const filteredStudents = students.filter(s => {
      if (!studentMatchesReportDept(s, dept)) return false;
      if ((getDisplayBatch(s) || '-') !== row.batch) return false;
      if (row.entryLabel === 'Regular' && s.entryType === 'LATERAL') return false;
      if (row.entryLabel === 'Lateral' && s.entryType !== 'LATERAL') return false;
      if (categoryBucket !== 'ALL' && getAdmissionCategoryBucket(s.admissionCategory) !== categoryBucket) return false;
      if (typeof row.studyYear === 'number') {
        return getAcademicStudyYear(s, ayStartYear, dept.courseType === 'B.E' ? 4 : 2) === row.studyYear;
      }
      return isHistoricalForAcademicYear(s, ayStartYear, dept.courseType === 'B.E' ? 4 : 2);
    });

    return filteredStudents
      .map(s => {
        const totals = getStudentTargets(s, null);
        return {
          hallTicketNumber: s.hallTicketNumber,
          name: s.name,
          fatherName: s.fatherName,
          admissionCategory: normalizeAdmissionCategory(s.admissionCategory) || '-',
          batch: getDisplayBatch(s) || '-',
          entryType: s.entryType === 'LATERAL' ? 'L.E' : 'R',
          tTarget: totals.tTarget,
          tPaid: totals.tPaid,
          uTarget: totals.uTarget,
          uPaid: totals.uPaid,
          totalPaid: totals.tPaid + totals.uPaid,
          totalBalance: (totals.tTarget + totals.uTarget) - (totals.tPaid + totals.uPaid),
        };
      })
      .sort((a, b) => a.hallTicketNumber.localeCompare(b.hallTicketNumber));
  };

  const exportAcademicYearDetailPDF = (row: AcademicYearDetailRow) => {
    const detailStudents = getAcademicYearDetailStudents(row, selectedAyDetailCategory);
    const totals = detailStudents.reduce((acc, s) => ({
      tTarget: acc.tTarget + s.tTarget,
      tPaid: acc.tPaid + s.tPaid,
      uTarget: acc.uTarget + s.uTarget,
      uPaid: acc.uPaid + s.uPaid,
      totalPaid: acc.totalPaid + s.totalPaid,
      totalBalance: acc.totalBalance + s.totalBalance,
    }), { tTarget: 0, tPaid: 0, uTarget: 0, uPaid: 0, totalPaid: 0, totalBalance: 0 });

    const rows = detailStudents.map((s, idx) => `<tr>
      <td class="text-center">${idx + 1}</td>
      <td>${s.hallTicketNumber}</td>
      <td>${s.name}</td>
      <td>${s.fatherName || '-'}</td>
      <td class="text-center">${s.entryType}</td>
      <td class="text-center">${s.batch}</td>
      <td class="text-center">${s.admissionCategory}</td>
      <td class="text-right">${formatCurrency(s.tTarget)}</td>
      <td class="text-right">${formatCurrency(s.tPaid)}</td>
      <td class="text-right">${formatCurrency(s.uTarget)}</td>
      <td class="text-right">${formatCurrency(s.uPaid)}</td>
      <td class="text-right">${formatCurrency(s.totalPaid)}</td>
      <td class="text-right">${formatCurrency(s.totalBalance)}</td>
    </tr>`).join('');

    const html = `<table><thead><tr>
      <th class="text-center">S.No</th><th>Hall Ticket</th><th>Name</th><th>Father</th>
      <th class="text-center">Entry</th><th class="text-center">Batch</th><th class="text-center">Category</th>
      <th class="text-right">${FEE_LABELS.tTarget}</th><th class="text-right">${FEE_LABELS.tPaid}</th>
      <th class="text-right">${FEE_LABELS.uTarget}</th><th class="text-right">${FEE_LABELS.uPaid}</th>
      <th class="text-right">Total Paid</th><th class="text-right">Balance</th>
    </tr></thead><tbody>${rows}
    <tr class="summary-row">
      <td colspan="7" class="text-right font-bold">GRAND TOTAL</td>
      <td class="text-right">${formatCurrency(totals.tTarget)}</td>
      <td class="text-right">${formatCurrency(totals.tPaid)}</td>
      <td class="text-right">${formatCurrency(totals.uTarget)}</td>
      <td class="text-right">${formatCurrency(totals.uPaid)}</td>
      <td class="text-right">${formatCurrency(totals.totalPaid)}</td>
      <td class="text-right">${formatCurrency(totals.totalBalance)}</td>
    </tr></tbody></table>`;

    const studyYearLabel = typeof row.studyYear === 'number' ? `Y${row.studyYear}` : 'Historical';
    const categoryLabel = selectedAyDetailCategory === 'ALL' ? '' : ` ${selectedAyDetailCategory}`;
    exportPDF(`Academic Year Students - ${row.courseType}-${row.deptCode} ${studyYearLabel} ${row.batch} ${row.entryLabel || ''}${categoryLabel}`.trim(), html);
  };

  const renderAcademicYear = () => {
    const ayData = getAcademicYearData();
    const historicalData = getHistoricalAcademicYearData();
    const ayOptions = getAcademicYearOptions();
    const beDepts = reportDepartments.filter(d => d.courseType === 'B.E');
    const meDepts = reportDepartments.filter(d => d.courseType === 'M.E');
    const ayStartYear = parseInt(ayFilter.split('-')[0]);

    const thClass = 'px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-center whitespace-nowrap';
    const tdClass = 'px-2 py-2 text-xs text-right border-r border-slate-100';
    const getAyRowKey = (row: { deptCode: string; courseType: string; batch: string; entryLabel: string; studyYear?: number }) =>
      [row.courseType, row.deptCode, typeof row.studyYear === 'number' ? `Y${row.studyYear}` : 'HIST', row.batch, row.entryLabel || 'ALL'].join('|');
    const selectedActiveRow = ayData.find(row => getAyRowKey(row) === selectedAyDetailKey);
    const selectedHistoricalRow = historicalData.find(row => getAyRowKey(row) === selectedAyDetailKey);
    const selectedAyDetailRow = selectedActiveRow || selectedHistoricalRow || null;
    const selectedAyStudents = selectedAyDetailRow ? getAcademicYearDetailStudents(selectedAyDetailRow, selectedAyDetailCategory) : [];
    const selectedAyTotals = selectedAyStudents.reduce((acc, s) => ({
      tTarget: acc.tTarget + s.tTarget,
      tPaid: acc.tPaid + s.tPaid,
      uTarget: acc.uTarget + s.uTarget,
      uPaid: acc.uPaid + s.uPaid,
      totalPaid: acc.totalPaid + s.totalPaid,
      totalBalance: acc.totalBalance + s.totalBalance,
    }), { tTarget: 0, tPaid: 0, uTarget: 0, uPaid: 0, totalPaid: 0, totalBalance: 0 });
    const detailCategoryLabel = selectedAyDetailCategory === 'ALL'
      ? 'All'
      : selectedAyDetailCategory === 'CONV'
        ? 'Convenor'
        : selectedAyDetailCategory === 'MGMT'
          ? 'Management'
          : selectedAyDetailCategory === 'TSMFC'
            ? 'TSMFC'
            : 'Others';

    const renderSection = (sectionDepts: typeof departments, maxYears: number, sectionLabel: string) => {
      const openAyDetail = (row: { deptCode: string; courseType: string; batch: string; entryLabel: string; studyYear?: number }, category: 'ALL' | 'CONV' | 'MGMT' | 'TSMFC' | 'OTHER' = 'ALL') => {
        setSelectedAyDetailCategory(category);
        setSelectedAyDetailKey(getAyRowKey(row));
      };
      const yearLabels = Array.from({ length: maxYears }, (_, i) => {
        const sy = i + 1;
        const batchStart = ayStartYear - i;
        return { sy, label: `${sy === 1 ? '1st' : sy === 2 ? '2nd' : sy === 3 ? '3rd' : '4th'} Year`, batchStart, batch: `${batchStart}-${batchStart + maxYears}` };
      });

      const sectionRows = ayData.filter(r => r.courseType === (maxYears === 4 ? 'B.E' : 'M.E'));
      if (sectionRows.length === 0) return null;

      const yearTotals = yearLabels.map(yl => {
        const yRows = sectionRows.filter(r => r.studyYear === yl.sy);
        return {
          ...yl,
          count: yRows.reduce((s, r) => s + r.count, 0),
          convCount: yRows.reduce((s, r) => s + r.convCount, 0),
          mgmtCount: yRows.reduce((s, r) => s + r.mgmtCount, 0),
          tsmfcCount: yRows.reduce((s, r) => s + r.tsmfcCount, 0),
          otherCount: yRows.reduce((s, r) => s + r.otherCount, 0),
          tPaid: yRows.reduce((s, r) => s + r.tPaid, 0),
          uPaid: yRows.reduce((s, r) => s + r.uPaid, 0),
          totalReceived: yRows.reduce((s, r) => s + r.totalReceived, 0),
          convTPaid: yRows.reduce((s, r) => s + r.convTPaid, 0),
          convUPaid: yRows.reduce((s, r) => s + r.convUPaid, 0),
          mgmtTPaid: yRows.reduce((s, r) => s + r.mgmtTPaid, 0),
          mgmtUPaid: yRows.reduce((s, r) => s + r.mgmtUPaid, 0),
          tsmfcTPaid: yRows.reduce((s, r) => s + r.tsmfcTPaid, 0),
          tsmfcUPaid: yRows.reduce((s, r) => s + r.tsmfcUPaid, 0),
          otherTPaid: yRows.reduce((s, r) => s + r.otherTPaid, 0),
          otherUPaid: yRows.reduce((s, r) => s + r.otherUPaid, 0),
          tTarget: yRows.reduce((s, r) => s + r.tTarget, 0),
          uTarget: yRows.reduce((s, r) => s + r.uTarget, 0),
          totalBalance: yRows.reduce((s, r) => s + r.totalBalance, 0),
        };
      });

      const grandTotal = {
        count: yearTotals.reduce((s, y) => s + y.count, 0),
        convCount: yearTotals.reduce((s, y) => s + y.convCount, 0),
        mgmtCount: yearTotals.reduce((s, y) => s + y.mgmtCount, 0),
        tsmfcCount: yearTotals.reduce((s, y) => s + y.tsmfcCount, 0),
        otherCount: yearTotals.reduce((s, y) => s + y.otherCount, 0),
        tTarget: yearTotals.reduce((s, y) => s + y.tTarget, 0),
        uTarget: yearTotals.reduce((s, y) => s + y.uTarget, 0),
        tPaid: yearTotals.reduce((s, y) => s + y.tPaid, 0),
        uPaid: yearTotals.reduce((s, y) => s + y.uPaid, 0),
        totalReceived: yearTotals.reduce((s, y) => s + y.totalReceived, 0),
        convTPaid: yearTotals.reduce((s, y) => s + y.convTPaid, 0),
        convUPaid: yearTotals.reduce((s, y) => s + y.convUPaid, 0),
        mgmtTPaid: yearTotals.reduce((s, y) => s + y.mgmtTPaid, 0),
        mgmtUPaid: yearTotals.reduce((s, y) => s + y.mgmtUPaid, 0),
        tsmfcTPaid: yearTotals.reduce((s, y) => s + y.tsmfcTPaid, 0),
        tsmfcUPaid: yearTotals.reduce((s, y) => s + y.tsmfcUPaid, 0),
        otherTPaid: yearTotals.reduce((s, y) => s + y.otherTPaid, 0),
        otherUPaid: yearTotals.reduce((s, y) => s + y.otherUPaid, 0),
        totalBalance: yearTotals.reduce((s, y) => s + y.totalBalance, 0),
      };

      return (
        <div className="mb-6">
          <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
            <span className="text-xs font-bold text-indigo-700">{sectionLabel}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className={thClass + ' sticky left-0 z-20 text-left text-slate-500 border-r border-slate-200 min-w-[110px] bg-slate-50'}>Department</th>
                  <th className={thClass + ' text-slate-500 border-r border-slate-200 w-[50px]'}>Year</th>
                  <th className={thClass + ' text-slate-500 border-r border-slate-200'}>Batch</th>
                  <th className={thClass + ' text-slate-500 border-r border-slate-200'}>Entry</th>
                  <th colSpan={5} className={thClass + ' text-blue-700 border-r border-slate-200 bg-blue-50'}>Students</th>
                  <th className={thClass + ' text-teal-600 border-r border-slate-100 bg-teal-50'}>{FEE_LABELS.tTarget}</th>
                  <th className={thClass + ' text-teal-600 border-r border-slate-100 bg-teal-50'}>{FEE_LABELS.tPaid}</th>
                  <th className={thClass + ' text-purple-600 border-r border-slate-100 bg-purple-50'}>{FEE_LABELS.uTarget}</th>
                  <th className={thClass + ' text-purple-600 border-r border-slate-100 bg-purple-50'}>{FEE_LABELS.uPaid}</th>
                  <th colSpan={9} className={thClass + ' text-emerald-700 border-r border-slate-100 bg-emerald-50'}>{FEE_LABELS.receivedSplit}</th>
                  <th className={thClass + ' text-red-600 bg-red-50'}>Balance</th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-2 py-1 text-[9px] border-r border-slate-200 bg-white" colSpan={4}></th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-blue-700 border-r border-slate-100 bg-blue-50">Total</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-blue-700 border-r border-slate-100 bg-blue-50">Conv</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-blue-700 border-r border-slate-100 bg-blue-50">Mgmt</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-blue-700 border-r border-slate-100 bg-blue-50">TSMFC</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-blue-700 border-r border-slate-200 bg-blue-50">Others</th>
                  <th className="px-2 py-1 text-[9px] border-r border-slate-100 bg-teal-50"></th>
                  <th className="px-2 py-1 text-[9px] border-r border-slate-100 bg-teal-50"></th>
                  <th className="px-2 py-1 text-[9px] border-r border-slate-100 bg-purple-50"></th>
                  <th className="px-2 py-1 text-[9px] border-r border-slate-100 bg-purple-50"></th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">Total</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.convT}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.convU}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.mgmtT}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.mgmtU}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.tsmfcT}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.tsmfcU}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.otherT}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.otherU}</th>
                  <th className="px-2 py-1 text-[9px] bg-red-50"></th>
                </tr>
              </thead>
              <tbody>
                {sectionDepts.map(dept => {
                  const deptRows = sectionRows.filter(r => r.deptCode === dept.code);
                  if (deptRows.length === 0) return null;
                  const deptTotal = {
                    count: deptRows.reduce((s, r) => s + r.count, 0),
                    convCount: deptRows.reduce((s, r) => s + r.convCount, 0),
                    mgmtCount: deptRows.reduce((s, r) => s + r.mgmtCount, 0),
                    tsmfcCount: deptRows.reduce((s, r) => s + r.tsmfcCount, 0),
                    otherCount: deptRows.reduce((s, r) => s + r.otherCount, 0),
                    tTarget: deptRows.reduce((s, r) => s + r.tTarget, 0),
                    uTarget: deptRows.reduce((s, r) => s + r.uTarget, 0),
                    tPaid: deptRows.reduce((s, r) => s + r.tPaid, 0),
                    uPaid: deptRows.reduce((s, r) => s + r.uPaid, 0),
                    totalReceived: deptRows.reduce((s, r) => s + r.totalReceived, 0),
                    convTPaid: deptRows.reduce((s, r) => s + r.convTPaid, 0),
                    convUPaid: deptRows.reduce((s, r) => s + r.convUPaid, 0),
                    mgmtTPaid: deptRows.reduce((s, r) => s + r.mgmtTPaid, 0),
                    mgmtUPaid: deptRows.reduce((s, r) => s + r.mgmtUPaid, 0),
                    tsmfcTPaid: deptRows.reduce((s, r) => s + r.tsmfcTPaid, 0),
                    tsmfcUPaid: deptRows.reduce((s, r) => s + r.tsmfcUPaid, 0),
                    otherTPaid: deptRows.reduce((s, r) => s + r.otherTPaid, 0),
                    otherUPaid: deptRows.reduce((s, r) => s + r.otherUPaid, 0),
                    totalBalance: deptRows.reduce((s, r) => s + r.totalBalance, 0),
                  };
                  return (
                    <React.Fragment key={dept.code}>
                      {deptRows.map((row, ri) => (
                        <tr key={`${row.deptCode}-${row.studyYear}-${row.entryLabel}`} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          {ri === 0 && (
                            <td rowSpan={deptRows.length + 1} className="sticky left-0 z-10 px-3 py-2 text-xs font-medium text-slate-700 border-r border-slate-200 align-top whitespace-nowrap bg-white shadow-[1px_0_0_0_rgba(226,232,240,1)]">
                              <div>{dept.courseType}-{dept.code}</div>
                            </td>
                          )}
                          <td className="px-2 py-2 text-xs text-center border-r border-slate-100 font-medium text-slate-600">Y{row.studyYear}</td>
                          <td className="px-2 py-2 text-xs text-center border-r border-slate-100 text-slate-500">{row.batch}</td>
                          <td className="px-2 py-2 text-xs text-center border-r border-slate-100">
                            {row.entryLabel ? (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${row.entryLabel === 'Lateral' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                {row.entryLabel}
                              </span>
                            ) : <span className="text-slate-400">-</span>}
                          </td>
                          <td className={tdClass + ' text-center font-semibold text-blue-700 bg-blue-50/30'}>
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedAyDetailKey === getAyRowKey(row) && selectedAyDetailCategory === 'ALL') {
                                  setSelectedAyDetailKey(null);
                                } else {
                                  openAyDetail(row, 'ALL');
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded px-2 py-0.5 hover:bg-blue-100 transition-colors"
                            >
                              <span>{row.count}</span>
                              <span className="text-[9px] text-blue-500">{selectedAyDetailKey === getAyRowKey(row) && selectedAyDetailCategory === 'ALL' ? 'Hide' : 'View'}</span>
                            </button>
                          </td>
                          <td className="px-2 py-2 text-xs text-center border-r border-slate-100 text-blue-700 bg-blue-50/20">
                            <button type="button" onClick={() => openAyDetail(row, 'CONV')} className="hover:underline">{row.convCount}</button>
                          </td>
                          <td className="px-2 py-2 text-xs text-center border-r border-slate-100 text-blue-700 bg-blue-50/20">
                            <button type="button" onClick={() => openAyDetail(row, 'MGMT')} className="hover:underline">{row.mgmtCount}</button>
                          </td>
                          <td className="px-2 py-2 text-xs text-center border-r border-slate-100 text-blue-700 bg-blue-50/20">
                            <button type="button" onClick={() => openAyDetail(row, 'TSMFC')} className="hover:underline">{row.tsmfcCount}</button>
                          </td>
                          <td className="px-2 py-2 text-xs text-center border-r border-slate-200 text-blue-700 bg-blue-50/20">
                            <button type="button" onClick={() => openAyDetail(row, 'OTHER')} className="hover:underline">{row.otherCount}</button>
                          </td>
                          <td className={tdClass}>{formatCurrency(row.tTarget)}</td>
                          <td className={tdClass + (row.tPaid > 0 ? ' text-teal-700 font-medium' : ' text-slate-400')}>{formatCurrency(row.tPaid)}</td>
                          <td className={tdClass}>{formatCurrency(row.uTarget)}</td>
                          <td className={tdClass + (row.uPaid > 0 ? ' text-purple-700 font-medium' : ' text-slate-400')}>{formatCurrency(row.uPaid)}</td>
                          <td className={tdClass + ' font-semibold text-emerald-700'}>{formatCurrency(row.totalReceived)}</td>
                          <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.convTPaid)}</td>
                          <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.convUPaid)}</td>
                          <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.mgmtTPaid)}</td>
                          <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.mgmtUPaid)}</td>
                          <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.tsmfcTPaid)}</td>
                          <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.tsmfcUPaid)}</td>
                          <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.otherTPaid)}</td>
                          <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.otherUPaid)}</td>
                          <td className={'px-2 py-2 text-xs text-right' + (row.totalBalance > 0 ? ' text-red-600 font-medium' : ' text-slate-400')}>{formatCurrency(row.totalBalance)}</td>
                        </tr>
                      ))}
                      <tr className="bg-indigo-50/50 border-t border-indigo-100">
                        <td colSpan={3} className="px-2 py-1.5 text-[10px] font-bold text-indigo-600 text-right border-r border-slate-200">Dept Total</td>
                        <td className={tdClass + ' text-center font-bold text-indigo-700'}>{deptTotal.count}</td>
                        <td className="px-2 py-1.5 text-xs text-center font-bold text-indigo-700">{deptTotal.convCount}</td>
                        <td className="px-2 py-1.5 text-xs text-center font-bold text-indigo-700">{deptTotal.mgmtCount}</td>
                        <td className="px-2 py-1.5 text-xs text-center font-bold text-indigo-700">{deptTotal.tsmfcCount}</td>
                        <td className="px-2 py-1.5 text-xs text-center font-bold text-indigo-700 border-r border-slate-200">{deptTotal.otherCount}</td>
                        <td className={tdClass + ' font-bold'}>{formatCurrency(deptTotal.tTarget)}</td>
                        <td className={tdClass + ' font-bold text-teal-700'}>{formatCurrency(deptTotal.tPaid)}</td>
                        <td className={tdClass + ' font-bold'}>{formatCurrency(deptTotal.uTarget)}</td>
                        <td className={tdClass + ' font-bold text-purple-700'}>{formatCurrency(deptTotal.uPaid)}</td>
                        <td className={tdClass + ' font-bold text-emerald-700'}>{formatCurrency(deptTotal.totalReceived)}</td>
                        <td className="px-2 py-1.5 text-xs text-right font-bold text-emerald-700">{formatCurrency(deptTotal.convTPaid)}</td>
                        <td className="px-2 py-1.5 text-xs text-right font-bold text-emerald-700">{formatCurrency(deptTotal.convUPaid)}</td>
                        <td className="px-2 py-1.5 text-xs text-right font-bold text-emerald-700">{formatCurrency(deptTotal.mgmtTPaid)}</td>
                        <td className="px-2 py-1.5 text-xs text-right font-bold text-emerald-700">{formatCurrency(deptTotal.mgmtUPaid)}</td>
                        <td className="px-2 py-1.5 text-xs text-right font-bold text-emerald-700">{formatCurrency(deptTotal.tsmfcTPaid)}</td>
                        <td className="px-2 py-1.5 text-xs text-right font-bold text-emerald-700">{formatCurrency(deptTotal.tsmfcUPaid)}</td>
                        <td className="px-2 py-1.5 text-xs text-right font-bold text-emerald-700">{formatCurrency(deptTotal.otherTPaid)}</td>
                        <td className="px-2 py-1.5 text-xs text-right font-bold text-emerald-700">{formatCurrency(deptTotal.otherUPaid)}</td>
                        <td className="px-2 py-1.5 text-xs text-right font-bold text-red-600">{formatCurrency(deptTotal.totalBalance)}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-[#1a365d] text-white border-t-2 border-[#1a365d]">
                  <td colSpan={4} className="px-3 py-3 text-xs font-bold">{sectionLabel} Grand Total</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{grandTotal.count}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{grandTotal.convCount}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{grandTotal.mgmtCount}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{grandTotal.tsmfcCount}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{grandTotal.otherCount}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold">{formatCurrency(grandTotal.tTarget)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-teal-300">{formatCurrency(grandTotal.tPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold">{formatCurrency(grandTotal.uTarget)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-purple-300">{formatCurrency(grandTotal.uPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-300">{formatCurrency(grandTotal.totalReceived)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-300">{formatCurrency(grandTotal.convTPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-300">{formatCurrency(grandTotal.convUPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-300">{formatCurrency(grandTotal.mgmtTPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-300">{formatCurrency(grandTotal.mgmtUPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-300">{formatCurrency(grandTotal.tsmfcTPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-300">{formatCurrency(grandTotal.tsmfcUPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-300">{formatCurrency(grandTotal.otherTPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-300">{formatCurrency(grandTotal.otherUPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-red-300">{formatCurrency(grandTotal.totalBalance)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const renderHistoricalSection = () => {
      if (historicalData.length === 0) return null;

      const total = historicalData.reduce((acc, row) => ({
        count: acc.count + row.count,
        convCount: acc.convCount + row.convCount,
        mgmtCount: acc.mgmtCount + row.mgmtCount,
        tsmfcCount: acc.tsmfcCount + row.tsmfcCount,
        otherCount: acc.otherCount + row.otherCount,
        tTarget: acc.tTarget + row.tTarget,
        uTarget: acc.uTarget + row.uTarget,
        tPaid: acc.tPaid + row.tPaid,
        uPaid: acc.uPaid + row.uPaid,
        totalReceived: acc.totalReceived + row.totalReceived,
        convTPaid: acc.convTPaid + row.convTPaid,
        convUPaid: acc.convUPaid + row.convUPaid,
        mgmtTPaid: acc.mgmtTPaid + row.mgmtTPaid,
        mgmtUPaid: acc.mgmtUPaid + row.mgmtUPaid,
        tsmfcTPaid: acc.tsmfcTPaid + row.tsmfcTPaid,
        tsmfcUPaid: acc.tsmfcUPaid + row.tsmfcUPaid,
        otherTPaid: acc.otherTPaid + row.otherTPaid,
        otherUPaid: acc.otherUPaid + row.otherUPaid,
        totalBalance: acc.totalBalance + row.totalBalance,
      }), { count: 0, convCount: 0, mgmtCount: 0, tsmfcCount: 0, otherCount: 0, tTarget: 0, uTarget: 0, tPaid: 0, uPaid: 0, totalReceived: 0, convTPaid: 0, convUPaid: 0, mgmtTPaid: 0, mgmtUPaid: 0, tsmfcTPaid: 0, tsmfcUPaid: 0, otherTPaid: 0, otherUPaid: 0, totalBalance: 0 });

      return (
        <div className="mb-6">
          <div className="px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <span className="text-xs font-bold text-amber-700">Historical / Completed Batches</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className={thClass + ' sticky left-0 z-20 text-left text-slate-500 border-r border-slate-200 min-w-[110px] bg-slate-50'}>Department</th>
                  <th className={thClass + ' text-slate-500 border-r border-slate-200'}>Batch</th>
                  <th className={thClass + ' text-slate-500 border-r border-slate-200'}>Entry</th>
                  <th colSpan={5} className={thClass + ' text-blue-700 border-r border-slate-200 bg-blue-50'}>Students</th>
                  <th className={thClass + ' text-teal-600 border-r border-slate-100 bg-teal-50'}>{FEE_LABELS.tTarget}</th>
                  <th className={thClass + ' text-teal-600 border-r border-slate-100 bg-teal-50'}>{FEE_LABELS.tPaid}</th>
                  <th className={thClass + ' text-purple-600 border-r border-slate-100 bg-purple-50'}>{FEE_LABELS.uTarget}</th>
                  <th className={thClass + ' text-purple-600 border-r border-slate-100 bg-purple-50'}>{FEE_LABELS.uPaid}</th>
                  <th colSpan={9} className={thClass + ' text-emerald-700 border-r border-slate-100 bg-emerald-50'}>{FEE_LABELS.receivedSplit}</th>
                  <th className={thClass + ' text-red-600 bg-red-50'}>Balance</th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-2 py-1 text-[9px] border-r border-slate-200 bg-white" colSpan={3}></th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-blue-700 border-r border-slate-100 bg-blue-50">Total</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-blue-700 border-r border-slate-100 bg-blue-50">Conv</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-blue-700 border-r border-slate-100 bg-blue-50">Mgmt</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-blue-700 border-r border-slate-100 bg-blue-50">TSMFC</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-blue-700 border-r border-slate-200 bg-blue-50">Others</th>
                  <th className="px-2 py-1 text-[9px] border-r border-slate-100 bg-teal-50"></th>
                  <th className="px-2 py-1 text-[9px] border-r border-slate-100 bg-teal-50"></th>
                  <th className="px-2 py-1 text-[9px] border-r border-slate-100 bg-purple-50"></th>
                  <th className="px-2 py-1 text-[9px] border-r border-slate-100 bg-purple-50"></th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">Total</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.convT}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.convU}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.mgmtT}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.mgmtU}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.tsmfcT}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.tsmfcU}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.otherT}</th>
                  <th className="px-2 py-1 text-[9px] font-semibold text-emerald-700 border-r border-slate-100 bg-emerald-50">{FEE_LABELS.otherU}</th>
                  <th className="px-2 py-1 text-[9px] bg-red-50"></th>
                </tr>
              </thead>
              <tbody>
                {historicalData.map((row, idx) => (
                  <tr key={`${row.deptCode}-${row.batch}-${row.entryLabel || 'all'}-hist`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="sticky left-0 z-10 px-3 py-2 text-xs font-medium text-slate-700 border-r border-slate-200 whitespace-nowrap bg-white shadow-[1px_0_0_0_rgba(226,232,240,1)]">{row.courseType}-{row.deptCode}</td>
                    <td className="px-2 py-2 text-xs text-center border-r border-slate-100 text-slate-500">{row.batch}</td>
                    <td className="px-2 py-2 text-xs text-center border-r border-slate-100">
                      {row.entryLabel ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${row.entryLabel === 'Lateral' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {row.entryLabel}
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className={tdClass + ' text-center font-semibold text-blue-700 bg-blue-50/30'}>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedAyDetailKey === getAyRowKey(row) && selectedAyDetailCategory === 'ALL') {
                            setSelectedAyDetailKey(null);
                          } else {
                            setSelectedAyDetailCategory('ALL');
                            setSelectedAyDetailKey(getAyRowKey(row));
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 hover:bg-blue-100 transition-colors"
                      >
                        <span>{row.count}</span>
                        <span className="text-[9px] text-blue-500">{selectedAyDetailKey === getAyRowKey(row) && selectedAyDetailCategory === 'ALL' ? 'Hide' : 'View'}</span>
                      </button>
                    </td>
                    <td className="px-2 py-2 text-xs text-center border-r border-slate-100 text-blue-700 bg-blue-50/20"><button type="button" onClick={() => { setSelectedAyDetailCategory('CONV'); setSelectedAyDetailKey(getAyRowKey(row)); }} className="hover:underline">{row.convCount}</button></td>
                    <td className="px-2 py-2 text-xs text-center border-r border-slate-100 text-blue-700 bg-blue-50/20"><button type="button" onClick={() => { setSelectedAyDetailCategory('MGMT'); setSelectedAyDetailKey(getAyRowKey(row)); }} className="hover:underline">{row.mgmtCount}</button></td>
                    <td className="px-2 py-2 text-xs text-center border-r border-slate-100 text-blue-700 bg-blue-50/20"><button type="button" onClick={() => { setSelectedAyDetailCategory('TSMFC'); setSelectedAyDetailKey(getAyRowKey(row)); }} className="hover:underline">{row.tsmfcCount}</button></td>
                    <td className="px-2 py-2 text-xs text-center border-r border-slate-200 text-blue-700 bg-blue-50/20"><button type="button" onClick={() => { setSelectedAyDetailCategory('OTHER'); setSelectedAyDetailKey(getAyRowKey(row)); }} className="hover:underline">{row.otherCount}</button></td>
                    <td className={tdClass}>{formatCurrency(row.tTarget)}</td>
                    <td className={tdClass + (row.tPaid > 0 ? ' text-teal-700 font-medium' : ' text-slate-400')}>{formatCurrency(row.tPaid)}</td>
                    <td className={tdClass}>{formatCurrency(row.uTarget)}</td>
                    <td className={tdClass + (row.uPaid > 0 ? ' text-purple-700 font-medium' : ' text-slate-400')}>{formatCurrency(row.uPaid)}</td>
                    <td className={tdClass + ' font-semibold text-emerald-700'}>{formatCurrency(row.totalReceived)}</td>
                    <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.convTPaid)}</td>
                    <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.convUPaid)}</td>
                    <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.mgmtTPaid)}</td>
                    <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.mgmtUPaid)}</td>
                    <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.tsmfcTPaid)}</td>
                    <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.tsmfcUPaid)}</td>
                    <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.otherTPaid)}</td>
                    <td className="px-2 py-2 text-xs text-right border-r border-slate-100 text-emerald-700 bg-emerald-50/20">{formatCurrency(row.otherUPaid)}</td>
                    <td className={'px-2 py-2 text-xs text-right' + (row.totalBalance > 0 ? ' text-red-600 font-medium' : ' text-slate-400')}>{formatCurrency(row.totalBalance)}</td>
                  </tr>
                ))}
                <tr className="bg-[#7c2d12] text-white border-t-2 border-[#7c2d12]">
                  <td colSpan={3} className="px-3 py-3 text-xs font-bold">Historical Grand Total</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{total.count}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{total.convCount}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{total.mgmtCount}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{total.tsmfcCount}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{total.otherCount}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold">{formatCurrency(total.tTarget)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-amber-200">{formatCurrency(total.tPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold">{formatCurrency(total.uTarget)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-orange-200">{formatCurrency(total.uPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-200">{formatCurrency(total.totalReceived)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-200">{formatCurrency(total.convTPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-200">{formatCurrency(total.convUPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-200">{formatCurrency(total.mgmtTPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-200">{formatCurrency(total.mgmtUPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-200">{formatCurrency(total.tsmfcTPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-200">{formatCurrency(total.tsmfcUPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-200">{formatCurrency(total.otherTPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-emerald-200">{formatCurrency(total.otherUPaid)}</td>
                  <td className="px-2 py-3 text-xs text-right font-bold text-red-200">{formatCurrency(total.totalBalance)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const overallTotalReceived = [...ayData, ...historicalData].reduce((sum, row) => sum + row.totalReceived, 0);

    return (
      <div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select value={ayFilter} onChange={e => setAyFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all min-w-[140px] shadow-sm font-medium"
            >
              {ayOptions.map(ay => <option key={ay} value={ay}>Academic Year {ay}</option>)}
            </select>
          </div>
          <div className="text-xs text-slate-400">
            Showing fee collection from all batches, with active AY {ayFilter} rows first and historical batches below
          </div>
          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-3 py-2">
            Overall Total Received: {formatCurrency(overallTotalReceived)}
          </div>
        </div>

        {renderSection(beDepts, 4, 'B.E Programs (4-Year)')}
        {renderSection(meDepts, 2, 'M.E Programs (2-Year)')}
        {renderHistoricalSection()}

        {selectedAyDetailRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelectedAyDetailKey(null)}
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
            />
            <div className="relative w-full max-w-7xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedAyDetailRow.courseType}-{selectedAyDetailRow.deptCode} {typeof selectedAyDetailRow.studyYear === 'number' ? `Y${selectedAyDetailRow.studyYear}` : 'Historical'} {selectedAyDetailRow.batch} {detailCategoryLabel}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedAyDetailRow.entryLabel || 'All'} students with fee details ({selectedAyStudents.length})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportAcademicYearDetailPDF(selectedAyDetailRow)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Printer size={14} />
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAyDetailKey(null)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-72px)]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className={thClass + ' text-center w-10'}>S.No</th>
                      <th className={thClass + ' text-left'}>Hall Ticket</th>
                      <th className={thClass + ' text-left'}>Name</th>
                      <th className={thClass + ' text-left'}>Father</th>
                      <th className={thClass + ' text-center'}>Entry</th>
                      <th className={thClass + ' text-center'}>Batch</th>
                      <th className={thClass + ' text-center'}>Category</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.tTarget}</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.tPaid}</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.uTarget}</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.uPaid}</th>
                      <th className={thClass + ' text-right'}>Total Paid</th>
                      <th className={thClass + ' text-right'}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAyStudents.length === 0 ? (
                      <EmptyState message="No students found for this academic year row." />
                    ) : (
                      <>
                        {selectedAyStudents.map((s, idx) => (
                          <tr key={s.hallTicketNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono font-semibold text-slate-700">{s.hallTicketNumber}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                            <td className="px-3 py-2 text-slate-500">{s.fatherName || '-'}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.entryType === 'L.E' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{s.entryType}</span>
                            </td>
                            <td className="px-3 py-2 text-center text-slate-500">{s.batch}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{s.admissionCategory}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(s.tTarget)}</td>
                            <td className="px-3 py-2 text-right text-teal-700 font-medium">{formatCurrency(s.tPaid)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(s.uTarget)}</td>
                            <td className="px-3 py-2 text-right text-purple-700 font-medium">{formatCurrency(s.uPaid)}</td>
                            <td className="px-3 py-2 text-right text-emerald-700 font-semibold">{formatCurrency(s.totalPaid)}</td>
                            <td className="px-3 py-2 text-right text-red-600 font-medium">{formatCurrency(s.totalBalance)}</td>
                          </tr>
                        ))}
                        <tr className="bg-[#1a365d] text-white sticky bottom-0">
                          <td colSpan={7} className="px-3 py-3 text-right text-xs font-bold">GRAND TOTAL</td>
                          <td className="px-3 py-3 text-right text-xs font-bold">{formatCurrency(selectedAyTotals.tTarget)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-teal-300">{formatCurrency(selectedAyTotals.tPaid)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold">{formatCurrency(selectedAyTotals.uTarget)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-purple-300">{formatCurrency(selectedAyTotals.uPaid)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-emerald-300">{formatCurrency(selectedAyTotals.totalPaid)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-red-300">{formatCurrency(selectedAyTotals.totalBalance)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {ayData.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No data available for Academic Year {ayFilter}</p>
          </div>
        )}
      </div>
    );
  };

  const handleExportAcademicYear = () => {
    const ayData = getAcademicYearData();
    const beDepts = reportDepartments.filter(d => d.courseType === 'B.E');
    const meDepts = reportDepartments.filter(d => d.courseType === 'M.E');

    const renderSectionHTML = (sectionDepts: typeof reportDepartments, sectionLabel: string) => {
      const sectionRows = ayData.filter(r => r.courseType === (sectionLabel.includes('B.E') ? 'B.E' : 'M.E'));
      if (sectionRows.length === 0) return '';
      let html = `<h3 style="margin:15px 0 5px;font-size:13px;color:#312e81;font-weight:bold">${sectionLabel}</h3>`;
      html += '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:11px">';
      html += `<tr style="background:#1a365d;color:white"><th>Department</th><th>Year</th><th>Batch</th><th>Entry</th><th>Students</th><th>Conv</th><th>Mgmt</th><th>TSMFC</th><th>Others</th><th>${FEE_LABELS.tTarget}</th><th>${FEE_LABELS.tPaid}</th><th>${FEE_LABELS.uTarget}</th><th>${FEE_LABELS.uPaid}</th><th>Total Received</th><th>${FEE_LABELS.convT}</th><th>${FEE_LABELS.convU}</th><th>${FEE_LABELS.mgmtT}</th><th>${FEE_LABELS.mgmtU}</th><th>${FEE_LABELS.tsmfcT}</th><th>${FEE_LABELS.tsmfcU}</th><th>${FEE_LABELS.otherT}</th><th>${FEE_LABELS.otherU}</th><th>Balance</th></tr>`;
      sectionDepts.forEach(dept => {
        const deptRows = sectionRows.filter(r => r.deptCode === dept.code);
        if (deptRows.length === 0) return;
        deptRows.forEach((r, ri) => {
          html += `<tr style="background:${ri % 2 === 0 ? '#fff' : '#f8fafc'}">`;
          if (ri === 0) html += `<td rowspan="${deptRows.length}" style="font-weight:600">${dept.courseType}-${dept.code}</td>`;
          html += `<td align="center">Y${r.studyYear}</td><td align="center">${r.batch}</td><td align="center">${r.entryLabel || '-'}</td>`;
          html += `<td align="center" style="font-weight:600">${r.count}</td><td align="center">${r.convCount}</td><td align="center">${r.mgmtCount}</td><td align="center">${r.tsmfcCount}</td><td align="center">${r.otherCount}</td>`;
          html += `<td align="right">${formatCurrency(r.tTarget)}</td><td align="right">${formatCurrency(r.tPaid)}</td>`;
          html += `<td align="right">${formatCurrency(r.uTarget)}</td><td align="right">${formatCurrency(r.uPaid)}</td>`;
          html += `<td align="right" style="font-weight:600;color:#047857">${formatCurrency(r.totalReceived)}</td><td align="right">${formatCurrency(r.convTPaid)}</td><td align="right">${formatCurrency(r.convUPaid)}</td><td align="right">${formatCurrency(r.mgmtTPaid)}</td><td align="right">${formatCurrency(r.mgmtUPaid)}</td><td align="right">${formatCurrency(r.tsmfcTPaid)}</td><td align="right">${formatCurrency(r.tsmfcUPaid)}</td><td align="right">${formatCurrency(r.otherTPaid)}</td><td align="right">${formatCurrency(r.otherUPaid)}</td>`;
          html += `<td align="right" style="color:${r.totalBalance > 0 ? '#dc2626' : '#64748b'}">${formatCurrency(r.totalBalance)}</td></tr>`;
        });
      });
      const gt = {
        count: sectionRows.reduce((s, r) => s + r.count, 0),
        convCount: sectionRows.reduce((s, r) => s + r.convCount, 0),
        mgmtCount: sectionRows.reduce((s, r) => s + r.mgmtCount, 0),
        tsmfcCount: sectionRows.reduce((s, r) => s + r.tsmfcCount, 0),
        otherCount: sectionRows.reduce((s, r) => s + r.otherCount, 0),
        tTarget: sectionRows.reduce((s, r) => s + r.tTarget, 0),
        tPaid: sectionRows.reduce((s, r) => s + r.tPaid, 0),
        uTarget: sectionRows.reduce((s, r) => s + r.uTarget, 0),
        uPaid: sectionRows.reduce((s, r) => s + r.uPaid, 0),
        totalReceived: sectionRows.reduce((s, r) => s + r.totalReceived, 0),
        convTPaid: sectionRows.reduce((s, r) => s + r.convTPaid, 0),
        convUPaid: sectionRows.reduce((s, r) => s + r.convUPaid, 0),
        mgmtTPaid: sectionRows.reduce((s, r) => s + r.mgmtTPaid, 0),
        mgmtUPaid: sectionRows.reduce((s, r) => s + r.mgmtUPaid, 0),
        tsmfcTPaid: sectionRows.reduce((s, r) => s + r.tsmfcTPaid, 0),
        tsmfcUPaid: sectionRows.reduce((s, r) => s + r.tsmfcUPaid, 0),
        otherTPaid: sectionRows.reduce((s, r) => s + r.otherTPaid, 0),
        otherUPaid: sectionRows.reduce((s, r) => s + r.otherUPaid, 0),
        totalBalance: sectionRows.reduce((s, r) => s + r.totalBalance, 0),
      };
      html += `<tr style="background:#1a365d;color:white;font-weight:bold"><td colspan="4">Grand Total</td><td align="center">${gt.count}</td><td align="center">${gt.convCount}</td><td align="center">${gt.mgmtCount}</td><td align="center">${gt.tsmfcCount}</td><td align="center">${gt.otherCount}</td><td align="right">${formatCurrency(gt.tTarget)}</td><td align="right">${formatCurrency(gt.tPaid)}</td><td align="right">${formatCurrency(gt.uTarget)}</td><td align="right">${formatCurrency(gt.uPaid)}</td><td align="right">${formatCurrency(gt.totalReceived)}</td><td align="right">${formatCurrency(gt.convTPaid)}</td><td align="right">${formatCurrency(gt.convUPaid)}</td><td align="right">${formatCurrency(gt.mgmtTPaid)}</td><td align="right">${formatCurrency(gt.mgmtUPaid)}</td><td align="right">${formatCurrency(gt.tsmfcTPaid)}</td><td align="right">${formatCurrency(gt.tsmfcUPaid)}</td><td align="right">${formatCurrency(gt.otherTPaid)}</td><td align="right">${formatCurrency(gt.otherUPaid)}</td><td align="right">${formatCurrency(gt.totalBalance)}</td></tr>`;
      html += '</table>';
      return html;
    };

    exportPDF(`Academic Year Collection Report - AY ${ayFilter}`,
      renderSectionHTML(beDepts, 'B.E Programs (4-Year)') + renderSectionHTML(meDepts, 'M.E Programs (2-Year)')
    );
  };

  const handleExportAcademicYearCount = () => {
    const ayData = getAcademicYearCountData();
    const beDepts = reportDepartments.filter(d => d.courseType === 'B.E');
    const meDepts = reportDepartments.filter(d => d.courseType === 'M.E');

    const renderSectionHTML = (sectionDepts: typeof reportDepartments, sectionLabel: string) => {
      const sectionRows = ayData.filter(r => r.courseType === (sectionLabel.includes('B.E') ? 'B.E' : 'M.E'));
      if (sectionRows.length === 0) return '';
      let html = `<h3 style="margin:15px 0 5px;font-size:13px;color:#312e81;font-weight:bold">${sectionLabel}</h3>`;
      html += '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:11px">';
      html += '<tr style="background:#1a365d;color:white"><th>Department</th><th>Year</th><th>Batch</th><th>Entry</th><th>Students</th><th>Conv</th><th>Mgmt</th><th>TSMFC</th><th>Other</th></tr>';
      sectionDepts.forEach(dept => {
        const deptRows = sectionRows.filter(r => r.deptCode === dept.code);
        if (deptRows.length === 0) return;
        deptRows.forEach((r, ri) => {
          html += `<tr style="background:${ri % 2 === 0 ? '#fff' : '#f8fafc'}">`;
          if (ri === 0) html += `<td rowspan="${deptRows.length + 1}" style="font-weight:600">${dept.courseType}-${dept.code}</td>`;
          html += `<td align="center">Y${r.studyYear}</td><td align="center">${r.batch}</td><td align="center">${r.entryLabel || '-'}</td><td align="center" style="font-weight:600">${r.count}</td><td align="center">${r.convCount}</td><td align="center">${r.mgmtCount}</td><td align="center">${r.tsmfcCount}</td><td align="center">${r.otherCount}</td></tr>`;
        });
        html += `<tr style="background:#eef2ff;font-weight:bold"><td colspan="3" align="right">Dept Total</td><td align="center">${deptRows.reduce((sum, row) => sum + row.count, 0)}</td><td align="center">${deptRows.reduce((sum, row) => sum + row.convCount, 0)}</td><td align="center">${deptRows.reduce((sum, row) => sum + row.mgmtCount, 0)}</td><td align="center">${deptRows.reduce((sum, row) => sum + row.tsmfcCount, 0)}</td><td align="center">${deptRows.reduce((sum, row) => sum + row.otherCount, 0)}</td></tr>`;
      });
      html += `<tr style="background:#1a365d;color:white;font-weight:bold"><td colspan="4">Grand Total</td><td align="center">${sectionRows.reduce((sum, row) => sum + row.count, 0)}</td><td align="center">${sectionRows.reduce((sum, row) => sum + row.convCount, 0)}</td><td align="center">${sectionRows.reduce((sum, row) => sum + row.mgmtCount, 0)}</td><td align="center">${sectionRows.reduce((sum, row) => sum + row.tsmfcCount, 0)}</td><td align="center">${sectionRows.reduce((sum, row) => sum + row.otherCount, 0)}</td></tr>`;
      html += '</table>';
      return html;
    };

    exportPDF(
      `Academic Year Student Count Report - AY ${ayFilter}`,
      renderSectionHTML(beDepts, 'B.E Programs (4-Year)') + renderSectionHTML(meDepts, 'M.E Programs (2-Year)')
    );
  };

  const exportHandlers: Record<ReportTab, () => void> = {
    dept_summary: handleExportDeptSummary,
    financial_year: handleExportFinYear,
    batch_wise: handleExportBatchWise,
    academic_year: handleExportAcademicYear,
    academic_year_count: handleExportAcademicYearCount,
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

  const DateFilter = () => (
    <>
      <div>
        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">From Date</label>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
      </div>
      <div>
        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">To Date</label>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
      </div>
      {(dateFrom || dateTo) && (
        <button onClick={() => { setDateFrom(''); setDateTo(''); }}
          className="self-end mb-0.5 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-2 rounded hover:bg-red-50 transition-colors">
          Clear Dates
        </button>
      )}
    </>
  );

  const DateRangeBanner = () => (dateFrom || dateTo) ? (
    <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
      Showing fee collections from <strong>{dateFrom || 'beginning'}</strong> to <strong>{dateTo || 'present'}</strong>. Targets reflect full fee obligation.
    </div>
  ) : null;

  const renderDeptSummary = () => {
    const data = getDeptSummaryData();
    const total = data.reduce((acc, d) => ({
      count: acc.count + d.count, tTarget: acc.tTarget + d.tTarget, tPaid: acc.tPaid + d.tPaid,
      uTarget: acc.uTarget + d.uTarget, uPaid: acc.uPaid + d.uPaid,
      totalReceived: acc.totalReceived + d.totalReceived, totalBalance: acc.totalBalance + d.totalBalance,
      convCount: acc.convCount + d.convCount, mgmtCount: acc.mgmtCount + d.mgmtCount,
      tsmfcCount: acc.tsmfcCount + d.tsmfcCount, otherCount: acc.otherCount + d.otherCount,
      convTPaid: acc.convTPaid + d.convTPaid, convUPaid: acc.convUPaid + d.convUPaid,
      mgmtTPaid: acc.mgmtTPaid + d.mgmtTPaid, mgmtUPaid: acc.mgmtUPaid + d.mgmtUPaid,
      tsmfcTPaid: acc.tsmfcTPaid + d.tsmfcTPaid, tsmfcUPaid: acc.tsmfcUPaid + d.tsmfcUPaid,
      otherTPaid: acc.otherTPaid + d.otherTPaid, otherUPaid: acc.otherUPaid + d.otherUPaid,
    }), {
      count: 0, tTarget: 0, tPaid: 0, uTarget: 0, uPaid: 0, totalReceived: 0, totalBalance: 0,
      convCount: 0, mgmtCount: 0, tsmfcCount: 0, otherCount: 0,
      convTPaid: 0, convUPaid: 0, mgmtTPaid: 0, mgmtUPaid: 0, tsmfcTPaid: 0, tsmfcUPaid: 0, otherTPaid: 0, otherUPaid: 0,
    });
    const selectedDeptRow = selectedDeptDetail
      ? data.find(row => getDeptSummaryRowKey(row) === selectedDeptDetail.rowKey)
      : undefined;
    const selectedDeptStudents = selectedDeptRow && selectedDeptDetail
      ? getDeptSummaryDetailStudents(selectedDeptRow, selectedDeptDetail.bucket)
      : [];
    const selectedDeptTotals = selectedDeptStudents.reduce((acc, s) => ({
      tTarget: acc.tTarget + s.tTarget,
      tPaid: acc.tPaid + s.tPaid,
      uTarget: acc.uTarget + s.uTarget,
      uPaid: acc.uPaid + s.uPaid,
      totalPaid: acc.totalPaid + s.totalPaid,
      totalBalance: acc.totalBalance + s.totalBalance,
    }), { tTarget: 0, tPaid: 0, uTarget: 0, uPaid: 0, totalPaid: 0, totalBalance: 0 });

    return (
      <div>
        <FilterBar>
          <SelectFilter label="Batch" value={batchFilter} onChange={setBatchFilter}>
            <option value="all">All Batches</option>
            {batchOptions.map(b => <option key={b.value} value={b.value}>{b.value} ({b.count})</option>)}
          </SelectFilter>
          <SelectFilter label="Year" value={yearFilter} onChange={setYearFilter}>
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </SelectFilter>
          <DateFilter />
        </FilterBar>
        <DateRangeBanner />
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-50/80">
                <th className={thClass}>Department</th>
                <th className={`${thClass} text-center bg-blue-50/50`}>Students</th>
                <th className={`${thClass} text-center bg-purple-50/50`}>Conv</th>
                <th className={`${thClass} text-center bg-amber-50/50`}>Mgmt</th>
                <th className={`${thClass} text-center bg-blue-50/50`}>TSMFC</th>
                <th className={`${thClass} text-center bg-slate-100`}>Other</th>
                <th className={`${thClass} text-right`}>{FEE_LABELS.tTarget}</th>
                <th className={`${thClass} text-right`}>{FEE_LABELS.tPaid}</th>
                <th className={`${thClass} text-right`}>{FEE_LABELS.uTarget}</th>
                <th className={`${thClass} text-right`}>{FEE_LABELS.uPaid}</th>
                <th className={`${thClass} text-right bg-purple-50/50`}>{FEE_LABELS.convT}</th>
                <th className={`${thClass} text-right bg-purple-50/50`}>{FEE_LABELS.convU}</th>
                <th className={`${thClass} text-right bg-amber-50/50`}>{FEE_LABELS.mgmtT}</th>
                <th className={`${thClass} text-right bg-amber-50/50`}>{FEE_LABELS.mgmtU}</th>
                <th className={`${thClass} text-right bg-blue-50/50`}>{FEE_LABELS.tsmfcT}</th>
                <th className={`${thClass} text-right bg-blue-50/50`}>{FEE_LABELS.tsmfcU}</th>
                <th className={`${thClass} text-right bg-slate-100`}>{FEE_LABELS.otherT}</th>
                <th className={`${thClass} text-right bg-slate-100`}>{FEE_LABELS.otherU}</th>
                <th className={`${thClass} text-right`}>Total Received</th>
                <th className={`${thClass} text-right`}>Total Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={`${d.code}-${d.entryLabel}`} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className={`${tdClass} font-semibold text-slate-800`}>{d.courseType}({d.code}){d.entryLabel ? <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${d.entryLabel === 'Lateral' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{d.entryLabel}</span> : ''}</td>
                  <td className={`${tdClass} text-center bg-blue-50/30`}>
                    <button type="button" onClick={() => setSelectedDeptDetail({ rowKey: getDeptSummaryRowKey(d), bucket: 'ALL' })} className="text-blue-700 font-semibold hover:underline">{d.count}</button>
                  </td>
                  <td className={`${tdClass} text-center bg-purple-50/30`}>
                    <button type="button" onClick={() => setSelectedDeptDetail({ rowKey: getDeptSummaryRowKey(d), bucket: 'CONV' })} className="text-purple-700 font-semibold hover:underline">{d.convCount}</button>
                  </td>
                  <td className={`${tdClass} text-center bg-amber-50/30`}>
                    <button type="button" onClick={() => setSelectedDeptDetail({ rowKey: getDeptSummaryRowKey(d), bucket: 'MGMT' })} className="text-amber-700 font-semibold hover:underline">{d.mgmtCount}</button>
                  </td>
                  <td className={`${tdClass} text-center bg-blue-50/30`}>
                    <button type="button" onClick={() => setSelectedDeptDetail({ rowKey: getDeptSummaryRowKey(d), bucket: 'TSMFC' })} className="text-blue-700 font-semibold hover:underline">{d.tsmfcCount}</button>
                  </td>
                  <td className={`${tdClass} text-center bg-slate-100/80`}>
                    <button type="button" onClick={() => setSelectedDeptDetail({ rowKey: getDeptSummaryRowKey(d), bucket: 'OTHER' })} className="text-slate-700 font-semibold hover:underline">{d.otherCount}</button>
                  </td>
                  <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.tTarget)}</td>
                  <td className={`${tdClass} font-semibold text-amber-600 text-right`}>{formatCurrency(d.tPaid)}</td>
                  <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.uTarget)}</td>
                  <td className={`${tdClass} font-semibold text-blue-600 text-right`}>{formatCurrency(d.uPaid)}</td>
                  <td className={`${tdClass} text-right bg-purple-50/30`}>{formatCurrency(d.convTPaid)}</td>
                  <td className={`${tdClass} text-right bg-purple-50/30`}>{formatCurrency(d.convUPaid)}</td>
                  <td className={`${tdClass} text-right bg-amber-50/30`}>{formatCurrency(d.mgmtTPaid)}</td>
                  <td className={`${tdClass} text-right bg-amber-50/30`}>{formatCurrency(d.mgmtUPaid)}</td>
                  <td className={`${tdClass} text-right bg-blue-50/30`}>{formatCurrency(d.tsmfcTPaid)}</td>
                  <td className={`${tdClass} text-right bg-blue-50/30`}>{formatCurrency(d.tsmfcUPaid)}</td>
                  <td className={`${tdClass} text-right bg-slate-100/80`}>{formatCurrency(d.otherTPaid)}</td>
                  <td className={`${tdClass} text-right bg-slate-100/80`}>{formatCurrency(d.otherUPaid)}</td>
                  <td className={`${tdClass} font-semibold text-emerald-600 text-right`}>{formatCurrency(d.totalReceived)}</td>
                  <td className={`${tdClass} font-semibold text-right ${d.totalBalance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatCurrency(d.totalBalance)}</td>
                </tr>
              ))}
              <tr className="bg-[#1a365d] text-white">
                <td className={`${tdClass} font-bold`}>GRAND TOTAL</td>
                <td className={`${tdClass} font-bold text-center`}>{total.count}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.convCount}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.mgmtCount}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.tsmfcCount}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.otherCount}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.tTarget)}</td>
                <td className={`${tdClass} font-bold text-right text-amber-200`}>{formatCurrency(total.tPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.uTarget)}</td>
                <td className={`${tdClass} font-bold text-right text-blue-200`}>{formatCurrency(total.uPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.convTPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.convUPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.mgmtTPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.mgmtUPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.tsmfcTPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.tsmfcUPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.otherTPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.otherUPaid)}</td>
                <td className={`${tdClass} font-bold text-right text-emerald-200`}>{formatCurrency(total.totalReceived)}</td>
                <td className={`${tdClass} font-bold text-right text-red-200`}>{formatCurrency(total.totalBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {selectedDeptRow && selectedDeptDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelectedDeptDetail(null)}
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
            />
            <div className="relative w-full max-w-7xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDeptRow.courseType}({selectedDeptRow.code}) {selectedDeptRow.entryLabel || 'All'} {selectedDeptDetail.bucket}
                  </p>
                  <p className="text-xs text-slate-500">
                    Student list for the selected department summary split ({selectedDeptStudents.length})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportDeptSummaryDetailPDF(selectedDeptRow, selectedDeptDetail.bucket)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Printer size={14} />
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDeptDetail(null)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-72px)]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className={thClass + ' text-center w-10'}>S.No</th>
                      <th className={thClass + ' text-left'}>Hall Ticket</th>
                      <th className={thClass + ' text-left'}>Name</th>
                      <th className={thClass + ' text-left'}>Father</th>
                      <th className={thClass + ' text-center'}>Dept</th>
                      <th className={thClass + ' text-center'}>Batch</th>
                      <th className={thClass + ' text-center'}>Entry</th>
                      <th className={thClass + ' text-center'}>Category</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.tTarget}</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.tPaid}</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.uTarget}</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.uPaid}</th>
                      <th className={thClass + ' text-right'}>Total Paid</th>
                      <th className={thClass + ' text-right'}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDeptStudents.length === 0 ? (
                      <EmptyState message="No students found for this department summary row." />
                    ) : (
                      <>
                        {selectedDeptStudents.map((s, idx) => (
                          <tr key={s.hallTicketNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono font-semibold text-slate-700">{s.hallTicketNumber}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                            <td className="px-3 py-2 text-slate-500">{s.fatherName || '-'}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{s.department}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{s.batch}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{s.entryType}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{s.admissionCategory}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(s.tTarget)}</td>
                            <td className="px-3 py-2 text-right text-emerald-700 font-medium">{formatCurrency(s.tPaid)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(s.uTarget)}</td>
                            <td className="px-3 py-2 text-right text-purple-700 font-medium">{formatCurrency(s.uPaid)}</td>
                            <td className="px-3 py-2 text-right text-emerald-700 font-semibold">{formatCurrency(s.totalPaid)}</td>
                            <td className="px-3 py-2 text-right text-red-600 font-medium">{formatCurrency(s.totalBalance)}</td>
                          </tr>
                        ))}
                        <tr className="bg-[#1a365d] text-white sticky bottom-0">
                          <td colSpan={8} className="px-3 py-3 text-right text-xs font-bold">GRAND TOTAL</td>
                          <td className="px-3 py-3 text-right text-xs font-bold">{formatCurrency(selectedDeptTotals.tTarget)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-emerald-300">{formatCurrency(selectedDeptTotals.tPaid)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold">{formatCurrency(selectedDeptTotals.uTarget)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-purple-300">{formatCurrency(selectedDeptTotals.uPaid)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-emerald-300">{formatCurrency(selectedDeptTotals.totalPaid)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-red-300">{formatCurrency(selectedDeptTotals.totalBalance)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFinancialYear = () => {
    const data = getFinancialYearData();
    const total = data.reduce((acc, d) => ({
      tuition: acc.tuition + d.tuition, university: acc.university + d.university,
      other: acc.other + d.other, count: acc.count + d.count, total: acc.total + d.total,
      convCount: acc.convCount + d.convCount, mgmtCount: acc.mgmtCount + d.mgmtCount,
      tsmfcCount: acc.tsmfcCount + d.tsmfcCount, otherCount: acc.otherCount + d.otherCount,
      convAmount: acc.convAmount + d.convAmount, mgmtAmount: acc.mgmtAmount + d.mgmtAmount,
      tsmfcAmount: acc.tsmfcAmount + d.tsmfcAmount, otherAmount: acc.otherAmount + d.otherAmount,
    }), {
      tuition: 0, university: 0, other: 0, count: 0, total: 0,
      convCount: 0, mgmtCount: 0, tsmfcCount: 0, otherCount: 0,
      convAmount: 0, mgmtAmount: 0, tsmfcAmount: 0, otherAmount: 0,
    });

    return (
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80">
              <th className={thClass}>Financial Year</th>
              <th className={`${thClass} text-center`}>Transactions</th>
              <th className={`${thClass} text-center bg-purple-50/50`}>Conv</th>
              <th className={`${thClass} text-center bg-amber-50/50`}>Mgmt</th>
              <th className={`${thClass} text-center bg-blue-50/50`}>TSMFC</th>
              <th className={`${thClass} text-center bg-slate-100`}>Other</th>
              <th className={`${thClass} text-right`}>{FEE_LABELS.tuitionCollected}</th>
              <th className={`${thClass} text-right`}>{FEE_LABELS.ouCollected}</th>
              <th className={`${thClass} text-right`}>Other</th>
              <th className={`${thClass} text-right bg-purple-50/50`}>Conv Amt</th>
              <th className={`${thClass} text-right bg-amber-50/50`}>Mgmt Amt</th>
              <th className={`${thClass} text-right bg-blue-50/50`}>TSMFC Amt</th>
              <th className={`${thClass} text-right bg-slate-100`}>Other Amt</th>
              <th className={`${thClass} text-right`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && <EmptyState message="No approved transactions found." />}
            {data.map((d, i) => {
              const isExpanded = expandedFY === d.financialYear;
              const fyStudents = isExpanded ? getStudentsForFY(d.financialYear) : [];
              return (
                <React.Fragment key={d.financialYear}>
                  <tr
                    className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    onClick={() => setExpandedFY(isExpanded ? null : d.financialYear)}
                  >
                    <td className={`${tdClass} font-semibold text-slate-800`}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`text-[10px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                        {d.financialYear}
                      </span>
                    </td>
                    <td className={`${tdClass} text-slate-500 text-center`}>{d.count}</td>
                    <td className={`${tdClass} text-purple-700 text-center bg-purple-50/30`}>{d.convCount}</td>
                    <td className={`${tdClass} text-amber-700 text-center bg-amber-50/30`}>{d.mgmtCount}</td>
                    <td className={`${tdClass} text-blue-700 text-center bg-blue-50/30`}>{d.tsmfcCount}</td>
                    <td className={`${tdClass} text-slate-700 text-center bg-slate-100/80`}>{d.otherCount}</td>
                    <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.tuition)}</td>
                    <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.university)}</td>
                    <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.other)}</td>
                    <td className={`${tdClass} text-right bg-purple-50/30`}>{formatCurrency(d.convAmount)}</td>
                    <td className={`${tdClass} text-right bg-amber-50/30`}>{formatCurrency(d.mgmtAmount)}</td>
                    <td className={`${tdClass} text-right bg-blue-50/30`}>{formatCurrency(d.tsmfcAmount)}</td>
                    <td className={`${tdClass} text-right bg-slate-100/80`}>{formatCurrency(d.otherAmount)}</td>
                    <td className={`${tdClass} font-semibold text-emerald-600 text-right`}>{formatCurrency(d.total)}</td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={14} className="p-0">
                        <div className="bg-slate-50 border-y border-slate-200 p-3">
                          <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-2">
                            <Users size={14} />
                            Student Details for FY {d.financialYear} ({fyStudents.length} students)
                          </div>
                          <div className="overflow-x-auto rounded border border-slate-200 max-h-[400px] overflow-y-auto">
                            <table className="w-full text-left border-collapse text-[12px]">
                              <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-100">
                                  <th className="px-2 py-1.5 font-semibold text-slate-600 text-center w-10">S.No</th>
                                  <th className="px-2 py-1.5 font-semibold text-slate-600">Roll Number</th>
                                  <th className="px-2 py-1.5 font-semibold text-slate-600">Name</th>
                                  <th className="px-2 py-1.5 font-semibold text-slate-600 text-center">Dept</th>
                                  <th className="px-2 py-1.5 font-semibold text-slate-600 text-center">Batch</th>
                                  <th className="px-2 py-1.5 font-semibold text-slate-600 text-right">{FEE_LABELS.tuition}</th>
                                  <th className="px-2 py-1.5 font-semibold text-slate-600 text-right">{FEE_LABELS.ou}</th>
                                  <th className="px-2 py-1.5 font-semibold text-slate-600 text-right">Other</th>
                                  <th className="px-2 py-1.5 font-semibold text-slate-600 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {fyStudents.map((s, si) => (
                                  <tr key={s.htn} className={`border-b border-slate-100 ${si % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                    <td className="px-2 py-1.5 text-slate-400 text-center">{si + 1}</td>
                                    <td className="px-2 py-1.5 font-mono font-semibold text-slate-700">{s.htn}</td>
                                    <td className="px-2 py-1.5 font-semibold text-slate-800">{s.name}</td>
                                    <td className="px-2 py-1.5 text-slate-500 text-center">{s.department}</td>
                                    <td className="px-2 py-1.5 text-slate-500 text-center">{s.batch}</td>
                                    <td className="px-2 py-1.5 text-slate-600 text-right">{s.tuition > 0 ? formatCurrency(s.tuition) : '-'}</td>
                                    <td className="px-2 py-1.5 text-slate-600 text-right">{s.university > 0 ? formatCurrency(s.university) : '-'}</td>
                                    <td className="px-2 py-1.5 text-slate-600 text-right">{s.other > 0 ? formatCurrency(s.other) : '-'}</td>
                                    <td className="px-2 py-1.5 font-semibold text-emerald-600 text-right">{formatCurrency(s.total)}</td>
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
              );
            })}
            {data.length > 0 && (
              <tr className="bg-[#1a365d] text-white">
                <td className={`${tdClass} font-bold`}>GRAND TOTAL</td>
                <td className={`${tdClass} font-bold text-center`}>{total.count}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.convCount}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.mgmtCount}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.tsmfcCount}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.otherCount}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.tuition)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.university)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.other)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.convAmount)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.mgmtAmount)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.tsmfcAmount)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.otherAmount)}</td>
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
      convCount: acc.convCount + d.convCount, mgmtCount: acc.mgmtCount + d.mgmtCount,
      tsmfcCount: acc.tsmfcCount + d.tsmfcCount, otherCount: acc.otherCount + d.otherCount,
      convTPaid: acc.convTPaid + d.convTPaid, convUPaid: acc.convUPaid + d.convUPaid,
      mgmtTPaid: acc.mgmtTPaid + d.mgmtTPaid, mgmtUPaid: acc.mgmtUPaid + d.mgmtUPaid,
      tsmfcTPaid: acc.tsmfcTPaid + d.tsmfcTPaid, tsmfcUPaid: acc.tsmfcUPaid + d.tsmfcUPaid,
      otherTPaid: acc.otherTPaid + d.otherTPaid, otherUPaid: acc.otherUPaid + d.otherUPaid,
    }), {
      count: 0, totalTarget: 0, totalPaid: 0, balance: 0,
      convCount: 0, mgmtCount: 0, tsmfcCount: 0, otherCount: 0,
      convTPaid: 0, convUPaid: 0, mgmtTPaid: 0, mgmtUPaid: 0, tsmfcTPaid: 0, tsmfcUPaid: 0, otherTPaid: 0, otherUPaid: 0,
    });

    return (
      <div>
        <FilterBar>
          <DateFilter />
        </FilterBar>
        <DateRangeBanner />
        <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80">
              <th className={thClass}>Batch</th>
              <th className={`${thClass} text-center bg-blue-50/50`}>Students</th>
              <th className={`${thClass} text-center bg-purple-50/50`}>Conv</th>
              <th className={`${thClass} text-center bg-amber-50/50`}>Mgmt</th>
              <th className={`${thClass} text-center bg-blue-50/50`}>TSMFC</th>
              <th className={`${thClass} text-center bg-slate-100`}>Other</th>
              <th className={`${thClass} text-right`}>Total Target</th>
              <th className={`${thClass} text-right`}>Total Paid</th>
              <th className={`${thClass} text-right bg-purple-50/50`}>{FEE_LABELS.convT}</th>
              <th className={`${thClass} text-right bg-purple-50/50`}>{FEE_LABELS.convU}</th>
              <th className={`${thClass} text-right bg-amber-50/50`}>{FEE_LABELS.mgmtT}</th>
              <th className={`${thClass} text-right bg-amber-50/50`}>{FEE_LABELS.mgmtU}</th>
              <th className={`${thClass} text-right bg-blue-50/50`}>{FEE_LABELS.tsmfcT}</th>
              <th className={`${thClass} text-right bg-blue-50/50`}>{FEE_LABELS.tsmfcU}</th>
              <th className={`${thClass} text-right bg-slate-100`}>{FEE_LABELS.otherT}</th>
              <th className={`${thClass} text-right bg-slate-100`}>{FEE_LABELS.otherU}</th>
              <th className={`${thClass} text-right`}>Balance</th>
              <th className={`${thClass} text-right`}>Collection %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => {
              const pct = d.totalTarget > 0 ? (d.totalPaid / d.totalTarget) * 100 : 0;
              const isBatchExpanded = expandedBatch === d.batch;
              const batchStudents = isBatchExpanded ? getStudentsForBatch(d.batch) : [];
              return (
                <React.Fragment key={d.batch}>
                <tr
                  className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors cursor-pointer ${isBatchExpanded ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                  onClick={() => setExpandedBatch(isBatchExpanded ? null : d.batch)}
                >
                  <td className={`${tdClass} font-semibold text-slate-800`}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`text-[10px] transition-transform ${isBatchExpanded ? 'rotate-90' : ''}`}>▶</span>
                      {d.batch}
                    </span>
                  </td>
                  <td className={`${tdClass} text-slate-500 text-center bg-blue-50/30`}>{d.count}</td>
                  <td className={`${tdClass} text-purple-700 text-center bg-purple-50/30`}>{d.convCount}</td>
                  <td className={`${tdClass} text-amber-700 text-center bg-amber-50/30`}>{d.mgmtCount}</td>
                  <td className={`${tdClass} text-blue-700 text-center bg-blue-50/30`}>{d.tsmfcCount}</td>
                  <td className={`${tdClass} text-slate-700 text-center bg-slate-100/80`}>{d.otherCount}</td>
                  <td className={`${tdClass} text-slate-600 text-right`}>{formatCurrency(d.totalTarget)}</td>
                  <td className={`${tdClass} font-semibold text-emerald-600 text-right`}>{formatCurrency(d.totalPaid)}</td>
                  <td className={`${tdClass} text-right bg-purple-50/30`}>{formatCurrency(d.convTPaid)}</td>
                  <td className={`${tdClass} text-right bg-purple-50/30`}>{formatCurrency(d.convUPaid)}</td>
                  <td className={`${tdClass} text-right bg-amber-50/30`}>{formatCurrency(d.mgmtTPaid)}</td>
                  <td className={`${tdClass} text-right bg-amber-50/30`}>{formatCurrency(d.mgmtUPaid)}</td>
                  <td className={`${tdClass} text-right bg-blue-50/30`}>{formatCurrency(d.tsmfcTPaid)}</td>
                  <td className={`${tdClass} text-right bg-blue-50/30`}>{formatCurrency(d.tsmfcUPaid)}</td>
                  <td className={`${tdClass} text-right bg-slate-100/80`}>{formatCurrency(d.otherTPaid)}</td>
                  <td className={`${tdClass} text-right bg-slate-100/80`}>{formatCurrency(d.otherUPaid)}</td>
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
                {isBatchExpanded && (
                  <tr>
                    <td colSpan={18} className="p-0">
                      <div className="bg-slate-50 border-y border-slate-200 p-3">
                        <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-2">
                          <Users size={14} />
                          Student Details for Batch {d.batch} ({batchStudents.length} students)
                        </div>
                        <div className="overflow-x-auto rounded border border-slate-200 max-h-[400px] overflow-y-auto">
                          <table className="w-full text-left border-collapse text-[12px]">
                            <thead className="sticky top-0 z-10">
                              <tr className="bg-slate-100">
                                <th className="px-2 py-1.5 font-semibold text-slate-600 text-center w-10">S.No</th>
                                <th className="px-2 py-1.5 font-semibold text-slate-600">Roll Number</th>
                                <th className="px-2 py-1.5 font-semibold text-slate-600">Name</th>
                                <th className="px-2 py-1.5 font-semibold text-slate-600 text-center">Dept</th>
                                <th className="px-2 py-1.5 font-semibold text-slate-600 text-right">Target</th>
                                <th className="px-2 py-1.5 font-semibold text-slate-600 text-right">Paid</th>
                                <th className="px-2 py-1.5 font-semibold text-slate-600 text-right">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {batchStudents.map((s, si) => (
                                <tr key={s.htn} className={`border-b border-slate-100 ${si % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                  <td className="px-2 py-1.5 text-slate-400 text-center">{si + 1}</td>
                                  <td className="px-2 py-1.5 font-mono font-semibold text-slate-700">{s.htn}</td>
                                  <td className="px-2 py-1.5 font-semibold text-slate-800">{s.name}</td>
                                  <td className="px-2 py-1.5 text-slate-500 text-center">{s.department}</td>
                                  <td className="px-2 py-1.5 text-slate-600 text-right">{formatCurrency(s.totalTarget)}</td>
                                  <td className="px-2 py-1.5 font-semibold text-emerald-600 text-right">{formatCurrency(s.totalPaid)}</td>
                                  <td className="px-2 py-1.5 font-semibold text-right" style={{ color: s.balance > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(s.balance)}</td>
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
              );
            })}
            {data.length > 0 && (
              <tr className="bg-[#1a365d] text-white">
                <td className={`${tdClass} font-bold`}>GRAND TOTAL</td>
                <td className={`${tdClass} font-bold text-center`}>{total.count}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.convCount}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.mgmtCount}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.tsmfcCount}</td>
                <td className={`${tdClass} font-bold text-center`}>{total.otherCount}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.totalTarget)}</td>
                <td className={`${tdClass} font-bold text-right text-emerald-200`}>{formatCurrency(total.totalPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.convTPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.convUPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.mgmtTPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.mgmtUPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.tsmfcTPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.tsmfcUPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.otherTPaid)}</td>
                <td className={`${tdClass} font-bold text-right`}>{formatCurrency(total.otherUPaid)}</td>
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
      </div>
    );
  };

  const renderAcademicYearCount = () => {
    const ayData = getAcademicYearCountData();
    const ayOptions = getAcademicYearOptions();
    const beDepts = reportDepartments.filter(d => d.courseType === 'B.E');
    const meDepts = reportDepartments.filter(d => d.courseType === 'M.E');

    const countThClass = 'px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-center whitespace-nowrap';
    const countTdClass = 'px-2 py-2 text-xs border-r border-slate-100';

    const renderSection = (sectionDepts: typeof reportDepartments, courseType: 'B.E' | 'M.E', sectionLabel: string) => {
      const sectionRows = ayData.filter(r => r.courseType === courseType);
      if (sectionRows.length === 0) return null;

      return (
        <div className="mb-6">
          <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
            <span className="text-xs font-bold text-indigo-700">{sectionLabel}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className={countThClass + ' text-left text-slate-500 border-r border-slate-200 w-[110px]'}>Department</th>
                  <th className={countThClass + ' text-slate-500 border-r border-slate-200 w-[50px]'}>Year</th>
                  <th className={countThClass + ' text-slate-500 border-r border-slate-200'}>Batch</th>
                  <th className={countThClass + ' text-slate-500 border-r border-slate-200'}>Entry</th>
                  <th className={countThClass + ' text-blue-600 bg-blue-50 border-r border-slate-200'}>Students</th>
                  <th className={countThClass + ' text-purple-600 bg-purple-50 border-r border-slate-200'}>Conv</th>
                  <th className={countThClass + ' text-amber-600 bg-amber-50 border-r border-slate-200'}>Mgmt</th>
                  <th className={countThClass + ' text-blue-600 bg-blue-50 border-r border-slate-200'}>TSMFC</th>
                  <th className={countThClass + ' text-slate-600 bg-slate-100'}>Other</th>
                </tr>
              </thead>
              <tbody>
                {sectionDepts.map(dept => {
                  const deptRows = sectionRows.filter(r => r.deptCode === dept.code);
                  if (deptRows.length === 0) return null;
                  const deptTotal = deptRows.reduce((sum, row) => sum + row.count, 0);
                  return (
                    <React.Fragment key={`${courseType}-${dept.code}`}>
                      {deptRows.map((row, ri) => (
                        <tr key={`${row.deptCode}-${row.studyYear}-${row.entryLabel || 'all'}-count`} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          {ri === 0 && (
                            <td rowSpan={deptRows.length + 1} className="px-2 py-2 text-[11px] font-medium text-slate-700 border-r border-slate-200 align-top whitespace-nowrap">
                              <div>{dept.courseType}-{dept.code}</div>
                            </td>
                          )}
                          <td className={countTdClass + ' text-center font-medium text-slate-600'}>Y{row.studyYear}</td>
                          <td className={countTdClass + ' text-center text-slate-500'}>{row.batch}</td>
                          <td className={countTdClass + ' text-center'}>
                            {row.entryLabel ? (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${row.entryLabel === 'Lateral' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                {row.entryLabel}
                              </span>
                            ) : <span className="text-slate-400">-</span>}
                          </td>
                          <td className="px-2 py-2 text-xs text-center font-semibold text-blue-700 bg-blue-50/30 border-r border-slate-100">{row.count}</td>
                          <td className="px-2 py-2 text-xs text-center font-semibold text-purple-700 bg-purple-50/30 border-r border-slate-100">{row.convCount}</td>
                          <td className="px-2 py-2 text-xs text-center font-semibold text-amber-700 bg-amber-50/30 border-r border-slate-100">{row.mgmtCount}</td>
                          <td className="px-2 py-2 text-xs text-center font-semibold text-blue-700 bg-blue-50/30 border-r border-slate-100">{row.tsmfcCount}</td>
                          <td className="px-2 py-2 text-xs text-center font-semibold text-slate-700 bg-slate-100/70">{row.otherCount}</td>
                        </tr>
                      ))}
                      <tr className="bg-indigo-50/50 border-t border-indigo-100">
                        <td colSpan={3} className="px-2 py-1.5 text-[10px] font-bold text-indigo-600 text-right border-r border-slate-200">Dept Total</td>
                        <td className="px-2 py-1.5 text-xs text-center font-bold text-indigo-700">{deptTotal}</td>
                        <td className="px-2 py-1.5 text-xs text-center font-bold text-indigo-700">{deptRows.reduce((sum, row) => sum + row.convCount, 0)}</td>
                        <td className="px-2 py-1.5 text-xs text-center font-bold text-indigo-700">{deptRows.reduce((sum, row) => sum + row.mgmtCount, 0)}</td>
                        <td className="px-2 py-1.5 text-xs text-center font-bold text-indigo-700">{deptRows.reduce((sum, row) => sum + row.tsmfcCount, 0)}</td>
                        <td className="px-2 py-1.5 text-xs text-center font-bold text-indigo-700">{deptRows.reduce((sum, row) => sum + row.otherCount, 0)}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr className="bg-[#1a365d] text-white border-t-2 border-[#1a365d]">
                  <td colSpan={4} className="px-3 py-3 text-xs font-bold">{sectionLabel} Grand Total</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{sectionRows.reduce((sum, row) => sum + row.count, 0)}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{sectionRows.reduce((sum, row) => sum + row.convCount, 0)}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{sectionRows.reduce((sum, row) => sum + row.mgmtCount, 0)}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{sectionRows.reduce((sum, row) => sum + row.tsmfcCount, 0)}</td>
                  <td className="px-2 py-3 text-xs text-center font-bold">{sectionRows.reduce((sum, row) => sum + row.otherCount, 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select value={ayFilter} onChange={e => setAyFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all min-w-[140px] shadow-sm font-medium"
            >
              {ayOptions.map(ay => <option key={ay} value={ay}>Academic Year {ay}</option>)}
            </select>
          </div>
          <div className="text-xs text-slate-400">
            Showing student counts from all batches active in AY {ayFilter}
          </div>
        </div>

        {renderSection(beDepts, 'B.E', 'B.E Programs (4-Year)')}
        {renderSection(meDepts, 'M.E', 'M.E Programs (2-Year)')}

        {ayData.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No data available for Academic Year {ayFilter}</p>
          </div>
        )}
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
            {reportDepartments.map(d => <option key={d.id ?? d.code} value={d.name}>{d.name}</option>)}
          </SelectFilter>
          <SelectFilter label="Batch" value={batchFilter} onChange={setBatchFilter}>
            <option value="all">All Batches</option>
            {batchOptions.map(b => <option key={b.value} value={b.value}>{b.value} ({b.count})</option>)}
          </SelectFilter>
          <SelectFilter label="Year" value={yearFilter} onChange={setYearFilter}>
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </SelectFilter>
          <SelectFilter label="Category" value={categoryFilter} onChange={setCategoryFilter}>
            <option value="all">All Categories</option>
            {allCategories.map(category => <option key={category} value={category}>{category}</option>)}
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
                <th className={`${thClass} text-right`}>{FEE_LABELS.tTarget}</th>
                <th className={`${thClass} text-right`}>{FEE_LABELS.tPaid}</th>
                <th className={`${thClass} text-right`}>{FEE_LABELS.tBalance}</th>
                <th className={`${thClass} text-right`}>{FEE_LABELS.uTarget}</th>
                <th className={`${thClass} text-right`}>{FEE_LABELS.uPaid}</th>
                <th className={`${thClass} text-right`}>{FEE_LABELS.uBalance}</th>
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
                  <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">
                    {s.name}
                    <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${s.entryType === 'LATERAL' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {s.entryType === 'LATERAL' ? 'L.E' : 'R'}
                    </span>
                  </td>
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
            {reportDepartments.map(d => <option key={d.id ?? d.code} value={d.name}>{d.name}</option>)}
          </SelectFilter>
          <SelectFilter label="Batch" value={batchFilter} onChange={setBatchFilter}>
            <option value="all">All Batches</option>
            {batchOptions.map(b => <option key={b.value} value={b.value}>{b.value} ({b.count})</option>)}
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
                  <td className="px-3 py-2.5 text-xs text-slate-500 text-center">{getDisplayBatch(s) || '-'}</td>
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
            {batchOptions.map(b => <option key={b.value} value={b.value}>{b.value} ({b.count})</option>)}
          </SelectFilter>
          <SelectFilter label="Department" value={deptFilter} onChange={setDeptFilter}>
            <option value="all">All Departments</option>
            {reportDepartments.map(d => <option key={d.id ?? d.code} value={d.name}>{d.name}</option>)}
          </SelectFilter>
          <SelectFilter label="Year" value={yearFilter} onChange={setYearFilter}>
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </SelectFilter>
          <DateFilter />
          {data.length > 0 && (
            <div className="ml-2 self-end pb-0.5">
              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                Outstanding: {formatCurrency(totals.balance)}
              </span>
            </div>
          )}
        </FilterBar>
        <DateRangeBanner />
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
    const selectedCategoryRow = selectedCategoryDetail
      ? data.find(row => getCategoryAnalysisRowKey(row as CategoryAnalysisRow) === selectedCategoryDetail.rowKey) as CategoryAnalysisRow | undefined
      : undefined;
    const selectedCategoryStudents = selectedCategoryRow && selectedCategoryDetail
      ? getCategoryAnalysisDetailStudents(selectedCategoryRow, selectedCategoryDetail.bucket)
      : [];
    const selectedCategoryTotals = selectedCategoryStudents.reduce((acc, s) => ({
      tTarget: acc.tTarget + s.tTarget,
      tPaid: acc.tPaid + s.tPaid,
      uTarget: acc.uTarget + s.uTarget,
      uPaid: acc.uPaid + s.uPaid,
      totalPaid: acc.totalPaid + s.totalPaid,
      totalBalance: acc.totalBalance + s.totalBalance,
    }), { tTarget: 0, tPaid: 0, uTarget: 0, uPaid: 0, totalPaid: 0, totalBalance: 0 });
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
            {batchOptions.map(b => <option key={b.value} value={b.value}>{b.value} ({b.count})</option>)}
          </SelectFilter>
          <SelectFilter label="Year" value={yearFilter} onChange={setYearFilter}>
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </SelectFilter>
          <DateFilter />
        </FilterBar>
        <DateRangeBanner />
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
                <th className="px-1.5 py-2 text-[8px] font-bold text-blue-700 bg-blue-50/50 text-center">Students</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-blue-700 bg-blue-50/50 text-right">Actual Fee</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-blue-700 bg-blue-50/50 text-right">{FEE_LABELS.tPaid}</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-blue-700 bg-blue-50/50 text-right">{FEE_LABELS.uPaid}</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-blue-700 bg-blue-50/50 text-right">Due</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-amber-700 bg-amber-50/50 text-center">Students</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-amber-700 bg-amber-50/50 text-right">Actual Fee</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-amber-700 bg-amber-50/50 text-right">{FEE_LABELS.tPaid}</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-amber-700 bg-amber-50/50 text-right">{FEE_LABELS.uPaid}</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-amber-700 bg-amber-50/50 text-right">Due</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-purple-700 bg-purple-50/50 text-center">Students</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-purple-700 bg-purple-50/50 text-right">Actual Fee</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-purple-700 bg-purple-50/50 text-right">{FEE_LABELS.tPaid}</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-purple-700 bg-purple-50/50 text-right">{FEE_LABELS.uPaid}</th>
                <th className="px-1.5 py-2 text-[8px] font-bold text-purple-700 bg-purple-50/50 text-right">Due</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <EmptyState message="No TSMFC, Management or Convenor students found." />}
              {data.map((d, i) => (
                <tr key={`${d.code}-${d.entryLabel}`} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="px-3 py-2.5 text-xs font-bold text-slate-800">{d.courseType}({d.code}){d.entryLabel ? <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${d.entryLabel === 'Lateral' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{d.entryLabel}</span> : ''}</td>
                  <td className="px-1.5 py-2.5 text-xs text-blue-700 font-semibold text-center bg-blue-50/20">
                    <button type="button" onClick={() => setSelectedCategoryDetail({ rowKey: getCategoryAnalysisRowKey(d as CategoryAnalysisRow), bucket: 'TSMFC' })} className="hover:underline">{d.tsmfcCount}</button>
                  </td>
                  <td className="px-1.5 py-2.5 text-xs text-slate-600 text-right bg-blue-50/20">{formatCurrency(d.tsmfcTarget)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-semibold text-emerald-600 text-right bg-blue-50/20">{formatCurrency(d.tsmfcTuiPaid)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-semibold text-teal-600 text-right bg-blue-50/20">{formatCurrency(d.tsmfcUniPaid)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-bold text-right bg-blue-50/20" style={{ color: d.tsmfcBalance > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(d.tsmfcBalance)}</td>
                  <td className="px-1.5 py-2.5 text-xs text-amber-700 font-semibold text-center bg-amber-50/20">
                    <button type="button" onClick={() => setSelectedCategoryDetail({ rowKey: getCategoryAnalysisRowKey(d as CategoryAnalysisRow), bucket: 'MGMT' })} className="hover:underline">{d.mgmtCount}</button>
                  </td>
                  <td className="px-1.5 py-2.5 text-xs text-slate-600 text-right bg-amber-50/20">{formatCurrency(d.mgmtTarget)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-semibold text-emerald-600 text-right bg-amber-50/20">{formatCurrency(d.mgmtTuiPaid)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-semibold text-teal-600 text-right bg-amber-50/20">{formatCurrency(d.mgmtUniPaid)}</td>
                  <td className="px-1.5 py-2.5 text-xs font-bold text-right bg-amber-50/20" style={{ color: d.mgmtBalance > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(d.mgmtBalance)}</td>
                  <td className="px-1.5 py-2.5 text-xs text-purple-700 font-semibold text-center bg-purple-50/20">
                    <button type="button" onClick={() => setSelectedCategoryDetail({ rowKey: getCategoryAnalysisRowKey(d as CategoryAnalysisRow), bucket: 'CONV' })} className="hover:underline">{d.convCount}</button>
                  </td>
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

        {selectedCategoryRow && selectedCategoryDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelectedCategoryDetail(null)}
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
            />
            <div className="relative w-full max-w-7xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedCategoryRow.courseType}({selectedCategoryRow.code}) {selectedCategoryRow.entryLabel || 'All'} {selectedCategoryDetail.bucket}
                  </p>
                  <p className="text-xs text-slate-500">
                    Student list for the selected category count ({selectedCategoryStudents.length})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportCategoryAnalysisDetailPDF(selectedCategoryRow, selectedCategoryDetail.bucket)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Printer size={14} />
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryDetail(null)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-72px)]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className={thClass + ' text-center w-10'}>S.No</th>
                      <th className={thClass + ' text-left'}>Hall Ticket</th>
                      <th className={thClass + ' text-left'}>Name</th>
                      <th className={thClass + ' text-left'}>Father</th>
                      <th className={thClass + ' text-center'}>Dept</th>
                      <th className={thClass + ' text-center'}>Batch</th>
                      <th className={thClass + ' text-center'}>Entry</th>
                      <th className={thClass + ' text-center'}>Category</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.tTarget}</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.tPaid}</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.uTarget}</th>
                      <th className={thClass + ' text-right'}>{FEE_LABELS.uPaid}</th>
                      <th className={thClass + ' text-right'}>Total Paid</th>
                      <th className={thClass + ' text-right'}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCategoryStudents.length === 0 ? (
                      <EmptyState message="No students found for this category row." />
                    ) : (
                      <>
                        {selectedCategoryStudents.map((s, idx) => (
                          <tr key={s.hallTicketNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono font-semibold text-slate-700">{s.hallTicketNumber}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                            <td className="px-3 py-2 text-slate-500">{s.fatherName || '-'}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{s.department}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{s.batch}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{s.entryType}</td>
                            <td className="px-3 py-2 text-center text-slate-500">{s.admissionCategory}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(s.tTarget)}</td>
                            <td className="px-3 py-2 text-right text-emerald-700 font-medium">{formatCurrency(s.tPaid)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(s.uTarget)}</td>
                            <td className="px-3 py-2 text-right text-purple-700 font-medium">{formatCurrency(s.uPaid)}</td>
                            <td className="px-3 py-2 text-right text-emerald-700 font-semibold">{formatCurrency(s.totalPaid)}</td>
                            <td className="px-3 py-2 text-right text-red-600 font-medium">{formatCurrency(s.totalBalance)}</td>
                          </tr>
                        ))}
                        <tr className="bg-[#1a365d] text-white sticky bottom-0">
                          <td colSpan={8} className="px-3 py-3 text-right text-xs font-bold">GRAND TOTAL</td>
                          <td className="px-3 py-3 text-right text-xs font-bold">{formatCurrency(selectedCategoryTotals.tTarget)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-emerald-300">{formatCurrency(selectedCategoryTotals.tPaid)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold">{formatCurrency(selectedCategoryTotals.uTarget)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-purple-300">{formatCurrency(selectedCategoryTotals.uPaid)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-emerald-300">{formatCurrency(selectedCategoryTotals.totalPaid)}</td>
                          <td className="px-3 py-3 text-right text-xs font-bold text-red-300">{formatCurrency(selectedCategoryTotals.totalBalance)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent: Record<ReportTab, () => React.ReactNode> = {
    dept_summary: renderDeptSummary,
    financial_year: renderFinancialYear,
    batch_wise: renderBatchWise,
    academic_year: renderAcademicYear,
    academic_year_count: renderAcademicYearCount,
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
    academic_year: { title: 'Academic Year Collection', subtitle: 'Fee collection by academic year showing all active batches (B.E + M.E + Lateral)' },
    academic_year_count: { title: 'Academic Year Student Count', subtitle: 'Student count by department and academic year for B.E regular, B.E lateral and M.E' },
    student_master: { title: 'Student Master Fee List', subtitle: 'Year wise fee details per student' },
    student_info: { title: 'Student Master List', subtitle: 'Complete student personal information directory' },
    defaulters: { title: 'Fee Defaulters', subtitle: 'Department & year wise outstanding balance' },
    category_analysis: { title: 'Category Analysis', subtitle: 'Management vs Convenor fee payment & due summary' },
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

      <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setYearFilter('all'); setDeptFilter('all'); setBatchFilter('all'); setCategoryFilter('all'); }}
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
