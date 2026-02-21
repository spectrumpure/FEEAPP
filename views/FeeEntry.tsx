
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import * as XLSX from 'xlsx';
import { 
  CreditCard, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  FileSpreadsheet, 
  Download,
  User,
  PlusCircle,
  History,
  Info
} from 'lucide-react';
import { FeeType, PaymentMode, FeeTransaction, Student, YearLocker } from '../types';
import { DEPARTMENTS, normalizeDepartment } from '../constants';

interface FeeEntryProps {
  preSelectedHTN?: string | null;
}

export const FeeEntry: React.FC<FeeEntryProps> = ({ preSelectedHTN }) => {
  const { students, addTransaction, bulkAddStudents, getFeeTargets } = useApp();
  const [activeMode, setActiveMode] = useState<'manual' | 'bulk'>('manual');
  const [htn, setHtn] = useState(preSelectedHTN || '');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const calculateFY = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '2023-24';
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    // Financial year in India starts from April
    if (month >= 4) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  };

  const [formData, setFormData] = useState({
    feeType: 'Tuition' as FeeType,
    amount: '',
    challanNumber: '',
    paymentMode: 'Online' as PaymentMode,
    paymentDate: new Date().toISOString().split('T')[0],
    selectedYear: 1,
    academicYear: '2025-26',
    financialYear: calculateFY(new Date().toISOString().split('T')[0])
  });

  const getMaxYears = (student: Student | null): number => {
    if (!student) return 4;
    const dept = DEPARTMENTS.find(d => d.name === student.department);
    if (dept) return dept.duration;
    return student.course === 'M.E' ? 2 : 4;
  };

  const computeAcademicYear = (admissionYear: string, yearNum: number): string => {
    const baseYear = parseInt(admissionYear) || 2025;
    const startYear = baseYear + (yearNum - 1);
    return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      financialYear: calculateFY(prev.paymentDate)
    }));
  }, [formData.paymentDate]);

  useEffect(() => {
    if (selectedStudent) {
      const acYear = computeAcademicYear(selectedStudent.admissionYear, formData.selectedYear);
      setFormData(prev => ({ ...prev, academicYear: acYear }));
    }
  }, [formData.selectedYear, selectedStudent]);

  useEffect(() => {
    if (preSelectedHTN) {
      const student = students.find(s => s.hallTicketNumber === preSelectedHTN);
      if (student) {
        setSelectedStudent(student);
        setHtn(preSelectedHTN);
        setFormData(prev => ({ ...prev, selectedYear: student.currentYear }));
      }
    }
  }, [preSelectedHTN, students]);

  const handleSearch = () => {
    const student = students.find(s => s.hallTicketNumber === htn.trim());
    if (student) {
      setSelectedStudent(student);
      setFormData(prev => ({ ...prev, selectedYear: student.currentYear }));
    } else {
      alert("Student not found! Please ensure the Roll Number is correct.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const newTx: FeeTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      studentHTN: selectedStudent.hallTicketNumber,
      feeType: formData.feeType,
      amount: parseFloat(formData.amount),
      challanNumber: formData.challanNumber,
      paymentMode: formData.paymentMode,
      paymentDate: formData.paymentDate,
      academicYear: formData.academicYear,
      financialYear: formData.financialYear,
      status: 'PENDING',
      targetYear: formData.selectedYear
    };

    addTransaction(newTx);
    alert(`Success: Fee of ₹${formData.amount} submitted for HTN: ${selectedStudent.hallTicketNumber}. Approval pending from Accountant.`);
    
    // Reset state
    setHtn('');
    setSelectedStudent(null);
    setFormData({ ...formData, amount: '', challanNumber: '' });
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
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      if (isExcel) reader.readAsArrayBuffer(file);
      else reader.readAsText(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const allRows = await parseFileToRows(file);
      const dataRows = allRows.slice(1);
      const newStudentsToSync: Student[] = [];

      dataRows.forEach(row => {
        const cleanCols = row.map(c => String(c).trim());
        if (cleanCols.length < 13) return;

        const htnValue = cleanCols[0];
        const mode = cleanCols[5].toUpperCase();
        const admYear = String(cleanCols[6] || '2025');
        const admYearNum = parseInt(admYear) || 2025;
        const acYear = `${admYearNum}-${(admYearNum + 1).toString().slice(-2)}`;

        const normalizedDept = normalizeDepartment(cleanCols[4]);
        const deptInfo = DEPARTMENTS.find(d => d.code === normalizedDept || d.name === normalizedDept || d.code.toUpperCase() === normalizedDept.toUpperCase());
        const isME = deptInfo?.courseType === 'M.E' || normalizedDept.startsWith('ME-');
        const duration = deptInfo?.duration || (isME ? 2 : 4);
        const targets = getFeeTargets(normalizedDept, 1, undefined, String(cleanCols[12] || '2025'));

        const studentData: Student = {
          hallTicketNumber: htnValue,
          name: cleanCols[1].toUpperCase(),
          fatherName: cleanCols[2].toUpperCase(),
          sex: cleanCols[3],
          department: normalizedDept,
          admissionCategory: mode,
          admissionYear: admYear,
          batch: cleanCols[7] || `${admYear}-${admYearNum + duration}`,
          dob: normalizeDate(cleanCols[8]),
          mobile: cleanCols[9],
          fatherMobile: cleanCols[10],
          address: cleanCols[11],
          motherName: cleanCols[12].toUpperCase(),
          course: isME ? 'M.E' : 'B.E',
          specialization: 'General',
          section: 'A',
          currentYear: 1,
          aadhaarNumber: '',
          entryType: 'REGULAR',
          feeLockers: []
        };

        const locker: YearLocker = {
          year: 1,
          tuitionTarget: targets.tuition,
          universityTarget: targets.university,
          otherTarget: 0,
          transactions: []
        };

        const tuiAmount = parseFloat(cleanCols[15]) || 0;
        const tuiDate = normalizeDate(cleanCols[14]);
        if (tuiAmount > 0 && tuiDate) {
          const fy = computeFY(tuiDate) || acYear;
          locker.transactions.push({
            id: `tx-tui-${htnValue}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            studentHTN: htnValue,
            feeType: 'Tuition',
            amount: tuiAmount,
            challanNumber: cleanCols[13],
            paymentMode: (['Online', 'Challan', 'DD', 'Cash', 'UPI'].includes(cleanCols[16]) ? cleanCols[16] : 'Challan') as any,
            paymentDate: tuiDate,
            academicYear: acYear,
            financialYear: fy,
            status: 'PENDING'
          });
        }

        const univAmount = parseFloat(cleanCols[19] || '0') || 0;
        const univDate = normalizeDate(cleanCols[18]);
        if (univAmount > 0 && univDate) {
          const fy = computeFY(univDate) || acYear;
          locker.transactions.push({
            id: `tx-uni-${htnValue}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            studentHTN: htnValue,
            feeType: 'University',
            amount: univAmount,
            challanNumber: cleanCols[17],
            paymentMode: (['Online', 'Challan', 'DD', 'Cash', 'UPI'].includes(cleanCols[16]) ? cleanCols[16] : 'Challan') as any,
            paymentDate: univDate,
            academicYear: acYear,
            financialYear: fy,
            status: 'PENDING'
          });
        }

        studentData.feeLockers = [locker];
        newStudentsToSync.push(studentData);
      });

      if (newStudentsToSync.length > 0) {
        bulkAddStudents(newStudentsToSync);
        alert(`Success: Processed ${newStudentsToSync.length} student records. All associated transactions have been sent to the Accountant's Approvals queue.`);
      }
    } catch {
      alert('Error: Failed to parse file. Please check the format.');
    }

    setIsUploading(false);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex space-x-1 shadow-inner border border-slate-200">
          <button 
            onClick={() => setActiveMode('manual')}
            className={`flex items-center space-x-2 px-8 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeMode === 'manual' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <PlusCircle size={18} />
            <span>Manual Entry</span>
          </button>
          <button 
            onClick={() => setActiveMode('bulk')}
            className={`flex items-center space-x-2 px-8 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeMode === 'bulk' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload size={18} />
            <span>Bulk Upload</span>
          </button>
        </div>
      </div>

      {activeMode === 'manual' ? (
        <div className="space-y-6">
          {!selectedStudent ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 text-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Manual Fee Collector</h3>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto">Search for a student to record a new fee payment transaction.</p>
              
              <div className="flex max-w-md mx-auto relative">
                <input 
                  type="text" 
                  placeholder="Enter Roll Number (HTN)" 
                  className="flex-1 pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-mono font-bold text-slate-700 uppercase"
                  value={htn}
                  onChange={(e) => setHtn(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button 
                  onClick={handleSearch}
                  className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Student Context Card */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-100">
                      {selectedStudent.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 uppercase leading-tight">{selectedStudent.name}</h4>
                      <p className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase">{selectedStudent.hallTicketNumber}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Academic Stream</p>
                      <p className="text-xs font-bold text-slate-700">{selectedStudent.department}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Status</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-tighter">Year {selectedStudent.currentYear}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-tighter">Sec {selectedStudent.section}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => { setSelectedStudent(null); setHtn(''); }}
                  className="w-full py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <History size={16} />
                  <span>Change Student</span>
                </button>
              </div>

              {/* Fee Entry Form */}
              <div className="md:col-span-2">
                <form onSubmit={handleManualSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 space-y-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <CreditCard size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Payment Collection Form</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 border-dashed">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Year</label>
                      <select
                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-800 outline-none focus:ring-2 focus:ring-blue-200"
                        value={formData.selectedYear}
                        onChange={(e) => setFormData({...formData, selectedYear: parseInt(e.target.value)})}
                      >
                        {Array.from({ length: getMaxYears(selectedStudent) }, (_, i) => i + 1).map(yr => (
                          <option key={yr} value={yr}>
                            {yr === 1 ? '1st' : yr === 2 ? '2nd' : yr === 3 ? '3rd' : `${yr}th`} Year
                          </option>
                        ))}
                      </select>
                      <p className="text-[8px] text-blue-400 font-medium">
                        {selectedStudent.course === 'M.E' || selectedStudent.department.startsWith('M.E') ? 'M.E (2 years)' : 'B.E (4 years)'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Academic Year</label>
                      <input 
                        type="text" 
                        readOnly
                        className="w-full bg-slate-100 border border-blue-100 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-800 cursor-not-allowed"
                        value={formData.academicYear}
                        title="Auto-calculated from admission year and selected year"
                      />
                      <p className="text-[8px] text-blue-400 font-medium">Auto-calculated</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Batch</label>
                      <input 
                        type="text" 
                        readOnly
                        className="w-full bg-slate-100 border border-blue-100 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-800 cursor-not-allowed"
                        value={selectedStudent.batch}
                      />
                      <p className="text-[8px] text-blue-400 font-medium">Adm. Year: {selectedStudent.admissionYear}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee Classification</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                        value={formData.feeType}
                        onChange={(e) => setFormData({...formData, feeType: e.target.value as FeeType})}
                      >
                        <option>Tuition</option>
                        <option>University</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Mode</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                        value={formData.paymentMode}
                        onChange={(e) => setFormData({...formData, paymentMode: e.target.value as PaymentMode})}
                      >
                        <option>Online</option>
                        <option>Challan</option>
                        <option>DD</option>
                        <option>Cash</option>
                        <option>UPI</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable Amount (₹)</label>
                      <input 
                        type="number"
                        required
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-100"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Challan / Ref ID</label>
                      <input 
                        type="text"
                        required
                        placeholder="Unique Ref Number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                        value={formData.challanNumber}
                        onChange={(e) => setFormData({...formData, challanNumber: e.target.value.toUpperCase()})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entry Date</label>
                      <input 
                        type="date"
                        required
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-100"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Academic Year</label>
                      <div className="relative">
                        <input 
                          type="text"
                          readOnly
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-black text-blue-600 outline-none cursor-help"
                          value={formData.academicYear}
                          title="Auto-calculated based on year selection"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <Info size={12} className="text-blue-300" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fin. Year</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          readOnly
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-black text-blue-600 outline-none cursor-help"
                          value={formData.financialYear}
                          title="Automatically calculated from Entry Date (Apr-Mar cycle)"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <Info size={12} className="text-blue-300" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3">
                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-[11px] text-amber-700 leading-relaxed font-semibold uppercase tracking-tighter">
                      All entries require Accountant approval. The student ledger will reflect updated balances only after approval of this transaction.
                    </p>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 size={20} />
                    <span>Post Transaction for Approval</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Bulk Upload Mode */
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 text-center animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <FileSpreadsheet size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3">Bulk Ledger Synchronization</h3>
          <p className="text-slate-500 mb-10 max-w-lg mx-auto font-medium">
            Upload the standard Engineering College Fee Excel/CSV file to process multiple student records simultaneously.
          </p>

          <div className={`max-w-2xl mx-auto border-4 border-dashed rounded-3xl p-12 transition-all ${
            isUploading ? 'bg-indigo-50 border-indigo-200 scale-95' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
          }`}>
            {isUploading ? (
              <div className="space-y-6">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <p className="font-black text-indigo-900">Validating Ledger Records...</p>
                  <p className="text-xs text-indigo-400 mt-1 font-bold">Please do not refresh the page.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm font-bold text-slate-700 mb-2">Drag and drop file here or click to browse</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Supported formats: .CSV, .XLSX</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      const headers = ["ROLL NO'S", "NAME OF THE STUDENTS", "FATHERS NAME", "SEX", "Department", "MODE OF ADMISSION", "YEAR OF ADMISSION", "BATCH", "DATE OF BIRTH", "STUDENTS MOBILE NO", "FATHER MOBILE NO", "ADDRESS", "MOTHER'S NAME", "TUITION FEE CHALLAN No.", "TUITION FEE CHALLAN DATE", "TUTION FEE", "MODE of Paymnet", "CHALLAN No.", "CHALLAN DATE", "University FEE"];
                      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "Fee_Ledger_Template.csv");
                      document.body.appendChild(link);
                      link.click();
                    }}
                    className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-xs text-indigo-600 shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <Download size={16} />
                    <span>Download Master Template</span>
                  </a>
                  
                  <label htmlFor="bulk-csv-upload" className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs cursor-pointer shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center space-x-2">
                    <Upload size={16} />
                    <span>Select Master Ledger</span>
                  </label>
                  <input type="file" className="hidden" id="bulk-csv-upload" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-10 flex items-center justify-center space-x-8 text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Accountant Review Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Bulk Entry Support</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
