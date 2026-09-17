'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { LogOut } from 'lucide-react';
import { Badge } from '../ui/Badge';
import Link from 'next/link';

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();

  const getRoleVariant = (role?: string) => {
    switch (role) {
      case 'Admin': return 'purple';
      case 'Data Manager': return 'info';
      case 'Viewer': return 'warning';
      default: return 'default';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle Menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            A
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
              Anekal Student Directory
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Community Directory &amp; Educational Portal
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800 leading-tight">
                {user.full_name}
              </div>
              <div className="mt-0.5">
                <Badge variant={getRoleVariant(user.role)}>
                  {user.role}
                </Badge>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
