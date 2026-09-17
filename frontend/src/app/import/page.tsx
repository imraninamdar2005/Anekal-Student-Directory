'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';

export default function ImportDataPage() {
  const { canEdit } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/api/data-transfer/import/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setPreview(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to parse and validate file.');
    } finally {
      setUploading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!preview) return;
    const rowsToImport = preview.preview_rows
      .filter((r: any) => r.status === 'valid' || r.status === 'duplicate')
      .map((r: any) => r.data);

    if (rowsToImport.length === 0) {
      setError('No valid rows available to import.');
      return;
    }

    setImporting(true);
    setError(null);
    try {
      const res = await api.post('/api/data-transfer/import/commit', {
        rows: rowsToImport,
      });
      setSuccessMessage(res.data.message);
      setPreview(null);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to commit import to database.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent =
      "Full Name,Primary Contact,Additional Contact,Additional Contact Relation,Education Type,School,College,Class,Course,Branch,Current Year Sem,Academic Year,Passout Year,Locality,Status,Profession,Notes\n" +
      "Arun Kumar,9845012345,9448012345,Parent,School,Anekal Central Public School,,10th,,,2025-26,2026,Anekal Town,Currently Studying,,10th standard student\n" +
      "Deepa Rao,9845054321,,Parent,College,,Anekal Engineering Institute,,BE/B.Tech,Computer Science,3rd Year,2025-26,2027,Chandapura,Currently Studying,,Computer Science engineering\n" +
      "Mohan Das,9876543210,9123456780,Alternative Contact,College,,Alliance Degree College Anekal,,B.Com,Finance,4th Year,2024-25,2024,Jigani,Graduated / Passed Out,Financial Analyst,Alumni member\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Anekal_Student_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Import Student Data
              </h1>
              <Badge variant="info">Excel / CSV</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Upload spreadsheets with pre-validation, duplicate detection, and diagnostic feedback.
            </p>
          </div>

          <button
            onClick={downloadSampleCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Status Banners */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Import Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900">Import Successful</p>
              <p className="mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Upload Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-8 text-center bg-slate-50/50 transition-colors">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              id="file-upload"
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Click to select Excel (.xlsx) or CSV (.csv) file'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports standard student directory columns (Full Name, Primary Contact, School/College, Years, Locality).
                </p>
              </div>
            </label>
          </div>

          {file && !preview && (
            <div className="flex justify-end">
              <button
                onClick={handlePreview}
                disabled={uploading}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl flex items-center gap-2 shadow-sm"
              >
                {uploading ? 'Analyzing File...' : 'Preview & Validate'}
              </button>
            </div>
          )}
        </div>

        {/* Preview Results Panel */}
        {preview && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500">Total Rows</span>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{preview.total_rows}</p>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-medium text-emerald-700">Valid Rows</span>
                <p className="text-xl font-bold text-emerald-800 mt-0.5">{preview.valid_count}</p>
              </div>
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[11px] font-medium text-amber-700">Possible Duplicates</span>
                <p className="text-xl font-bold text-amber-800 mt-0.5">{preview.duplicate_count}</p>
              </div>
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[11px] font-medium text-rose-700">Invalid / Errors</span>
                <p className="text-xl font-bold text-rose-800 mt-0.5">{preview.invalid_count}</p>
              </div>
            </div>

            {/* Validation Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Institution</th>
                    <th className="py-2.5 px-3">Academic Year</th>
                    <th className="py-2.5 px-3">Locality</th>
                    <th className="py-2.5 px-3">Diagnostic Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.preview_rows.map((r: any) => (
                    <tr
                      key={r.row_number}
                      className={
                        r.status === 'invalid'
                          ? 'bg-rose-50/50'
                          : r.status === 'duplicate'
                          ? 'bg-amber-50/40'
                          : 'hover:bg-slate-50'
                      }
                    >
                      <td className="py-2 px-3 font-mono font-medium text-slate-600">#{r.row_number}</td>
                      <td className="py-2 px-3">
                        <Badge
                          variant={
                            r.status === 'valid' ? 'success' : r.status === 'duplicate' ? 'warning' : 'danger'
                          }
                        >
                          {r.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {r.data.full_name || `${r.data.first_name || ''} ${r.data.last_name || ''}`.trim()}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{r.data.school_name || r.data.college_name || '—'}</td>
                      <td className="py-2 px-3 text-slate-600">{r.data.academic_year || '—'}</td>
                      <td className="py-2 px-3 text-slate-600">{r.data.area_name || '—'}</td>
                      <td className="py-2 px-3 text-[11px]">
                        {r.errors?.length > 0 && (
                          <span className="text-rose-700 font-medium">{r.errors.join('; ')}</span>
                        )}
                        {r.duplicate_info && (
                          <span className="text-amber-700 font-medium">{r.duplicate_info}</span>
                        )}
                        {r.status === 'valid' && <span className="text-emerald-700">Validated cleanly</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Commit / Cancel Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Reset / Pick Another File
              </button>
              <button
                onClick={handleCommitImport}
                disabled={importing || preview.valid_count + preview.duplicate_count === 0}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                <span>
                  {importing
                    ? 'Importing...'
                    : `Confirm & Import (${preview.valid_count + preview.duplicate_count} Records)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
