
export enum UserRole {
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  PRINCIPAL = 'PRINCIPAL',
  EXAM_CELL = 'EXAM_CELL'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  courseType: CourseType;
  duration: number;
  specializations: string[];
}

export type CourseType = 'B.E' | 'M.E';
export type FeeStatus = 'FULLY_PAID' | 'PARTIALLY_PAID' | 'PENDING';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentMode = 'Cash' | 'Online' | 'Challan' | 'DD' | 'UPI';
export type FeeType = 'Tuition' | 'University' | 'Other';

export interface FeeTransaction {
  id: string;
  studentHTN: string;
  feeType: FeeType;
  amount: number;
  challanNumber: string;
  paymentMode: PaymentMode;
  paymentDate: string;
  academicYear: string;
  financialYear: string;
  status: PaymentStatus;
  approvedBy?: string;
  approvalDate?: string;
  targetYear?: number;
}

export interface YearLocker {
  year: number; // 1, 2, 3, or 4
  tuitionTarget: number;
  universityTarget: number;
  otherTarget: number;
  transactions: FeeTransaction[];
}

export interface Student {
  hallTicketNumber: string;
  name: string;
  fatherName: string;
  motherName: string;
  sex: string;
  dob: string;
  mobile: string;
  fatherMobile: string;
  address: string;
  course: CourseType;
  department: string;
  specialization: string;
  section: string;
  admissionCategory: string; // "MODE OF ADMISSION"
  admissionYear: string;
  batch: string;
  currentYear: number;
  feeLockers: YearLocker[];
}

export interface FeeLockerConfig {
  groupA: { tuition: number; university: number; departments: string[] };
  groupB: { tuition: number; university: number; departments: string[] };
  groupC: {
    year1Tuition: number; year1University: number;
    year2Tuition: number; year2University: number;
    departments: string[];
  };
}

export interface CertificateTemplate {
  id: string;
  name: string;
  type: 'Bonafide' | 'Transfer' | 'Custom';
  pageSize: 'A4' | 'Legal' | 'Custom';
  orientation: 'Portrait' | 'Landscape';
  content: string; // HTML or Markdown template
}
