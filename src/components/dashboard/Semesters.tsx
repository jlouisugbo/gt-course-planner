'use client';

import { CourseCard } from '../course/CourseCard';
import { Droppable } from '../dnd/Droppable';
import { Course } from '@/types/types';

type SemesterType = 'Fall' | 'Spring' | 'Summer';

interface SemestersProps {
  semester: string;
  courses: Course[];
  containerId: string;
}

export function Semesters({ semester, courses, containerId }: SemestersProps) {
  const hasItems = courses.length > 0;

  return (
    <Droppable id={containerId}>
      <div className={`${getSemesterColorClass(semester, hasItems)} border-2 border-dashed rounded-lg p-4 min-h-[140px] transition-all duration-200 ${hasItems ? 'shadow-lg' : 'hover:bg-gray-100'}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{getSemesterIcon(semester)}</span>
          <h4 className={`font-medium ${getSemesterHeaderClass(semester, hasItems)}`}>
            {semester}
          </h4>
          {hasItems && (
            <span className="ml-auto bg-white/80 text-xs px-2 py-1 rounded-full font-medium">
              {courses.length} {courses.length === 1 ? 'course' : 'courses'}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {courses.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-2xl mb-2">📋</div>
              <p className="text-gray-500 text-sm">
                Drop courses here
              </p>
            </div>
          ) : (
            <CourseCard courses={courses} />
          )}
        </div>
      </div>
    </Droppable>
  );
}

// Helper functions for styling
function getSemesterType(semester: string): SemesterType {
  if (semester.includes('Fall')) return 'Fall';
  if (semester.includes('Spring')) return 'Spring';
  if (semester.includes('Summer')) return 'Summer';
  return 'Fall';
}

function getSemesterColorClass(semester: string, hasItems: boolean): string {
  if (!hasItems) return 'bg-gray-50 border-gray-300';

  const type: SemesterType = getSemesterType(semester);
  switch (type) {
    case 'Fall':
      return 'bg-orange-100 border-orange-400 shadow-orange-200/50';
    case 'Spring':
      return 'bg-green-100 border-green-400 shadow-green-200/50';
    case 'Summer':
      return 'bg-blue-100 border-blue-400 shadow-blue-200/50';
    default:
      return 'bg-gray-50 border-gray-300';
  }
}

function getSemesterIcon(semester: string): string {
  const type: SemesterType = getSemesterType(semester);
  switch (type) {
    case 'Fall': return '🍂';
    case 'Spring': return '🌸';
    case 'Summer': return '☀️';
    default: return '📅';
  }
}

function getSemesterHeaderClass(semester: string, hasItems: boolean): string {
  if (!hasItems) return 'text-gray-600';
  
  const type: SemesterType = getSemesterType(semester);
  switch (type) {
    case 'Fall': return 'text-orange-700';
    case 'Spring': return 'text-green-700';
    case 'Summer': return 'text-blue-700';
    default: return 'text-gray-600';
  }
}