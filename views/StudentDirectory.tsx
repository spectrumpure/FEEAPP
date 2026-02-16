
import React, { useState, useRef } from 'react';
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
  Layers
} from 'lucide-react';
import { Student, CourseType, YearLocker, FeeTransaction } from '../types';
import { DEPARTMENTS, COURSES, SECTIONS } from '../constants';

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
  const { students, addStudent, departments, updateStudent, deleteStudent, bulkAddStudents, addTransaction, bulkAddTransactions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHTN, setEditingHTN] = useState<string | null>(null);

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

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.hallTicketNumber.includes(searchTerm);
    const matchesDept = !departmentFilter || s.department === departmentFilter;
    return matchesSearch && matchesDept;
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
      const locker: YearLocker = {
        year: 1,
        tuitionTarget: formData.admissionCategory === 'MANAGEMENT QUOTA' ? 125000 : 100000,
        universityTarget: 12650,
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
        const studentData: Student = {
          hallTicketNumber: htnValue,
          name: String(cols[1] || '').toUpperCase(),
          fatherName: String(cols[2] || '').toUpperCase(),
          sex: String(cols[3] || 'M'),
          department: String(cols[4] || DEPARTMENTS[0].name),
          admissionCategory: mode,
          admissionYear: admYear,
          batch: String(cols[7] || `${admYear}-${(parseInt(admYear) + 4).toString().slice(-2)}`),
          dob: normalizeDate(String(cols[8] || '')),
          mobile: String(cols[9] || ''),
          fatherMobile: String(cols[10] || ''),
          address: String(cols[11] || ''),
          motherName: String(cols[12] || '').toUpperCase(),
          course: 'B.E',
          specialization: 'General',
          section: 'A',
          currentYear: 1,
          feeLockers: [{
            year: 1,
            tuitionTarget: mode.includes('MANAGEMENT') ? 125000 : 100000,
            universityTarget: 12650,
            otherTarget: 0,
            transactions: []
          }]
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

        const locker: YearLocker = {
          year: 1,
          tuitionTarget: mode.includes('MANAGEMENT') ? 125000 : 100000,
          universityTarget: 12650,
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

        const studentData: Student = {
          hallTicketNumber: htnValue,
          name: String(cols[1] || '').toUpperCase(),
          fatherName: String(cols[2] || '').toUpperCase(),
          sex: String(cols[3] || 'M'),
          department: String(cols[4] || DEPARTMENTS[0].name),
          admissionCategory: mode,
          admissionYear: admYear,
          batch: String(cols[7] || `${admYear}-${(parseInt(admYear) + 4).toString().slice(-2)}`),
          dob: normalizeDate(String(cols[8] || '')),
          mobile: String(cols[9] || ''),
          fatherMobile: String(cols[10] || ''),
          address: String(cols[11] || ''),
          motherName: String(cols[12] || '').toUpperCase(),
          course: 'B.E',
          specialization: 'General',
          section: 'A',
          currentYear: 1,
          feeLockers: [locker]
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
    const headers = ["ROLL NO'S", "NAME OF THE STUDENTS", "FATHERS NAME", "SEX", "Department", "MODE OF ADMISSION", "YEAR OF ADMISSION", "BATCH", "DATE OF BIRTH", "STUDENTS MOBILE NO", "FATHER MOBILE NO", "ADDRESS", "MOTHER'S NAME"];
    const sampleRow = ["1604-25-732-001", "JOHN DOE", "JAMES DOE", "M", "CIVIL", "TSMFC", "2025", "2025-29", "15.06.2005", "9876543210", "9876543211", "123 Main St", "JANE DOE"];
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
    const headers = ["ROLL NO'S", "NAME OF THE STUDENTS", "FATHERS NAME", "SEX", "Department", "MODE OF ADMISSION", "YEAR OF ADMISSION", "BATCH", "DATE OF BIRTH", "STUDENTS MOBILE NO", "FATHER MOBILE NO", "ADDRESS", "MOTHER'S NAME", "TUITION FEE CHALLAN No.", "TUITION FEE CHALLAN DATE", "TUTION FEE", "MODE of Paymnet", "CHALLAN No.", "CHALLAN DATE", "University FEE"];
    const sampleRow = ["1604-25-732-011", "DUDEKULA YOUSUF", "DUDEKULA BASHEER AHAMMAD", "M", "CIVIL", "CONVENER", "2025", "2025-29", "02.06.2007", "8885378935", "9989578655", "HYDERABAD", "D. BASHEER AHAMMAD", "RTGS Conv- 25-26", "22.09.2025", "125000", "CHALLAN", "RTGS Conv- 25-26", "22.09.2025", "12650"];
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
    <div className="space-y-6">
      <input type="file" ref={studentFileRef} accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkStudentUpload} />
      <input type="file" ref={feeFileRef} accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkFeeUpload} />
      <input type="file" ref={combinedFileRef} accept=".csv,.xlsx,.xls" className="hidden" onChange={handleCombinedUpload} />

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-white/20 rounded-xl">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Combined Bulk Upload</h3>
            <p className="text-[10px] text-blue-100 font-medium">Import students + fee entries together from the master Excel/CSV template</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={downloadCombinedTemplate}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-xs font-bold text-white hover:bg-white/30 transition-colors"
          >
            <Download size={14} />
            <span>Template</span>
          </button>
          <button
            onClick={() => combinedFileRef.current?.click()}
            disabled={isUploadingCombined}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-white text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-md disabled:opacity-50"
          >
            {isUploadingCombined ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            <span>{isUploadingCombined ? 'Processing...' : 'Upload Excel / CSV'}</span>
          </button>
        </div>
        {combinedUploadResult && (
          <div className={`mt-3 p-3 rounded-xl text-xs font-bold ${combinedUploadResult.errors.length > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-white/90 border border-white/50'}`}>
            {(combinedUploadResult.students > 0 || combinedUploadResult.transactions > 0) && (
              <p className="text-blue-800">
                {combinedUploadResult.students > 0 && `${combinedUploadResult.students} student(s) imported.`}
                {combinedUploadResult.students > 0 && combinedUploadResult.transactions > 0 && ' '}
                {combinedUploadResult.transactions > 0 && `${combinedUploadResult.transactions} transaction(s) added (pending approval).`}
              </p>
            )}
            {combinedUploadResult.students === 0 && combinedUploadResult.transactions === 0 && <p className="text-amber-700">No records were imported.</p>}
            {combinedUploadResult.errors.length > 0 && (
              <div className="mt-2 space-y-0.5 max-h-24 overflow-y-auto">
                {combinedUploadResult.errors.map((err, i) => (
                  <p key={i} className="text-[10px] text-amber-600 flex items-start space-x-1">
                    <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </p>
                ))}
              </div>
            )}
            <button onClick={() => setCombinedUploadResult(null)} className="mt-2 text-[10px] text-white/60 hover:text-white underline">Dismiss</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bulk Student Upload</h3>
                <p className="text-[10px] text-slate-400 font-medium">Import students only (no fee data)</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadStudentTemplate}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Download size={14} />
              <span>Template</span>
            </button>
            <button
              onClick={() => studentFileRef.current?.click()}
              disabled={isUploadingStudents}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100 disabled:opacity-50"
            >
              {isUploadingStudents ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              <span>{isUploadingStudents ? 'Processing...' : 'Upload CSV / Excel'}</span>
            </button>
          </div>
          {renderUploadResult(studentUploadResult, () => setStudentUploadResult(null))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bulk Fee Entry</h3>
                <p className="text-[10px] text-slate-400 font-medium">Import fee transactions for existing students</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadFeeTemplate}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Download size={14} />
              <span>Template</span>
            </button>
            <button
              onClick={() => feeFileRef.current?.click()}
              disabled={isUploadingFees}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 disabled:opacity-50"
            >
              {isUploadingFees ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              <span>{isUploadingFees ? 'Processing...' : 'Upload CSV / Excel'}</span>
            </button>
          </div>
          {renderUploadResult(feeUploadResult, () => setFeeUploadResult(null))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Roll No or Name..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm min-w-[200px]"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => { resetForm(); setShowManualModal(true); }}
            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
          >
            <Plus size={18} />
            <span>New Admission</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll No</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collection</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => {
                const locker = student.feeLockers.find(l => l.year === student.currentYear);
                const paid = locker?.transactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0) || 0;
                const target = (locker?.tuitionTarget || 0) + (locker?.universityTarget || 0);
                const progress = target > 0 ? (paid / target) * 100 : 0;

                return (
                  <tr 
                    key={student.hallTicketNumber} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={(e) => handleView(e, student.hallTicketNumber)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-900 uppercase truncate max-w-[150px]">{student.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{student.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">{student.hallTicketNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${
                        student.admissionCategory.includes('MANAGEMENT') ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {student.admissionCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">{student.admissionYear}</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Batch {student.batch}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[100px]">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[9px] font-black ${progress >= 100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {progress >= 100 ? 'PAID' : `${progress.toFixed(0)}%`}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={(e) => handleCollect(e, student.hallTicketNumber)}
                          className="p-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg transition-all hover:bg-blue-600 hover:text-white"
                          title="Collect Fee"
                        >
                          <Wallet size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleView(e, student.hallTicketNumber)}
                          className="p-1.5 bg-white text-slate-400 border border-slate-200 rounded-lg transition-all hover:text-slate-900"
                          title="View Ledger"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleEditClick(e, student)}
                          className="p-1.5 bg-white text-slate-400 border border-slate-200 rounded-lg transition-all hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100"
                          title="Edit Student"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, student.hallTicketNumber, student.name)}
                          className="p-1.5 bg-white text-rose-400 border border-slate-200 rounded-lg transition-all hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100"
                          title="Delete Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">No students found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
