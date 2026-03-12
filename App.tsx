import React, { useEffect, useMemo, useState } from 'react';
import resultsData from './attached_assets/results-data.json';

type SubjectResult = {
  subjectCode: string;
  subjectName: string;
  subjectType: string;
  credits: number;
  obtainedMarks: number;
  internalMarks: number;
  aggregateMarks: number;
  result: string;
  gradeLetter: string;
  gradePoints: number;
  creditScore: number;
};

type StudentResult = {
  hallTicketNumber: string;
  name: string;
  course: string;
  branch: string;
  semester: string;
  examType: string;
  publishedOn: string;
  sgpa: number | string | null;
  sgpaDisplay: string;
  overallResult: string;
  subjects: SubjectResult[];
};

const studentResults = resultsData as StudentResult[];

const resultMap = new Map(
  studentResults.map((student) => [student.hallTicketNumber.toUpperCase(), student]),
);

const toOrdinalSemester = (semester: string) => {
  const value = Number(semester);
  if (!Number.isFinite(value)) return semester;
  const suffix =
    value % 10 === 1 && value % 100 !== 11 ? 'st' :
    value % 10 === 2 && value % 100 !== 12 ? 'nd' :
    value % 10 === 3 && value % 100 !== 13 ? 'rd' :
    'th';
  return `${value}${suffix}`;
};

const getPerformanceLabel = (student: StudentResult) => {
  const sgpa = student.sgpa;
  return typeof sgpa === 'number'
    ? `SGPA: ${student.sgpaDisplay}`
    : `Academic Status: ${student.sgpaDisplay}`;
};

const formatExamLabel = (student: StudentResult) =>
  `${student.course} ${toOrdinalSemester(student.semester)} Semester End Examination / ${student.examType} Results`;

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-[24px] border border-white/60 bg-white/75 px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p>
    <p className="mt-2 text-lg font-semibold text-slate-800">{value}</p>
  </div>
);

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchedHallTicket, setSearchedHallTicket] = useState('');
  const [activeStudent, setActiveStudent] = useState<StudentResult | null>(null);
  const [error, setError] = useState('');

  const totalStudents = studentResults.length.toLocaleString('en-IN');
  const totalBranches = useMemo(
    () => new Set(studentResults.map((student) => student.branch)).size.toString(),
    [],
  );

  useEffect(() => {
    const firstStudent = studentResults[0];
    if (!firstStudent) return;
    setQuery(firstStudent.hallTicketNumber);
    setSearchedHallTicket(firstStudent.hallTicketNumber);
    setActiveStudent(firstStudent);
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = query.trim().toUpperCase();
    setSearchedHallTicket(normalized);
    if (!normalized) {
      setActiveStudent(null);
      setError('Enter a hall ticket number to view the memo.');
      return;
    }

    const student = resultMap.get(normalized) ?? null;
    setActiveStudent(student);
    setError(student ? '' : `No result found for hall ticket number ${normalized}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        :root {
          --paper: #fffdf9;
          --ink: #172033;
          --accent: #16335b;
          --accent-soft: #e7eff9;
          --gold: #b88a2d;
        }

        body {
          margin: 0;
          min-width: 320px;
          background:
            radial-gradient(circle at top left, rgba(184, 138, 45, 0.20), transparent 28%),
            radial-gradient(circle at top right, rgba(22, 51, 91, 0.18), transparent 24%),
            linear-gradient(180deg, #f7f2e8 0%, #eef4fb 48%, #eef2f7 100%);
          color: var(--ink);
        }

        @media print {
          body {
            background: #ffffff;
          }

          .no-print {
            display: none !important;
          }

          .print-shell {
            padding: 0 !important;
            max-width: none !important;
          }

          .memo-card {
            box-shadow: none !important;
            border: 0 !important;
            border-radius: 0 !important;
          }

          .memo-table th,
          .memo-table td {
            font-size: 11px !important;
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }
        }
      `}</style>

      <main className="min-h-screen px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
        <div className="print-shell mx-auto max-w-6xl">
          <section className="no-print relative overflow-hidden rounded-[32px] border border-white/70 bg-white/72 px-6 py-8 shadow-[0_25px_80px_rgba(15,23,42,0.15)] backdrop-blur sm:px-8 lg:px-12">
            <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top,_rgba(184,138,45,0.18),_transparent_58%)]" />

            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <img
                    src="/mjcet-logo.png"
                    alt="MJCET Logo"
                    className="h-16 w-16 rounded-full border border-amber-200 bg-white object-contain p-2 shadow-md"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
                      Result Verification Portal
                    </p>
                    <h1 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
                      Muffakham Jah College of Engineering & Technology
                    </h1>
                  </div>
                </div>

                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Students can enter their hall ticket number to view an individual memo with
                  subject-wise grades, SGPA, and overall result. The displayed memo is formatted for
                  direct printing or PDF download.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <StatCard label="Students" value={totalStudents} />
                  <StatCard label="Branches" value={totalBranches} />
                  <StatCard label="Workbook" value="ALL BRANCHES_UPDATE" />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,250,252,0.92))] p-6 shadow-[0_22px_55px_rgba(15,23,42,0.12)]">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Search Memo
                </p>
                <form onSubmit={handleSearch} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="hallTicket"
                      className="mb-2 block text-sm font-medium text-slate-600"
                    >
                      Hall Ticket Number
                    </label>
                    <input
                      id="hallTicket"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Enter hall ticket number"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base uppercase tracking-[0.08em] text-slate-900 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[linear-gradient(135deg,#16335b,#26558f)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white shadow-[0_16px_35px_rgba(22,51,91,0.28)] transition hover:translate-y-[-1px]"
                  >
                    Search Result
                  </button>
                </form>

                <p className="mt-4 text-sm text-slate-500">
                  Example hall ticket: <span className="font-semibold text-slate-700">160425732001</span>
                </p>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {activeStudent
                      ? `Memo loaded for ${activeStudent.name}.`
                      : 'Search by hall ticket number to load a memo.'}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="memo-card mt-8 rounded-[32px] border border-slate-300/70 bg-[var(--paper)] px-4 py-5 shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:px-8 sm:py-8">
            {activeStudent ? (
              <>
                <div className="border-b border-slate-200 pb-6 text-center">
                  <img
                    src="/mjcet-logo.png"
                    alt="MJCET Seal"
                    className="mx-auto h-20 w-20 object-contain"
                  />
                  <h2 className="mt-4 font-serif text-[1.7rem] font-bold uppercase tracking-[0.04em] text-slate-900 sm:text-[2rem]">
                    Muffakham Jah College of Engineering & Technology
                  </h2>
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                    {formatExamLabel(activeStudent)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    Published Batch: {activeStudent.publishedOn || 'Result Sheet'}
                  </p>
                </div>

                <div className="no-print mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Student Memo
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Showing result for hall ticket <span className="font-semibold">{searchedHallTicket}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-700"
                  >
                    Download PDF
                  </button>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Course</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{activeStudent.course}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Branch</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{activeStudent.branch}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Roll No.</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{activeStudent.hallTicketNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Student Name</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{activeStudent.name}</p>
                  </div>
                </div>

                <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-200">
                  <table className="memo-table min-w-full border-collapse">
                    <thead className="bg-[var(--accent-soft)] text-left">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Subject Code</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Subject Name</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Credits</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Grade Points</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Grade Secured</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStudent.subjects.map((subject) => (
                        <tr key={`${activeStudent.hallTicketNumber}-${subject.subjectCode}`} className="border-t border-slate-200/80">
                          <td className="px-4 py-3 text-sm font-medium text-slate-700">{subject.subjectCode}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{subject.subjectName}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{subject.credits}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{subject.gradePoints}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">{subject.gradeLetter}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-slate-50 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Performance
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{getPerformanceLabel(activeStudent)}</p>
                  </div>
                  <div className="rounded-[24px] bg-slate-50 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Overall Result
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{activeStudent.overallResult}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center">
                <img
                  src="/mjcet-logo.png"
                  alt="MJCET Logo"
                  className="mx-auto h-20 w-20 object-contain opacity-70"
                />
                <h2 className="mt-5 font-serif text-3xl font-semibold text-slate-800">
                  Result memo will appear here
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-500">
                  Enter a valid hall ticket number in the search box above to display the student
                  memo in the same format used for examination results.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default App;
