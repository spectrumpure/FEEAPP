
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

export interface CertificateTemplate {
  id: string;
  name: string;
  type: 'Bonafide' | 'Transfer' | 'Custom';
  pageSize: 'A4' | 'Legal' | 'Custom';
  orientation: 'Portrait' | 'Landscape';
  content: string; // HTML or Markdown template
}
