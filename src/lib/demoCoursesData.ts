/**
 * Demo courses data for different majors
 * This provides sample course plans when users first sign up
 */

import { Course } from '@/types';

interface SemesterPlan {
  semesterKey: string;
  courses: Partial<Course>[];
}

interface MajorCoursePlan {
  major: string;
  semesters: SemesterPlan[];
}

const createCourse = (
  code: string,
  title: string,
  credits: number = 3,
  description?: string,
  status: 'planned' | 'in-progress' | 'completed' = 'planned'
): Partial<Course> => ({
  code,
  title,
  credits,
  description: description || `${code} - ${title}`,
  status,
  grade: status === 'completed' ? 'A' : undefined,
  prerequisites: {},
  college: 'Georgia Institute of Technology',
  offerings: { fall: true, spring: true, summer: false },
  difficulty: 3,
  // Non-typed helper flag used in demo rendering only
  type: 'regular'
} as any);

export const DEMO_COURSE_PLANS: MajorCoursePlan[] = [
  {
    major: 'Aerospace Engineering',
    semesters: [
      {
        semesterKey: '2021-spring',
        courses: [
          createCourse('MATH 1551', 'Differential Calculus', 4),
          createCourse('CHEM 1310', 'General Chemistry', 4),
          createCourse('CS 1371', 'Computing for Engineers', 3),
          createCourse('ENGL 1101', 'English Composition I', 3),
          createCourse('APPH 1040', 'Scientific Foundations of Health', 2)
        ]
      },
      {
        semesterKey: '2021-summer',
        courses: [
          createCourse('MATH 1552', 'Integral Calculus', 4),
          createCourse('PHYS 2211', 'Intro Physics I', 4)
        ]
      },
      {
        semesterKey: '2022-fall',
        courses: [
          createCourse('MATH 2551', 'Multivariable Calculus', 4),
          createCourse('PHYS 2212', 'Intro Physics II', 4),
          createCourse('AE 1770', 'Intro to Aerospace Engineering', 3),
          createCourse('ENGL 1102', 'English Composition II', 3),
          createCourse('COE 2001', 'Statics', 3)
        ]
      },
      {
        semesterKey: '2022-spring',
        courses: [
          createCourse('MATH 2552', 'Differential Equations', 4),
          createCourse('AE 2010', 'Dynamics', 3),
          createCourse('MSE 2001', 'Principles of Materials Science', 3),
          createCourse('ECON 2105', 'Principles of Macroeconomics', 3),
          createCourse('HTS 1031', 'History, Technology & Society', 3)
        ]
      },
      {
        semesterKey: '2022-summer',
        courses: [
          createCourse('AE 2011', 'Thermodynamics', 3),
          createCourse('MATH 3770', 'Statistics and Applications', 3)
        ]
      },
      {
        semesterKey: '2023-fall',
        courses: [
          createCourse('AE 3140', 'Fluid Mechanics', 3),
          createCourse('AE 3530', 'System Dynamics & Vibration', 3),
          createCourse('AE 2220', 'Programming for Engineers', 3),
          createCourse('MATH 3012', 'Applied Combinatorics', 3),
          createCourse('LMC 3403', 'Technical Communication', 3)
        ]
      }
    ]
  },
  {
    major: 'Computer Science',
    semesters: [
      {
        semesterKey: '2021-spring',
        courses: [
          createCourse('CS 1301', 'Intro to Computing', 3),
          createCourse('MATH 1551', 'Differential Calculus', 4),
          createCourse('ENGL 1101', 'English Composition I', 3),
          createCourse('HIST 2111', 'US History to 1865', 3),
          createCourse('APPH 1040', 'Scientific Foundations of Health', 2)
        ]
      },
      {
        semesterKey: '2021-summer',
        courses: [
          createCourse('CS 1331', 'Object-Oriented Programming', 3),
          createCourse('MATH 1552', 'Integral Calculus', 4)
        ]
      },
      {
        semesterKey: '2022-fall',
        courses: [
          createCourse('CS 1332', 'Data Structures & Algorithms', 3),
          createCourse('MATH 2551', 'Multivariable Calculus', 4),
          createCourse('PHYS 2211', 'Intro Physics I', 4),
          createCourse('ENGL 1102', 'English Composition II', 3),
          createCourse('PSYC 1101', 'General Psychology', 3)
        ]
      },
      {
        semesterKey: '2022-spring',
        courses: [
          createCourse('CS 2110', 'Computer Organization & Programming', 4),
          createCourse('MATH 1553', 'Linear Algebra', 4),
          createCourse('PHYS 2212', 'Intro Physics II', 4),
          createCourse('ECON 2105', 'Principles of Macroeconomics', 3)
        ]
      },
      {
        semesterKey: '2022-summer',
        courses: [
          createCourse('CS 2340', 'Objects and Design', 3),
          createCourse('MATH 3012', 'Applied Combinatorics', 3)
        ]
      }
    ]
  },
  {
    major: 'Mechanical Engineering',
    semesters: [
      {
        semesterKey: '2021-spring',
        courses: [
          createCourse('MATH 1551', 'Differential Calculus', 4),
          createCourse('CHEM 1310', 'General Chemistry', 4),
          createCourse('CS 1371', 'Computing for Engineers', 3),
          createCourse('ENGL 1101', 'English Composition I', 3),
          createCourse('APPH 1040', 'Scientific Foundations of Health', 2)
        ]
      },
      {
        semesterKey: '2022-fall',
        courses: [
          createCourse('ME 2016', 'Computer Applications', 3),
          createCourse('COE 2001', 'Statics', 3),
          createCourse('MATH 2551', 'Multivariable Calculus', 4),
          createCourse('PHYS 2211', 'Intro Physics I', 4),
          createCourse('ENGL 1102', 'English Composition II', 3)
        ]
      }
    ]
  }
];

export const getCoursePlanForMajor = (major: string): SemesterPlan[] => {
  const plan = DEMO_COURSE_PLANS.find(p => 
    p.major.toLowerCase() === major.toLowerCase()
  );
  
  return plan?.semesters || DEMO_COURSE_PLANS[0].semesters; // Default to Aerospace if not found
};

export const populateSemesterWithDemoCourses = (
  semesterKey: string,
  major: string
): Partial<Course>[] => {
  const coursePlan = getCoursePlanForMajor(major);
  const semesterPlan = coursePlan.find(s => s.semesterKey === semesterKey);
  
  return semesterPlan?.courses || [];
};