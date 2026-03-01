# MJCET FEE APP - College Fee Management System

## Overview
The MJCET FEE APP is a centralized college fee management and governance system. It provides role-based access for Administrators, Accountants, Principals, and Exam Cell users to efficiently manage fee entries, approvals, reports, and student directories. The system aims to streamline fee collection, improve financial transparency, and provide comprehensive reporting capabilities for college administration.

## User Preferences
I prefer clear and direct communication. When making changes, please explain the reasoning and the impact on the system. For complex tasks, I appreciate a breakdown into smaller, manageable steps. Before implementing significant architectural changes or adding new external dependencies, please ask for my approval. Ensure that all new features are thoroughly tested.

## System Architecture
The application uses a modern web stack:
- **Frontend**: React 19 with TypeScript, styled using Tailwind CSS (via CDN). Data visualization is handled by Recharts, and icons by Lucide React.
- **Backend**: An Express.js server in TypeScript, managing API endpoints and interacting with the database.
- **Database**: PostgreSQL, hosted on Neon via Replit, stores all application data.
- **Authentication**: `bcryptjs` is used for secure password hashing.
- **Build System**: Vite 6 for rapid development and optimized builds.
- **UI/UX**: The application features a clean, responsive design with role-based dashboards and report generation. Reports include PDF export functionality with college branding. The system supports various reporting views (Department Summary, Financial Year, Batch Wise, Fee List, Student Master, Defaulters, Date Range) with interactive elements like expandable sections and student search integration.
- **Key Features**:
    - **Role-Based Access Control**: Differentiates functionalities for Administrator, Accountant, Principal, and Exam Cell roles.
    - **Student Management**: Comprehensive student records, including personal details, admission data, and remarks. Supports individual and bulk student additions/updates.
    - **Fee Management**: Tracks tuition and university fees, supporting individual and bulk transaction entries. Includes approval/rejection workflows for transactions.
    - **Configurable Fee Lockers**: Allows for setting default and batch-wise fee targets per department per academic year, including custom batches and departments.
    - **Reporting**: Extensive reporting suite with various filters (date range, year, department, batch) and PDF export for detailed financial oversight and student enrollment analysis.
    - **Bulk Operations**: Supports bulk upload of student and fee data via Excel files with template recognition, preview, and merge/replace options.
    - **User Management**: Administrators can manage user accounts and reset passwords.
    - **Certificate Generation**: Supports generation of Bonafide and Transfer Certificates.
    - **Defaulter List**: Provides a department-wise fee defaulter list accessible to the Exam Cell.

## External Dependencies
- **PostgreSQL**: Primary database for data persistence.
- **Express.js**: Web application framework for the backend.
- **React**: Frontend JavaScript library for building user interfaces.
- **TypeScript**: Superset of JavaScript for type-safe development.
- **Vite**: Next-generation frontend tooling for fast development and optimized builds.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Recharts**: Composable charting library for React.
- **Lucide React**: Icon library.
- **bcryptjs**: Library for hashing passwords securely.
- **xlsx**: Library for parsing Excel files for bulk data uploads.