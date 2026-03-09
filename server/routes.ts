import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const router = Router();

const normalizeCategory = (raw: string): string => {
  const val = raw.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (val === 'MQ') return 'MANAGEMENT';
  if (val.includes('MANAGEMENT')) return 'MANAGEMENT';
  return raw.trim();
};

let cachedCustomDeptCodes: string[] = [];
async function refreshCustomDeptCodes() {
  try {
    const res = await pool.query('SELECT code FROM custom_departments');
    cachedCustomDeptCodes = res.rows.map(r => r.code);
  } catch {}
}

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
  if (mapping[val]) return mapping[val];
  const customMatch = cachedCustomDeptCodes.find(c => c.toUpperCase().replace(/[^A-Z0-9]/g, '') === val);
  if (customMatch) return customMatch;
  return raw.trim();
};

function admissionYearToBatchKey(admissionYear?: string): string {
  if (!admissionYear) return '';
  const y = parseInt(admissionYear);
  if (isNaN(y)) return '';
  return `${y}-${y + 1}`;
}

const getFeeTargetsFromConfig = (department: string, year: number, config: any, entryType?: string): { tuition: number; university: number } => {
  const code = normalizeDepartment(department);
  const groupCDepts = config?.groupC?.departments || ['ME-CADCAM', 'ME-CSE', 'ME-STRUCT', 'ME-VLSI'];
  const groupBDepts = config?.groupB?.departments || ['CS-AI', 'CS-DS', 'CS-AIML', 'IT', 'EEE', 'PROD'];
  const isME = groupCDepts.includes(code) || code.startsWith('ME-');
  const duration = isME ? 2 : 4;
  if (year > duration) return { tuition: 0, university: 0 };
  if (entryType?.toUpperCase() === 'LATERAL' && config?.lateralDeptYearTargets?.[code]?.[String(year)]) {
    return config.lateralDeptYearTargets[code][String(year)];
  }
  if (config?.deptYearTargets?.[code]?.[String(year)]) {
    return config.deptYearTargets[code][String(year)];
  }
  if (isME && config?.groupC) {
    return year === 1
      ? { tuition: config.groupC.year1Tuition || 130000, university: config.groupC.year1University || 11650 }
      : { tuition: config.groupC.year2Tuition || 130000, university: config.groupC.year2University || 4500 };
  }
  if (groupBDepts.includes(code) && config?.groupB) {
    return { tuition: config.groupB.tuition || 125000, university: config.groupB.university || 9650 };
  }
  if (config?.groupA) {
    return { tuition: config.groupA.tuition || 125000, university: config.groupA.university || 12650 };
  }
  return { tuition: 125000, university: 12650 };
};

const getFeeTargetsServer = (department: string, year: number, config: any, entryType?: string, admissionYear?: string, batchConfig?: any): { tuition: number; university: number } => {
  if (admissionYear) {
    const batchKey = admissionYearToBatchKey(admissionYear);
    if (batchKey && batchConfig?.batches?.[batchKey]) {
      const result = getFeeTargetsFromConfig(department, year, batchConfig.batches[batchKey], entryType);
      if (result.tuition > 0 || result.university > 0) {
        return result;
      }
    }
  }
  return getFeeTargetsFromConfig(department, year, config, entryType);
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

router.get('/api/auth/users', async (req: Request, res: Response) => {
  const role = (req.headers['x-user-role'] as string || '').toUpperCase();
  if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  try {
    const result = await pool.query('SELECT id, username, name, email, role FROM app_users ORDER BY id');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/api/auth/admin-reset-password', async (req: Request, res: Response) => {
  const role = (req.headers['x-user-role'] as string || '').toUpperCase();
  if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
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
  const { studentHTN, hallTicketNumber, remark, addedBy } = req.body;
  const htn = studentHTN || hallTicketNumber;
  try {
    const studentCheck = await pool.query('SELECT hall_ticket_number FROM students WHERE hall_ticket_number = $1', [htn]);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found with this roll number' });
    }
    const result = await pool.query(
      'INSERT INTO student_remarks (student_htn, remark, added_by) VALUES ($1, $2, $3) RETURNING id, student_htn, remark, added_by, created_at',
      [htn, remark, addedBy]
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
    aadhaarNumber: row.aadhaar_number || '',
    entryType: row.entry_type || 'REGULAR',
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
    await refreshCustomDeptCodes();
    const studentsRes = await pool.query('SELECT * FROM students ORDER BY name');
    const lockersRes = await pool.query('SELECT * FROM year_lockers ORDER BY student_htn, year');
    const txsRes = await pool.query('SELECT * FROM fee_transactions ORDER BY created_at');
    const configRes = await pool.query('SELECT config FROM fee_locker_config WHERE id = 1');
    const batchConfigRes = await pool.query('SELECT config FROM batch_fee_config WHERE id = 1');

    const txsByHTN: Record<string, Record<number, any[]>> = {};
    for (const row of txsRes.rows) {
      const htn = row.student_htn;
      const yr = row.target_year || 1;
      if (!txsByHTN[htn]) txsByHTN[htn] = {};
      if (!txsByHTN[htn][yr]) txsByHTN[htn][yr] = [];
      txsByHTN[htn][yr].push(mapTxRow(row));
    }

    const customDeptsRes = await pool.query('SELECT * FROM custom_departments ORDER BY created_at');
    const customDepartments = customDeptsRes.rows.map(r => ({
      id: `custom-${r.id}`,
      name: r.name,
      code: r.code,
      courseType: r.course_type,
      duration: r.duration,
      specializations: r.specializations || ['General']
    }));

    const config = configRes.rows.length > 0 ? configRes.rows[0].config : null;
    const batchConfig = batchConfigRes.rows.length > 0 ? batchConfigRes.rows[0].config : null;

    const studentDeptMap: Record<string, string> = {};
    const studentEntryTypeMap: Record<string, string> = {};
    const studentAdmissionYearMap: Record<string, string> = {};
    for (const row of studentsRes.rows) {
      studentDeptMap[row.hall_ticket_number] = row.department;
      studentEntryTypeMap[row.hall_ticket_number] = row.entry_type || 'REGULAR';
      studentAdmissionYearMap[row.hall_ticket_number] = row.admission_year || '';
    }

    const lockersByHTN: Record<string, any[]> = {};
    for (const row of lockersRes.rows) {
      const htn = row.student_htn;
      if (!lockersByHTN[htn]) lockersByHTN[htn] = [];
      const locker = mapLockerRow(row);
      const dept = studentDeptMap[htn] || '';
      const entryType = studentEntryTypeMap[htn] || 'REGULAR';
      const admYear = studentAdmissionYearMap[htn] || '';
      const targets = getFeeTargetsServer(dept, row.year, config, entryType, admYear, batchConfig);
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

    res.json({ students, transactions: allTxs, feeLockerConfig: config, batchFeeLockerConfig: batchConfig, customDepartments });
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
      `INSERT INTO students (hall_ticket_number, name, father_name, mother_name, sex, dob, mobile, father_mobile, address, course, department, specialization, section, admission_category, admission_year, batch, current_year, aadhaar_number, entry_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (hall_ticket_number) DO UPDATE SET
         name=EXCLUDED.name, father_name=EXCLUDED.father_name, mother_name=EXCLUDED.mother_name,
         sex=EXCLUDED.sex, dob=EXCLUDED.dob, mobile=EXCLUDED.mobile, father_mobile=EXCLUDED.father_mobile,
         address=EXCLUDED.address, course=EXCLUDED.course, department=EXCLUDED.department,
         specialization=EXCLUDED.specialization, section=EXCLUDED.section,
         admission_category=EXCLUDED.admission_category, admission_year=EXCLUDED.admission_year,
         batch=EXCLUDED.batch, current_year=EXCLUDED.current_year, aadhaar_number=EXCLUDED.aadhaar_number, entry_type=EXCLUDED.entry_type, updated_at=NOW()`,
      [s.hallTicketNumber, s.name, s.fatherName||'', s.motherName||'', s.sex||'', s.dob||'',
       s.mobile||'', s.fatherMobile||'', s.address||'', s.course||'B.E', normalizeDepartment(s.department||''),
       s.specialization||'', s.section||'', normalizeCategory(s.admissionCategory||''), s.admissionYear||'',
       s.batch||'', s.currentYear||1, s.aadhaarNumber||'', s.entryType||'REGULAR']
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

  const CHUNK_SIZE = 20;
  let totalInserted = 0;
  const errors: string[] = [];

  for (let ci = 0; ci < students.length; ci += CHUNK_SIZE) {
    const chunk = students.slice(ci, ci + CHUNK_SIZE);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT setval('year_lockers_id_seq', COALESCE((SELECT MAX(id) FROM year_lockers), 0) + 1, false)");

      for (const s of chunk) {
        await client.query(
          `INSERT INTO students (hall_ticket_number, name, father_name, mother_name, sex, dob, mobile, father_mobile, address, course, department, specialization, section, admission_category, admission_year, batch, current_year, aadhaar_number, entry_type)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
           ON CONFLICT (hall_ticket_number) DO UPDATE SET
             name=EXCLUDED.name, father_name=EXCLUDED.father_name, mother_name=EXCLUDED.mother_name,
             sex=EXCLUDED.sex, dob=EXCLUDED.dob, mobile=EXCLUDED.mobile, father_mobile=EXCLUDED.father_mobile,
             address=EXCLUDED.address, course=EXCLUDED.course, department=EXCLUDED.department,
             specialization=EXCLUDED.specialization, section=EXCLUDED.section,
             admission_category=EXCLUDED.admission_category, admission_year=EXCLUDED.admission_year,
             batch=EXCLUDED.batch, current_year=EXCLUDED.current_year, aadhaar_number=EXCLUDED.aadhaar_number, entry_type=EXCLUDED.entry_type, updated_at=NOW()`,
          [s.hallTicketNumber, s.name, s.fatherName||'', s.motherName||'', s.sex||'', s.dob||'',
           s.mobile||'', s.fatherMobile||'', s.address||'', s.course||'B.E', normalizeDepartment(s.department||''),
           s.specialization||'', s.section||'', normalizeCategory(s.admissionCategory||''), s.admissionYear||'',
           s.batch||'', s.currentYear||1, s.aadhaarNumber||'', s.entryType||'REGULAR']
        );

        if (s.feeLockers && Array.isArray(s.feeLockers)) {
          for (const locker of s.feeLockers) {
            const lockerCheck = await client.query('SELECT id FROM year_lockers WHERE student_htn=$1 AND year=$2', [s.hallTicketNumber, locker.year]);
            if (lockerCheck.rows.length > 0) {
              await client.query(
                `UPDATE year_lockers SET tuition_target=$1, university_target=$2, other_target=$3 WHERE student_htn=$4 AND year=$5`,
                [locker.tuitionTarget||0, locker.universityTarget||0, locker.otherTarget||0, s.hallTicketNumber, locker.year]
              );
            } else {
              await client.query(
                `INSERT INTO year_lockers (student_htn, year, tuition_target, university_target, other_target) VALUES ($1,$2,$3,$4,$5)`,
                [s.hallTicketNumber, locker.year, locker.tuitionTarget||0, locker.universityTarget||0, locker.otherTarget||0]
              );
            }
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
      totalInserted += chunk.length;
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Bulk add chunk error:', err);
      errors.push(`Chunk ${ci}-${ci + chunk.length}: ${err.message}`);
    } finally {
      client.release();
    }
  }

  if (errors.length > 0 && totalInserted === 0) {
    res.status(500).json({ error: errors.join('; ') });
  } else {
    res.json({ success: true, count: totalInserted, totalRequested: students.length, errors: errors.length > 0 ? errors : undefined });
  }
});

router.put('/api/students/:htn', async (req: Request, res: Response) => {
  const htn = req.params.htn;
  const s = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE students SET name=$2, father_name=$3, mother_name=$4, sex=$5, dob=$6, mobile=$7, father_mobile=$8, address=$9, course=$10, department=$11, specialization=$12, section=$13, admission_category=$14, admission_year=$15, batch=$16, current_year=$17, aadhaar_number=$18, entry_type=$19, updated_at=NOW()
       WHERE hall_ticket_number=$1`,
      [htn, s.name, s.fatherName||'', s.motherName||'', s.sex||'', s.dob||'',
       s.mobile||'', s.fatherMobile||'', s.address||'', s.course||'B.E', normalizeDepartment(s.department||''),
       s.specialization||'', s.section||'', normalizeCategory(s.admissionCategory||''), s.admissionYear||'',
       s.batch||'', s.currentYear||1, s.aadhaarNumber||'', s.entryType||'REGULAR']
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

router.post('/api/students/bulk-delete', async (req: Request, res: Response) => {
  const { hallTicketNumbers } = req.body;
  if (!Array.isArray(hallTicketNumbers) || hallTicketNumbers.length === 0) {
    return res.status(400).json({ error: 'hallTicketNumbers array required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'DELETE FROM students WHERE hall_ticket_number = ANY($1::text[])',
      [hallTicketNumbers]
    );
    await client.query('COMMIT');
    res.json({ success: true, deleted: result.rowCount });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
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

  const CHUNK_SIZE = 50;
  let totalInserted = 0;
  const errors: string[] = [];

  for (let ci = 0; ci < txs.length; ci += CHUNK_SIZE) {
    const chunk = txs.slice(ci, ci + CHUNK_SIZE);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const tx of chunk) {
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
      totalInserted += chunk.length;
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Bulk tx chunk error:', err);
      errors.push(`Chunk ${ci}-${ci + chunk.length}: ${err.message}`);
    } finally {
      client.release();
    }
  }

  if (errors.length > 0 && totalInserted === 0) {
    res.status(500).json({ error: errors.join('; ') });
  } else {
    res.json({ success: true, count: totalInserted, totalRequested: txs.length, errors: errors.length > 0 ? errors : undefined });
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

router.put('/api/transactions/:id', async (req: Request, res: Response) => {
  const role = (req.headers['x-user-role'] as string || '').toUpperCase();
  if (role !== 'ADMIN' && role !== 'ACCOUNTANT') {
    return res.status(403).json({ error: 'Only Admin or Accountant can edit transactions' });
  }

  const { id } = req.params;
  const { amount, feeType, challanNumber, paymentMode, paymentDate, targetYear } = req.body;

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 0) return res.status(400).json({ error: 'Amount must be a non-negative number' });

  const allowedFeeTypes = ['Tuition', 'University', 'Other'];
  if (!allowedFeeTypes.includes(feeType)) return res.status(400).json({ error: 'Fee type must be Tuition, University, or Other' });

  const allowedModes = ['Online', 'Challan', 'DD', 'Cash', 'UPI'];
  const mode = paymentMode || 'Cash';
  if (!allowedModes.includes(mode)) return res.status(400).json({ error: 'Invalid payment mode' });

  const ty = targetYear ? parseInt(targetYear) : null;
  if (ty !== null && (ty < 1 || ty > 4)) return res.status(400).json({ error: 'Target year must be between 1 and 4' });

  try {
    let financialYear = '';
    if (paymentDate) {
      const pd = new Date(paymentDate.includes('.') ? paymentDate.split('.').reverse().join('-') : paymentDate.includes('-') && paymentDate.split('-')[0].length === 2 ? paymentDate.split('-').reverse().join('-') : paymentDate);
      if (!isNaN(pd.getTime())) {
        const m = pd.getMonth() + 1;
        const y = pd.getFullYear();
        const fyStart = m >= 4 ? y : y - 1;
        financialYear = `${fyStart}-${(fyStart + 1).toString().slice(-2)}`;
      }
    }

    const result = await pool.query(
      `UPDATE fee_transactions SET amount=$1, fee_type=$2, challan_number=$3, payment_mode=$4, payment_date=$5, target_year=$6, financial_year=$7 WHERE id=$8`,
      [parsedAmount, feeType, challanNumber || '', mode, paymentDate || '', ty, financialYear, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
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

    const batchConfigRes = await pool.query('SELECT config FROM batch_fee_config WHERE id = 1');
    const batchConfig = batchConfigRes.rows.length > 0 ? batchConfigRes.rows[0].config : null;

    const studentsRes = await pool.query('SELECT hall_ticket_number, department, entry_type, admission_year FROM students');
    const lockersRes = await pool.query('SELECT student_htn, year FROM year_lockers');
    const studentLockers: Record<string, number[]> = {};
    for (const row of lockersRes.rows) {
      if (!studentLockers[row.student_htn]) studentLockers[row.student_htn] = [];
      studentLockers[row.student_htn].push(row.year);
    }

    for (const s of studentsRes.rows) {
      const dept = s.department.toUpperCase();
      const isLateral = (s.entry_type || '').toUpperCase() === 'LATERAL';
      const admYear = s.admission_year || '';
      const years = studentLockers[s.hall_ticket_number] || [];

      for (const yr of years) {
        const targets = getFeeTargetsServer(dept, yr, config, isLateral ? 'LATERAL' : 'REGULAR', admYear, batchConfig);
        await pool.query(
          `UPDATE year_lockers SET tuition_target = $1, university_target = $2 WHERE student_htn = $3 AND year = $4`,
          [targets.tuition, targets.university, s.hall_ticket_number, yr]
        );
      }
    }

    res.json({ success: true, updated: studentsRes.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/batch-fee-config', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT config FROM batch_fee_config WHERE id = 1');
    res.json(result.rows.length > 0 ? result.rows[0].config : { batches: {} });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/api/batch-fee-config', async (req: Request, res: Response) => {
  const batchConfig = req.body;
  try {
    await pool.query(
      `INSERT INTO batch_fee_config (id, config) VALUES (1, $1::jsonb)
       ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config`,
      [JSON.stringify(batchConfig)]
    );

    const configRes = await pool.query('SELECT config FROM fee_locker_config WHERE id = 1');
    const defaultConfig = configRes.rows.length > 0 ? configRes.rows[0].config : null;

    const studentsRes = await pool.query('SELECT hall_ticket_number, department, entry_type, admission_year FROM students');
    const lockersRes = await pool.query('SELECT student_htn, year FROM year_lockers');
    const studentLockers: Record<string, number[]> = {};
    for (const row of lockersRes.rows) {
      if (!studentLockers[row.student_htn]) studentLockers[row.student_htn] = [];
      studentLockers[row.student_htn].push(row.year);
    }

    for (const s of studentsRes.rows) {
      const dept = s.department.toUpperCase();
      const isLateral = (s.entry_type || '').toUpperCase() === 'LATERAL';
      const admYear = s.admission_year || '';
      const years = studentLockers[s.hall_ticket_number] || [];

      for (const yr of years) {
        const targets = getFeeTargetsServer(dept, yr, defaultConfig, isLateral ? 'LATERAL' : 'REGULAR', admYear, batchConfig);
        await pool.query(
          `UPDATE year_lockers SET tuition_target = $1, university_target = $2 WHERE student_htn = $3 AND year = $4`,
          [targets.tuition, targets.university, s.hall_ticket_number, yr]
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
    const countsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM students) as students_count,
        (SELECT COUNT(*) FROM year_lockers) as lockers_count,
        (SELECT COUNT(*) FROM fee_transactions) as tx_count,
        (SELECT COUNT(*) FROM student_remarks) as remarks_count,
        (SELECT COUNT(*) FROM app_users) as users_count,
        (SELECT COUNT(*) FROM fee_locker_config) as config_count,
        (SELECT COUNT(*) FROM batch_fee_config) as batch_config_count
    `);
    const c = countsResult.rows[0];
    const deptBreakdown = await pool.query('SELECT department, COUNT(*) as count FROM students GROUP BY department ORDER BY department');
    res.json({
      tables: {
        students: parseInt(c.students_count),
        year_lockers: parseInt(c.lockers_count),
        fee_transactions: parseInt(c.tx_count),
        student_remarks: parseInt(c.remarks_count),
        app_users: parseInt(c.users_count),
        fee_locker_config: parseInt(c.config_count),
        batch_fee_config: parseInt(c.batch_config_count),
      },
      departmentBreakdown: deptBreakdown.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/admin/table/:tableName', requireAdmin, async (req: Request, res: Response) => {
  const allowed = ['students', 'year_lockers', 'fee_transactions', 'student_remarks', 'app_users', 'fee_locker_config', 'batch_fee_config', 'custom_departments'];
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

router.delete('/api/admin/students/batch/:year', requireAdmin, async (req: Request, res: Response) => {
  const { year } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const studentsRes = await client.query('SELECT hall_ticket_number FROM students WHERE admission_year = $1', [year]);
    const htns = studentsRes.rows.map((r: any) => r.hall_ticket_number);
    if (htns.length > 0) {
      await client.query('DELETE FROM student_remarks WHERE student_htn = ANY($1)', [htns]);
      await client.query('DELETE FROM fee_transactions WHERE student_htn = ANY($1)', [htns]);
      await client.query('DELETE FROM year_lockers WHERE student_htn = ANY($1)', [htns]);
      await client.query('DELETE FROM students WHERE admission_year = $1', [year]);
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

router.get('/export/students-csv', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT s.hall_ticket_number, s.name, s.department, s.sex, s.date_of_birth,
             s.admission_category, s.student_mobile, s.father_mobile, s.father_name,
             s.mother_name, s.address, s.aadhaar_number, s.admission_year, s.entry_type,
             s.batch, s.current_year, s.course_type
      FROM students s ORDER BY s.hall_ticket_number
    `);
    const headers = ['Roll No','Student Name','Department','Sex','Date of Birth','Admission Category','Student Mobile','Father Mobile','Father Name','Mother Name','Address','Aadhaar Number','Admission Year','Entry Type','Batch','Current Year','Course Type'];
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const rows = result.rows.map(r => [
      r.hall_ticket_number, r.name, r.department, r.sex, r.date_of_birth,
      r.admission_category, r.student_mobile, r.father_mobile, r.father_name,
      r.mother_name, r.address, r.aadhaar_number, r.admission_year, r.entry_type,
      r.batch, r.current_year, r.course_type
    ].map(escapeCSV).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_export.csv');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/departments', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM custom_departments ORDER BY created_at');
    res.json(result.rows.map(r => ({
      id: `custom-${r.id}`,
      name: r.name,
      code: r.code,
      courseType: r.course_type,
      duration: r.duration,
      specializations: r.specializations || ['General']
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/departments', requireAdmin, async (req: Request, res: Response) => {
  const { name, code, courseType, duration } = req.body;
  if (!name || !code || !courseType || !duration) {
    return res.status(400).json({ error: 'Name, code, courseType, and duration are required' });
  }
  if (!['B.E', 'M.E'].includes(courseType)) {
    return res.status(400).json({ error: 'Course type must be B.E or M.E' });
  }
  const dur = parseInt(duration);
  if (isNaN(dur) || dur < 1 || dur > 6) {
    return res.status(400).json({ error: 'Duration must be between 1 and 6 years' });
  }
  try {
    const existing = await pool.query('SELECT id FROM custom_departments WHERE code = $1', [code.toUpperCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `Department with code "${code}" already exists` });
    }
    const result = await pool.query(
      'INSERT INTO custom_departments (name, code, course_type, duration) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, code.toUpperCase(), courseType, dur]
    );
    await refreshCustomDeptCodes();
    const r = result.rows[0];
    res.json({
      id: `custom-${r.id}`,
      name: r.name,
      code: r.code,
      courseType: r.course_type,
      duration: r.duration,
      specializations: r.specializations || ['General']
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/api/departments/:id', requireAdmin, async (req: Request, res: Response) => {
  const numId = (req.params.id as string).replace('custom-', '');
  try {
    await pool.query('DELETE FROM custom_departments WHERE id = $1', [numId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/cert-counter/:type', async (req: Request, res: Response) => {
  const certType = req.params.type;
  try {
    const result = await pool.query('SELECT last_number, prefix FROM certificate_counters WHERE cert_type = $1', [certType]);
    if (result.rows.length === 0) {
      res.json({ lastNumber: 0, prefix: '' });
    } else {
      res.json({ lastNumber: result.rows[0].last_number, prefix: result.rows[0].prefix });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/cert-counter/:type/next', async (req: Request, res: Response) => {
  const certType = req.params.type;
  if (!['bonafide', 'tc'].includes(certType)) {
    return res.status(400).json({ error: 'Invalid certificate type' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO certificate_counters (cert_type, last_number, prefix)
       VALUES ($1, 1, '')
       ON CONFLICT (cert_type) DO UPDATE SET last_number = certificate_counters.last_number + 1, updated_at = NOW()
       RETURNING last_number, prefix`,
      [certType]
    );
    res.json({ number: result.rows[0].last_number, prefix: result.rows[0].prefix });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/api/cert-counter/:type', async (req: Request, res: Response) => {
  const certType = req.params.type;
  const { lastNumber, prefix } = req.body;
  try {
    await pool.query(
      `UPDATE certificate_counters SET last_number = $1, prefix = COALESCE($2, prefix), updated_at = NOW()
       WHERE cert_type = $3`,
      [lastNumber, prefix, certType]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
