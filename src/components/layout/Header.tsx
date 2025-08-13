"use client";

import React from 'react';
import { BookOpen, User } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useUserAwarePlannerStore } from '@/hooks/useUserAwarePlannerStore';

export default function Header() {
  const { user } = useAuth();
  const { userProfile } = useUserAwarePlannerStore();

  // Get user display information
  const userName = userProfile?.first_name && userProfile?.last_name 
    ? `${userProfile.first_name} ${userProfile.last_name}`
    : user?.email?.split('@')[0] || 'Student';
  
  const userDetails = userProfile?.major 
    ? `${userProfile.major} • ${userProfile.expected_graduation || 'TBD'}`
    : 'Georgia Tech Student';

  return (
    <header className="bg-gt-navy text-white shadow-md">
      <div className="px-6 py-4 flex justify-between items-center">
        {/* Left side - Logo and title */}
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-gt-gold" />
          <div>
            <h1 className="text-lg font-semibold">GT Academic Planner</h1>
            <p className="text-sm text-gray-300">Georgia Institute of Technology</p>
          </div>
        </div>

        {/* Right side - User info */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-gt-gold">{userDetails}</p>
          </div>
          <div className="w-8 h-8 bg-gt-gold rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gt-navy" />
          </div>
        </div>
      </div>
    </header>
  );
}