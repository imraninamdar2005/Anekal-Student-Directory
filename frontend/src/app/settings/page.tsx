'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import { formatApiError } from '@/lib/error-utils';
import {
  User,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();
  
  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

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
      await api.put(`/api/users/${user?.id || 1}`, {
        password: newPassword,
      });
      setPasswordMsg({ text: 'Password updated successfully!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ text: formatApiError(err, 'Failed to update password.'), type: 'error' });
    } finally {
      setChangingPassword(false);
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
              Manage your profile and account security settings.
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
                <Badge variant={user?.role === 'Admin' ? 'purple' : user?.role === 'Data Manager' ? 'info' : 'warning'}>
                  {user?.role || 'Admin'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SECURITY / CHANGE PASSWORD */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Security / Change Password
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
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
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
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {changingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
