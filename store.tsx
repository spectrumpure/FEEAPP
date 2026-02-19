
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student, User, UserRole, FeeTransaction, Department, CertificateTemplate, PaymentStatus, FeeLockerConfig, DeptYearTarget } from './types';
import { DEPARTMENTS } from './constants';

interface AppState {
  currentUser: User | null;
  students: Student[];
  departments: Department[];
  transactions: FeeTransaction[];
  templates: CertificateTemplate[];
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
  feeLockerConfig: FeeLockerConfig;
  updateFeeLockerConfig: (config: FeeLockerConfig) => void;
  getFeeTargets: (department: string, year: number) => { tuition: number; university: number };
  isLoading: boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

function buildDeptYearTargets(config: FeeLockerConfig): { [deptCode: string]: { [year: string]: DeptYearTarget } } {
  const targets: { [deptCode: string]: { [year: string]: DeptYearTarget } } = {};
  for (const dept of DEPARTMENTS) {
    const code = dept.code;
    const duration = dept.duration;
    targets[code] = {};
    const isME = config.groupC.departments.includes(code) || code.startsWith('ME-');
    for (let y = 1; y <= duration; y++) {
      if (isME) {
        targets[code][String(y)] = {
          tuition: y === 1 ? config.groupC.year1Tuition : config.groupC.year2Tuition,
          university: y === 1 ? config.groupC.year1University : config.groupC.year2University
        };
      } else if (config.groupB.departments.includes(code)) {
        targets[code][String(y)] = { tuition: config.groupB.tuition, university: config.groupB.university };
      } else {
        targets[code][String(y)] = { tuition: config.groupA.tuition, university: config.groupA.university };
      }
    }
  }
  return targets;
}

const DEFAULT_FEE_CONFIG: FeeLockerConfig = {
  groupA: { tuition: 100000, university: 25000, departments: ['CSE', 'CIVIL', 'MECH', 'ECE'] },
  groupB: { tuition: 125000, university: 30000, departments: ['CS-AI', 'CS-DS', 'CS-AIML', 'IT', 'EEE', 'PROD'] },
  groupC: { year1Tuition: 130000, year1University: 11650, year2Tuition: 130000, year2University: 4500, departments: ['ME-CADCAM', 'ME-CSE', 'ME-STRUCT', 'ME-VLSI'] }
};
DEFAULT_FEE_CONFIG.deptYearTargets = buildDeptYearTargets(DEFAULT_FEE_CONFIG);

function ensureDeptYearTargets(config: FeeLockerConfig): FeeLockerConfig {
  if (config.deptYearTargets && Object.keys(config.deptYearTargets).length > 0) {
    for (const dept of DEPARTMENTS) {
      if (!config.deptYearTargets[dept.code]) {
        config.deptYearTargets[dept.code] = {};
      }
      for (let y = 1; y <= dept.duration; y++) {
        if (!config.deptYearTargets[dept.code][String(y)]) {
          config.deptYearTargets[dept.code][String(y)] = { tuition: 0, university: 0 };
        }
      }
    }
    return config;
  }
  config.deptYearTargets = buildDeptYearTargets(config);
  return config;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ef_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [departments] = useState<Department[]>(DEPARTMENTS);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [feeLockerConfig, setFeeLockerConfig] = useState<FeeLockerConfig>(DEFAULT_FEE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/bootstrap');
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
          setTransactions(data.transactions || []);
          if (data.feeLockerConfig) {
            setFeeLockerConfig(ensureDeptYearTargets(data.feeLockerConfig));
          }
        }
      } catch (err) {
        console.error('Failed to load data from database:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('ef_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const getFeeTargets = useCallback((department: string, year: number): { tuition: number; university: number } => {
    const dept = DEPARTMENTS.find(d => d.name === department || d.code === department || d.code.toUpperCase() === department.toUpperCase());
    const code = dept?.code || '';
    const duration = dept?.duration || 4;
    if (year > duration) {
      return { tuition: 0, university: 0 };
    }
    if (feeLockerConfig.deptYearTargets && feeLockerConfig.deptYearTargets[code] && feeLockerConfig.deptYearTargets[code][String(year)]) {
      return feeLockerConfig.deptYearTargets[code][String(year)];
    }
    const isME = feeLockerConfig.groupC.departments.includes(code) || 
      department.startsWith('M.E') || code.startsWith('ME-');
    if (isME) {
      return year === 1
        ? { tuition: feeLockerConfig.groupC.year1Tuition, university: feeLockerConfig.groupC.year1University }
        : { tuition: feeLockerConfig.groupC.year2Tuition, university: feeLockerConfig.groupC.year2University };
    }
    if (feeLockerConfig.groupB.departments.includes(code)) {
      return { tuition: feeLockerConfig.groupB.tuition, university: feeLockerConfig.groupB.university };
    }
    return { tuition: feeLockerConfig.groupA.tuition, university: feeLockerConfig.groupA.university };
  }, [feeLockerConfig]);

  const updateFeeLockerConfig = async (config: FeeLockerConfig) => {
    setFeeLockerConfig(config);
    try {
      await fetch('/api/fee-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to save fee config:', err);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.error || 'Login failed' };
      }
      const user = await res.json();
      setCurrentUser({ id: user.id, name: user.name, email: user.email, role: user.role as UserRole, username: user.username });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Connection error. Please try again.' };
    }
  };

  const logout = () => setCurrentUser(null);

  const addStudent = async (student: Student) => {
    setStudents(prev => [...prev, student]);
    const studentTxs = student.feeLockers.flatMap(l => l.transactions);
    if (studentTxs.length > 0) {
      setTransactions(prev => [...prev, ...studentTxs]);
    }
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
    } catch (err) {
      console.error('Failed to save student:', err);
    }
  };

  const updateStudent = async (student: Student) => {
    setStudents(prev => prev.map(s => s.hallTicketNumber === student.hallTicketNumber ? student : s));
    const studentTxs = student.feeLockers.flatMap(l => l.transactions);
    setTransactions(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const newTxs = studentTxs.filter(t => !existingIds.has(t.id));
      return [...prev, ...newTxs];
    });
    try {
      await fetch(`/api/students/${encodeURIComponent(student.hallTicketNumber)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
    } catch (err) {
      console.error('Failed to update student:', err);
    }
  };

  const deleteStudent = async (htn: string) => {
    setStudents(prev => prev.filter(s => s.hallTicketNumber !== htn));
    setTransactions(prev => prev.filter(t => t.studentHTN !== htn));
    try {
      await fetch(`/api/students/${encodeURIComponent(htn)}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete student:', err);
    }
  };

  const bulkAddStudents = async (newStudents: Student[]) => {
    setStudents(prev => {
      const existingHTNs = new Set(prev.map(s => s.hallTicketNumber));
      const filtered = newStudents.filter(ns => !existingHTNs.has(ns.hallTicketNumber));
      const updated = prev.map(s => {
        const replacement = newStudents.find(ns => ns.hallTicketNumber === s.hallTicketNumber);
        return replacement || s;
      });
      return [...updated, ...filtered];
    });

    const allNewTxs = newStudents.flatMap(s => s.feeLockers.flatMap(l => l.transactions));
    setTransactions(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const filteredNewTxs = allNewTxs.filter(t => !existingIds.has(t.id));
      return [...prev, ...filteredNewTxs];
    });

    try {
      await fetch('/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: newStudents }),
      });
    } catch (err) {
      console.error('Failed to bulk add students:', err);
    }
  };

  const addTransaction = async (tx: FeeTransaction) => {
    setTransactions(prev => [...prev, tx]);
    setStudents(prev => prev.map(s => {
      if (s.hallTicketNumber === tx.studentHTN) {
        const updatedLockers = [...s.feeLockers];
        const year = tx.targetYear || s.currentYear;
        let lockerIndex = updatedLockers.findIndex(l => l.year === year);
        if (lockerIndex === -1) {
          const targets = getFeeTargets(s.department, year);
          updatedLockers.push({
            year,
            tuitionTarget: targets.tuition,
            universityTarget: targets.university,
            otherTarget: 0,
            transactions: []
          });
          lockerIndex = updatedLockers.length - 1;
        }
        const txExists = updatedLockers[lockerIndex].transactions.some(t => t.id === tx.id);
        if (!txExists) {
          updatedLockers[lockerIndex].transactions = [...updatedLockers[lockerIndex].transactions, tx];
        }
        return { ...s, feeLockers: updatedLockers };
      }
      return s;
    }));

    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
    } catch (err) {
      console.error('Failed to save transaction:', err);
    }
  };

  const bulkAddTransactions = async (txs: FeeTransaction[]) => {
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
        const year = tx.targetYear || s.currentYear;
        let lockerIndex = updatedLockers.findIndex(l => l.year === year);
        if (lockerIndex === -1) {
          const targets = getFeeTargets(s.department, year);
          updatedLockers.push({
            year,
            tuitionTarget: targets.tuition,
            universityTarget: targets.university,
            otherTarget: 0,
            transactions: []
          });
          lockerIndex = updatedLockers.length - 1;
        }
        const txExists = updatedLockers[lockerIndex].transactions.some(t => t.id === tx.id);
        if (!txExists) {
          updatedLockers[lockerIndex].transactions = [...updatedLockers[lockerIndex].transactions, tx];
        }
      });
      return { ...s, feeLockers: updatedLockers };
    }));

    try {
      await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: txs }),
      });
    } catch (err) {
      console.error('Failed to bulk add transactions:', err);
    }
  };

  const updateTransactionStatus = async (txIds: string[], status: PaymentStatus, approverName?: string) => {
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

    try {
      if (status === 'APPROVED') {
        await fetch('/api/transactions/approve', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txIds, approverName }),
        });
      } else if (status === 'REJECTED') {
        await fetch('/api/transactions/reject', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txIds }),
        });
      }
    } catch (err) {
      console.error('Failed to update transaction status:', err);
    }
  };

  const approveTransaction = (txId: string, approverName: string) => updateTransactionStatus([txId], 'APPROVED', approverName);
  const rejectTransaction = (txId: string) => updateTransactionStatus([txId], 'REJECTED');

  const bulkApproveTransactions = (txIds: string[], approverName: string) => updateTransactionStatus(txIds, 'APPROVED', approverName);
  const bulkRejectTransactions = (txIds: string[]) => updateTransactionStatus(txIds, 'REJECTED');

  const addTemplate = (template: CertificateTemplate) => setTemplates(prev => [...prev, template]);
  const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id));

  return (
    <AppContext.Provider value={{
      currentUser, students, departments, transactions, templates, feeLockerConfig, isLoading,
      login, logout, addStudent, updateStudent, deleteStudent, bulkAddStudents, addTransaction, bulkAddTransactions,
      approveTransaction, rejectTransaction, bulkApproveTransactions, bulkRejectTransactions,
      addTemplate, deleteTemplate, updateFeeLockerConfig, getFeeTargets
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
