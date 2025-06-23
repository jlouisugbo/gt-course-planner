import React from 'react';
import { Draggable } from '../dnd/Draggable';

interface Course {
  id: string;
  name: string;
}

export function CourseCard({ courses }: { courses: Course[] }){
    return (
    courses.map((course: Course) => (
        <Draggable key={course.id} id={course.id}>
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
            <div className="font-medium text-gray-900 text-sm leading-tight">
                {course.name}
            </div>
            </div>
        </Draggable>
        ))
    );
}