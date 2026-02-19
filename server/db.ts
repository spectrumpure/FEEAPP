import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        hall_ticket_number VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        father_name VARCHAR(200) DEFAULT '',
        mother_name VARCHAR(200) DEFAULT '',
        sex VARCHAR(10) DEFAULT '',
        dob VARCHAR(20) DEFAULT '',
        mobile VARCHAR(20) DEFAULT '',
        father_mobile VARCHAR(20) DEFAULT '',
        address TEXT DEFAULT '',
        course VARCHAR(10) DEFAULT 'B.E',
        department VARCHAR(200) DEFAULT '',
        specialization VARCHAR(100) DEFAULT '',
        section VARCHAR(10) DEFAULT '',
        admission_category VARCHAR(50) DEFAULT '',
        admission_year VARCHAR(10) DEFAULT '',
        batch VARCHAR(20) DEFAULT '',
        current_year INT DEFAULT 1,
        aadhaar_number VARCHAR(20) DEFAULT '',
        entry_type VARCHAR(10) DEFAULT 'REGULAR',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS year_lockers (
        id SERIAL PRIMARY KEY,
        student_htn VARCHAR(50) NOT NULL REFERENCES students(hall_ticket_number) ON DELETE CASCADE,
        year INT NOT NULL,
        tuition_target NUMERIC(12,2) DEFAULT 0,
        university_target NUMERIC(12,2) DEFAULT 0,
        other_target NUMERIC(12,2) DEFAULT 0,
        UNIQUE(student_htn, year)
      );

      CREATE TABLE IF NOT EXISTS fee_transactions (
        id VARCHAR(100) PRIMARY KEY,
        student_htn VARCHAR(50) NOT NULL REFERENCES students(hall_ticket_number) ON DELETE CASCADE,
        fee_type VARCHAR(20) NOT NULL DEFAULT 'Tuition',
        amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        challan_number VARCHAR(100) DEFAULT '',
        payment_mode VARCHAR(20) DEFAULT 'Cash',
        payment_date VARCHAR(20) DEFAULT '',
        academic_year VARCHAR(20) DEFAULT '',
        financial_year VARCHAR(20) DEFAULT '',
        status VARCHAR(20) DEFAULT 'PENDING',
        approved_by VARCHAR(200),
        approval_date VARCHAR(20),
        target_year INT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS fee_locker_config (
        id INT PRIMARY KEY DEFAULT 1,
        config JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(200) NOT NULL,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(200) DEFAULT '',
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS student_remarks (
        id SERIAL PRIMARY KEY,
        student_htn VARCHAR(50) NOT NULL REFERENCES students(hall_ticket_number) ON DELETE CASCADE,
        remark TEXT NOT NULL,
        added_by VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_year_lockers_student ON year_lockers(student_htn);
      CREATE INDEX IF NOT EXISTS idx_fee_transactions_student ON fee_transactions(student_htn);
      CREATE INDEX IF NOT EXISTS idx_fee_transactions_status ON fee_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_student_remarks_htn ON student_remarks(student_htn);
    `);

    const usersExist = await client.query('SELECT COUNT(*) FROM app_users');
    if (parseInt(usersExist.rows[0].count) === 0) {
      const defaultUsers = [
        { username: 'admin', password: 'Mjcet@Admin#2026', name: 'System Admin', email: 'admin@mjcet.ac.in', role: 'ADMIN' },
        { username: 'accountant', password: 'Mjcet@Acc#2026', name: 'Head Accountant', email: 'finance@mjcet.ac.in', role: 'ACCOUNTANT' },
        { username: 'principal', password: 'Mjcet@Prin#2026', name: 'Dr. Principal', email: 'principal@mjcet.ac.in', role: 'PRINCIPAL' },
        { username: 'examcell', password: 'Mjcet@Exam#2026', name: 'Exam Controller', email: 'exam@mjcet.ac.in', role: 'EXAM_CELL' },
      ];
      for (const u of defaultUsers) {
        const hash = await bcrypt.hash(u.password, 10);
        await client.query(
          'INSERT INTO app_users (username, password, name, email, role) VALUES ($1, $2, $3, $4, $5)',
          [u.username, hash, u.name, u.email, u.role]
        );
      }
      console.log('Default users created with hashed passwords');
    }

    await client.query(`
      ALTER TABLE students ADD COLUMN IF NOT EXISTS entry_type VARCHAR(10) DEFAULT 'REGULAR';
      UPDATE students SET admission_category = TRIM(admission_category)
        WHERE admission_category != TRIM(admission_category);
      UPDATE students SET admission_category = 'MANAGEMENT'
        WHERE TRIM(UPPER(admission_category)) IN ('MANAGEMENT.', 'M.Q', 'M.Q.');
    `);

    console.log('Database tables initialized successfully');
  } finally {
    client.release();
  }
}
