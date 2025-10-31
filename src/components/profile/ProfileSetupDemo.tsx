/**
 * Demo Profile Setup Component
 * Provides hardcoded demo values for quick testing
 */

"use client";

import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Rocket } from 'lucide-react';
import { saveProfileDirect } from '@/lib/profile-save-direct';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { useRouter } from 'next/navigation';

// Predefined demo profiles
const DEMO_PROFILES = {
  cs_student: {
    full_name: "Alex Johnson",
    email: "ajohnson3@gatech.edu",
    gt_username: "ajohnson3",
    major: "Computer Science",
    selected_threads: ["Devices", "Intelligence"],
    minors: ["Economics"],
    graduation_year: 2026,
    start_date: "2023-08-15",
    expected_graduation: "2027-05-15",
    current_gpa: 3.75,
    total_credits_earned: 45,
    is_transfer_student: false,
    transfer_credits: 0
  },
  ae_student: {
    full_name: "Sarah Mitchell",
    email: "smitchell8@gatech.edu", 
    gt_username: "smitchell8",
    major: "Aerospace Engineering",
    selected_threads: [],
    minors: ["Biomedical Engineering"],
    graduation_year: 2025,
    start_date: "2022-08-15",
    expected_graduation: "2026-05-15",
    current_gpa: 3.82,
    total_credits_earned: 78,
    is_transfer_student: false,
    transfer_credits: 0
  },
  transfer_student: {
    full_name: "Jordan Davis",
    email: "jdavis42@gatech.edu",
    gt_username: "jdavis42",
    major: "Mechanical Engineering", 
    selected_threads: [],
    minors: ["Industrial Design"],
    graduation_year: 2025,
    start_date: "2023-01-15",
    expected_graduation: "2025-12-15",
    current_gpa: 3.65,
    total_credits_earned: 60,
    is_transfer_student: true,
    transfer_credits: 30
  }
};

export const ProfileSetupDemo: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const plannerStore = usePlannerStore();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<keyof typeof DEMO_PROFILES>('cs_student');
  const [status, setStatus] = useState<string>('');

  const handleQuickSetup = async () => {
    if (!user) {
      setStatus('Please sign in first');
      return;
    }

    try {
      setIsSaving(true);
      setStatus('Setting up demo profile...');

      const demoData = DEMO_PROFILES[selectedProfile];
      
      // Save to database
      const result = await saveProfileDirect({
        ...demoData,
        plan_settings: {
          plan_name: `${demoData.full_name}'s GT Plan`,
          starting_semester: demoData.start_date,
          graduation_year: demoData.graduation_year,
          total_credits: 126,
          target_gpa: 3.5,
          is_transfer_student: demoData.is_transfer_student,
          transfer_credits: demoData.transfer_credits,
          current_gpa: demoData.current_gpa,
          total_credits_earned: demoData.total_credits_earned
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save profile');
      }

      // Update Zustand store - set both StudentInfo and UserProfile fields
      plannerStore.updateStudentInfo({
        // StudentInfo fields
        id: 0,
        name: demoData.full_name,
        email: demoData.email,
        major: demoData.major,
        threads: demoData.selected_threads,
        minors: demoData.minors,
        startYear: parseInt(demoData.start_date.split('-')[0]),
        expectedGraduation: demoData.expected_graduation,
        currentGPA: demoData.current_gpa,
        majorRequirements: [],
        minorRequirements: [],
        threadRequirements: [],
        // UserProfile fields for proper name display
        full_name: demoData.full_name,
        auth_id: '', // Will be set by auth system
        gtId: undefined
      } as any);

      // Generate semesters - convert YYYY-MM-DD format to "Season YYYY" format
      const convertToSeasonYear = (dateString: string): string => {
        const [year, month] = dateString.split('-');
        const monthNum = parseInt(month);
        
        // Determine season based on month
        let season: string;
        if (monthNum >= 8 && monthNum <= 12) {
          season = 'Fall';
        } else if (monthNum >= 1 && monthNum <= 5) {
          season = 'Spring';
        } else {
          season = 'Summer';
        }
        
        return `${season} ${year}`;
      };

      const startSemester = convertToSeasonYear(demoData.start_date);
      const gradSemester = convertToSeasonYear(demoData.expected_graduation);
      
      console.log(`Generating semesters from ${startSemester} to ${gradSemester}`);
      plannerStore.generateSemesters(startSemester, gradSemester);

      setStatus('Demo profile setup complete! Redirecting...');
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Demo setup error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-[#B3A369]" />
          Quick Demo Setup
        </CardTitle>
        <CardDescription>
          Select a demo profile to quickly set up your account for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Demo Profile:</label>
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value as keyof typeof DEMO_PROFILES)}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isSaving}
          >
            <option value="cs_student">CS Student (Alex Johnson - Threads: Devices, Intelligence)</option>
            <option value="ae_student">Aerospace Engineering (Sarah Mitchell - Minor: CS)</option>
            <option value="transfer_student">Transfer Student (Jordan Davis - ME with 30 transfer credits)</option>
          </select>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Selected Profile Details:</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(DEMO_PROFILES[selectedProfile], null, 2)}
          </pre>
        </div>

        {status && (
          <div className={`p-3 rounded-md text-sm ${
            status.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {status}
          </div>
        )}

        <Button
          onClick={handleQuickSetup}
          disabled={isSaving || !user}
          className="w-full bg-[#003057] hover:bg-[#003057]/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Setting up demo profile...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Use This Demo Profile
            </>
          )}
        </Button>

        {!user && (
          <p className="text-sm text-gray-500 text-center">
            Please sign in first to use demo profiles
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSetupDemo;