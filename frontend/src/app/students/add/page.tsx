'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import { formatApiError } from '@/lib/error-utils';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Building2,
  MapPin,
  Briefcase,
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
    whose_name_relation: 'Father', // 'Father', 'Mother', 'Guardian'
    whose_name: '',
    parent_guardian_relation: 'Father',
    parent_guardian_name: '',
    father_name: '',
    father_contact: '',
    mother_name: '',
    mother_contact: '',
    guardian_name: '',
    guardian_contact: '',
    contact_number: '',
    whose_number_relation: 'Father', // 'Father', 'Mother', 'Guardian', 'Self'
    second_number: '',
    second_number_relation: 'Father',

    // Step 2: Study type
    education_type: 'School', // 'School' or 'College / University'

    // Step 3: Education Details (School & College Separate)
    school_id: '',
    class_or_standard: '10th',
    
    college_id: '',
    course_degree: 'BE',
    branch_specialization: '',
    current_year_sem: '1st Year',

    academic_year: '2026-27',
    passout_year: 2027,
    passout_school_year: '',
    passout_college_year: '',
    education_history: '',
    currently_studying: '',

    // Step 4: Location & Status
    area_id: '',
    address: '',
    masjid: '',
    near_masjid: '',
    time_spent_in_jamaat: '',
    last_mulakhat_date: '',
    current_status: 'Currently Studying', // 'Currently Studying', 'Passed Out', 'Other'
    profession: '',
  });

  // Master Data
  const [schools, setSchools] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [professions, setProfessions] = useState<any[]>([]);

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

  const [showAddProfessionModal, setShowAddProfessionModal] = useState(false);
  const [newProfessionName, setNewProfessionName] = useState('');

  const fetchMasterData = async () => {
    try {
      const [resSchools, resColleges, resAys, resAreas, resProf] = await Promise.all([
        api.get('/api/schools'),
        api.get('/api/colleges'),
        api.get('/api/master-data/academic-years'),
        api.get('/api/master-data/areas'),
        api.get('/api/master-data/professions'),
      ]);
      setSchools(resSchools.data);
      setColleges(resColleges.data);
      setAcademicYears(resAys.data);
      setAreas(resAreas.data);
      setProfessions(resProf.data);

      if (resSchools.data.length > 0 && !formData.school_id) {
        setFormData((prev) => ({ ...prev, school_id: String(resSchools.data[0].id) }));
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
    let startYear = 2026;
    if (formData.academic_year && formData.academic_year.includes('-')) {
      const parsed = parseInt(formData.academic_year.split('-')[0], 10);
      if (!isNaN(parsed)) startYear = parsed;
    }

    if (formData.education_type === 'School') {
      if (formData.class_or_standard === '10th') {
        setFormData((prev) => ({
          ...prev,
          passout_year: startYear + 1,
          passout_school_year: String(startYear + 1),
          currently_studying: '10th Standard',
        }));
      } else {
        const clsNum = parseInt(formData.class_or_standard.replace(/\D/g, ''), 10);
        if (!isNaN(clsNum) && clsNum >= 1 && clsNum <= 9) {
          const yearsRemaining = 10 - clsNum;
          setFormData((prev) => ({
            ...prev,
            passout_year: startYear + 1 + yearsRemaining,
            passout_school_year: String(startYear + 1 + yearsRemaining),
            currently_studying: `${formData.class_or_standard} Standard`,
          }));
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
      const expectedCollegeYear = startYear + 1 + rem;
      const collegeLabel = `${formData.course_degree}${formData.branch_specialization ? ` (${formData.branch_specialization})` : ''} — ${formData.current_year_sem}`;
      setFormData((prev) => ({
        ...prev,
        passout_year: expectedCollegeYear,
        passout_college_year: String(expectedCollegeYear),
        currently_studying: collegeLabel,
      }));
    }
  }, [formData.education_type, formData.class_or_standard, formData.course_degree, formData.branch_specialization, formData.current_year_sem, formData.academic_year]);

  // Duplicate check on moving to Review
  const runDuplicateCheck = async () => {
    if (!formData.full_name) return;
    try {
      const res = await api.post('/api/students/check-duplicate', {
        full_name: formData.full_name,
        contact_number: formData.contact_number,
        school_id: formData.school_id ? Number(formData.school_id) : null,
        college_id: (formData.college_id && formData.college_id !== 'none') ? Number(formData.college_id) : null,
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
        setError('Please enter a valid Personal Contact Number.');
        return;
      }
    }
    if (step === 3) {
      if (formData.education_type === 'School') {
        if (!formData.school_id) {
          setError('Please select a School.');
          return;
        }
      } else if (formData.education_type === 'College / University') {
        if (!formData.college_id || formData.college_id === 'none') {
          setError('Please select a College / University.');
          return;
        }
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
      const isPassedOut = formData.current_status === 'Passed Out';
      const mVal = formData.masjid.trim() || formData.near_masjid.trim() || null;
      const jVal = formData.time_spent_in_jamaat?.trim() || null;

      const isSchool = formData.education_type === 'School';

      const whoseNameRel = formData.whose_name_relation || 'Father';
      const whoseNameVal = formData.whose_name.trim() || null;
      
      const whoseNumRel = formData.whose_number_relation || 'Father';
      const whoseNumVal = formData.second_number.trim() || null;

      let fName = null;
      let mName = null;
      let gName = null;
      if (whoseNameVal) {
        if (whoseNameRel === 'Father') fName = whoseNameVal;
        else if (whoseNameRel === 'Mother') mName = whoseNameVal;
        else if (whoseNameRel === 'Guardian') gName = whoseNameVal;
      }

      let fContact = null;
      let mContact = null;
      let gContact = null;
      if (whoseNumVal) {
        if (whoseNumRel === 'Father') fContact = whoseNumVal;
        else if (whoseNumRel === 'Mother') mContact = whoseNumVal;
        else if (whoseNumRel === 'Guardian') gContact = whoseNumVal;
      }

      const payload: any = {
        full_name: formData.full_name.trim(),
        parent_guardian_relation: whoseNameVal ? whoseNameRel : 'Father',
        parent_guardian_name: whoseNameVal,
        father_name: fName,
        father_contact: fContact,
        mother_name: mName,
        mother_contact: mContact,
        guardian_name: gName,
        guardian_contact: gContact,
        contact_number: formData.contact_number.trim(),
        second_number: whoseNumVal,
        second_number_relation: whoseNumVal ? (whoseNumRel === 'Self' ? 'Self / Personal' : whoseNumRel) : 'Father',
        
        education_type: formData.education_type,
        school_id: formData.school_id ? Number(formData.school_id) : null,
        college_id: (!isSchool && formData.college_id && formData.college_id !== 'none') ? Number(formData.college_id) : null,
        
        class_or_standard: isSchool ? (formData.class_or_standard || null) : null,
        course_degree: !isSchool ? (formData.course_degree || null) : null,
        branch_specialization: !isSchool ? (formData.branch_specialization.trim() || null) : null,
        current_year_sem: !isSchool ? (isPassedOut ? 'Passed Out' : (formData.current_year_sem || null)) : null,
        
        academic_year: formData.academic_year || null,
        passout_year: isSchool
          ? (formData.passout_school_year ? Number(formData.passout_school_year) : (formData.passout_year ? Number(formData.passout_year) : null))
          : (formData.passout_college_year ? Number(formData.passout_college_year) : (formData.passout_year ? Number(formData.passout_year) : null)),
        passout_school_year: formData.passout_school_year ? Number(formData.passout_school_year) : null,
        passout_college_year: !isSchool && formData.passout_college_year ? Number(formData.passout_college_year) : null,
        education_history: formData.education_history.trim() || null,
        
        area_id: formData.area_id ? Number(formData.area_id) : null,
        address: formData.address.trim() || null,
        masjid: mVal,
        near_masjid: mVal,
        time_spent_in_jamaat: jVal,
        time_in_jamaat: jVal,
        last_mulakhat_date: formData.last_mulakhat_date ? formData.last_mulakhat_date : null,
        current_status: formData.current_status,
        profession: isPassedOut ? (formData.profession.trim() || null) : null,
      };

      await api.post('/api/students', payload);
      router.push('/students');
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to save student record. Please verify fields.'));
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
      alert(formatApiError(err, 'Failed to create school'));
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
      alert(formatApiError(err, 'Failed to create college'));
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
      alert(formatApiError(err, 'Failed to create area'));
    }
  };

  // Quick Add Profession
  const handleCreateProfession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfessionName.trim()) return;
    try {
      const res = await api.post('/api/master-data/professions', {
        profession_name: newProfessionName.trim(),
        is_active: true,
      });
      const exists = professions.find((p) => p.profession_name.toLowerCase() === res.data.profession_name.toLowerCase());
      if (!exists) {
        setProfessions((prev) => [...prev, res.data]);
      }
      setFormData((prev) => ({ ...prev, profession: res.data.profession_name }));
      setNewProfessionName('');
      setShowAddProfessionModal(false);
    } catch (err: any) {
      alert(formatApiError(err, 'Failed to add profession'));
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/students"
              className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Add Student
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Step-by-step registration with separate contact numbers &amp; education history
              </p>
            </div>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 px-1">
            <span className={step >= 1 ? 'text-sky-600 font-bold' : ''}>1. Basic &amp; Contacts</span>
            <span className={step >= 2 ? 'text-sky-600 font-bold' : ''}>2. Education Type</span>
            <span className={step >= 3 ? 'text-sky-600 font-bold' : ''}>
              3. {formData.education_type === 'School' ? 'School Info' : 'Education Info'}
            </span>
            <span className={step >= 4 ? 'text-sky-600 font-bold' : ''}>4. Location &amp; Jamaat</span>
            <span className={step >= 5 ? 'text-sky-600 font-bold' : ''}>5. Review</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-sky-600 h-2 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Container */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* STEP 1: Basic Information & Contact */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Step 1: Student Information &amp; Contact
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmed Khan"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Personal Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Personal Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              {/* Whose Name? & Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Whose Name?
                  </label>
                  <select
                    value={formData.whose_name_relation}
                    onChange={(e) => setFormData({ ...formData, whose_name_relation: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={formData.whose_name}
                    onChange={(e) => setFormData({ ...formData, whose_name: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Whose Number? & Number Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Whose Number?
                  </label>
                  <select
                    value={formData.whose_number_relation}
                    onChange={(e) => setFormData({ ...formData, whose_number_relation: e.target.value, second_number_relation: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Self">Self</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Phone number (optional)"
                    value={formData.second_number}
                    onChange={(e) => setFormData({ ...formData, second_number: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Study Type Selection */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Step 2: Primary Education Type
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      education_type: 'School',
                      college_id: '',
                      course_degree: '',
                      branch_specialization: '',
                      current_year_sem: '',
                      passout_college_year: '',
                    }));
                  }}
                  className={`p-6 rounded-2xl border text-left flex flex-col items-start gap-3 transition-all ${
                    formData.education_type === 'School'
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/20 ring-2 ring-amber-500/20 text-amber-950 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-300">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">School Student</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Primary, Middle, or High School (Class 1st to 10th standard).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      education_type: 'College / University',
                      course_degree: prev.course_degree || 'BE',
                      current_year_sem: prev.current_year_sem || '1st Year',
                    }));
                  }}
                  className={`p-6 rounded-2xl border text-left flex flex-col items-start gap-3 transition-all ${
                    formData.education_type === 'College / University'
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-700 dark:text-indigo-300">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">College / University Student</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      PUC, Undergraduate, Diploma, Engineering, Medical, or Postgraduate.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 CASE A: SCHOOL STUDENT (Current School Only) */}
          {step === 3 && formData.education_type === 'School' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Step 3: School Information
              </h2>

              {/* Current School Section */}
              <div className="p-4 bg-amber-50/40 dark:bg-amber-950/10 rounded-2xl border border-amber-200/70 dark:border-amber-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <GraduationCap className="w-4 h-4 text-amber-600" />
                    <span>Current School</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddSchoolModal(true)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add New School</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      School Name *
                    </label>
                    <select
                      value={formData.school_id}
                      onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Select School --</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.school_name} {s.locality ? `(${s.locality})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      School Class *
                    </label>
                    <select
                      value={formData.class_or_standard}
                      onChange={(e) => setFormData({ ...formData, class_or_standard: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', 'Other'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Current Studying & Passout Milestones (School) */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-sky-800 dark:text-sky-300 block uppercase tracking-wide">
                  Academic &amp; Passout Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Academic Year
                    </label>
                    <select
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      {academicYears.map((ay) => (
                        <option key={ay.id} value={ay.year_label}>
                          {ay.year_label} {ay.is_current ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Currently Studying (Display Label)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10th Standard"
                      value={formData.currently_studying}
                      onChange={(e) => setFormData({ ...formData, currently_studying: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Passout Year / 10th Milestone
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2026"
                      value={formData.passout_school_year}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          passout_school_year: val,
                          passout_year: Number(val) || prev.passout_year,
                        }));
                      }}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Education History / Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2026 (10th Standard)"
                      value={formData.education_history}
                      onChange={(e) => setFormData({ ...formData, education_history: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 CASE B: COLLEGE / UNIVERSITY STUDENT (Previous School + Current College) */}
          {step === 3 && formData.education_type === 'College / University' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Step 3: Education Information
              </h2>

              {/* 1. PREVIOUS SCHOOL INFORMATION */}
              <div className="p-4 bg-amber-50/40 dark:bg-amber-950/10 rounded-2xl border border-amber-200/70 dark:border-amber-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <GraduationCap className="w-4 h-4 text-amber-600" />
                      <span>Previous School Information</span>
                    </h3>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                      Which school did this student study in before joining college?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddSchoolModal(true)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add New School</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      School Previously Attended
                    </label>
                    <select
                      value={formData.school_id}
                      onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- None / Not Applicable --</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.school_name} {s.locality ? `(${s.locality})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      School Passout Year (Optional)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2025"
                      value={formData.passout_school_year}
                      onChange={(e) => setFormData({ ...formData, passout_school_year: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. CURRENT COLLEGE / UNIVERSITY INFORMATION */}
              <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Current College / University Information</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddCollegeModal(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add New College</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      College / University *
                    </label>
                    <select
                      value={formData.college_id}
                      onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Select College / University --</option>
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.college_name} {c.locality ? `(${c.locality})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Course / Degree
                    </label>
                    <select
                      value={formData.course_degree}
                      onChange={(e) => setFormData({ ...formData, course_degree: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {['BE', 'BTech', 'BCA', 'BSc', 'BCom', 'BA', 'PUC', 'Diploma', 'MBA', 'MCA', 'Other'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Branch / Specialization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science, Commerce"
                      value={formData.branch_specialization}
                      onChange={(e) => setFormData({ ...formData, branch_specialization: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Current Year / Semester
                    </label>
                    <select
                      value={formData.current_year_sem}
                      onChange={(e) => setFormData({ ...formData, current_year_sem: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      {['1st Year', '2nd Year', '3rd Year', '4th Year', '1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Academic Year
                    </label>
                    <select
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      {academicYears.map((ay) => (
                        <option key={ay.id} value={ay.year_label}>
                          {ay.year_label} {ay.is_current ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Currently Studying (Display Label)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3rd Year — B.E. CSE"
                      value={formData.currently_studying}
                      onChange={(e) => setFormData({ ...formData, currently_studying: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expected College Passout Year
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2028"
                      value={formData.passout_college_year}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          passout_college_year: val,
                          passout_year: Number(val) || prev.passout_year,
                        }));
                      }}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Education History / Milestones
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2025 (10th) • 2028 (College)"
                      value={formData.education_history}
                      onChange={(e) => setFormData({ ...formData, education_history: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Location, Masjid & Status */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Step 4: Location, Masjid &amp; Status
              </h2>

              {/* Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Area</label>
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
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Main Market, Anekal"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Voluntary Masjid (Task 6) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Masjid (Voluntary / Optional)
                </label>
                <input
                  type="text"
                  placeholder="Voluntarily provided (leave blank for 'Not Provided')"
                  value={formData.masjid}
                  onChange={(e) => setFormData({ ...formData, masjid: e.target.value, near_masjid: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Only entered when voluntarily provided. Never inferred or required.
                </span>
              </div>

              {/* Time Spent in Jamaat (Voluntary / Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Time Spent in Jamaat (Voluntary / Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 years, 6 months, since childhood"
                  value={formData.time_spent_in_jamaat}
                  onChange={(e) => setFormData({ ...formData, time_spent_in_jamaat: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800 dark:text-slate-200"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Voluntarily provided information. Protected by existing authorization.
                </span>
              </div>

              {/* Last Mulakhat Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Last Mulakhat Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.last_mulakhat_date}
                  onChange={(e) => setFormData({ ...formData, last_mulakhat_date: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-800 dark:text-slate-200"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Optional date of last mulakhat. Leave blank if not available (will show as &apos;Not Provided&apos;).
                </span>
              </div>

              {/* Status */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.current_status}
                  onChange={(e) => setFormData({ ...formData, current_status: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Currently Studying">Currently Studying</option>
                  <option value="Passed Out">Passed Out</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Current Profession (Shown ONLY if Passed Out) */}
              {formData.current_status === 'Passed Out' && (
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Passed Out / Alumni Details</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddProfessionModal(true)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add New Profession</span>
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                      Current Profession / Occupation
                    </label>
                    <select
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      className="w-full text-xs p-3 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                    >
                      <option value="">-- Select Profession --</option>
                      {professions.map((p) => (
                        <option key={p.id} value={p.profession_name}>
                          {p.profession_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Review & Save */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Step 5: Review &amp; Confirm
              </h2>

              {duplicateWarning && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
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
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Student Name</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-sm">{formData.full_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Personal Contact</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{formData.contact_number}</span>
                  </div>
                </div>

                {(formData.whose_name || formData.second_number) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                    {formData.whose_name && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Name ({formData.whose_name_relation})</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{formData.whose_name}</span>
                      </div>
                    )}
                    {formData.second_number && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Number ({formData.whose_number_relation})</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{formData.second_number}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Conditional Education Review */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Education Type:</span>
                    <Badge variant={formData.education_type === 'School' ? 'warning' : 'purple'}>
                      {formData.education_type}
                    </Badge>
                  </div>
                  {formData.education_type === 'School' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current School</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">
                          {schools.find((s) => String(s.id) === String(formData.school_id))?.school_name || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">School Class</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">
                          {formData.class_or_standard}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Previous School</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">
                          {schools.find((s) => String(s.id) === String(formData.school_id))?.school_name || 'None'}
                          {formData.passout_school_year ? ` (Passout: ${formData.passout_school_year})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current College / University</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">
                          {colleges.find((c) => String(c.id) === String(formData.college_id))?.college_name || 'Not selected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Course &amp; Year</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">
                          {formData.course_degree}{formData.branch_specialization ? ` (${formData.branch_specialization})` : ''} — {formData.current_year_sem}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Currently Studying</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {formData.currently_studying || (formData.education_type === 'School' ? `${formData.class_or_standard} Standard` : `${formData.course_degree} - ${formData.current_year_sem}`)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Education Milestones</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">
                      {formData.education_history || [
                        formData.passout_school_year ? `${formData.passout_school_year} (10th)` : null,
                        formData.passout_college_year ? `${formData.passout_college_year} (College)` : null
                      ].filter(Boolean).join(' • ') || `${formData.passout_year || '—'}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Area</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {areas.find((a) => String(a.id) === String(formData.area_id))?.area_name || 'Anekal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Masjid (Voluntary)</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {formData.masjid || formData.near_masjid || 'Not Provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Time Spent in Jamaat</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {formData.time_spent_in_jamaat || 'Not Provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Last Mulakhat Date</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {formData.last_mulakhat_date || 'Not Provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
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
                className="px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-7 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
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
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Locality / Area"
                  value={newSchoolLocality}
                  onChange={(e) => setNewSchoolLocality(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSchoolModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
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
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Locality / Area"
                  value={newCollegeLocality}
                  onChange={(e) => setNewCollegeLocality(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCollegeModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
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
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Optional: nearby landmark, famous place, or other location detail."
                  value={newAreaDesc}
                  onChange={(e) => setNewAreaDesc(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAreaModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
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

        {/* Quick Add Profession Modal */}
        {showAddProfessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                Add New Profession
              </h3>
              <form onSubmit={handleCreateProfession} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="e.g. Graphic Designer, Electrician, Pharmacist"
                  value={newProfessionName}
                  onChange={(e) => setNewProfessionName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProfessionModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                  >
                    Save Profession
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
