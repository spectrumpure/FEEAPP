
import React, { useState } from 'react';
import { useApp } from '../store';
import { FeeLockerConfig, UserRole } from '../types';
import { DEPARTMENTS } from '../constants';
import { Lock, Save, XCircle, Settings } from 'lucide-react';

export const FeeLockers: React.FC = () => {
  const { feeLockerConfig, updateFeeLockerConfig, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'regular' | 'lateral'>('regular');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editConfig, setEditConfig] = useState<FeeLockerConfig>(feeLockerConfig);
  const [editTab, setEditTab] = useState<'regular' | 'lateral'>('regular');
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const beDepts = DEPARTMENTS.filter(d => d.courseType === 'B.E');
  const meDepts = DEPARTMENTS.filter(d => d.courseType === 'M.E');

  const handleSave = async () => {
    setSaving(true);
    await updateFeeLockerConfig(editConfig);
    setSaving(false);
    setShowEditModal(false);
  };

  const openEdit = (tab: 'regular' | 'lateral') => {
    setEditConfig(JSON.parse(JSON.stringify(feeLockerConfig)));
    setEditTab(tab);
    setShowEditModal(true);
  };

  const updateTarget = (deptCode: string, year: number, field: 'tuition' | 'university', value: number, isLateral: boolean) => {
    const newConfig = JSON.parse(JSON.stringify(editConfig));
    const key = isLateral ? 'lateralDeptYearTargets' : 'deptYearTargets';
    if (!newConfig[key]) newConfig[key] = {};
    if (!newConfig[key][deptCode]) newConfig[key][deptCode] = {};
    if (!newConfig[key][deptCode][String(year)]) newConfig[key][deptCode][String(year)] = { tuition: 0, university: 0 };
    newConfig[key][deptCode][String(year)][field] = value;
    setEditConfig(newConfig);
  };

  const renderConfigTable = (isLateral: boolean) => {
    const config = isLateral ? feeLockerConfig.lateralDeptYearTargets : feeLockerConfig.deptYearTargets;
    const startYear = isLateral ? 2 : 1;
    const beYears = isLateral ? [2, 3, 4] : [1, 2, 3, 4];
    const meYears = [1, 2];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-indigo-800">B.E Programs (4 Years){isLateral ? ' - Lateral Entry (Years 2-4)' : ''}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{beDepts.length} departments</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => openEdit(isLateral ? 'lateral' : 'regular')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Settings size={14} />
                Edit Targets
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-indigo-50/80">
                  <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px] border-b border-indigo-100">Department</th>
                  {beYears.map(y => (
                    <th key={y} colSpan={2} className="text-center px-2 py-3 font-bold text-indigo-600 uppercase tracking-wider text-[10px] border-b border-indigo-100 border-l border-indigo-100/50">Year {y}</th>
                  ))}
                  <th colSpan={2} className="text-center px-2 py-3 font-bold text-emerald-600 uppercase tracking-wider text-[10px] border-b border-indigo-100 border-l border-indigo-200">Total Per Student</th>
                </tr>
                <tr className="bg-indigo-50/40">
                  <th className="border-b border-slate-100"></th>
                  {beYears.map(y => (
                    <React.Fragment key={y}>
                      <th className="text-center px-2 py-1.5 font-semibold text-slate-400 text-[9px] border-b border-slate-100 border-l border-indigo-100/30">Tuition</th>
                      <th className="text-center px-2 py-1.5 font-semibold text-slate-400 text-[9px] border-b border-slate-100">University</th>
                    </React.Fragment>
                  ))}
                  <th className="text-center px-2 py-1.5 font-semibold text-emerald-500 text-[9px] border-b border-slate-100 border-l border-indigo-200/50">Tuition</th>
                  <th className="text-center px-2 py-1.5 font-semibold text-emerald-500 text-[9px] border-b border-slate-100">University</th>
                </tr>
              </thead>
              <tbody>
                {beDepts.map((dept, idx) => {
                  const targets = config?.[dept.code] || {};
                  let totalTui = 0, totalUni = 0;
                  beYears.forEach(y => {
                    const t = targets[String(y)];
                    totalTui += t?.tuition || 0;
                    totalUni += t?.university || 0;
                  });
                  return (
                    <tr key={dept.code} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-indigo-50/30 transition-colors`}>
                      <td className="px-4 py-2.5 border-b border-slate-50">
                        <span className="font-bold text-slate-700">{dept.code}</span>
                        <span className="text-slate-400 ml-1.5 text-[10px] hidden lg:inline">({dept.name.match(/\(([^)]+)\)/)?.[1] || dept.name})</span>
                      </td>
                      {beYears.map(y => {
                        const t = targets[String(y)];
                        return (
                          <React.Fragment key={y}>
                            <td className="text-center px-2 py-2.5 font-bold text-slate-800 border-b border-slate-50 border-l border-slate-50">{formatCurrency(t?.tuition || 0)}</td>
                            <td className="text-center px-2 py-2.5 font-medium text-slate-600 border-b border-slate-50">{formatCurrency(t?.university || 0)}</td>
                          </React.Fragment>
                        );
                      })}
                      <td className="text-center px-2 py-2.5 font-bold text-emerald-700 border-b border-slate-50 border-l border-indigo-100/30 bg-emerald-50/30">{formatCurrency(totalTui)}</td>
                      <td className="text-center px-2 py-2.5 font-bold text-emerald-600 border-b border-slate-50 bg-emerald-50/30">{formatCurrency(totalUni)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {!isLateral && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-teal-800">M.E Programs (2 Years)</h3>
              <p className="text-xs text-slate-400 mt-0.5">{meDepts.length} departments</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-teal-50/80">
                    <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px] border-b border-teal-100">Department</th>
                    {meYears.map(y => (
                      <th key={y} colSpan={2} className="text-center px-2 py-3 font-bold text-teal-600 uppercase tracking-wider text-[10px] border-b border-teal-100 border-l border-teal-100/50">Year {y}</th>
                    ))}
                    <th colSpan={2} className="text-center px-2 py-3 font-bold text-emerald-600 uppercase tracking-wider text-[10px] border-b border-teal-100 border-l border-teal-200">Total Per Student</th>
                  </tr>
                  <tr className="bg-teal-50/40">
                    <th className="border-b border-slate-100"></th>
                    {meYears.map(y => (
                      <React.Fragment key={y}>
                        <th className="text-center px-2 py-1.5 font-semibold text-slate-400 text-[9px] border-b border-slate-100 border-l border-teal-100/30">Tuition</th>
                        <th className="text-center px-2 py-1.5 font-semibold text-slate-400 text-[9px] border-b border-slate-100">University</th>
                      </React.Fragment>
                    ))}
                    <th className="text-center px-2 py-1.5 font-semibold text-emerald-500 text-[9px] border-b border-slate-100 border-l border-teal-200/50">Tuition</th>
                    <th className="text-center px-2 py-1.5 font-semibold text-emerald-500 text-[9px] border-b border-slate-100">University</th>
                  </tr>
                </thead>
                <tbody>
                  {meDepts.map((dept, idx) => {
                    const targets = config?.[dept.code] || {};
                    let totalTui = 0, totalUni = 0;
                    meYears.forEach(y => {
                      const t = targets[String(y)];
                      totalTui += t?.tuition || 0;
                      totalUni += t?.university || 0;
                    });
                    return (
                      <tr key={dept.code} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-teal-50/30 transition-colors`}>
                        <td className="px-4 py-2.5 border-b border-slate-50">
                          <span className="font-bold text-slate-700">{dept.code}</span>
                          <span className="text-slate-400 ml-1.5 text-[10px] hidden lg:inline">({dept.name.match(/\(([^)]+)\)/)?.[1] || dept.name})</span>
                        </td>
                        {meYears.map(y => {
                          const t = targets[String(y)];
                          return (
                            <React.Fragment key={y}>
                              <td className="text-center px-2 py-2.5 font-bold text-slate-800 border-b border-slate-50 border-l border-slate-50">{formatCurrency(t?.tuition || 0)}</td>
                              <td className="text-center px-2 py-2.5 font-medium text-slate-600 border-b border-slate-50">{formatCurrency(t?.university || 0)}</td>
                            </React.Fragment>
                          );
                        })}
                        <td className="text-center px-2 py-2.5 font-bold text-emerald-700 border-b border-slate-50 border-l border-teal-100/30 bg-emerald-50/30">{formatCurrency(totalTui)}</td>
                        <td className="text-center px-2 py-2.5 font-bold text-emerald-600 border-b border-slate-50 bg-emerald-50/30">{formatCurrency(totalUni)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isLateral && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-amber-800 font-medium">
              <strong>Note:</strong> Lateral entry students join in the 2nd year directly, so Year 1 is not applicable. These targets apply only to B.E departments. M.E programs do not have lateral entry.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderEditModal = () => {
    const isLateral = editTab === 'lateral';
    const key = isLateral ? 'lateralDeptYearTargets' : 'deptYearTargets';
    const beYears = isLateral ? [2, 3, 4] : [1, 2, 3, 4];
    const meYears = [1, 2];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl my-8">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Configure Fee Lockers - {isLateral ? 'Lateral Entry' : 'Regular Entry'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isLateral ? 'Set fee targets for lateral entry B.E students (Years 2-4)' : 'Set tuition and university fee targets for each department and year'}
              </p>
            </div>
            <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
              <XCircle size={20} />
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div className={`p-4 ${isLateral ? 'bg-orange-50 border-orange-100' : 'bg-indigo-50 border-indigo-100'} rounded-xl border`}>
                <h4 className={`text-xs font-bold ${isLateral ? 'text-orange-700' : 'text-indigo-700'} uppercase tracking-wider mb-3`}>
                  B.E Programs {isLateral ? '(Years 2-4 - Lateral Entry)' : '(4 Years)'}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left px-2 py-2 font-bold text-slate-600 text-[10px]">Department</th>
                        {beYears.map(y => (
                          <th key={y} colSpan={2} className={`text-center px-1 py-2 font-bold ${isLateral ? 'text-orange-600' : 'text-indigo-600'} text-[10px] border-l ${isLateral ? 'border-orange-100' : 'border-indigo-100'}`}>Year {y}</th>
                        ))}
                      </tr>
                      <tr>
                        <th></th>
                        {beYears.map(y => (
                          <React.Fragment key={y}>
                            <th className={`text-center px-1 py-1 font-semibold text-slate-400 text-[9px] border-l ${isLateral ? 'border-orange-100' : 'border-indigo-100'}`}>Tuition</th>
                            <th className="text-center px-1 py-1 font-semibold text-slate-400 text-[9px]">Univ</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {beDepts.map(dept => {
                        const deptTargets = editConfig[key]?.[dept.code] || {};
                        return (
                          <tr key={dept.code} className={`border-t ${isLateral ? 'border-orange-50' : 'border-indigo-50'}`}>
                            <td className="px-2 py-2 font-bold text-slate-700 whitespace-nowrap">{dept.code}</td>
                            {beYears.map(y => (
                              <React.Fragment key={y}>
                                <td className={`px-1 py-1 border-l ${isLateral ? 'border-orange-50' : 'border-indigo-50'}`}>
                                  <input type="number" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:ring-1 focus:ring-indigo-200"
                                    value={deptTargets[String(y)]?.tuition || 0}
                                    onChange={e => updateTarget(dept.code, y, 'tuition', parseInt(e.target.value) || 0, isLateral)}
                                  />
                                </td>
                                <td className="px-1 py-1">
                                  <input type="number" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:ring-1 focus:ring-indigo-200"
                                    value={deptTargets[String(y)]?.university || 0}
                                    onChange={e => updateTarget(dept.code, y, 'university', parseInt(e.target.value) || 0, isLateral)}
                                  />
                                </td>
                              </React.Fragment>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {!isLateral && (
                <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                  <h4 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-3">M.E Programs (2 Years)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left px-2 py-2 font-bold text-slate-600 text-[10px]">Department</th>
                          {meYears.map(y => (
                            <th key={y} colSpan={2} className="text-center px-1 py-2 font-bold text-teal-600 text-[10px] border-l border-teal-100">Year {y}</th>
                          ))}
                        </tr>
                        <tr>
                          <th></th>
                          {meYears.map(y => (
                            <React.Fragment key={y}>
                              <th className="text-center px-1 py-1 font-semibold text-slate-400 text-[9px] border-l border-teal-100">Tuition</th>
                              <th className="text-center px-1 py-1 font-semibold text-slate-400 text-[9px]">Univ</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {meDepts.map(dept => {
                          const deptTargets = editConfig.deptYearTargets?.[dept.code] || {};
                          return (
                            <tr key={dept.code} className="border-t border-teal-50">
                              <td className="px-2 py-2 font-bold text-slate-700 whitespace-nowrap">{dept.code}</td>
                              {meYears.map(y => (
                                <React.Fragment key={y}>
                                  <td className="px-1 py-1 border-l border-teal-50">
                                    <input type="number" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:ring-1 focus:ring-teal-200"
                                      value={deptTargets[String(y)]?.tuition || 0}
                                      onChange={e => updateTarget(dept.code, y, 'tuition', parseInt(e.target.value) || 0, false)}
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input type="number" className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:ring-1 focus:ring-teal-200"
                                      value={deptTargets[String(y)]?.university || 0}
                                      onChange={e => updateTarget(dept.code, y, 'university', parseInt(e.target.value) || 0, false)}
                                    />
                                  </td>
                                </React.Fragment>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
            <button onClick={() => setShowEditModal(false)} className="px-6 py-2.5 border border-slate-200 rounded-xl font-medium text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2c5282] text-white rounded-xl font-bold text-sm hover:bg-[#1a365d] transition-colors shadow-sm disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save & Apply to All Students'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Lock size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Fee Locker Configuration</h1>
            <p className="text-blue-200 text-xs mt-0.5">Department-wise and year-wise tuition & university fee targets for all departments</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('regular')}
          className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'regular'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Regular Entry
        </button>
        <button
          onClick={() => setActiveTab('lateral')}
          className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'lateral'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Lateral Entry (B.E Only)
        </button>
      </div>

      {activeTab === 'regular' && renderConfigTable(false)}
      {activeTab === 'lateral' && renderConfigTable(true)}

      {showEditModal && renderEditModal()}
    </div>
  );
};
