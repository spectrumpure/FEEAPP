
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Plus, 
  Upload, 
  Filter, 
  MoreHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Download,
  GraduationCap,
  User,
  Briefcase,
  MapPin,
  Users,
  FileSpreadsheet,
  Calendar,
  Wallet,
  Eye,
  Trash2,
  Edit2,
  Save,
  UserPlus,
  CreditCard,
  Layers,
  StickyNote,
  X
} from 'lucide-react';
import { Student, CourseType, YearLocker, FeeTransaction, StudentRemark } from '../types';
import { DEPARTMENTS, COURSES, SECTIONS, normalizeDepartment } from '../constants';

interface StudentDirectoryProps {
  onFeeEntry?: (htn: string) => void;
  onViewStudent?: (htn: string) => void;
}

type UploadResult = { students: number; transactions: number; errors: string[] } | null;

const parseFileToRows = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        if (isExcel) {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
          resolve(rows.filter(r => r.some(c => String(c).trim() !== '')));
        } else {
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter(row => row.trim() !== '');
          const rows = lines.map(line => {
            const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            return cols.map(c => c.replace(/^"|"$/g, '').trim());
          });
          resolve(rows);
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};

const normalizeDate = (val: string): string => {
  if (!val || val === '0') return '';
  const dotMatch = val.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) return `${dotMatch[3]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[1].padStart(2, '0')}`;
  const slashMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return '';
};

const computeFY = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return month >= 4 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
};


export const StudentDirectory: React.FC<StudentDirectoryProps> = ({ onFeeEntry, onViewStudent }) => {
  const { students, addStudent, departments, updateStudent, deleteStudent, bulkAddStudents, addTransaction, bulkAddTransactions, currentUser, getFeeTargets } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHTN, setEditingHTN] = useState<string | null>(null);
  const [allRemarks, setAllRemarks] = useState<Record<string, StudentRemark[]>>({});
  const [remarksModalHTN, setRemarksModalHTN] = useState<string | null>(null);
  const [newRemark, setNewRemark] = useState('');
  const [addingRemark, setAddingRemark] = useState(false);

  useEffect(() => {
    const loadAllRemarks = async () => {
      const remarksMap: Record<string, StudentRemark[]> = {};
      try {
        const promises = students.map(async (s) => {
          const res = await fetch(`/api/remarks/${encodeURIComponent(s.hallTicketNumber)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) remarksMap[s.hallTicketNumber] = data;
          }
        });
        await Promise.all(promises);
        setAllRemarks(remarksMap);
      } catch (err) {
        console.error('Failed to load remarks:', err);
      }
    };
    if (students.length > 0) loadAllRemarks();
  }, [students]);

  const handleAddRemark = async () => {
    if (!remarksModalHTN || !newRemark.trim()) return;
    setAddingRemark(true);
    try {
      const res = await fetch('/api/remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hallTicketNumber: remarksModalHTN, remark: newRemark.trim(), addedBy: currentUser?.name || 'Admin' }),
      });
      if (res.ok) {
        const resRemarks = await fetch(`/api/remarks/${encodeURIComponent(remarksModalHTN)}`);
        if (resRemarks.ok) {
          const data = await resRemarks.json();
          setAllRemarks(prev => ({ ...prev, [remarksModalHTN]: data }));
        }
        setNewRemark('');
      }
    } catch (err) {
      console.error('Failed to add remark:', err);
    }
    setAddingRemark(false);
  };

  const handleDeleteRemark = async (remarkId: number) => {
    if (!remarksModalHTN) return;
    try {
      await fetch(`/api/remarks/${remarkId}`, { method: 'DELETE' });
      const resRemarks = await fetch(`/api/remarks/${encodeURIComponent(remarksModalHTN)}`);
      if (resRemarks.ok) {
        const data = await resRemarks.json();
        setAllRemarks(prev => {
          const updated = { ...prev };
          if (data.length > 0) updated[remarksModalHTN] = data;
          else delete updated[remarksModalHTN];
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to delete remark:', err);
    }
  };

  const [isUploadingStudents, setIsUploadingStudents] = useState(false);
  const [isUploadingFees, setIsUploadingFees] = useState(false);
  const [isUploadingCombined, setIsUploadingCombined] = useState(false);
  const [studentUploadResult, setStudentUploadResult] = useState<UploadResult>(null);
  const [feeUploadResult, setFeeUploadResult] = useState<UploadResult>(null);
  const [combinedUploadResult, setCombinedUploadResult] = useState<UploadResult>(null);
  const studentFileRef = useRef<HTMLInputElement>(null);
  const feeFileRef = useRef<HTMLInputElement>(null);
  const combinedFileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    hallTicketNumber: '',
    fatherName: '',
    motherName: '',
    sex: 'F',
    dob: '',
    mobile: '',
    fatherMobile: '',
    address: '',
    course: 'B.E' as CourseType,
    department: DEPARTMENTS[0].name,
    specialization: 'General',
    section: 'A',
    admissionCategory: 'TSMFC',
    admissionYear: '2025',
    batch: '2025-29',
    currentYear: 1
  });

  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.hallTicketNumber.includes(searchTerm);
    const deptObj = DEPARTMENTS.find(d => d.name === departmentFilter);
    const matchesDept = !departmentFilter || s.department === departmentFilter || 
      (deptObj && (s.department === deptObj.code || s.department.toUpperCase() === deptObj.code.toUpperCase() || s.department.toUpperCase() === deptObj.name.toUpperCase()));
    const matchesYear = !yearFilter || s.currentYear === Number(yearFilter);
    return matchesSearch && matchesDept && matchesYear;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      hallTicketNumber: '',
      fatherName: '',
      motherName: '',
      sex: 'F',
      dob: '',
      mobile: '',
      fatherMobile: '',
      address: '',
      course: 'B.E',
      department: DEPARTMENTS[0].name,
      specialization: 'General',
      section: 'A',
      admissionCategory: 'TSMFC',
      admissionYear: '2025',
      batch: '2025-29',
      currentYear: 1
    });
    setIsEditing(false);
    setEditingHTN(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && editingHTN) {
      const existing = students.find(s => s.hallTicketNumber === editingHTN);
      if (existing) {
        updateStudent({
          ...existing,
          ...formData,
        });
        alert(`Success: Profile for ${formData.name} updated successfully.`);
      }
    } else {
      if (students.find(s => s.hallTicketNumber === formData.hallTicketNumber)) {
        alert("Error: Roll Number already exists!");
        return;
      }
      const manualTargets = getFeeTargets(formData.department, 1);
      const locker: YearLocker = {
        year: 1,
        tuitionTarget: manualTargets.tuition,
        universityTarget: manualTargets.university,
        otherTarget: 0,
        transactions: []
      };
      addStudent({ ...formData, feeLockers: [locker] });
      alert(`Success: Student ${formData.name} registered successfully.`);
    }
    
    setShowManualModal(false);
    resetForm();
  };

  const handleDelete = (e: React.MouseEvent, htn: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${name} (HTN: ${htn})? This will also remove all associated fee records.`)) {
      deleteStudent(htn);
    }
  };

  const handleEditClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingHTN(student.hallTicketNumber);
    setFormData({
      name: student.name,
      hallTicketNumber: student.hallTicketNumber,
      fatherName: student.fatherName,
      motherName: student.motherName,
      sex: student.sex,
      dob: student.dob,
      mobile: student.mobile,
      fatherMobile: student.fatherMobile,
      address: student.address,
      course: student.course,
      department: student.department,
      specialization: student.specialization,
      section: student.section,
      admissionCategory: student.admissionCategory,
      admissionYear: student.admissionYear,
      batch: student.batch,
      currentYear: student.currentYear
    });
    setShowManualModal(true);
  };

  const handleView = (e: React.MouseEvent, htn: string) => {
    e.stopPropagation();
    onViewStudent?.(htn);
  };

  const handleCollect = (e: React.MouseEvent, htn: string) => {
    e.stopPropagation();
    onFeeEntry?.(htn);
  };

  const handleBulkStudentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingStudents(true);
    setStudentUploadResult(null);

    try {
      const allRows = await parseFileToRows(file);
      const dataRows = allRows.slice(1);
      const errors: string[] = [];
      const newStudents: Student[] = [];
      const seenHTNs = new Set<string>();

      dataRows.forEach((cols, idx) => {
        if (cols.length < 13) {
          errors.push(`Row ${idx + 2}: Insufficient columns (found ${cols.length}, need 13)`);
          return;
        }
        const htnValue = String(cols[0] || '').trim();
        if (!htnValue) { errors.push(`Row ${idx + 2}: Missing Roll Number`); return; }
        if (seenHTNs.has(htnValue)) { errors.push(`Row ${idx + 2}: Duplicate ${htnValue} in file (skipped)`); return; }
        seenHTNs.add(htnValue);
        if (students.find(s => s.hallTicketNumber === htnValue)) { errors.push(`Row ${idx + 2}: ${htnValue} already exists (skipped)`); return; }

        const admYear = String(cols[6] || '2025');
        const mode = String(cols[5] || 'TSMFC').toUpperCase();
        const normalizedDept = normalizeDepartment(String(cols[4] || DEPARTMENTS[0].name));
        const deptInfo = DEPARTMENTS.find(d => d.code === normalizedDept || d.name === normalizedDept || d.code.toUpperCase() === normalizedDept.toUpperCase());
        const isME = deptInfo?.courseType === 'M.E' || normalizedDept.startsWith('ME-');
        const duration = deptInfo?.duration || (isME ? 2 : 4);
        const currentYearVal = cols.length > 13 ? (parseInt(String(cols[13] || '1')) || 1) : 1;
        const clampedYear = Math.max(1, Math.min(currentYearVal, duration));
        const feeLockers = [];
        for (let yr = 1; yr <= clampedYear; yr++) {
          const targets = getFeeTargets(normalizedDept, yr);
          feeLockers.push({
            year: yr,
            tuitionTarget: targets.tuition,
            universityTarget: targets.university,
            otherTarget: 0,
            transactions: []
          });
        }
        const studentData: Student = {
          hallTicketNumber: htnValue,
          name: String(cols[1] || '').toUpperCase(),
          fatherName: String(cols[2] || '').toUpperCase(),
          sex: String(cols[3] || 'M'),
          department: normalizedDept,
          admissionCategory: mode,
          admissionYear: admYear,
          batch: String(cols[7] || `${admYear}-${(parseInt(admYear) + duration).toString().slice(-2)}`),
          dob: normalizeDate(String(cols[8] || '')),
          mobile: String(cols[9] || ''),
          fatherMobile: String(cols[10] || ''),
          address: String(cols[11] || ''),
          motherName: String(cols[12] || '').toUpperCase(),
          course: isME ? 'M.E' : 'B.E',
          specialization: 'General',
          section: 'A',
          currentYear: clampedYear,
          feeLockers
        };
        newStudents.push(studentData);
      });

      if (newStudents.length > 0) bulkAddStudents(newStudents);
      setStudentUploadResult({ students: newStudents.length, transactions: 0, errors });
    } catch {
      setStudentUploadResult({ students: 0, transactions: 0, errors: ['Failed to parse file. Please check format.'] });
    }
    setIsUploadingStudents(false);
    if (e.target) e.target.value = '';
  };

  const handleBulkFeeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFees(true);
    setFeeUploadResult(null);

    try {
      const allRows = await parseFileToRows(file);
      const dataRows = allRows.slice(1);
      const errors: string[] = [];
      const newTxs: FeeTransaction[] = [];

      dataRows.forEach((cols, idx) => {
        if (cols.length < 6) { errors.push(`Row ${idx + 2}: Insufficient columns (found ${cols.length}, need 6)`); return; }
        const htnValue = String(cols[0] || '').trim();
        if (!htnValue) { errors.push(`Row ${idx + 2}: Missing Roll Number`); return; }
        const student = students.find(s => s.hallTicketNumber === htnValue);
        if (!student) { errors.push(`Row ${idx + 2}: Student ${htnValue} not found`); return; }

        const feeType = String(cols[1] || 'Tuition');
        const challanNo = String(cols[2] || '');
        const challanDate = normalizeDate(String(cols[3] || ''));
        const amount = parseFloat(String(cols[4] || '0'));
        const paymentMode = String(cols[5] || 'Challan');

        if (isNaN(amount) || amount <= 0) { errors.push(`Row ${idx + 2}: Invalid amount`); return; }

        const payDate = challanDate || new Date().toISOString().split('T')[0];
        const fy = computeFY(payDate);
        if (!fy) { errors.push(`Row ${idx + 2}: Invalid date`); return; }

        const admYear = parseInt(student.admissionYear) || 2025;
        const acYear = `${admYear}-${(admYear + 1).toString().slice(-2)}`;

        newTxs.push({
          id: `tx-fee-${htnValue}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          studentHTN: htnValue,
          feeType: (['Tuition', 'University', 'Other'].includes(feeType) ? feeType : 'Tuition') as any,
          amount,
          challanNumber: challanNo,
          paymentMode: (['Online', 'Challan', 'DD', 'Cash', 'UPI'].includes(paymentMode) ? paymentMode : 'Challan') as any,
          paymentDate: payDate,
          academicYear: acYear,
          financialYear: fy,
          status: 'PENDING'
        });
      });

      if (newTxs.length > 0) bulkAddTransactions(newTxs);
      setFeeUploadResult({ students: 0, transactions: newTxs.length, errors });
    } catch {
      setFeeUploadResult({ students: 0, transactions: 0, errors: ['Failed to parse file. Please check format.'] });
    }
    setIsUploadingFees(false);
    if (e.target) e.target.value = '';
  };

  const handleCombinedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCombined(true);
    setCombinedUploadResult(null);

    try {
      const allRows = await parseFileToRows(file);
      const dataRows = allRows.slice(1);
      const errors: string[] = [];
      const newStudents: Student[] = [];
      const seenHTNs = new Set<string>();

      dataRows.forEach((cols, idx) => {
        if (cols.length < 20) { errors.push(`Row ${idx + 2}: Insufficient columns (found ${cols.length}, need 20)`); return; }

        const htnValue = String(cols[0] || '').trim();
        if (!htnValue) { errors.push(`Row ${idx + 2}: Missing Roll Number`); return; }
        if (seenHTNs.has(htnValue)) { errors.push(`Row ${idx + 2}: Duplicate ${htnValue} in file (skipped)`); return; }
        seenHTNs.add(htnValue);

        const mode = String(cols[5] || 'TSMFC').toUpperCase();
        const admYear = String(cols[6] || '2025');
        const normalizedDeptC = normalizeDepartment(String(cols[4] || DEPARTMENTS[0].name));
        const deptInfoC = DEPARTMENTS.find(d => d.code === normalizedDeptC || d.name === normalizedDeptC || d.code.toUpperCase() === normalizedDeptC.toUpperCase());
        const isMEC = deptInfoC?.courseType === 'M.E' || normalizedDeptC.startsWith('ME-');
        const durationC = deptInfoC?.duration || (isMEC ? 2 : 4);
        const currentYearValC = cols.length > 20 ? (parseInt(String(cols[20] || '1')) || 1) : 1;
        const clampedYearC = Math.max(1, Math.min(currentYearValC, durationC));
        const targetsC = getFeeTargets(normalizedDeptC, 1);

        const locker: YearLocker = {
          year: 1,
          tuitionTarget: targetsC.tuition,
          universityTarget: targetsC.university,
          otherTarget: 0,
          transactions: []
        };

        const tuiChallan = String(cols[13] || '');
        const tuiDate = normalizeDate(String(cols[14] || ''));
        const tuiAmount = parseFloat(String(cols[15] || '0')) || 0;
        const payMode = String(cols[16] || 'Challan');

        if (tuiAmount > 0 && tuiDate) {
          const fy = computeFY(tuiDate);
          const admYearNum = parseInt(admYear) || 2025;
          locker.transactions.push({
            id: `tx-tui-${htnValue}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            studentHTN: htnValue,
            feeType: 'Tuition',
            amount: tuiAmount,
            challanNumber: tuiChallan,
            paymentMode: (['Online', 'Challan', 'DD', 'Cash', 'UPI'].includes(payMode) ? payMode : 'Challan') as any,
            paymentDate: tuiDate,
            academicYear: `${admYearNum}-${(admYearNum + 1).toString().slice(-2)}`,
            financialYear: fy || `${admYearNum}-${(admYearNum + 1).toString().slice(-2)}`,
            status: 'PENDING'
          });
        }

        const univChallan = String(cols[17] || '');
        const univDate = normalizeDate(String(cols[18] || ''));
        const univAmount = parseFloat(String(cols[19] || '0')) || 0;

        if (univAmount > 0 && univDate) {
          const fy = computeFY(univDate);
          const admYearNum = parseInt(admYear) || 2025;
          locker.transactions.push({
            id: `tx-uni-${htnValue}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            studentHTN: htnValue,
            feeType: 'University',
            amount: univAmount,
            challanNumber: univChallan,
            paymentMode: (['Online', 'Challan', 'DD', 'Cash', 'UPI'].includes(payMode) ? payMode : 'Challan') as any,
            paymentDate: univDate,
            academicYear: `${parseInt(admYear) || 2025}-${((parseInt(admYear) || 2025) + 1).toString().slice(-2)}`,
            financialYear: fy || `${parseInt(admYear) || 2025}-${((parseInt(admYear) || 2025) + 1).toString().slice(-2)}`,
            status: 'PENDING'
          });
        }

        const combinedLockers: YearLocker[] = [locker];
        for (let yr = 2; yr <= clampedYearC; yr++) {
          const yTargets = getFeeTargets(normalizedDeptC, yr);
          combinedLockers.push({ year: yr, tuitionTarget: yTargets.tuition, universityTarget: yTargets.university, otherTarget: 0, transactions: [] });
        }

        const studentData: Student = {
          hallTicketNumber: htnValue,
          name: String(cols[1] || '').toUpperCase(),
          fatherName: String(cols[2] || '').toUpperCase(),
          sex: String(cols[3] || 'M'),
          department: normalizedDeptC,
          admissionCategory: mode,
          admissionYear: admYear,
          batch: String(cols[7] || `${admYear}-${(parseInt(admYear) + durationC).toString().slice(-2)}`),
          dob: normalizeDate(String(cols[8] || '')),
          mobile: String(cols[9] || ''),
          fatherMobile: String(cols[10] || ''),
          address: String(cols[11] || ''),
          motherName: String(cols[12] || '').toUpperCase(),
          course: isMEC ? 'M.E' : 'B.E',
          specialization: 'General',
          section: 'A',
          currentYear: clampedYearC,
          feeLockers: combinedLockers
        };
        newStudents.push(studentData);
      });

      if (newStudents.length > 0) bulkAddStudents(newStudents);

      const totalTxs = newStudents.reduce((sum, s) => sum + s.feeLockers[0].transactions.length, 0);
      setCombinedUploadResult({ students: newStudents.length, transactions: totalTxs, errors });
    } catch {
      setCombinedUploadResult({ students: 0, transactions: 0, errors: ['Failed to parse file. Please check format.'] });
    }
    setIsUploadingCombined(false);
    if (e.target) e.target.value = '';
  };

  const downloadStudentTemplate = () => {
    const headers = ["ROLL NO'S", "NAME OF THE STUDENTS", "FATHERS NAME", "SEX", "Department", "MODE OF ADMISSION", "YEAR OF ADMISSION", "BATCH", "DATE OF BIRTH", "STUDENTS MOBILE NO", "FATHER MOBILE NO", "ADDRESS", "MOTHER'S NAME", "CURRENT YEAR"];
    const sampleRow = ["1604-25-732-001", "JOHN DOE", "JAMES DOE", "M", "CIVIL", "TSMFC", "2025", "2025-29", "15.06.2005", "9876543210", "9876543211", "123 Main St", "JANE DOE", "1"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + sampleRow.join(",");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Student_Bulk_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadFeeTemplate = () => {
    const headers = ["ROLL NO'S", "FEE TYPE", "CHALLAN No.", "CHALLAN DATE", "AMOUNT", "MODE of Payment"];
    const sampleRow = ["1604-25-732-001", "Tuition", "RTGS-001", "22.09.2025", "125000", "CHALLAN"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + sampleRow.join(",");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Fee_Bulk_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCombinedTemplate = () => {
    const headers = ["ROLL NO'S", "NAME OF THE STUDENTS", "FATHERS NAME", "SEX", "Department", "MODE OF ADMISSION", "YEAR OF ADMISSION", "BATCH", "DATE OF BIRTH", "STUDENTS MOBILE NO", "FATHER MOBILE NO", "ADDRESS", "MOTHER'S NAME", "TUITION FEE CHALLAN No.", "TUITION FEE CHALLAN DATE", "TUTION FEE", "MODE of Paymnet", "CHALLAN No.", "CHALLAN DATE", "University FEE", "CURRENT YEAR"];
    const sampleRow = ["1604-25-732-011", "DUDEKULA YOUSUF", "DUDEKULA BASHEER AHAMMAD", "M", "CIVIL", "CONVENER", "2025", "2025-29", "02.06.2007", "8885378935", "9989578655", "HYDERABAD", "D. BASHEER AHAMMAD", "RTGS Conv- 25-26", "22.09.2025", "125000", "CHALLAN", "RTGS Conv- 25-26", "22.09.2025", "12650", "1"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + sampleRow.join(",");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Combined_Student_Fee_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderUploadResult = (result: UploadResult, onDismiss: () => void) => {
    if (!result) return null;
    const hasErrors = result.errors.length > 0;
    const hasSuccess = result.students > 0 || result.transactions > 0;
    return (
      <div className={`mt-3 p-3 rounded-xl text-xs font-bold ${hasErrors ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
        {hasSuccess && (
          <p className="text-emerald-700">
            {result.students > 0 && `${result.students} student(s) imported.`}
            {result.students > 0 && result.transactions > 0 && ' '}
            {result.transactions > 0 && `${result.transactions} transaction(s) added (pending approval).`}
          </p>
        )}
        {!hasSuccess && <p className="text-amber-700">No records were imported.</p>}
        {hasErrors && (
          <div className="mt-2 space-y-0.5 max-h-24 overflow-y-auto">
            {result.errors.map((err, i) => (
              <p key={i} className="text-[10px] text-amber-600 flex items-start space-x-1">
                <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                <span>{err}</span>
              </p>
            ))}
          </div>
        )}
        <button onClick={onDismiss} className="mt-2 text-[10px] text-slate-400 hover:text-slate-600 underline">Dismiss</button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <input type="file" ref={studentFileRef} accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkStudentUpload} />
      <input type="file" ref={feeFileRef} accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkFeeUpload} />
      <input type="file" ref={combinedFileRef} accept=".csv,.xlsx,.xls" className="hidden" onChange={handleCombinedUpload} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a365d] to-[#2c5282] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/mjcet-logo.png" alt="MJCET Logo" className="w-14 h-14 rounded-full bg-white p-1 shadow-md object-contain" />
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide">Muffakham Jah College of Engineering and Technology</h1>
                <p className="text-[11px] text-blue-200 font-medium mt-0.5">Autonomous - Affiliated to Osmania University | NAAC A+ Accredited</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/20">
              <Users size={16} className="text-blue-200" />
              <div>
                <p className="text-[10px] text-blue-200 font-medium">Total Students</p>
                <p className="text-lg font-bold text-white leading-none">{students.length}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#f0f4f8] px-6 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 flex items-center space-x-2">
            <GraduationCap size={16} className="text-[#2c5282]" />
            <span>Student Directory & Fee Management</span>
          </h2>
          <span className="text-[10px] text-slate-400 font-medium">Academic Year 2025-26</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by Roll No or Name..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all min-w-[180px]"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all min-w-[120px]"
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${showBulkUpload ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            <Upload size={16} />
            <span>Bulk Upload</span>
          </button>
          <button 
            onClick={() => { resetForm(); setShowManualModal(true); }}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#2c5282] text-white rounded-lg font-medium text-sm hover:bg-[#1a365d] transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>New Admission</span>
          </button>
        </div>
      </div>

      {showBulkUpload && (
        <div className="space-y-3 animate-in slide-in-from-top duration-200">
          <div className="bg-gradient-to-r from-[#2c5282] to-[#3182ce] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Layers size={16} className="text-white" />
                <h3 className="text-sm font-bold text-white">Combined Upload (Student + Fee Data)</h3>
              </div>
              <p className="text-[10px] text-blue-200 font-medium">20-column Excel/CSV template</p>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={downloadCombinedTemplate} className="flex items-center space-x-1.5 px-3 py-2 bg-white/15 backdrop-blur border border-white/25 rounded-lg text-xs font-medium text-white hover:bg-white/25 transition-colors">
                <Download size={13} />
                <span>Download Template</span>
              </button>
              <button onClick={() => combinedFileRef.current?.click()} disabled={isUploadingCombined} className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-white text-[#2c5282] rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors disabled:opacity-50">
                {isUploadingCombined ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={13} />}
                <span>{isUploadingCombined ? 'Processing...' : 'Upload File'}</span>
              </button>
            </div>
            {combinedUploadResult && (
              <div className={`mt-3 p-3 rounded-lg text-xs font-medium ${combinedUploadResult.errors.length > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-white/90'}`}>
                {(combinedUploadResult.students > 0 || combinedUploadResult.transactions > 0) && (
                  <p className="text-blue-800">{combinedUploadResult.students > 0 && `${combinedUploadResult.students} student(s) imported.`}{combinedUploadResult.students > 0 && combinedUploadResult.transactions > 0 && ' '}{combinedUploadResult.transactions > 0 && `${combinedUploadResult.transactions} transaction(s) added.`}</p>
                )}
                {combinedUploadResult.students === 0 && combinedUploadResult.transactions === 0 && <p className="text-amber-700">No records imported.</p>}
                {combinedUploadResult.errors.length > 0 && (
                  <div className="mt-2 space-y-0.5 max-h-20 overflow-y-auto">{combinedUploadResult.errors.map((err, i) => (<p key={i} className="text-[10px] text-amber-600 flex items-start space-x-1"><AlertTriangle size={10} className="shrink-0 mt-0.5" /><span>{err}</span></p>))}</div>
                )}
                <button onClick={() => setCombinedUploadResult(null)} className="mt-2 text-[10px] text-slate-400 hover:text-slate-600 underline">Dismiss</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><UserPlus size={16} /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Student Only Upload</h3>
                  <p className="text-[10px] text-slate-400">13-column template - no fee data</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={downloadStudentTemplate} className="flex items-center space-x-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                  <Download size={13} /><span>Template</span>
                </button>
                <button onClick={() => studentFileRef.current?.click()} disabled={isUploadingStudents} className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {isUploadingStudents ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={13} />}
                  <span>{isUploadingStudents ? 'Processing...' : 'Upload'}</span>
                </button>
              </div>
              {renderUploadResult(studentUploadResult, () => setStudentUploadResult(null))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><CreditCard size={16} /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Fee Only Upload</h3>
                  <p className="text-[10px] text-slate-400">6-column template - existing students</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={downloadFeeTemplate} className="flex items-center space-x-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                  <Download size={13} /><span>Template</span>
                </button>
                <button onClick={() => feeFileRef.current?.click()} disabled={isUploadingFees} className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isUploadingFees ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={13} />}
                  <span>{isUploadingFees ? 'Processing...' : 'Upload'}</span>
                </button>
              </div>
              {renderUploadResult(feeUploadResult, () => setFeeUploadResult(null))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">Showing <span className="font-bold text-slate-700">{filteredStudents.length}</span> of <span className="font-bold text-slate-700">{students.length}</span> students</p>
          <div className="flex items-center gap-2">
            {departmentFilter && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium border border-blue-100">{departmentFilter}</span>}
            {yearFilter && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-medium border border-emerald-100">Year {yearFilter}</span>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">S.No</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Roll Number</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Admission</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fee Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? filteredStudents.map((student, index) => {
                const locker = student.feeLockers.find(l => l.year === student.currentYear);
                const paid = locker?.transactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0) || 0;
                const target = (locker?.tuitionTarget || 0) + (locker?.universityTarget || 0);
                const progress = target > 0 ? (paid / target) * 100 : 0;

                return (
                  <tr 
                    key={student.hallTicketNumber} 
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={(e) => handleView(e, student.hallTicketNumber)}
                  >
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-400 font-medium">{index + 1}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#2c5282] text-white flex items-center justify-center font-bold text-[10px] uppercase flex-shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-slate-800 uppercase truncate">{student.name}</p>
                            {allRemarks[student.hallTicketNumber] && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setRemarksModalHTN(student.hallTicketNumber); }}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded text-[8px] font-bold hover:bg-amber-100 transition-colors flex-shrink-0"
                                title="View Remarks"
                              >
                                <StickyNote size={10} />
                                {allRemarks[student.hallTicketNumber].length}
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">S/D of {student.fatherName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded">{student.hallTicketNumber}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium text-slate-700 max-w-[180px] truncate">{student.department}</p>
                      <p className="text-[10px] text-slate-400">{student.admissionYear} - Batch {student.batch}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded inline-block ${
                        student.admissionCategory.includes('MANAGEMENT') ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                        student.admissionCategory.includes('CONVENOR') || student.admissionCategory.includes('CONVENER') ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {student.admissionCategory}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="w-full max-w-[110px]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-semibold text-slate-500">{paid.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
                          <span className={`text-[9px] font-bold ${progress >= 100 ? 'text-emerald-600' : progress > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                            {progress >= 100 ? 'PAID' : `${progress.toFixed(0)}%`}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-blue-500' : 'bg-slate-200'}`} 
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center space-x-1">
                        <button 
                          onClick={(e) => handleCollect(e, student.hallTicketNumber)}
                          className="p-1.5 text-[#2c5282] bg-blue-50 border border-blue-100 rounded-md transition-all hover:bg-[#2c5282] hover:text-white hover:border-[#2c5282]"
                          title="Collect Fee"
                        >
                          <Wallet size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleView(e, student.hallTicketNumber)}
                          className="p-1.5 text-slate-400 bg-white border border-slate-200 rounded-md transition-all hover:text-slate-700 hover:bg-slate-50"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setRemarksModalHTN(student.hallTicketNumber); }}
                          className={`p-1.5 border rounded-md transition-all ${allRemarks[student.hallTicketNumber] ? 'text-amber-500 bg-amber-50 border-amber-200 hover:bg-amber-100' : 'text-slate-400 bg-white border-slate-200 hover:text-amber-500 hover:bg-amber-50 hover:border-amber-200'}`}
                          title="Remarks / Notes"
                        >
                          <StickyNote size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleEditClick(e, student)}
                          className="p-1.5 text-slate-400 bg-white border border-slate-200 rounded-md transition-all hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, student.hallTicketNumber, student.name)}
                          className="p-1.5 text-slate-400 bg-white border border-slate-200 rounded-md transition-all hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">No students found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {remarksModalHTN && (() => {
        const student = students.find(s => s.hallTicketNumber === remarksModalHTN);
        const remarks = allRemarks[remarksModalHTN] || [];
        const isAdmin = currentUser?.role === 'ADMIN';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRemarksModalHTN(null)}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><StickyNote size={18} /></div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Student Remarks</h3>
                    <p className="text-xs text-slate-400">{student?.name} - {remarksModalHTN}</p>
                  </div>
                </div>
                <button onClick={() => setRemarksModalHTN(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {remarks.length === 0 ? (
                  <p className="text-center text-slate-300 text-sm py-8">No remarks yet.</p>
                ) : remarks.map(r => (
                  <div key={r.id} className="flex items-start gap-3 bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3">
                    <StickyNote size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{r.remark}</p>
                      <p className="text-[10px] text-slate-400 mt-1">By {r.addedBy} on {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeleteRemark(r.id)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors shrink-0" title="Delete"><Trash2 size={12} /></button>
                    )}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div className="p-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRemark}
                      onChange={(e) => setNewRemark(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddRemark()}
                      placeholder="Add a remark..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
                    />
                    <button
                      onClick={handleAddRemark}
                      disabled={addingRemark || !newRemark.trim()}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      {addingRemark ? '...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl my-8 animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  {isEditing ? <Edit2 size={20} /> : <GraduationCap size={20} />}
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isEditing ? 'Edit Student Profile' : 'New Student Admission'}
                </h3>
              </div>
              <button 
                onClick={() => { setShowManualModal(false); resetForm(); }} 
                className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
              >
                <XCircle />
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll Number</label>
                  <input 
                    required 
                    type="text" 
                    disabled={isEditing}
                    className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none ${isEditing ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`} 
                    value={formData.hallTicketNumber} 
                    onChange={(e) => setFormData({...formData, hallTicketNumber: e.target.value.toUpperCase()})} 
                  />
                  {isEditing && <p className="text-[9px] text-slate-400 mt-1 italic">Roll number cannot be changed once assigned.</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Father's Name</label>
                  <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" value={formData.fatherName} onChange={(e) => setFormData({...formData, fatherName: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mother's Name</label>
                  <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" value={formData.motherName} onChange={(e) => setFormData({...formData, motherName: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Mobile</label>
                  <input required type="tel" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                    {DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" value={formData.admissionCategory} onChange={(e) => setFormData({...formData, admissionCategory: e.target.value})}>
                    <option>TSMFC</option>
                    <option>MANAGEMENT QUOTA</option>
                    <option>CONVENOR</option>
                    <option>SPOT</option>
                    <option>LATERAL ENTRY TSMFC</option>
                    <option>LATERAL ENTRY TSECET</option>
                    <option>LATERAL ENTRY MANAGEMENT</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adm Year</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" value={formData.admissionYear} onChange={(e) => setFormData({...formData, admissionYear: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" value={formData.batch} onChange={(e) => setFormData({...formData, batch: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => { setShowManualModal(false); resetForm(); }} 
                  className="px-6 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-blue-700 transition-all flex items-center space-x-2"
                >
                  {isEditing ? <Save size={14} /> : <CheckCircle2 size={14} />}
                  <span>{isEditing ? 'Save Changes' : 'Register Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
