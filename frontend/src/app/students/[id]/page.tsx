'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  Trash2,
  GraduationCap,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  Building2,
  Phone,
  Briefcase,
  Home
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function StudentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { canEdit, canAdmin, isViewer } = useAuth();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/api/students/${id}`);
        setStudent(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load student record');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStudent();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/students/${id}`);
      router.push('/students');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete student');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatDetailMulakhatDate = (dateStr?: string | null) => {
    if (!dateStr || dateStr.trim() === '' || dateStr === 'Not Provided') {
      return 'Not Provided';
    }
    try {
      const clean = dateStr.split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        const fullMonths = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          return `${d} ${fullMonths[m - 1]} ${y}`;
        }
      }
      const dt = new Date(dateStr);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto p-8 text-center animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto"></div>
          <div className="h-40 bg-slate-200 rounded-2xl"></div>
          <div className="h-60 bg-slate-200 rounded-2xl"></div>
        </div>
      </AppShell>
    );
  }

  if (error || !student) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Student Record Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">{error || 'The requested profile does not exist.'}</p>
          <Link
            href="/students"
            className="inline-block mt-4 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
          >
            Back to Directory
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/students"
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  {student.full_name}
                </h1>
                <Badge variant={student.current_status === 'Passed Out' ? 'success' : 'info'}>
                  {student.current_status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Student ID: {student.student_id} &bull; Registered: {new Date(student.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                href={`/students/${student.id}/edit`}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Link>
            )}
            {canAdmin && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Card Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECTION 1: STUDENT INFORMATION */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Student Information
              </h2>
              <Badge variant={student.current_status === 'Passed Out' ? 'success' : 'info'}>
                {student.current_status}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Student ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{student.student_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Student Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{student.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{student.current_status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Area</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {student.area_name || 'Anekal'}
                </span>
              </div>
              {student.address && (
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Address</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium text-right max-w-[240px]">{student.address}</span>
                </div>
              )}
              {student.profession && (
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Profession</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{student.profession}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: FAMILY / CONTACT */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Family / Contact
              </h2>
              {isViewer && (
                <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60 font-medium">
                  Privacy Protected
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {/* Father */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Father</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {student.father_name || (student.parent_guardian_relation === 'Father' ? student.parent_guardian_name : '—')}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Father Contact</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {student.father_contact || (student.parent_guardian_relation === 'Father' ? student.contact_number : '—')}
                  </span>
                </div>
              </div>

              {/* Mother */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Mother</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {student.mother_name || (student.parent_guardian_relation === 'Mother' ? student.parent_guardian_name : '—')}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Mother Contact</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {student.mother_contact || (student.parent_guardian_relation === 'Mother' ? student.contact_number : '—')}
                  </span>
                </div>
              </div>

              {/* Guardian */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Guardian</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {student.guardian_name || (student.parent_guardian_relation === 'Guardian' ? student.parent_guardian_name : '—')}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Guardian Contact</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {student.guardian_contact || (student.parent_guardian_relation === 'Guardian' ? student.contact_number : '—')}
                  </span>
                </div>
              </div>

              {/* Existing Contact Number */}
              <div className="flex justify-between py-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Primary Contact Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{student.contact_number || '—'}</span>
              </div>
              {student.second_number && (
                <div className="flex justify-between py-1 border-t border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Second Number ({student.second_number_relation || 'Parent'})</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{student.second_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: EDUCATION */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Education
              </h2>
              <Badge variant={student.education_type === 'School' ? 'warning' : 'purple'}>
                {student.education_type}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              {student.education_type === 'School' ? (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Current School</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 max-w-[230px] text-right">
                      {student.school_name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Class</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {student.class_or_standard || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Academic Year</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{student.academic_year || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Currently Studying</span>
                    <span className="font-bold text-sky-700 dark:text-sky-300">
                      {student.current_status === 'Passed Out' ? (
                        <span className="italic text-slate-500">Completed ({student.class_or_standard || 'Passed Out'})</span>
                      ) : (
                        student.currently_studying || student.class_or_standard || 'School'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Passout Year</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{student.passout_school_year || student.passout_year || '—'}</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Previous School Card */}
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                      Previous School Information
                    </span>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Previous School</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-right max-w-[210px]">
                        {student.school_name || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">School Passout Year</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {student.passout_school_year || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Current College / University Card */}
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/30 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider block">
                      Current College / University Information
                    </span>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">College / University</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-right max-w-[210px]">
                        {student.college_name || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Course</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{student.course_degree || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Branch</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{student.branch_specialization || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Current Year</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{student.current_year_sem || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Academic Year</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{student.academic_year || '—'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Currently Studying</span>
                    <span className="font-bold text-sky-700 dark:text-sky-300">
                      {student.current_status === 'Passed Out' ? (
                        <span className="italic text-slate-500">Completed ({student.course_degree || 'Passed Out'})</span>
                      ) : (
                        student.currently_studying || `${student.course_degree || ''}${student.branch_specialization ? ` (${student.branch_specialization})` : ''}${student.current_year_sem ? ` — ${student.current_year_sem}` : ''}`.trim() || 'College'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Passout Year (College)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{student.passout_college_year || student.passout_year || '—'}</span>
                  </div>
                </>
              )}
              
              {/* Education History / Milestones */}
              <div className="pt-2">
                <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-2">Education History / Milestones</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
                  {student.education_history ? (
                    <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-medium">{student.education_history}</div>
                  ) : (
                    <>
                      {student.passout_school_year && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">School Milestone</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{student.passout_school_year} (10th)</span>
                        </div>
                      )}
                      {student.passout_college_year && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">College Milestone</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{student.passout_college_year} (College)</span>
                        </div>
                      )}
                      {!student.passout_school_year && !student.passout_college_year && student.passout_year && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            {student.education_type === 'School' ? 'School Milestone' : 'College Milestone'}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                            {student.passout_year} {student.education_type === 'School' ? '(10th)' : '(College)'}
                          </span>
                        </div>
                      )}
                      {!student.passout_school_year && !student.passout_college_year && !student.passout_year && (
                        <span className="text-slate-400 dark:text-slate-500 italic text-xs">No milestones recorded</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: ADDITIONAL INFORMATION */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                <Home className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Additional Information
              </h2>
              {isViewer && (
                <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60 font-medium">
                  Private &bull; Authorized Only
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Masjid (Voluntary)</span>
                {isViewer ? (
                  <span className="text-slate-400 dark:text-slate-500 italic">Restricted</span>
                ) : student.masjid && student.masjid !== 'Not Provided' ? (
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{student.masjid}</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic">Not Provided</span>
                )}
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Time Spent in Jamaat</span>
                {isViewer ? (
                  <span className="text-slate-400 dark:text-slate-500 italic">Restricted</span>
                ) : student.time_spent_in_jamaat && student.time_spent_in_jamaat !== 'Not Provided' ? (
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{student.time_spent_in_jamaat}</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic">Not Provided</span>
                )}
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Last Mulakhat Date</span>
                {student.last_mulakhat_date && student.last_mulakhat_date !== 'Not Provided' ? (
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{formatDetailMulakhatDate(student.last_mulakhat_date)}</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic">Not Provided</span>
                )}
              </div>
            </div>
          </div>
        </div>

          {/* Section 5: System Information */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                Record History
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Created Date</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">
                  {new Date(student.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Last Modified Date</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">
                  {new Date(student.updated_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Created By</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{student.created_by || 'admin'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Last Modified By</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{student.updated_by || 'admin'}</span>
              </div>
            </div>
          </div>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-bold text-base text-slate-800">Confirm Deletion</h3>
              </div>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <strong>{student.full_name}</strong> (ID: {student.student_id})? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
