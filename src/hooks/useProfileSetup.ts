import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UserProfile } from "@/types/user";
import { usePlannerStore } from "@/hooks/usePlannerStore";

export const useProfileSetup = (user: any, existingProfile?: Partial<UserProfile>, pageMode = false, onClose?: () => void) => {
  const {
    updateStudentInfo,
    updateStudentThreads,
    updateStudentMinors,
    updateStudentMajor,
  } = usePlannerStore();

  const [profile, setProfile] = useState<Partial<UserProfile>>(() => ({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    gtId: "",
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
        if (!profile.gtId?.trim()) newErrors.gtId = "GT ID is required";
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [profile]);

  const handleSave = useCallback(async () => {
    // Validate the final step (step 3) before saving
    if (validateStep(3)) {
        setIsLoading(true);
        try {
            if (!user) {
                throw new Error("No authenticated user");
            }
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
                // You could add user notification here if needed
            }

            // Update the users table with profile information
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    full_name: profile.name,
                    gt_username: profile.gtId,
                    graduation_year: profile.expectedGraduation ? 
                        parseInt(profile.expectedGraduation.split(' ')[1]) : null,
                    degree_program_id: degreeId, // Now properly awaited and can be null
                    selected_threads: profile.threads || [],
                    plan_settings: {
                        ...profile,
                        plan_name: "My 4-Year Plan",
                        starting_semester: profile.startDate || "Fall 2024",
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('auth_id', user.id);

            if (updateError) {
                console.error("Database update error:", updateError);
                throw updateError;
            }
            
            console.log("Profile updated in database successfully");

            // Create complete profile object
            const completeProfile: UserProfile = {
                id: user.id,
                name: profile.name || "",
                email: profile.email || "",
                gtId: profile.gtId || "",
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
                advisorName: profile.advisorName,
                advisorEmail: profile.advisorEmail,
                createdAt: profile.createdAt || new Date(),
                updatedAt: new Date(),
            };

            // Update the store
            updateStudentInfo(completeProfile);
            console.log("Profile saved to store successfully:", completeProfile);
            
            if (completeProfile.threads && completeProfile.threads.length > 0) {
                await updateStudentThreads(completeProfile.threads);
            }
            if (completeProfile.minors && completeProfile.minors.length > 0) {
                await updateStudentMinors(completeProfile.minors);
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
            alert("There was an error saving your profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }
}, [validateStep, profile, user, updateStudentInfo, updateStudentThreads, updateStudentMinors, updateStudentMajor, pageMode, onClose]);
      
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