'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import {
  GraduationCap,
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Eye,
  Download,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function SchoolDetailsPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Section 1: Academic Year Filter
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');

  // Section 2: Passout Year Filter
  const [selectedPassoutYear, setSelectedPassoutYear] = useState<string>('all');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/api/schools/${id}`);
        setData(res.data);
      } catch (e) {
        console.error('Failed fetching school drilldown', e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto p-8 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-40 bg-slate-200 rounded-2xl"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="p-8 text-center text-slate-500">School record not found.</div>
      </AppShell>
    );
  }

  const { school, total_students, academic_years_breakdown, passout_years_breakdown, students } = data;

  // Section 1 students: filtered by Academic Year
  const section1Students = students.filter((st: any) => {
    if (selectedAcademicYear === 'all') return true;
    return st.academic_year === selectedAcademicYear;
  });

  // Section 2 students: filtered by Passout Year
  const section2Students = students.filter((st: any) => {
    if (selectedPassoutYear === 'all') return true;
    return String(st.passout_year) === String(selectedPassoutYear);
  });

  // Export helper
  const exportStudentsToExcel = (studentList: any[], filterLabel: string) => {
    const cleanSchoolName = (school.school_name || 'School').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanLabel = filterLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanSchoolName}_${cleanLabel}_Students.xlsx`;

    const exportRows = studentList.map((st: any, idx: number) => ({
      'Sl No': idx + 1,
      'Student ID': st.student_id,
      'Full Name': st.full_name,
      'Primary Contact': st.primary_contact || '',
      'Additional Contact': st.additional_contact ? `${st.additional_contact} (${st.additional_contact_relation || 'Alt'})` : '',
      'Class': st.class_standard || st.class_or_course || '',
      'Academic Year': st.academic_year || '',
      'Passout Year': st.passout_year || '',
      'Locality / Area': st.area_name || '',
      'Current Status': st.current_status || '',
      'Profession': st.profession || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, fileName);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/schools"
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                {school.school_name}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {school.locality || 'Anekal'}
                </span>
                {school.created_at && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    Added: {formatDate(school.created_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Total Enrolled</span>
              <div className="text-2xl font-bold text-amber-700">{total_students} Students</div>
            </div>
          </div>
        </div>

        {/* SECTION 1: STUDENTS (Filterable by Academic Year) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-800">1. Students by Academic Year</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse and filter enrolled students for specific academic terms (e.g., 2025-26).
              </p>
            </div>

            <button
              onClick={() => exportStudentsToExcel(section1Students, selectedAcademicYear === 'all' ? 'All_Academic_Years' : selectedAcademicYear)}
              className="px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {selectedAcademicYear === 'all' ? 'All' : selectedAcademicYear} (.xlsx)</span>
            </button>
          </div>

          {/* Academic Year Selection Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedAcademicYear('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedAcademicYear === 'all'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Academic Years ({total_students})
            </button>
            {academic_years_breakdown.map((ay: any) => (
              <button
                key={ay.year}
                onClick={() => setSelectedAcademicYear(ay.year)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  selectedAcademicYear === ay.year
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{ay.year}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${selectedAcademicYear === ay.year ? 'bg-white/20' : 'bg-slate-200 text-slate-700'}`}>
                  {ay.count}
                </span>
              </button>
            ))}
          </div>

          {/* Student Table for Section 1 */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Passout Year</th>
                  <th className="py-3 px-4">Locality</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {section1Students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No students found for academic year: {selectedAcademicYear}
                    </td>
                  </tr>
                ) : (
                  section1Students.map((st: any) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{st.student_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{st.full_name}</td>
                      <td className="py-3 px-4 text-slate-600">{st.class_standard || st.class_or_course || '—'}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{st.academic_year || '—'}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{st.passout_year || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{st.area_name || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={st.current_status === 'Graduated / Passed Out' || st.current_status === 'Graduated' ? 'success' : 'info'}>
                          {st.current_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/students/${st.id}`}
                          className="p-1.5 text-slate-500 hover:text-amber-600 inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: STUDENTS BY PASSOUT YEAR */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-800">2. Students by Passout Year</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter students by their anticipated or graduated passout year (e.g., 2026, 2027).
              </p>
            </div>

            <button
              onClick={() => exportStudentsToExcel(section2Students, selectedPassoutYear === 'all' ? 'All_Passout_Years' : `Passout_${selectedPassoutYear}`)}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {selectedPassoutYear === 'all' ? 'All' : `Passout ${selectedPassoutYear}`} (.xlsx)</span>
            </button>
          </div>

          {/* Passout Year Selection Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPassoutYear('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedPassoutYear === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Passout Years
            </button>
            {passout_years_breakdown.map((py: any) => (
              <button
                key={py.year}
                onClick={() => setSelectedPassoutYear(String(py.year))}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  selectedPassoutYear === String(py.year)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Class of {py.year}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${selectedPassoutYear === String(py.year) ? 'bg-white/20' : 'bg-slate-200 text-slate-700'}`}>
                  {py.count}
                </span>
              </button>
            ))}
          </div>

          {/* Student Table for Section 2 */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Passout Year</th>
                  <th className="py-3 px-4">Locality</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {section2Students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No students found with passout year: {selectedPassoutYear}
                    </td>
                  </tr>
                ) : (
                  section2Students.map((st: any) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{st.student_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{st.full_name}</td>
                      <td className="py-3 px-4 text-slate-600">{st.class_standard || st.class_or_course || '—'}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{st.academic_year || '—'}</td>
                      <td className="py-3 px-4 text-indigo-700 font-bold">{st.passout_year || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{st.area_name || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={st.current_status === 'Graduated / Passed Out' || st.current_status === 'Graduated' ? 'success' : 'info'}>
                          {st.current_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/students/${st.id}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
