"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, ArrowRight, GraduationCap } from "lucide-react";
import { useProfileSetup } from "@/hooks/useProfileSetup";

interface ProfileSetupQuickProps {
    onClose?: () => void;
}

export default function ProfileSetupQuick({ onClose }: ProfileSetupQuickProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const profileSetup = useProfileSetup();
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        major: '',
        expectedGraduation: '',
    });

    const majors = [
        'Computer Science',
        'Computer Engineering',
        'Electrical Engineering',
        'Mechanical Engineering',
        'Industrial Engineering',
        'Civil Engineering',
        'Aerospace Engineering',
        'Biomedical Engineering',
        'Chemical Engineering',
        'Nuclear Engineering',
        'Materials Science Engineering',
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'Economics',
        'Business Administration',
        'Literature, Media, and Communication',
        'Public Policy',
        'International Affairs',
    ];

    const handleNext = () => {
        if (currentStep === 1) {
            setCurrentStep(2);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            profileSetup.updateProfileBulk({
                full_name: `${formData.firstName} ${formData.lastName}`.trim(),
                major: formData.major,
                expectedGraduation: formData.expectedGraduation,
            });
            
            await profileSetup.saveProfile();
            
            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error("Error completing profile setup:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        if (onClose) {
            onClose();
        }
    };

    const canProceed = currentStep === 1 
        ? formData.firstName && formData.lastName
        : formData.major && formData.expectedGraduation;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-auto relative animate-in fade-in-0 zoom-in-95 duration-300">
                <CardHeader className="text-center space-y-4 pb-6">
                    <div className="mx-auto w-16 h-16 bg-gt-gradient rounded-full flex items-center justify-center">
                        {currentStep === 1 ? (
                            <User className="h-8 w-8 text-white" />
                        ) : (
                            <GraduationCap className="h-8 w-8 text-white" />
                        )}
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-gt-navy mb-2">
                            {currentStep === 1 ? "Welcome!" : "Academic Info"}
                        </CardTitle>
                        <p className="text-gray-600">
                            {currentStep === 1 
                                ? "Let's start with your basic information"
                                : "Tell us about your academic program"
                            }
                        </p>
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className="flex justify-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gt-navy"></div>
                        <div className={`w-2 h-2 rounded-full ${currentStep === 2 ? 'bg-gt-navy' : 'bg-gray-300'}`}></div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {currentStep === 1 ? (
                        /* Step 1: Personal Information */
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    placeholder="Enter your first name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    placeholder="Enter your last name"
                                />
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Academic Information */
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="major">Major</Label>
                                <Select 
                                    value={formData.major} 
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, major: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your major" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {majors.map((major) => (
                                            <SelectItem key={major} value={major}>
                                                {major}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="expectedGraduation">Expected Graduation</Label>
                                <Input
                                    id="expectedGraduation"
                                    value={formData.expectedGraduation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, expectedGraduation: e.target.value }))}
                                    placeholder="e.g., Spring 2026"
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6 border-t">
                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            disabled={isLoading}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Skip for now
                        </Button>
                        
                        <Button
                            onClick={handleNext}
                            disabled={!canProceed || isLoading}
                            className="bg-gt-navy hover:bg-gt-navy-700 min-w-[120px]"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : currentStep === 2 ? (
                                "Complete Setup"
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}