/**
 * Demo Data - Comprehensive sample data for demo mode
 * Includes courses, deadlines, GPA history, activity, opportunities, and advisors
 */

import { PlannedCourse, SemesterData, Deadline, ActivityItem, GPAHistoryItem } from "@/types";
import { Opportunity, OpportunityApplication } from "@/types/opportunities";
import { Advisor, AdvisorConnection, AdvisorAppointment } from "@/types/advisors";

/**
 * Demo Completed Courses - Realistic GT CS curriculum (Freshman + Sophomore years)
 */
export const DEMO_COMPLETED_COURSES: PlannedCourse[] = [
  // Fall 2022 - Freshman Year
  {
    id: 1301,
    code: 'CS 1301',
    title: 'Intro to Computing',
    credits: 3,
    description: 'Introduction to computing and programming using Python',
    status: 'completed',
    grade: 'A',
    semesterId: 202200,
    prerequisites: {},
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 2,
    type: 'regular'
  },
  {
    id: 1551,
    code: 'MATH 1551',
    title: 'Differential Calculus',
    credits: 4,
    description: 'Differential calculus with applications',
    status: 'completed',
    grade: 'B',
    semesterId: 202200,
    prerequisites: {},
    college: 'College of Sciences',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 3,
    type: 'regular'
  },
  {
    id: 1101,
    code: 'ENGL 1101',
    title: 'English Composition I',
    credits: 3,
    description: 'Composition and rhetoric with an emphasis on expository writing',
    status: 'completed',
    grade: 'A',
    semesterId: 202200,
    prerequisites: {},
    college: 'Ivan Allen College',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 2,
    type: 'regular'
  },
  {
    id: 2111,
    code: 'HIST 2111',
    title: 'US History to 1865',
    credits: 3,
    description: 'Survey of US history from colonial era to Civil War',
    status: 'completed',
    grade: 'A',
    semesterId: 202200,
    prerequisites: {},
    college: 'Ivan Allen College',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 2,
    type: 'regular'
  },
  // Spring 2023
  {
    id: 1331,
    code: 'CS 1331',
    title: 'Object-Oriented Programming',
    credits: 3,
    description: 'Introduction to object-oriented programming using Java',
    status: 'completed',
    grade: 'A',
    semesterId: 202301,
    prerequisites: { and: [1301] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 3,
    type: 'regular'
  },
  {
    id: 1552,
    code: 'MATH 1552',
    title: 'Integral Calculus',
    credits: 4,
    description: 'Integral calculus with applications',
    status: 'completed',
    grade: 'B',
    semesterId: 202301,
    prerequisites: { and: [1551] },
    college: 'College of Sciences',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 3,
    type: 'regular'
  },
  {
    id: 1102,
    code: 'ENGL 1102',
    title: 'English Composition II',
    credits: 3,
    description: 'Composition, research, and argument',
    status: 'completed',
    grade: 'A',
    semesterId: 202301,
    prerequisites: { and: [1101] },
    college: 'Ivan Allen College',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 2,
    type: 'regular'
  },
  {
    id: 1101_2,
    code: 'PSYC 1101',
    title: 'General Psychology',
    credits: 3,
    description: 'Introduction to psychological science',
    status: 'completed',
    grade: 'A',
    semesterId: 202301,
    prerequisites: {},
    college: 'Ivan Allen College',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 2,
    type: 'regular'
  },
  // Fall 2023 - Sophomore Year
  {
    id: 1332,
    code: 'CS 1332',
    title: 'Data Structures & Algorithms',
    credits: 3,
    description: 'Data structures and algorithms with Java',
    status: 'completed',
    grade: 'A',
    semesterId: 202300,
    prerequisites: { and: [1331] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 4,
    type: 'regular'
  },
  {
    id: 2551,
    code: 'MATH 2551',
    title: 'Multivariable Calculus',
    credits: 4,
    description: 'Multivariable and vector calculus',
    status: 'completed',
    grade: 'B',
    semesterId: 202300,
    prerequisites: { and: [1552] },
    college: 'College of Sciences',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 4,
    type: 'regular'
  },
  {
    id: 2211,
    code: 'PHYS 2211',
    title: 'Intro Physics I',
    credits: 4,
    description: 'Mechanics, waves, and heat',
    status: 'completed',
    grade: 'B',
    semesterId: 202300,
    prerequisites: { and: [1551] },
    college: 'College of Sciences',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 4,
    type: 'regular'
  },
  {
    id: 2105,
    code: 'ECON 2105',
    title: 'Principles of Macroeconomics',
    credits: 3,
    description: 'Introduction to macroeconomic theory',
    status: 'completed',
    grade: 'A',
    semesterId: 202300,
    prerequisites: {},
    college: 'Scheller College of Business',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 2,
    type: 'regular'
  },
  // Spring 2024
  {
    id: 2110,
    code: 'CS 2110',
    title: 'Computer Organization & Programming',
    credits: 4,
    description: 'Computer organization and assembly language programming',
    status: 'completed',
    grade: 'A',
    semesterId: 202401,
    prerequisites: { and: [1332] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 4,
    type: 'regular'
  },
  {
    id: 1553,
    code: 'MATH 1553',
    title: 'Linear Algebra',
    credits: 4,
    description: 'Linear algebra with applications',
    status: 'completed',
    grade: 'A',
    semesterId: 202401,
    prerequisites: { and: [1552] },
    college: 'College of Sciences',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 3,
    type: 'regular'
  },
  {
    id: 2212,
    code: 'PHYS 2212',
    title: 'Intro Physics II',
    credits: 4,
    description: 'Electricity, magnetism, and optics',
    status: 'completed',
    grade: 'B',
    semesterId: 202401,
    prerequisites: { and: [2211] },
    college: 'College of Sciences',
    offerings: { fall: true, spring: true, summer: true },
    difficulty: 4,
    type: 'regular'
  },
];

/**
 * Demo In-Progress Courses - Current semester (Fall 2024)
 */
export const DEMO_IN_PROGRESS_COURSES: PlannedCourse[] = [
  {
    id: 2340,
    code: 'CS 2340',
    title: 'Objects and Design',
    credits: 3,
    description: 'Object-oriented software development and design patterns',
    status: 'in-progress',
    semesterId: 202400,
    prerequisites: { and: [1332] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 4,
    type: 'regular'
  },
  {
    id: 3510,
    code: 'CS 3510',
    title: 'Design & Analysis of Algorithms',
    credits: 3,
    description: 'Algorithm design and computational complexity',
    status: 'in-progress',
    semesterId: 202400,
    prerequisites: { and: [1332, 1553] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 5,
    type: 'regular'
  },
  {
    id: 3012,
    code: 'MATH 3012',
    title: 'Applied Combinatorics',
    credits: 3,
    description: 'Discrete mathematics and combinatorics',
    status: 'in-progress',
    semesterId: 202400,
    prerequisites: { and: [1553] },
    college: 'College of Sciences',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 4,
    type: 'regular'
  },
  {
    id: 3511,
    code: 'CS 3511',
    title: 'Algorithms, Machines, & Languages',
    credits: 3,
    description: 'Theory of computation and formal languages',
    status: 'in-progress',
    semesterId: 202400,
    prerequisites: { and: [1332] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 5,
    type: 'regular'
  },
];

/**
 * Demo Planned Courses - Future semesters
 */
export const DEMO_PLANNED_COURSES: PlannedCourse[] = [
  // Spring 2025
  {
    id: 3600,
    code: 'CS 3600',
    title: 'Introduction to Artificial Intelligence',
    credits: 3,
    description: 'Foundational AI concepts and techniques',
    status: 'planned',
    semesterId: 202501,
    prerequisites: { and: [1332, 1553] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 4,
    type: 'regular'
  },
  {
    id: 3750,
    code: 'CS 3750',
    title: 'Computer Organization & Architecture',
    credits: 4,
    description: 'Computer architecture and system design',
    status: 'planned',
    semesterId: 202501,
    prerequisites: { and: [2110] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 4,
    type: 'regular'
  },
  {
    id: 2050,
    code: 'MATH 2050',
    title: 'Introduction to Proof',
    credits: 3,
    description: 'Mathematical reasoning and proof techniques',
    status: 'planned',
    semesterId: 202501,
    prerequisites: { and: [1553] },
    college: 'College of Sciences',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 4,
    type: 'regular'
  },
  // Fall 2025
  {
    id: 4641,
    code: 'CS 4641',
    title: 'Machine Learning',
    credits: 3,
    description: 'Machine learning algorithms and applications',
    status: 'planned',
    semesterId: 202500,
    prerequisites: { and: [3510, 1553] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 5,
    type: 'regular'
  },
  {
    id: 3651,
    code: 'CS 3651',
    title: 'Prototyping Intelligent Devices',
    credits: 3,
    description: 'Building intelligent physical devices',
    status: 'planned',
    semesterId: 202500,
    prerequisites: { and: [2110] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 3,
    type: 'regular'
  },
  {
    id: 4400,
    code: 'CS 4400',
    title: 'Database Systems',
    credits: 3,
    description: 'Database design and implementation',
    status: 'planned',
    semesterId: 202500,
    prerequisites: { and: [1332] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 4,
    type: 'regular'
  },
  // Spring 2026
  {
    id: 4476,
    code: 'CS 4476',
    title: 'Introduction to Computer Vision',
    credits: 3,
    description: 'Image processing and computer vision',
    status: 'planned',
    semesterId: 202601,
    prerequisites: { and: [3510, 1553] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 5,
    type: 'regular'
  },
  {
    id: 4460,
    code: 'CS 4460',
    title: 'Information Visualization',
    credits: 3,
    description: 'Visual representation of data and information',
    status: 'planned',
    semesterId: 202601,
    prerequisites: { and: [2340] },
    college: 'College of Computing',
    offerings: { fall: true, spring: true, summer: false },
    difficulty: 3,
    type: 'regular'
  },
];

/**
 * Demo Deadlines - Realistic academic deadlines
 */
export const DEMO_DEADLINES: Deadline[] = [
  {
    id: 1,
    title: 'Fall 2024 Drop/Swap Deadline',
    description: 'Last day to drop or swap courses without a W',
    date: '2024-09-15',
    type: 'academic',
    priority: 'high',
    is_active: true,
    user_id: null,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Fall 2024 Withdrawal Deadline',
    description: 'Last day to withdraw from courses with a W',
    date: '2024-10-25',
    type: 'academic',
    priority: 'high',
    is_active: true,
    user_id: null,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Spring 2025 Registration Begins',
    description: 'Registration opens for Spring 2025 semester',
    date: '2024-11-01',
    type: 'registration',
    priority: 'medium',
    is_active: true,
    user_id: null,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    title: 'Fall 2024 Final Exams',
    description: 'Final exam period begins',
    date: '2024-12-09',
    type: 'academic',
    priority: 'high',
    is_active: true,
    user_id: null,
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    title: 'Spring 2025 Classes Begin',
    description: 'First day of Spring 2025 semester',
    date: '2025-01-06',
    type: 'academic',
    priority: 'high',
    is_active: true,
    user_id: null,
    created_at: new Date().toISOString()
  },
  {
    id: 6,
    title: 'FASET Registration Deadline',
    description: 'Last day to register for summer FASET',
    date: '2025-04-01',
    type: 'registration',
    priority: 'medium',
    is_active: true,
    user_id: null,
    created_at: new Date().toISOString()
  },
];

/**
 * Demo Activity History - Recent user actions
 */
export const DEMO_ACTIVITY: ActivityItem[] = [
  {
    id: 1,
    type: 'course_added',
    title: 'Added CS 4476 to Spring 2026',
    description: 'Added Introduction to Computer Vision',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    metadata: {
      courseCode: 'CS 4476',
      semester: 'Spring 2026'
    }
  },
  {
    id: 2,
    type: 'course_completed',
    title: 'Marked CS 2110 as complete',
    description: 'Completed with grade: A',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    metadata: {
      courseCode: 'CS 2110',
      grade: 'A'
    }
  },
  {
    id: 3,
    type: 'requirement_satisfied',
    title: 'Satisfied Calculus requirement',
    description: 'Completed MATH 1552 with grade B',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    metadata: {
      requirement: 'Calculus II',
      courseCode: 'MATH 1552'
    }
  },
  {
    id: 4,
    type: 'course_moved',
    title: 'Moved CS 3600 to Spring 2025',
    description: 'Rescheduled from Fall 2024',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    metadata: {
      courseCode: 'CS 3600',
      fromSemester: 'Fall 2024',
      toSemester: 'Spring 2025'
    }
  },
  {
    id: 5,
    type: 'profile_updated',
    title: 'Updated academic profile',
    description: 'Added Mathematics minor',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    metadata: {
      field: 'minors',
      value: 'Mathematics'
    }
  },
];

/**
 * Demo GPA History - Semester-by-semester GPA
 */
export const DEMO_GPA_HISTORY: GPAHistoryItem[] = [
  {
    semester: 'Fall',
    year: 2022,
    gpa: 3.69,
    credits: 13
  },
  {
    semester: 'Spring',
    year: 2023,
    gpa: 3.77,
    credits: 13
  },
  {
    semester: 'Fall',
    year: 2023,
    gpa: 3.71,
    credits: 14
  },
  {
    semester: 'Spring',
    year: 2024,
    gpa: 3.83,
    credits: 12
  },
  {
    semester: 'Fall',
    year: 2024,
    gpa: 3.75, // In progress - projected
    credits: 12
  },
];

/**
 * Generate demo semesters with courses
 */
export function generateDemoSemesters(): Record<number, SemesterData> {
  const semesters: Record<number, SemesterData> = {};

  // Helper to create semester ID (YYYYSS format)
  const createSemesterId = (year: number, season: 'Fall' | 'Spring' | 'Summer'): number => {
    const seasonIndex = season === 'Fall' ? 0 : season === 'Spring' ? 1 : 2;
    return year * 100 + seasonIndex;
  };

  // Helper to create empty semester
  const createSemester = (year: number, season: 'Fall' | 'Spring' | 'Summer'): SemesterData => {
    const id = createSemesterId(year, season);
    return {
      id,
      year,
      season,
      courses: [],
      totalCredits: 0,
      isCurrentSemester: id === 202400, // Fall 2024 is current
      gpa: 0
    };
  };

  // Create semesters from Fall 2022 to Spring 2026
  const semesterSequence = [
    { year: 2022, season: 'Fall' as const },
    { year: 2023, season: 'Spring' as const },
    { year: 2023, season: 'Fall' as const },
    { year: 2024, season: 'Spring' as const },
    { year: 2024, season: 'Fall' as const },
    { year: 2025, season: 'Spring' as const },
    { year: 2025, season: 'Fall' as const },
    { year: 2026, season: 'Spring' as const },
  ];

  semesterSequence.forEach(({ year, season }) => {
    const id = createSemesterId(year, season);
    semesters[id] = createSemester(year, season);
  });

  // Add courses to semesters
  const allCourses = [
    ...DEMO_COMPLETED_COURSES,
    ...DEMO_IN_PROGRESS_COURSES,
    ...DEMO_PLANNED_COURSES
  ];

  allCourses.forEach(course => {
    if (semesters[course.semesterId]) {
      semesters[course.semesterId].courses.push(course);
      semesters[course.semesterId].totalCredits += course.credits;
    }
  });

  // Add GPA to completed semesters
  DEMO_GPA_HISTORY.forEach(gpaItem => {
    const season = gpaItem.semester as 'Fall' | 'Spring';
    const id = createSemesterId(gpaItem.year, season);
    if (semesters[id]) {
      semesters[id].gpa = gpaItem.gpa;
    }
  });

  return semesters;
}

/**
 * Get all demo courses
 */
export function getAllDemoCourses(): PlannedCourse[] {
  return [
    ...DEMO_COMPLETED_COURSES,
    ...DEMO_IN_PROGRESS_COURSES,
    ...DEMO_PLANNED_COURSES
  ];
}

/**
 * Calculate demo statistics
 */
export function getDemoStats() {
  const allCourses = getAllDemoCourses();
  const completedCourses = DEMO_COMPLETED_COURSES;
  const totalCredits = completedCourses.reduce((sum, course) => sum + course.credits, 0);
  const cumulativeGPA = DEMO_GPA_HISTORY[DEMO_GPA_HISTORY.length - 1]?.gpa || 3.75;

  return {
    totalCourses: allCourses.length,
    completedCourses: completedCourses.length,
    inProgressCourses: DEMO_IN_PROGRESS_COURSES.length,
    plannedCourses: DEMO_PLANNED_COURSES.length,
    totalCredits,
    cumulativeGPA,
    completionRate: (completedCourses.length / allCourses.length) * 100
  };
}

// =====================================================
// DEMO OPPORTUNITIES & APPLICATIONS
// =====================================================

/**
 * Demo Opportunities - Realistic GT career opportunities
 */
export const DEMO_OPPORTUNITIES: Opportunity[] = [
  // INTERNSHIPS
  {
    id: 1,
    title: 'Software Engineering Intern - Machine Learning',
    company: 'Google',
    description: 'Work on cutting-edge machine learning projects with the Google Brain team. Build scalable ML models and infrastructure to power Google products used by billions. Collaborate with world-class researchers and engineers on projects involving computer vision, NLP, and deep learning.',
    opportunity_type: 'internship',
    application_deadline: '2025-02-15',
    requirements: {
      majors: ['Computer Science', 'Computer Engineering'],
      min_gpa: 3.5,
      skills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning'],
      preferred_courses: ['CS 4641', 'CS 3600'],
      year_level: 'Junior or Senior'
    },
    location: 'Mountain View, CA',
    is_active: true,
    posted_by: null,
    created_at: '2024-10-01T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z'
  },
  {
    id: 2,
    title: 'Cloud Infrastructure Intern',
    company: 'Microsoft',
    description: 'Join Microsoft Azure team to build and maintain cloud infrastructure serving millions of customers. Work on distributed systems, containerization, and cloud-native architectures. Gain experience with Azure services, Kubernetes, and large-scale deployment automation.',
    opportunity_type: 'internship',
    application_deadline: '2025-03-01',
    requirements: {
      majors: ['Computer Science'],
      min_gpa: 3.3,
      skills: ['Azure', 'Kubernetes', 'Docker', 'Distributed Systems', 'Cloud Computing'],
      preferred_courses: ['CS 3750', 'CS 4400'],
      year_level: 'Sophomore, Junior, or Senior'
    },
    location: 'Redmond, WA',
    is_active: true,
    posted_by: null,
    created_at: '2024-10-05T00:00:00Z',
    updated_at: '2024-10-05T00:00:00Z'
  },
  {
    id: 3,
    title: 'Full Stack Development Intern',
    company: 'TechStart Financial',
    description: 'Build the next generation of fintech products for a rapidly growing Atlanta startup. Work across the full stack using React, Node.js, and PostgreSQL. Contribute to production code from day one and learn modern web development practices in an agile environment.',
    opportunity_type: 'internship',
    application_deadline: '2025-01-20',
    requirements: {
      majors: ['Computer Science', 'Software Engineering'],
      min_gpa: 3.0,
      skills: ['React', 'Node.js', 'JavaScript/TypeScript', 'SQL', 'REST APIs'],
      preferred_courses: ['CS 2340', 'CS 4400'],
      year_level: 'Any'
    },
    location: 'Atlanta, GA',
    is_active: true,
    posted_by: null,
    created_at: '2024-10-10T00:00:00Z',
    updated_at: '2024-10-10T00:00:00Z'
  },

  // CO-OPS
  {
    id: 4,
    title: 'Robotics Engineering Co-op',
    company: 'SpaceX',
    description: 'Multi-semester co-op position working on autonomous robotics systems for spacecraft and ground operations. Design control algorithms, integrate sensors, and develop simulation environments. Work alongside aerospace engineers on mission-critical systems.',
    opportunity_type: 'co-op',
    application_deadline: '2025-01-31',
    requirements: {
      majors: ['Computer Science', 'Computer Engineering', 'Aerospace Engineering'],
      min_gpa: 3.3,
      skills: ['C++', 'ROS (Robot Operating System)', 'Control Systems', 'Embedded Systems'],
      preferred_courses: ['CS 3651', 'CS 3600'],
      year_level: 'Junior or Senior',
      other: 'Must be available for 3 consecutive semesters'
    },
    location: 'Hawthorne, CA',
    is_active: true,
    posted_by: null,
    created_at: '2024-10-08T00:00:00Z',
    updated_at: '2024-10-08T00:00:00Z'
  },
  {
    id: 5,
    title: 'Software Co-op - Mission Control Systems',
    company: 'NASA',
    description: '3-semester co-op developing mission-critical software for NASA Mission Control. Work on real-time systems monitoring astronauts and spacecraft. Requires US citizenship and ability to obtain security clearance. Gain unique experience in space operations software.',
    opportunity_type: 'co-op',
    application_deadline: '2025-02-28',
    requirements: {
      majors: ['Computer Science', 'Computer Engineering'],
      min_gpa: 3.4,
      skills: ['Python', 'C++', 'Real-time Systems', 'System Architecture'],
      preferred_courses: ['CS 2110', 'CS 3750'],
      year_level: 'Junior or Senior',
      other: 'US citizenship required, security clearance eligible'
    },
    location: 'Houston, TX',
    is_active: true,
    posted_by: null,
    created_at: '2024-10-12T00:00:00Z',
    updated_at: '2024-10-12T00:00:00Z'
  },

  // RESEARCH POSITIONS
  {
    id: 6,
    title: 'Undergraduate Research Assistant - Computer Vision',
    company: 'GT Machine Learning Lab',
    description: 'Assist with cutting-edge computer vision research in the GT ML Lab. Work on projects involving object detection, image segmentation, and video analysis. Co-author research papers and present at conferences. Excellent preparation for graduate school.',
    opportunity_type: 'research',
    application_deadline: '2025-11-15',
    requirements: {
      majors: ['Computer Science'],
      min_gpa: 3.5,
      skills: ['Python', 'PyTorch', 'Computer Vision', 'Deep Learning'],
      preferred_courses: ['CS 4641', 'CS 4476'],
      year_level: 'Junior or Senior',
      other: '10-15 hours per week commitment, can receive course credit or pay'
    },
    location: 'Atlanta, GA (On-campus)',
    is_active: true,
    posted_by: null,
    created_at: '2024-10-20T00:00:00Z',
    updated_at: '2024-10-20T00:00:00Z'
  },
  {
    id: 7,
    title: 'Research Assistant - Autonomous Systems',
    company: 'GT Robotics Lab',
    description: 'Join the GT Robotics Lab to work on autonomous navigation and path planning algorithms. Implement and test algorithms on real robotic platforms. Contribute to research projects funded by NSF and industry partners.',
    opportunity_type: 'research',
    application_deadline: '2025-12-01',
    requirements: {
      majors: ['Computer Science', 'Computer Engineering', 'Robotics'],
      min_gpa: 3.2,
      skills: ['Python', 'C++', 'ROS', 'Algorithms'],
      preferred_courses: ['CS 3510', 'CS 3600'],
      year_level: 'Sophomore, Junior, or Senior',
      other: 'Flexible hours, 2-semester minimum commitment'
    },
    location: 'Atlanta, GA (On-campus)',
    is_active: true,
    posted_by: null,
    created_at: '2024-10-18T00:00:00Z',
    updated_at: '2024-10-18T00:00:00Z'
  },

  // FULL-TIME JOBS
  {
    id: 8,
    title: 'New Grad Software Engineer',
    company: 'Amazon',
    description: 'Join Amazon Web Services (AWS) as a full-time software engineer. Work on distributed systems serving millions of customers worldwide. Solve complex technical challenges at massive scale. Opportunities across multiple teams and locations.',
    opportunity_type: 'job',
    application_deadline: '2025-04-01',
    requirements: {
      majors: ['Computer Science', 'Computer Engineering', 'Software Engineering'],
      min_gpa: 3.0,
      skills: ['Java', 'Python', 'Data Structures', 'Algorithms', 'System Design'],
      preferred_courses: ['CS 1332', 'CS 3510'],
      year_level: 'Graduating 2025-2026',
      other: 'Bachelor\'s degree in Computer Science or related field'
    },
    location: 'Seattle, WA / Austin, TX',
    is_active: true,
    posted_by: null,
    created_at: '2024-09-15T00:00:00Z',
    updated_at: '2024-09-15T00:00:00Z'
  },
  {
    id: 9,
    title: 'Software Engineer, Early Career',
    company: 'Meta',
    description: 'Build products used by over 3 billion people worldwide. Work on web, mobile, AR/VR, and AI technologies. Join a team of world-class engineers and ship code that impacts billions. Competitive compensation and benefits.',
    opportunity_type: 'job',
    application_deadline: '2025-03-15',
    requirements: {
      majors: ['Computer Science', 'Computer Engineering'],
      min_gpa: 3.3,
      skills: ['Data Structures', 'Algorithms', 'System Design', 'Object-Oriented Programming'],
      preferred_courses: ['CS 1332', 'CS 3510', 'CS 2340'],
      year_level: 'Graduating 2025-2026',
      other: 'Strong coding and problem-solving skills'
    },
    location: 'Menlo Park, CA',
    is_active: true,
    posted_by: null,
    created_at: '2024-09-20T00:00:00Z',
    updated_at: '2024-09-20T00:00:00Z'
  }
];

/**
 * Demo Opportunity Applications - Student's application history
 */
export const DEMO_APPLICATIONS: OpportunityApplication[] = [
  {
    id: 1,
    user_id: -1,
    opportunity_id: 1, // Google ML Internship
    status: 'draft',
    cover_letter: 'Dear Google Hiring Team,\n\nI am excited to apply for the Software Engineering Intern - Machine Learning position. As a Computer Science student at Georgia Tech with a strong background in machine learning, I am eager to contribute to Google Brain\'s groundbreaking research.\n\nThrough coursework in CS 3600 (Intro to AI) and ongoing studies in CS 4641 (Machine Learning), I have gained hands-on experience with TensorFlow and PyTorch. My current GPA of 3.75 reflects my dedication to academic excellence.\n\n[Draft - need to finish this section about projects and skills...]',
    resume_url: null,
    application_answers: null,
    submitted_at: null,
    created_at: '2024-10-20T00:00:00Z',
    updated_at: '2024-10-25T00:00:00Z'
  },
  {
    id: 2,
    user_id: -1,
    opportunity_id: 6, // GT ML Lab Research
    status: 'submitted',
    cover_letter: 'Dear Dr. [Professor Name],\n\nI am writing to express my strong interest in the Undergraduate Research Assistant position in the GT Machine Learning Lab, specifically focusing on computer vision research.\n\nAs a junior Computer Science student with a 3.75 GPA, I have completed CS 3600 (Intro to AI) and am currently enrolled in CS 4641 (Machine Learning) and planning to take CS 4476 (Computer Vision) in Spring 2025. My academic background has given me a solid foundation in machine learning theory and practical implementation skills with Python and PyTorch.\n\nI am particularly excited about the opportunity to work on object detection and image segmentation projects. I have personal experience implementing CNNs for image classification and have followed recent developments in transformer-based vision models. The prospect of contributing to publishable research and learning from experienced researchers in the field is incredibly appealing.\n\nI can commit 15 hours per week to this position and am eager to contribute meaningfully to ongoing projects while developing my research skills.\n\nThank you for considering my application.\n\nBest regards,\nAlex Johnson',
    resume_url: null,
    application_answers: {
      research_interests: 'Computer Vision, Deep Learning, Object Detection',
      available_hours: '15 hours per week',
      start_date: 'Spring 2025',
      relevant_coursework: 'CS 3600, CS 4641 (in progress), CS 1332, CS 3510'
    },
    submitted_at: '2024-10-15T00:00:00Z',
    created_at: '2024-10-12T00:00:00Z',
    updated_at: '2024-10-15T00:00:00Z'
  },
  {
    id: 3,
    user_id: -1,
    opportunity_id: 3, // TechStart Financial (past application)
    status: 'accepted',
    cover_letter: 'Dear TechStart Financial Hiring Team,\n\nI am excited to apply for the Full Stack Development Intern position. As a sophomore Computer Science student at Georgia Tech, I am passionate about web development and eager to gain industry experience.\n\nI have completed CS 1331 (Object-Oriented Programming) and CS 1332 (Data Structures & Algorithms), giving me a strong foundation in software development. I have self-taught React and Node.js through personal projects, including building a task management web app.\n\nI am particularly drawn to TechStart because of your focus on fintech innovation and the opportunity to work on production code. The prospect of learning modern development practices in an agile environment aligns perfectly with my career goals.\n\nThank you for your consideration.\n\nBest regards,\nAlex Johnson',
    resume_url: null,
    application_answers: null,
    submitted_at: '2024-03-01T00:00:00Z',
    created_at: '2024-02-25T00:00:00Z',
    updated_at: '2024-03-20T00:00:00Z'
  },
  {
    id: 4,
    user_id: -1,
    opportunity_id: 2, // Microsoft Cloud Infrastructure
    status: 'rejected',
    cover_letter: 'Dear Microsoft Recruitment Team,\n\nI am writing to apply for the Cloud Infrastructure Intern position with Microsoft Azure. As a Computer Science student at Georgia Tech, I am fascinated by distributed systems and cloud computing.\n\nWhile I have not yet taken CS 3750 (Computer Organization & Architecture), I have strong fundamentals from CS 2110 and CS 1332. I have been learning Docker and Kubernetes through online courses and personal projects.\n\nI believe this internship would be an excellent opportunity to apply my knowledge and learn from industry leaders in cloud infrastructure.\n\nThank you for considering my application.\n\nBest regards,\nAlex Johnson',
    resume_url: null,
    application_answers: null,
    submitted_at: '2024-09-15T00:00:00Z',
    created_at: '2024-09-10T00:00:00Z',
    updated_at: '2024-10-05T00:00:00Z'
  }
];

// =====================================================
// DEMO ADVISORS & APPOINTMENTS
// =====================================================

/**
 * Demo Advisors - GT academic and career advisors
 */
export const DEMO_ADVISORS: Advisor[] = [
  {
    id: 1,
    user_id: null,
    full_name: 'Dr. Sarah Mitchell',
    email: 'sarah.mitchell@cc.gatech.edu',
    title: 'Senior Academic Advisor',
    specializations: ['Computer Science', 'Academic Planning', 'Course Selection'],
    departments: ['College of Computing'],
    bio: 'Dr. Mitchell has been advising GT students for 12 years. She specializes in helping CS students navigate degree requirements and select optimal course sequences. Known for her patient approach and comprehensive knowledge of College of Computing programs.',
    office_location: 'Klaus Advanced Computing Building, Room 2124',
    office_hours: {
      'Monday': '10:00 AM - 12:00 PM',
      'Wednesday': '2:00 PM - 4:00 PM',
      'Friday': '1:00 PM - 3:00 PM'
    },
    booking_url: null,
    is_accepting_students: true,
    max_students: 150,
    is_active: true,
    created_at: '2020-08-15T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z'
  },
  {
    id: 2,
    user_id: null,
    full_name: 'Dr. James Chen',
    email: 'james.chen@cc.gatech.edu',
    title: 'Faculty Advisor - Intelligence Thread',
    specializations: ['Machine Learning', 'Artificial Intelligence', 'Intelligence Thread'],
    departments: ['College of Computing'],
    bio: 'Dr. Chen is a faculty member specializing in machine learning and serves as the faculty advisor for the Intelligence thread. He guides students interested in AI/ML career paths and graduate school preparation. His research focuses on deep learning and computer vision.',
    office_location: 'CODA Building, Room 9103',
    office_hours: {
      'Tuesday': '3:00 PM - 5:00 PM',
      'Thursday': '3:00 PM - 5:00 PM'
    },
    booking_url: null,
    is_accepting_students: true,
    max_students: 50,
    is_active: true,
    created_at: '2019-01-10T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z'
  },
  {
    id: 3,
    user_id: null,
    full_name: 'Dr. Rebecca Taylor',
    email: 'rebecca.taylor@math.gatech.edu',
    title: 'Mathematics Academic Advisor',
    specializations: ['Mathematics', 'Minor Advising', 'Applied Mathematics'],
    departments: ['School of Mathematics'],
    bio: 'Advisor for students pursuing mathematics minors or double majors. Dr. Taylor helps students integrate math coursework with their primary major and explore applications of mathematics in computing and engineering.',
    office_location: 'Skiles Building, Room 244',
    office_hours: {
      'Monday': '1:00 PM - 3:00 PM',
      'Thursday': '10:00 AM - 12:00 PM'
    },
    booking_url: null,
    is_accepting_students: true,
    max_students: null,
    is_active: true,
    created_at: '2021-03-20T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z'
  },
  {
    id: 4,
    user_id: null,
    full_name: 'Michael Rodriguez',
    email: 'michael.rodriguez@gatech.edu',
    title: 'Career Development Advisor',
    specializations: ['Career Planning', 'Internship Search', 'Resume Review', 'Interview Prep'],
    departments: ['Center for Career Discovery and Development'],
    bio: 'Michael helps students explore career paths, prepare applications, and connect with employers. He specializes in tech industry careers and has extensive connections with major companies. Offers resume reviews, mock interviews, and career strategy sessions.',
    office_location: 'Student Center, Room 325',
    office_hours: {
      'Tuesday': '9:00 AM - 4:00 PM',
      'Friday': '9:00 AM - 2:00 PM'
    },
    booking_url: null,
    is_accepting_students: true,
    max_students: null,
    is_active: true,
    created_at: '2020-06-01T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z'
  },
  {
    id: 5,
    user_id: null,
    full_name: 'Dr. David Park',
    email: 'david.park@cc.gatech.edu',
    title: 'Faculty Advisor - Systems Thread',
    specializations: ['Computer Systems', 'Systems Architecture', 'Systems Thread'],
    departments: ['College of Computing'],
    bio: 'Faculty advisor for students in the Systems and Architecture thread. Dr. Park guides students through systems-focused coursework and helps them prepare for careers in systems engineering, cloud infrastructure, and low-level programming.',
    office_location: 'Klaus Building, Room 3108',
    office_hours: {
      'Wednesday': '2:00 PM - 4:00 PM'
    },
    booking_url: null,
    is_accepting_students: true,
    max_students: 40,
    is_active: true,
    created_at: '2019-08-25T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z'
  },
  {
    id: 6,
    user_id: null,
    full_name: 'Dr. Emily Zhang',
    email: 'emily.zhang@cc.gatech.edu',
    title: 'Faculty Research Mentor',
    specializations: ['Undergraduate Research', 'Graduate School Prep', 'Publications'],
    departments: ['College of Computing'],
    bio: 'Dr. Zhang mentors undergraduates interested in pursuing research and graduate studies. She helps students find research opportunities, apply to graduate programs, and develop research skills. Currently not accepting new students due to high mentorship load.',
    office_location: 'CODA Building, Room 8204',
    office_hours: {
      'Thursday': '1:00 PM - 3:00 PM'
    },
    booking_url: null,
    is_accepting_students: false,
    max_students: null,
    is_active: true,
    created_at: '2021-01-15T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z'
  }
];

/**
 * Demo Advisor Connections - Student's advisor relationships
 */
export const DEMO_ADVISOR_CONNECTIONS: AdvisorConnection[] = [
  {
    id: 1,
    student_id: -1,
    advisor_id: 1, // Dr. Mitchell
    connection_type: 'assigned',
    status: 'active',
    notes: 'Primary academic advisor assigned during orientation. Regular meetings for course planning and degree progress.',
    created_at: '2022-08-15T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z'
  },
  {
    id: 2,
    student_id: -1,
    advisor_id: 2, // Dr. Chen
    connection_type: 'self-selected',
    status: 'active',
    notes: 'Connected for Intelligence thread guidance and ML course selection. Helpful for research and graduate school advice.',
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-10-01T00:00:00Z'
  },
  {
    id: 3,
    student_id: -1,
    advisor_id: 5, // Dr. Park
    connection_type: 'requested',
    status: 'pending',
    notes: 'Interested in Systems thread for Devices specialization. Requested connection for fall advising session.',
    created_at: '2024-10-20T00:00:00Z',
    updated_at: '2024-10-20T00:00:00Z'
  }
];

/**
 * Demo Advisor Appointments - Past and upcoming meetings
 */
export const DEMO_APPOINTMENTS: AdvisorAppointment[] = [
  {
    id: 1,
    student_id: -1,
    advisor_id: 1, // Dr. Mitchell
    appointment_date: '2024-11-05T14:00:00Z',
    duration_minutes: 30,
    meeting_type: 'virtual',
    meeting_link: 'https://gatech.zoom.us/j/123456789',
    topic: 'Spring 2025 Course Registration Planning',
    notes: 'Discuss elective options for Spring 2025 and review graduation timeline. Need to finalize Intelligence thread courses.',
    status: 'scheduled',
    created_at: '2024-10-25T00:00:00Z',
    updated_at: '2024-10-25T00:00:00Z'
  },
  {
    id: 2,
    student_id: -1,
    advisor_id: 1, // Dr. Mitchell
    appointment_date: '2024-08-15T10:00:00Z',
    duration_minutes: 45,
    meeting_type: 'in-person',
    meeting_link: null,
    topic: 'Fall 2024 Course Selection',
    notes: 'Discussed CS 3510 and CS 3511. Dr. Mitchell advised taking them in the same semester since they complement each other well. Also discussed thread selection.',
    status: 'completed',
    created_at: '2024-08-01T00:00:00Z',
    updated_at: '2024-08-16T00:00:00Z'
  },
  {
    id: 3,
    student_id: -1,
    advisor_id: 2, // Dr. Chen
    appointment_date: '2024-09-10T15:00:00Z',
    duration_minutes: 30,
    meeting_type: 'virtual',
    meeting_link: 'https://gatech.zoom.us/j/987654321',
    topic: 'Machine Learning Research Opportunities',
    notes: 'Discussed computer vision research lab opportunities and prerequisites. Dr. Chen recommended applying to the GT ML Lab and suggested taking CS 4476 next semester. Also provided advice on strengthening ML background.',
    status: 'completed',
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-11T00:00:00Z'
  },
  {
    id: 4,
    student_id: -1,
    advisor_id: 4, // Michael Rodriguez
    appointment_date: '2024-10-18T13:00:00Z',
    duration_minutes: 60,
    meeting_type: 'in-person',
    meeting_link: null,
    topic: 'Resume and Cover Letter Review',
    notes: 'Needed to reschedule due to scheduling conflict. Will rebook for early November.',
    status: 'cancelled',
    created_at: '2024-10-10T00:00:00Z',
    updated_at: '2024-10-17T00:00:00Z'
  }
];

/**
 * Get demo opportunities
 */
export function getDemoOpportunities(): Opportunity[] {
  return [...DEMO_OPPORTUNITIES];
}

/**
 * Get demo applications
 */
export function getDemoApplications(): OpportunityApplication[] {
  return [...DEMO_APPLICATIONS];
}

/**
 * Get demo advisors
 */
export function getDemoAdvisors(): Advisor[] {
  return [...DEMO_ADVISORS];
}

/**
 * Get demo advisor connections
 */
export function getDemoConnections(): AdvisorConnection[] {
  return [...DEMO_ADVISOR_CONNECTIONS];
}

/**
 * Get demo appointments
 */
export function getDemoAppointments(): AdvisorAppointment[] {
  return [...DEMO_APPOINTMENTS];
}
