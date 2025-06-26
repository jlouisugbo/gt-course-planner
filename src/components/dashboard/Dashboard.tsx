'use client';

import { useState } from "react"
import { DndContext, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { SemesterGrid } from "./SemesterGrid";
import { Draggable } from '../dnd/Draggable';
import { Droppable } from '../dnd/Droppable';
import { GTScrapper } from "@/lib/scrapper/GTScrapper";

interface Course {
  id: string;
  name: string;
}

interface Items {
  [key: string]: Course[];
}

export function Dashboard() {
  const semesters: string[] = [
    'Fall 2025', 'Spring 2026', 'Summer 2026',
    'Fall 2026', 'Spring 2027', 'Summer 2027',
    'Fall 2027', 'Spring 2028', 'Summer 2028',
    'Fall 2028', 'Spring 2029', 'Summer 2029',
  ];

  // Track which items are in which semesters
  const [items, setItems] = useState<Items>({
    'course-inventory': [
      { id: 'course-1', name: 'Computer Science 101' },
      { id: 'course-2', name: 'Mathematics 201' },
      { id: 'course-3', name: 'Physics 150' },
      { id: 'course-4', name: 'English 101' },
      { id: 'course-5', name: 'History 200' },
      { id: 'course-6', name: 'Chemistry 150' },
      { id: 'course-7', name: 'Philosophy 101' },
      { id: 'course-8', name: 'Statistics 200' }
    ],

    // Initialize all semester semesters as empty
    ...semesters.reduce((acc: Items, _semester: string, index: number) => {
      acc[index.toString()] = [];
      return acc;
    }, {})
  });

  // Search to filter the courses
  const [searchQuery, setSearchQuery] = useState<string>("");

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    
    if (!over) return;

    const activeId: string = active.id as string;
    const overId: string = over.id as string;
    
    const activeContainer: string | undefined = Object.keys(items).find((key: string) => 
      items[key].some((item: Course) => item.id === activeId)
    );
    
    if (!activeContainer || activeContainer === overId) return;

    // Check if item is already in the target container (shouldn't happen but extra safety)
    const itemAlreadyInTarget: boolean = items[overId]?.some((item: Course) => item.id === activeId) || false;
    if (itemAlreadyInTarget) return;

    // Move item between containers
    setItems((prev: Items) => {
      const itemToMove: Course | undefined = prev[activeContainer].find((item: Course) => item.id === activeId);
      
      if (!itemToMove) return prev;
      
      return {
        ...prev,
        [activeContainer]: prev[activeContainer].filter((item: Course) => item.id !== activeId),
        [overId]: [...(prev[overId] || []), itemToMove],
      };
    });
  }

  // Enhanced drag over to prevent dropping in same container
  function handleDragOver(event: DragOverEvent): void {
    const { active, over } = event;
    
    if (!over) return;

    const activeId: string = active.id as string;
    const overId: string = over.id as string;
    
    // Find which container the item is currently in
    const activeContainer: string | undefined = Object.keys(items).find((key: string) => 
      items[key].some((item: Course) => item.id === activeId)
    );
    
    // Prevent dropping in the same container
    if (activeContainer === overId) {
      event.preventDefault?.();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            🎓 Course Planning Dashboard
          </h1>
        </div>
      </div>

      <div className="flex flex-row mx-auto px-6 py-8 gap-3">
        <DndContext onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
          
          {/* Course Inventory - Full Width Top Section */}
          <div className="w-100">
            <div className="mb-8 w-auto sticky top-0 flex items-start justify-center">
              <Droppable id="course-inventory" className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    📚
                  </div>
                  <h2 className="text-xl font-semibold text-indigo-800">
                    Available Courses
                  </h2>
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-sm font-medium text-center">
                    {items['course-inventory'].length} courses
                  </span>
                  {items['course-inventory'].length === 0 ? (
                    null
                  ) : (
                    <div className="lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">
                      <input className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} type="text" placeholder="Search Courses..." />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 overflow-x-hidden overflow-y-auto max-h-[75vh]">
                  {items['course-inventory'].length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <div className="text-4xl mb-2">🎉</div>
                      <p className="text-gray-500 text-lg">All courses have been scheduled!</p>
                    </div>
                  ) : (
                    items['course-inventory'].map((course: Course) => (
                      <Draggable key={course.id} id={course.id}>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                          <div className="font-medium text-gray-900 text-sm leading-tight">
                            {course.name}
                          </div>
                        </div>
                      </Draggable>
                    ))
                  )}
                </div>
              </Droppable>
            </div>
          </div>

          {/* Academic Years Layout */}
          <div className="w-screen space-y-8">
            {/* Group semesters by academic year */}
            {[2025, 2026, 2027, 2028, 2029].map((year: number) => {
              const yearSemesters: string[] = semesters.filter((sem: string) => sem.includes(year.toString()));

              return (
                <SemesterGrid
                  key={year}
                  year={year}
                  yearSemesters={yearSemesters}
                  items={items}  // Pass all items, not filtered
                  allSemesters={semesters}  // Pass the complete semesters array
                />
              );
            })}
          </div>
        </DndContext>
      </div>
    </div>
  );
}