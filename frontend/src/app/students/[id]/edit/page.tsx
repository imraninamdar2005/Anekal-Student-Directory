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
    
    // Separate Contacts
    father_name: '',
    father_contact: '',
    mother_name: '',
    mother_contact: '',
    guardian_name: '',
    guardian_contact: '',

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
    passout_school_year: '',
    passout_college_year: '',
    education_history: '',
    
    area_id: '',
    address: '',
    near_masjid: '',
    masjid: '',
    time_spent_in_jamaat: '',
    last_mulakhat_date: '',
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
        const masjidVal = st.masjid && st.masjid !== 'Not Provided' ? st.masjid : (st.near_masjid && st.near_masjid !== 'Not Provided' ? st.near_masjid : '');
        const jamaatVal = st.time_spent_in_jamaat || st.time_in_jamaat || '';

        setFormData({
          full_name: st.full_name || '',
          parent_guardian_relation: st.parent_guardian_relation || 'Father',
          parent_guardian_name: st.parent_guardian_name || '',
          father_name: st.father_name || '',
          father_contact: st.father_contact || '',
          mother_name: st.mother_name || '',
          mother_contact: st.mother_contact || '',
          guardian_name: st.guardian_name || '',
          guardian_contact: st.guardian_contact || '',
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
          passout_school_year: st.passout_school_year ? String(st.passout_school_year) : '',
          passout_college_year: st.passout_college_year ? String(st.passout_college_year) : '',
          education_history: st.education_history || '',
          area_id: st.area_id ? String(st.area_id) : '',
          address: st.address || '',
          near_masjid: masjidVal,
          masjid: masjidVal,
          time_spent_in_jamaat: jamaatVal,
          last_mulakhat_date: st.last_mulakhat_date || '',
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
      const isPassedOut = formData.current_status === 'Passed Out';
      const mVal = formData.masjid.trim() || formData.near_masjid.trim() || null;
      const jVal = formData.time_spent_in_jamaat?.trim() || null;

      const payload = {
        full_name: formData.full_name.trim(),
        parent_guardian_relation: formData.parent_guardian_relation || 'Father',
        parent_guardian_name: formData.parent_guardian_name.trim() || null,
        father_name: formData.father_name.trim() || null,
        father_contact: formData.father_contact.trim() || null,
        mother_name: formData.mother_name.trim() || null,
        mother_contact: formData.mother_contact.trim() || null,
        guardian_name: formData.guardian_name.trim() || null,
        guardian_contact: formData.guardian_contact.trim() || null,
        contact_number: formData.contact_number.trim() || null,
        second_number: formData.second_number.trim() || null,
        second_number_relation: formData.second_number.trim() ? formData.second_number_relation : 'Parent',
        
        education_type: formData.education_type,
        school_id: formData.school_id ? Number(formData.school_id) : null,
        college_id: formData.college_id ? Number(formData.college_id) : null,
        
        class_or_standard: formData.class_or_standard || null,
        course_degree: formData.course_degree || null,
        branch_specialization: formData.branch_specialization.trim() ? formData.branch_specialization.trim() : null,
        current_year_sem: isPassedOut ? 'Passed Out' : (formData.current_year_sem || null),
        
        academic_year: formData.academic_year || null,
        passout_year: formData.passout_year ? Number(formData.passout_year) : (formData.passout_college_year ? Number(formData.passout_college_year) : (formData.passout_school_year ? Number(formData.passout_school_year) : null)),
        passout_school_year: formData.passout_school_year ? Number(formData.passout_school_year) : null,
        passout_college_year: formData.passout_college_year ? Number(formData.passout_college_year) : null,
        education_history: formData.education_history.trim() || null,
        
        area_id: formData.area_id ? Number(formData.area_id) : null,
        address: formData.address.trim() || null,
        masjid: mVal,
        near_masjid: mVal,
        time_spent_in_jamaat: jVal,
        time_in_jamaat: jVal,
        last_mulakhat_date: formData.last_mulakhat_date.trim() ? formData.last_mulakhat_date.trim() : null,
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
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href={`/students/${id}`}
              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Edit Student Profile
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update records for {formData.full_name}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Student & Contact Information */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              1. Student &amp; Family Contacts
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Name *
              </label>
              <input
                type="text"
                required
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Separate Father Information */}
            <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block uppercase">
                Father Information (Optional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Father Name
                  </label>
                  <input
                    type="text"
                    name="father_name"
                    placeholder="e.g. Ahmed Khan"
                    value={formData.father_name}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Father Contact
                  </label>
                  <input
                    type="tel"
                    name="father_contact"
                    placeholder="Father's phone number"
                    value={formData.father_contact}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Separate Mother Information */}
            <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block uppercase">
                Mother Information (Optional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Mother Name
                  </label>
                  <input
                    type="text"
                    name="mother_name"
                    placeholder="e.g. Ayesha Khan"
                    value={formData.mother_name}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Mother Contact
                  </label>
                  <input
                    type="tel"
                    name="mother_contact"
                    placeholder="Mother's phone number"
                    value={formData.mother_contact}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Separate Guardian Information */}
            <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block uppercase">
                Guardian Information (Optional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Guardian Name
                  </label>
                  <input
                    type="text"
                    name="guardian_name"
                    placeholder="e.g. Abdul Khan"
                    value={formData.guardian_name}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Guardian Contact
                  </label>
                  <input
                    type="tel"
                    name="guardian_contact"
                    placeholder="Guardian's phone number"
                    value={formData.guardian_contact}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Existing Contact Number & Second Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Contact Number
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  placeholder="Primary phone number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Second Number (Optional)
                </label>
                <div className="flex gap-2">
                  <select
                    name="second_number_relation"
                    value={formData.second_number_relation}
                    onChange={handleChange}
                    className="w-28 text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Self / Personal">Self</option>
                  </select>
                  <input
                    type="tel"
                    name="second_number"
                    value={formData.second_number}
                    onChange={handleChange}
                    placeholder="Second number"
                    className="flex-1 text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Separate School & College + Currently Studying */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              2. Education &amp; Institutions (Separate)
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Education Type
              </label>
              <select
                name="education_type"
                value={formData.education_type}
                onChange={handleChange}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="School">School</option>
                <option value="College / University">College / University</option>
              </select>
            </div>

            {/* Separate School */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  School
                </label>
                <select
                  name="school_id"
                  value={formData.school_id}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="">-- None / Not Recorded --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.school_name}</option>
                  ))}
                </select>
              </div>

              {/* Separate College */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  College / University
                </label>
                <select
                  name="college_id"
                  value={formData.college_id}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="">-- Not joined yet --</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>{c.college_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Currently Studying Details */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300 block uppercase">
                Currently Studying Details
              </span>

              {formData.education_type === 'School' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Class / Standard
                  </label>
                  <select
                    name="class_or_standard"
                    value={formData.class_or_standard}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', 'Other'].map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Course / Degree
                    </label>
                    <select
                      name="course_degree"
                      value={formData.course_degree}
                      onChange={handleChange}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      {['BE', 'BTech', 'BCA', 'BSc', 'BCom', 'BA', 'Diploma', 'MBA', 'MCA', 'Other'].map((crs) => (
                        <option key={crs} value={crs}>{crs}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Branch / Specialization
                    </label>
                    <input
                      type="text"
                      name="branch_specialization"
                      placeholder="e.g. CSE"
                      value={formData.branch_specialization}
                      onChange={handleChange}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Year / Semester
                    </label>
                    <select
                      name="current_year_sem"
                      value={formData.current_year_sem}
                      onChange={handleChange}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      {['1st Year', '2nd Year', '3rd Year', '4th Year', '1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Academic Year and Passout Milestones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Year
                </label>
                <select
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.year_label}>{ay.year_label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  10th Passout Year (Milestone)
                </label>
                <input
                  type="number"
                  name="passout_school_year"
                  placeholder="e.g. 2025"
                  value={formData.passout_school_year}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  College Passout Year (Milestone)
                </label>
                <input
                  type="number"
                  name="passout_college_year"
                  placeholder="e.g. 2028"
                  value={formData.passout_college_year}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Education History Notes (Optional)
              </label>
              <textarea
                name="education_history"
                rows={2}
                placeholder="e.g. 2025 (10th)&#10;2028 (College)"
                value={formData.education_history}
                onChange={handleChange}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* SECTION 3: Location & Status & Optional Masjid / Jamaat */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              3. Location &amp; Additional Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Area</label>
                <select
                  name="area_id"
                  value={formData.area_id}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="">-- Choose Area --</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.area_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Address (Optional)</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* Masjid & Time Spent in Jamaat (Both completely optional & voluntary) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Masjid (Voluntary &amp; Optional)
                </label>
                <input
                  type="text"
                  name="masjid"
                  value={formData.masjid}
                  onChange={handleChange}
                  placeholder="Voluntarily provided (leave blank if not applicable)"
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Time Spent in Jamaat (Voluntary / Optional)
                </label>
                <input
                  type="text"
                  name="time_spent_in_jamaat"
                  placeholder="e.g. 2 years, 6 months, since childhood"
                  value={formData.time_spent_in_jamaat}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* Last Mulakhat Date (Optional) */}
            <div className="p-3.5 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl border border-sky-200/60 dark:border-sky-800/40">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Last Mulakhat Date (Optional)
                </label>
                {formData.last_mulakhat_date && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, last_mulakhat_date: '' }))}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Clear Date
                  </button>
                )}
              </div>
              <input
                type="date"
                name="last_mulakhat_date"
                value={formData.last_mulakhat_date}
                onChange={handleChange}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-200"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Optional date of mulakhat. If cleared, displays as &apos;Not Provided&apos;.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  name="current_status"
                  value={formData.current_status}
                  onChange={handleChange}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="Currently Studying">Currently Studying</option>
                  <option value="Passed Out">Passed Out</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {formData.current_status === 'Passed Out' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Profession / Occupation</label>
                  <select
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
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
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl"
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
