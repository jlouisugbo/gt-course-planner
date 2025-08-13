/**
 * Enhanced Course Completion Setup Step
 * Course history and completion tracking with database integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, X, Upload, FileText, CheckCircle, Trophy } from "lucide-react";
import { /* FormLoadingSpinner, */ FormSubmitState } from "@/components/ui/form-validation";
import { ExtendedProfileData } from "@/hooks/useProfileSetup";
import { userDataService } from "@/lib/database/userDataService";

interface CourseCompletionSetupProps {
  profile: Partial<ExtendedProfileData>;
  updateProfile: <K extends keyof ExtendedProfileData>(field: K, value: ExtendedProfileData[K]) => void;
  errors: Record<string, string>;
}

interface CourseEntry {
  code: string;
  title: string;
  credits: number;
  grade: string;
  semester: string;
}

export const CourseCompletionSetup: React.FC<CourseCompletionSetupProps> = ({
  updateProfile,
}) => {
  const [completedCourses, setCompletedCourses] = useState<CourseEntry[]>([]);
  const [newCourse, setNewCourse] = useState<Partial<CourseEntry>>({
    code: '',
    title: '',
    credits: 3,
    grade: 'A',
    semester: ''
  });
  const [manualEntry, setManualEntry] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const grades = ['A', 'B', 'C', 'D', 'F', 'W', 'I', 'P'];
  
  // Generate semester options
  const generateSemesters = () => {
    const semesters = [];
    for (let year = currentYear - 5; year <= currentYear; year++) {
      semesters.push(`Fall ${year}`, `Spring ${year + 1}`, `Summer ${year + 1}`);
    }
    return semesters.reverse();
  };

  const semesters = generateSemesters();

  // Load existing course completions
  useEffect(() => {
    const loadCompletions = async () => {
      try {
        const completions = await userDataService.getCourseCompletions();
        const courseEntries: CourseEntry[] = completions.map(completion => ({
          code: `COURSE-${completion.course_id}`, // This would be actual course code in real implementation
          title: `Course ${completion.course_id}`, // This would be actual course title
          credits: completion.credits,
          grade: completion.grade,
          semester: completion.semester
        }));
        setCompletedCourses(courseEntries);
      } catch (error) {
        console.error('Error loading course completions:', error);
      }
    };

    loadCompletions();
  }, []);

  // Add individual course
  const addCourse = () => {
    if (newCourse.code && newCourse.title && newCourse.semester) {
      const course: CourseEntry = {
        code: newCourse.code.toUpperCase(),
        title: newCourse.title,
        credits: newCourse.credits || 3,
        grade: newCourse.grade || 'A',
        semester: newCourse.semester
      };
      
      setCompletedCourses(prev => [...prev, course]);
      setNewCourse({
        code: '',
        title: '',
        credits: 3,
        grade: 'A',
        semester: ''
      });
    }
  };

  // Remove course
  const removeCourse = (index: number) => {
    setCompletedCourses(prev => prev.filter((_, i) => i !== index));
  };

  // Parse manual entry
  const parseManualEntry = () => {
    const lines = manualEntry.split('\n').filter(line => line.trim());
    const parsedCourses: CourseEntry[] = [];

    lines.forEach(line => {
      // Expected format: "CS 1301 - Intro to Computing - 4 - A - Fall 2023"
      const parts = line.split(' - ').map(part => part.trim());
      if (parts.length >= 3) {
        const code = parts[0].toUpperCase();
        const title = parts[1];
        const credits = parseInt(parts[2]) || 3;
        const grade = parts[3] || 'A';
        const semester = parts[4] || `Fall ${currentYear - 1}`;
        
        parsedCourses.push({ code, title, credits, grade, semester });
      }
    });

    setCompletedCourses(prev => [...prev, ...parsedCourses]);
    setManualEntry('');
    setIsManualMode(false);
  };

  // Save course completions to database
  const saveCourseCompletions = async () => {
    setIsSaving(true);
    try {
      for (const course of completedCourses) {
        await userDataService.saveCourseCompletion({
          course_id: 1, // This would be actual course ID lookup
          grade: course.grade,
          semester: course.semester,
          credits: course.credits,
          status: 'completed'
        });
      }
      console.log('✅ Course completions saved to database');
    } catch (error) {
      console.error('Error saving course completions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate GPA from completed courses
  const calculateGPA = () => {
    const gradePoints: Record<string, number> = {
      'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
    };

    const validCourses = completedCourses.filter(course => 
      gradePoints.hasOwnProperty(course.grade)
    );

    if (validCourses.length === 0) return 0;

    const totalPoints = validCourses.reduce((sum, course) => 
      sum + (gradePoints[course.grade] * course.credits), 0
    );
    const totalCredits = validCourses.reduce((sum, course) => sum + course.credits, 0);

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  };

  const calculatedGPA = calculateGPA();
  const totalCredits = completedCourses.reduce((sum, course) => sum + course.credits, 0);

  // Update profile with calculated values
  useEffect(() => {
    if (completedCourses.length > 0) {
      updateProfile('currentGPA', calculatedGPA);
      updateProfile('totalCreditsEarned', totalCredits);
    }
  }, [completedCourses, calculatedGPA, totalCredits, updateProfile]);

  return (
    <div className="space-y-3">
      {/* Current Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-[#B3A369]/10 to-[#003057]/10 border-[#B3A369]/30">
          <CardContent className="py-2 px-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#003057]">{completedCourses.length}</div>
                <div className="text-sm text-muted-foreground">Courses Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#B3A369]">{totalCredits}</div>
                <div className="text-sm text-muted-foreground">Total Credits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{calculatedGPA.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Calculated GPA</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Courses Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-[#B3A369]" />
              Add Completed Courses
            </CardTitle>
            <CardDescription className="py-1">
              Enter courses you&apos;ve already completed to track your progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isManualMode ? (
              // Individual course entry
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Course Code</Label>
                  <Input
                    value={newCourse.code || ''}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="CS 1301"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Course Title</Label>
                  <Input
                    value={newCourse.title || ''}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Intro to Computing"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Credits</Label>
                  <Select
                    value={newCourse.credits?.toString() || '3'}
                    onValueChange={(value) => setNewCourse(prev => ({ ...prev, credits: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(credit => (
                        <SelectItem key={credit} value={credit.toString()}>
                          {credit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Grade</Label>
                  <Select
                    value={newCourse.grade || 'A'}
                    onValueChange={(value) => setNewCourse(prev => ({ ...prev, grade: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map(grade => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Semester</Label>
                  <Select
                    value={newCourse.semester || ''}
                    onValueChange={(value) => setNewCourse(prev => ({ ...prev, semester: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map(semester => (
                        <SelectItem key={semester} value={semester}>
                          {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              // Manual bulk entry
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Bulk Course Entry (one per line)
                </Label>
                <Textarea
                  value={manualEntry}
                  onChange={(e) => setManualEntry(e.target.value)}
                  placeholder="CS 1301 - Intro to Computing - 4 - A - Fall 2023&#10;MATH 1551 - Differential Calculus - 4 - B - Fall 2023"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Format: Course Code - Title - Credits - Grade - Semester (e.g., &quot;CS 1301 - Intro to Computing - 4 - A - Fall 2023&quot;)
                </p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsManualMode(!isManualMode)}
                className="flex items-center gap-2"
              >
                {isManualMode ? <Plus className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {isManualMode ? 'Individual Entry' : 'Bulk Entry'}
              </Button>

              <Button
                type="button"
                onClick={isManualMode ? parseManualEntry : addCourse}
                disabled={
                  isManualMode 
                    ? !manualEntry.trim()
                    : !newCourse.code || !newCourse.title || !newCourse.semester
                }
                className="bg-[#B3A369] hover:bg-[#B3A369]/90 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {isManualMode ? 'Parse Courses' : 'Add Course'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Completed Courses List */}
      {completedCourses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed Courses ({completedCourses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {completedCourses.map((course, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {course.code}
                      </Badge>
                      <span className="font-medium">{course.title}</span>
                      <Badge variant="secondary">
                        {course.credits} credits
                      </Badge>
                      <Badge 
                        variant={course.grade === 'A' ? 'default' : course.grade === 'F' ? 'destructive' : 'secondary'}
                      >
                        {course.grade}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {course.semester}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCourse(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>

              {completedCourses.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    type="button"
                    onClick={saveCourseCompletions}
                    disabled={isSaving}
                    className="bg-[#003057] hover:bg-[#003057]/90 text-white flex items-center gap-2"
                  >
                    <FormSubmitState isSubmitting={isSaving} loadingText="Saving courses...">
                      <Upload className="h-4 w-4" />
                      Save to Database
                    </FormSubmitState>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Completion Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-[#003057]/5 border-[#003057]/20">
          <CardContent className="py-2 px-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#003057] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-[#003057]">
                  Course Completion Summary
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• <strong>Courses Entered:</strong> {completedCourses.length} courses</p>
                  <p>• <strong>Total Credits:</strong> {totalCredits} credit hours</p>
                  <p>• <strong>Calculated GPA:</strong> {calculatedGPA.toFixed(2)} / 4.00</p>
                  <p>• <strong>Progress:</strong> {((totalCredits / 126) * 100).toFixed(1)}% toward degree completion</p>
                </div>
                <p className="text-xs text-[#B3A369] font-medium">
                  📚 This step is optional - you can add courses later from your dashboard
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};