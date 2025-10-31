"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { BookOpen, Bell } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/planner')) return 'Course Planner';
    if (pathname.startsWith('/requirements')) return 'Requirements';
    if (pathname.startsWith('/courses')) return 'Course Explorer';
    if (pathname.startsWith('/opportunities')) return 'Opportunities';
    if (pathname.startsWith('/advisors')) return 'Advisors';
    if (pathname.startsWith('/record')) return 'Academic Record';
    if (pathname.startsWith('/profile')) return 'Profile';
    return 'GT Academic Planner';
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 flex-shrink-0">
      {/* Left side - Page Title */}
      <div className="flex items-center space-x-3">
        <BookOpen className="h-5 w-5 text-gt-gold hidden sm:block" />
        <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
      </div>

      {/* Right side - Notifications and other actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications icon - placeholder for future feature */}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {/* Notification badge - uncomment when implementing notifications */}
          {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
        </button>
      </div>
    </header>
  );
}