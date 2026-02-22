
import React, { useState } from 'react';
import { useApp } from '../store';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Users,
  IndianRupee,
  FileText,
  Loader2,
  X,
  Info,
  Table2,
  Columns3
} from 'lucide-react';
import { FeeTransaction, Student, YearLocker } from '../types';
import { normalizeDepartment } from '../constants';

const STUDENT_HEADERS = [
  'Roll No', 'Student Name', 'Department', 'Sex', 'Date of Birth',
  'Mode of Admission', 'Student Mobile No', 'Father Mobile No',
  'Father Name', 'Mother Name', 'Address', 'Student Aadhaar Card No',
  'Admission Year', 'Entry Type'
];

const FEE_HEADERS = [
  'Roll No', 'Student Name', 'Department',
  'Tuition Fee Challan Date', 'Tuition Fee Mode of Payment', 'Tuition Fee',
  'University Fee Mode of Payment', 'University Fee Challan No',
  'University Fee Challan Date', 'University Fee', 'Fee Year'
];

const COMBINED_HEADERS = [
  ...STUDENT_HEADERS,
  'Current Year', 'Tuition Fee Challan No', 'Tuition Fee Challan Date',
  'Tuition Fee Mode of Payment', 'Tuition Fee',
  'University Fee Mode of Payment', 'University Fee Challan No',
  'University Fee Challan Date', 'University Fee', 'Fee Year'
];

type UploadType = 'student' | 'fee' | 'combined' | 'multiyear';

interface UploadResult {
  type: UploadType;
  total: number;
  success: number;
  errors: string[];
}

const normalizeHeader = (h: string): string => {
  return h.trim().toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const HEADER_ALIASES: Record<string, string[]> = {
  'roll_no': ['roll no', 'roll nos', 'roll number', 'hall ticket number', 'htn', 'rollno', 'roll', 'enrollment no', 'enrollment number', 'enroll no'],
  'student_name': ['student name', 'name of the students', 'name of the student', 'student', 'name', 'full name', 'students name'],
  'department': ['department', 'dept', 'branch', 'program', 'course', 'specialization'],
  'sex': ['sex', 'gender', 'm f', 'male female'],
  'dob': ['date of birth', 'dob', 'birth date', 'dateofbirth', 'birthday'],
  'mode_of_admission': ['mode of admission', 'admission mode', 'admission category', 'category', 'quota', 'seat type', 'admission type'],
  'student_mobile': ['student mobile no', 'students mobile no', 'student mobile', 'mobile no', 'mobile number', 'phone', 'contact no', 'student phone'],
  'father_mobile': ['father mobile no', 'fathers mobile no', 'father mobile', 'father phone', 'parent mobile', 'guardian mobile'],
  'father_name': ['father name', 'fathers name', 'father', 'parent name', 'guardian name'],
  'mother_name': ['mother name', 'mothers name', 'mother'],
  'address': ['address', 'permanent address', 'residential address', 'home address', 'communication address'],
  'aadhaar': ['student aadhaar card no', 'aadhaar', 'aadhaar no', 'aadhaar number', 'aadhar', 'aadhar no', 'uid', 'aadhaar card'],
  'admission_year': ['admission year', 'year of admission', 'adm year', 'joining year', 'year'],
  'entry_type': ['entry type', 'lateral', 'lateral entry', 'regular lateral', 'entry'],
  'current_year': ['current year', 'curr year', 'present year', 'studying year'],
  'tuition_challan_no': ['tuition fee challan no', 'tuition challan no', 'tui challan no', 'tuition fee challan number'],
  'tuition_challan_date': ['tuition fee challan date', 'tuition challan date', 'tui challan date', 'tuition fee date', 'tuition date'],
  'tuition_payment_mode': ['tuition fee mode of payment', 'tuition mode of payment', 'tuition payment mode', 'mode of payment', 'payment mode', 'tui mode'],
  'tuition_fee': ['tuition fee', 'tution fee', 'tuition amount', 'tuition', 'tui fee'],
  'university_payment_mode': ['university fee mode of payment', 'uni mode of payment', 'university payment mode', 'uni mode'],
  'university_challan_no': ['university fee challan no', 'challan no', 'uni challan no', 'university challan number', 'uni challan number'],
  'university_challan_date': ['university fee challan date', 'challan date', 'uni challan date', 'university date', 'uni date'],
  'university_fee': ['university fee', 'uni fee', 'university amount', 'university'],
  'fee_year': ['fee year', 'year', 'academic year', 'year of fee', 'for year'],
  'batch': ['batch', 'batch year', 'passing year'],
};

function detectMultiYearColumns(fileHeaders: string[]): Record<number, { tuitionIdx: number; universityIdx: number }> | null {
  const yearCols: Record<number, { tuitionIdx: number; universityIdx: number }> = {};
  const normalized = fileHeaders.map(h => h.trim().toLowerCase().replace(/\s+/g, ' '));
  
  for (let i = 0; i < normalized.length; i++) {
    const h = normalized[i];
    const tuiMatch = h.match(/^(\d)\s*(?:st|nd|rd|th)?\s*year\s*[-–]?\s*tuition/i) || h.match(/^(\d)\s*year\s*[-–]?\s*tuition/i);
    const uniMatch = h.match(/^(\d)\s*(?:st|nd|rd|th)?\s*year\s*[-–]?\s*university/i) || h.match(/^(\d)\s*year\s*[-–]?\s*university/i);
    
    if (tuiMatch) {
      const yr = parseInt(tuiMatch[1]);
      if (!yearCols[yr]) yearCols[yr] = { tuitionIdx: -1, universityIdx: -1 };
      yearCols[yr].tuitionIdx = i;
    }
    if (uniMatch) {
      const yr = parseInt(uniMatch[1]);
      if (!yearCols[yr]) yearCols[yr] = { tuitionIdx: -1, universityIdx: -1 };
      yearCols[yr].universityIdx = i;
    }
  }
  
  const validYears = Object.entries(yearCols).filter(([_, v]) => v.tuitionIdx >= 0 || v.universityIdx >= 0);
  if (validYears.length >= 1) return yearCols;
  return null;
}

function matchHeaders(fileHeaders: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const normalizedFileHeaders = fileHeaders.map(normalizeHeader);

  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    for (let i = 0; i < normalizedFileHeaders.length; i++) {
      const fh = normalizedFileHeaders[i];
      if (aliases.some(a => fh === a || fh.includes(a) || a.includes(fh))) {
        if (!mapping[key]) {
          mapping[key] = i;
          break;
        }
      }
    }
  }
  return mapping;
}

function detectUploadType(mapping: Record<string, number>): UploadType | null {
  const hasStudentFields = ['roll_no', 'student_name', 'department', 'father_name'].every(k => k in mapping);
  const hasFeeFields = ['roll_no', 'tuition_fee'].some(k => k in mapping) && ('university_fee' in mapping);
  const hasAdmissionFields = ['admission_year', 'mode_of_admission'].some(k => k in mapping);

  if (hasStudentFields && hasFeeFields && hasAdmissionFields) return 'combined';
  if (hasFeeFields) return 'fee';
  if (hasStudentFields) return 'student';
  return null;
}

export const BulkUpload: React.FC = () => {
  const { students, departments, bulkAddStudents, bulkAddTransactions, getFeeTargets } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [detectedType, setDetectedType] = useState<UploadType | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [mappedFields, setMappedFields] = useState<Record<string, number>>({});
  const [showMappingPreview, setShowMappingPreview] = useState(false);

  const normalizeDate = (raw: string): string => {
    if (!raw) return '';
    const cleaned = String(raw).trim();
    const formats = [
      /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/,
      /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/,
    ];
    for (const fmt of formats) {
      const m = cleaned.match(fmt);
      if (m) {
        const d = new Date(cleaned);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      }
    }
    const d = new Date(cleaned);
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

  const getCol = (row: string[], mapping: Record<string, number>, key: string): string => {
    const idx = mapping[key];
    if (idx === undefined || idx >= row.length) return '';
    return String(row[idx]).trim();
  };

  const processStudentUpload = (dataRows: string[][], mapping: Record<string, number>): UploadResult => {
    const errors: string[] = [];
    const newStudents: Student[] = [];

    dataRows.forEach((row, rowIdx) => {
      try {
        const htn = getCol(row, mapping, 'roll_no');
        const name = getCol(row, mapping, 'student_name');
        if (!htn || !name) {
          errors.push(`Row ${rowIdx + 2}: Missing Roll No or Student Name`);
          return;
        }

        const dept = normalizeDepartment(getCol(row, mapping, 'department'));
        const deptInfo = departments.find(d => d.code === dept || d.name === dept || d.code.toUpperCase() === dept.toUpperCase());
        const isME = deptInfo?.courseType === 'M.E' || dept.startsWith('ME-');
        const duration = deptInfo?.duration || (isME ? 2 : 4);
        const admYear = getCol(row, mapping, 'admission_year') || '2025';
        const admYearNum = parseInt(admYear) || 2025;
        const entryTypeRaw = getCol(row, mapping, 'entry_type').toUpperCase();
        const entryType: 'REGULAR' | 'LATERAL' = entryTypeRaw.includes('LATERAL') ? 'LATERAL' : 'REGULAR';
        const batchEnd = entryType === 'LATERAL' ? admYearNum + 3 : admYearNum + duration;
        const currentYearRaw = parseInt(getCol(row, mapping, 'current_year')) || 0;

        const student: Student = {
          hallTicketNumber: htn,
          name: name.toUpperCase(),
          department: dept,
          sex: getCol(row, mapping, 'sex') || '',
          dob: normalizeDate(getCol(row, mapping, 'dob')),
          admissionCategory: getCol(row, mapping, 'mode_of_admission').toUpperCase() || 'TSMFC',
          mobile: getCol(row, mapping, 'student_mobile'),
          fatherMobile: getCol(row, mapping, 'father_mobile'),
          fatherName: getCol(row, mapping, 'father_name').toUpperCase(),
          motherName: getCol(row, mapping, 'mother_name').toUpperCase(),
          address: getCol(row, mapping, 'address'),
          aadhaarNumber: getCol(row, mapping, 'aadhaar'),
          admissionYear: admYear,
          entryType,
          course: isME ? 'M.E' : 'B.E',
          specialization: 'General',
          section: 'A',
          currentYear: currentYearRaw || 1,
          batch: `${admYear}-${batchEnd}`,
          feeLockers: []
        };

        if (currentYearRaw > 0) {
          const startYear = entryType === 'LATERAL' ? 2 : 1;
          for (let y = startYear; y <= Math.min(currentYearRaw, duration); y++) {
            const targets = getFeeTargets(dept, y, entryType, admYear);
            student.feeLockers.push({
              year: y,
              tuitionTarget: targets.tuition,
              universityTarget: targets.university,
              otherTarget: 0,
              transactions: []
            });
          }
        }

        newStudents.push(student);
      } catch (err) {
        errors.push(`Row ${rowIdx + 2}: Processing error`);
      }
    });

    if (newStudents.length > 0) {
      bulkAddStudents(newStudents);
    }

    return { type: 'student', total: dataRows.length, success: newStudents.length, errors };
  };

  const processFeeUpload = (dataRows: string[][], mapping: Record<string, number>): UploadResult => {
    const errors: string[] = [];
    const newStudents: Student[] = [];

    dataRows.forEach((row, rowIdx) => {
      try {
        const htn = getCol(row, mapping, 'roll_no');
        if (!htn) {
          errors.push(`Row ${rowIdx + 2}: Missing Roll No`);
          return;
        }

        const existingStudent = students.find(s => s.hallTicketNumber.toLowerCase() === htn.toLowerCase());
        const feeYearRaw = getCol(row, mapping, 'fee_year');
        const feeYear = parseInt(feeYearRaw) || 1;
        const dept = getCol(row, mapping, 'department') ? normalizeDepartment(getCol(row, mapping, 'department')) : (existingStudent?.department || '');
        const admYear = existingStudent?.admissionYear || '2025';
        const admYearNum = parseInt(admYear) || 2025;
        const acYear = `${admYearNum + feeYear - 1}-${(admYearNum + feeYear).toString().slice(-2)}`;

        const targets = getFeeTargets(dept, feeYear, existingStudent?.entryType, admYear);

        const locker: YearLocker = {
          year: feeYear,
          tuitionTarget: targets.tuition,
          universityTarget: targets.university,
          otherTarget: 0,
          transactions: []
        };

        const tuiFee = parseFloat(getCol(row, mapping, 'tuition_fee')) || 0;
        const tuiDate = normalizeDate(getCol(row, mapping, 'tuition_challan_date'));
        const tuiMode = getCol(row, mapping, 'tuition_payment_mode');
        const tuiChallan = getCol(row, mapping, 'tuition_challan_no');

        if (tuiFee > 0) {
          const fy = tuiDate ? computeFY(tuiDate) : acYear;
          locker.transactions.push({
            id: `tx-tui-${htn}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            studentHTN: htn,
            feeType: 'Tuition',
            amount: tuiFee,
            challanNumber: tuiChallan,
            paymentMode: (['Online', 'Challan', 'DD', 'Cash', 'UPI'].includes(tuiMode) ? tuiMode : 'Challan') as any,
            paymentDate: tuiDate || new Date().toISOString().split('T')[0],
            academicYear: acYear,
            financialYear: fy || acYear,
            status: 'PENDING'
          });
        }

        const uniFee = parseFloat(getCol(row, mapping, 'university_fee')) || 0;
        const uniDate = normalizeDate(getCol(row, mapping, 'university_challan_date'));
        const uniMode = getCol(row, mapping, 'university_payment_mode');
        const uniChallan = getCol(row, mapping, 'university_challan_no');

        if (uniFee > 0) {
          const fy = uniDate ? computeFY(uniDate) : acYear;
          locker.transactions.push({
            id: `tx-uni-${htn}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            studentHTN: htn,
            feeType: 'University',
            amount: uniFee,
            challanNumber: uniChallan,
            paymentMode: (['Online', 'Challan', 'DD', 'Cash', 'UPI'].includes(uniMode) ? uniMode : 'Challan') as any,
            paymentDate: uniDate || new Date().toISOString().split('T')[0],
            academicYear: acYear,
            financialYear: fy || acYear,
            status: 'PENDING'
          });
        }

        if (locker.transactions.length > 0) {
          if (existingStudent) {
            const mergedLockers = [...existingStudent.feeLockers];
            const existingLockerIdx = mergedLockers.findIndex(l => l.year === feeYear);
            if (existingLockerIdx >= 0) {
              mergedLockers[existingLockerIdx] = {
                ...mergedLockers[existingLockerIdx],
                transactions: [...mergedLockers[existingLockerIdx].transactions, ...locker.transactions]
              };
            } else {
              mergedLockers.push(locker);
            }
            mergedLockers.sort((a, b) => a.year - b.year);
            const studentCopy: Student = {
              ...existingStudent,
              feeLockers: mergedLockers
            };
            newStudents.push(studentCopy);
          } else {
            const studentName = getCol(row, mapping, 'student_name') || 'Unknown';
            const studentData: Student = {
              hallTicketNumber: htn,
              name: studentName.toUpperCase(),
              department: dept,
              sex: '',
              dob: '',
              admissionCategory: 'TSMFC',
              mobile: '',
              fatherMobile: '',
              fatherName: '',
              motherName: '',
              address: '',
              aadhaarNumber: '',
              admissionYear: admYear,
              entryType: 'REGULAR',
              course: dept.startsWith('ME-') ? 'M.E' : 'B.E',
              specialization: 'General',
              section: 'A',
              currentYear: feeYear,
              batch: '',
              feeLockers: [locker]
            };
            newStudents.push(studentData);
          }
        }
      } catch (err) {
        errors.push(`Row ${rowIdx + 2}: Processing error`);
      }
    });

    if (newStudents.length > 0) {
      bulkAddStudents(newStudents);
    }

    return { type: 'fee', total: dataRows.length, success: newStudents.length, errors };
  };

  const processCombinedUpload = (dataRows: string[][], mapping: Record<string, number>): UploadResult => {
    const errors: string[] = [];
    const newStudents: Student[] = [];

    dataRows.forEach((row, rowIdx) => {
      try {
        const htn = getCol(row, mapping, 'roll_no');
        const name = getCol(row, mapping, 'student_name');
        if (!htn || !name) {
          errors.push(`Row ${rowIdx + 2}: Missing Roll No or Student Name`);
          return;
        }

        const dept = normalizeDepartment(getCol(row, mapping, 'department'));
        const deptInfo = departments.find(d => d.code === dept || d.name === dept || d.code.toUpperCase() === dept.toUpperCase());
        const isME = deptInfo?.courseType === 'M.E' || dept.startsWith('ME-');
        const duration = deptInfo?.duration || (isME ? 2 : 4);
        const admYear = getCol(row, mapping, 'admission_year') || '2025';
        const admYearNum = parseInt(admYear) || 2025;
        const entryTypeRaw = getCol(row, mapping, 'entry_type').toUpperCase();
        const entryType: 'REGULAR' | 'LATERAL' = entryTypeRaw.includes('LATERAL') ? 'LATERAL' : 'REGULAR';
        const batchEnd = entryType === 'LATERAL' ? admYearNum + 3 : admYearNum + duration;
        const currentYearRaw = parseInt(getCol(row, mapping, 'current_year')) || 0;
        const feeYearRaw = getCol(row, mapping, 'fee_year');
        const feeYear = parseInt(feeYearRaw) || currentYearRaw || 1;
        const acYear = `${admYearNum + feeYear - 1}-${(admYearNum + feeYear).toString().slice(-2)}`;

        const student: Student = {
          hallTicketNumber: htn,
          name: name.toUpperCase(),
          department: dept,
          sex: getCol(row, mapping, 'sex') || '',
          dob: normalizeDate(getCol(row, mapping, 'dob')),
          admissionCategory: getCol(row, mapping, 'mode_of_admission').toUpperCase() || 'TSMFC',
          mobile: getCol(row, mapping, 'student_mobile'),
          fatherMobile: getCol(row, mapping, 'father_mobile'),
          fatherName: getCol(row, mapping, 'father_name').toUpperCase(),
          motherName: getCol(row, mapping, 'mother_name').toUpperCase(),
          address: getCol(row, mapping, 'address'),
          aadhaarNumber: getCol(row, mapping, 'aadhaar'),
          admissionYear: admYear,
          entryType,
          course: isME ? 'M.E' : 'B.E',
          specialization: 'General',
          section: 'A',
          currentYear: currentYearRaw || feeYear,
          batch: `${admYear}-${batchEnd}`,
          feeLockers: []
        };

        const targets = getFeeTargets(dept, feeYear, entryType, admYear);
        const locker: YearLocker = {
          year: feeYear,
          tuitionTarget: targets.tuition,
          universityTarget: targets.university,
          otherTarget: 0,
          transactions: []
        };

        const tuiFee = parseFloat(getCol(row, mapping, 'tuition_fee')) || 0;
        const tuiDate = normalizeDate(getCol(row, mapping, 'tuition_challan_date'));
        const tuiMode = getCol(row, mapping, 'tuition_payment_mode');
        const tuiChallan = getCol(row, mapping, 'tuition_challan_no');

        if (tuiFee > 0) {
          const fy = tuiDate ? computeFY(tuiDate) : acYear;
          locker.transactions.push({
            id: `tx-tui-${htn}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            studentHTN: htn,
            feeType: 'Tuition',
            amount: tuiFee,
            challanNumber: tuiChallan,
            paymentMode: (['Online', 'Challan', 'DD', 'Cash', 'UPI'].includes(tuiMode) ? tuiMode : 'Challan') as any,
            paymentDate: tuiDate || new Date().toISOString().split('T')[0],
            academicYear: acYear,
            financialYear: fy || acYear,
            status: 'PENDING'
          });
        }

        const uniFee = parseFloat(getCol(row, mapping, 'university_fee')) || 0;
        const uniDate = normalizeDate(getCol(row, mapping, 'university_challan_date'));
        const uniMode = getCol(row, mapping, 'university_payment_mode');
        const uniChallan = getCol(row, mapping, 'university_challan_no');

        if (uniFee > 0) {
          const fy = uniDate ? computeFY(uniDate) : acYear;
          locker.transactions.push({
            id: `tx-uni-${htn}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            studentHTN: htn,
            feeType: 'University',
            amount: uniFee,
            challanNumber: uniChallan,
            paymentMode: (['Online', 'Challan', 'DD', 'Cash', 'UPI'].includes(uniMode) ? uniMode : 'Challan') as any,
            paymentDate: uniDate || new Date().toISOString().split('T')[0],
            academicYear: acYear,
            financialYear: fy || acYear,
            status: 'PENDING'
          });
        }

        if (currentYearRaw > 0) {
          const startYear = entryType === 'LATERAL' ? 2 : 1;
          for (let y = startYear; y <= Math.min(currentYearRaw, duration); y++) {
            if (y === feeYear) continue;
            const yTargets = getFeeTargets(dept, y, entryType, admYear);
            student.feeLockers.push({
              year: y,
              tuitionTarget: yTargets.tuition,
              universityTarget: yTargets.university,
              otherTarget: 0,
              transactions: []
            });
          }
        }

        student.feeLockers.push(locker);
        student.feeLockers.sort((a, b) => a.year - b.year);
        newStudents.push(student);
      } catch (err) {
        errors.push(`Row ${rowIdx + 2}: Processing error`);
      }
    });

    if (newStudents.length > 0) {
      bulkAddStudents(newStudents);
    }

    return { type: 'combined', total: dataRows.length, success: newStudents.length, errors };
  };

  const processMultiYearUpload = (dataRows: string[][], mapping: Record<string, number>, multiYearCols: Record<number, { tuitionIdx: number; universityIdx: number }>): UploadResult => {
    const errors: string[] = [];
    const newStudents: Student[] = [];

    dataRows.forEach((row, rowIdx) => {
      try {
        const htn = getCol(row, mapping, 'roll_no');
        const name = getCol(row, mapping, 'student_name');
        if (!htn) {
          errors.push(`Row ${rowIdx + 2}: Missing Roll No`);
          return;
        }

        const dept = normalizeDepartment(getCol(row, mapping, 'department'));
        const deptInfo = departments.find(d => d.code === dept || d.name === dept || d.code.toUpperCase() === dept.toUpperCase());
        const isME = deptInfo?.courseType === 'M.E' || dept.startsWith('ME-');
        const duration = deptInfo?.duration || (isME ? 2 : 4);
        const admYear = getCol(row, mapping, 'admission_year') || '2025';
        const admYearNum = parseInt(admYear) || 2025;
        const entryTypeRaw = getCol(row, mapping, 'entry_type').toUpperCase();
        const entryType: 'REGULAR' | 'LATERAL' = entryTypeRaw.includes('LATERAL') ? 'LATERAL' : 'REGULAR';
        const batchEnd = entryType === 'LATERAL' ? admYearNum + 3 : admYearNum + duration;
        const currentYearRaw = parseInt(getCol(row, mapping, 'current_year')) || 0;
        const admissionCat = getCol(row, mapping, 'mode_of_admission').toUpperCase() || 'TSMFC';

        const existingStudent = students.find(s => s.hallTicketNumber.toLowerCase() === htn.toLowerCase());

        const feeLockers: YearLocker[] = [];

        for (const [yearStr, cols] of Object.entries(multiYearCols)) {
          const yr = parseInt(yearStr);
          if (yr > duration) continue;

          const tuiFee = cols.tuitionIdx >= 0 && cols.tuitionIdx < row.length ? (parseFloat(String(row[cols.tuitionIdx]).replace(/,/g, '')) || 0) : 0;
          const uniFee = cols.universityIdx >= 0 && cols.universityIdx < row.length ? (parseFloat(String(row[cols.universityIdx]).replace(/,/g, '')) || 0) : 0;

          const targets = getFeeTargets(dept, yr, entryType, admYear);
          const acYear = `${admYearNum + yr - 1}-${(admYearNum + yr).toString().slice(-2)}`;

          const locker: YearLocker = {
            year: yr,
            tuitionTarget: targets.tuition,
            universityTarget: targets.university,
            otherTarget: 0,
            transactions: []
          };

          if (tuiFee > 0) {
            locker.transactions.push({
              id: `tx-tui-${htn}-y${yr}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              studentHTN: htn,
              feeType: 'Tuition',
              amount: tuiFee,
              challanNumber: '',
              paymentMode: 'Challan',
              paymentDate: new Date().toISOString().split('T')[0],
              academicYear: acYear,
              financialYear: acYear,
              status: 'PENDING'
            });
          }

          if (uniFee > 0) {
            locker.transactions.push({
              id: `tx-uni-${htn}-y${yr}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              studentHTN: htn,
              feeType: 'University',
              amount: uniFee,
              challanNumber: '',
              paymentMode: 'Challan',
              paymentDate: new Date().toISOString().split('T')[0],
              academicYear: acYear,
              financialYear: acYear,
              status: 'PENDING'
            });
          }

          if (tuiFee > 0 || uniFee > 0 || yr <= (currentYearRaw || 0)) {
            feeLockers.push(locker);
          }
        }

        if (existingStudent) {
          const mergedLockers = [...existingStudent.feeLockers];
          for (const newLocker of feeLockers) {
            if (newLocker.transactions.length === 0) {
              if (!mergedLockers.find(l => l.year === newLocker.year)) {
                mergedLockers.push(newLocker);
              }
              continue;
            }
            const existingIdx = mergedLockers.findIndex(l => l.year === newLocker.year);
            if (existingIdx >= 0) {
              mergedLockers[existingIdx] = {
                ...mergedLockers[existingIdx],
                transactions: [...mergedLockers[existingIdx].transactions, ...newLocker.transactions]
              };
            } else {
              mergedLockers.push(newLocker);
            }
          }
          mergedLockers.sort((a, b) => a.year - b.year);
          newStudents.push({
            ...existingStudent,
            department: dept || existingStudent.department,
            admissionCategory: admissionCat || existingStudent.admissionCategory,
            entryType: entryType || existingStudent.entryType,
            currentYear: currentYearRaw || existingStudent.currentYear,
            feeLockers: mergedLockers
          });
        } else {
          const student: Student = {
            hallTicketNumber: htn,
            name: (name || 'Unknown').toUpperCase(),
            department: dept,
            sex: getCol(row, mapping, 'sex') || '',
            dob: normalizeDate(getCol(row, mapping, 'dob')),
            admissionCategory: admissionCat,
            mobile: getCol(row, mapping, 'student_mobile'),
            fatherMobile: getCol(row, mapping, 'father_mobile'),
            fatherName: getCol(row, mapping, 'father_name').toUpperCase(),
            motherName: getCol(row, mapping, 'mother_name').toUpperCase(),
            address: getCol(row, mapping, 'address'),
            aadhaarNumber: getCol(row, mapping, 'aadhaar'),
            admissionYear: admYear,
            entryType,
            course: isME ? 'M.E' : 'B.E',
            specialization: 'General',
            section: 'A',
            currentYear: currentYearRaw || Math.max(...Object.keys(multiYearCols).map(Number).filter(y => {
              const c = multiYearCols[y];
              const ti = c.tuitionIdx >= 0 && c.tuitionIdx < row.length ? (parseFloat(String(row[c.tuitionIdx]).replace(/,/g, '')) || 0) : 0;
              const ui = c.universityIdx >= 0 && c.universityIdx < row.length ? (parseFloat(String(row[c.universityIdx]).replace(/,/g, '')) || 0) : 0;
              return ti > 0 || ui > 0;
            }), 1),
            batch: `${admYear}-${batchEnd}`,
            feeLockers: feeLockers.sort((a, b) => a.year - b.year)
          };
          newStudents.push(student);
        }
      } catch (err) {
        errors.push(`Row ${rowIdx + 2}: Processing error`);
      }
    });

    if (newStudents.length > 0) {
      bulkAddStudents(newStudents);
    }

    return { type: 'multiyear', total: dataRows.length, success: newStudents.length, errors };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);
    setShowMappingPreview(false);

    try {
      const allRows = await parseFileToRows(file);
      if (allRows.length < 2) {
        setUploadResult({ type: 'student', total: 0, success: 0, errors: ['File has no data rows'] });
        setIsUploading(false);
        return;
      }

      const headers = allRows[0].map(h => String(h));
      const dataRows = allRows.slice(1);
      const mapping = matchHeaders(headers);
      const multiYearCols = detectMultiYearColumns(headers);
      let type = detectUploadType(mapping);

      if (multiYearCols && 'roll_no' in mapping) {
        type = 'multiyear';
      }

      setDetectedHeaders(headers);
      setMappedFields(mapping);
      setDetectedType(type);

      if (!type) {
        setUploadResult({ type: 'student', total: 0, success: 0, errors: ['Could not detect template type. Please ensure your file has the required column headers (Roll No, Student Name, etc.)'] });
        setShowMappingPreview(true);
        setIsUploading(false);
        return;
      }

      let result: UploadResult;
      switch (type) {
        case 'student':
          result = processStudentUpload(dataRows, mapping);
          break;
        case 'fee':
          result = processFeeUpload(dataRows, mapping);
          break;
        case 'combined':
          result = processCombinedUpload(dataRows, mapping);
          break;
        case 'multiyear':
          result = processMultiYearUpload(dataRows, mapping, multiYearCols!);
          break;
      }

      setUploadResult(result);
      setShowMappingPreview(true);
    } catch (err) {
      setUploadResult({ type: 'student', total: 0, success: 0, errors: ['Failed to parse file. Please check the format and try again.'] });
    }

    setIsUploading(false);
    if (e.target) e.target.value = '';
  };

  const downloadTemplate = (type: UploadType) => {
    let headers: string[];
    let filename: string;
    switch (type) {
      case 'student':
        headers = STUDENT_HEADERS;
        filename = 'Student_Data_Template.csv';
        break;
      case 'fee':
        headers = FEE_HEADERS;
        filename = 'Fee_Data_Template.csv';
        break;
      case 'combined':
        headers = COMBINED_HEADERS;
        filename = 'Combined_Student_Fee_Template.csv';
        break;
    }
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadXlsxTemplate = (type: UploadType) => {
    let headers: string[];
    let filename: string;
    switch (type) {
      case 'student':
        headers = STUDENT_HEADERS;
        filename = 'Student_Data_Template.xlsx';
        break;
      case 'fee':
        headers = FEE_HEADERS;
        filename = 'Fee_Data_Template.xlsx';
        break;
      case 'combined':
        headers = COMBINED_HEADERS;
        filename = 'Combined_Student_Fee_Template.xlsx';
        break;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const colWidths = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, filename);
  };

  const typeLabels: Record<UploadType, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
    student: { label: 'Student Data', desc: `${STUDENT_HEADERS.length} columns - Student personal & admission details`, icon: <Users size={24} />, color: 'blue' },
    fee: { label: 'Fee Data', desc: `${FEE_HEADERS.length} columns - Fee payment transactions only`, icon: <IndianRupee size={24} />, color: 'emerald' },
    combined: { label: 'Combined (Student + Fee)', desc: `${COMBINED_HEADERS.length} columns - Complete student data with fee payments`, icon: <FileText size={24} />, color: 'purple' },
    multiyear: { label: 'Multi-Year Fee Data', desc: 'Year-wise columns - Student data with fees for multiple years in separate columns', icon: <Table2 size={24} />, color: 'amber' },
  };

  const templateCards: { type: UploadType; bgFrom: string; bgTo: string; iconBg: string; iconText: string; borderColor: string }[] = [
    { type: 'student', bgFrom: 'from-blue-50', bgTo: 'to-white', iconBg: 'bg-blue-100', iconText: 'text-blue-600', borderColor: 'border-blue-200' },
    { type: 'fee', bgFrom: 'from-emerald-50', bgTo: 'to-white', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', borderColor: 'border-emerald-200' },
    { type: 'combined', bgFrom: 'from-purple-50', bgTo: 'to-white', iconBg: 'bg-purple-100', iconText: 'text-purple-600', borderColor: 'border-purple-200' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-[#1a365d] via-[#2c5282] to-[#2b6cb0] rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/15 rounded-xl">
            <Upload size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Bulk Upload - Students & Fee</h1>
            <p className="text-blue-200 text-sm mt-0.5">Upload Excel/CSV files to process multiple student records and fee transactions at once</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <Info size={18} className="text-blue-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-700">Smart Column Matching</h3>
            <p className="text-xs text-slate-400">Your file headers are automatically matched to the required fields. You can add, remove, or rename columns - the system will find the right data based on header names.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {templateCards.map(tc => {
            const info = typeLabels[tc.type];
            return (
              <div key={tc.type} className={`bg-gradient-to-b ${tc.bgFrom} ${tc.bgTo} rounded-xl border ${tc.borderColor} p-5`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 ${tc.iconBg} ${tc.iconText} rounded-lg`}>
                    {info.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{info.label}</h4>
                    <p className="text-[10px] text-slate-400">{info.desc}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => downloadXlsxTemplate(tc.type)}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${tc.iconText} ${tc.iconBg} hover:opacity-80`}
                  >
                    <Download size={14} />
                    Download Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => downloadTemplate(tc.type)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <Download size={14} />
                    Download CSV
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Required Columns</p>
                  <div className="flex flex-wrap gap-1">
                    {(tc.type === 'student' ? ['Roll No', 'Student Name', 'Department', 'Father Name'] :
                      tc.type === 'fee' ? ['Roll No', 'Tuition Fee', 'University Fee'] :
                      ['Roll No', 'Student Name', 'Department', 'Tuition Fee']
                    ).map(col => (
                      <span key={col} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">{col}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Upload File</h3>
          <p className="text-sm text-slate-400 mb-6">The system will automatically detect which template type your file matches based on the column headers</p>

          <div className={`border-4 border-dashed rounded-2xl p-10 transition-all text-center ${
            isUploading ? 'bg-blue-50 border-blue-200 scale-[0.98]' : 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
          }`}>
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 size={40} className="animate-spin text-blue-600 mx-auto" />
                <div>
                  <p className="font-bold text-blue-900">Processing your file...</p>
                  <p className="text-xs text-blue-400 mt-1">Matching columns and validating data</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <FileSpreadsheet size={48} className="text-slate-300 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-slate-700">Click to browse or drag and drop your file</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Supported: .XLSX, .XLS, .CSV</p>
                </div>
                <label htmlFor="bulk-upload-file" className="inline-flex items-center gap-2 px-8 py-3 bg-[#1a365d] text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-[#2c5282] transition-all shadow-lg shadow-blue-200">
                  <Upload size={18} />
                  <span>Select File to Upload</span>
                </label>
                <input
                  type="file"
                  className="hidden"
                  id="bulk-upload-file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </div>
            )}
          </div>
        </div>

        {uploadResult && (
          <div className={`mx-6 mb-6 rounded-xl p-5 border ${uploadResult.errors.length === 0 && uploadResult.success > 0 ? 'bg-green-50 border-green-200' : uploadResult.success > 0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              {uploadResult.success > 0 ? (
                <CheckCircle2 size={22} className="text-green-600" />
              ) : (
                <AlertCircle size={22} className="text-red-600" />
              )}
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {uploadResult.success > 0 ? 'Upload Successful' : 'Upload Failed'}
                </h4>
                <p className="text-xs text-slate-500">
                  {detectedType && `Detected as: ${typeLabels[detectedType].label} template`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="bg-white rounded-lg p-3 text-center border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Rows</p>
                <p className="text-lg font-bold text-slate-800">{uploadResult.total}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-green-100">
                <p className="text-[10px] text-green-600 uppercase tracking-wider font-bold">Processed</p>
                <p className="text-lg font-bold text-green-700">{uploadResult.success}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-red-100">
                <p className="text-[10px] text-red-500 uppercase tracking-wider font-bold">Errors</p>
                <p className="text-lg font-bold text-red-600">{uploadResult.errors.length}</p>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto bg-white rounded-lg border border-slate-100 p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Error Details</p>
                {uploadResult.errors.slice(0, 20).map((err, i) => (
                  <p key={i} className="text-xs text-red-600 py-0.5">{err}</p>
                ))}
                {uploadResult.errors.length > 20 && (
                  <p className="text-xs text-slate-400 mt-1">...and {uploadResult.errors.length - 20} more errors</p>
                )}
              </div>
            )}

            {uploadResult.success > 0 && (
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                <Info size={12} />
                All fee transactions are added as PENDING and require Accountant approval.
              </p>
            )}
          </div>
        )}

        {showMappingPreview && detectedHeaders.length > 0 && (
          <div className="mx-6 mb-6">
            <button
              onClick={() => setShowMappingPreview(!showMappingPreview)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3 hover:text-slate-700"
            >
              <Columns3 size={14} />
              Column Mapping Details
            </button>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {detectedHeaders.map((header, idx) => {
                  const matchedKey = Object.entries(mappedFields).find(([, v]) => v === idx)?.[0];
                  return (
                    <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${matchedKey ? 'bg-green-50 border border-green-200' : 'bg-white border border-slate-100'}`}>
                      <span className="font-medium text-slate-700 truncate mr-2">{header}</span>
                      {matchedKey ? (
                        <span className="text-[9px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {matchedKey.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">ignored</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Table2 size={18} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">Tips for Flexible Uploads</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <p className="font-bold text-slate-700 mb-1">Add Extra Columns</p>
            <p>You can add any extra columns (notes, internal IDs, etc.) - they will be ignored during import.</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <p className="font-bold text-slate-700 mb-1">Remove Optional Columns</p>
            <p>Only Roll No and Student Name are required. Other fields like Aadhaar, Address, Entry Type are optional.</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <p className="font-bold text-slate-700 mb-1">Reorder Columns</p>
            <p>Columns can be in any order. The system matches by header name, not position.</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <p className="font-bold text-slate-700 mb-1">Rename Headers</p>
            <p>Common header variations are recognized: "Roll No", "Roll Number", "HTN", "Enrollment No" all work.</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <p className="font-bold text-slate-700 mb-1">Auto-Detection</p>
            <p>The system automatically detects whether your file is Student Data, Fee Data, or Combined based on headers.</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <p className="font-bold text-slate-700 mb-1">Existing Students</p>
            <p>For fee uploads, if a student already exists, fee transactions are added to their existing record.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
