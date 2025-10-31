/**
 * Reliable Planner Store Hook
 * Combines reliable data loading with planner store initialization
 */

import { useEffect, useCallback } from 'react';
import { usePlannerStore } from './usePlannerStore';
import { useReliableDataLoader } from './useReliableDataLoader';
import { populateSemesterWithDemoCourses } from '@/lib/demoCoursesData';

export const useReliablePlannerStore = () => {
  const plannerStore = usePlannerStore();
  const {
    userProfile,
    degreeProgram,
    minorPrograms,
    isLoading,
    error,
    isInitialized: dataInitialized,
    reload
  } = useReliableDataLoader();

  // Initialize planner store with reliable data
  const initializePlannerWithData = useCallback(async () => {
    if (!userProfile || !dataInitialized) {
      return;
    }

    console.log('Initializing planner store with reliable data');

    // Update user profile in planner store
    const plannerUserProfile = {
      id: userProfile.id,
      name: userProfile.fullName,
      email: userProfile.email,
      gtId: userProfile.gtId,
      major: userProfile.major,
      secondMajor: userProfile.secondMajor,
      isDoubleMajor: !!userProfile.secondMajor,
      threads: userProfile.threads,
      minors: userProfile.minors,
      startDate: userProfile.startDate,
      expectedGraduation: userProfile.expectedGraduation,
      currentGPA: userProfile.currentGPA,
      year: userProfile.year,
      totalCreditsEarned: userProfile.totalCreditsEarned,
      isTransferStudent: userProfile.isTransferStudent,
      transferCredits: undefined,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
    };

    plannerStore.updateStudentInfo(plannerUserProfile);

    // Initialize default semesters if none exist
    const existingSemesters = plannerStore.getSafeSemesters();
    if (existingSemesters.length === 0) {
      console.log('No semesters found, initializing default semester plan');
      await plannerStore.initializeStore();
    }

    // Check if semesters are empty and populate with demo courses
    const semesterData = plannerStore.semesters;
    const semesterIds = Object.keys(semesterData);
    
    if (semesterIds.length > 0 && userProfile.major) {
      // Check if any semester has courses
      const hasAnyCourses = semesterIds.some(id => {
        const semester = semesterData[id];
        return semester && semester.courses && semester.courses.length > 0;
      });
      
      if (!hasAnyCourses) {
        console.log('Populating empty semesters with demo courses for:', userProfile.major);
        
        semesterIds.forEach(semesterId => {
          const semester = semesterData[semesterId];
          if (!semester) return;
          
          const semesterKey = `${semester.year}-${semester.season.toLowerCase()}`;
          const demoCourses = populateSemesterWithDemoCourses(semesterKey, userProfile.major);
          
          demoCourses.forEach(courseData => {
            const course = {
              id: Date.now() + Math.random(), // Temporary unique ID
              semesterId: parseInt(semesterId),
              year: semester.year,
              season: semester.season,
              ...courseData
            } as any;
            
            // Add course to semester using the store method
            try {
              plannerStore.addCourseToSemester(course);
            } catch (error) {
              console.warn('Failed to add demo course:', courseData.code, error);
            }
          });
        });
        
        console.log('Demo courses added to semesters');
      }
    }

  }, [userProfile, dataInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize when data becomes available
  useEffect(() => {
    if (dataInitialized && userProfile) {
      initializePlannerWithData();
    }
  }, [dataInitialized, userProfile, initializePlannerWithData]);

  return {
    // Reliable data
    userProfile,
    degreeProgram,
    minorPrograms,
    dataLoading: isLoading,
    dataError: error,
    dataInitialized,
    reloadData: reload,
    
    // Planner store
    ...plannerStore,
    
    // Combined initialization
    isFullyInitialized: dataInitialized && Object.keys(plannerStore.semesters).length > 0
  };
};