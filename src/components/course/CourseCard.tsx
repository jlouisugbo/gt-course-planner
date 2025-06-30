'use client';

import { Course } from '@/types/types';

interface CourseCardProps {
  courses: Course[];
}

export function CourseCard({ courses }: CourseCardProps) {
  if (courses.length === 0) {
    return null;
  }

    return (
    <div className="space-y-2">
        {courses.map(course => (
        <div
            key={course.id}
            className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
        <div className="font-medium text-gray-900 text-sm leading-tight mb-1">
            {course.code}
        </div>
            <div className="text-xs text-gray-600 truncate mb-1">
            {course.title}
            </div>
            <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
                {course.credits} credits
            </div>
            {course.prerequisite_courses.length > 0 && (
                <div className="text-xs text-orange-600 bg-orange-50 px-1 py-0.5 rounded">
                    Has prereqs
                </div>
            )}
            </div>
        </div>
        ))}
    </div>
    );
}