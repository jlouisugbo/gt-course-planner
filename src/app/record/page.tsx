"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  TrendingUp, 
  Calendar, 
  BookOpen,
  Edit3,
  Save,
  X,
  Plus,
  Target
} from 'lucide-react';
import { useUserAwarePlannerStore } from '@/hooks/useUserAwarePlannerStore';

interface SemesterGPA {
  semester: string;
  year: number;
  gpa: number;
  credits: number;
  courses: number;
}

export default function AcademicRecordPage() {
  const plannerStore = useUserAwarePlannerStore();
  
  const [editingGPA, setEditingGPA] = useState<string | null>(null);
  const [tempGPA, setTempGPA] = useState<string>('');
  const [semesterGPAs, setSemesterGPAs] = useState<SemesterGPA[]>([
    { semester: 'Fall', year: 2023, gpa: 3.75, credits: 15, courses: 5 },
    { semester: 'Spring', year: 2024, gpa: 3.85, credits: 16, courses: 5 },
    { semester: 'Fall', year: 2024, gpa: 3.90, credits: 17, courses: 6 },
  ]);

  // Get planned courses from planner
  const plannedCourses = plannerStore.getCoursesByStatus('planned');
  const completedCourses = plannerStore.getCoursesByStatus('completed');

  // Calculate overall GPA
  const calculateOverallGPA = () => {
    const totalGradePoints = semesterGPAs.reduce((sum, sem) => sum + (sem.gpa * sem.credits), 0);
    const totalCredits = semesterGPAs.reduce((sum, sem) => sum + sem.credits, 0);
    return totalCredits > 0 ? (totalGradePoints / totalCredits) : 0;
  };

  const overallGPA = calculateOverallGPA();
  const totalSemesters = semesterGPAs.length;
  const totalCreditsCompleted = semesterGPAs.reduce((sum, sem) => sum + sem.credits, 0);

  const handleEditGPA = (semesterKey: string, currentGPA: number) => {
    setEditingGPA(semesterKey);
    setTempGPA(currentGPA.toString());
  };

  const handleSaveGPA = (semesterKey: string) => {
    const newGPA = parseFloat(tempGPA);
    if (newGPA >= 0 && newGPA <= 4.0) {
      setSemesterGPAs(prev => prev.map(sem => 
        `${sem.semester}-${sem.year}` === semesterKey 
          ? { ...sem, gpa: newGPA }
          : sem
      ));
    }
    setEditingGPA(null);
    setTempGPA('');
  };

  const handleCancelEdit = () => {
    setEditingGPA(null);
    setTempGPA('');
  };

  const addNewSemester = () => {
    const currentYear = new Date().getFullYear();
    const newSemester: SemesterGPA = {
      semester: 'Spring',
      year: currentYear,
      gpa: 0,
      credits: 0,
      courses: 0
    };
    setSemesterGPAs(prev => [...prev, newSemester]);
  };

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.7) return 'text-green-600';
    if (gpa >= 3.3) return 'text-blue-600';
    if (gpa >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGPABadgeColor = (gpa: number) => {
    if (gpa >= 3.7) return 'bg-green-100 text-green-800 border-green-300';
    if (gpa >= 3.3) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (gpa >= 3.0) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gt-navy flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-gt-gold" />
            Academic Record
          </h1>
          <p className="text-gray-600 mt-2">
            Track your academic progress, manage semester GPAs, and view planned courses
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-gt-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall GPA</p>
                  <p className={`text-2xl font-bold ${getGPAColor(overallGPA)}`}>
                    {overallGPA.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-gt-gold" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Semesters Completed</p>
                  <p className="text-2xl font-bold text-gt-navy">{totalSemesters}</p>
                </div>
                <Calendar className="h-8 w-8 text-gt-navy" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Credits Completed</p>
                  <p className="text-2xl font-bold text-gt-navy">{totalCreditsCompleted}</p>
                </div>
                <BookOpen className="h-8 w-8 text-gt-navy" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Planned Courses</p>
                  <p className="text-2xl font-bold text-gt-navy">{plannedCourses.length}</p>
                </div>
                <Target className="h-8 w-8 text-gt-navy" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="semesters" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="semesters">Semester GPAs</TabsTrigger>
          <TabsTrigger value="planned">Planned Courses</TabsTrigger>
          <TabsTrigger value="completed">Completed Courses</TabsTrigger>
        </TabsList>

        {/* Semester GPAs Tab */}
        <TabsContent value="semesters" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gt-navy">Semester GPAs</CardTitle>
              <Button onClick={addNewSemester} size="sm" className="bg-gt-navy hover:bg-gt-navy-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Semester
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {semesterGPAs.map((semester, index) => {
                  const semesterKey = `${semester.semester}-${semester.year}`;
                  const isEditing = editingGPA === semesterKey;
                  
                  return (
                    <motion.div
                      key={semesterKey}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gt-navy">
                              {semester.semester} {semester.year}
                            </h3>
                            {!isEditing ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditGPA(semesterKey, semester.gpa)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSaveGPA(semesterKey)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">GPA:</span>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0"
                                  max="4.0"
                                  step="0.01"
                                  value={tempGPA}
                                  onChange={(e) => setTempGPA(e.target.value)}
                                  className="w-20 h-8"
                                />
                              ) : (
                                <Badge className={`${getGPABadgeColor(semester.gpa)} border`}>
                                  {semester.gpa.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Credits:</span>
                              <span className="text-sm font-medium">{semester.credits}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Courses:</span>
                              <span className="text-sm font-medium">{semester.courses}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Planned Courses Tab */}
        <TabsContent value="planned" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gt-navy">Planned Courses ({plannedCourses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {plannedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plannedCourses.map((course, index) => (
                    <motion.div
                      key={course.code}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gt-navy">{course.code}</h4>
                            <Badge variant="outline">{course.credits} cr</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{course.title}</p>
                          {course.college && (
                            <Badge variant="secondary" className="text-xs">
                              {course.college.replace('College of ', '')}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No planned courses yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add courses to your planner to see them here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Courses Tab */}
        <TabsContent value="completed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gt-navy">Completed Courses ({completedCourses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {completedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedCourses.map((course, index) => (
                    <motion.div
                      key={course.code}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gt-navy">{course.code}</h4>
                            <div className="flex gap-2">
                              <Badge variant="outline">{course.credits} cr</Badge>
                              <Badge className="bg-green-100 text-green-800">Complete</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{course.title}</p>
                          {course.college && (
                            <Badge variant="secondary" className="text-xs">
                              {course.college.replace('College of ', '')}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No completed courses yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Mark courses as completed to see them here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}