# MJCET FEE APP - College Fee Management System

## Overview
The MJCET FEE APP is a comprehensive college fee management and governance system. Its primary purpose is to centralize and streamline the process of managing fee entries, approvals, reporting, and student directories within a college environment. The application caters to various user roles including Administrator, Accountant, Principal, and Exam Cell, providing role-based access to relevant functionalities. The project aims to enhance efficiency in fee collection, financial reporting, and student record management.

## User Preferences
I prefer that you ask me before making any major changes or decisions. I like to be involved in the iterative development process, reviewing changes and providing feedback. I also prefer detailed explanations of the code and architectural choices.

## System Architecture
The application is built with a modern web stack. The **frontend** uses React 19 with TypeScript, bundled by Vite 6. **Styling** is implemented using Tailwind CSS via CDN for rapid development and maintainability. **Charts** are rendered with Recharts, and icons are provided by Lucide React.

The **backend** is an Express.js server, interacting with a PostgreSQL database. User authentication leverages `bcryptjs` for secure password hashing.

The **project structure** is organized for clarity:
- Root directory contains core frontend files (`App.tsx`, `index.tsx`, global types, constants).
- `/server/` hosts the Express backend logic, database connection, and API routes.
- `/components/` stores reusable UI components.
- `/views/` contains page-level components for different sections like Dashboard, Fee Entry, Reports, etc.
- `/public/` serves static assets.

**Key UI/UX decisions and features include:**
- **Role-Based Access Control**: Distinct interfaces and functionalities for Administrator, Accountant, Principal, and Exam Cell.
- **Dynamic Department and Batch Management**: Admins can add custom departments and define batch-wise fee locker configurations, which dynamically update across all views and reports.
- **Bulk Data Operations**: Support for bulk student and fee transaction uploads via Excel/CSV with template auto-detection, flexible column matching, and a preview/approval flow to prevent data errors.
- **Comprehensive Reporting**: Multiple tabbed reports (Department Summary, Financial Year Wise, Batch Wise, Student Master Lists, Fee Defaulters) with PDF export functionality, including college branding. Date range filters are available for financial reports.
- **Student Enrollment Overview**: A dedicated page for department-wise enrollment summaries, distinguishing between Regular and Lateral Entry students, with PDF export.
- **User Management**: Administrator tools for viewing and resetting user passwords.
- **Certificate Generation**: Modules for generating Bonafide and Transfer Certificates with auto-incrementing serial numbers, student search, editable fields, and print functionality.
- **Search and Filtering**: Extensive search and filtering capabilities across student directories, reports, and dashboards by year, department, batch, and date ranges.
- **Database Schema**:
    - `students`: Core student records.
    - `year_lockers`: Year-specific fee targets per student.
    - `fee_transactions`: All payment records.
    - `fee_locker_config`: Default fee configurations.
    - `batch_fee_config`: Batch-specific fee configurations.
    - `custom_departments`: Admin-defined custom departments.
    - `app_users`: User authentication details and roles.
    - `student_remarks`: Administrative remarks for students.
    - `certificate_counters`: Stores auto-incrementing counters for certificate serial numbers.

## External Dependencies
- **PostgreSQL**: Primary database (deployed on Supabase free tier with session pooler).
- **Vite**: Frontend build tool and development server.
- **Express.js**: Backend web framework.
- **React**: Frontend UI library.
- **TypeScript**: Superset of JavaScript for type safety.
- **Tailwind CSS**: Utility-first CSS framework (via CDN).
- **Recharts**: Charting library for data visualization.
- **Lucide React**: Icon library.
- **bcryptjs**: For password hashing.
- **pg**: PostgreSQL client for Node.js.
- **tsx**: TypeScript execution for server-side code.
- **xlsx**: Library for parsing Excel files for bulk uploads.
- **Vercel**: Deployment platform for frontend static assets and serverless API functions.

## Recent Changes
- 2026-03-05: Added Fee Entry Status table to Student Enrollment page - shows Department, Batch, Enrolled count (1st-4th Year), and Fee Entry Status (1st-4th Year) with color coding: green (all done), amber (partial), red (not entered); X/Y format; respects batch filter; enrolled counts show Regular/Lateral split (e.g. 45R+5L); Total column after 4th Year
- 2026-03-03: Added Full Backup Excel export to Student Directory - uses Combined (Student+Fee) 24-column template format for direct re-import; includes all transactions with challan no/date/payment mode
- 2026-03-03: Added persistent auto-incrementing certificate serial numbers (Bonafide MJCET/BC/N, TC MJCET/TC/N) stored in certificate_counters DB table; atomic increment via INSERT ON CONFLICT
- 2026-03-03: Added date range filters to Dept Summary, Batch Wise, Defaulters, and Category Analysis report tabs