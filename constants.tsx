
import { Department, Student } from './types';

export const DEPARTMENTS: Department[] = [
  { id: '1', name: 'Computer Science & Engineering', code: 'CSE', specializations: ['General', 'AI', 'DS', 'AI & ML'] },
  { id: '2', name: 'Electronics & Communication Engineering', code: 'ECE', specializations: ['General'] },
  { id: '3', name: 'Electrical & Electronics Engineering', code: 'EEE', specializations: ['General'] },
  { id: '4', name: 'Mechanical Engineering', code: 'MECH', specializations: ['General', 'CAD/CAM'] },
  { id: '5', name: 'Civil Engineering', code: 'CIVIL', specializations: ['General', 'Structures'] },
  { id: '6', name: 'Production Engineering', code: 'PROD', specializations: ['General'] },
];

export const COURSES = ['B.E', 'M.E'] as const;
export const SECTIONS = ['A', 'B', 'C', 'D'] as const;

const generateStudentData = (data: any): Student => {
  const tuition = parseFloat(data.tuition) || 0;
  const univ = parseFloat(data.univ) || 0;
  
  const transactions = [];
  if (tuition > 0) {
    transactions.push({
      id: `t-tui-${data.htn}`,
      studentHTN: data.htn,
      feeType: 'Tuition' as const,
      amount: tuition,
      challanNumber: data.tuiChallan || '0',
      paymentMode: 'Challan' as const,
      paymentDate: data.tuiDate || '2025-08-01',
      academicYear: '2025-26',
      financialYear: '2025-26',
      status: 'APPROVED' as const,
    });
  }
  if (univ > 0) {
    transactions.push({
      id: `t-uni-${data.htn}`,
      studentHTN: data.htn,
      feeType: 'University' as const,
      amount: univ,
      challanNumber: data.uniChallan || '0',
      paymentMode: 'Challan' as const,
      paymentDate: data.uniDate || '2025-08-01',
      academicYear: '2025-26',
      financialYear: '2025-26',
      status: 'APPROVED' as const,
    });
  }

  return {
    hallTicketNumber: data.htn,
    name: data.name,
    fatherName: data.fName,
    motherName: data.mName,
    sex: data.sex,
    dob: data.dob,
    mobile: data.mob,
    fatherMobile: data.fMob,
    address: data.addr,
    course: 'B.E',
    department: 'Civil Engineering',
    specialization: 'General',
    section: 'A',
    admissionCategory: data.mode,
    admissionYear: '2025',
    batch: '2025-29',
    currentYear: 1,
    feeLockers: [
      {
        year: 1,
        tuitionTarget: data.mode === 'MANAGEMENT QUOTA' ? 125000 : 100000,
        universityTarget: 12650,
        otherTarget: 0,
        transactions: transactions
      }
    ]
  };
};

const rawData = [
  { htn: '1604-25-732-001', name: 'HIBA PARVEEN', fName: 'SYED NIZAM UDDIN FAROOQUI', sex: 'F', mode: 'TSMFC', dob: '19.05.2008', mob: '6309044109', fMob: '9030159230', addr: '19-4-280/55/D, KHAJA NAGAR, TADBAN, HYDERABAD', mName: 'HASEENA PARVEEN', tuiChallan: '0', tuiDate: '0', tuition: '0', uniChallan: '0', uniDate: '0', univ: '12650' },
  { htn: '1604-25-732-002', name: 'HOORIYA MAHEVISH', fName: 'MD PARVEZ NIZAMI', sex: 'F', mode: 'TSMFC', dob: '07.08.2007', mob: '9701244588', fMob: '9848084767', addr: 'ROAD NO.2, ABBASIYA COLONY, DVK RD, NALGONDA', mName: 'RESHMA', tuiChallan: '0', tuiDate: '0', tuition: '0', uniChallan: '0', uniDate: '0', univ: '12650' },
  { htn: '1604-25-732-003', name: 'RUMAISHA HAMEED UNISSA AHMED', fName: 'SHUNEED RASHEED AHMED', sex: 'F', mode: 'MANAGEMENT QUOTA', dob: '12.04.2007', mob: '7659033968', fMob: '9246116694', addr: 'H.NO-5-8-496, CHIRAJ ALI LANE,ABIDS, HYD-1.', mName: 'NAZIA NIKHAT', tuiChallan: '513187', tuiDate: '29.08.2025', tuition: '125000', uniChallan: '513187', uniDate: '29.08.2025', univ: '12650' },
  { htn: '1604-25-732-004', name: 'MOHAMMED HUZAIF MOHIUDDIN', fName: 'MOHAMMED AZGAR MOHIUDDIN', sex: 'M', mode: 'MANAGEMENT QUOTA', dob: '05.06.2006', mob: '6309006279', fMob: '9494306954', addr: '12-811, MANCHERIAL REDDY COLONY, MANCHERIAL', mName: 'JABEEN BEGUM', tuiChallan: '225248', tuiDate: '16.10.2025', tuition: '125000', uniChallan: '225248', uniDate: '16.10.2025', univ: '9650' },
  { htn: '1604-25-732-005', name: 'MOHAMMED ANWAR ALI', fName: 'MOHAMMED IQBAL ALI', sex: 'M', mode: 'TSMFC', dob: '29.03.2007', mob: '8143117313', fMob: '9959654062', addr: '9-4-62/135, AL-HASNATH COLONY, TOLICHOWKI,HYD', mName: 'SABIHA FATHIMA', tuiChallan: '0', tuiDate: '0', tuition: '0', uniChallan: '0', uniDate: '0', univ: '12650' },
  { htn: '1604-25-732-006', name: 'SYED HAMZA ABBAS', fName: 'SYED SHAMEER ABBAS', sex: 'M', mode: 'TSMFC', dob: '08.11.2007', mob: '998920360', fMob: '9703422493', addr: '5-4-85/F/22/A, TAYYAB NAGAR, MAHABUBNAGAR', mName: 'SHABANA BEGUM', tuiChallan: '0', tuiDate: '0', tuition: '0', uniChallan: '0', uniDate: '0', univ: '12650' },
  { htn: '1604-25-732-007', name: 'MOHAMMED ASHMAN ALI', fName: 'ASHRAF ALI MOHAMMAD', sex: 'M', mode: 'TSMFC', dob: '13.02.2008', mob: '7396041315', fMob: '9700829401', addr: '9-4-135/D/9/1, WALI COLONY, HYDERABAD', mName: 'RUBEENA SHAHNAZ', tuiChallan: '0', tuiDate: '0', tuition: '0', uniChallan: '0', uniDate: '0', univ: '12650' },
  { htn: '1604-25-732-008', name: 'IZHAAN UR REHMAN', fName: 'SIRAJ UL REHMAN', sex: 'M', mode: 'TSMFC', dob: '16.07.2007', mob: '8341393553', fMob: '9700040101', addr: '10-1-107, FATHENAGAR, PIPELINE RD, HYDERABAD', mName: 'AZMATH UNNISA', tuiChallan: '0', tuiDate: '0', tuition: '0', uniChallan: '0', uniDate: '0', univ: '12650' },
  { htn: '1604-25-732-009', name: 'NOOR ZUHAIR MOHAMMAD', fName: 'NASRATULLAH MOHAMMAD', sex: 'M', mode: 'MANAGEMENT QUOTA', dob: '09.05.2007', mob: '9633897324', fMob: '9618010505', addr: 'D.No-12-7-23, DARGA STREET, NARSAPUR', mName: 'SAFEENA AKKALATH', tuiChallan: '740272', tuiDate: '24.09.2025', tuition: '125000', uniChallan: '740272', uniDate: '24.09.2025', univ: '12650' },
  { htn: '1604-25-732-010', name: 'ANAS AYUB KHAN', fName: 'AYUB KHAN', sex: 'M', mode: 'TSMFC', dob: '15.02.2008', mob: '8179148527', fMob: '7993265427', addr: '12-2-831/1/4/304, PEACE PLAZA , MEHDIPATNAM,HYD', mName: 'ZEENATH FATHIMA', tuiChallan: '0', tuiDate: '0', tuition: '0', uniChallan: '0', uniDate: '0', univ: '12650' },
];

export const INITIAL_STUDENTS: Student[] = rawData.map(generateStudentData);
