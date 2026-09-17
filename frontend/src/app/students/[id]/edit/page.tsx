'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import { formatApiError } from '@/lib/error-utils';
import {
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function EditStudentPage() {
  const { id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: '',
    parent_guardian_relation: 'Father',
    parent_guardian_name: '',
    contact_number: '',
    second_number: '',
    second_number_relation: 'Parent',
    
    education_type: 'School',
    school_id: '',
    college_id: '',
    class_or_standard: '10th',
    course_degree: 'BE',
    branch_specialization: '',
    current_year_sem: '1st Year',
    
    academic_year: '2026-27',
    passout_year: '2027',
    
    area_id: '',
    address: '',
    near_masjid: '',
    current_status: 'Currently Studying',
    profession: '',
  });

  const [schools, setSchools] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [professions, setProfessions] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSch, resCol, resAy, resAr, resProf, resStudent] = await Promise.all([
          api.get('/api/schools'),
          api.get('/api/colleges'),
          api.get('/api/master-data/academic-years'),
          api.get('/api/master-data/areas'),
          api.get('/api/master-data/professions'),
          api.get(`/api/students/${id}`),
        ]);
        setSchools(resSch.data);
        setColleges(resCol.data);
        setAcademicYears(resAy.data);
        setAreas(resAr.data);
        setProfessions(resProf.data);

        const st = resStudent.data;
        setFormData({
          full_name: st.full_name || '',
          parent_guardian_relation: st.parent_guardian_relation || 'Father',
          parent_guardian_name: st.parent_guardian_name || '',
          contact_number: st.contact_number || '',
          second_number: st.second_number || '',
          second_number_relation: st.second_number_relation || 'Parent',
          education_type: st.education_type || 'School',
          school_id: st.school_id ? String(st.school_id) : '',
          college_id: st.college_id ? String(st.college_id) : '',
          class_or_standard: st.class_or_standard || '10th',
          course_degree: st.course_degree || 'BE',
          branch_specialization: st.branch_specialization || '',
          current_year_sem: st.current_year_sem || '1st Year',
          academic_year: st.academic_year || '2026-27',
          passout_year: st.passout_year ? String(st.passout_year) : '',
          area_id: st.area_id ? String(st.area_id) : '',
          address: st.address || '',
          near_masjid: st.near_masjid && st.near_masjid !== 'Not Provided' ? st.near_masjid : '',
          current_status: st.current_status || 'Currently Studying',
          profession: st.profession || '',
        });
      } catch (err: any) {
        setError(formatApiError(err, 'Failed to load record for editing'));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setError('Student name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const isSchool = formData.education_type === 'School';
      const isPassedOut = formData.current_status === 'Passed Out';

      const payload = {
        full_name: formData.full_name.trim(),
        parent_guardian_relation: formData.parent_guardian_relation || 'Father',
        parent_guardian_name: formData.parent_guardian_name.trim() || null,
        contact_number: formData.contact_number.trim() || null,
        second_number: formData.second_number.trim() || null,
        second_number_relation: formData.second_number.trim() ? formData.second_number_relation : 'Parent',
        
        education_type: formData.education_type,
        school_id: isSchool && formData.school_id ? Number(formData.school_id) : null,
        college_id: !isSchool && formData.college_id ? Number(formData.college_id) : null,
        
        class_or_standard: isSchool ? formData.class_or_standard : null,
        course_degree: !isSchool ? formData.course_degree : null,
        branch_specialization: !isSchool && formData.branch_specialization.trim() ? formData.branch_specialization.trim() : null,
        current_year_sem: !isSchool ? (isPassedOut ? 'Passed Out' : formData.current_year_sem) : null,
        
        academic_year: formData.academic_year || null,
        passout_year: formData.passout_year ? Number(formData.passout_year) : null,
        
        area_id: formData.area_id ? Number(formData.area_id) : null,
        address: formData.address.trim() || null,
        near_masjid: formData.near_masjid.trim() || null,
        current_status: formData.current_status,
        profession: isPassedOut && formData.profession.trim() ? formData.profession.trim() : null,
      };

      await api.put(`/api/students/${id}`, payload);
      router.push(`/students/${id}`);
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to update student.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto p-8 text-center animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto"></div>
          <div className="h-40 bg-slate-200 rounded-2xl"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/students/${id}`}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors text-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Edit Student Profile
              </h1>
              <p className="text-xs text-slate-500">
                Update records for {formData.full_name}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">1. Student &amp; Contact Information</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student Name *</label>
              <input
                type="text"
                required
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parent / Guardian Details</label>
              <div className="flex gap-2">
                <select
                  name="parent_guardian_relation"
                  value={formData.parent_guardian_relation}
                  onChange={handleChange}
                  className="w-36 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  name="parent_guardian_name"
                  placeholder="Enter parent / guardian name"
                  value={formData.parent_guardian_name}
                  onChange={handleChange}
                  className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number</label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Second Number (Optional)</label>
                <div className="flex gap-2">
                  <select
                    name="second_number_relation"
                    value={formData.second_number_relation}
                    onChange={handleChange}
                    className="w-36 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Self / Personal">Self / Personal</option>
                  </select>
                  <input
                    type="tel"
                    name="second_number"
                    value={formData.second_number}
                    onChange={handleChange}
                    placeholder="Phone number"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Education Type & Dynamic Details */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">2. Education &amp; Cohort</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">What is the student studying?</label>
              <select
                name="education_type"
                value={formData.education_type}
                onChange={handleChange}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="School">School</option>
                <option value="College / University">College / University</option>
              </select>
            </div>

            {formData.education_type === 'School' ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select School</label>
                  <select
                    name="school_id"
                    value={formData.school_id}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">-- Choose School --</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.school_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Class</label>
                  <select
                    name="class_or_standard"
                    value={formData.class_or_standard}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', 'Other'].map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select College / University</label>
                  <select
                    name="college_id"
                    value={formData.college_id}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">-- Choose College --</option>
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>{c.college_name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Degree</label>
                    <select
                      name="course_degree"
                      value={formData.course_degree}
                      onChange={handleChange}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {['BE', 'BTech', 'BCA', 'BSc', 'BCom', 'BA', 'Diploma', 'MBA', 'MCA', 'Other'].map((crs) => (
                        <option key={crs} value={crs}>{crs}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Branch (Optional)</label>
                    <input
                      type="text"
                      name="branch_specialization"
                      value={formData.branch_specialization}
                      onChange={handleChange}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Year / Semester</label>
                    <select
                      name="current_year_sem"
                      value={formData.current_year_sem}
                      onChange={handleChange}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {['1st Year', '2nd Year', '3rd Year', '4th Year', '1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                <select
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.year_label}>{ay.year_label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Passout Year</label>
                <input
                  type="number"
                  name="passout_year"
                  value={formData.passout_year}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          {/* Location & Status */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">3. Location &amp; Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Area</label>
                <select
                  name="area_id"
                  value={formData.area_id}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- Choose Area --</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.area_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address (Optional)</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Near which Masjid? (Optional)</label>
              <input
                type="text"
                name="near_masjid"
                value={formData.near_masjid}
                onChange={handleChange}
                placeholder="Voluntarily provided"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  name="current_status"
                  value={formData.current_status}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Currently Studying">Currently Studying</option>
                  <option value="Passed Out">Passed Out</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {formData.current_status === 'Passed Out' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Profession / Occupation</label>
                  <select
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">-- Select Profession --</option>
                    {professions.map((p) => (
                      <option key={p.id} value={p.profession_name}>{p.profession_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href={`/students/${id}`}
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Saving changes...' : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
