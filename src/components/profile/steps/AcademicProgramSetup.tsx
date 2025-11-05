/**
 * Enhanced Academic Program Setup Step
 * Major, threads, and minors selection with real-time validation
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Plus, X, BookOpen, Award } from "lucide-react";
import { FormError, FormLoadingSpinner } from "@/components/ui/form-validation";
import { ExtendedProfileData } from "@/hooks/useProfileSetup";
import { supabase } from "@/lib/supabaseClient";
import { majors as constantMajors, minors as constantMinors, CS_THREADS, COE_THREADS } from "@/lib/constants";

interface AcademicProgramSetupProps {
  profile: Partial<ExtendedProfileData>;
  updateProfile: <K extends keyof ExtendedProfileData>(field: K, value: ExtendedProfileData[K]) => void;
  errors: Record<string, string>;
}

export const AcademicProgramSetup: React.FC<AcademicProgramSetupProps> = ({
  profile,
  updateProfile,
  errors,
}) => {
  const [availableMajors, setAvailableMajors] = useState<string[]>([]);
  const [availableThreads, setAvailableThreads] = useState<string[]>([]);
  const [availableMinors, setAvailableMinors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newThread, setNewThread] = useState('');
  const [newMinor, setNewMinor] = useState('');

  // Load available programs from database
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Loading programs from database...');
        
        // Get all degree programs
        const { data: programs, error } = await supabase
          .from('degree_programs')
          .select('name, degree_type')
          .eq('is_active', true)
          .order('name');

        console.log('📊 Raw programs data:', { programs, error });

        if (error) {
          console.error('❌ Database error:', error);
          throw error;
        }

        if (!programs || programs.length === 0) {
          console.warn('⚠️ No programs returned from database');
          throw new Error('No programs found');
        }

        // Show all degree types to understand the data
  const degreeTypes = [...new Set(programs.map((p: any) => p.degree_type))];
        console.log('📋 Available degree types:', degreeTypes);

        const majors = programs
          ?.filter((p: any) => p.degree_type === 'BS' || p.degree_type === 'Major')
          .map((p: any) => p.name) || [];
          
        const threads = programs
          ?.filter((p: any) => p.degree_type === 'Thread')
          .map((p: any) => p.name) || [];
          
        const minors = programs
          ?.filter((p: any) => p.degree_type === 'Minor')
          .map((p: any) => p.name) || [];

        console.log('✅ Filtered programs:', { 
          majors: { count: majors.length, sample: majors.slice(0, 3) },
          threads: { count: threads.length, sample: threads.slice(0, 3) },
          minors: { count: minors.length, sample: minors.slice(0, 3) }
        });

        // Ensure we have some data, use comprehensive constants if needed
        if (majors.length === 0) {
          console.warn('🔄 No majors found in database, using complete GT major list');
          const fallbackMajors = constantMajors.map(major => major.value);
          console.log(`📚 Using ${fallbackMajors.length} majors from constants`);
          setAvailableMajors(fallbackMajors);
        } else {
          setAvailableMajors(majors);
        }

        if (threads.length === 0) {
          console.warn('🔄 No threads found in database, using CS threads from constants');
          // Deduplicate threads when combining CS and COE threads
          const fallbackThreads = [...new Set([...CS_THREADS, ...COE_THREADS])];
          console.log(`📚 Using ${fallbackThreads.length} unique threads from constants`);
          setAvailableThreads(fallbackThreads);
        } else {
          // Also deduplicate threads from database to avoid any duplicates
          const uniqueThreads = [...new Set(threads)] as string[];
          setAvailableThreads(uniqueThreads);
        }

        if (minors.length === 0) {
          console.warn('🔄 No minors found in database, using complete GT minor list');
          // Deduplicate minors in case of any duplicates
          const fallbackMinors = [...new Set(constantMinors.map(minor => minor.value))];
          console.log(`📚 Using ${fallbackMinors.length} unique minors from constants`);
          setAvailableMinors(fallbackMinors);
        } else {
          // Also deduplicate minors from database to avoid any duplicates
          const uniqueMinors = [...new Set(minors)] as string[];
          setAvailableMinors(uniqueMinors);
        }
        
      } catch (error) {
        console.error('❌ Error loading programs:', error);
        // Set comprehensive fallback data from constants
        console.log('🔄 Using complete GT program data from constants due to error');
        
        const fallbackMajors = constantMajors.map(major => major.value);
        // Deduplicate threads when combining CS and COE threads
        const fallbackThreads = [...new Set([...CS_THREADS, ...COE_THREADS])];
        // Deduplicate minors in case of any duplicates
        const fallbackMinors = [...new Set(constantMinors.map(minor => minor.value))];
        
        console.log(`📚 Fallback data: ${fallbackMajors.length} majors, ${fallbackThreads.length} unique threads, ${fallbackMinors.length} minors`);
        
        setAvailableMajors(fallbackMajors);
        setAvailableThreads(fallbackThreads);
        setAvailableMinors(fallbackMinors);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrograms();
  }, []);

  const addThread = () => {
    if (newThread && !profile.threads?.includes(newThread)) {
      const updatedThreads = [...(profile.threads || []), newThread];
      updateProfile('threads', updatedThreads);
      setNewThread('');
    }
  };

  const removeThread = (threadToRemove: string) => {
    const updatedThreads = profile.threads?.filter(t => t !== threadToRemove) || [];
    updateProfile('threads', updatedThreads);
  };

  const addMinor = () => {
    if (newMinor && !profile.minors?.includes(newMinor)) {
      const updatedMinors = [...(profile.minors || []), newMinor];
      updateProfile('minors', updatedMinors);
      setNewMinor('');
    }
  };

  const removeMinor = (minorToRemove: string) => {
    const updatedMinors = profile.minors?.filter(m => m !== minorToRemove) || [];
    updateProfile('minors', updatedMinors);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <FormLoadingSpinner size="md" />
          <span className="text-muted-foreground">Loading programs...</span>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('AcademicProgramSetup render:', {
    availableMajors: availableMajors.length,
    availableThreads: availableThreads.length,
    availableMinors: availableMinors.length,
    profileMajor: profile.major,
    profileThreads: profile.threads,
    profileMinors: profile.minors
  });

  return (
    <div className="space-y-3">
      {/* Major Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`transition-all duration-200 ${errors.major ? 'border-red-300 bg-red-50/50' : 'hover:shadow-md'}`}>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-[#B3A369]" />
              Primary Major *
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              Select your primary degree program at Georgia Tech
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <Select
              value={profile.major || ''}
              onValueChange={(value) => {
                console.log('Major selected:', value);
                updateProfile('major', value);
              }}
            >
              <SelectTrigger 
                className={`h-11 ${errors.major ? 'border-red-300' : 'border-gray-300'}`}
                aria-invalid={!!errors.major}
                aria-describedby={errors.major ? 'major-error' : undefined}
              >
                <SelectValue placeholder="Choose your major" />
              </SelectTrigger>
              <SelectContent className="z-[60] max-h-[300px] w-[--radix-select-trigger-width]">
                {availableMajors.length > 0 ? (
                  availableMajors.map((major) => (
                    <SelectItem key={major} value={major} className="cursor-pointer">
                      {major}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="no-majors">No majors available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormError error={errors.major} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Double Major Option */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDoubleMajor"
                checked={profile.isDoubleMajor || false}
                onCheckedChange={(checked) => updateProfile('isDoubleMajor', checked as boolean)}
              />
              <Label htmlFor="isDoubleMajor" className="text-sm font-medium">
                I&apos;m pursuing a double major
              </Label>
            </div>
            
            {profile.isDoubleMajor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
                <Select
                  value={profile.secondMajor || ''}
                  onValueChange={(value) => updateProfile('secondMajor', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose your second major" />
                  </SelectTrigger>
                  <SelectContent className="z-[60] max-h-[300px] w-[--radix-select-trigger-width]">
                    {availableMajors
                      .filter(major => major !== profile.major)
                      .map((major) => (
                        <SelectItem key={major} value={major}>
                          {major}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Threads Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-[#B3A369]" />
              Threads
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              Select your areas of specialization (typically 2 threads required for CS)
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 px-4 space-y-3">
            {/* Current Threads */}
            {profile.threads && profile.threads.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Threads:</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.threads.map((thread) => (
                    <Badge
                      key={thread}
                      variant="secondary"
                      className="flex items-center gap-1 bg-[#B3A369]/10 text-[#003057] border-[#B3A369]/20"
                    >
                      {thread}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeThread(thread)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Add Thread */}
            <div className="flex gap-2">
              <Select value={newThread} onValueChange={setNewThread}>
                <SelectTrigger className="flex-1 h-11">
                  <SelectValue placeholder="Choose a thread to add" />
                </SelectTrigger>
                <SelectContent className="z-[60] max-h-[300px] w-[--radix-select-trigger-width]">
                  {availableThreads
                    .filter(thread => !profile.threads?.includes(thread))
                    .map((thread) => (
                      <SelectItem key={thread} value={thread}>
                        {thread}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={addThread}
                disabled={!newThread}
                className="bg-[#B3A369] hover:bg-[#B3A369]/90"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Minors Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-[#B3A369]" />
              Minors
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              Add any minors you're pursuing (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 px-4 space-y-3">
            {/* Current Minors */}
            {profile.minors && profile.minors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Minors:</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.minors.map((minor) => (
                    <Badge
                      key={minor}
                      variant="secondary"
                      className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {minor}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeMinor(minor)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Add Minor */}
            <div className="flex gap-2">
              <Select value={newMinor} onValueChange={setNewMinor}>
                <SelectTrigger className="flex-1 h-11">
                  <SelectValue placeholder="Choose a minor to add" />
                </SelectTrigger>
                <SelectContent className="z-[60] max-h-[300px] w-[--radix-select-trigger-width]">
                  {availableMinors
                    .filter(minor => !profile.minors?.includes(minor))
                    .map((minor) => (
                      <SelectItem key={minor} value={minor}>
                        {minor}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={addMinor}
                disabled={!newMinor}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-[#003057]">
                  About Academic Programs
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• <strong>Major:</strong> Your primary degree program (e.g., Computer Science)</p>
                  <p>• <strong>Threads:</strong> Areas of specialization within your major (usually 2 required)</p>
                  <p>• <strong>Minors:</strong> Additional areas of study outside your major (optional)</p>
                </div>
                <p className="text-xs text-[#B3A369] font-medium">
                  ℹ️ This information helps us provide personalized course recommendations and track your progress
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};