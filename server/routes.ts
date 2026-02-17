import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const router = Router();

const normalizeDepartment = (raw: string): string => {
  const val = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const mapping: Record<string, string> = {
    'CSE': 'CSE', 'COMPUTERSCIENCE': 'CSE', 'COMPUTERSCIENCEENGINEERING': 'CSE', 'CS': 'CSE',
    'CIVIL': 'CIVIL', 'CIVILENGINEERING': 'CIVIL', 'CE': 'CIVIL',
    'MECH': 'MECH', 'MECHANICAL': 'MECH', 'MECHANICALENGINEERING': 'MECH', 'MEHCANICAL': 'MECH',
    'ECE': 'ECE', 'ELECTRONICSANDCOMMUNICATION': 'ECE', 'ELECTRONICSANDCOMMUNICATIONENGINEERING': 'ECE', 'ELECTRONICS': 'ECE',
    'EEE': 'EEE', 'ELECTRICALANDELECTRONICS': 'EEE', 'ELECTRICALANDELECTRONICSENGINEERING': 'EEE',
    'IT': 'IT', 'INFORMATIONTECHNOLOGY': 'IT',
    'CSAI': 'CS-AI', 'CSDS': 'CS-DS', 'CSAIML': 'CS-AIML',
    'PROD': 'PROD', 'PRODUCTION': 'PROD', 'PRODUCTIONENGINEERING': 'PROD',
    'MECADCAM': 'ME-CADCAM', 'CADCAM': 'ME-CADCAM',
    'MECSE': 'ME-CSE', 'MESTRUCT': 'ME-STRUCT', 'MEVLSI': 'ME-VLSI', 'VLSI': 'ME-VLSI',
  };
  return mapping[val] || raw.trim();
};

const ME_DEPARTMENTS = ['ME-CADCAM', 'ME-CSE', 'ME-STRUCT', 'ME-VLSI'];
const GROUP_B_DEPARTMENTS = ['MECH', 'CIVIL', 'PROD'];

const getFeeTargetsServer = (department: string, year: number, config: any): { tuition: number; university: number } => {
  const code = normalizeDepartment(department);
  const isME = ME_DEPARTMENTS.includes(code) || code.startsWith('ME-');
  const duration = isME ? 2 : 4;
  if (year > duration) return { tuition: 0, university: 0 };
  if (isME && config?.groupC) {
    return year === 1
      ? { tuition: config.groupC.year1Tuition || 130000, university: config.groupC.year1University || 11650 }
      : { tuition: config.groupC.year2Tuition || 130000, university: config.groupC.year2University || 4500 };
  }
  if (GROUP_B_DEPARTMENTS.includes(code) && config?.groupB) {
    return { tuition: config.groupB.tuition || 100000, university: config.groupB.university || 12650 };
  }
  if (config?.groupA) {
    return { tuition: config.groupA.tuition || 125000, university: config.groupA.university || 12650 };
  }
  return { tuition: 100000, university: 12650 };
};

router.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM app_users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, username: user.username });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  const { username, currentPassword, newPassword } = req.body;
  try {
    const result = await pool.query('SELECT * FROM app_users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE app_users SET password = $1, updated_at = NOW() WHERE username = $2', [hash, username]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/auth/users', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, username, name, email, role FROM app_users ORDER BY id');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/api/auth/admin-reset-password', async (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;
  try {
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE app_users SET password = $1, updated_at = NOW() WHERE id = $2', [hash, userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/remarks/:htn', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, student_htn, remark, added_by, created_at FROM student_remarks WHERE student_htn = $1 ORDER BY created_at DESC',
      [req.params.htn]
    );
    res.json(result.rows.map(r => ({
      id: r.id,
      studentHTN: r.student_htn,
      remark: r.remark,
      addedBy: r.added_by,
      createdAt: r.created_at,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/remarks', async (req: Request, res: Response) => {
  const { studentHTN, remark, addedBy } = req.body;
  try {
    const studentCheck = await pool.query('SELECT hall_ticket_number FROM students WHERE hall_ticket_number = $1', [studentHTN]);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found with this roll number' });
    }
    const result = await pool.query(
      'INSERT INTO student_remarks (student_htn, remark, added_by) VALUES ($1, $2, $3) RETURNING id, student_htn, remark, added_by, created_at',
      [studentHTN, remark, addedBy]
    );
    const r = result.rows[0];
    res.json({ id: r.id, studentHTN: r.student_htn, remark: r.remark, addedBy: r.added_by, createdAt: r.created_at });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/api/remarks/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM student_remarks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function mapStudentRow(row: any) {
  return {
    hallTicketNumber: row.hall_ticket_number,
    name: row.name,
    fatherName: row.father_name,
    motherName: row.mother_name,
    sex: row.sex,
    dob: row.dob,
    mobile: row.mobile,
    fatherMobile: row.father_mobile,
    address: row.address,
    course: row.course,
    department: row.department,
    specialization: row.specialization,
    section: row.section,
    admissionCategory: row.admission_category,
    admissionYear: row.admission_year,
    batch: row.batch,
    currentYear: row.current_year,
  };
}

function mapTxRow(row: any) {
  return {
    id: row.id,
    studentHTN: row.student_htn,
    feeType: row.fee_type,
    amount: parseFloat(row.amount),
    challanNumber: row.challan_number,
    paymentMode: row.payment_mode,
    paymentDate: row.payment_date,
    academicYear: row.academic_year,
    financialYear: row.financial_year,
    status: row.status,
    approvedBy: row.approved_by || undefined,
    approvalDate: row.approval_date || undefined,
    targetYear: row.target_year || undefined,
  };
}

function mapLockerRow(row: any) {
  return {
    year: row.year,
    tuitionTarget: parseFloat(row.tuition_target),
    universityTarget: parseFloat(row.university_target),
    otherTarget: parseFloat(row.other_target),
  };
}

router.get('/api/bootstrap', async (_req: Request, res: Response) => {
  try {
    const studentsRes = await pool.query('SELECT * FROM students ORDER BY name');
    const lockersRes = await pool.query('SELECT * FROM year_lockers ORDER BY student_htn, year');
    const txsRes = await pool.query('SELECT * FROM fee_transactions ORDER BY created_at');
    const configRes = await pool.query('SELECT config FROM fee_locker_config WHERE id = 1');

    const txsByHTN: Record<string, Record<number, any[]>> = {};
    for (const row of txsRes.rows) {
      const htn = row.student_htn;
      const yr = row.target_year || 1;
      if (!txsByHTN[htn]) txsByHTN[htn] = {};
      if (!txsByHTN[htn][yr]) txsByHTN[htn][yr] = [];
      txsByHTN[htn][yr].push(mapTxRow(row));
    }

    const config = configRes.rows.length > 0 ? configRes.rows[0].config : null;

    const studentDeptMap: Record<string, string> = {};
    for (const row of studentsRes.rows) {
      studentDeptMap[row.hall_ticket_number] = row.department;
    }

    const lockersByHTN: Record<string, any[]> = {};
    for (const row of lockersRes.rows) {
      const htn = row.student_htn;
      if (!lockersByHTN[htn]) lockersByHTN[htn] = [];
      const locker = mapLockerRow(row);
      const dept = studentDeptMap[htn] || '';
      const targets = getFeeTargetsServer(dept, row.year, config);
      locker.tuitionTarget = targets.tuition;
      locker.universityTarget = targets.university;
      (locker as any).transactions = txsByHTN[htn]?.[row.year] || [];
      lockersByHTN[htn].push(locker);
    }

    const students = studentsRes.rows.map(row => {
      const s = mapStudentRow(row);
      return { ...s, feeLockers: lockersByHTN[row.hall_ticket_number] || [] };
    });

    const allTxs = txsRes.rows.map(mapTxRow);

    res.json({ students, transactions: allTxs, feeLockerConfig: config });
  } catch (err: any) {
    console.error('Bootstrap error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/students', async (req: Request, res: Response) => {
  const s = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO students (hall_ticket_number, name, father_name, mother_name, sex, dob, mobile, father_mobile, address, course, department, specialization, section, admission_category, admission_year, batch, current_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (hall_ticket_number) DO UPDATE SET
         name=EXCLUDED.name, father_name=EXCLUDED.father_name, mother_name=EXCLUDED.mother_name,
         sex=EXCLUDED.sex, dob=EXCLUDED.dob, mobile=EXCLUDED.mobile, father_mobile=EXCLUDED.father_mobile,
         address=EXCLUDED.address, course=EXCLUDED.course, department=EXCLUDED.department,
         specialization=EXCLUDED.specialization, section=EXCLUDED.section,
         admission_category=EXCLUDED.admission_category, admission_year=EXCLUDED.admission_year,
         batch=EXCLUDED.batch, current_year=EXCLUDED.current_year, updated_at=NOW()`,
      [s.hallTicketNumber, s.name, s.fatherName||'', s.motherName||'', s.sex||'', s.dob||'',
       s.mobile||'', s.fatherMobile||'', s.address||'', s.course||'B.E', normalizeDepartment(s.department||''),
       s.specialization||'', s.section||'', s.admissionCategory||'', s.admissionYear||'',
       s.batch||'', s.currentYear||1]
    );

    if (s.feeLockers && Array.isArray(s.feeLockers)) {
      for (const locker of s.feeLockers) {
        await client.query(
          `INSERT INTO year_lockers (student_htn, year, tuition_target, university_target, other_target)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (student_htn, year) DO UPDATE SET
             tuition_target=EXCLUDED.tuition_target, university_target=EXCLUDED.university_target, other_target=EXCLUDED.other_target`,
          [s.hallTicketNumber, locker.year, locker.tuitionTarget||0, locker.universityTarget||0, locker.otherTarget||0]
        );
        if (locker.transactions && Array.isArray(locker.transactions)) {
          for (const tx of locker.transactions) {
            await client.query(
              `INSERT INTO fee_transactions (id, student_htn, fee_type, amount, challan_number, payment_mode, payment_date, academic_year, financial_year, status, approved_by, approval_date, target_year)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
               ON CONFLICT (id) DO UPDATE SET
                 fee_type=EXCLUDED.fee_type, amount=EXCLUDED.amount, challan_number=EXCLUDED.challan_number,
                 payment_mode=EXCLUDED.payment_mode, payment_date=EXCLUDED.payment_date,
                 academic_year=EXCLUDED.academic_year, financial_year=EXCLUDED.financial_year,
                 status=EXCLUDED.status, approved_by=EXCLUDED.approved_by, approval_date=EXCLUDED.approval_date,
                 target_year=EXCLUDED.target_year`,
              [tx.id, s.hallTicketNumber, tx.feeType||'Tuition', tx.amount||0, tx.challanNumber||'',
               tx.paymentMode||'Cash', tx.paymentDate||'', tx.academicYear||'', tx.financialYear||'',
               tx.status||'PENDING', tx.approvedBy||null, tx.approvalDate||null, tx.targetYear||locker.year]
            );
          }
        }
      }
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Add student error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post('/api/students/bulk', async (req: Request, res: Response) => {
  const students = req.body.students;
  if (!Array.isArray(students)) return res.status(400).json({ error: 'students array required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of students) {
      await client.query(
        `INSERT INTO students (hall_ticket_number, name, father_name, mother_name, sex, dob, mobile, father_mobile, address, course, department, specialization, section, admission_category, admission_year, batch, current_year)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT (hall_ticket_number) DO UPDATE SET
           name=EXCLUDED.name, father_name=EXCLUDED.father_name, mother_name=EXCLUDED.mother_name,
           sex=EXCLUDED.sex, dob=EXCLUDED.dob, mobile=EXCLUDED.mobile, father_mobile=EXCLUDED.father_mobile,
           address=EXCLUDED.address, course=EXCLUDED.course, department=EXCLUDED.department,
           specialization=EXCLUDED.specialization, section=EXCLUDED.section,
           admission_category=EXCLUDED.admission_category, admission_year=EXCLUDED.admission_year,
           batch=EXCLUDED.batch, current_year=EXCLUDED.current_year, updated_at=NOW()`,
        [s.hallTicketNumber, s.name, s.fatherName||'', s.motherName||'', s.sex||'', s.dob||'',
         s.mobile||'', s.fatherMobile||'', s.address||'', s.course||'B.E', normalizeDepartment(s.department||''),
         s.specialization||'', s.section||'', s.admissionCategory||'', s.admissionYear||'',
         s.batch||'', s.currentYear||1]
      );

      if (s.feeLockers && Array.isArray(s.feeLockers)) {
        for (const locker of s.feeLockers) {
          await client.query(
            `INSERT INTO year_lockers (student_htn, year, tuition_target, university_target, other_target)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (student_htn, year) DO UPDATE SET
               tuition_target=EXCLUDED.tuition_target, university_target=EXCLUDED.university_target, other_target=EXCLUDED.other_target`,
            [s.hallTicketNumber, locker.year, locker.tuitionTarget||0, locker.universityTarget||0, locker.otherTarget||0]
          );
          if (locker.transactions && Array.isArray(locker.transactions)) {
            for (const tx of locker.transactions) {
              await client.query(
                `INSERT INTO fee_transactions (id, student_htn, fee_type, amount, challan_number, payment_mode, payment_date, academic_year, financial_year, status, approved_by, approval_date, target_year)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                 ON CONFLICT (id) DO UPDATE SET
                   fee_type=EXCLUDED.fee_type, amount=EXCLUDED.amount, challan_number=EXCLUDED.challan_number,
                   payment_mode=EXCLUDED.payment_mode, payment_date=EXCLUDED.payment_date,
                   academic_year=EXCLUDED.academic_year, financial_year=EXCLUDED.financial_year,
                   status=EXCLUDED.status, approved_by=EXCLUDED.approved_by, approval_date=EXCLUDED.approval_date,
                   target_year=EXCLUDED.target_year`,
                [tx.id, s.hallTicketNumber, tx.feeType||'Tuition', tx.amount||0, tx.challanNumber||'',
                 tx.paymentMode||'Cash', tx.paymentDate||'', tx.academicYear||'', tx.financialYear||'',
                 tx.status||'PENDING', tx.approvedBy||null, tx.approvalDate||null, tx.targetYear||locker.year]
              );
            }
          }
        }
      }
    }
    await client.query('COMMIT');
    res.json({ success: true, count: students.length });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Bulk add error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/api/students/:htn', async (req: Request, res: Response) => {
  const htn = req.params.htn;
  const s = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE students SET name=$2, father_name=$3, mother_name=$4, sex=$5, dob=$6, mobile=$7, father_mobile=$8, address=$9, course=$10, department=$11, specialization=$12, section=$13, admission_category=$14, admission_year=$15, batch=$16, current_year=$17, updated_at=NOW()
       WHERE hall_ticket_number=$1`,
      [htn, s.name, s.fatherName||'', s.motherName||'', s.sex||'', s.dob||'',
       s.mobile||'', s.fatherMobile||'', s.address||'', s.course||'B.E', normalizeDepartment(s.department||''),
       s.specialization||'', s.section||'', s.admissionCategory||'', s.admissionYear||'',
       s.batch||'', s.currentYear||1]
    );

    if (s.feeLockers && Array.isArray(s.feeLockers)) {
      for (const locker of s.feeLockers) {
        await client.query(
          `INSERT INTO year_lockers (student_htn, year, tuition_target, university_target, other_target)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (student_htn, year) DO UPDATE SET
             tuition_target=EXCLUDED.tuition_target, university_target=EXCLUDED.university_target, other_target=EXCLUDED.other_target`,
          [htn, locker.year, locker.tuitionTarget||0, locker.universityTarget||0, locker.otherTarget||0]
        );
        if (locker.transactions && Array.isArray(locker.transactions)) {
          for (const tx of locker.transactions) {
            await client.query(
              `INSERT INTO fee_transactions (id, student_htn, fee_type, amount, challan_number, payment_mode, payment_date, academic_year, financial_year, status, approved_by, approval_date, target_year)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
               ON CONFLICT (id) DO UPDATE SET
                 fee_type=EXCLUDED.fee_type, amount=EXCLUDED.amount, challan_number=EXCLUDED.challan_number,
                 payment_mode=EXCLUDED.payment_mode, payment_date=EXCLUDED.payment_date,
                 academic_year=EXCLUDED.academic_year, financial_year=EXCLUDED.financial_year,
                 status=EXCLUDED.status, approved_by=EXCLUDED.approved_by, approval_date=EXCLUDED.approval_date,
                 target_year=EXCLUDED.target_year`,
              [tx.id, htn, tx.feeType||'Tuition', tx.amount||0, tx.challanNumber||'',
               tx.paymentMode||'Cash', tx.paymentDate||'', tx.academicYear||'', tx.financialYear||'',
               tx.status||'PENDING', tx.approvedBy||null, tx.approvalDate||null, tx.targetYear||locker.year]
            );
          }
        }
      }
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete('/api/students/:htn', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM students WHERE hall_ticket_number = $1', [req.params.htn]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/transactions', async (req: Request, res: Response) => {
  const tx = req.body;
  try {
    await pool.query(
      `INSERT INTO fee_transactions (id, student_htn, fee_type, amount, challan_number, payment_mode, payment_date, academic_year, financial_year, status, approved_by, approval_date, target_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO NOTHING`,
      [tx.id, tx.studentHTN, tx.feeType||'Tuition', tx.amount||0, tx.challanNumber||'',
       tx.paymentMode||'Cash', tx.paymentDate||'', tx.academicYear||'', tx.financialYear||'',
       tx.status||'PENDING', tx.approvedBy||null, tx.approvalDate||null, tx.targetYear||null]
    );

    if (tx.targetYear && tx.studentHTN) {
      await pool.query(
        `INSERT INTO year_lockers (student_htn, year, tuition_target, university_target, other_target)
         VALUES ($1, $2, 0, 0, 0)
         ON CONFLICT (student_htn, year) DO NOTHING`,
        [tx.studentHTN, tx.targetYear]
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Add transaction error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/transactions/bulk', async (req: Request, res: Response) => {
  const txs = req.body.transactions;
  if (!Array.isArray(txs)) return res.status(400).json({ error: 'transactions array required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const tx of txs) {
      await client.query(
        `INSERT INTO fee_transactions (id, student_htn, fee_type, amount, challan_number, payment_mode, payment_date, academic_year, financial_year, status, approved_by, approval_date, target_year)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO NOTHING`,
        [tx.id, tx.studentHTN, tx.feeType||'Tuition', tx.amount||0, tx.challanNumber||'',
         tx.paymentMode||'Cash', tx.paymentDate||'', tx.academicYear||'', tx.financialYear||'',
         tx.status||'PENDING', tx.approvedBy||null, tx.approvalDate||null, tx.targetYear||null]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true, count: txs.length });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/api/transactions/approve', async (req: Request, res: Response) => {
  const { txIds, approverName } = req.body;
  if (!Array.isArray(txIds)) return res.status(400).json({ error: 'txIds array required' });

  try {
    const approvalDate = new Date().toISOString().split('T')[0];
    await pool.query(
      `UPDATE fee_transactions SET status='APPROVED', approved_by=$1, approval_date=$2 WHERE id = ANY($3::text[])`,
      [approverName, approvalDate, txIds]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/api/transactions/reject', async (req: Request, res: Response) => {
  const { txIds } = req.body;
  if (!Array.isArray(txIds)) return res.status(400).json({ error: 'txIds array required' });

  try {
    await pool.query(
      `UPDATE fee_transactions SET status='REJECTED' WHERE id = ANY($1::text[])`,
      [txIds]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/fee-config', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT config FROM fee_locker_config WHERE id = 1');
    res.json(result.rows.length > 0 ? result.rows[0].config : null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/api/fee-config', async (req: Request, res: Response) => {
  const config = req.body;
  try {
    await pool.query(
      `INSERT INTO fee_locker_config (id, config) VALUES (1, $1::jsonb)
       ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config`,
      [JSON.stringify(config)]
    );

    const studentsRes = await pool.query('SELECT hall_ticket_number, department FROM students');
    for (const s of studentsRes.rows) {
      const dept = s.department.toUpperCase();
      let groupADepts = (config.groupA?.departments || []).map((d: string) => d.toUpperCase());
      let groupBDepts = (config.groupB?.departments || []).map((d: string) => d.toUpperCase());
      let groupCDepts = (config.groupC?.departments || []).map((d: string) => d.toUpperCase());

      if (groupCDepts.includes(dept) || dept.startsWith('ME-') || s.department.startsWith('M.E')) {
        await pool.query(
          `UPDATE year_lockers SET tuition_target = CASE WHEN year = 1 THEN $1 ELSE $2 END, university_target = CASE WHEN year = 1 THEN $3 ELSE $4 END WHERE student_htn = $5`,
          [config.groupC.year1Tuition, config.groupC.year2Tuition, config.groupC.year1University, config.groupC.year2University, s.hall_ticket_number]
        );
      } else if (groupBDepts.includes(dept)) {
        await pool.query(
          `UPDATE year_lockers SET tuition_target = $1, university_target = $2 WHERE student_htn = $3`,
          [config.groupB.tuition, config.groupB.university, s.hall_ticket_number]
        );
      } else {
        await pool.query(
          `UPDATE year_lockers SET tuition_target = $1, university_target = $2 WHERE student_htn = $3`,
          [config.groupA.tuition, config.groupA.university, s.hall_ticket_number]
        );
      }
    }

    res.json({ success: true, updated: studentsRes.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const requireAdmin = (req: Request, res: Response, next: Function) => {
  const role = req.headers['x-user-role'] as string;
  if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
};

router.get('/api/admin/db-overview', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [studentsCount, lockersCount, txCount, remarksCount, usersCount, configCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM students'),
      pool.query('SELECT COUNT(*) as count FROM year_lockers'),
      pool.query('SELECT COUNT(*) as count FROM fee_transactions'),
      pool.query('SELECT COUNT(*) as count FROM student_remarks'),
      pool.query('SELECT COUNT(*) as count FROM app_users'),
      pool.query('SELECT COUNT(*) as count FROM fee_locker_config'),
    ]);
    const deptBreakdown = await pool.query('SELECT department, COUNT(*) as count FROM students GROUP BY department ORDER BY department');
    res.json({
      tables: {
        students: parseInt(studentsCount.rows[0].count),
        year_lockers: parseInt(lockersCount.rows[0].count),
        fee_transactions: parseInt(txCount.rows[0].count),
        student_remarks: parseInt(remarksCount.rows[0].count),
        app_users: parseInt(usersCount.rows[0].count),
        fee_locker_config: parseInt(configCount.rows[0].count),
      },
      departmentBreakdown: deptBreakdown.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/admin/table/:tableName', requireAdmin, async (req: Request, res: Response) => {
  const allowed = ['students', 'year_lockers', 'fee_transactions', 'student_remarks', 'app_users', 'fee_locker_config'];
  const tableName = req.params.tableName as string;
  if (!allowed.includes(tableName)) return res.status(400).json({ error: 'Invalid table name' });
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  try {
    const countRes = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const selectCols = tableName === 'app_users' ? 'id, username, name, email, role, created_at' : '*';
    const dataRes = await pool.query(`SELECT ${selectCols} FROM ${tableName} ORDER BY 1 LIMIT $1 OFFSET $2`, [limit, offset]);
    res.json({ total: parseInt(countRes.rows[0].count), rows: dataRes.rows, columns: dataRes.fields.map(f => f.name) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/api/admin/students/department/:dept', requireAdmin, async (req: Request, res: Response) => {
  const { dept } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const studentsRes = await client.query('SELECT hall_ticket_number FROM students WHERE department = $1', [dept]);
    const htns = studentsRes.rows.map((r: any) => r.hall_ticket_number);
    if (htns.length > 0) {
      await client.query('DELETE FROM student_remarks WHERE student_htn = ANY($1)', [htns]);
      await client.query('DELETE FROM fee_transactions WHERE student_htn = ANY($1)', [htns]);
      await client.query('DELETE FROM year_lockers WHERE student_htn = ANY($1)', [htns]);
      await client.query('DELETE FROM students WHERE department = $1', [dept]);
    }
    await client.query('COMMIT');
    res.json({ success: true, deleted: htns.length });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete('/api/admin/students/all', requireAdmin, async (_req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM student_remarks');
    await client.query('DELETE FROM fee_transactions');
    await client.query('DELETE FROM year_lockers');
    await client.query('DELETE FROM students');
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
