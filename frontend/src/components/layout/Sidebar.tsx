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
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-sky-600/30">
              A
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-sm block">
                ANEKAL DIRECTORY
              </span>
              <span className="block text-[10.5px] text-sky-400 font-medium">
                Student Directory System
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
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
