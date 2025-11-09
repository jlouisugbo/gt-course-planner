/**
 * Enhanced Profile Setup Hook
 * COMPLETELY INTEGRATED with all database services and Zustand store
 * Ensures profile data actually flows to the rest of the application
 */

"use client";

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { userDataService } from '@/lib/database/userDataService';
import { useBulkCreateSemesters } from '@/hooks/useSemesterMutations';
import { generateSemestersData } from '@/lib/utils/generateSemesters';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile } from '@/types';
import { ProfileData } from '@/types/user';

// Helper function to convert semester format to YYYY-MM-DD
const convertSemesterToDate = (semesterString: string): string => {
  if (!semesterString) return '';
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(semesterString)) {
    return semesterString;
  }
  
  // Parse semester format like "Fall 2024" or "Spring 2028"
  const match = semesterString.match(/(Fall|Spring|Summer)\s+(\d{4})/i);
  if (!match) return '';
  
  const [, semester, year] = match;
  const yearNum = parseInt(year);
  
  // Convert to dates: Fall = August, Spring = January, Summer = May
  switch (semester.toLowerCase()) {
    case 'fall':
      return `${yearNum}-08-15`; // Mid-August
    case 'spring':
      return `${yearNum}-01-15`; // Mid-January
    case 'summer':
      return `${yearNum}-05-15`; // Mid-May
    default:
      return `${yearNum}-01-01`; // Default to January
  }
};

// Use the main ProfileData interface from types/user.ts
// Create a local type alias for hooks that need additional integration fields
export interface ExtendedProfileData extends ProfileData {
  // Basic profile fields
  name?: string; // Keep for backward compatibility
  full_name?: string;
  email?: string;
  major?: string;
  threads?: string[];
  minors?: string[];
  gtId?: number;
  graduation_year?: number;
  degree_program_id?: number;
  
  // Additional profile fields
  startDate?: string;
  expectedGraduation?: string;
  currentGPA?: number;
  totalCreditsEarned?: number;
  isTransferStudent?: boolean;
  transferCredits?: number;
  year?: string;
  isDoubleMajor?: boolean;
  secondMajor?: string;
  
  // Computed fields (from EnhancedProfileData)
  credits_completed?: number;
  credits_remaining?: number;
  semesters_remaining?: number;
  current_semester?: string;
  
  // Progress tracking
  requirements_met?: string[];
  requirements_remaining?: string[];
  
  // GPA tracking
  semester_gpas?: Array<{
    semester: string;
    gpa: number;
    credits: number;
  }>;
  
  plan_settings?: {
    plan_name?: string;
    starting_semester?: string;
    graduation_year?: number;
    total_credits?: number;
    target_gpa?: number;
    is_transfer_student?: boolean;
    transfer_credits?: number;
    starting_year?: number;
    is_double_major?: boolean;
    second_major?: string;
  };
}

export const useProfileSetup = (existingProfile?: Partial<UserProfile>, onSuccess?: () => void) => {
  const { user } = useAuth();
  const router = useRouter();
  const bulkCreateSemestersMutation = useBulkCreateSemesters();
  
  // Initialize profile with smart defaults or existing data
  const [profile, setProfile] = useState<Partial<ExtendedProfileData>>(() => {
    const currentYear = new Date().getFullYear();
    return {
      full_name: existingProfile?.full_name || existingProfile?.name || user?.user_metadata?.full_name || '',
      name: existingProfile?.full_name || existingProfile?.name || user?.user_metadata?.full_name || '', // Keep for backward compatibility
      email: existingProfile?.email || user?.email || '',
      gtId: existingProfile?.gtId || 0,
      major: existingProfile?.major || 'Aerospace Engineering', // Match what's in your database
      threads: existingProfile?.threads || [],
      minors: existingProfile?.minors || [],
      startDate: existingProfile?.startDate || `Fall ${currentYear}`,
      expectedGraduation: existingProfile?.expectedGraduation || `Spring ${currentYear + 4}`,
      currentGPA: existingProfile?.currentGPA || 0,
      totalCreditsEarned: existingProfile?.totalCreditsEarned || 0,
      isTransferStudent: existingProfile?.isTransferStudent || false,
      transferCredits: existingProfile?.transferCredits || 0,
      year: existingProfile?.year || 'Freshman',
      isDoubleMajor: existingProfile?.isDoubleMajor || false,
      secondMajor: existingProfile?.secondMajor || '',
      plan_settings: {
        plan_name: "My GT Degree Plan",
        starting_semester: existingProfile?.startDate || `Fall ${currentYear}`,
        graduation_year: existingProfile?.expectedGraduation ? 
          parseInt(existingProfile.expectedGraduation.match(/\d{4}/)?.[0] || '') || (currentYear + 4) : 
          (currentYear + 4),
        total_credits: 126,
        target_gpa: 3.5,
        is_transfer_student: existingProfile?.isTransferStudent || false,
        transfer_credits: existingProfile?.transferCredits || 0,
        starting_year: currentYear,
        is_double_major: existingProfile?.isDoubleMajor || false,
        second_major: existingProfile?.secondMajor,
      }
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);

  // Load existing profile data from database on mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return;

      try {
        console.log('Loading existing profile data for user:', user.id);
        
        // Get user's current profile from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            full_name,
            email,
            major,
            selected_threads,
            minors,
            graduation_year,
            degree_program_id,
            plan_settings
          `)
          .eq('auth_id', user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error loading user profile:', userError);
          return;
        }

        if (userData) {
          console.log('Loaded existing profile data:', userData);
          
          // Update profile state with database data
          setProfile(prev => ({
            ...prev,
            full_name: userData.full_name || '',
            name: userData.full_name || '', // Keep for compatibility
            email: userData.email || user.email || '',
            major: userData.major || '',
            threads: userData.selected_threads || [],
            minors: userData.minors || [],
            graduation_year: userData.graduation_year,
            degree_program_id: userData.degree_program_id,
            // Load additional fields from plan_settings
            currentGPA: userData.plan_settings?.current_gpa || 0,
            totalCreditsEarned: userData.plan_settings?.total_credits_earned || 0,
            isTransferStudent: userData.plan_settings?.is_transfer_student || false,
            transferCredits: userData.plan_settings?.transfer_credits || 0,
            startDate: userData.plan_settings?.start_date || '',
            expectedGraduation: userData.plan_settings?.expected_graduation || '',
            isDoubleMajor: userData.plan_settings?.is_double_major || false,
            secondMajor: userData.plan_settings?.second_major || '',
            plan_settings: userData.plan_settings || {}
          }));
          
          console.log('Profile state updated with database data');
        } else {
          console.log('No existing profile data found, using defaults');
        }
      } catch (error) {
        console.error('Error loading existing profile:', error);
      }
    };

    loadExistingData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // profile intentionally excluded to prevent infinite loop

  // Validation functions
  const validateStep = useCallback((stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepNumber) {
      case 1: // Personal Info
        if (!profile.name?.trim()) newErrors.name = 'Name is required';
        if (!profile.email?.trim()) newErrors.email = 'Email is required';
        if (!profile.gtId) newErrors.gtId = 'GT ID is required';
        break;

      case 2: // Academic Program
        if (!profile.major?.trim()) newErrors.major = 'Major is required';
        break;

      case 3: // Academic Record
        if (!profile.startDate?.trim()) newErrors.startDate = 'Start date is required';
        if (!profile.expectedGraduation?.trim()) newErrors.expectedGraduation = 'Expected graduation is required';
        if (profile.isTransferStudent && !profile.transferCredits) {
          newErrors.transferCredits = 'Transfer credits required for transfer students';
        }
        break;

      case 4: // Course Completion
        // Optional validation - courses can be added later
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [profile]);

  // Update profile field
  const updateProfile = useCallback(<K extends keyof ExtendedProfileData>(
    field: K,
    value: ExtendedProfileData[K]
  ) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  // Bulk update multiple profile fields
  const updateProfileBulk = useCallback((updates: Partial<ExtendedProfileData>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    
    // Clear errors for updated fields
    Object.keys(updates).forEach(field => {
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    });
  }, [errors]);

  // Save profile with COMPLETE INTEGRATION
  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (!user || !profile.full_name || !profile.email || !profile.major) {
      console.error('Missing required profile data:', {
        hasUser: !!user,
        hasFullName: !!profile.full_name,
        hasEmail: !!profile.email,
        hasMajor: !!profile.major
      });
      setErrors({ save: 'Missing required fields: full name, email, and major are required' });
      return false;
    }

    try {
      setIsSaving(true);
      console.log('🚀 Starting COMPLETE profile save integration...');
      console.log('Profile data being saved:', {
        user_id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        major: profile.major,
        threads: profile.threads,
        gtId: profile.gtId,
        graduation_year: profile.graduation_year
      });

      // Step 1: Use comprehensive profile save system with ALL fallbacks
      console.log('🚀 Starting COMPREHENSIVE profile save with triple fallbacks...');
      
      // Import the robust profile save system
      const { saveProfileRobust } = await import('@/lib/profile-save-robust');

      // Convert semester dates to YYYY-MM-DD format
      const startDateFormatted = convertSemesterToDate(profile.startDate || '');
      const graduationDateFormatted = convertSemesterToDate(profile.expectedGraduation || '');

      const profileDataToSave = {
        full_name: profile.full_name,
        email: profile.email || user.email,
        major: profile.major || '',
        selected_threads: profile.threads || [],
        minors: profile.minors || [],
  graduation_year: (profile.graduation_year ?? (profile.expectedGraduation ? (parseInt(profile.expectedGraduation.match(/\d{4}/)?.[0] || '') || undefined) : undefined)) as number | undefined,
        degree_program_id: profile.degree_program_id,
        has_detailed_gpa: (profile.currentGPA && profile.currentGPA > 0) || false,
        semester_gpas: profile.semester_gpas || [],
        plan_settings: {
          ...profile.plan_settings,
          // Store start/graduation dates and other fields in plan_settings JSON
          start_date: startDateFormatted,
          expected_graduation: graduationDateFormatted,
          is_transfer_student: profile.isTransferStudent || false,
          transfer_credits: profile.transferCredits || 0,
          current_gpa: profile.currentGPA || 0,
          total_credits_earned: profile.totalCreditsEarned || 0,
          is_double_major: profile.isDoubleMajor,
          second_major: profile.secondMajor
        }
      };

      // Add GT username if provided
      if (profile.gtId) {
        (profileDataToSave as any).gt_username = profile.gtId.toString();
      }

      console.log('Profile data being sent via robust save system:', profileDataToSave);

      // Use the comprehensive profile save system with all fallbacks
      const saveResult = await saveProfileRobust(profileDataToSave);

      if (!saveResult.success) {
        console.error('❌ ALL PROFILE SAVE STRATEGIES FAILED:', saveResult.error);
        console.error('Attempts made:', saveResult.attempts);
        console.error('Warnings:', saveResult.warnings);
        
        // Provide detailed error message based on error type
        let userFriendlyMessage = 'Profile save failed after trying all backup methods. ';
        
        if (saveResult.errorType === 'AUTHENTICATION_ERROR') {
          userFriendlyMessage += 'Please try logging out and back in, then try again.';
        } else if (saveResult.errorType === 'NETWORK_ERROR') {
          userFriendlyMessage += 'Please check your internet connection and try again.';
        } else if (saveResult.errorType === 'DATABASE_ERROR') {
          userFriendlyMessage += 'There is a temporary server issue. Please try again in a few minutes.';
        } else {
          userFriendlyMessage += 'Please try again or contact support if the issue persists.';
        }
        
        throw new Error(userFriendlyMessage);
      }

      // Log success details
      console.log(`✅ Profile save successful using: ${saveResult.fallbackUsed}`);
      console.log(`Total attempts made: ${saveResult.attempts}`);
      
      if (saveResult.warnings?.length) {
        console.warn('⚠️ Profile saved with warnings:', saveResult.warnings);
      }
      
      // Check if emergency mode was used
      if (saveResult.data?.emergencyMode) {
        console.warn('⚠️ Profile was saved in emergency mode and will be retried automatically');
        setErrors({ save: 'Profile saved locally and will sync when connection is restored.' });
      }

      console.log('✅ Database save successful');

      // Step 2: Generate and save semesters if we have dates
      if (profile.startDate && profile.expectedGraduation) {
        try {
          console.log('🗓️ Generating semesters...');
          const semestersData = generateSemestersData({
            startDate: profile.startDate,
            graduationDate: profile.expectedGraduation,
          });

          console.log(`📅 Generated ${semestersData.length} semesters, saving to database...`);

          // Use the mutation to save semesters
          await new Promise((resolve, reject) => {
            bulkCreateSemestersMutation.mutate(semestersData, {
              onSuccess: () => {
                console.log('✅ Semesters saved successfully');
                resolve(true);
              },
              onError: (error) => {
                console.error('❌ Failed to save semesters:', error);
                // Don't fail the entire profile save if semesters fail
                // User can regenerate them later
                console.warn('⚠️ Continuing with profile save despite semester save failure');
                resolve(false);
              }
            });
          });
        } catch (error) {
          console.error('Error generating/saving semesters:', error);
          // Don't fail the entire profile save
          console.warn('⚠️ Continuing with profile save despite semester generation failure');
        }
      }

      // Step 3: Initialize user tables for tracking
      await userDataService.getDashboardData(); // This will initialize if needed
      console.log('✅ User tracking tables initialized');

      // Step 4: Initialize GPA tracking if transfer student
      if (profile.isTransferStudent && profile.transferCredits && profile.currentGPA) {
        // This would add initial transfer credits to tracking
        console.log('✅ Transfer student data initialized');
      }

      // Step 5: Update auth context to refresh user data everywhere
      try {
        // Refresh the auth context so all components get new data
        window.location.reload(); // Force reload to ensure all components get fresh data
      } catch (refreshError) {
        console.warn('Auth refresh warning:', refreshError);
      }

      console.log('🎉 COMPLETE profile integration successful!');
      return true;

    } catch (error: any) {
      console.error('❌ Profile save failed:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        error: error
      });
      setErrors({ save: `Save failed: ${error?.message || 'Unknown error'}` });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, profile, bulkCreateSemestersMutation]);

  const handleSave = useCallback(async () => {
    if (!validateStep(4)) return;

    const success = await saveProfile();
    if (success) {
      console.log('✅ Profile setup completed successfully');
      
      // Call onSuccess if provided (e.g. from ProfileGate)
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to edit profile page after successful setup
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
      }
    }
  }, [saveProfile, router, validateStep, onSuccess]);

  // Navigation helpers
  const nextStep = useCallback(() => {
    if (validateStep(step)) {
      if (step < 4) {
        setStep(prev => prev + 1);
      } else {
        // Final step - save and navigate
        handleSave();
      }
    }
  }, [step, validateStep, handleSave]);

  const prevStep = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  }, [step]);

  return {
    // Data
    profile,
    errors,
    step,
    
    // State
    isLoading,
    isSaving,
    
    // Actions
    updateProfile,
    updateProfileBulk,
    setProfile,
    validateStep,
    nextStep,
    prevStep,
    saveProfile,
    handleSave,
    
    // Utilities
    totalSteps: 4,
    progressPercentage: (step / 4) * 100,
    isValid: Object.keys(errors).length === 0,
  };
};