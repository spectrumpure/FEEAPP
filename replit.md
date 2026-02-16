# EduFee Enterprise - College Fee Management System

## Overview
A centralized college fee management and governance system built with React, TypeScript, and Vite. The app provides role-based access for Administrator, Accountant, Principal, and Exam Cell users to manage fee entries, approvals, reports, and student directories.

## Project Architecture
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Entry Point**: `index.tsx` -> `App.tsx`

## Project Structure
- `/` - Root contains main app files (App.tsx, index.tsx, store.tsx, types.ts, constants.tsx)
- `/components/` - Shared layout components
- `/views/` - Page-level view components (Dashboard, FeeEntry, FeeLedger, Reports, etc.)

## Development
- **Dev server**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build` (outputs to `dist/`)
- **Deployment**: Static site deployment from `dist/` directory

## Dependencies
- **xlsx**: For parsing Excel (.xlsx/.xls) files in the browser for bulk uploads

## Recent Changes
- 2026-02-16: Updated department list to match college template (10 B.E 4-year + 4 M.E 2-year departments), added courseType/duration to Department type, added department filter to Student Directory
- 2026-02-16: Added three bulk upload options to Student Directory page (combined student+fee, student-only, fee-only) with Excel/CSV support matching college template format
- 2026-02-16: Updated FeeEntry bulk upload to support XLSX files with proper date normalization (DD.MM.YYYY format)
- 2026-02-16: Initial Replit setup - configured Vite for port 5000 with allowedHosts, added .gitignore
