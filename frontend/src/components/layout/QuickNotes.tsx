'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import {
  StickyNote,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface NoteItem {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function QuickNotes() {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Adding state
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Deleting confirmation state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const addInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch notes when opened
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/notes');
      setNotes(res.data || []);
      setHasFetched(true);
    } catch (err) {
      console.error('Failed to fetch quick notes', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      fetchNotes();
    } else {
      setIsOpen(false);
      setIsAdding(false);
      setEditingId(null);
      setDeletingId(null);
    }
  };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsAdding(false);
        setEditingId(null);
        setDeletingId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setIsAdding(false);
        setEditingId(null);
        setDeletingId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus textarea when add is clicked
  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAdding]);

  // Save new note
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = newContent.trim();
    if (!cleanContent) {
      setAddError('Please enter note text.');
      return;
    }
    if (cleanContent.length > 1500) {
      setAddError('Note is too long (max 1500 characters).');
      return;
    }

    setSavingAdd(true);
    setAddError(null);
    try {
      const res = await api.post('/api/notes', { content: cleanContent });
      setNotes((prev) => [res.data, ...prev]);
      setNewContent('');
      setIsAdding(false);
    } catch (err: any) {
      setAddError(err.response?.data?.detail || 'Failed to save note.');
    } finally {
      setSavingAdd(false);
    }
  };

  // Start edit
  const handleStartEdit = (note: NoteItem) => {
    setEditingId(note.id);
    setEditContent(note.content);
    setEditError(null);
    setDeletingId(null);
  };

  // Save edit
  const handleSaveEdit = async (id: number) => {
    const cleanContent = editContent.trim();
    if (!cleanContent) {
      setEditError('Note cannot be empty.');
      return;
    }
    if (cleanContent.length > 1500) {
      setEditError('Note is too long (max 1500 characters).');
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      const res = await api.put(`/api/notes/${id}`, { content: cleanContent });
      setNotes((prev) => prev.map((n) => (n.id === id ? res.data : n)));
      setEditingId(null);
      setEditContent('');
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Failed to update note.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete note
  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await api.delete(`/api/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setDeletingId(null);
    } catch (err) {
      console.error('Failed to delete note', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="relative">
      {/* Quick Notes Trigger Button */}
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        title="Quick Notes"
        aria-label="Quick Notes"
        className={`px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/70 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold relative ${
          isOpen ? 'bg-sky-50/90 dark:bg-slate-800 text-sky-600 dark:text-sky-400 ring-2 ring-sky-500/20' : ''
        }`}
      >
        <span className="text-sm leading-none" aria-hidden="true">📝</span>
        <span className="hidden sm:inline font-semibold">Quick Notes</span>
        {notes.length > 0 && (
          <span className="w-2 h-2 bg-sky-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      {/* Popover / Panel */}
      {isOpen && (
        <>
          {/* Mobile backdrop for clean outside tap */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={panelRef}
            className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 md:w-96 max-h-[80vh] sm:max-h-[500px] z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="p-3.5 px-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-600/10 dark:bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <StickyNote className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Quick Notes
                  </h3>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">
                    {notes.length} {notes.length === 1 ? 'note' : 'notes'} saved
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!isAdding && (
                  <button
                    onClick={() => {
                      setIsAdding(true);
                      setNewContent('');
                      setAddError(null);
                      setEditingId(null);
                      setDeletingId(null);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800/60 rounded-lg transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close notes"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {/* Add Note Card Form */}
              {isAdding && (
                <form
                  onSubmit={handleSaveAdd}
                  className="p-3 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/60 rounded-xl space-y-2.5 animate-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-900 dark:text-sky-200 uppercase tracking-wider">
                      Add Quick Note
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {newContent.length}/1500
                    </span>
                  </div>

                  <textarea
                    ref={addInputRef}
                    required
                    rows={3}
                    maxLength={1500}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Type your note here... (e.g. Call school coordinator tomorrow)"
                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-400 resize-none"
                  />

                  {addError && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">{addError}</p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setNewContent('');
                        setAddError(null);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingAdd || !newContent.trim()}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
                    >
                      {savingAdd ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Save</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Loading State */}
              {loading && !hasFetched && (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-600 dark:text-sky-400" />
                  <span className="text-xs">Loading notes...</span>
                </div>
              )}

              {/* Notes List */}
              {!loading && notes.length === 0 && !isAdding && (
                <div className="py-8 text-center px-4 space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <StickyNote className="w-5 h-5 opacity-60" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No quick notes yet
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Save quick thoughts, tasks, or reminders for yourself.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 rounded-lg transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create a Note</span>
                  </button>
                </div>
              )}

              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl space-y-2 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-600"
                >
                  {/* If Editing this note */}
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        required
                        rows={3}
                        maxLength={1500}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                      />
                      {editError && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400">{editError}</p>
                      )}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditContent('');
                            setEditError(null);
                          }}
                          className="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={savingEdit || !editContent.trim()}
                          onClick={() => handleSaveEdit(note.id)}
                          className="px-2.5 py-0.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm transition-all disabled:opacity-50"
                        >
                          {savingEdit ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : deletingId === note.id ? (
                    /* If Deleting confirmation */
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-semibold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                        <span>Delete this note?</span>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => handleDelete(note.id)}
                          className="px-2.5 py-0.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-sm"
                        >
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Standard Note Display */
                    <>
                      <p className="text-slate-800 dark:text-slate-200 font-normal leading-relaxed whitespace-pre-wrap break-words">
                        {note.content}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(note.updated_at || note.created_at)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(note)}
                            title="Edit Note"
                            className="p-1 hover:text-sky-600 dark:hover:text-sky-400 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(note.id)}
                            title="Delete Note"
                            className="p-1 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Add Bar if notes exist and not currently adding */}
            {!isAdding && notes.length > 0 && (
              <div className="p-2.5 px-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(true);
                    setNewContent('');
                    setAddError(null);
                  }}
                  className="w-full py-1.5 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800/80 rounded-xl transition-all border border-dashed border-sky-300/80 dark:border-sky-800/80"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Note</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
