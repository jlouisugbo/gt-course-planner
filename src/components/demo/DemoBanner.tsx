"use client";

import React, { useState, useEffect } from 'react';
import { X, Info, RotateCcw, LogOut } from 'lucide-react';
import { isDemoMode, disableDemoMode, resetDemoMode } from '@/lib/demo-mode';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Check if demo mode is active
    setIsVisible(isDemoMode());
  }, []);

  const handleDismiss = () => {
    setIsExpanded(false);
  };

  const handleReset = () => {
    if (confirm('Reset demo data? This will reload the page with fresh demo data.')) {
      resetDemoMode();
      window.location.reload();
    }
  };

  const handleExitDemo = () => {
    if (confirm('Exit demo mode? This will clear all demo data and return to the login page.')) {
      disableDemoMode();
      window.location.href = '/';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-gray-900 shadow-lg transition-all duration-300 ease-in-out z-50",
        isExpanded ? "py-3" : "py-2"
      )}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Info className="h-5 w-5 flex-shrink-0 text-amber-900" />

            {isExpanded ? (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">Demo Mode</span>
                  <span className="hidden sm:inline text-sm">•</span>
                  <span className="text-sm hidden sm:inline">
                    You're viewing a sample student profile (Alex Johnson, CS Major, Senior)
                  </span>
                </div>
                <p className="text-xs mt-1 hidden md:block text-amber-900">
                  This is demo data showing a realistic GT course plan. All features are functional. Changes won't be saved.
                </p>
              </div>
            ) : (
              <span className="text-sm font-semibold">Demo Mode Active</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isExpanded && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="hidden sm:flex items-center gap-1.5 h-8 px-3 bg-white/20 hover:bg-white/30 text-gray-900 border-0"
                  title="Reset demo data"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Reset</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExitDemo}
                  className="hidden sm:flex items-center gap-1.5 h-8 px-3 bg-white/20 hover:bg-white/30 text-gray-900 border-0"
                  title="Exit demo mode"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Exit Demo</span>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-gray-900 border-0 flex-shrink-0"
              title={isExpanded ? "Minimize banner" : "Expand banner"}
            >
              {isExpanded ? (
                <X className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile actions when expanded */}
        {isExpanded && (
          <div className="flex sm:hidden items-center gap-2 mt-2 pt-2 border-t border-amber-600/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="flex-1 items-center gap-1.5 h-8 bg-white/20 hover:bg-white/30 text-gray-900 border-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Reset Demo</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExitDemo}
              className="flex-1 items-center gap-1.5 h-8 bg-white/20 hover:bg-white/30 text-gray-900 border-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Exit Demo</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
