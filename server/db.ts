import pg from 'pg';
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

      CREATE INDEX IF NOT EXISTS idx_year_lockers_student ON year_lockers(student_htn);
      CREATE INDEX IF NOT EXISTS idx_fee_transactions_student ON fee_transactions(student_htn);
      CREATE INDEX IF NOT EXISTS idx_fee_transactions_status ON fee_transactions(status);
    `);
    console.log('Database tables initialized successfully');
  } finally {
    client.release();
  }
}
