'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import { MapPin, PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';

export default function AreasPage() {
  const { canEdit, canAdmin } = useAuth();
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAreas = async () => {
    try {
      const res = await api.get('/api/master-data/areas');
      setAreas(res.data);
    } catch (e) {
      console.error('Failed fetching areas', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api.post('/api/master-data/areas', {
        area_name: name.trim(),
        description: description.trim() || null,
        is_active: true,
      });
      setName('');
      setDescription('');
      fetchAreas();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add area');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this area?')) return;
    try {
      await api.delete(`/api/master-data/areas/${id}`);
      fetchAreas();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete area');
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Areas
              </h1>
              <Badge variant="success">{areas.length} Areas</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Geographic regions, layouts, and neighborhoods in Anekal.
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Add New Area
            </h2>
            {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Area Name (e.g. Jigani, Chandapura)"
                className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (Optional)"
                className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{creating ? 'Saving...' : 'Add Area'}</span>
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl p-4 border border-slate-200 animate-pulse"></div>
            ))
          ) : areas.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-400 text-xs">No areas added yet.</div>
          ) : (
            areas.map((area) => (
              <div
                key={area.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-800">{area.area_name}</h3>
                    {area.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">{area.description}</p>
                    )}
                  </div>
                </div>

                {canAdmin && (
                  <button
                    onClick={() => handleDelete(area.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Delete area"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
