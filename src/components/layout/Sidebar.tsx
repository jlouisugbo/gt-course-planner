"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  CheckCircle,
  BookOpen,
  Briefcase,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Rocket
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { isDemoMode } from '@/lib/demo-mode';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'planner', label: 'Planner', icon: Calendar, href: '/planner' },
  { id: 'requirements', label: 'Requirements', icon: CheckCircle, href: '/requirements' },
  { id: 'courses', label: 'Courses', icon: BookOpen, href: '/courses' },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase, href: '/opportunities' },
  { id: 'advisors', label: 'Advisors', icon: Users, href: '/advisors' },
  { id: 'record', label: 'Record', icon: FileText, href: '/record' },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function Sidebar({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed: externalIsCollapsed,
  setIsCollapsed: externalSetIsCollapsed
}: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const [isDemo, setIsDemo] = React.useState(false);

  // Use external state if provided, otherwise use internal state
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  const setIsCollapsed = externalSetIsCollapsed || setInternalIsCollapsed;

  // Check if in demo mode
  React.useEffect(() => {
    setIsDemo(isDemoMode());
  }, []);

  const handleSignOut = async () => {
    const { supabase } = await import('@/lib/supabaseClient');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-gray-900 text-white flex flex-col z-50 transition-all duration-300 border-r border-gray-800",
          // Desktop: Always visible, collapsible width
          "hidden lg:flex",
          isCollapsed ? "lg:w-20" : "lg:w-[180px]",
          // Mobile: Slide in from left
          "lg:translate-x-0",
          isMobileOpen ? "flex translate-x-0 w-64" : "-translate-x-full"
        )}
      >
        {/* Header Section */}
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-gt-gold" />
              <span className="font-semibold text-base">GT Planner</span>
            </div>
          )}
          {isCollapsed && (
            <BookOpen className="h-6 w-6 text-gt-gold mx-auto" />
          )}

          {/* Collapse button - Desktop only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Close button - Mobile only */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Removed - User Profile moved to bottom */}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 relative group",
                    isActive
                      ? "bg-gt-gold/20 text-white border-l-4 border-gt-gold"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white border-l-4 border-transparent",
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section - Compact Profile with Demo & Sign Out */}
        <div className="border-t border-gray-800 p-3">
          {!isCollapsed ? (
            <>
              {/* Horizontal Profile Layout */}
              <div className="flex items-center justify-between gap-2 mb-2">
                {/* Left: Avatar + Name */}
                <Link href="/profile" className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
                  <div className="h-8 w-8 rounded-full bg-gt-gold flex items-center justify-center text-gray-900 font-semibold text-sm flex-shrink-0">
                    {user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div className="text-xs text-white truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                </Link>

                {/* Right: Demo Button/Indicator */}
                {isDemo ? (
                  <div className="px-2 py-1 bg-gt-gold text-gray-900 rounded text-xs font-medium whitespace-nowrap flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Demo
                  </div>
                ) : (
                  <Link
                    href="/demo-setup"
                    className="px-2 py-1 bg-gt-gold hover:bg-gt-gold-600 text-gray-900 rounded text-xs font-medium whitespace-nowrap transition-colors"
                  >
                    Demo
                  </Link>
                )}
              </div>

              {/* Sign Out Below */}
              <button
                onClick={handleSignOut}
                className="w-full px-2 py-1 text-xs text-gray-300 hover:bg-red-900/20 hover:text-red-400 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              {/* Collapsed: Icon-only layout */}
              <Link
                href="/profile"
                className="flex justify-center mb-2 hover:opacity-80 transition-opacity"
                title="Profile"
              >
                <div className="h-8 w-8 rounded-full bg-gt-gold flex items-center justify-center text-gray-900 font-semibold text-sm">
                  {user?.email?.[0].toUpperCase() || 'U'}
                </div>
              </Link>

              {isDemo ? (
                <div className="flex justify-center mb-2" title="Demo Mode Active">
                  <div className="p-1.5 bg-gt-gold text-gray-900 rounded">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>
              ) : (
                <Link
                  href="/demo-setup"
                  className="flex justify-center mb-2 p-1.5 bg-gt-gold hover:bg-gt-gold-600 text-gray-900 rounded transition-colors"
                  title="Try Demo"
                >
                  <Rocket className="h-4 w-4" />
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="w-full p-1.5 text-gray-300 hover:bg-red-900/20 hover:text-red-400 rounded flex justify-center transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Mobile Menu Button - Floating */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden bg-gt-navy text-white p-2 rounded-lg shadow-lg hover:bg-gt-navy-700 transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  );
}