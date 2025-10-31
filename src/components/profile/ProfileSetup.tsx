/**
 * Profile Setup Component
 * COMPLETELY INTEGRATED with database and Zustand store
 * Ensures profile data flows to the entire application
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowRight, ArrowLeft, User, GraduationCap, BookOpen, Trophy } from "lucide-react";
import { useProfileSetup } from "@/hooks/useProfileSetup";
import { UserProfile } from "@/types";
import { CriticalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import { syncUserProfile } from "@/lib/profileSync";

// Import step components
import { InfoSetup } from "./steps/InfoSetup";
import { AcademicProgramSetup } from "./steps/AcademicProgramSetup";
import { AcademicRecordSetup } from "./steps/AcademicRecordSetup";
import { CourseCompletionSetup } from "./steps/CourseCompletionSetup";

interface ProfileSetupProps {
  existingProfile?: Partial<UserProfile>;
  pageMode?: boolean;
  onClose?: () => void;
  isOpen?: boolean;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({
  existingProfile,
  pageMode = false,
  onClose,
}) => {
  const { user } = useAuth();
  const {
    profile,
    errors,
    step,
    isSaving,
    updateProfile,
    nextStep,
    prevStep,
    handleSave,
    totalSteps,
    progressPercentage,
    isValid,
  } = useProfileSetup(existingProfile, onClose);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please sign in to set up your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = [
    {
      number: 1,
      title: "Personal Information",
      description: "Basic details about you",
      icon: User,
      component: InfoSetup,
    },
    {
      number: 2,
      title: "Academic Program",
      description: "Your major, threads, and minors",
      icon: GraduationCap,
      component: AcademicProgramSetup,
    },
    {
      number: 3,
      title: "Academic Record",
      description: "GPA, credits, and timeline",
      icon: BookOpen,
      component: AcademicRecordSetup,
    },
    {
      number: 4,
      title: "Course History",
      description: "Completed and planned courses",
      icon: Trophy,
      component: CourseCompletionSetup,
    },
  ];

  const currentStepData = steps[step - 1];
  const StepComponent = currentStepData.component;

  const containerClass = pageMode 
    ? "min-h-screen bg-gradient-to-br from-blue-50 to-white" 
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40";

  const cardClass = pageMode 
    ? "container mx-auto px-4 py-6 max-w-4xl relative z-10" 
    : "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-10";

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        <div className="p-4 lg:p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            <div className="flex items-center gap-4 mb-3">
              <div 
                className="w-12 h-12 bg-gradient-to-br from-[#003057] to-[#B3A369] rounded-xl flex items-center justify-center flex-shrink-0"
                role="img"
                aria-label={`Step ${step} icon: ${currentStepData.title}`}
              >
                <currentStepData.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#003057] break-words">
                  GT Course Planner Setup
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Let&apos;s set up your academic profile for personalized planning
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-4" role="region" aria-label="Setup progress">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="text-sm font-medium text-[#003057]" id="current-step-label">
                  Step {step} of {totalSteps}: {currentStepData.title}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progressPercentage)}% Complete
                </span>
              </div>
              <Progress 
                value={progressPercentage} 
                className="h-3" 
                aria-labelledby="current-step-label"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPercentage}
              />
            </div>

            {/* Step Navigation */}
            <nav
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-3"
              role="navigation"
              aria-label="Setup steps navigation"
            >
              {steps.map((stepData) => {
                const isActive = step === stepData.number;
                const isCompleted = step > stepData.number;
                const Icon = stepData.icon;

                return (
                  <motion.div
                    key={stepData.number}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: stepData.number * 0.1 }}
                    className={`
                      relative p-3 rounded-lg border-2 transition-all duration-200 min-h-[80px]
                      ${isActive
                        ? 'border-[#B3A369] bg-[#B3A369]/10'
                        : isCompleted
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                      }
                    `}
                    role="status"
                    aria-label={`Step ${stepData.number}: ${stepData.title} - ${isActive ? 'Current' : isCompleted ? 'Completed' : 'Upcoming'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                          ${isActive 
                            ? 'bg-[#B3A369] text-white' 
                            : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-300 text-gray-600'
                          }
                        `}
                        role="img"
                        aria-label={isCompleted ? 'Completed step' : isActive ? 'Current step' : 'Upcoming step'}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium break-words ${
                          isActive ? 'text-[#003057]' : isCompleted ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {stepData.title}
                        </p>
                        <p className="text-xs text-muted-foreground break-words">
                          {stepData.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </nav>
          </motion.div>

          {/* Step Content */}
          <CriticalErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-3"
              >
                <Card className="border-l-4 border-l-[#B3A369]">
                  <CardHeader className="py-2">
                    <CardTitle className="text-xl text-[#003057]">
                      {currentStepData.title}
                    </CardTitle>
                    <CardDescription className="py-1">
                      {currentStepData.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-2">
                    <StepComponent
                      profile={profile}
                      updateProfile={updateProfile}
                      errors={errors}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </CriticalErrorBoundary>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4"
          >
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1 || isSaving}
              className="flex items-center justify-center gap-2 min-h-[44px] order-2 sm:order-1"
              aria-label={`Go to previous step: ${step > 1 ? steps[step - 2]?.title : ''}`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 order-1 sm:order-2">
              {!isValid && Object.keys(errors).length > 0 && (
                <div 
                  className="text-sm text-red-600 text-center sm:text-right"
                  role="alert"
                  aria-live="polite"
                >
                  Please fix the errors above to continue
                </div>
              )}
              
              {step === totalSteps ? (
                <Button
                  type="button"
                  onClick={async () => {
                    await handleSave();
                    // Ensure profile syncs after save
                    setTimeout(async () => {
                      await syncUserProfile();
                    }, 500);
                  }}
                  disabled={!isValid || isSaving}
                  className="bg-[#B3A369] hover:bg-[#B3A369]/90 text-white flex items-center justify-center gap-2 px-8 min-h-[44px]"
                  aria-describedby={isSaving ? 'saving-status' : undefined}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span id="saving-status">Setting up your profile...</span>
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!isValid || isSaving}
                  className="bg-[#003057] hover:bg-[#003057]/90 text-white flex items-center justify-center gap-2 min-h-[44px]"
                  aria-label={`Continue to next step: ${steps[step]?.title}`}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </motion.div>

          {/* Integration Status */}
          {isSaving && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    Integrating your profile data...
                  </p>
                  <p className="text-sm text-blue-700">
                    Saving to database, updating planner, and preparing your dashboard
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;