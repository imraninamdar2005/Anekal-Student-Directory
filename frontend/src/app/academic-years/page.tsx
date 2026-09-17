'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import { Calendar, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';

export default function AcademicYearsPage() {
  const { canEdit } = useAuth();
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchYears = async () => {
    try {
      const res = await api.get('/api/master-data/academic-years');
      setAcademicYears(res.data);
    } catch (e) {
      console.error('Failed fetching academic years', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api.post('/api/master-data/academic-years', {
        year_label: newLabel.trim(),
        is_active: true,
      });
      setNewLabel('');
      fetchYears();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add academic year');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Academic Years
              </h1>
              <Badge variant="purple">{academicYears.length} Sessions</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage academic sessions and cohort tracking labels.
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Add New Academic Year
            </h2>
            {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. 2027-2028"
                className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{creating ? 'Adding...' : 'Add Session'}</span>
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading sessions...</div>
            ) : academicYears.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No academic years configured.</div>
            ) : (
              academicYears.map((ay) => (
                <div key={ay.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">{ay.year_label}</div>
                      <div className="text-[11px] text-slate-400">
                        Added: {new Date(ay.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={ay.is_active ? 'success' : 'default'}>
                    {ay.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
