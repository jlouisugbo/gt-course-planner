import { useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { usePlannerStore } from '@/hooks/usePlannerStore';

/**
 * Hook to initialize the planner store with user data when they log in
 */
export const usePlannerInitialization = () => {
    const { user, userRecord } = useAuth();
    const plannerStore = usePlannerStore();
    const isInitializedRef = useRef(false);
    const lastUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        const initializeStore = async () => {
            if (!user || !userRecord) {
                isInitializedRef.current = false;
                lastUserIdRef.current = null;
                return;
            }

            // Reset if user changed
            if (lastUserIdRef.current !== user.id) {
                console.log('User changed, resetting initialization flag');
                isInitializedRef.current = false;
                lastUserIdRef.current = user.id;
            }

            // Prevent multiple initializations for the same user
            if (isInitializedRef.current) {
                console.log('Planner store already initialized for this user, skipping');
                return;
            }

            console.log('Initializing planner store for user:', user.id);

            // Check if we already have data in the store
            const existingProfile = (plannerStore as any).userProfile;
            const existingSemesters = (plannerStore as any).semesters || {};

            // If no existing data or user has changed, initialize from database
            if (!existingProfile || Object.keys(existingSemesters).length === 0) {
                console.log('No existing planner data, initializing from user record');
                
                // Initialize with user record data
                const userProfile = {
                    id: Number(user.id),
                    name: userRecord.full_name || '',
                    email: userRecord.email || user.email || '',
                    gtId: userRecord.gt_id || 0,
                    major: userRecord.major || '',
                    secondMajor: userRecord.second_major,
                    isDoubleMajor: !!userRecord.second_major,
                    threads: Array.isArray(userRecord.threads) ? userRecord.threads : [],
                    minors: Array.isArray(userRecord.minors) ? userRecord.minors : [],
                    startDate: userRecord.start_date || '',
                    expectedGraduation: userRecord.expected_graduation || '',
                    currentGPA: userRecord.current_gpa || 0,
                    year: userRecord.year || '',
                    totalCreditsEarned: userRecord.total_credits_earned || 0,
                    isTransferStudent: userRecord.is_transfer_student || false,
                    transferCredits: userRecord.transfer_credits,
                    createdAt: new Date(userRecord.created_at || Date.now()),
                    updatedAt: new Date(userRecord.updated_at || Date.now()),
                };

                // Update store with user profile
                plannerStore.updateStudentInfo(userProfile);

                // Initialize store-specific data
                await plannerStore.initializeStore();

                console.log('Planner store initialized with user data');
                isInitializedRef.current = true;
            } else {
                console.log('Existing planner data found, skipping initialization');
                isInitializedRef.current = true;
            }
        };

        initializeStore().catch(error => {
            console.error('Error initializing planner store:', error);
        });
    }, [user, userRecord, plannerStore]);

    return plannerStore;
};