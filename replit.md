# MJCET FEE APP - College Fee Management System

## Overview
A centralized college fee management and governance system built with React, TypeScript, and Vite. The app provides role-based access for Administrator, Accountant, Principal, and Exam Cell users to manage fee entries, approvals, reports, and student directories.

## Project Architecture
- **Frontend**: React 19 with TypeScript
- **Backend**: Express.js server with PostgreSQL database
- **Build Tool**: Vite 6 (served via Express middleware in dev)
- **Database**: PostgreSQL (Neon-backed via Replit)
- **Styling**: Tailwind CSS (via CDN)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Auth**: bcryptjs for password hashing
- **Entry Point**: `server/index.ts` (Express) -> Vite middleware -> `index.tsx` -> `App.tsx`

## Project Structure
- `/` - Root contains main frontend app files (App.tsx, index.tsx, store.tsx, types.ts, constants.tsx)
- `/server/` - Backend Express server (index.ts, db.ts, routes.ts)
- `/components/` - Shared layout components
- `/views/` - Page-level view components (Dashboard, FeeEntry, FeeLedger, Reports, DefaulterList, etc.)
- `/public/` - Static assets (logo, college photo)

## Database Schema
- **students** - Student records (PK: hall_ticket_number)
- **year_lockers** - Year-wise fee targets per student (FK to students)
- **fee_transactions** - All fee payments/transactions (FK to students)
- **fee_locker_config** - Fee configuration (JSONB, single row)
- **app_users** - User accounts with hashed passwords and roles
- **student_remarks** - Admin remarks/notes for students (FK to students)

## User Credentials (Default)
- admin / Mjcet@Admin#2026 (Administrator)
- accountant / Mjcet@Acc#2026 (Accountant)
- principal / Mjcet@Prin#2026 (Principal)
- examcell / Mjcet@Exam#2026 (Exam Cell)

## API Endpoints
- `POST /api/auth/login` - Authenticate user with username/password
- `POST /api/auth/reset-password` - Reset password (requires current password)
- `GET /api/auth/users` - List all users (admin)
- `PUT /api/auth/admin-reset-password` - Admin reset user password
- `GET /api/remarks/:htn` - Get remarks for a student
- `POST /api/remarks` - Add remark for a student
- `DELETE /api/remarks/:id` - Delete a remark
- `GET /api/bootstrap` - Load all students, transactions, config at once
- `POST /api/students` - Add/upsert single student with lockers and transactions
- `POST /api/students/bulk` - Bulk add/upsert students
- `PUT /api/students/:htn` - Update student
- `DELETE /api/students/:htn` - Delete student (cascades)
- `POST /api/transactions` - Add single transaction
- `POST /api/transactions/bulk` - Bulk add transactions
- `PUT /api/transactions/approve` - Approve transactions by IDs
- `PUT /api/transactions/reject` - Reject transactions by IDs
- `GET /api/fee-config` - Get fee locker configuration
- `PUT /api/fee-config` - Update fee locker configuration

## Development
- **Dev server**: `npm run dev` (Express + Vite on port 5000)
- **Build**: `npm run build` (outputs to `dist/`)
- **Database**: PostgreSQL via DATABASE_URL environment variable

## Dependencies
- **express**: Backend HTTP server
- **pg**: PostgreSQL client
- **bcryptjs**: Password hashing
- **tsx**: TypeScript execution for server
- **xlsx**: For parsing Excel (.xlsx/.xls) files in the browser for bulk uploads

## Import Templates
### Student Data Sheet (14 columns)
Roll No, Student Name, Department, Sex, Date of Birth, Mode of Admission, Student Mobile No, Father Mobile No, Father Name, Mother Name, Address, Student Aadhaar Card No, Admission year, Entry Type

### Fee Data Sheet (11 columns) - creates 2 transactions per row
Roll No, Student Name, Department, Tuition Fee Challan Date, Tuition Fee Mode of Payment, Tuition Fee, University Fee Mode of Payment, University Fee Challan No, University Fee Challan Date, University Fee, Fee Year

### Combined Template (21 columns)
Student columns (14) + Tuition Fee Challan Date, Tuition Fee Mode of Payment, Tuition Fee, University Fee Mode of Payment, University Fee Challan No, University Fee Challan Date, University Fee

## Recent Changes
- 2026-02-19: Redesigned Fee Locker Configuration from group-based (A/B/C) to department-wise year-wise individual targets; each of 14 departments has its own tuition & university targets per year (1-4 for B.E, 1-2 for M.E); Dashboard shows clear department x year table; config modal allows editing all targets individually; backward compatible with old group config via migration
- 2026-02-20: Added batch filter dropdowns to Dashboard (Department Summary, Category Analysis) and Reports (Dept Summary, Category Analysis, Defaulters) for multi-batch data filtering
- 2026-02-19: Added lateral entry student support - Entry Type field (REGULAR/LATERAL) in database, forms, bulk import (14-col student, 21-col combined templates), exports; lateral students start from year 2 with 3-year duration (batch computed as admission+3); "LE" badge shown in student list
- 2026-02-18: Updated student & fee import templates to match user-provided Excel formats; added Student Aadhaar Card No field; fee import creates separate Tuition + University transactions per row with individual payment modes and challan info
- 2026-02-18: Added Year filter dropdown to Dashboard Department Summary table (All Years, 1st-4th Year); filters by students who have fee lockers for selected year
- 2026-02-18: Added Current Year column (optional) to bulk student import and combined student+fee import; creates year lockers for all years up to the current year
- 2026-02-18: Fixed server-side fee target calculation to read department groupings from config instead of hardcoded arrays (was causing wrong university targets for CS-AI, CS-DS, CS-AIML)
- 2026-02-18: Uploaded 460 CSE students from CSV with fee transactions
- 2026-02-16: Added password-based authentication with bcrypt hashing, login form with username/password, reset password page, admin remarks/notes for students displayed in fee summary
- 2026-02-16: Connected PostgreSQL database - migrated from localStorage to server-backed persistence with Express API, 6 database tables
- 2026-02-16: Added department-wise Fee Defaulter List for Exam Cell role with collapsible department sections, search, and year-wise status badges
- 2026-02-16: Restricted Exam Cell to only see Defaulter List (no Dashboard, Reports, etc.)
- 2026-02-16: Added college campus photo to login page hero banner
- 2026-02-16: Added student search with fee history panel to Dashboard
- 2026-02-16: Added Certificates module with Bonafide Certificate (half A4 portrait) and Transfer Certificate (A4, Original + Office Copy) generation, student search, editable fields, and print functionality
- 2026-02-16: Split Student Master into two reports: "Student Master Fee List" (year-wise fee details with year/dept/batch filters) and "Student Master List" (complete personal details with dept/batch filters), now 6 total report tabs
- 2026-02-16: Rebuilt Reports section with 6 tabbed reports (Dept Summary, Financial Year Wise, Batch Wise, Student Master Fee List, Student Master List, Fee Defaulters) each with PDF export including MJCET header with logo, college name, address
- 2026-02-16: Added Fee Locker Configuration to Dashboard - 3 groups (Group A B.E, Group B B.E, M.E Programs) with editable tuition/university targets
- 2026-02-16: Initial Replit setup - configured Vite for port 5000 with allowedHosts, added .gitignore
