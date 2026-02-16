
import React, { useState } from 'react';
import { useApp } from '../store';
import { Student } from '../types';
import {
  Award,
  FileText,
  Search,
  Printer,
  ArrowRight,
  User,
  GraduationCap,
  ArrowLeft,
  ScrollText
} from 'lucide-react';

const COLLEGE = {
  logo: '/mjcet-logo.png',
  society: 'SULTAN-UL-ULOOM EDUCATION SOCIETY',
  name: 'MUFFAKHAM JAH COLLEGE OF ENGINEERING & TECHNOLOGY',
  affiliation: '(Affiliated to Osmania University, Hyderabad)',
  societyLine: '(SULTANUL-ULOOM EDUCATION SOCIETY)',
  address: "'Mount Pleasant' 8-2-249, Road No. 3, Banjara Hills, Hyderabad - 500 034, (T.S.)",
};

const formatDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const getYearText = (year: number, course: string) => {
  const duration = course === 'M.E' ? 2 : 4;
  return `${year}/${duration}`;
};

const getDeptBranch = (department: string) => {
  return department
    .replace('B.E(', '')
    .replace('M.E(', '')
    .replace('M.E ', '')
    .replace(')', '');
};


type CertType = 'bonafide' | 'tc';

export const Certificates: React.FC = () => {
  const { students } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [certType, setCertType] = useState<CertType | null>(null);
  const [snoCounter, setSnoCounter] = useState({ bonafide: 1, tc: 1 });

  const [bcDate, setBcDate] = useState(formatDate(new Date()));
  const [bcAcademicYear, setBcAcademicYear] = useState('');
  const [bcConduct, setBcConduct] = useState('Good');

  const [tcDate, setTcDate] = useState(formatDate(new Date()));
  const [tcDateAdmission, setTcDateAdmission] = useState('');
  const [tcDateLeaving, setTcDateLeaving] = useState('');
  const [tcCourseCompleted, setTcCourseCompleted] = useState('Completed');
  const [tcDues, setTcDues] = useState('NIL');
  const [tcDisciplinary, setTcDisciplinary] = useState('No');
  const [tcConduct, setTcConduct] = useState('GOOD');
  const [tcRemarks, setTcRemarks] = useState('No');

  const filtered = searchQuery.trim().length > 0
    ? students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.hallTicketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 20)
    : [];

  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setSearchQuery('');
    setCertType(null);
    const admYear = s.admissionYear || s.batch || '';
    const dept = getDeptBranch(s.department);
    const duration = s.course === 'M.E' ? 2 : 4;
    const parsedAdmYear = parseInt(admYear);
    const endYear = !isNaN(parsedAdmYear) ? String(parsedAdmYear + duration) : '';
    setBcAcademicYear(admYear && endYear ? `${admYear}-${endYear}` : admYear || '');
    setTcDateAdmission(admYear ? `Sept, ${admYear} ${s.course} 1/${duration} (${dept})` : '');
    setTcDateLeaving(endYear ? `Aug, ${endYear} ${s.course} ${duration}/${duration} (${dept})` : '');
  };

  const printBonafide = () => {
    if (!selectedStudent) return;
    const s = selectedStudent;
    const sno = snoCounter.bonafide;
    setSnoCounter(p => ({ ...p, bonafide: p.bonafide + 1 }));
    const dept = getDeptBranch(s.department);
    const duration = s.course === 'M.E' ? 2 : 4;
    const isFemale = s.sex?.toLowerCase() === 'female';
    const pronoun = isFemale ? 'She' : 'He';
    const parentPrefix = isFemale ? 'D/o' : 'S/o';

    const yearRoman = ['I', 'I - II', 'I - III', 'I - IV'][duration - 1] || `I - ${duration}`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Bonafide Certificate - ${s.name}</title>
<style>
  @page { size: 210mm 148.5mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; width: 210mm; }
  .certificate-page {
    width: 210mm;
    height: 148.5mm;
    padding: 8mm;
    position: relative;
    overflow: hidden;
  }
  .double-border {
    border: 4px double #000;
    padding: 8mm 14mm 8mm 14mm;
    height: 100%;
    position: relative;
  }
  .header { display: flex; align-items: flex-start; gap: 6mm; margin-bottom: 4mm; }
  .logo { width: 24mm; height: 24mm; object-fit: contain; flex-shrink: 0; }
  .college-info { text-align: center; flex: 1; }
  .college-name-1 { font-size: 18pt; font-weight: bold; color: #000; letter-spacing: 1px; }
  .college-name-2 { font-size: 14pt; font-weight: bold; color: #000; letter-spacing: 0.5px; }
  .college-sub { font-size: 10pt; margin-top: 1mm; color: #333; }
  .society-name { font-size: 10pt; color: #000; margin-top: 0.5mm; font-weight: bold; }
  .address-line { font-size: 9pt; color: #333; margin-top: 1mm; }
  .title { text-align: center; font-size: 15pt; font-weight: bold; text-decoration: underline; margin: 4mm 0 3mm; }
  .sno-date { display: flex; justify-content: space-between; font-size: 11pt; margin-bottom: 3mm; }
  .body-text { font-size: 12pt; line-height: 2.2; text-align: justify; margin-bottom: 2mm; }
  .body-text .underline { text-decoration: underline; font-weight: bold; display: inline-block; min-width: 50mm; }
  .conduct { font-size: 12pt; line-height: 2; }
  .signatures { display: flex; justify-content: space-between; margin-top: 8mm; font-size: 11pt; align-items: baseline; }
  @media print {
    body { margin: 0; }
    .certificate-page { page-break-after: always; }
  }
</style></head><body>
<div class="certificate-page">
  <div class="double-border">
    <div class="header">
      <img src="${COLLEGE.logo}" class="logo" alt="Logo" />
      <div class="college-info">
        <div class="college-name-1">MUFFAKHAM JAH</div>
        <div class="college-name-2">COLLEGE OF ENGINEERING & TECHNOLOGY</div>
        <div class="college-sub">${COLLEGE.affiliation}</div>
        <div class="society-name">(SULTAN-UL-ULOOM EDUCATION SOCIETY)</div>
        <div class="address-line">'Mount Pleasant' 8-2-249, Road No. 3,</div>
        <div class="address-line" style="margin-top:0;">Banjara Hills, Hyderabad - 500 034, (T.S.)</div>
      </div>
    </div>
    <div class="title">Bonafide/Conduct Certificate</div>
    <div class="sno-date">
      <span>S.No: ${sno}</span>
      <span>Date : ${bcDate}</span>
    </div>
    <div class="body-text">
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;This is to certify that &nbsp;<span class="underline">&nbsp;${s.name}&nbsp;</span><br/>
      S/o. D/o. Mr. <span class="underline">&nbsp;${s.fatherName}&nbsp;</span><br/>
      (Roll No : <span class="underline">&nbsp;${s.hallTicketNumber}&nbsp;</span> ) is/was a bonafide student of &nbsp;${s.course} Year, Br. (&nbsp;<span class="underline">&nbsp;${yearRoman}&nbsp;</span>&nbsp;,<br/>
      <span class="underline">&nbsp;${dept}&nbsp;</span> ) in this college in the Academic year &nbsp;<span class="underline">&nbsp;${bcAcademicYear}&nbsp;</span>.
    </div>
    <div class="conduct">${pronoun} bears &nbsp;${bcConduct} Conduct.</div>
    <div class="signatures">
      <div>Clerk</div>
      <div style="font-weight:bold;">PRINCIPAL</div>
    </div>
  </div>
</div>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  const printTC = () => {
    if (!selectedStudent) return;
    const s = selectedStudent;
    const sno = snoCounter.tc;
    setSnoCounter(p => ({ ...p, tc: p.tc + 1 }));

    const tcRow = (num: number, label: string, value: string) =>
      `<tr>
        <td class="num">${num}.</td>
        <td class="label">${label}</td>
        <td class="colon">:</td>
        <td class="value">${value}</td>
      </tr>`;

    const tcPage = (copyType: string) => `
<div class="tc-page">
  <div class="header">
    <div class="college-name">MUFFAKHAM JAH</div>
    <div class="college-name sub">COLLEGE OF ENGINEERING & TECHNOLOGY</div>
    <div class="affil">(Affiliated to Osmania University)</div>
    <div class="society">(Sultan-ul-uloom Education Society)</div>
    <div class="address">${COLLEGE.address}</div>
  </div>

  <div class="logo-center">
    <img src="${COLLEGE.logo}" class="logo" alt="Logo" />
  </div>

  <div class="title">TRANSFER CERTIFICATE</div>
  <div class="sno-date">
    <span>S No : ${sno}</span>
    <span>Date : ${tcDate}</span>
  </div>

  <table class="tc-table">
    ${tcRow(1, 'Roll No', s.hallTicketNumber)}
    ${tcRow(2, "Student's Name", s.name)}
    ${tcRow(3, "Father's Name", s.fatherName)}
    ${tcRow(4, "Mother's Name", s.motherName)}
    ${tcRow(5, 'Date Of Birth', s.dob)}
    ${tcRow(6, 'Date Of Admission<br/>to the College', tcDateAdmission)}
    ${tcRow(7, 'Date Of Leaving from<br/>the College', tcDateLeaving)}
    ${tcRow(8, 'Course Completed', tcCourseCompleted)}
    ${tcRow(9, 'Dues', tcDues)}
    ${tcRow(10, 'Any Disciplinary<br/>measures taken<br/>against Him/Her', tcDisciplinary)}
    ${tcRow(11, 'Conduct', tcConduct)}
    ${tcRow(12, 'General Remarks', tcRemarks)}
  </table>

  <div class="signatures">
    <div class="sig-left">
      <div style="margin-top:8mm; font-size:9pt; color:#555;">Office Seal</div>
    </div>
    <div class="sig-right">
      <div>Principal</div>
      <div style="font-size:8pt;margin-top:1mm;color:#555;">PRINCIPAL</div>
      <div style="font-size:8pt;color:#555;">Muffakham Jah College Of</div>
      <div style="font-size:8pt;color:#555;">Engineering & Technology</div>
      <div style="font-size:8pt;color:#555;">Banjara Hills, Road No. 3,</div>
      <div style="font-size:8pt;color:#555;">HYDERABAD-500 034.(T.S.)</div>
    </div>
  </div>
  <div class="copy-type">${copyType}</div>
</div>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Transfer Certificate - ${s.name}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; }
  .tc-page {
    width: 210mm;
    height: 297mm;
    padding: 18mm 22mm 15mm 22mm;
    position: relative;
    page-break-after: always;
  }
  .header { text-align: center; margin-bottom: 3mm; }
  .college-name { font-size: 18pt; font-weight: bold; color: #1a1a1a; }
  .college-name.sub { font-size: 14pt; }
  .affil { font-size: 10pt; color: #333; margin-top: 1mm; }
  .society { font-size: 10pt; color: #555; font-weight: 600; margin-top: 0.5mm; }
  .address { font-size: 10pt; color: #444; margin-top: 1mm; }
  .logo-center { text-align: center; margin: 5mm 0; }
  .logo { width: 28mm; height: 28mm; object-fit: contain; }
  .title { text-align: center; font-size: 16pt; font-weight: bold; text-decoration: underline; margin: 5mm 0; letter-spacing: 1px; }
  .sno-date { display: flex; justify-content: space-between; font-size: 11pt; margin-bottom: 6mm; }
  .tc-table { width: 100%; border-collapse: collapse; font-size: 11pt; }
  .tc-table td { padding: 3mm 2mm; vertical-align: top; }
  .tc-table .num { width: 8mm; font-weight: bold; }
  .tc-table .label { width: 50mm; }
  .tc-table .colon { width: 5mm; text-align: center; }
  .tc-table .value { font-weight: bold; }
  .signatures { display: flex; justify-content: space-between; margin-top: 15mm; font-size: 11pt; align-items: flex-end; }
  .sig-left { text-align: left; }
  .sig-right { text-align: center; }
  .copy-type { position: absolute; bottom: 15mm; right: 22mm; font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  @media print { body { margin: 0; } }
</style></head><body>
${tcPage('ORIGINAL')}
${tcPage('OFFICE COPY')}
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  if (!selectedStudent) {
    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-r from-[#1a365d] to-[#2c5282] rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Award size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Certificates</h1>
              <p className="text-blue-200 text-xs mt-0.5">Generate Bonafide and Transfer Certificates</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Search Student</h2>
          <div className="relative max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, hall ticket number, or department..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          {filtered.length > 0 && (
            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden max-w-lg">
              {filtered.map(s => (
                <button
                  key={s.hallTicketNumber}
                  onClick={() => handleSelectStudent(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-100 last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.hallTicketNumber} | {getDeptBranch(s.department)}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {searchQuery.trim().length > 0 && filtered.length === 0 && (
            <p className="mt-4 text-sm text-slate-400">No students found matching your search.</p>
          )}
        </div>
      </div>
    );
  }

  if (certType === null) {
    const s = selectedStudent;
    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-r from-[#1a365d] to-[#2c5282] rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Award size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Certificates</h1>
              <p className="text-blue-200 text-xs mt-0.5">Generate Bonafide and Transfer Certificates</p>
            </div>
          </div>
        </div>

        <button onClick={() => { setSelectedStudent(null); setCertType(null); }}
          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
          <ArrowLeft size={15} />
          <span>Back to Search</span>
        </button>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{s.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{s.hallTicketNumber} | {s.department} | {s.course} Year {s.currentYear} | Batch {s.batch}</p>
              <p className="text-xs text-slate-400">Father: {s.fatherName} | Mother: {s.motherName}</p>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-600 mb-4">Select Certificate Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => setCertType('bonafide')}
              className="flex items-start gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <FileText size={22} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Bonafide Certificate</h4>
                <p className="text-xs text-slate-400 mt-1">Half A4 size portrait. Certifies the student is/was a bonafide student of the college.</p>
              </div>
            </button>
            <button onClick={() => setCertType('tc')}
              className="flex items-start gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
                <ScrollText size={22} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Transfer Certificate</h4>
                <p className="text-xs text-slate-400 mt-1">A4 size. Original + Office Copy with 12 fields including conduct, dues, and remarks.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = selectedStudent;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#1a365d] to-[#2c5282] rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <Award size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {certType === 'bonafide' ? 'Bonafide Certificate' : 'Transfer Certificate'}
            </h1>
            <p className="text-blue-200 text-xs mt-0.5">
              {s.name} - {s.hallTicketNumber}
            </p>
          </div>
        </div>
      </div>

      <button onClick={() => setCertType(null)}
        className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
        <ArrowLeft size={15} />
        <span>Back to Certificate Selection</span>
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${certType === 'bonafide' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {certType === 'bonafide' ? <FileText size={18} /> : <ScrollText size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{certType === 'bonafide' ? 'Bonafide/Conduct Certificate' : 'Transfer Certificate'}</h3>
              <p className="text-xs text-slate-400">Fill in the details below and print</p>
            </div>
          </div>
          <button
            onClick={certType === 'bonafide' ? printBonafide : printTC}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a365d] text-white rounded-lg font-semibold text-sm hover:bg-[#2c5282] transition-colors shadow-sm">
            <Printer size={15} />
            <span>Print Certificate</span>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
            <div><span className="text-slate-400">Name:</span> <span className="font-semibold text-slate-800">{s.name}</span></div>
            <div><span className="text-slate-400">Roll No:</span> <span className="font-semibold text-slate-800">{s.hallTicketNumber}</span></div>
            <div><span className="text-slate-400">Father:</span> <span className="font-semibold text-slate-800">{s.fatherName}</span></div>
            <div><span className="text-slate-400">Mother:</span> <span className="font-semibold text-slate-800">{s.motherName}</span></div>
            <div><span className="text-slate-400">Department:</span> <span className="font-semibold text-slate-800">{s.department}</span></div>
            <div><span className="text-slate-400">DOB:</span> <span className="font-semibold text-slate-800">{s.dob}</span></div>
          </div>

          {certType === 'bonafide' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Date</label>
                <input type="text" value={bcDate} onChange={e => setBcDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Academic Year</label>
                <input type="text" value={bcAcademicYear} onChange={e => setBcAcademicYear(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Conduct</label>
                <select value={bcConduct} onChange={e => setBcConduct(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                  <option value="Good">Good</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Satisfactory">Satisfactory</option>
                </select>
              </div>
            </div>
          )}

          {certType === 'tc' && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Date</label>
                <input type="text" value={tcDate} onChange={e => setTcDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Date of Admission</label>
                <input type="text" value={tcDateAdmission} onChange={e => setTcDateAdmission(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Date of Leaving</label>
                <input type="text" value={tcDateLeaving} onChange={e => setTcDateLeaving(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Course Completed</label>
                <select value={tcCourseCompleted} onChange={e => setTcCourseCompleted(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                  <option value="Completed">Completed</option>
                  <option value="Not Completed">Not Completed</option>
                  <option value="Pursuing">Pursuing</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Dues</label>
                <select value={tcDues} onChange={e => setTcDues(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                  <option value="NIL">NIL</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Disciplinary Measures</label>
                <select value={tcDisciplinary} onChange={e => setTcDisciplinary(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">Conduct</label>
                <select value={tcConduct} onChange={e => setTcConduct(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                  <option value="GOOD">GOOD</option>
                  <option value="VERY GOOD">VERY GOOD</option>
                  <option value="EXCELLENT">EXCELLENT</option>
                  <option value="SATISFACTORY">SATISFACTORY</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">General Remarks</label>
                <input type="text" value={tcRemarks} onChange={e => setTcRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
