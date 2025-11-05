/**
 * Test Fixtures - Courses
 * Mock data for testing
 */

import type { Course } from '@/types';
import type { DBCourseResponse } from '@/types/api-responses';

export const mockCourse: Course = {
  id: 1,
  code: 'CS 1301',
  title: 'Intro to Computing',
  description: 'Introduction to computing and programming using Python',
  credits: 3,
  college: 'College of Computing',
  collegeId: 1,
  department: 'Computer Science',
  level: 1000,
  prerequisites: undefined,
  corequisites: [],
  semesterOffered: ['Fall', 'Spring', 'Summer'],
  courseType: 'Core',
  isActive: true,
};

export const mockDBCourse: DBCourseResponse = {
  id: 1,
  code: 'CS 1301',
  title: 'Intro to Computing',
  description: 'Introduction to computing and programming using Python',
  credits: 3,
  college: 'College of Computing',
  college_id: 1,
  department: 'Computer Science',
  level: 1000,
  prerequisites: undefined,
  corequisites: [],
  semester_offered: ['Fall', 'Spring', 'Summer'],
  course_type: 'Core',
  is_active: true,
};

export const mockCourseWithPrereqs: Course = {
  id: 2,
  code: 'CS 1331',
  title: 'Intro to Object Oriented Programming',
  description: 'Introduction to object-oriented programming using Java',
  credits: 3,
  college: 'College of Computing',
  collegeId: 1,
  department: 'Computer Science',
  level: 1000,
  prerequisites: {
    type: 'AND',
    courses: ['CS 1301'],
  },
  courseType: 'Core',
  isActive: true,
};

export const mockCourses: Course[] = [
  mockCourse,
  mockCourseWithPrereqs,
  {
    id: 3,
    code: 'CS 1332',
    title: 'Data Structures and Algorithms',
    credits: 3,
    college: 'College of Computing',
    department: 'Computer Science',
    level: 1000,
    prerequisites: {
      type: 'AND',
      courses: ['CS 1331'],
    },
    isActive: true,
  },
];
