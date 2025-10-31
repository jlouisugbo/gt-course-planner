"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrerequisiteDisplay, PrerequisiteBadges } from '@/components/ui/PrerequisiteDisplay';

// Example prerequisite data based on the ACCT 2102 image and API format
const testCourses = [
  {
    code: "ACCT 2102",
    title: "Principles of Accounting II", 
    prerequisites: ["and", { id: "ACCT 2101", grade: "D" }]
  },
  {
    code: "AE 1601", 
    title: "Introduction to Aerospace Engineering",
    prerequisites: ["or", { id: "MATH 1501", grade: "C" }, { id: "MATH 1511", grade: "C" }]
  },
  {
    code: "CS 2340",
    title: "Objects and Design", 
    prerequisites: ["and", 
      { id: "CS 1331", grade: "C" }, 
      ["or", { id: "MATH 1553", grade: "D" }, { id: "MATH 1554", grade: "D" }]
    ]
  },
  {
    code: "SIMPLE 101",
    title: "Simple Course",
    prerequisites: "MATH 1501"
  },
  {
    code: "MULTIPLE 200", 
    title: "Multiple Prerequisites",
    prerequisites: [
      { id: "COURSE 101", grade: "C" },
      { id: "COURSE 102", grade: "B" }
    ]
  }
];

export const PrerequisiteTest: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Prerequisite Display Test</h1>
      
      {testCourses.map(course => (
        <Card key={course.code} className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg">{course.code} - {course.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Full Display:</h4>
              <PrerequisiteDisplay 
                prerequisites={course.prerequisites}
                onCourseClick={(code) => console.log('Clicked:', code)}
              />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Compact Display:</h4>
              <PrerequisiteDisplay 
                prerequisites={course.prerequisites}
                compact={true}
                onCourseClick={(code) => console.log('Clicked:', code)}
              />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Badge Display (for cards):</h4>
              <div className="flex gap-1">
                <PrerequisiteBadges prerequisites={course.prerequisites} maxShow={2} />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Raw Data:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(course.prerequisites, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};