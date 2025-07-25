// hooks/useProfileSetup.ts - Updated with your profile structure and auth integration
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UserProfile } from "@/types";
import { usePlannerStore } from "@/hooks/usePlannerStore";
import { useAuth } from "@/providers/AuthProvider";

export const useProfileSetup = (
    user: any, 
    existingProfile?: Partial<UserProfile>, 
    pageMode = false, 
    onClose?: () => void
) => {
    const { refreshUserRecord } = useAuth();
    const {
        updateStudentInfo,
        updateStudentThreads,
        updateStudentMinors,
        updateStudentMajor,
    } = usePlannerStore();

    const [profile, setProfile] = useState<Partial<UserProfile>>(() => ({
        name: user?.user_metadata?.full_name || "",
        email: user?.email || "",
        gtId: 0,
        major: "",
        secondMajor: "",
        threads: [],
        minors: [],
        startDate: "",
        expectedGraduation: "",
        currentGPA: 0,
        totalCreditsEarned: 0,
        isTransferStudent: false,
        transferCredits: 0,
        isDoubleMajor: false,
        year: "",
        completedCourses: [],
        completedGroups: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...existingProfile,
    }));

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateStep = useCallback((stepNumber: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (stepNumber) {
            case 1: // Personal Info Step
                if (!profile.name?.trim()) newErrors.name = "Name is required";
                if (!profile.email?.trim()) newErrors.email = "Email is required";
                if (!profile.gtId) newErrors.gtId = "GT ID is required";
                if (!profile.year?.trim()) newErrors.year = "Year is required";
                break;
            
            case 2: // Academic Program Step
                if (!profile.major) newErrors.major = "Major is required";
                if (profile.isDoubleMajor && !profile.secondMajor) {
                    newErrors.secondMajor = "Second major is required for double major";
                }
                if (
                    profile.major === "Computer Science" &&
                    profile.threads?.length !== 2
                ) {
                    newErrors.threads = "CS students must select exactly 2 threads";
                }
                break;
            
            case 3: // Academic Info Step (Timeline + Record)
                if (!profile.startDate) newErrors.startDate = "Start date is required";
                if (!profile.expectedGraduation)
                    newErrors.expectedGraduation = "Expected graduation is required";
                // GPA and credits are optional, so no validation needed
                break;
            
            case 4: // Course Completion Step
                // No validation needed - all fields are optional
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [profile]);

    const handleSave = useCallback(async () => {
        // Validate the final step (step 4) before saving
        if (!validateStep(4)) {
            console.error('Validation failed for step 4');
            return;
        }

        if (!user) {
            console.error("No authenticated user");
            setErrors({ general: "No authenticated user" });
            return;
        }

        setIsLoading(true);
        
        try {
            console.log("Saving profile for user:", user.id);
            
            // Fixed and improved getDegreeId function
            const getDegreeId = async (major: string): Promise<number | null> => {
                if (!major || major.trim() === '') {
                    console.log("No major provided, returning null");
                    return null;
                }
                
                try {
                    // Try exact match first
                    const { data, error } = await supabase
                        .from('degree_programs')
                        .select('id')
                        .eq('name', major.trim())
                        .eq('is_active', true)
                        .single();
                    
                    if (!error && data) {
                        console.log(`Found exact match for ${major}: ${data.id}`);
                        return data.id;
                    }
                    
                    // If exact match fails, try case-insensitive search
                    const { data: fuzzyData, error: fuzzyError } = await supabase
                        .from('degree_programs')
                        .select('id, name')
                        .ilike('name', major.trim())
                        .eq('is_active', true)
                        .single();
                    
                    if (!fuzzyError && fuzzyData) {
                        console.log(`Found case-insensitive match for ${major}: ${fuzzyData.name} (${fuzzyData.id})`);
                        return fuzzyData.id;
                    }
                    
                    // If still no match, try partial matching
                    const { data: partialData, error: partialError } = await supabase
                        .from('degree_programs')
                        .select('id, name')
                        .ilike('name', `%${major.trim()}%`)
                        .eq('is_active', true)
                        .limit(1);
                    
                    if (!partialError && partialData && partialData.length > 0) {
                        console.log(`Found partial match for ${major}: ${partialData[0].name} (${partialData[0].id})`);
                        return partialData[0].id;
                    }
                    
                    console.warn(`No degree program found for: ${major}`);
                    return null;
                    
                } catch (error) {
                    console.error("Exception in getDegreeId:", error);
                    return null;
                }
            };

            // PROPERLY AWAIT the getDegreeId call
            const degreeId = await getDegreeId(profile.major || "");
            
            // Optional: Warn if we couldn't find the degree program
            if (profile.major && !degreeId) {
                console.warn(`Could not find degree program for major: ${profile.major}`);
            }

            // Update the users table with profile information (NEW: using major text and minors JSON)
            const { data, error: updateError } = await supabase
                .from('users')
                .update({
                    full_name: profile.name,
                    gt_username: profile.gtId,
                    graduation_year: profile.expectedGraduation ? 
                        parseInt(profile.expectedGraduation.split(' ')[1]) : null,
                    major: profile.major || null, // Save major as text
                    minors: profile.minors || [], // Save minors as JSON array
                    selected_threads: profile.threads || [],
                    completed_courses: profile.completedCourses || [], // Save completed courses
                    completed_groups: profile.completedGroups || [], // Save completed groups
                    plan_settings: {
                        ...profile,
                        plan_name: "My 4-Year Plan",
                        starting_semester: profile.startDate || "Fall 2024",
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('auth_id', user.id)
                .select()
                .single();

            if (updateError) {
                console.error("Database update error:", updateError);
                throw updateError;
            }
            
            console.log("Profile updated in database successfully:", data);

            // Refresh the user record in the auth context
            await refreshUserRecord();

            const completeProfile: UserProfile = {
                id: user.id,
                name: profile.name || "",
                email: profile.email || "",
                gtId: profile.gtId || 0,
                major: profile.major || "",
                secondMajor: profile.secondMajor,
                isDoubleMajor: profile.isDoubleMajor,
                threads: profile.threads || [],
                minors: profile.minors || [],
                startDate: profile.startDate || "",
                expectedGraduation: profile.expectedGraduation || "",
                currentGPA: profile.currentGPA || 0,
                year: profile.year || "",
                totalCreditsEarned: profile.totalCreditsEarned || 0,
                isTransferStudent: profile.isTransferStudent || false,
                transferCredits: profile.transferCredits,
                completedCourses: profile.completedCourses || [],
                completedGroups: profile.completedGroups || [],

                createdAt: profile.createdAt || new Date(),
                updatedAt: new Date(),
            };

            // Update the store
            updateStudentInfo(completeProfile);
            console.log("Profile saved to store successfully:", completeProfile);
            
            if (completeProfile.threads && completeProfile.threads.length > 0) {
                const threadIds = await Promise.all(
                    completeProfile.threads.map(async (threadName) => {
                        const { data, error } = await supabase
                            .from('threads') // or 'degree_programs' if threads are stored there
                            .select('id')
                            .eq('name', threadName)
                            .single();
                        
                        if (error || !data) {
                            console.warn(`Could not find thread ID for: ${threadName}`);
                            return null;
                        }
                        return data.id;
                    })
                );
            const validThreadIds = threadIds.filter((id): id is number => id !== null);
                if (validThreadIds.length > 0) {
                    await updateStudentThreads(validThreadIds);
                }
            }

            if (completeProfile.minors && completeProfile.minors.length > 0) {
                // Convert minor names to minor IDs (same pattern as threads)
                const minorIds = await Promise.all(
                    completeProfile.minors.map(async (minorName) => {
                        const { data, error } = await supabase
                            .from('degree_programs') // assuming minors are in degree_programs table
                            .select('id')
                            .eq('name', minorName)
                            .eq('is_active', true) // add this filter if relevant
                            .single();
                        
                        if (error || !data) {
                            console.warn(`Could not find minor ID for: ${minorName}`);
                            return null;
                        }
                        return data.id;
                    })
                );
                
                const validMinorIds = minorIds.filter((id): id is number => id !== null);
                if (validMinorIds.length > 0) {
                    await updateStudentMinors(validMinorIds);
                }
            }
            if (completeProfile.major) {
                await updateStudentMajor(completeProfile.major);
            }
            if (completeProfile.secondMajor) {
                await updateStudentMajor(completeProfile.secondMajor);
            }

            console.log("All profile updates completed successfully");
            
            // Handle navigation/closing
            if (pageMode) {
                console.log("Navigating to dashboard...");
                try {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    window.location.href = '/dashboard';
                } catch (error) {
                    console.error("Error navigating to dashboard:", error);
                    window.location.href = '/';
                }
            } else if (onClose) {
                console.log("Calling onClose...");
                onClose();
            }

        } catch (error) {
            console.error("Error saving profile:", error);
            setErrors({ general: "There was an error saving your profile. Please try again." });
        } finally {
            setIsLoading(false);
        }
    }, [validateStep, profile, user, updateStudentInfo, updateStudentThreads, updateStudentMinors, updateStudentMajor, pageMode, onClose, refreshUserRecord]);
      
    return {
        profile,
        setProfile,
        errors,
        setErrors,
        isLoading,
        validateStep,
        handleSave
    };
};