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

## API Endpoints
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
- **tsx**: TypeScript execution for server
- **xlsx**: For parsing Excel (.xlsx/.xls) files in the browser for bulk uploads

## Recent Changes
- 2026-02-16: Connected PostgreSQL database - migrated from localStorage to server-backed persistence with Express API, 4 database tables (students, year_lockers, fee_transactions, fee_locker_config)
- 2026-02-16: Added department-wise Fee Defaulter List for Exam Cell role with collapsible department sections, search, and year-wise status badges
- 2026-02-16: Restricted Exam Cell to only see Defaulter List (no Dashboard, Reports, etc.)
- 2026-02-16: Added college campus photo to login page hero banner
- 2026-02-16: Added student search with fee history panel to Dashboard
- 2026-02-16: Added Certificates module with Bonafide Certificate (half A4 portrait) and Transfer Certificate (A4, Original + Office Copy) generation, student search, editable fields, and print functionality
- 2026-02-16: Split Student Master into two reports: "Student Master Fee List" (year-wise fee details with year/dept/batch filters) and "Student Master List" (complete personal details with dept/batch filters), now 6 total report tabs
- 2026-02-16: Rebuilt Reports section with 6 tabbed reports (Dept Summary, Financial Year Wise, Batch Wise, Student Master Fee List, Student Master List, Fee Defaulters) each with PDF export including MJCET header with logo, college name, address
- 2026-02-16: Added Fee Locker Configuration to Dashboard - 3 groups (Group A B.E, Group B B.E, M.E Programs) with editable tuition/university targets
- 2026-02-16: Initial Replit setup - configured Vite for port 5000 with allowedHosts, added .gitignore
