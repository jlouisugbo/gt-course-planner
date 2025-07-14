"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download,
  Upload,
  User,
  GraduationCap
} from 'lucide-react';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { motion } from 'framer-motion';
import AcademicYearCard from './AcademicYearCard';
//import CourseRecommendations from './CourseRecommendations';
import ProfileSetup from '@/components/profile/ProfileSetup';
import { DnDProvider } from '@/lib/DndProvider';

const PlannerGrid = () => {
  const { semesters, studentInfo, userProfile } = usePlannerStore();
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Group semesters by academic year - memoized to prevent recalculation
  const groupSemestersByAcademicYear = useMemo(() => {
    const semesterArray = Object.values(semesters).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const seasonOrder = { Fall: 0, Spring: 1, Summer: 2 };
      return seasonOrder[a.season] - seasonOrder[b.season];
    });

    const academicYears: { [key: string]: any[] } = {};
    
    semesterArray.forEach(semester => {
      let academicYear: string;
      
      if (semester.season === 'Fall') {
        academicYear = `${semester.year}-${semester.year + 1}`;
      } else {
        academicYear = `${semester.year - 1}-${semester.year}`;
      }
      
      if (!academicYears[academicYear]) {
        academicYears[academicYear] = [];
      }
      
      academicYears[academicYear].push(semester);
    });

    return academicYears;
  }, [semesters]);

  // Memoize calculations
  const totalCreditsPlanned = useMemo(() => 
    Object.values(semesters).reduce((sum, semester) => sum + semester.totalCredits, 0),
    [semesters]
  );

  const averageCreditsPerSemester = useMemo(() => 
    Object.keys(groupSemestersByAcademicYear).length > 0 
      ? totalCreditsPlanned / (Object.keys(groupSemestersByAcademicYear).length * 2.5) 
      : 0,
    [groupSemestersByAcademicYear, totalCreditsPlanned]
  );

  // Memoize handlers
  const handleProfileSetupOpen = useCallback(() => {
    setShowProfileSetup(true);
  }, []);

  const handleProfileSetupClose = useCallback(() => {
    setShowProfileSetup(false);
  }, []);

  return (
    <DnDProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-[1800px] mx-auto p-6 space-y-6">
          {/* Compact Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Academic Plan</h1>
              <p className="text-base text-slate-600">
                Plan your 4-year journey at Georgia Tech
              </p>
            </div>
            
            <div className="mt-3 lg:mt-0 flex items-center space-x-3">
              <Button variant="outline" onClick={handleProfileSetupOpen} className="border-slate-300 text-sm h-9">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" className="border-slate-300 text-sm h-9">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button className="bg-[#003057] hover:bg-[#002041] text-sm h-9">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Compact Student Info Banner */}
          {userProfile && (
            <Card className="gt-gradient text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{userProfile.name}</h3>
                    <p className="text-sm opacity-90">
                      {userProfile.major} • {userProfile.startDate} - {userProfile.expectedGraduation}
                    </p>
                    {userProfile.threads && userProfile.threads.length > 0 && (
                      <div className="flex space-x-2 mt-2">
                        {userProfile.threads.map(thread => (
                          <Badge key={thread} variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                            {thread}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{userProfile.currentGPA.toFixed(2)}</div>
                    <div className="text-sm opacity-90">Current GPA</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Layout: Wider Course Library + Academic Years */}
          <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">
           
              {/* Course Recommendations Sidebar - Much Wider (2/7 of space) */}
  
            {/* Academic Years Grid - Remaining Space (5/7 of space) */}
            <div className="xl:col-span-5">
              <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
                {Object.entries(groupSemestersByAcademicYear).map(([academicYear, yearSemesters], index) => (
                  <motion.div
                    key={academicYear}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AcademicYearCard
                      academicYear={academicYear}
                      semesters={yearSemesters}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Compact Summary Stats */}
          <Card className="academic-year-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-slate-900 text-lg">
                <GraduationCap className="h-5 w-5 mr-2" />
                Plan Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{totalCreditsPlanned}</div>
                  <div className="text-sm text-slate-600">Total Credits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{Object.keys(groupSemestersByAcademicYear).length}</div>
                  <div className="text-sm text-slate-600">Academic Years</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{averageCreditsPerSemester.toFixed(1)}</div>
                  <div className="text-sm text-slate-600">Avg Credits/Sem</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#B3A369]">{studentInfo.expectedGraduation}</div>
                  <div className="text-sm text-slate-600">Graduation</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Setup Modal */}
          {showProfileSetup && (
            <ProfileSetup
              isOpen={showProfileSetup}
              onClose={handleProfileSetupClose}
              existingProfile={userProfile || undefined}
            />
          )}
        </div>
      </div>
    </DnDProvider>
  );
};

export default PlannerGrid;