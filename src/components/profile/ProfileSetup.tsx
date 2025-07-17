"use client";

import React, { useState, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import { UserProfile } from "@/types";
import { motion } from "framer-motion";
import { useProfileSetup } from "@/hooks/useProfileSetup";
import { InfoSetup } from "./steps/InfoSetup";
import { AcademicProgramSetup } from "./steps/AcademicProgramSetup";
import { AcademicRecordSetup } from "./steps/AcademicRecordSetup";

interface ProfileSetupProps {
    isOpen?: boolean;
    onClose?: () => void;
    existingProfile?: Partial<UserProfile>;
    pageMode?: boolean;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({
    isOpen = true,
    onClose,
    existingProfile,
    pageMode = false,
}) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);

    const { profile, setProfile, errors, isLoading, validateStep, handleSave } =
        useProfileSetup(user, existingProfile, pageMode, onClose);

    const handleNext = useCallback(() => {
        if (validateStep(step)) {
            setStep((prev) => prev + 1);
        }
    }, [step, validateStep]);

    const handleBack = useCallback(() => {
        setStep((prev) => prev - 1);
    }, []);

    if (!isOpen && !pageMode) return null;

    const content = (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Academic Profile Setup
                    </h2>
                    <p className="text-slate-600">Step {step} of 3</p>
                </div>
                {!pageMode && onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="mb-8">
                <Progress value={(step / 3) * 100} className="h-2" />

                <div className="relative mt-6">
                    <div className="flex items-center justify-between text-base text-slate-500 relative">
                        {/* Step 1 */}
                        <div className="flex-1 flex items-center">
        <span className={step === 1 ? "text-slate-800 font-medium text-xl" : ""}>
          Personal Info
        </span>
                            <div className="flex-1 h-px bg-slate-300 mx-2"></div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex-1 flex items-center justify-center">
        <span className={step === 2 ? "text-slate-800 font-medium text-xl" : ""}>
          Academic Program
        </span>
                            <div className="flex-1 h-px bg-slate-300 mx-2"></div>
                        </div>

                        {/* Step 3 */}
                        <div>
        <span className={step === 3 ? "text-slate-800 font-medium text-xl" : ""}>
          Academic Record
        </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Components */}
            {step === 1 && (
                <InfoSetup
                    profile={profile}
                    setProfile={setProfile}
                    errors={errors}
                />
            )}

            {step === 2 && (
                <AcademicProgramSetup
                    profile={profile}
                    setProfile={setProfile}
                    errors={errors}
                />
            )}

            {step === 3 && (
                <AcademicRecordSetup
                    profile={profile}
                    setProfile={setProfile}
                    errors={errors}
                />
            )}

            {/* Navigation */}
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
                    {step < 3 && (
                        <Button
                            onClick={handleNext}
                            className="bg-[#003057] hover:bg-[#b3a369] text-white"
                        >
                            Next
                        </Button>
                    )}
                    {step === 3 && (
                        <Button
                            onClick={() => handleSave()}
                            disabled={isLoading}
                            className="bg-[#003057] hover:bg-[#b3a369] text-white"
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    // Layout wrapper
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
