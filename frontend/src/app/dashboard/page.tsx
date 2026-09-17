'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import {
  Users,
  GraduationCap,
  Building2,
  Clock,
  ArrowUpRight,
  Search,
  PlusCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { user, canEdit } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [resOverview, resCharts] = await Promise.all([
          api.get('/api/dashboard/overview'),
          api.get('/api/dashboard/charts'),
        ]);
        setOverview(resOverview.data);
        setCharts(resCharts.data);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-72 bg-slate-200 rounded-2xl"></div>
            <div className="h-72 bg-slate-200 rounded-2xl"></div>
            <div className="h-72 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  const kpis = [
    { label: 'Total Students', value: overview?.total_students || 0, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
    { label: 'Total Schools', value: overview?.total_schools || 0, icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Total Colleges / Universities', value: overview?.total_colleges || 0, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome & Action header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Student Directory Dashboard
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Welcome, <strong className="text-slate-700">{user?.full_name}</strong>. Summary of student records across Anekal Taluk institutions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/students"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Students</span>
            </Link>
            {canEdit && (
              <Link
                href="/students/add"
                className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3 Clean KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Students Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Students</span>
              <div className="p-2 rounded-xl border bg-sky-50 border-sky-200">
                <Users className="w-4 h-4 text-sky-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold text-slate-800">
                {overview?.total_students || 0}
              </div>
              <div className="text-[11.5px] text-slate-500 mt-0.5">
                Across all registered institutions
              </div>
            </div>
          </div>

          {/* Total Schools Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Schools</span>
              <div className="p-2 rounded-xl border bg-amber-50 border-amber-200">
                <GraduationCap className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold text-slate-800">
                {overview?.total_schools || 0}
              </div>
              <div className="text-[11.5px] text-amber-700 font-medium mt-0.5">
                Students: <span className="font-bold">{overview?.school_students || 0}</span>
              </div>
            </div>
          </div>

          {/* Total Colleges / Universities Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Colleges / Universities</span>
              <div className="p-2 rounded-xl border bg-indigo-50 border-indigo-200">
                <Building2 className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold text-slate-800">
                {overview?.total_colleges || 0}
              </div>
              <div className="text-[11.5px] text-indigo-700 font-medium mt-0.5">
                Students: <span className="font-bold">{overview?.college_students || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Clean Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Students by School */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Students by School</h3>
              <p className="text-xs text-slate-500">Distribution across schools</p>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.by_school || []} layout="vertical" margin={{ top: 5, right: 15, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} width={110} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="value" fill="#d97706" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Students by College / University */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Students by College / University</h3>
              <p className="text-xs text-slate-500">Higher education enrollments</p>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.by_college || []} layout="vertical" margin={{ top: 5, right: 15, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} width={110} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="value" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Students by Passout Year */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Students by Passout Year</h3>
              <p className="text-xs text-slate-500">Graduation and alumni trends</p>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.by_passout_year || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recently Added & Recently Updated Records */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently Added */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-800 text-sm">Recently Added Students</h3>
              </div>
              <Link href="/students" className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {overview?.recently_added?.length > 0 ? (
                overview.recently_added.map((student: any) => (
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {student.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {student.school_name || student.college_name || 'Individual'} &bull; {student.class_or_standard || student.course_degree || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={student.current_status === 'Passed Out' ? 'success' : 'info'}>
                        {student.current_status}
                      </Badge>
                      <span className="block text-[10px] text-slate-400 mt-1">{student.student_id}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No students recorded yet.</p>
              )}
            </div>
          </div>

          {/* Recently Updated */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Recently Updated Records</h3>
              </div>
              <Link href="/students" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {overview?.recently_modified?.length > 0 ? (
                overview.recently_modified.map((student: any) => (
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {student.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Area: {student.area_name || 'Anekal'} &bull; Passout: {student.passout_year || '—'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-600 font-medium">{student.student_id}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Updated by {student.updated_by || 'Admin'}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No records modified recently.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
