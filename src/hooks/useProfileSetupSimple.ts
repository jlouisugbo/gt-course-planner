/**
 * SIMPLIFIED PROFILE SETUP HOOK - Phase 1 Fix
 * Direct and simple profile management without complex fallbacks
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { saveProfileDirect, loadProfileDirect } from '@/lib/profile-save-direct';

export interface SimpleProfileData {
  // Basic Info
  full_name?: string;
  email?: string;
  gt_username?: string;
  
  // Academic Info
  major?: string;
  selected_threads?: string[];
  minors?: string[];
  
  // Timeline
  start_date?: string;
  expected_graduation?: string;
  graduation_year?: number;
  
  // Academic Record
  current_gpa?: number;
  total_credits_earned?: number;
  is_transfer_student?: boolean;
  transfer_credits?: number;
  
  // Completed Courses
  completed_courses?: string[];
}

export const useProfileSetupSimple = (existingProfile?: Partial<SimpleProfileData>) => {
  const router = useRouter();
  const { user } = useAuth();
  const plannerStore = usePlannerStore();
  
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<SimpleProfileData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with existing profile or user data
  useEffect(() => {
    const initializeProfile = async () => {
      if (existingProfile) {
        setProfile(existingProfile);
        return;
      }

      if (user) {
        // Try to load existing profile
        const { success, data } = await loadProfileDirect();
        if (success && data) {
          console.log('Loaded existing profile:', data);
          
          // Map database fields to form fields
          const mappedProfile: SimpleProfileData = {
            full_name: data.full_name || '',
            email: data.email || user.email || '',
            gt_username: data.gt_username || '',
            major: data.major || '',
            selected_threads: data.selected_threads || data.threads || [],
            minors: data.minors || [],
            graduation_year: data.graduation_year,
            current_gpa: data.current_gpa,
            total_credits_earned: data.total_credits_earned || 0,
            start_date: data.plan_settings?.start_date || '',
            expected_graduation: data.plan_settings?.expected_graduation || '',
            is_transfer_student: data.plan_settings?.is_transfer_student || false,
            transfer_credits: data.plan_settings?.transfer_credits || 0,
            completed_courses: data.completed_courses || []
          };
          
          setProfile(mappedProfile);
        } else {
          // Initialize with user email
          setProfile({
            email: user.email || '',
            full_name: user.user_metadata?.full_name || ''
          });
        }
      }
    };

    initializeProfile();
  }, [user, existingProfile]);

  // Simple validation
  const validateStep = useCallback((stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepNumber) {
      case 1: // Personal Info
        if (!profile.full_name?.trim()) {
          newErrors.full_name = 'Name is required';
        }
        if (!profile.email?.trim()) {
          newErrors.email = 'Email is required';
        }
        break;

      case 2: // Academic Program
        if (!profile.major?.trim()) {
          newErrors.major = 'Major is required';
        }
        break;

      case 3: // Academic Record
        if (!profile.start_date?.trim()) {
          newErrors.start_date = 'Start date is required';
        }
        if (!profile.expected_graduation?.trim()) {
          newErrors.expected_graduation = 'Expected graduation is required';
        }
        break;

      case 4: // Course Completion
        // Optional - no validation required
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [profile]);

  // Update profile field
  const updateProfile = useCallback(<K extends keyof SimpleProfileData>(
    field: K,
    value: SimpleProfileData[K]
  ) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  // Navigation
  const nextStep = useCallback(() => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4));
    }
  }, [step, validateStep]);

  const prevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Save profile
  const handleSave = useCallback(async () => {
    if (!validateStep(4)) {
      console.error('Validation failed');
      return;
    }

    if (!user) {
      setErrors({ save: 'You must be logged in to save your profile' });
      return;
    }

    setIsSaving(true);
    console.log('Starting profile save...');

    try {
      // Extract graduation year from expected graduation if not set
      if (!profile.graduation_year && profile.expected_graduation) {
        const yearMatch = profile.expected_graduation.match(/\d{4}/);
        if (yearMatch) {
          profile.graduation_year = parseInt(yearMatch[0]);
        }
      }

      // Save to database
      const result = await saveProfileDirect(profile);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save profile');
      }

      console.log('Profile saved successfully!');

      // Update Zustand store
      plannerStore.updateStudentInfo({
        id: result.data?.id || 0,
        name: profile.full_name || '',
        email: profile.email || '',
        major: profile.major || '',
        threads: profile.selected_threads || [],
        minors: profile.minors || [],
        startYear: parseInt(profile.start_date?.match(/\d{4}/)?.[0] || '') || new Date().getFullYear(),
        expectedGraduation: profile.expected_graduation || '',
        currentGPA: profile.current_gpa || 0,
        majorRequirements: [],
        minorRequirements: [],
        threadRequirements: []
      });

      // Generate semesters if we have dates
      if (profile.start_date && profile.expected_graduation) {
        plannerStore.generateSemesters(profile.start_date, profile.expected_graduation);
      }

      // Success! Navigate to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);

    } catch (error) {
      console.error('Save failed:', error);
      setErrors({ 
        save: error instanceof Error ? error.message : 'Failed to save profile. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  }, [profile, user, validateStep, plannerStore, router]);

  return {
    step,
    setStep,
    profile,
    updateProfile,
    errors,
    isSaving,
    nextStep,
    prevStep,
    handleSave,
    totalSteps: 4,
    progressPercentage: (step / 4) * 100,
    isValid: Object.keys(errors).length === 0
  };
};