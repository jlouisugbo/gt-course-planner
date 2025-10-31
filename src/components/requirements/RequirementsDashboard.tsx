"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequirementsSearch } from './RequirementsSearch';
import { RequirementsCategoryList } from './RequirementsCategoryList';
import { GraduationCap, BookOpen, Clock, CheckCircle, Loader2, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCompletionTracking } from '@/hooks/useCompletionTracking';
import { useRequirements } from '@/hooks/useRequirements';

interface RequirementsFilters {
  searchQuery: string;
  showCompleted: boolean;
  showIncomplete: boolean;
  selectedSemester: string;
  courseType: string;
}

export const RequirementsDashboard: React.FC = () => {
  
  // Use enhanced requirements with Phase 2.1.2 features
  const {
    allRequirements,
    completedCourseCodes,
    plannedCourseCodes,
    overallProgress,
    progressSummary,
    filteredRequirements,
    getNextRecommendedCourses,
    getCriticalPath,
    exportProgress,
    isLoading: loading,
    error
  } = useRequirements();
  
  // Use existing completion tracking hook for compatibility
  const { 
    toggleCourseCompletion
  } = useCompletionTracking();

  // State for warnings modal
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const hasWarnings = progressSummary && (
    progressSummary.warnings.length > 0 || 
    progressSummary.blockers.length > 0 || 
    progressSummary.recommendations.length > 0
  );

  // Save all completions to database when component unmounts or tab changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Note: This doesn't work reliably in modern browsers for async operations
      // The actual saving happens immediately when courses are toggled
      console.log('💾 Auto-saving completions on page unload');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('💾 Auto-saving completions on tab switch');
        // The saving is already handled in toggleCourseCompletion
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const [filters, setFilters] = useState<RequirementsFilters>({
    searchQuery: '',
    showCompleted: true,
    showIncomplete: true,
    selectedSemester: 'all',
    courseType: 'all'
  });

  // Enhanced progress calculation now comes from useRequirements
  const calculateProgress = () => {
    return {
      completedCredits: overallProgress.completedCredits,
      totalCredits: overallProgress.totalCredits,
      percentage: Math.round(overallProgress.progressPercentage)
    };
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <Loader2 className="h-8 w-8 animate-spin text-gt-navy" />
          <p className="text-lg text-gray-600">Loading requirements...</p>
        </motion.div>
      </div>
    );
  }

  if (error || (allRequirements.length === 0 && !loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="gt-card max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-gt-navy">Error Loading Requirements</h3>
                <p className="text-sm text-gray-600">{error || 'Failed to load requirements'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Compact Header with Warnings Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="gt-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gt-gradient rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gt-navy">Degree Requirements</h1>
                  <p className="text-sm text-gray-600">Computer Science Program Requirements</p>
                </div>
              </div>
              {hasWarnings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWarningsModal(true)}
                  className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                >
                  <Info className="h-4 w-4 mr-2" />
                  View Alerts
                  {progressSummary.blockers.length > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white">{progressSummary.blockers.length}</Badge>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Compact Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <Card className="gt-card border-l-4 border-l-gt-gold">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Progress</p>
                  <p className="text-xl font-bold text-gt-gold">{progress.percentage}%</p>
                </div>
                <CheckCircle className="h-6 w-6 text-gt-gold" />
              </div>
              <Progress value={progress.percentage} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card className="gt-card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Credits</p>
                  <p className="text-xl font-bold text-gt-navy">{progress.completedCredits}/{progress.totalCredits}</p>
                </div>
                <BookOpen className="h-6 w-6 text-gt-navy" />
              </div>
            </CardContent>
          </Card>

          <Card className="gt-card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Courses</p>
                  <p className="text-xl font-bold text-gt-navy">{completedCourseCodes.size}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-gt-gold" />
              </div>
            </CardContent>
          </Card>

          <Card className="gt-card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Graduation</p>
                  <p className="text-sm font-bold text-gt-navy">
                    {progressSummary?.estimatedGraduationSemester || 'TBD'}
                  </p>
                </div>
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RequirementsSearch filters={filters} onFiltersChange={setFilters} />
        </motion.div>

        {/* Warnings Modal */}
        <Dialog open={showWarningsModal} onOpenChange={setShowWarningsModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Academic Alerts & Recommendations</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWarningsModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {progressSummary?.blockers && progressSummary.blockers.length > 0 && (
                <div className="border-l-4 border-l-red-500 bg-red-50 p-4 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-800">Critical Issues</h3>
                  </div>
                  <ul className="space-y-1">
                    {progressSummary.blockers.map((blocker, index) => (
                      <li key={index} className="text-sm text-red-700">• {blocker}</li>
                    ))}
                  </ul>
                </div>
              )}
              {progressSummary?.warnings && progressSummary.warnings.length > 0 && (
                <div className="border-l-4 border-l-yellow-500 bg-yellow-50 p-4 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-800">Attention Required</h3>
                  </div>
                  <ul className="space-y-1">
                    {progressSummary.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-700">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              {progressSummary?.recommendations && progressSummary.recommendations.length > 0 && (
                <div className="border-l-4 border-l-blue-500 bg-blue-50 p-4 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Recommendations</h3>
                  </div>
                  <ul className="space-y-1">
                    {progressSummary.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-700">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="requirements" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white border border-gray-200 rounded-lg p-1">
              <TabsTrigger
                value="requirements"
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gt-navy data-[state=active]:text-white text-xs sm:text-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Requirements</span>
                <span className="sm:hidden">Reqs</span>
              </TabsTrigger>
              <TabsTrigger
                value="progress"
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gt-navy data-[state=active]:text-white text-xs sm:text-sm"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Progress View</span>
                <span className="sm:hidden">Progress</span>
              </TabsTrigger>
              <TabsTrigger
                value="recommendations"
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gt-navy data-[state=active]:text-white text-xs sm:text-sm"
              >
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Next Steps</span>
                <span className="sm:hidden">Next</span>
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gt-navy data-[state=active]:text-white text-xs sm:text-sm"
              >
                <Clock className="h-4 w-4" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requirements" className="space-y-6 mt-6">
              <RequirementsCategoryList
                sections={allRequirements}
                completedCourses={completedCourseCodes}
                plannedCourses={plannedCourseCodes}
                filters={filters}
                onToggleCourse={toggleCourseCompletion}
                footnotes={[]}
              />
            </TabsContent>

            <TabsContent value="progress" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allRequirements.map((section, index) => {
                  const sectionCompleted = section.courses.filter(course => 
                    completedCourseCodes.has(course.code)
                  ).length;
                  const sectionTotal = section.courses.length;
                  const sectionProgress = sectionTotal > 0 ? Math.round((sectionCompleted / sectionTotal) * 100) : 0;
                  
                  return (
                    <Card key={`${section.id}-${index}`} className="gt-card">
                      <CardHeader>
                        <CardTitle className="text-lg text-gt-navy">{section.name}</CardTitle>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <Badge 
                              variant={sectionProgress === 100 ? "default" : "secondary"}
                              className={sectionProgress === 100 ? "bg-gt-gold text-gt-navy" : ""}
                            >
                              {sectionCompleted}/{sectionTotal} courses
                            </Badge>
                          </div>
                          <Progress value={sectionProgress} />
                          <p className="text-xs text-gray-500">
                            {sectionProgress}% complete
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Phase 2.1.2 Enhanced Tab: Next Steps */}
            <TabsContent value="recommendations" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Next Recommended Courses */}
                <Card className="gt-card">
                  <CardHeader>
                    <CardTitle className="text-lg text-gt-navy flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-gt-gold" />
                      Next Recommended Courses
                    </CardTitle>
                    <p className="text-sm text-gray-600">Courses you're ready to take now</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getNextRecommendedCourses(5).map((courseCode) => (
                        <div 
                          key={courseCode}
                          className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-green-900">{courseCode}</span>
                            <p className="text-xs text-green-700">Prerequisites satisfied</p>
                          </div>
                        </div>
                      ))}
                      {getNextRecommendedCourses().length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          Complete current courses to unlock more recommendations
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Critical Path */}
                <Card className="gt-card">
                  <CardHeader>
                    <CardTitle className="text-lg text-gt-navy flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Priority Requirements
                    </CardTitle>
                    <p className="text-sm text-gray-600">Requirements that need immediate attention</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getCriticalPath().slice(0, 5).map((requirement) => (
                        <div 
                          key={requirement.id}
                          className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                        >
                          <div>
                            <span className="font-medium text-orange-900">{requirement.name}</span>
                            <p className="text-xs text-orange-700">
                              {requirement.minCredits - requirement.completedCredits} credits needed
                            </p>
                          </div>
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            Priority
                          </Badge>
                        </div>
                      ))}
                      {getCriticalPath().length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          Great progress! No critical issues found.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Phase 2.1.2 Enhanced Tab: Export Options */}
            <TabsContent value="export" className="space-y-6 mt-6">
              <Card className="gt-card">
                <CardHeader>
                  <CardTitle className="text-lg text-gt-navy">Export Degree Progress</CardTitle>
                  <p className="text-sm text-gray-600">Download your progress data in various formats</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => exportProgress('json').then(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'degree-progress.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      })}
                      className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-gt-navy hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gt-navy rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gt-navy">JSON Format</h4>
                        <p className="text-sm text-gray-600">Complete data structure</p>
                      </div>
                    </button>

                    <button
                      onClick={() => exportProgress('csv').then(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'degree-progress.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      })}
                      className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-gt-navy hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gt-gold rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gt-navy">CSV Format</h4>
                        <p className="text-sm text-gray-600">Spreadsheet compatible</p>
                      </div>
                    </button>
                  </div>

                  {progressSummary && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold text-gt-navy mb-2">Export Summary</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Credits</p>
                          <p className="font-semibold">{progressSummary.totalCreditsRequired}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Completed</p>
                          <p className="font-semibold">{progressSummary.totalCreditsCompleted}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Progress</p>
                          <p className="font-semibold">{Math.round(progressSummary.overallCompletionPercentage)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Graduation</p>
                          <p className="font-semibold">{progressSummary.estimatedGraduationSemester}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};