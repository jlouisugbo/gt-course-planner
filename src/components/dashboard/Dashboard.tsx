'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { DndContext, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { SemesterGrid } from "./SemesterGrid";
import { Draggable } from '../dnd/Draggable';
import { Droppable } from '../dnd/Droppable';
import { CourseCombobox } from '../course/CourseExplorer';
import { Items, MajorMinorSelection } from '@/types/types';
import { majorToSubjects, minorToSubjects } from '@/lib/constants';
import { findCollegeIdsByProgram, getCoursesByCollegeIds } from '@/lib/database-helpers';

export function Dashboard() {
  const [items, setItems] = useState<Items>({
    'course-inventory': []
  });

  const [majorMinorSelection, setMajorMinorSelection] = useState<MajorMinorSelection>({
    major: '',
    minor: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const semesters: string[] = useMemo(() => [
    'Fall 2025', 'Spring 2026', 'Summer 2026',
    'Fall 2026', 'Spring 2027', 'Summer 2027',
    'Fall 2027', 'Spring 2028', 'Summer 2028',
    'Fall 2028', 'Spring 2029', 'Summer 2029',
  ], []);

  // Initialize semester containers in items
  useEffect(() => {
    setItems(prev => {
      const newItems = { ...prev };
      semesters.forEach((_, index) => {
        if (!newItems[index.toString()]) {
          newItems[index.toString()] = [];
        }
      });
      return newItems;
    });
  }, [semesters]);

  // Function to get college_id from major/minor selection
  const getCollegeIdFromSelection = useCallback(async (selection: MajorMinorSelection): Promise<number[]> => {
    const collegeIds: number[] = [];
    
    try {
      // Get college IDs from degree programs based on major/minor selection
      if (selection.major) {
        const majorCollegeIds = await findCollegeIdsByProgram(selection.major);
        collegeIds.push(...majorCollegeIds);
      }

      if (selection.minor) {
        const minorCollegeIds = await findCollegeIdsByProgram(selection.minor);
        minorCollegeIds.forEach(id => {
          if (!collegeIds.includes(id)) {
            collegeIds.push(id);
          }
        });
      }

      // Return unique college IDs, fallback to [1] if none found
      return collegeIds.length > 0 ? [...new Set(collegeIds)] : [1];
    } catch (error) {
      console.error('Error getting college IDs:', error);
      return [1]; // Default fallback to College of Computing
    }
  }, []);

  // Function to get subject filter from major/minor
  const getSubjectFilters = useCallback((selection: MajorMinorSelection): string[] => {
    const filters: string[] = [];
    
    if (selection.major && majorToSubjects[selection.major]) {
      filters.push(...majorToSubjects[selection.major]);
    }

    if (selection.minor && minorToSubjects[selection.minor]) {
      filters.push(...minorToSubjects[selection.minor]);
    }

    return [...new Set(filters)]; // Remove duplicates
  }, []);

  // Fetch courses based on major/minor selection
  const fetchCourses = useCallback(async (selection: MajorMinorSelection) => {
    if (!selection.major && !selection.minor) {
      setItems(prev => ({ ...prev, 'course-inventory': [] }));
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching courses for selection:', selection);
      
      const collegeIds = await getCollegeIdFromSelection(selection);
      console.log('Found college IDs:', collegeIds);
      
      const subjectFilters = getSubjectFilters(selection);
      console.log('Using subject filters:', subjectFilters);

      const courses = await getCoursesByCollegeIds(collegeIds, subjectFilters);
      console.log('Fetched courses:', courses.length);

      setItems(prev => ({
        ...prev,
        'course-inventory': courses
      }));

    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses. Please try again.');
      setItems(prev => ({ ...prev, 'course-inventory': [] }));
    } finally {
      setIsLoading(false);
    }
  }, [getCollegeIdFromSelection, getSubjectFilters]);

  // Handle major/minor selection change
  const handleMajorMinorChange = useCallback((selection: MajorMinorSelection) => {
    setMajorMinorSelection(selection);
    fetchCourses(selection);
  }, [fetchCourses]);

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const activeContainer = Object.keys(items).find(key =>
      items[key].some(item => item.id?.toString() === activeId)
    );

    if (!activeContainer || activeContainer === overId) return;

    const itemAlreadyInTarget = items[overId]?.some(item => item.id?.toString() === activeId);
    if (itemAlreadyInTarget) return;

    setItems(prev => {
      const itemToMove = prev[activeContainer].find(item => item.id?.toString() === activeId);
      if (!itemToMove) return prev;

      return {
        ...prev,
        [activeContainer]: prev[activeContainer].filter(item => item.id?.toString() !== activeId),
        [overId]: [...(prev[overId] || []), itemToMove],
      };
    });
  }

  function handleDragOver(event: DragOverEvent): void {
    const { over } = event;
    if (!over) return;
    // Placeholder for drag over logic
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
            🎓 Course Planning Dashboard
          </h1>
          
          {/* Major/Minor Selection */}
          <div className="max-w-2xl mx-auto">
            <CourseCombobox 
              onSelectionChange={handleMajorMinorChange}
              initialMajor={majorMinorSelection.major}
              initialMinor={majorMinorSelection.minor}
            />
          </div>
          
          {/* Selection Display */}
          {(majorMinorSelection.major || majorMinorSelection.minor) && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Selected: 
                {majorMinorSelection.major && (
                  <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                    Major: {majorMinorSelection.major}
                  </span>
                )}
                {majorMinorSelection.minor && (
                  <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                    Minor: {majorMinorSelection.minor}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <DndContext onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
          <div className="mb-8">
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 shadow-sm">
              <Droppable id="course-inventory">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-3 shadow-sm">📚</div>
                  <h2 className="text-xl font-semibold text-indigo-800">Available Courses</h2>
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-sm font-medium">
                    {items['course-inventory'].length} courses
                  </span>
                  {isLoading && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-sm font-medium">
                      Loading...
                    </span>
                  )}
                  {error && (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-medium">
                      Error
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {error ? (
                    <div className="col-span-full text-center py-8">
                      <div className="text-4xl mb-2">⚠️</div>
                      <p className="text-red-500 text-lg mb-2">{error}</p>
                      <button 
                        onClick={() => fetchCourses(majorMinorSelection)}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Try again
                      </button>
                    </div>
                  ) : items['course-inventory'].length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <div className="text-4xl mb-2">
                        {isLoading ? '⏳' : majorMinorSelection.major || majorMinorSelection.minor ? '🎉' : '🎯'}
                      </div>
                      <p className="text-gray-500 text-lg">
                        {isLoading 
                          ? 'Loading courses...' 
                          : majorMinorSelection.major || majorMinorSelection.minor
                            ? 'No courses found for this selection. Try a different major/minor combination.'
                            : 'Select a major or minor to see available courses'
                        }
                      </p>
                    </div>
                  ) : (
                    items['course-inventory'].map(course => (
                      <Draggable key={course.id} id={course.id?.toString() || ''}>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                          <div className="font-medium text-gray-900 text-sm leading-tight mb-1">
                            {course.code}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {course.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {course.credits} credits
                          </div>
                        </div>
                      </Draggable>
                    ))
                  )}
                </div>
              </Droppable>
            </div>
          </div>

          <div className="space-y-8">
            {[2025, 2026, 2027, 2028, 2029].map(year => {
              const yearSemesters = semesters.filter(sem => sem.includes(year.toString()));
              return (
                <SemesterGrid
                  key={year}
                  year={year}
                  yearSemesters={yearSemesters}
                  items={items}
                  allSemesters={semesters}
                />
              );
            })}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
