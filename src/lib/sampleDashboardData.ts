import { PlannedCourse, ActivityItem } from "@/types";

export const generateSampleCourses = (): PlannedCourse[] => {
    const currentYear = new Date().getFullYear();
    
    return [
        // Fall 2024 - Freshman courses
        {
            id: 1001,
            code: "CS 1301",
            title: "Introduction to Computing",
            credits: 3,
            description: "Introduction to computing and programming using Python",
            prerequisites: [],
            offerings: { fall: true, spring: true, summer: false },
            difficulty: 2,
            college: "College of Computing",
            type: "core",
            semesterId: (currentYear - 1) * 100 + 0, // Fall 2024
            status: "completed",
            grade: "A",
            year: currentYear - 1,
            season: "Fall"
        },
        {
            id: 1002,
            code: "MATH 1551",
            title: "Differential Calculus",
            credits: 4,
            description: "Introduction to differential calculus",
            prerequisites: [],
            offerings: { fall: true, spring: true, summer: true },
            difficulty: 3,
            college: "College of Sciences",
            type: "core",
            semesterId: (currentYear - 1) * 100 + 0,
            status: "completed",
            grade: "B+",
            year: currentYear - 1,
            season: "Fall"
        },
        {
            id: 1003,
            code: "ENGL 1101",
            title: "English Composition I",
            credits: 3,
            description: "Introduction to academic writing",
            prerequisites: [],
            offerings: { fall: true, spring: true, summer: true },
            difficulty: 2,
            college: "Ivan Allen College",
            type: "core",
            semesterId: (currentYear - 1) * 100 + 0,
            status: "completed",
            grade: "A-",
            year: currentYear - 1,
            season: "Fall"
        },
        
        // Spring 2025 - Current semester
        {
            id: 1004,
            code: "CS 1331",
            title: "Introduction to Object-Oriented Programming",
            credits: 3,
            description: "Object-oriented programming using Java",
            prerequisites: ["CS 1301"],
            offerings: { fall: true, spring: true, summer: false },
            difficulty: 3,
            college: "College of Computing",
            type: "core",
            semesterId: currentYear * 100 + 1, // Spring 2025
            status: "in-progress",
            grade: null,
            year: currentYear,
            season: "Spring"
        },
        {
            id: 1005,
            code: "MATH 1552",
            title: "Integral Calculus",
            credits: 4,
            description: "Introduction to integral calculus",
            prerequisites: ["MATH 1551"],
            offerings: { fall: true, spring: true, summer: true },
            difficulty: 3,
            college: "College of Sciences",
            type: "core",
            semesterId: currentYear * 100 + 1,
            status: "in-progress",
            grade: null,
            year: currentYear,
            season: "Spring"
        },
        
        // Fall 2025 - Planned courses
        {
            id: 1006,
            code: "CS 2340",
            title: "Objects and Design",
            credits: 3,
            description: "Software design and development",
            prerequisites: ["CS 1331"],
            offerings: { fall: true, spring: true, summer: false },
            difficulty: 4,
            college: "College of Computing",
            type: "core",
            semesterId: currentYear * 100 + 0, // Fall 2025
            status: "planned",
            grade: null,
            year: currentYear,
            season: "Fall"
        },
        {
            id: 1007,
            code: "MATH 2550",
            title: "Introduction to Multivariable Calculus",
            credits: 4,
            description: "Multivariable calculus and applications",
            prerequisites: ["MATH 1552"],
            offerings: { fall: true, spring: true, summer: false },
            difficulty: 4,
            college: "College of Sciences",
            type: "core",
            semesterId: currentYear * 100 + 0,
            status: "planned",
            grade: null,
            year: currentYear,
            season: "Fall"
        }
    ];
};

export const generateSampleActivities = (): ActivityItem[] => {
    return [
        {
            id: 1,
            type: "course_completed",
            title: "Completed CS 1301",
            description: "Introduction to Computing - Grade: A",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) // 30 days ago
        },
        {
            id: 2,
            type: "course_added",
            title: "Added CS 2340 to Fall 2025",
            description: "Objects and Design planned for Fall semester",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) // 7 days ago
        },
        {
            id: 3,
            type: "requirement_completed",
            title: "Math Foundation Complete",
            description: "Completed MATH 1551 requirement",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45) // 45 days ago
        },
        {
            id: 4,
            type: "course_added",
            title: "Enrolled in CS 1331",
            description: "Currently taking Object-Oriented Programming",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90) // 90 days ago
        }
    ];
};

export const initializeSampleData = (usePlannerStore: any) => {
    const sampleCourses = generateSampleCourses();
    const sampleActivities = generateSampleActivities();
    
    // Add sample courses to semesters
    sampleCourses.forEach(course => {
        usePlannerStore.getState().addCourseToSemester(course);
    });
    
    // Add sample activities
    sampleActivities.forEach(activity => {
        usePlannerStore.getState().addActivity(activity);
    });
    
    // Update academic progress
    usePlannerStore.getState().updateAcademicProgress();
};