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
- **fee_locker_config** - Default fee configuration (JSONB, single row)
- **batch_fee_config** - Batch-wise fee configurations (JSONB with batches keyed by academic year like "2025-2026")
- **custom_departments** - Admin-added custom departments (name, code, course_type, duration)
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
- `GET /api/fee-config` - Get default fee locker configuration
- `PUT /api/fee-config` - Update default fee locker configuration
- `GET /api/batch-fee-config` - Get batch-wise fee locker configurations
- `PUT /api/batch-fee-config` - Update batch-wise fee locker configurations

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

### Combined Template (24 columns)
Student columns (14) + Current Year, Tuition Fee Challan No, Tuition Fee Challan Date, Tuition Fee Mode of Payment, Tuition Fee, University Fee Mode of Payment, University Fee Challan No, University Fee Challan Date, University Fee, Fee Year
Note: Also backward-compatible with old 21-column format (without Current Year, Tuition Fee Challan No, Fee Year)

## Recent Changes
- 2026-03-01: Added expandable Batch Wise report - click any batch row to see student-wise breakdown with hall ticket, name, dept, year, mode, target/paid/balance
- 2026-03-01: Added "New Admission" button to Dashboard header - green button navigates admin to Student Directory for quick student entry
- 2026-03-01: Added expandable Financial Year Wise report - click any FY row to see student-wise breakdown with hall ticket, name, dept, transaction count, tuition/university/other amounts; grouped by student for cleaner view
- 2026-03-01: Added expandable Student Enrollment year cards - click Year 1/2/3/4 within expanded department to see full student list with hall ticket, name, batch, mode, entry type, mobile
- 2026-03-01: Fixed date parsing bug in Reports - payment dates stored as DD.MM.YYYY were incorrectly parsed by JS Date(); added parsePaymentDate() helper for proper DD.MM.YYYY and DD-MM-YYYY format handling
- 2026-02-24: Added date range filters (From/To date inputs) to ALL report tabs: Dept Summary, Financial Year, Batch Wise, Fee List, Defaulters, Category Analysis, and Date Range Financial Report; reusable DateFilterInputs and DateRangeBanner components; date-filtered collections show amber info banner; PDF exports include date labels; targets remain full while collections filter by period
- 2026-02-24: Added Date Range Financial Report tab to Reports - custom date period filter (from/to dates), department-wise summary showing total students, paid count, balance count, target, collected, pending amounts; click department to expand full student list with roll no, name, year, entry type, target, paid, balance, status; filters for year (All/1st-4th), department, batch; summary stat cards; PDF export; info banner when date range is active clarifying collected-in-period vs full targets
- 2026-02-24: Added Student Enrollment page - separate sidebar page (visible to Admin, Accountant, Principal) showing department-wise enrollment summary with Regular vs Lateral Entry breakdown; B.E and M.E programs shown in separate tables; click any department to expand year-wise student count breakdown; batch filter dropdown; summary stat cards (Total Students, Regular, Lateral, Departments); grand total banner; PDF export with college branding header
- 2026-02-24: Added User Management section to Database Admin page - admin can view all users and reset passwords; secured with admin role checks on both server and client
- 2026-02-24: Fixed PDF report header layout - logo moved to left side inline with college text (centered) to save vertical space
- 2026-02-24: Enlarged Student Directory search bar - now full-width on its own row matching Dashboard search bar style
- 2026-02-24: Fixed admin-reset-password and user listing API role check case sensitivity (ADMIN vs admin)
- 2026-02-22: Added bulk upload preview/approval flow - file is parsed and shown in a preview panel with summary stats (total rows, new vs existing students, transactions, department breakdown, sample data table) before admin clicks "Confirm Upload" to save; "Cancel" discards without saving; prevents accidental data corruption
- 2026-02-22: Added department-wise bulk delete to Student Directory - selection mode shows department buttons to select/deselect entire departments; individual checkboxes; select all; double confirmation required; admin only
- 2026-02-22: Fixed Database Admin page crash - added missing batch_fee_config and custom_departments to TABLE_META with fallback for unknown tables
- 2026-02-22: Added Upload Mode selector (Replace / Add & Merge) to Bulk Upload page - Replace mode overwrites existing fee data when re-uploading the same file (safe for re-uploads), Add & Merge mode appends new transactions to existing data; default is Replace to prevent duplicate data on re-upload
- 2026-02-22: Enhanced Dashboard with Year-Wise filter (1st/2nd/3rd/4th Year) that filters stat cards, collection progress, department charts, defaulter charts, and category pie chart; added Financial Year-Wise Collection section with summary cards per FY showing tuition/university/transaction breakdown and stacked bar chart; all dashboard data now responds to year filter selection
- 2026-02-22: Added dedicated Bulk Upload page with 3 template types (Student Data 14-col, Fee Data 11-col, Combined 24-col), downloadable as CSV/XLSX; smart header-based column matching with aliases supports flexible uploads (add/remove/reorder columns); auto-detection of template type; column mapping preview after upload; proper merge behavior for existing students
- 2026-02-22: Redesigned Dashboard - removed Department Summary table and Category Analysis table (already in Reports); added batch-wise fee overview cards for last 4 batches with TSMFC/Management/Convenor category breakdown showing student count, collected, and pending amounts; added Category Distribution pie chart; improved chart layout with 3-column grid
- 2026-02-21: Added "Add Batch" and "Add Department" features to Fee Locker Config - admin can create custom batch years beyond the auto-generated 10 and add new departments (name, code, courseType, duration) stored in custom_departments DB table; custom departments appear across all views (Dashboard, Reports, Defaulter List, etc.); all view files updated to use dynamic departments from store instead of hardcoded constants
- 2026-02-21: Implemented batch-wise fee locker configuration - 10 academic year batches (2026-2027 to 2017-2018) each with independent fee targets per department per year; batch selector dropdown in Fee Locker Config page; "Copy from Batch" feature to duplicate fee structure between batches; batch-specific configs stored in separate batch_fee_config DB table; students auto-mapped to batch via admission_year; fallback to default config when no batch-specific config exists; all fee target lookups across Dashboard, Reports, Defaulter List, etc. now batch-aware
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
