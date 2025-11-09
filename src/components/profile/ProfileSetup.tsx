/**
 * Profile Setup Component - Completely Overhauled
 * Clean, modern design with proper Pattern B integration
 * Supports both page mode and modal mode
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  User,
  GraduationCap,
  BookOpen,
  Trophy,
  X,
  AlertCircle
} from "lucide-react";
import { useProfileSetup } from "@/hooks/useProfileSetup";
import { UserProfile } from "@/types";
import { CriticalErrorBoundary } from "@/components/error/GlobalErrorBoundary";

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
  const { user, loading: authLoading } = useAuth();
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

  // Step definitions
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
  const StepComponent = currentStepData?.component;

  // Loading state
  if (authLoading) {
    return (
      <div className={pageMode ? "min-h-screen" : "fixed inset-0 z-50"}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardContent className="p-8">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-gt-gold" />
                <p className="text-center text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className={pageMode ? "min-h-screen" : "fixed inset-0 z-50"}>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gt-navy rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gt-navy">Authentication Required</h3>
                  <p className="text-muted-foreground">
                    Please sign in to set up your profile and start planning your academic journey.
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-gt-navy hover:bg-gt-navy/90"
                >
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Missing step data
  if (!currentStepData || !StepComponent) {
    console.error('Invalid step:', step);
    return null;
  }

  // Render component
  return (
    <div className={pageMode
      ? "min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8"
      : "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
    }>
      {/* Modal Centering Wrapper */}
      <div className={pageMode
        ? ""
        : "min-h-full flex items-center justify-center p-4"
      }>
        {/* Main Container */}
        <div className={pageMode
          ? "container mx-auto max-w-5xl"
          : "w-full max-w-5xl my-8"
        }>
          {/* Card Wrapper */}
          <Card className="shadow-2xl border-0 relative">
            {/* Close button for modal mode */}
            {!pageMode && onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 hover:bg-gray-100"
                aria-label="Close setup"
              >
                <X className="h-5 w-5" />
              </Button>
            )}

            {/* Content */}
            <div className="p-6 lg:p-8 space-y-6">
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Title & Icon */}
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 bg-gradient-to-br from-gt-navy to-gt-gold rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  >
                    <currentStepData.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gt-navy">
                      Profile Setup
                    </h1>
                    <p className="text-lg text-muted-foreground mt-1">
                      Let&apos;s build your personalized academic plan
                    </p>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gt-navy">
                      Step {step} of {totalSteps}: {currentStepData.title}
                    </span>
                    <span className="text-sm font-medium text-gt-gold">
                      {Math.round(progressPercentage)}% Complete
                    </span>
                  </div>
                  <Progress
                    value={progressPercentage}
                    className="h-2.5 bg-gray-200"
                  />
                </div>

                {/* Step Indicators */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {steps.map((stepData) => {
                    const isActive = step === stepData.number;
                    const isCompleted = step > stepData.number;
                    const Icon = stepData.icon;

                    return (
                      <motion.div
                        key={stepData.number}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: stepData.number * 0.05 }}
                        className={`
                          relative p-4 rounded-xl border-2 transition-all duration-200
                          ${isActive
                            ? 'border-gt-gold bg-gt-gold/5 shadow-md'
                            : isCompleted
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50/50'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`
                              w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                              ${isActive
                                ? 'bg-gt-gold text-white'
                                : isCompleted
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                              }
                            `}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold leading-tight ${
                              isActive ? 'text-gt-navy' : isCompleted ? 'text-green-700' : 'text-gray-600'
                            }`}>
                              {stepData.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                              {stepData.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Step Content */}
              <CriticalErrorBoundary>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-l-4 border-l-gt-gold shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-2xl text-gt-navy flex items-center gap-2">
                          <currentStepData.icon className="h-6 w-6 text-gt-gold" />
                          {currentStepData.title}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {currentStepData.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
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

              {/* Error Display */}
              {!isValid && Object.keys(errors).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Please fix the following errors:</p>
                      <ul className="mt-2 space-y-1 text-sm text-red-700">
                        {Object.entries(errors).map(([field, error]) => (
                          <li key={field}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Saving Status */}
              {isSaving && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900">
                        Saving your profile...
                      </p>
                      <p className="text-sm text-blue-700">
                        Integrating with database and preparing your dashboard
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-2"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={prevStep}
                  disabled={step === 1 || isSaving}
                  className="flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex-1" />

                {step === totalSteps ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleSave}
                    disabled={!isValid || isSaving}
                    className="bg-gt-gold hover:bg-gt-gold/90 text-white flex items-center justify-center gap-2 px-8"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <CheckCircle className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    onClick={nextStep}
                    disabled={!isValid || isSaving}
                    className="bg-gt-navy hover:bg-gt-navy/90 text-white flex items-center justify-center gap-2 px-8"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
