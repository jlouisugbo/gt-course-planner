/**
 * Enhanced Academic Record Setup Step - FIXED VERSION
 * GPA, credits, timeline, and transfer student information
 * Fixed dropdowns, padding, and sliders
 */

"use client";

import React from "react";
import { ExtendedProfileData } from "@/hooks/useProfileSetup";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Calendar, TrendingUp, GraduationCap, Clock } from "lucide-react";
import { FormError } from "@/components/ui/form-validation";

interface AcademicRecordSetupProps {
  profile: Partial<ExtendedProfileData>;
  updateProfile: <K extends keyof ExtendedProfileData>(field: K, value: ExtendedProfileData[K]) => void;
  errors: Record<string, string>;
}

export const AcademicRecordSetup: React.FC<AcademicRecordSetupProps> = ({
  profile,
  updateProfile,
  errors,
}) => {
  const currentYear = new Date().getFullYear();
  
  // Generate semester and year options
  const generateSemesterOptions = (): string[] => {
    const options: string[] = [];
    for (let year = currentYear - 3; year <= currentYear + 6; year++) {
      ['Spring', 'Summer', 'Fall'].forEach(semester => {
        options.push(`${semester} ${year}`);
      });
    }
    return options;
  };

  const generateYearOptions = (): string[] => {
    const options: string[] = [];
    for (let year = currentYear + 1; year <= currentYear + 8; year++) {
      options.push(`Spring ${year}`, `Fall ${year}`);
    }
    return options;
  };

  const semesterOptions = generateSemesterOptions();
  const graduationOptions = generateYearOptions();
  const classLevels = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

  // Safely handle plan_settings updates
  const safeUpdatePlanSettings = (updates: any) => {
    const currentSettings = profile.plan_settings || {};
    updateProfile('plan_settings', { ...currentSettings, ...updates });
  };

  // Update plan settings when relevant fields change
  const updateWithPlanSettings = <K extends keyof ExtendedProfileData>(
    field: K, 
    value: ExtendedProfileData[K]
  ) => {
    updateProfile(field, value);
    
    // Update plan_settings as well
    switch (field) {
      case 'startDate':
        safeUpdatePlanSettings({
          starting_semester: value,
          starting_year: parseInt((value as string).match(/\d{4}/)?.[0] || '') || currentYear,
          start_date: value // Also save in expected format
        });
        break;
      case 'expectedGraduation':
        safeUpdatePlanSettings({
          graduation_year: parseInt((value as string).match(/\d{4}/)?.[0] || '') || (currentYear + 4),
          expected_graduation: value // Also save in expected format
        });
        break;
      case 'currentGPA':
        safeUpdatePlanSettings({ target_gpa: Math.max(value as number, profile.plan_settings?.target_gpa || 3.5) });
        break;
      case 'isTransferStudent':
        safeUpdatePlanSettings({ is_transfer_student: value });
        break;
      case 'transferCredits':
        safeUpdatePlanSettings({ transfer_credits: value });
        break;
      case 'isDoubleMajor':
        safeUpdatePlanSettings({ is_double_major: value });
        break;
      case 'secondMajor':
        safeUpdatePlanSettings({ second_major: value });
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Academic Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-[#B3A369]" />
              Academic Timeline
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              When did you start and when do you plan to graduate?
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                Start Semester *
              </Label>
              <Select
                value={profile.startDate || ''}
                onValueChange={(value) => {
                  console.log('Start date selected:', value);
                  updateWithPlanSettings('startDate', value);
                }}
              >
                <SelectTrigger 
                  className={`h-11 ${errors.startDate ? 'border-red-300' : 'border-gray-300'}`}
                  aria-invalid={!!errors.startDate}
                >
                  <SelectValue placeholder="When did you start at GT?" />
                </SelectTrigger>
                <SelectContent className="z-[60] max-h-[300px] w-[--radix-select-trigger-width]">
                  {semesterOptions.map((semester) => (
                    <SelectItem key={semester} value={semester} className="cursor-pointer">
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={errors.startDate} />
            </div>

            {/* Expected Graduation */}
            <div className="space-y-2">
              <Label htmlFor="expectedGraduation" className="text-sm font-medium">
                Expected Graduation *
              </Label>
              <Select
                value={profile.expectedGraduation || ''}
                onValueChange={(value) => {
                  console.log('Graduation date selected:', value);
                  updateWithPlanSettings('expectedGraduation', value);
                }}
              >
                <SelectTrigger 
                  className={`h-11 ${errors.expectedGraduation ? 'border-red-300' : 'border-gray-300'}`}
                  aria-invalid={!!errors.expectedGraduation}
                >
                  <SelectValue placeholder="When will you graduate?" />
                </SelectTrigger>
                <SelectContent className="z-[60] max-h-[300px] w-[--radix-select-trigger-width]">
                  {graduationOptions.map((graduation) => (
                    <SelectItem key={graduation} value={graduation} className="cursor-pointer">
                      {graduation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={errors.expectedGraduation} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Academic Standing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-[#B3A369]" />
              Current Academic Standing
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              Your current class level and academic progress
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 px-4 space-y-4">
            {/* Class Level */}
            <div className="space-y-2">
              <Label htmlFor="year" className="text-sm font-medium">
                Current Class Level
              </Label>
              <Select
                value={profile.year || ''}
                onValueChange={(value) => updateProfile('year', value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your class level" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {classLevels.map((level) => (
                    <SelectItem key={level} value={level} className="cursor-pointer">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Credits Earned */}
            <div className="space-y-2">
              <Label htmlFor="totalCreditsEarned" className="text-sm font-medium">
                Total Credits Earned
              </Label>
              <Input
                id="totalCreditsEarned"
                type="number"
                min="0"
                max="200"
                className="h-11"
                value={profile.totalCreditsEarned || ''}
                onChange={(e) => updateProfile('totalCreditsEarned', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Total credit hours you've earned so far (including transfers)
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* GPA Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-[#B3A369]" />
              GPA Information
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              Your current GPA and target goals
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 px-4 space-y-6">
            {/* Current GPA */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">
                  Current GPA
                </Label>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {(profile.currentGPA || 0).toFixed(2)}
                </span>
              </div>
              <Slider
                value={[profile.currentGPA || 0]}
                onValueChange={(values) => {
                  console.log('GPA slider changed:', values[0]);
                  updateWithPlanSettings('currentGPA', values[0]);
                }}
                max={4.0}
                min={0}
                step={0.01}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.00</span>
                <span>4.00</span>
              </div>
            </div>

            {/* Target GPA */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">
                  Target GPA
                </Label>
                <span className="text-sm font-mono bg-[#B3A369]/10 px-2 py-1 rounded">
                  {(profile.plan_settings?.target_gpa || 3.5).toFixed(2)}
                </span>
              </div>
              <Slider
                value={[profile.plan_settings?.target_gpa || 3.5]}
                onValueChange={(values) => {
                  console.log('Target GPA slider changed:', values[0]);
                  safeUpdatePlanSettings({ target_gpa: values[0] });
                }}
                max={4.0}
                min={profile.currentGPA || 0}
                step={0.01}
                className="w-full cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                What GPA are you aiming to achieve by graduation?
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transfer Student Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="isTransferStudent"
                checked={profile.isTransferStudent || false}
                onCheckedChange={(checked) => updateWithPlanSettings('isTransferStudent', checked as boolean)}
              />
              <Label htmlFor="isTransferStudent" className="text-sm font-medium">
                I'm a transfer student
              </Label>
            </div>
            
            {profile.isTransferStudent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="transferCredits" className="text-sm font-medium">
                    Transfer Credits *
                  </Label>
                  <Input
                    id="transferCredits"
                    type="number"
                    min="0"
                    max="126"
                    className={`h-11 ${errors.transferCredits ? 'border-red-300' : 'border-gray-300'}`}
                    value={profile.transferCredits || ''}
                    onChange={(e) => updateWithPlanSettings('transferCredits', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    aria-invalid={!!errors.transferCredits}
                  />
                  <FormError error={errors.transferCredits} />
                  <p className="text-xs text-muted-foreground">
                    Number of credit hours you transferred from another institution
                  </p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-[#003057]/5 border-[#003057]/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#003057] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-[#003057]">
                  Academic Record Tips
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• <strong>Timeline:</strong> This helps us plan your semester schedule</p>
                  <p>• <strong>GPA:</strong> Use the sliders to set your current and target GPA</p>
                  <p>• <strong>Credits:</strong> Include all earned credits for accurate planning</p>
                </div>
                <p className="text-xs text-[#B3A369] font-medium">
                  ℹ️ This information is used to create a personalized graduation plan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};