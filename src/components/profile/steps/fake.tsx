// components/auth/ProfileSetup.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authProvider";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CS_THREADS, COE_THREADS, CM_THREADS } from "@/lib/constants";
import {
    User,
    GraduationCap,
    Calendar,
    BookOpen,
    Target,
    Save,
    Plus,
    X,
} from "lucide-react";
import { UserProfile } from "@/types/user";
import { usePlannerStore } from "@/hooks/usePlannerStore";
import { motion } from "framer-motion";
import { getAllMajors, getAllMinors } from "@/lib/constants";

const MAJORS = getAllMajors();
const MINORS = getAllMinors();
const SEMESTERS = ["Fall", "Spring", "Summer"];
const CURRENT_YEAR = new Date().getFullYear();

interface ProfileSetupProps {
    // Make props optional for page usage
    isOpen?: boolean;
    onClose?: () => void;
    existingProfile?: Partial<UserProfile>;
    // Add page mode prop
    pageMode?: boolean;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({
    isOpen = true, // Default to true for page usage
    onClose,
    existingProfile,
    pageMode = false
}) => {
    const router = useRouter();
    const { user } = useAuth();
    const {
        updateStudentInfo,
        updateStudentThreads,
        updateStudentMinors,
        updateStudentMajor,
    } = usePlannerStore();
    
    const [step, setStep] = useState(1);
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
            case 1:
                if (!profile.name?.trim()) newErrors.name = "Name is required";
                if (!profile.email?.trim()) newErrors.email = "Email is required";
                if (!profile.gtId?.trim()) newErrors.gtId = "GT ID is required";
                if (!profile.year?.trim()) newErrors.year = "Year is required";
                break;
            case 2:
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
            case 3:
                if (!profile.startDate) newErrors.startDate = "Start date is required";
                if (!profile.expectedGraduation)
                    newErrors.expectedGraduation = "Expected graduation is required";
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [profile]);

    const handleNext = useCallback(() => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
        }
        console.log(user.id, "moving to step", step + 1);
        console.log(user.email, "moving to step", step + 1);
    }, [step, validateStep]);

    const handleBack = useCallback(() => {
        setStep(prev => prev - 1);
    }, []);

    const handleThreadToggle = useCallback((thread: string) => {
        setProfile(prev => {
            const currentThreads = prev.threads || [];
            if (currentThreads.includes(thread)) {
                return {
                    ...prev,
                    threads: currentThreads.filter((t) => t !== thread),
                };
            } else if (currentThreads.length < 2) {
                return {
                    ...prev,
                    threads: [...currentThreads, thread],
                };
            }
            return prev;
        });
    }, []);

    const handleMinorToggle = useCallback((minor: string) => {
        setProfile(prev => {
            const currentMinors = prev.minors || [];
            if (currentMinors.includes(minor)) {
                return {
                    ...prev,
                    minors: currentMinors.filter((m) => m !== minor),
                };
            } else if (currentMinors.length < 2) {
                return {
                    ...prev,
                    minors: [...currentMinors, minor],
                };
            }
            return prev;
        });
    }, []);

    const handleDoubleMajorToggle = useCallback((checked: boolean) => {
        setProfile(prev => ({
            ...prev,
            isDoubleMajor: checked,
            secondMajor: checked ? prev.secondMajor || "" : "",
            threads: [],
            minors: [],
        }));
        if (!checked) {
            setErrors((prev) => ({
                ...prev,
                secondMajor: "",
            }));
        }
    }, []);

    const handleSave = useCallback(async () => {
        if (validateStep(step)) {
            setIsLoading(true);
            try {
                if (!user) {
                    throw new Error("No authenticated user");
                }
                console.log("Saving profile for user:", user.id);
                
                // Map major to degree_program_id (you'll need to implement this mapping)
                const getDegreeId = async (major: string): Promise<number> => {
                    const { data, error } = await supabase
                        .from('degree_programs')
                        .select('id')
                        .eq('name', major)
                        .single();
                    if (error) {
                        console.error("Error fetching degree ID:", error);
                        return 1; // Default to 1 if there's an error
                    }
                    return data?.id || 1;
                };

                // Update the users table with profile information
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        full_name: profile.name,
                        gt_username: profile.gtId,
                        graduation_year: profile.expectedGraduation ? 
                            parseInt(profile.expectedGraduation.split(' ')[1]) : null,
                        degree_program_id: getDegreeId(profile.major || ""), // Proper mapping
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

                // Create complete profile for store
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

                // Update store
                updateStudentInfo(completeProfile);

                console.log("Profile saved to store successfully:", completeProfile);
                
                // Update with database fetching
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
                
                // Navigation
                console.log("pageMode:", pageMode, typeof pageMode);
                console.log("onClose:", onClose, typeof onClose);
                console.log("About to navigate - pageMode:", pageMode, "onClose:", onClose);
                
                if (pageMode) {
                    console.log("Navigating to dashboard...");
                    try {
                        console.log("Attempting to replace with /dashboard");
                        // Force a small delay to ensure database update is complete
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Try window.location as a more reliable method
                        window.location.href = '/dashboard';
                        
                        // Backup navigation method
                        // router.replace('/dashboard');
                    } catch (error) {
                        console.error("Error navigating to dashboard:", error);
                        // Fallback to home page
                        window.location.href = '/';
                    }
                } else if (onClose) {
                    console.log("Calling onClose...");
                    onClose();
                } else {
                    console.log("No navigation action taken");
                }
            } catch (error) {
                console.error("Error saving profile:", error);
                // Show error message to user
                alert("There was an error saving your profile. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
    }, [step, validateStep, profile, user, updateStudentInfo, updateStudentThreads, updateStudentMinors, updateStudentMajor, pageMode, router, onClose]);
    
const generateSemesterOptions = useMemo(() => {
        const options = [];
        for (let year = CURRENT_YEAR - 2; year <= CURRENT_YEAR + 6; year++) {
            SEMESTERS.forEach((semester) => {
                options.push(`${semester} ${year}`);
            });
        }
        return options;
    }, []);

    const getAvailableThreads = useCallback((major: string): string[] => {
        switch (major) {
            case "Computer Science":
                return Array.isArray(CS_THREADS) ? CS_THREADS : [];
            case "Computer Engineering":
            case "Computer Engineering (Dual BS)":
                return Array.isArray(COE_THREADS) ? COE_THREADS : [];
            case "Computational Media":
                return Array.isArray(CM_THREADS) ? CM_THREADS : [];
            default:
                return [];
        }
    }, []);

    if (!isOpen && !pageMode) return null;

    const content = (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Academic Profile Setup
                    </h2>
                    <p className="text-slate-600">Step {step} of 4</p>
                </div>
                {!pageMode && onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="mb-8">
                <Progress value={(step / 4) * 100} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>Personal Info</span>
                    <span>Academic Program</span>
                    <span>Timeline</span>
                    <span>Academic Record</span>
                </div>
            </div>

            {/* Step content remains the same... */}
            {step === 1 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center space-x-2 mb-4">
                        <User className="h-5 w-5 text-[#B3A369]" />
                        <h3 className="text-lg font-semibold">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                value={profile.name || ""}
                                onChange={(e) =>
                                    setProfile(prev => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="Enter your full name"
                                className={errors.name ? "border-red-500" : ""}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="year">Year *</Label>
                            <Select
                                value={profile.year || ""}
                                onValueChange={(value) =>
                                    setProfile(prev => ({
                                        ...prev,
                                        year: value,
                                    }))
                                }
                            >
                                <SelectTrigger
                                    className={errors.year ? "border-red-500" : ""}
                                >
                                    <SelectValue placeholder="Select your year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1st Year">1st Year</SelectItem>
                                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                                    <SelectItem value="4th Year">4th Year</SelectItem>
                                    <SelectItem value="5th Year">5th Year</SelectItem>
                                    <SelectItem value="6th Year">6th Year</SelectItem>
                                    <SelectItem value="5th Year+">5th Year+</SelectItem>
                                    <SelectItem value="Graduate">Graduate</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.year && (
                                <p className="text-red-500 text-sm mt-1">{errors.year}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={profile.email || ""}
                            onChange={(e) =>
                                setProfile(prev => ({
                                    ...prev,
                                    email: e.target.value,
                                }))
                            }
                            placeholder="your.email@gatech.edu"
                            className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="gtId">GT ID *</Label>
                        <Input
                            id="gtId"
                            value={profile.gtId || ""}
                            onChange={(e) =>
                                setProfile(prev => ({
                                    ...prev,
                                    gtId: e.target.value,
                                }))
                            }
                            placeholder="e.g., 903123456"
                            className={errors.gtId ? "border-red-500" : ""}
                        />
                        {errors.gtId && (
                            <p className="text-red-500 text-sm mt-1">{errors.gtId}</p>
                        )}
                    </div>
                </motion.div>
            )}

           {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center space-x-2 mb-4">
                                <GraduationCap className="h-5 w-5 text-[#B3A369]" />
                                <h3 className="text-lg font-semibold">
                                    Academic Program
                                </h3>
                            </div>

                            {/* Double Major Toggle */}
                            <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg">
                                <Checkbox
                                    checked={profile.isDoubleMajor || false}
                                    onCheckedChange={handleDoubleMajorToggle}
                                />
                                <Label className="flex items-center space-x-2">
                                    <Plus className="h-4 w-4" />
                                    <span>I am pursuing a double major</span>
                                </Label>
                            </div>

                            {/* Primary Major */}
                            <div>
                                <Label htmlFor="major">
                                    {profile.isDoubleMajor
                                        ? "Primary Major *"
                                        : "Major *"}
                                </Label>
                                <Select
                                    value={profile.major || ""}
                                    onValueChange={
                                        (value) =>
                                            setProfile(prev => ({
                                                ...prev,
                                                major: value,
                                                threads: [],
                                            })) // Reset threads when major changes
                                    }
                                >
                                    <SelectTrigger
                                        className={
                                            errors.major ? "border-red-500" : ""
                                        }
                                    >
                                        <SelectValue placeholder="Select your major" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MAJORS.map((major) => (
                                            <SelectItem
                                                key={major.value}
                                                value={major.value}
                                            >
                                                {major.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.major && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.major}
                                    </p>
                                )}
                            </div>

                            {/* Second Major */}
                            {profile.isDoubleMajor && (
                                <div>
                                    <Label htmlFor="secondMajor">
                                        Second Major *
                                    </Label>
                                    <Select
                                        value={profile.secondMajor || ""}
                                        onValueChange={
                                            (value) =>
                                                setProfile(prev => ({
                                                    ...prev,
                                                    secondMajor: value,
                                                    threads: [],
                                                })) // Reset threads when second major changes
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.secondMajor
                                                    ? "border-red-500"
                                                    : ""
                                            }
                                        >
                                            <SelectValue placeholder="Select your second major" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MAJORS
                                                .filter(
                                                    (major) =>
                                                        major.value !==
                                                        profile.major,
                                                )
                                                .map((major) => (
                                                    <SelectItem
                                                        key={major.value}
                                                        value={major.value}
                                                    >
                                                        {major.label}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.secondMajor && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.secondMajor}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Thread Selection */}
                            {(profile.major === "Computer Science" ||
                                profile.major === "Computer Engineering" ||
                                profile.major === "Computer Engineering (Dual BS)" ||
                                profile.major === "Computational Media" ||
                                (profile.isDoubleMajor &&
                                    (profile.secondMajor ===
                                        "Computer Science" ||
                                        profile.secondMajor ===
                                            "Computer Engineering" ||
                                        profile.secondMajor ===
                                            "Computer Engineering (Dual BS)" ||
                                        profile.secondMajor ===
                                            "Computational Media"))) && (
                                <div>
                                    <Label>
                                        Specialization Threads *
                                        {profile.isDoubleMajor
                                            ? ` (Select ${
                                                  getAvailableThreads(
                                                      profile.major || "",
                                                  ).length > 0 &&
                                                  getAvailableThreads(
                                                      profile.secondMajor || "",
                                                  ).length > 0
                                                      ? "4 total: 2 per major"
                                                      : "2 total"
                                              })`
                                            : " (Select exactly 2)"}
                                    </Label>
                                    <p className="text-sm text-slate-600 mb-3">
                                        Choose specialization threads for your
                                        degree program(s)
                                    </p>

                                    {/* Primary Major Threads */}
                                    {getAvailableThreads(profile.major || "")
                                        .length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="font-medium text-sm text-slate-700 mb-2">
                                                {profile.major} Threads (Select
                                                2)
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {getAvailableThreads(
                                                    profile.major || "",
                                                ).map((thread) => (
                                                    <div
                                                        key={`primary-${thread}`}
                                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                            profile.threads?.includes(
                                                                thread,
                                                            )
                                                                ? "border-[#B3A369] bg-[#B3A369]/10"
                                                                : "border-slate-200 hover:border-slate-300"
                                                        }`}
                                                        onClick={() =>
                                                            handleThreadToggle(
                                                                thread,
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                checked={
                                                                    profile.threads?.includes(
                                                                        thread,
                                                                    ) || false
                                                                }
                                                                onChange={() =>
                                                                    handleThreadToggle(
                                                                        thread,
                                                                    )
                                                                }
                                                            />
                                                            <span className="text-sm font-medium">
                                                                {thread}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Second Major Threads */}
                                    {profile.isDoubleMajor &&
                                        getAvailableThreads(
                                            profile.secondMajor || "",
                                        ).length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="font-medium text-sm text-slate-700 mb-2">
                                                    {profile.secondMajor}{" "}
                                                    Threads (Select 2)
                                                </h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {getAvailableThreads(
                                                        profile.secondMajor ||
                                                            "",
                                                    ).map((thread) => (
                                                        <div
                                                            key={`secondary-${thread}`}
                                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                                profile.threads?.includes(
                                                                    thread,
                                                                )
                                                                    ? "border-[#B3A369] bg-[#B3A369]/10"
                                                                    : "border-slate-200 hover:border-slate-300"
                                                            }`}
                                                            onClick={() =>
                                                                handleThreadToggle(
                                                                    thread,
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    checked={
                                                                        profile.threads?.includes(
                                                                            thread,
                                                                        ) ||
                                                                        false
                                                                    }
                                                                    onChange={() =>
                                                                        handleThreadToggle(
                                                                            thread,
                                                                        )
                                                                    }
                                                                />
                                                                <span className="text-sm font-medium">
                                                                    {thread}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    {errors.threads && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.threads}
                                        </p>
                                    )}

                                    <div className="mt-3">
                                        <p className="text-sm text-slate-600">
                                            Selected:{" "}
                                            {profile.threads?.length || 0}/
                                            {profile.isDoubleMajor ? "4" : "2"}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {profile.threads?.map((thread) => (
                                                <Badge
                                                    key={thread}
                                                    variant="secondary"
                                                    className="bg-[#B3A369] text-white"
                                                >
                                                    {thread}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Minor Selection */}
                            <div>
                                <Label>
                                    Minors (Optional - Select up to 2)
                                </Label>
                                <p className="text-sm text-slate-600 mb-3">
                                    Add minor programs to complement your
                                    major(s)
                                </p>
                                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                                    {MINORS.map((minor) => (
                                        <div
                                            key={minor.value}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                profile.minors?.includes(
                                                    minor.value,
                                                )
                                                    ? "border-[#B3A369] bg-[#B3A369]/10"
                                                    : "border-slate-200 hover:border-slate-300"
                                            } ${
                                                (profile.minors?.length || 0) >=
                                                    2 &&
                                                !profile.minors?.includes(
                                                    minor.value,
                                                )
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : ""
                                            }`}
                                            onClick={() => {
                                                if (
                                                    (profile.minors?.length ||
                                                        0) < 2 ||
                                                    profile.minors?.includes(
                                                        minor.value,
                                                    )
                                                ) {
                                                    handleMinorToggle(
                                                        minor.value,
                                                    );
                                                }
                                            }}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    checked={
                                                        profile.minors?.includes(
                                                            minor.value,
                                                        ) || false
                                                    }
                                                    onChange={() =>
                                                        handleMinorToggle(
                                                            minor.value,
                                                        )
                                                    }
                                                    disabled={
                                                        (profile.minors
                                                            ?.length || 0) >=
                                                            2 &&
                                                        !profile.minors?.includes(
                                                            minor.value,
                                                        )
                                                    }
                                                />
                                                <span className="text-sm font-medium">
                                                    {minor.label}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3">
                                    <p className="text-sm text-slate-600">
                                        Selected: {profile.minors?.length || 0}
                                        /2
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {profile.minors?.map((minor) => (
                                            <Badge
                                                key={minor}
                                                variant="secondary"
                                                className="bg-blue-500 text-white"
                                            >
                                                {minor}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    checked={profile.isTransferStudent || false}
                                    onCheckedChange={(checked) =>
                                        setProfile(prev => ({
                                            ...prev,
                                            isTransferStudent:
                                                checked as boolean,
                                        }))
                                    }
                                />
                                <Label>I am a transfer student</Label>
                            </div>

                            {profile.isTransferStudent && (
                                <div>
                                    <Label htmlFor="transferCredits">
                                        Transfer Credits
                                    </Label>
                                    <Input
                                        id="transferCredits"
                                        type="number"
                                        value={profile.transferCredits || 0}
                                        onChange={(e) =>
                                            setProfile(prev => ({
                                                ...prev,
                                                transferCredits:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            }))
                                        }
                                        placeholder="Number of transfer credits"
                                    />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center space-x-2 mb-4">
                                <Calendar className="h-5 w-5 text-[#B3A369]" />
                                <h3 className="text-lg font-semibold">
                                    Academic Timeline
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startDate">
                                        Start Date *
                                    </Label>
                                    <Select
                                        value={profile.startDate || ""}
                                        onValueChange={(value) =>
                                            setProfile(prev => ({
                                                ...prev,
                                                startDate: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.startDate
                                                    ? "border-red-500"
                                                    : ""
                                            }
                                        >
                                            <SelectValue placeholder="When did you start?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {generateSemesterOptions
                                                .slice(0, 20)
                                                .map((semester) => (
                                                    <SelectItem
                                                        key={semester}
                                                        value={semester}
                                                    >
                                                        {semester}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.startDate && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.startDate}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="expectedGraduation">
                                        Expected Graduation *
                                    </Label>
                                    <Select
                                        value={profile.expectedGraduation || ""}
                                        onValueChange={(value) =>
                                            setProfile(prev => ({
                                                ...prev,
                                                expectedGraduation: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.expectedGraduation
                                                    ? "border-red-500"
                                                    : ""
                                            }
                                        >
                                            <SelectValue placeholder="When do you plan to graduate?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {generateSemesterOptions
                                                .slice(10)
                                                .map((semester) => (
                                                    <SelectItem
                                                        key={semester}
                                                        value={semester}
                                                    >
                                                        {semester}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.expectedGraduation && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.expectedGraduation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center space-x-2 mb-4">
                                <BookOpen className="h-5 w-5 text-[#B3A369]" />
                                <h3 className="text-lg font-semibold">
                                    Academic Record
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="currentGPA">
                                        Current GPA
                                    </Label>
                                    <Input
                                        id="currentGPA"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="4.0"
                                        value={profile.currentGPA || ""}
                                        onChange={(e) =>
                                            setProfile(prev => ({
                                                ...prev,
                                                currentGPA:
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
                                            }))
                                        }
                                        placeholder="e.g., 3.67"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Leave blank if you&apos;re a new student
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="totalCreditsEarned">
                                        Credits Earned
                                    </Label>
                                    <Input
                                        id="totalCreditsEarned"
                                        type="number"
                                        value={profile.totalCreditsEarned || ""}
                                        onChange={(e) =>
                                            setProfile(prev => ({
                                                ...prev,
                                                totalCreditsEarned:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            }))
                                        }
                                        placeholder="e.g., 45"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Total credits completed so far
                                    </p>
                                </div>
                            </div>

                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex items-start space-x-3">
                                        <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-blue-900">
                                                Next Steps
                                            </h4>
                                            <p className="text-sm text-blue-700">
                                                Review your profile details and
                                                click &quot;Save&quot; to
                                                complete the setup.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

            <div className="flex justify-between space-x-2 mt-8">
                {step > 1 && (
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        className="bg-white hover:bg-slate-50"
                    >
                        Back
                    </Button>
                )}
                <div className="flex space-x-2 ml-auto">
                    {step < 4 && (
                        <Button
                            onClick={handleNext}
                            disabled={false}
                            className="bg-[#003057] hover:bg-[#002147]"
                        >
                            Next
                        </Button>
                    )}
                    {step === 4 && (
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-[#003057] hover:bg-[#002147]"
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Complete Setup
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    // Return different layouts based on usage mode
    if (pageMode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {content}
                </motion.div>
            </div>
        );
    }

    // Modal mode (original)
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                {content}
            </motion.div>
        </div>
    );
};

export default ProfileSetup;