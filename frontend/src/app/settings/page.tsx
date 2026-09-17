'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import {
  User,
  Lock,
  Sun,
  Moon,
  Calendar,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user, canAdmin } = useAuth();
  
  // Profile & Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Appearance state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Academic Year State
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [academicMsg, setAcademicMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        const res = await api.get('/api/master-data/academic-years');
        setAcademicYears(res.data);
        const curr = res.data.find((y: any) => y.is_current);
        if (curr) {
          setSelectedYearId(String(curr.id));
        }
      } catch (e) {
        console.error('Failed to load settings data', e);
      }
    };
    fetchSettingsData();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setChangingPassword(true);
    try {
      // API call to update user password
      await api.put(`/api/users/${user?.id || 1}`, {
        password: newPassword,
      });
      setPasswordMsg({ text: 'Password updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ text: err.response?.data?.detail || 'Failed to update password.', type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSetCurrentAcademicYear = async () => {
    if (!selectedYearId) return;
    setAcademicMsg(null);
    try {
      const res = await api.put(`/api/master-data/academic-years/${selectedYearId}/set-current`);
      setAcademicMsg(res.data.message || 'Current academic year updated.');
      const resUpdated = await api.get('/api/master-data/academic-years');
      setAcademicYears(resUpdated.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update academic year.');
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your profile, security, and application preferences.
            </p>
          </div>
        </div>

        {/* 1. MY PROFILE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              My Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Name</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{user?.full_name || 'Admin User'}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Username</span>
              <span className="font-mono font-semibold text-slate-800 text-sm mt-0.5 block">{user?.username || 'admin'}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Role</span>
              <div className="mt-1">
                <Badge variant={user?.role === 'Admin' ? 'danger' : user?.role === 'Data Manager' ? 'warning' : 'info'}>
                  {user?.role || 'Admin'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SECURITY */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Security
            </h2>
          </div>

          {passwordMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              {changingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* 3. APPEARANCE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sun className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Appearance
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                theme === 'light'
                  ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-400/20 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700 text-white ring-2 ring-slate-700/20 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Moon className="w-4 h-4 text-slate-400" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* 4. SYSTEM (Current Academic Year) */}
        {canAdmin && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                System Configuration
              </h2>
            </div>

            {academicMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{academicMsg}</span>
              </div>
            )}

            <div className="max-w-md space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Active Directory Academic Year
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedYearId}
                    onChange={(e) => setSelectedYearId(e.target.value)}
                    className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.year_label} {ay.is_current ? '(Currently Active)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSetCurrentAcademicYear}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
                  >
                    Set as Current
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. DATA (Import / Export Quick Links) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Download className="w-5 h-5 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Data Management
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/import"
              className="p-4 bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 rounded-2xl transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 bg-white rounded-xl shadow-sm text-sky-600 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-800 group-hover:text-sky-700">Import Data</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Upload students from Excel/CSV</p>
              </div>
            </Link>

            <Link
              href="/export"
              className="p-4 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 bg-white rounded-xl shadow-sm text-emerald-600 group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-800 group-hover:text-emerald-700">Export Data</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Download full student records</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
