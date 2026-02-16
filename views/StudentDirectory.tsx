
import React, { useState, useRef } from 'react';
import { useApp } from '../store';
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
  CreditCard
} from 'lucide-react';
import { Student, CourseType, YearLocker, FeeTransaction } from '../types';
import { DEPARTMENTS, COURSES, SECTIONS } from '../constants';

interface StudentDirectoryProps {
  onFeeEntry?: (htn: string) => void;
  onViewStudent?: (htn: string) => void;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({ onFeeEntry, onViewStudent }) => {
  const { students, addStudent, departments, updateStudent, deleteStudent, bulkAddStudents, addTransaction, bulkAddTransactions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHTN, setEditingHTN] = useState<string | null>(null);
  const [isUploadingStudents, setIsUploadingStudents] = useState(false);
  const [isUploadingFees, setIsUploadingFees] = useState(false);
  const [studentUploadResult, setStudentUploadResult] = useState<{count: number; errors: string[]} | null>(null);
  const [feeUploadResult, setFeeUploadResult] = useState<{count: number; errors: string[]} | null>(null);
  const studentFileRef = useRef<HTMLInputElement>(null);
  const feeFileRef = useRef<HTMLInputElement>(null);

  // Form State following College Template
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
    department: DEPARTMENTS[4].name, // Default to CIVIL
    specialization: 'General',
    section: 'A',
    admissionCategory: 'TSMFC',
    admissionYear: '2025',
    batch: '2025-29',
    currentYear: 1
  });

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.hallTicketNumber.includes(searchTerm)
  );

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
      department: DEPARTMENTS[4].name,
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

  const parseCsvRow = (row: string): string[] => {
    const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    return cols.map(c => c.replace(/^"|"$/g, '').trim());
  };

  const handleBulkStudentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingStudents(true);
    setStudentUploadResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
      const dataRows = rows.slice(1);
      const errors: string[] = [];
      const newStudents: Student[] = [];

      const seenHTNs = new Set<string>();
      dataRows.forEach((row, idx) => {
        const cols = parseCsvRow(row);
        if (cols.length < 11) {
          errors.push(`Row ${idx + 2}: Insufficient columns (found ${cols.length}, need at least 11)`);
          return;
        }
        const htnValue = cols[0];
        if (!htnValue) {
          errors.push(`Row ${idx + 2}: Missing Roll Number`);
          return;
        }
        if (seenHTNs.has(htnValue)) {
          errors.push(`Row ${idx + 2}: Duplicate Roll Number ${htnValue} within file (skipped)`);
          return;
        }
        seenHTNs.add(htnValue);
        if (students.find(s => s.hallTicketNumber === htnValue)) {
          errors.push(`Row ${idx + 2}: Roll Number ${htnValue} already exists (skipped)`);
          return;
        }
        const admissionYear = cols[11] || '2025';
        const studentData: Student = {
          hallTicketNumber: htnValue,
          name: (cols[1] || '').toUpperCase(),
          fatherName: (cols[2] || '').toUpperCase(),
          motherName: (cols[3] || '').toUpperCase(),
          sex: cols[4] || 'M',
          dob: cols[5] || '',
          mobile: cols[6] || '',
          fatherMobile: cols[7] || '',
          address: cols[8] || '',
          department: cols[9] || DEPARTMENTS[0].name,
          admissionCategory: cols[10] || 'TSMFC',
          admissionYear,
          batch: cols[12] || `${admissionYear}-${(parseInt(admissionYear) + 4).toString().slice(-2)}`,
          course: 'B.E',
          specialization: 'General',
          section: 'A',
          currentYear: 1,
          feeLockers: [{
            year: 1,
            tuitionTarget: (cols[10] || '').includes('MANAGEMENT') ? 125000 : 100000,
            universityTarget: 12650,
            otherTarget: 0,
            transactions: []
          }]
        };
        newStudents.push(studentData);
      });

      if (newStudents.length > 0) {
        bulkAddStudents(newStudents);
      }
      setStudentUploadResult({ count: newStudents.length, errors });
      setIsUploadingStudents(false);
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const downloadStudentTemplate = () => {
    const headers = ["ROLL NO", "NAME", "FATHER NAME", "MOTHER NAME", "SEX", "DOB", "STUDENT MOBILE", "FATHER MOBILE", "ADDRESS", "DEPARTMENT", "MODE OF ADMISSION", "YEAR OF ADMISSION", "BATCH"];
    const sampleRow = ["24B01A0501", "JOHN DOE", "JAMES DOE", "JANE DOE", "M", "2005-06-15", "9876543210", "9876543211", "123 Main St", "Civil Engineering", "TSMFC", "2025", "2025-29"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + sampleRow.join(",");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Student_Bulk_Upload_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkFeeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFees(true);
    setFeeUploadResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
      const dataRows = rows.slice(1);
      const errors: string[] = [];
      const newTxs: FeeTransaction[] = [];

      dataRows.forEach((row, idx) => {
        const cols = parseCsvRow(row);
        if (cols.length < 7) {
          errors.push(`Row ${idx + 2}: Insufficient columns (found ${cols.length}, need at least 7)`);
          return;
        }
        const htnValue = cols[0];
        if (!htnValue) {
          errors.push(`Row ${idx + 2}: Missing Roll Number`);
          return;
        }
        const student = students.find(s => s.hallTicketNumber === htnValue);
        if (!student) {
          errors.push(`Row ${idx + 2}: Student ${htnValue} not found in directory`);
          return;
        }
        const amount = parseFloat(cols[2]);
        if (isNaN(amount) || amount <= 0) {
          errors.push(`Row ${idx + 2}: Invalid amount "${cols[2]}"`);
          return;
        }

        const rawDate = cols[5] || '';
        const paymentDate = rawDate || new Date().toISOString().split('T')[0];
        const date = new Date(paymentDate);
        if (isNaN(date.getTime())) {
          errors.push(`Row ${idx + 2}: Invalid payment date "${rawDate}"`);
          return;
        }
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const fy = month >= 4 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;

        const tx: FeeTransaction = {
          id: `tx-bulk-${htnValue}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          studentHTN: htnValue,
          feeType: (['Tuition', 'University', 'Other'].includes(cols[1]) ? cols[1] : 'Tuition') as any,
          amount,
          challanNumber: cols[3] || '',
          paymentMode: (['Online', 'Challan', 'DD', 'Cash', 'UPI'].includes(cols[4]) ? cols[4] : 'Challan') as any,
          paymentDate,
          academicYear: cols[6] || '2025-26',
          financialYear: fy,
          status: 'PENDING'
        };
        newTxs.push(tx);
      });

      if (newTxs.length > 0) {
        bulkAddTransactions(newTxs);
      }
      setFeeUploadResult({ count: newTxs.length, errors });
      setIsUploadingFees(false);
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const downloadFeeTemplate = () => {
    const headers = ["ROLL NO", "FEE TYPE", "AMOUNT", "CHALLAN NO", "PAYMENT MODE", "PAYMENT DATE", "ACADEMIC YEAR"];
    const sampleRow = ["24B01A0501", "Tuition", "50000", "CH-2025-001", "Online", "2025-08-15", "2025-26"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + sampleRow.join(",");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "Fee_Bulk_Upload_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <input type="file" ref={studentFileRef} accept=".csv" className="hidden" onChange={handleBulkStudentUpload} />
      <input type="file" ref={feeFileRef} accept=".csv" className="hidden" onChange={handleBulkFeeUpload} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bulk Student Upload</h3>
                <p className="text-[10px] text-slate-400 font-medium">Import multiple students via CSV</p>
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
              <span>{isUploadingStudents ? 'Processing...' : 'Upload CSV'}</span>
            </button>
          </div>
          {studentUploadResult && (
            <div className={`mt-3 p-3 rounded-xl text-xs font-bold ${studentUploadResult.errors.length > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
              <p className={studentUploadResult.count > 0 ? 'text-emerald-700' : 'text-amber-700'}>
                {studentUploadResult.count} student(s) imported successfully.
              </p>
              {studentUploadResult.errors.length > 0 && (
                <div className="mt-2 space-y-0.5 max-h-24 overflow-y-auto">
                  {studentUploadResult.errors.map((err, i) => (
                    <p key={i} className="text-[10px] text-amber-600 flex items-start space-x-1">
                      <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                      <span>{err}</span>
                    </p>
                  ))}
                </div>
              )}
              <button onClick={() => setStudentUploadResult(null)} className="mt-2 text-[10px] text-slate-400 hover:text-slate-600 underline">Dismiss</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bulk Fee Entry</h3>
                <p className="text-[10px] text-slate-400 font-medium">Import fee transactions via CSV</p>
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
              <span>{isUploadingFees ? 'Processing...' : 'Upload CSV'}</span>
            </button>
          </div>
          {feeUploadResult && (
            <div className={`mt-3 p-3 rounded-xl text-xs font-bold ${feeUploadResult.errors.length > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-indigo-50 border border-indigo-100'}`}>
              <p className={feeUploadResult.count > 0 ? 'text-indigo-700' : 'text-amber-700'}>
                {feeUploadResult.count} transaction(s) imported successfully. Pending approval.
              </p>
              {feeUploadResult.errors.length > 0 && (
                <div className="mt-2 space-y-0.5 max-h-24 overflow-y-auto">
                  {feeUploadResult.errors.map((err, i) => (
                    <p key={i} className="text-[10px] text-amber-600 flex items-start space-x-1">
                      <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                      <span>{err}</span>
                    </p>
                  ))}
                </div>
              )}
              <button onClick={() => setFeeUploadResult(null)} className="mt-2 text-[10px] text-slate-400 hover:text-slate-600 underline">Dismiss</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Roll No or Name..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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

      {/* Manual Entry/Edit Modal */}
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
