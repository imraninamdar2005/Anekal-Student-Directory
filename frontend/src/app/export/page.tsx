'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import { Download, FileSpreadsheet, FileText, Filter, Lock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';

export default function ExportDataPage() {
  const { user, isViewer } = useAuth();

  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedPassoutYear, setSelectedPassoutYear] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEduType, setSelectedEduType] = useState('');

  const [schools, setSchools] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [resSch, resCol, resAy, resAr] = await Promise.all([
          api.get('/api/schools'),
          api.get('/api/colleges'),
          api.get('/api/master-data/academic-years'),
          api.get('/api/master-data/areas'),
        ]);
        setSchools(resSch.data);
        setColleges(resCol.data);
        setAcademicYears(resAy.data);
        setAreas(resAr.data);
      } catch (e) {
        console.error('Failed fetching export master data', e);
      }
    };
    fetchMaster();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (selectedSchool) params.append('school_id', selectedSchool);
      if (selectedCollege) params.append('college_id', selectedCollege);
      if (selectedAcademicYear) params.append('academic_year', selectedAcademicYear);
      if (selectedPassoutYear) params.append('passout_year', selectedPassoutYear);
      if (selectedArea) params.append('area_id', selectedArea);
      if (selectedStatus) params.append('current_status', selectedStatus);
      if (selectedEduType) params.append('education_type', selectedEduType);

      const res = await api.get(`/api/data-transfer/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const yearSuffix = selectedAcademicYear || new Date().getFullYear().toString();
      const filename = `Anekal_Student_Directory_${yearSuffix}.${format}`;

      const blob = new Blob([res.data], {
        type:
          format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to generate export file. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Export Directory Data
              </h1>
              <Badge variant="success">Excel &amp; CSV</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Download filtered or full community student records with privacy preservation.
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        {isViewer ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Viewer Role Privacy Restriction</p>
              <p className="mt-0.5">
                Contact numbers, emails, and parent names will be masked in the exported file in accordance with community directory access controls.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Authorized Export Access ({user?.role})</p>
              <p className="mt-0.5">
                Your role permits exporting full demographic information for legitimate community administration. Every export event is recorded in the audit log.
              </p>
            </div>
          </div>
        )}

        {/* Export Configuration Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Select Export Format
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                  format === 'xlsx'
                    ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <div className="text-left">
                  <div className="font-bold text-xs">Excel Workbook</div>
                  <div className="text-[10px] text-slate-500">.xlsx format with styling</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                  format === 'csv'
                    ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileText className="w-6 h-6 text-sky-600" />
                <div className="text-left">
                  <div className="font-bold text-xs">CSV Text File</div>
                  <div className="text-[10px] text-slate-500">.csv standard data file</div>
                </div>
              </button>
            </div>
          </div>

          {/* Filter Criteria */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-sky-600" />
              Filter Scope (Optional - Leave blank to export all)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Education Type</label>
                <select
                  value={selectedEduType}
                  onChange={(e) => setSelectedEduType(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">All Types</option>
                  <option value="School">School</option>
                  <option value="College">College</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">School</label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">All Schools</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.school_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">College</label>
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">All Colleges</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>{c.college_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Academic Year</label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">All Academic Years</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.year_label}>{ay.year_label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Passout Year</label>
                <select
                  value={selectedPassoutYear}
                  onChange={(e) => setSelectedPassoutYear(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">All Passout Years</option>
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Locality</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">All Localities</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.area_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Trigger Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Generating Export...' : `Download ${format.toUpperCase()} File`}</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
