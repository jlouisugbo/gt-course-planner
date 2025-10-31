/**
 * Reliable Data Loader Hook
 * Ensures consistent loading of user data across planner and requirements tabs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

// Global state to prevent multiple instances from loading simultaneously
const globalLoadingState = {
  isLoading: false,
  lastUserId: null as string | null,
  data: null as any,
  error: null as string | null,
  subscribers: new Set<(state: any) => void>()
};

const notifySubscribers = () => {
  globalLoadingState.subscribers.forEach(callback => callback({
    data: globalLoadingState.data,
    isLoading: globalLoadingState.isLoading,
    error: globalLoadingState.error
  }));
};

export interface UserProfile {
  id: number;
  authId: string;
  fullName: string;
  email: string;
  gtId: number;
  major: string;
  secondMajor?: string;
  minors: string[];
  threads: string[];
  startDate: string;
  expectedGraduation: string;
  graduationYear: number;
  year: string;
  currentGPA: number;
  totalCreditsEarned: number;
  isTransferStudent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DegreeProgram {
  id: number;
  name: string;
  degreeType: string;
  totalCredits: number;
  requirements: any[];
  footnotes: any[];
}

export interface LoaderState {
  userProfile: UserProfile | null;
  degreeProgram: DegreeProgram | null;
  minorPrograms: DegreeProgram[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export const useReliableDataLoader = () => {
  const { user } = useAuth();
  const [state, setState] = useState<LoaderState>({
    userProfile: null,
    degreeProgram: null,
    minorPrograms: [],
    isLoading: false,
    error: null,
    isInitialized: false
  });
  
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const subscriberRef = useRef<((state: any) => void) | null>(null);

  const updateState = useCallback((updates: Partial<LoaderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user?.id) {
      throw new Error('No authenticated user');
    }

    console.log('Loading user profile for:', user.id);
    
    const { data: userRecord, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new Error(`Failed to load user profile: ${error.message}`);
    }

    if (!userRecord) {
      throw new Error('User profile not found');
    }

    const profile: UserProfile = {
      id: userRecord.id,
      authId: userRecord.auth_id,
      fullName: userRecord.full_name || '',
      email: userRecord.email || user.email || '',
      gtId: userRecord.gt_id || 0,
      major: userRecord.major || '',
      secondMajor: userRecord.second_major,
      minors: Array.isArray(userRecord.minors) ? userRecord.minors : [],
      threads: Array.isArray(userRecord.threads) ? userRecord.threads : [],
      startDate: userRecord.start_date || '',
      expectedGraduation: userRecord.expected_graduation || '',
      graduationYear: userRecord.graduation_year || new Date().getFullYear() + 4,
      year: userRecord.year || '',
      currentGPA: userRecord.current_gpa || 0,
      totalCreditsEarned: userRecord.total_credits_earned || 0,
      isTransferStudent: userRecord.is_transfer_student || false,
      createdAt: new Date(userRecord.created_at),
      updatedAt: new Date(userRecord.updated_at)
    };

    console.log('Loaded user profile:', profile);
    return profile;
  }, [user]);

  const loadDegreeProgram = useCallback(async (majorName: string): Promise<DegreeProgram | null> => {
    if (!majorName) {
      console.warn('No major name provided for degree program loading');
      return null;
    }

    console.log('Loading degree program for major:', majorName);

    // Get authentication token
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      throw new Error('No valid authentication token');
    }

    const response = await fetch(`/api/degree-programs?major=${encodeURIComponent(majorName)}&degree_type=BS`, {
      headers: {
        'Authorization': `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to load degree program: ${errorData.error || response.statusText}`);
    }

    const degreeData = await response.json();
    
    const program: DegreeProgram = {
      id: degreeData.id,
      name: degreeData.name,
      degreeType: degreeData.degree_type || 'BS',
      totalCredits: degreeData.total_credits || 120,
      requirements: Array.isArray(degreeData.requirements) ? degreeData.requirements : [],
      footnotes: Array.isArray(degreeData.footnotes) ? degreeData.footnotes : []
    };

    console.log('Loaded degree program:', program);
    return program;
  }, []);

  const loadMinorPrograms = useCallback(async (minorNames: string[]): Promise<DegreeProgram[]> => {
    if (!minorNames || minorNames.length === 0) {
      console.log('No minors to load');
      return [];
    }

    // Filter out any invalid minors and log what we're actually processing
    const validMinors = minorNames.filter(minor => minor && typeof minor === 'string' && minor.trim().length > 0);
    
    if (validMinors.length === 0) {
      console.log('No valid minors after filtering');
      return [];
    }

    console.log('🔍 Debug: Loading minor programs:', validMinors);
    
    // Get authentication token
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      console.warn('No valid authentication token for loading minors');
      return [];
    }

    const minorPrograms: DegreeProgram[] = [];
    
    for (const minorName of validMinors) {
      try {
        // Skip if this is actually the user's major (common data issue)
        if (minorName === 'Aerospace Engineering' || minorName === 'Biomedical Engineering') {
          console.log(`Skipping ${minorName} as it appears to be a major, not a minor`);
          continue;
        }
        
        const response = await fetch(`/api/degree-programs?major=${encodeURIComponent(minorName)}&degree_type=Minor`, {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const minorData = await response.json();
          minorPrograms.push({
            id: minorData.id,
            name: minorData.name,
            degreeType: 'Minor',
            totalCredits: minorData.total_credits || 18,
            requirements: Array.isArray(minorData.requirements) ? minorData.requirements : [],
            footnotes: Array.isArray(minorData.footnotes) ? minorData.footnotes : []
          });
        } else {
          console.warn(`Failed to load minor program: ${minorName} (${response.status})`);
        }
      } catch (error) {
        console.warn(`Error loading minor ${minorName}:`, error);
      }
    }

    console.log('Loaded minor programs:', minorPrograms);
    return minorPrograms;
  }, []);

  const loadAllData = useCallback(async (forceReload = false) => {
    if (!user?.id) {
      updateState({ 
        isLoading: false, 
        error: 'No authenticated user',
        isInitialized: false
      });
      return;
    }

    // Check if global loading is already in progress for this user
    if (globalLoadingState.isLoading && globalLoadingState.lastUserId === user.id && !forceReload) {
      console.log('Global data loading already in progress for user:', user.id);
      return;
    }

    // Check if we have recent data for this user
    if (globalLoadingState.data && globalLoadingState.lastUserId === user.id && !forceReload) {
      console.log('Using cached global data for user:', user.id);
      updateState({
        userProfile: globalLoadingState.data.userProfile,
        degreeProgram: globalLoadingState.data.degreeProgram,
        minorPrograms: globalLoadingState.data.minorPrograms,
        isLoading: false,
        error: null,
        isInitialized: true
      });
      return;
    }

    // Start loading
    globalLoadingState.isLoading = true;
    globalLoadingState.lastUserId = user.id;
    globalLoadingState.error = null;
    updateState({ isLoading: true, error: null });
    notifySubscribers();

    try {
      console.log('Loading all data for user:', user.id);

      // Step 1: Load user profile
      const userProfile = await loadUserProfile();
      console.log('🔍 Debug: User profile data:', userProfile);
      updateState({ userProfile });

      if (!userProfile?.major) {
        console.warn('User major not found, using default initialization');
        // Still mark as initialized but with limited data
        globalLoadingState.data = {
          userProfile,
          degreeProgram: null,
          minorPrograms: []
        };
        globalLoadingState.isLoading = false;
        
        updateState({ 
          isLoading: false, 
          error: null,
          isInitialized: true,
          degreeProgram: null,
          minorPrograms: []
        });
        return;
      }

      // Step 2: Load degree program
      let degreeProgram = null;
      try {
        degreeProgram = await loadDegreeProgram(userProfile.major);
      } catch (error) {
        console.warn('Failed to load degree program, continuing without it:', error);
      }
      updateState({ degreeProgram });

      // Step 3: Load minor programs - properly filter data
      const actualMinors = userProfile.minors?.filter(minor => {
        // Filter out invalid entries
        if (!minor || typeof minor !== 'string' || minor.trim().length === 0) return false;
        // Filter out if it's the same as major
        if (minor === userProfile.major) return false;
        // Filter out common data errors where majors are stored as minors
        const majorKeywords = ['Engineering', 'Science', 'Computing', 'Mathematics', 'Business'];
        const isMajor = majorKeywords.some(keyword => 
          minor.includes(keyword) && !minor.includes('Minor')
        );
        if (isMajor && !minor.includes('Minor')) {
          console.log(`Filtering out ${minor} as it appears to be a major, not a minor`);
          return false;
        }
        return true;
      }) || [];
      
      const minorPrograms = await loadMinorPrograms(actualMinors);
      updateState({ minorPrograms });

      // Store in global state
      globalLoadingState.data = {
        userProfile,
        degreeProgram,
        minorPrograms
      };
      globalLoadingState.isLoading = false;
      globalLoadingState.error = null;

      // Update local state
      updateState({ 
        isLoading: false, 
        error: null,
        isInitialized: true
      });
      
      retryCountRef.current = 0;
      console.log('All data loaded successfully');
      notifySubscribers();

    } catch (error) {
      console.error('Error loading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      
      globalLoadingState.isLoading = false;
      globalLoadingState.error = errorMessage;
      
      // Limit retry logic to prevent infinite loops
      if (retryCountRef.current < maxRetries && !errorMessage.includes('profile setup')) {
        retryCountRef.current++;
        console.log(`Retrying data load (${retryCountRef.current}/${maxRetries})`);
        setTimeout(() => loadAllData(true), 1000 * retryCountRef.current);
      } else {
        // Mark as initialized even with error to prevent infinite retries
        updateState({ 
          isLoading: false, 
          error: errorMessage,
          isInitialized: true // Changed to true to prevent loops
        });
        retryCountRef.current = 0;
      }
      notifySubscribers();
    }
  }, [user, loadUserProfile, loadDegreeProgram, loadMinorPrograms, updateState]);

  // Force reload function
  const reload = useCallback(() => {
    console.log('Forcing data reload');
    updateState({ isInitialized: false });
    loadAllData(true);
  }, [loadAllData, updateState]);

  // Subscribe to global state changes
  useEffect(() => {
    const subscriber = (globalState: any) => {
      if (globalState.data && globalLoadingState.lastUserId === user?.id) {
        updateState({
          userProfile: globalState.data.userProfile,
          degreeProgram: globalState.data.degreeProgram,
          minorPrograms: globalState.data.minorPrograms,
          isLoading: globalState.isLoading,
          error: globalState.error,
          isInitialized: !globalState.isLoading && !globalState.error
        });
      }
    };
    
    subscriberRef.current = subscriber;
    globalLoadingState.subscribers.add(subscriber);
    
    return () => {
      if (subscriberRef.current) {
        globalLoadingState.subscribers.delete(subscriberRef.current);
      }
    };
  }, [user?.id, updateState]);

  // Initialize on user change
  useEffect(() => {
    if (user?.id) {
      // Clear global cache if user changed
      if (globalLoadingState.lastUserId !== user.id) {
        console.log('User changed, clearing cache and loading data for:', user.id);
        globalLoadingState.data = null;
        globalLoadingState.error = null;
        globalLoadingState.lastUserId = user.id;
      }
      
      loadAllData(false);
    } else {
      // Clear data when user logs out
      globalLoadingState.data = null;
      globalLoadingState.error = null;
      globalLoadingState.lastUserId = null;
      
      setState({
        userProfile: null,
        degreeProgram: null,
        minorPrograms: [],
        isLoading: false,
        error: null,
        isInitialized: false
      });
    }
  }, [user?.id, loadAllData]);

  return {
    ...state,
    reload,
    loadAllData
  };
};