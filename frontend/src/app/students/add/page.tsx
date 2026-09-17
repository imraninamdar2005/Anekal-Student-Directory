'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import {
  UserPlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Building2,
  MapPin,
  School as SchoolIcon,
  Phone,
  HelpCircle,
  Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default function AddStudentWizardPage() {
  const router = useRouter();

  // Wizard state: 1 -> 5
  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic & Contacts
    full_name: '',
    parent_guardian_relation: 'Father',
    parent_guardian_name: '',
    contact_number: '',
    second_number: '',
    second_number_relation: 'Parent',

    // Step 2: Study type
    education_type: 'School', // 'School' or 'College / University'

    // Step 3: Education Details (Conditional)
    school_id: '',
    class_or_standard: '10th',
    
    college_id: '',
    course_degree: 'BE',
    branch_specialization: '',
    current_year_sem: '1st Year',

    academic_year: '2026-27',
    passout_year: 2027,

    // Step 4: Location & Status
    area_id: '',
    address: '',
    near_masjid: '',
    current_status: 'Currently Studying', // 'Currently Studying', 'Passed Out', 'Other'
    profession: '',
  });

  // Master Data
  const [schools, setSchools] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);

  // Duplicate Check
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Add Modals
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolLocality, setNewSchoolLocality] = useState('');

  const [showAddCollegeModal, setShowAddCollegeModal] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeLocality, setNewCollegeLocality] = useState('');

  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaDesc, setNewAreaDesc] = useState('');

  const fetchMasterData = async () => {
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

      if (resSchools.data.length > 0 && !formData.school_id) {
        setFormData((prev) => ({ ...prev, school_id: String(resSchools.data[0].id) }));
      }
      if (resColleges.data.length > 0 && !formData.college_id) {
        setFormData((prev) => ({ ...prev, college_id: String(resColleges.data[0].id) }));
      }
      if (resAreas.data.length > 0 && !formData.area_id) {
        setFormData((prev) => ({ ...prev, area_id: String(resAreas.data[0].id) }));
      }
    } catch (e) {
      console.error('Failed to fetch master data', e);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Automatic calculation of expected passout year
  useEffect(() => {
    // Parse starting academic year, e.g. "2026-27" -> 2026
    let startYear = 2026;
    if (formData.academic_year && formData.academic_year.includes('-')) {
      const parsed = parseInt(formData.academic_year.split('-')[0], 10);
      if (!isNaN(parsed)) startYear = parsed;
    }

    if (formData.education_type === 'School') {
      if (formData.class_or_standard === '10th') {
        setFormData((prev) => ({ ...prev, passout_year: startYear + 1 }));
      } else {
        const clsNum = parseInt(formData.class_or_standard.replace(/\D/g, ''), 10);
        if (!isNaN(clsNum) && clsNum >= 1 && clsNum <= 9) {
          const yearsRemaining = 10 - clsNum;
          setFormData((prev) => ({ ...prev, passout_year: startYear + 1 + yearsRemaining }));
        }
      }
    } else if (formData.education_type === 'College / University') {
      const yearMap: Record<string, number> = {
        '1st Year': 3,
        '2nd Year': 2,
        '3rd Year': 1,
        '4th Year': 0,
      };
      const rem = yearMap[formData.current_year_sem] ?? 1;
      setFormData((prev) => ({ ...prev, passout_year: startYear + 1 + rem }));
    }
  }, [formData.education_type, formData.class_or_standard, formData.current_year_sem, formData.academic_year]);

  // Duplicate check on moving to Review
  const runDuplicateCheck = async () => {
    if (!formData.full_name) return;
    try {
      const res = await api.post('/api/students/check-duplicate', {
        full_name: formData.full_name,
        contact_number: formData.contact_number,
        school_id: formData.education_type === 'School' ? Number(formData.school_id) : null,
        college_id: formData.education_type === 'College / University' ? Number(formData.college_id) : null,
        academic_year: formData.academic_year,
      });
      if (res.data.is_duplicate) {
        setDuplicateWarning(res.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      console.error('Duplicate check error', e);
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!formData.full_name.trim()) {
        setError('Please enter the Student Name.');
        return;
      }
      if (!formData.contact_number.trim()) {
        setError('Please enter a valid Contact Number.');
        return;
      }
    }
    if (step === 4) {
      runDuplicateCheck();
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload: any = {
        full_name: formData.full_name.trim(),
        parent_guardian_relation: formData.parent_guardian_relation || 'Father',
        parent_guardian_name: formData.parent_guardian_name.trim() || null,
        contact_number: formData.contact_number.trim(),
        second_number: formData.second_number.trim() || null,
        second_number_relation: formData.second_number ? formData.second_number_relation : 'Parent',
        education_type: formData.education_type,
        academic_year: formData.academic_year,
        passout_year: formData.passout_year ? Number(formData.passout_year) : null,
        area_id: formData.area_id ? Number(formData.area_id) : null,
        address: formData.address.trim() || null,
        near_masjid: formData.near_masjid.trim() || null,
        current_status: formData.current_status,
        profession: formData.current_status === 'Passed Out' ? formData.profession.trim() || null : null,
      };

      if (formData.education_type === 'School') {
        payload.school_id = formData.school_id ? Number(formData.school_id) : null;
        payload.class_or_standard = formData.class_or_standard;
      } else {
        payload.college_id = formData.college_id ? Number(formData.college_id) : null;
        payload.course_degree = formData.course_degree;
        payload.branch_specialization = formData.branch_specialization.trim() || null;
        payload.current_year_sem = formData.current_year_sem;
      }

      await api.post('/api/students', payload);
      router.push('/students');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save student record. Please verify fields.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Add School
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;
    try {
      const res = await api.post('/api/schools', {
        school_name: newSchoolName.trim(),
        locality: newSchoolLocality.trim() || null,
      });
      setSchools((prev) => [...prev, res.data]);
      setFormData((prev) => ({ ...prev, school_id: String(res.data.id) }));
      setNewSchoolName('');
      setNewSchoolLocality('');
      setShowAddSchoolModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create school');
    }
  };

  // Quick Add College
  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName.trim()) return;
    try {
      const res = await api.post('/api/colleges', {
        college_name: newCollegeName.trim(),
        locality: newCollegeLocality.trim() || null,
      });
      setColleges((prev) => [...prev, res.data]);
      setFormData((prev) => ({ ...prev, college_id: String(res.data.id) }));
      setNewCollegeName('');
      setNewCollegeLocality('');
      setShowAddCollegeModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create college');
    }
  };

  // Quick Add Area
  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    try {
      const res = await api.post('/api/master-data/areas', {
        area_name: newAreaName.trim(),
        description: newAreaDesc.trim() || null,
      });
      setAreas((prev) => [...prev, res.data]);
      setFormData((prev) => ({ ...prev, area_id: String(res.data.id) }));
      setNewAreaName('');
      setNewAreaDesc('');
      setShowAddAreaModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create area');
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/students"
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Add Student
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Step-by-step smart registration form
              </p>
            </div>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2 px-1">
            <span className={step >= 1 ? 'text-sky-600 font-bold' : ''}>1. Basic Info</span>
            <span className={step >= 2 ? 'text-sky-600 font-bold' : ''}>2. Education Type</span>
            <span className={step >= 3 ? 'text-sky-600 font-bold' : ''}>3. Details</span>
            <span className={step >= 4 ? 'text-sky-600 font-bold' : ''}>4. Location &amp; Status</span>
            <span className={step >= 5 ? 'text-sky-600 font-bold' : ''}>5. Review</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-sky-600 h-2 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Container */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                Step 1: Student &amp; Contact Information
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmed Khan"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Parent / Guardian (Requirement H) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent / Guardian Relation
                  </label>
                  <select
                    value={formData.parent_guardian_relation}
                    onChange={(e) => setFormData({ ...formData, parent_guardian_relation: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent / Guardian Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Farooq Khan"
                    value={formData.parent_guardian_name}
                    onChange={(e) => setFormData({ ...formData, parent_guardian_name: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Contact Number (Requirement G) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Second Number (Optional) (Requirement G) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Whose number?
                  </label>
                  <select
                    value={formData.second_number_relation}
                    onChange={(e) => setFormData({ ...formData, second_number_relation: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Alternate Contact">Alternate Contact</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Second Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="Additional phone number"
                    value={formData.second_number}
                    onChange={(e) => setFormData({ ...formData, second_number: e.target.value })}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Study Type Selection */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                Step 2: What is the student studying?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, education_type: 'School' })}
                  className={`p-6 rounded-2xl border text-left flex flex-col items-start gap-3 transition-all ${
                    formData.education_type === 'School'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 text-amber-950'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="p-3 bg-amber-100 rounded-xl text-amber-700">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">School</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Primary, Middle, or High School (Class 1st to 10th standard).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, education_type: 'College / University' })}
                  className={`p-6 rounded-2xl border text-left flex flex-col items-start gap-3 transition-all ${
                    formData.education_type === 'College / University'
                      ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 text-indigo-950'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">College / University</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Undergraduate, Diploma, Engineering, Medical, or Postgraduate.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Education Details (Conditional) */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                Step 3: {formData.education_type} Details
              </h2>

              {/* IF SCHOOL */}
              {formData.education_type === 'School' ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">School *</label>
                      <button
                        type="button"
                        onClick={() => setShowAddSchoolModal(true)}
                        className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New School</span>
                      </button>
                    </div>
                    <select
                      value={formData.school_id}
                      onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.school_name} {s.locality ? `(${s.locality})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Current Class
                      </label>
                      <select
                        value={formData.class_or_standard}
                        onChange={(e) => setFormData({ ...formData, class_or_standard: e.target.value })}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', 'Other'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Academic Year
                      </label>
                      <select
                        value={formData.academic_year}
                        onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {academicYears.map((ay) => (
                          <option key={ay.id} value={ay.year_label}>
                            {ay.year_label} {ay.is_current ? '(Current)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Expected Passout Year
                      </label>
                      <input
                        type="number"
                        value={formData.passout_year}
                        onChange={(e) => setFormData({ ...formData, passout_year: parseInt(e.target.value) || 2027 })}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* IF COLLEGE / UNIVERSITY */
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">College / University *</label>
                      <button
                        type="button"
                        onClick={() => setShowAddCollegeModal(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New College</span>
                      </button>
                    </div>
                    <select
                      value={formData.college_id}
                      onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.college_name} {c.locality ? `(${c.locality})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Course / Degree
                      </label>
                      <select
                        value={formData.course_degree}
                        onChange={(e) => setFormData({ ...formData, course_degree: e.target.value })}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {['BE', 'BTech', 'BCA', 'BSc', 'BCom', 'BA', 'Diploma', 'MBA', 'MCA', 'Other'].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Branch / Specialization (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science, Mechanical"
                        value={formData.branch_specialization}
                        onChange={(e) => setFormData({ ...formData, branch_specialization: e.target.value })}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Current Year / Semester
                      </label>
                      <select
                        value={formData.current_year_sem}
                        onChange={(e) => setFormData({ ...formData, current_year_sem: e.target.value })}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {['1st Year', '2nd Year', '3rd Year', '4th Year', '1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Academic Year
                      </label>
                      <select
                        value={formData.academic_year}
                        onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {academicYears.map((ay) => (
                          <option key={ay.id} value={ay.year_label}>
                            {ay.year_label} {ay.is_current ? '(Current)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Expected Passout Year
                      </label>
                      <input
                        type="number"
                        value={formData.passout_year}
                        onChange={(e) => setFormData({ ...formData, passout_year: parseInt(e.target.value) || 2028 })}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Location & Status */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                Step 4: Location &amp; Status
              </h2>

              {/* Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Area</label>
                  <button
                    type="button"
                    onClick={() => setShowAddAreaModal(true)}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Area</span>
                  </button>
                </div>
                <select
                  value={formData.area_id}
                  onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.area_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Main Market, Anekal"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Near which Masjid? (Optional, Requirement N) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Near which Masjid? (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Voluntarily provided (leave blank if not applicable)"
                  value={formData.near_masjid}
                  onChange={(e) => setFormData({ ...formData, near_masjid: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Status (Requirement L) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.current_status}
                  onChange={(e) => setFormData({ ...formData, current_status: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Currently Studying">Currently Studying</option>
                  <option value="Passed Out">Passed Out</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Current Profession (Shown ONLY if Passed Out, Requirement L) */}
              {formData.current_status === 'Passed Out' && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-emerald-900">Alumni Details</h3>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-800 mb-1">
                      Current Profession / Occupation
                    </label>
                    <select
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      className="w-full text-xs p-3 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Profession</option>
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Business">Business</option>
                      <option value="Government Job">Government Job</option>
                      <option value="Student">Student</option>
                      <option value="Job Seeking">Job Seeking</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Review & Save */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                Step 5: Review &amp; Confirm
              </h2>

              {duplicateWarning && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Possible Duplicate Record Detected</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11.5px]">
                    {duplicateWarning.reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Review Summary Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Student Name</span>
                    <strong className="text-slate-800 text-sm">{formData.full_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Parent / Guardian</span>
                    <span className="text-slate-700">
                      {formData.parent_guardian_name ? `${formData.parent_guardian_name} (${formData.parent_guardian_relation})` : '—'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Contact Number</span>
                    <span className="font-mono text-slate-800 font-semibold">{formData.contact_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Second Number</span>
                    <span className="font-mono text-slate-700">
                      {formData.second_number ? `${formData.second_number} (${formData.second_number_relation})` : 'None'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Education Type</span>
                    <Badge variant={formData.education_type === 'School' ? 'warning' : 'purple'}>
                      {formData.education_type}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Institution</span>
                    <span className="text-slate-800 font-semibold">
                      {formData.education_type === 'School'
                        ? schools.find((s) => String(s.id) === String(formData.school_id))?.school_name
                        : colleges.find((c) => String(c.id) === String(formData.college_id))?.college_name}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Class / Course</span>
                    <span className="text-slate-800">
                      {formData.education_type === 'School'
                        ? `${formData.class_or_standard} Standard`
                        : `${formData.course_degree} ${formData.branch_specialization ? `(${formData.branch_specialization})` : ''}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Academic / Passout Year</span>
                    <span className="text-slate-800">
                      {formData.academic_year} &bull; Passout {formData.passout_year}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Area</span>
                    <span className="text-slate-800">
                      {areas.find((a) => String(a.id) === String(formData.area_id))?.area_name || 'Anekal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                    <Badge variant={formData.current_status === 'Passed Out' ? 'success' : 'info'}>
                      {formData.current_status}
                    </Badge>
                    {formData.profession && (
                      <span className="block text-[11px] text-slate-500 mt-0.5">{formData.profession}</span>
                    )}
                  </div>
                </div>

                {formData.near_masjid && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 block text-[10px] uppercase">Near which Masjid?</span>
                    <span className="text-slate-700">{formData.near_masjid}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wizard Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-1.5"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-7 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Saving Student...' : 'Save Student'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Add School Modal */}
        {showAddSchoolModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-600" />
                Add New School
              </h3>
              <form onSubmit={handleCreateSchool} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="School Name"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Locality / Area"
                  value={newSchoolLocality}
                  onChange={(e) => setNewSchoolLocality(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSchoolModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-xl"
                  >
                    Save School
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Add College Modal */}
        {showAddCollegeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Add New College
              </h3>
              <form onSubmit={handleCreateCollege} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="College / University Name"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Locality / Area"
                  value={newCollegeLocality}
                  onChange={(e) => setNewCollegeLocality(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCollegeModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl"
                  >
                    Save College
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Add Area Modal */}
        {showAddAreaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                Add New Area
              </h3>
              <form onSubmit={handleCreateArea} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Area Name"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Description (Optional)"
                  value={newAreaDesc}
                  onChange={(e) => setNewAreaDesc(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAreaModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl"
                  >
                    Save Area
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
