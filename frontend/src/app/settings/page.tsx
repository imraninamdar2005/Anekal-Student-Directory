'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import { formatApiError } from '@/lib/error-utils';
import {
  User,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  
  // Username state
  const [username, setUsername] = useState(user?.username || '');
  const [usernameMsg, setUsernameMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user?.username]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameMsg(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setUsernameMsg({ text: 'Username cannot be empty.', type: 'error' });
      return;
    }

    if (cleanUsername === user?.username) {
      setUsernameMsg({ text: 'No changes made to username.', type: 'success' });
      return;
    }

    setSavingUsername(true);
    try {
      const res = await api.put('/api/users/me', {
        username: cleanUsername,
      });
      const updatedUser = res.data;
      updateUser({ username: updatedUser.username });
      setUsername(updatedUser.username);
      setUsernameMsg({ text: 'Username updated successfully!', type: 'success' });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' 
        ? detail 
        : formatApiError(err, 'Failed to update username.');
      setUsernameMsg({ text: errorMsg, type: 'error' });
    } finally {
      setSavingUsername(false);
    }
  };

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
      await api.put('/api/users/me', {
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
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your profile and account security settings.
            </p>
          </div>
        </div>

        {/* 1. MY PROFILE */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              My Profile
            </h2>
          </div>

          {usernameMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                usernameMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
              }`}
            >
              {usernameMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              )}
              <span>{usernameMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Editable Username */}
            <form onSubmit={handleUpdateUsername} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div>
                <label htmlFor="settings-username" className="text-slate-500 dark:text-slate-400 block text-[11px] uppercase font-semibold mb-1">
                  Username
                </label>
                <input
                  id="settings-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full text-sm font-mono font-semibold p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={savingUsername}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingUsername ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </form>

            {/* Read-Only Role */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] uppercase font-semibold mb-1.5">
                  Role
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={user?.role === 'Admin' ? 'purple' : user?.role === 'Data Manager' ? 'info' : 'warning'}>
                    {user?.role || 'Admin'}
                  </Badge>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    (Read-only)
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">
                Role permissions are managed in the Users section by System Administrators.
              </p>
            </div>
          </div>
        </div>

        {/* 2. SECURITY / CHANGE PASSWORD */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Security / Change Password
            </h2>
          </div>

          {passwordMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
            <div>
              <label htmlFor="settings-new-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                id="settings-new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="settings-confirm-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                id="settings-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {changingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
