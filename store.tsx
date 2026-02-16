
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, User, UserRole, FeeTransaction, Department, CertificateTemplate, PaymentStatus } from './types';
import { INITIAL_STUDENTS, DEPARTMENTS } from './constants';

interface AppState {
  currentUser: User | null;
  students: Student[];
  departments: Department[];
  transactions: FeeTransaction[];
  templates: CertificateTemplate[];
  login: (role: UserRole) => void;
  logout: () => void;
  addStudent: (student: Student) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (htn: string) => void;
  bulkAddStudents: (newStudents: Student[]) => void;
  addTransaction: (tx: FeeTransaction) => void;
  bulkAddTransactions: (txs: FeeTransaction[]) => void;
  approveTransaction: (txId: string, approverName: string) => void;
  rejectTransaction: (txId: string) => void;
  bulkApproveTransactions: (txIds: string[], approverName: string) => void;
  bulkRejectTransactions: (txIds: string[]) => void;
  addTemplate: (template: CertificateTemplate) => void;
  deleteTemplate: (id: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ef_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('ef_students');
    if (saved) {
      const deptMigration: Record<string, string> = {
        'Computer Science & Engineering': 'B.E(Computer Science Engineering)',
        'Electronics & Communication Engineering': 'B.E(Electronics & Communication Engineering)',
        'Electrical & Electronics Engineering': 'B.E(Electrical& Electronics Engineering)',
        'Mechanical Engineering': 'B.E(Mechanical Engineering)',
        'Civil Engineering': 'B.E(Civil engineering)',
        'Production Engineering': 'B.E(Production Engineering)',
      };
      const parsed = JSON.parse(saved) as Student[];
      return parsed.map(s => ({
        ...s,
        department: deptMigration[s.department] || s.department,
      }));
    }
    return INITIAL_STUDENTS;
  });

  const [departments, setDepartments] = useState<Department[]>(DEPARTMENTS);

  const [transactions, setTransactions] = useState<FeeTransaction[]>(() => {
    const saved = localStorage.getItem('ef_txs');
    if (saved) return JSON.parse(saved);
    return INITIAL_STUDENTS.flatMap(s => s.feeLockers.flatMap(l => l.transactions));
  });

  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);

  useEffect(() => {
    localStorage.setItem('ef_user', JSON.stringify(currentUser));
    localStorage.setItem('ef_students', JSON.stringify(students));
    localStorage.setItem('ef_txs', JSON.stringify(transactions));
  }, [currentUser, students, transactions]);

  const login = (role: UserRole) => {
    const userMap: Record<UserRole, User> = {
      [UserRole.ADMIN]: { id: 'admin-1', name: 'System Admin', email: 'admin@college.edu', role: UserRole.ADMIN },
      [UserRole.ACCOUNTANT]: { id: 'acc-1', name: 'Head Accountant', email: 'finance@college.edu', role: UserRole.ACCOUNTANT },
      [UserRole.PRINCIPAL]: { id: 'prin-1', name: 'Dr. Principal', email: 'principal@college.edu', role: UserRole.PRINCIPAL },
      [UserRole.EXAM_CELL]: { id: 'exam-1', name: 'Exam Controller', email: 'exam@college.edu', role: UserRole.EXAM_CELL },
    };
    setCurrentUser(userMap[role]);
  };

  const logout = () => setCurrentUser(null);

  const addStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
    // Sync transactions if any
    const studentTxs = student.feeLockers.flatMap(l => l.transactions);
    if (studentTxs.length > 0) {
      setTransactions(prev => [...prev, ...studentTxs]);
    }
  };

  const updateStudent = (student: Student) => {
    setStudents(prev => prev.map(s => s.hallTicketNumber === student.hallTicketNumber ? student : s));
    // Sync transactions if any - only add those that don't exist
    const studentTxs = student.feeLockers.flatMap(l => l.transactions);
    setTransactions(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const newTxs = studentTxs.filter(t => !existingIds.has(t.id));
      return [...prev, ...newTxs];
    });
  };

  const deleteStudent = (htn: string) => {
    setStudents(prev => prev.filter(s => s.hallTicketNumber !== htn));
    setTransactions(prev => prev.filter(t => t.studentHTN !== htn));
  };

  const bulkAddStudents = (newStudents: Student[]) => {
    setStudents(prev => {
      const existingHTNs = new Set(prev.map(s => s.hallTicketNumber));
      const filtered = newStudents.filter(ns => !existingHTNs.has(ns.hallTicketNumber));
      const updated = prev.map(s => {
        const replacement = newStudents.find(ns => ns.hallTicketNumber === s.hallTicketNumber);
        return replacement || s;
      });
      return [...updated, ...filtered];
    });

    // Extract all transactions from all lockers of all students being uploaded
    const allNewTxs = newStudents.flatMap(s => s.feeLockers.flatMap(l => l.transactions));
    setTransactions(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const filteredNewTxs = allNewTxs.filter(t => !existingIds.has(t.id));
      return [...prev, ...filteredNewTxs];
    });
  };

  const addTransaction = (tx: FeeTransaction) => {
    setTransactions(prev => [...prev, tx]);
    setStudents(prev => prev.map(s => {
      if (s.hallTicketNumber === tx.studentHTN) {
        const updatedLockers = [...s.feeLockers];
        const lockerIndex = updatedLockers.findIndex(l => l.year === s.currentYear);
        if (lockerIndex > -1) {
          // Check if tx already exists in locker
          const txExists = updatedLockers[lockerIndex].transactions.some(t => t.id === tx.id);
          if (!txExists) {
            updatedLockers[lockerIndex].transactions = [...updatedLockers[lockerIndex].transactions, tx];
          }
        }
        return { ...s, feeLockers: updatedLockers };
      }
      return s;
    }));
  };

  const bulkAddTransactions = (txs: FeeTransaction[]) => {
    setTransactions(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const filtered = txs.filter(t => !existingIds.has(t.id));
      return [...prev, ...filtered];
    });

    setStudents(prev => prev.map(s => {
      const studentTxs = txs.filter(t => t.studentHTN === s.hallTicketNumber);
      if (studentTxs.length === 0) return s;

      const updatedLockers = [...s.feeLockers];
      studentTxs.forEach(tx => {
        const lockerIndex = updatedLockers.findIndex(l => l.year === s.currentYear);
        if (lockerIndex > -1) {
           const txExists = updatedLockers[lockerIndex].transactions.some(t => t.id === tx.id);
           if (!txExists) {
             updatedLockers[lockerIndex].transactions = [...updatedLockers[lockerIndex].transactions, tx];
           }
        }
      });
      return { ...s, feeLockers: updatedLockers };
    }));
  };

  const updateTransactionStatus = (txIds: string[], status: PaymentStatus, approverName?: string) => {
    const approvalDate = status === 'APPROVED' ? new Date().toISOString().split('T')[0] : undefined;
    
    setTransactions(prev => prev.map(tx => {
      if (txIds.includes(tx.id)) {
        return { ...tx, status, approvedBy: approverName, approvalDate };
      }
      return tx;
    }));

    setStudents(prev => prev.map(s => ({
      ...s,
      feeLockers: s.feeLockers.map(l => ({
        ...l,
        transactions: l.transactions.map(t => txIds.includes(t.id) ? {
          ...t, status, approvedBy: approverName, approvalDate
        } : t)
      }))
    })));
  };

  const approveTransaction = (txId: string, approverName: string) => updateTransactionStatus([txId], 'APPROVED', approverName);
  const rejectTransaction = (txId: string) => updateTransactionStatus([txId], 'REJECTED');
  
  const bulkApproveTransactions = (txIds: string[], approverName: string) => updateTransactionStatus(txIds, 'APPROVED', approverName);
  const bulkRejectTransactions = (txIds: string[]) => updateTransactionStatus(txIds, 'REJECTED');

  const addTemplate = (template: CertificateTemplate) => setTemplates(prev => [...prev, template]);
  const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id));

  return (
    <AppContext.Provider value={{
      currentUser, students, departments, transactions, templates,
      login, logout, addStudent, updateStudent, deleteStudent, bulkAddStudents, addTransaction, bulkAddTransactions,
      approveTransaction, rejectTransaction, bulkApproveTransactions, bulkRejectTransactions,
      addTemplate, deleteTemplate
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
