
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
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

interface FeeEntryProps {
  preSelectedHTN?: string | null;
}

export const FeeEntry: React.FC<FeeEntryProps> = ({ preSelectedHTN }) => {
  const { students, addTransaction, bulkAddStudents } = useApp();
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
    academicYear: '2023-24',
    financialYear: calculateFY(new Date().toISOString().split('T')[0])
  });

  // Automatically update Financial Year when Payment Date changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      financialYear: calculateFY(prev.paymentDate)
    }));
  }, [formData.paymentDate]);

  // Handle pre-selection from directory
  useEffect(() => {
    if (preSelectedHTN) {
      const student = students.find(s => s.hallTicketNumber === preSelectedHTN);
      if (student) {
        setSelectedStudent(student);
        setHtn(preSelectedHTN);
      }
    }
  }, [preSelectedHTN, students]);

  const handleSearch = () => {
    const student = students.find(s => s.hallTicketNumber === htn.trim());
    if (student) setSelectedStudent(student);
    else alert("Student not found! Please ensure the Roll Number is correct.");
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
      status: 'PENDING'
    };

    addTransaction(newTx);
    alert(`Success: Fee of ₹${formData.amount} submitted for HTN: ${selectedStudent.hallTicketNumber}. Approval pending from Accountant.`);
    
    // Reset state
    setHtn('');
    setSelectedStudent(null);
    setFormData({ ...formData, amount: '', challanNumber: '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
      const dataRows = rows.slice(1);
      
      const newStudentsToSync: Student[] = [];

      dataRows.forEach(row => {
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());

        if (cleanCols.length < 13) return;

        const htnValue = cleanCols[0];
        const studentData: Student = {
          hallTicketNumber: htnValue,
          name: cleanCols[1],
          fatherName: cleanCols[2],
          sex: cleanCols[3],
          department: cleanCols[4],
          admissionCategory: cleanCols[5],
          admissionYear: cleanCols[6],
          batch: cleanCols[7],
          dob: cleanCols[8],
          mobile: cleanCols[9],
          fatherMobile: cleanCols[10],
          address: cleanCols[11],
          motherName: cleanCols[12],
          course: 'B.E',
          specialization: 'General',
          section: 'A',
          currentYear: 1,
          feeLockers: []
        };

        const locker: YearLocker = {
          year: 1,
          tuitionTarget: studentData.admissionCategory === 'MANAGEMENT QUOTA' ? 125000 : 100000,
          universityTarget: 12650,
          otherTarget: 0,
          transactions: []
        };

        // All transactions from bulk upload are set to PENDING
        const tuiAmount = parseFloat(cleanCols[15]) || 0;
        if (tuiAmount > 0) {
          locker.transactions.push({
            id: `tx-tui-${htnValue}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            studentHTN: htnValue,
            feeType: 'Tuition',
            amount: tuiAmount,
            challanNumber: cleanCols[13],
            paymentMode: (cleanCols[16] as any) || 'Challan',
            paymentDate: cleanCols[14],
            academicYear: '2023-24',
            financialYear: '2023-24',
            status: 'PENDING'
          });
        }

        const univRaw = cleanCols[19] || "0";
        const univAmount = parseFloat(univRaw) || 0;
        if (univAmount > 0) {
          locker.transactions.push({
            id: `tx-uni-${htnValue}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            studentHTN: htnValue,
            feeType: 'University',
            amount: univAmount,
            challanNumber: cleanCols[17],
            paymentMode: (cleanCols[16] as any) || 'Challan',
            paymentDate: cleanCols[18],
            academicYear: '2023-24',
            financialYear: '2023-24',
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

      setIsUploading(false);
      if (e.target) e.target.value = '';
    };

    reader.readAsText(file);
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

                  {/* Student Academic Context Fields */}
                  <div className="grid grid-cols-2 gap-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 border-dashed">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Year of Admission</label>
                      <input 
                        type="text" 
                        readOnly
                        className="w-full bg-white/50 border border-blue-100 rounded-xl px-4 py-2 text-sm font-bold text-blue-800 cursor-not-allowed"
                        value={selectedStudent.admissionYear}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Student Batch</label>
                      <input 
                        type="text" 
                        readOnly
                        className="w-full bg-white/50 border border-blue-100 rounded-xl px-4 py-2 text-sm font-bold text-blue-800 cursor-not-allowed"
                        value={selectedStudent.batch}
                      />
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
                      <input 
                        type="text"
                        required
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                        value={formData.academicYear}
                        onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                      />
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
                  <input type="file" className="hidden" id="bulk-csv-upload" accept=".csv" onChange={handleFileUpload} />
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
