'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import {
  Users,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Edit,
  PlusCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import * as XLSX from 'xlsx';

export default function StudentsListPage() {
  const { canEdit, isViewer } = useAuth();
  
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // 7 Simple Filters
  const [filterEduType, setFilterEduType] = useState('All');
  const [filterInstitution, setFilterInstitution] = useState('All');
  const [filterAcademicYear, setFilterAcademicYear] = useState('All');
  const [filterPassoutYear, setFilterPassoutYear] = useState('All');
  const [filterClassCourse, setFilterClassCourse] = useState('All');
  const [filterArea, setFilterArea] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Modal toggle & Export dropdown toggle
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Master options
  const [schools, setSchools] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [resSchools, resColleges, resAys, resAreas] = await Promise.all([
          api.get('/api/schools'),
          api.get('/api/colleges'),
          api.get('/api/master-data/academic-years'),
          api.get('/api/master-data/areas'),
        ]);
        setSchools(resSchools.data);
        setColleges(resColleges.data);
        setAcademicYears(resAys.data);
        setAreas(resAreas.data);
      } catch (e) {
        console.error('Failed loading filter master data', e);
      }
    };
    fetchMaster();
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 25,
      };
      if (debouncedSearch) params.q = debouncedSearch;
      if (filterEduType !== 'All') params.education_type = filterEduType;
      
      if (filterInstitution !== 'All') {
        const [type, id] = filterInstitution.split(':');
        if (type === 'school') params.school_id = id;
        if (type === 'college') params.college_id = id;
      }

      if (filterAcademicYear !== 'All') params.academic_year = filterAcademicYear;
      if (filterPassoutYear !== 'All') params.passout_year = filterPassoutYear;
      if (filterClassCourse !== 'All') params.class_or_course = filterClassCourse;
      if (filterArea !== 'All') params.area_id = filterArea;
      if (filterStatus !== 'All') params.current_status = filterStatus;

      const res = await api.get('/api/students', { params });
      setStudents(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (e) {
      console.error('Error fetching students', e);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    filterEduType,
    filterInstitution,
    filterAcademicYear,
    filterPassoutYear,
    filterClassCourse,
    filterArea,
    filterStatus,
  ]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleClearFilters = () => {
    setFilterEduType('All');
    setFilterInstitution('All');
    setFilterAcademicYear('All');
    setFilterPassoutYear('All');
    setFilterClassCourse('All');
    setFilterArea('All');
    setFilterStatus('All');
    setPage(1);
    setShowFilterModal(false);
  };

  const handleApplyFilters = () => {
    setPage(1);
    setShowFilterModal(false);
    fetchStudents();
  };

  const activeFilterCount = [
    filterEduType !== 'All',
    filterInstitution !== 'All',
    filterAcademicYear !== 'All',
    filterPassoutYear !== 'All',
    filterClassCourse !== 'All',
    filterArea !== 'All',
    filterStatus !== 'All',
  ].filter(Boolean).length;

  // Direct export of current results (client-side formatted based on currently viewed query)
  const handleExportFiltered = (exportFormat: 'xlsx' | 'csv') => {
    setShowExportMenu(false);

    const rows = students.map((st, idx) => ({
      'Sl No': idx + 1,
      'Student ID': st.student_id,
      'Student Name': st.full_name,
      'Parent / Guardian Relation': st.parent_guardian_relation || 'Father',
      'Parent / Guardian Name': st.parent_guardian_name || '',
      'Contact Number': st.contact_number || '',
      'Second Number': st.second_number || '',
      'Second Number Relation': st.second_number_relation || 'Parent',
      'School / College': st.school_name || st.college_name || '',
      'Education Type': st.education_type || '',
      'Class / Course': st.class_or_standard || st.course_degree || '',
      'Branch': st.branch_specialization || '',
      'Academic Year': st.academic_year || '',
      'Passout Year': st.passout_year || '',
      'Area': st.area_name || '',
      'Address': st.address || '',
      'Status': st.current_status || '',
      'Profession': st.profession || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    const fileName = `Anekal_Filtered_Students_${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
    XLSX.writeFile(workbook, fileName, { bookType: exportFormat });
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Students
              </h1>
              <Badge variant="info">{total} students</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Search and filter students across schools and colleges in Anekal.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canEdit && (
              <Link
                href="/students/add"
                className="px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Student</span>
              </Link>
            )}
          </div>
        </div>

        {/* Top Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, ID, contact number, parent name, school, college or area..."
              className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-2 ${
                activeFilterCount > 0
                  ? 'bg-sky-50 border-sky-300 text-sky-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Direct Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 space-y-1">
                  <button
                    onClick={() => handleExportFiltered('xlsx')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 rounded-xl flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={() => handleExportFiltered('csv')}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 rounded-xl flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>Export CSV</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Count Banner */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
          <span>{total} students found</span>
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-rose-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              Clear all filters
            </button>
          )}
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-3.5">Student ID</th>
                  <th className="py-3.5 px-3.5">Student Name</th>
                  <th className="py-3.5 px-3.5">Father / Mother / Guardian</th>
                  <th className="py-3.5 px-3.5">Contact Number</th>
                  <th className="py-3.5 px-3.5">School / College</th>
                  <th className="py-3.5 px-3.5">Class / Course</th>
                  <th className="py-3.5 px-3.5">Academic Year</th>
                  <th className="py-3.5 px-3.5">Passout Year</th>
                  <th className="py-3.5 px-3.5">Area</th>
                  <th className="py-3.5 px-3.5">Status</th>
                  <th className="py-3.5 px-3.5">Last Modified</th>
                  <th className="py-3.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading students...</span>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">No students matched your search criteria.</p>
                      <p className="text-[11px] mt-1">Try resetting filters or searching with a different name.</p>
                    </td>
                  </tr>
                ) : (
                  students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-medium text-slate-700">
                        {st.student_id}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-800">
                        <Link
                          href={`/students/${st.id}`}
                          className="hover:text-sky-600"
                        >
                          {st.full_name}
                        </Link>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {st.parent_guardian_name ? (
                          <span>
                            {st.parent_guardian_name}
                            <span className="text-slate-400 text-[10px] block">
                              ({st.parent_guardian_relation || 'Parent'})
                            </span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-600">
                        {st.contact_number || '—'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 max-w-[150px] truncate" title={st.school_name || st.college_name || 'Individual'}>
                        {st.school_name || st.college_name || '—'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        <div>{st.class_or_standard ? `${st.class_or_standard}` : (st.course_degree || '—')}</div>
                        {st.branch_specialization && <div className="text-[10px] text-slate-400">{st.branch_specialization}</div>}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 font-medium">
                        {st.academic_year || '—'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 font-medium">
                        {st.passout_year || '—'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {st.area_name || '—'}
                      </td>
                      <td className="py-3 px-3.5">
                        <Badge
                          variant={
                            st.current_status === 'Passed Out' ? 'success' : 'info'
                          }
                        >
                          {st.current_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5 text-slate-400 text-[11px]">
                        {formatDate(st.updated_at || st.created_at)}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/students/${st.id}`}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="View Student"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {canEdit && (
                            <Link
                              href={`/students/${st.id}/edit`}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Student"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {students.length > 0 ? (page - 1) * 25 + 1 : 0} to {Math.min(page * 25, total)} of {total} students
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                Page {page} of {pages || 1}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* SIMPLE FILTER MODAL (Requirement D) */}
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-sky-600" />
                  <h3 className="font-bold text-sm text-slate-800">Filter Students</h3>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. School or College */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    School or College
                  </label>
                  <select
                    value={filterEduType}
                    onChange={(e) => setFilterEduType(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="All">All</option>
                    <option value="School">School</option>
                    <option value="College / University">College / University</option>
                  </select>
                </div>

                {/* 2. Institution */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Institution
                  </label>
                  <select
                    value={filterInstitution}
                    onChange={(e) => setFilterInstitution(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="All">All</option>
                    <optgroup label="Schools">
                      {schools.map((s) => (
                        <option key={`sch-${s.id}`} value={`school:${s.id}`}>
                          {s.school_name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Colleges">
                      {colleges.map((c) => (
                        <option key={`col-${c.id}`} value={`college:${c.id}`}>
                          {c.college_name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* 3. Academic Year */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={filterAcademicYear}
                    onChange={(e) => setFilterAcademicYear(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="All">All</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.year_label}>
                        {ay.year_label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Passout Year */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Passout Year
                  </label>
                  <select
                    value={filterPassoutYear}
                    onChange={(e) => setFilterPassoutYear(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="All">All</option>
                    {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Class / Course */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Class / Course
                  </label>
                  <select
                    value={filterClassCourse}
                    onChange={(e) => setFilterClassCourse(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="All">All</option>
                    <optgroup label="School Classes">
                      {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="College Courses">
                      {['BE', 'BTech', 'BCA', 'BSc', 'BCom', 'BA', 'Diploma', 'MBA', 'MCA'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* 6. Area */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Area
                  </label>
                  <select
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="All">All</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.area_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Status */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="All">All</option>
                    <option value="Currently Studying">Currently Studying</option>
                    <option value="Passed Out">Passed Out</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
