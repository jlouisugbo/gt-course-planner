"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle } from 'lucide-react';
import { SemesterData } from '@/types/courses';
import { motion } from 'framer-motion';
import SemesterColumn from './SemesterColumn';

interface AcademicYearCardProps {
  academicYear: string;
  semesters: SemesterData[];
}

const AcademicYearCard: React.FC<AcademicYearCardProps> = ({
  academicYear,
  semesters
}) => {
  const totalCredits = semesters.reduce((sum, semester) => sum + semester.totalCredits, 0);
  const hasOverload = semesters.some(semester => semester.totalCredits > semester.maxCredits);
  const isCurrentYear = semesters.some(semester => semester.isActive);

  // Sort semesters: Fall, Spring, Summer
  const sortedSemesters = [...semesters].sort((a, b) => {
    const seasonOrder = { Fall: 0, Spring: 1, Summer: 2 };
    return seasonOrder[a.season] - seasonOrder[b.season];
  });

  return (
    <Card className="academic-year-card border-slate-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-[#B3A369]"/>
            Academic Year {academicYear}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isCurrentYear && (
              <Badge className="bg-[#003057] text-white">Current Year</Badge>
            )}
            {hasOverload && (
              <Badge variant="destructive" className="bg-red-500 text-white">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overloaded
              </Badge>
            )}
            <Badge variant="outline" className="border-slate-300">
              {totalCredits} Credits
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sortedSemesters.map(semester => (
            <motion.div
              key={semester.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SemesterColumn semester={semester} />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default AcademicYearCard;