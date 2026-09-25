'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  MapPin,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Settings,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { canEdit, canAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/students', icon: Users },
    { label: 'Schools', href: '/schools', icon: GraduationCap },
    { label: 'Colleges / Universities', href: '/colleges', icon: Building2 },
    { label: 'Areas', href: '/areas', icon: MapPin },
    { label: 'Import Data', href: '/import', icon: FileSpreadsheet, requireEdit: true },
    { label: 'Export Data', href: '/export', icon: Download },
    { label: 'Users', href: '/users', icon: ShieldCheck, requireAdmin: true },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const filteredNav = navItems.filter((item) => {
    if (item.requireAdmin && !canAdmin) return false;
    if (item.requireEdit && !canEdit) return false;
    return true;
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/90 flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-sky-600/30 flex-shrink-0 mt-0.5 hover:scale-105 transition-all"
              aria-label="Dashboard"
            >
              A
            </Link>
            <div className="flex-1 min-w-0">
              <Link href="/dashboard" className="block group">
                <span className="font-extrabold text-white tracking-tight text-[15px] block leading-snug group-hover:text-sky-300 transition-colors">
                  Anekal Student<br />Directory
                </span>
              </Link>
              
              <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                <span className="text-[10.5px] text-slate-400 font-semibold tracking-wider uppercase block">
                  Built by
                </span>
                <div className="inline-flex items-center gap-1.5 mt-0.5 relative group/name">
                  <span className="text-[13px] font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">
                    Imran Inamdar
                  </span>
                  <span className="text-[10px] text-amber-300 font-semibold">✦</span>
                </div>
                {/* Subtle India Tricolor Accent Line */}
                <div className="h-[2px] w-28 rounded-full bg-gradient-to-r from-amber-500 via-slate-200 to-emerald-500 mt-1 opacity-80" />

                {/* LinkedIn Link */}
                <div className="mt-1.5">
                  <a
                    href="https://www.linkedin.com/in/imran-inamdar-b49366352/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 hover:underline transition-colors group/link"
                  >
                    <span>View LinkedIn</span>
                    <span className="text-[10px] transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors mt-0.5"
            aria-label="Close Sidebar"
          >
            ✕
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <p className="text-[11px] font-semibold text-slate-300">Anekal Student Directory</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Directory &amp; Alumni Network</p>
        </div>
      </aside>
    </>
  );
}
