'use client';

import type { Course } from '../../types/Course';
import { Semesters } from './Semesters';

interface SemesterGridProps {
    year: number;
    yearSemesters: string[];
    items: Record<string, Course[]>;
    allSemesters: string[];
}

export function SemesterGrid({ year, yearSemesters, items, allSemesters }: SemesterGridProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                    Academic Year {year} - {year + 1}
                </h3>
            </div>
            
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {yearSemesters.map((semester: string) => {
                        const containerIndex: number = allSemesters.indexOf(semester);
                        const containerItems: Course[] = items[containerIndex.toString()] || [];
                        
                        return (
                            <Semesters key={semester} semester={semester} courses={containerItems} containerId={containerIndex.toString()} />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}