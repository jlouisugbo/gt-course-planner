"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Target, Calendar, Briefcase } from 'lucide-react';

const WELCOME_MODAL_SESSION_KEY = 'gt-planner-demo-welcome-shown';

export const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if we've already shown the modal this session
    const hasShown = sessionStorage.getItem(WELCOME_MODAL_SESSION_KEY);

    if (!hasShown) {
      // Show modal after 10 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem(WELCOME_MODAL_SESSION_KEY, 'true');
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-[#003057] to-[#B3A369] p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white mb-0">
                Welcome to GT Course Planner!
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-white/90 text-sm">
            You're exploring the demo version. Here's what you can do:
          </DialogDescription>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Features List */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg transition-all hover:bg-blue-100">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#003057] text-sm">Plan Your Semesters</h3>
                <p className="text-sm text-gray-600">Drag and drop courses to build your academic plan</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg transition-all hover:bg-green-100">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#003057] text-sm">Track Requirements</h3>
                <p className="text-sm text-gray-600">Check off completed courses and monitor degree progress</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg transition-all hover:bg-purple-100">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#003057] text-sm">Explore Courses</h3>
                <p className="text-sm text-gray-600">Browse the course catalog with smart recommendations</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg transition-all hover:bg-orange-100">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#003057] text-sm">Find Opportunities</h3>
                <p className="text-sm text-gray-600">Discover internships, co-ops, and research positions</p>
              </div>
            </div>
          </div>

          {/* Demo Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> This is a demo with sample data. Changes won't be saved permanently.
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleClose}
            className="w-full bg-[#003057] hover:bg-[#003057]/90 text-white h-11"
          >
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
