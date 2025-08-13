"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  CheckCircle,
  Search,
  GraduationCap,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewType = 'dashboard' | 'planner' | 'requirements' | 'courses' | 'record' | 'profile';

interface SidebarProps {
  currentView?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

const menuItems = [
  { 
    id: 'dashboard' as ViewType, 
    label: 'Dashboard', 
    icon: Home, 
    href: '/dashboard' 
  },
  { 
    id: 'planner' as ViewType, 
    label: 'Course Planner', 
    icon: Calendar, 
    href: '/planner' 
  },
  { 
    id: 'requirements' as ViewType, 
    label: 'Requirements', 
    icon: CheckCircle, 
    href: '/requirements' 
  },
  { 
    id: 'courses' as ViewType, 
    label: 'Course Discovery', 
    icon: Search, 
    href: '/courses' 
  },
  { 
    id: 'record' as ViewType, 
    label: 'Academic Record', 
    icon: GraduationCap, 
    href: '/record' 
  },
  { 
    id: 'profile' as ViewType, 
    label: 'Profile', 
    icon: User, 
    href: '/profile' 
  },
];

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const pathname = usePathname();

  const getActiveView = (): ViewType => {
    if (currentView) return currentView;
    
    // Map pathname to view
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    if (pathname.startsWith('/planner')) return 'planner';
    if (pathname.startsWith('/requirements')) return 'requirements';
    if (pathname.startsWith('/courses')) return 'courses';
    if (pathname.startsWith('/record')) return 'record';
    if (pathname.startsWith('/profile')) return 'profile';
    
    return 'dashboard';
  };

  const activeView = getActiveView();

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (onViewChange) {
      onViewChange(item.id);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            if (onViewChange) {
              // If using as controlled component
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                    isActive
                      ? "bg-gt-navy text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            } else {
              // If using with Next.js routing
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-gt-navy text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            }
          })}
        </nav>
      </div>
    </aside>
  );
}