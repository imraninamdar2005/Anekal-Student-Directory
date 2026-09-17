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
          {/* Section 1: Basic & Contact Info */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" />
                Student &amp; Family Information
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Student Name</span>
                <span className="font-bold text-slate-800">{student.full_name}</span>
              </div>
              {student.parent_guardian_name && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Parent / Guardian</span>
                  <span className="font-semibold text-slate-800">
                    {student.parent_guardian_name}
                    <span className="text-slate-500 text-[11px] block text-right font-normal">
                      ({student.parent_guardian_relation || 'Parent'})
                    </span>
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Contact Number</span>
                <span className="font-mono font-semibold text-slate-800">{student.contact_number || 'None provided'}</span>
              </div>
              {student.second_number && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Second Number ({student.second_number_relation || 'Parent'})</span>
                  <span className="font-mono text-slate-800">{student.second_number}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Area</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {student.area_name || 'Anekal'}
                </span>
              </div>
              {student.address && (
                <div className="flex justify-between py-1 border-t border-slate-50">
                  <span className="text-slate-500 font-medium">Address</span>
                  <span className="text-slate-800 font-medium text-right">{student.address}</span>
                </div>
              )}
              {student.near_masjid && student.near_masjid !== 'Not Provided' && (
                <div className="flex justify-between py-1 border-t border-slate-50">
                  <span className="text-slate-500 font-medium">Near which Masjid?</span>
                  <span className="text-slate-800 font-medium text-right">{student.near_masjid}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Education Profile */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Education Details
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Education Type</span>
                <Badge variant={student.education_type === 'School' ? 'warning' : 'purple'}>
                  {student.education_type}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Institution</span>
                <span className="font-semibold text-slate-800">
                  {student.school_name || student.college_name || 'Individual Record'}
                </span>
              </div>
              {student.education_type === 'School' ? (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Current Class</span>
                  <span className="font-bold text-slate-800">{student.class_or_standard}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Course / Degree</span>
                    <span className="font-bold text-slate-800">{student.course_degree || '—'}</span>
                  </div>
                  {student.branch_specialization && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium">Branch / Specialization</span>
                      <span className="text-slate-800">{student.branch_specialization}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Year / Semester</span>
                    <span className="text-slate-800">{student.current_year_sem || '—'}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Academic Year</span>
                <span className="font-semibold text-slate-800">{student.academic_year || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Expected Passout Year</span>
                <span className="font-bold text-slate-800">{student.passout_year || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Status & Profession (if passed out) */}
          {student.current_status === 'Passed Out' && student.profession && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  Alumni Status &amp; Profession
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className="font-bold text-slate-800">{student.current_status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Profession / Occupation</span>
                  <span className="font-semibold text-emerald-700">{student.profession}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Passout Year</span>
                  <span className="text-slate-800 font-bold">{student.passout_year}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: System Information */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                Record History
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Created Date</span>
                <span className="text-slate-800 font-mono">
                  {new Date(student.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Last Modified Date</span>
                <span className="text-slate-800 font-mono">
                  {new Date(student.updated_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Created By</span>
                <span className="text-slate-800 font-medium">{student.created_by || 'admin'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Last Modified By</span>
                <span className="text-slate-800 font-medium">{student.updated_by || 'admin'}</span>
              </div>
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
