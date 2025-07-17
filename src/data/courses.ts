import { supabase } from "@/lib/supabaseClient";
import {
    Course,
    CourseFilters,
    PaginatedResponse,
    PaginationParams,
} from "@/types";
import {
    useQuery,
    useInfiniteQuery,
    keepPreviousData,
} from "@tanstack/react-query";

export const fetchAllCourses = async (): Promise<Course[]> => {
    const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_active", true)
        .order("code", { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    return data;
};

export const fetchCoursesPaginated = async (
    filters: CourseFilters = {},
    pagination: PaginationParams = {},
): Promise<PaginatedResponse<Course>> => {
    const { page = 1, limit = 50 } = pagination;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from("courses")
        .select("*", { count: "exact" })
        .eq("is_active", true);

    if (filters.search) {
        query = query.ilike("title", `%${filters.search}%`);
    }

    if (filters.credits) {
        query = query.eq("credits", filters.credits);
    }

    if (filters.code) {
        query = query.ilike("code", `%${filters.code}%`);
    }

    if (filters.title) {
        query = query.ilike("title", `%${filters.title}%`);
    }

    if (filters.course_type) {
        query = query.eq("course_type", filters.course_type);
    }

    const { data, error, count } = await query
        .order("code", { ascending: true })
        .range(from, to);

    if (error) {
        throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
        data: data || [],
        total: totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        page,
        totalPages,
        pageSize: limit,
    };
};

export const fetchCourseById = async (id: string): Promise<Course | null> => {
    const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

    if (error) {
        if (error.code === "PGRST116") return null; // No course found
        throw new Error(`Failed to fetch course: ${error.message}`);
    }

    return data;
};

export const fetchCourseByCode = async (
    code: string,
): Promise<Course | null> => {
    const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();

    if (error) {
        if (error.code === "PGRST116") return null; // No course found
        throw new Error(`Failed to fetch course: ${error.message}`);
    }

    return data;
};

export const fetchCoursesInfinite = async ({
    pageParam = 0,
    filters = {},
}: {
    pageParam?: number;
    filters?: CourseFilters;
}) => {
    const limit = 20;
    const from = pageParam * limit;
    const to = from + limit - 1;

    let query = supabase
        .from("courses")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .range(from, to);

    if (filters.search) {
        query = query.ilike("title", `%${filters.search}%`);
    }

    if (filters.credits) {
        query = query.eq("credits", filters.credits);
    }

    if (filters.code) {
        query = query.ilike("code", `%${filters.code}%`);
    }

    if (filters.title) {
        query = query.ilike("title", `%${filters.title}%`);
    }

    if (filters.course_type) {
        query = query.eq("course_type", filters.course_type);
    }

    const { data, error } = await query.order("code", { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    return {
        courses: data || [],
        nextCursor: data && data.length === limit ? pageParam + 1 : undefined,
    };
};

export const useAllCourses = () => {
    return useQuery({
        queryKey: ["courses", "all"],
        queryFn: fetchAllCourses,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

export const useCoursesPaginated = (
    filters: CourseFilters = {},
    pagination: PaginationParams = {},
) => {
    return useQuery({
        queryKey: ["courses", "paginated", filters, pagination],
        queryFn: () => fetchCoursesPaginated(filters, pagination),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        placeholderData: keepPreviousData, // Keep previous page data while loading new page
    });
};

export const useCoursesInfinite = (filters: CourseFilters = {}) => {
    return useInfiniteQuery({
        queryKey: ["courses", "infinite", filters],
        queryFn: ({ pageParam }) =>
            fetchCoursesInfinite({ pageParam, filters }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

export const useCourse = (id: string) => {
    return useQuery({
        queryKey: ["courses", "single", id],
        queryFn: () => fetchCourseById(id),
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        enabled: !!id,
    });
};

export const useCourseByCode = (code: string) => {
    return useQuery({
        queryKey: ["courses", "code", code],
        queryFn: () => fetchCourseByCode(code),
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        enabled: !!code,
    });
};

export const sampleCourses: Course[] = [
    {
        id: "cs-1301",
        code: "CS 1301",
        title: "Intro to Computing",
        credits: 3,
        description:
            "Introduction to computing and programming using Python. Covers basic programming concepts, data structures, and problem-solving techniques.",
        prerequisites: [],
        corequisites: [],
        attributes: ["Foundation", "Programming"],
        offerings: {
            fall: true,
            spring: true,
            summer: true,
        },
        instructors: ["Simpkins", "McDaniel", "Stallworth"],
        difficulty: 2,
        workload: 8,
        threads: [],
        college: "CoC",
    },
    {
        id: "cs-1331",
        code: "CS 1331",
        title: "Introduction to Object Oriented Programming",
        credits: 3,
        description:
            "Object-oriented programming using Java. Covers classes, objects, inheritance, polymorphism, and basic GUI programming.",
        prerequisites: [
            {
                type: "course",
                courses: ["CS 1301"],
                logic: "AND",
            },
        ],
        corequisites: [],
        attributes: ["Foundation", "Programming"],
        offerings: {
            fall: true,
            spring: true,
            summer: false,
        },
        instructors: ["Simpkins", "McDaniel"],
        difficulty: 3,
        workload: 12,
        threads: [],
        college: "CoC",
    },
    {
        id: "cs-1332",
        code: "CS 1332",
        title: "Data Structures and Algorithms",
        credits: 3,
        description:
            "Implementation and analysis of fundamental data structures and algorithms. Covers arrays, linked lists, stacks, queues, trees, and graphs.",
        prerequisites: [
            {
                type: "course",
                courses: ["CS 1331"],
                logic: "AND",
            },
        ],
        corequisites: ["CS 2340"],
        attributes: ["Core", "Programming"],
        offerings: {
            fall: true,
            spring: true,
            summer: true,
        },
        instructors: ["Reilly", "McDaniel"],
        difficulty: 4,
        workload: 15,
        threads: [],
        college: "CoC",
    },
    {
        id: "cs-2110",
        code: "CS 2110",
        title: "Computer Organization and Programming",
        credits: 4,
        description:
            "Computer organization, machine language programming, assembly language programming, and C programming.",
        prerequisites: [
            {
                type: "course",
                courses: ["CS 1332"],
                logic: "AND",
            },
        ],
        corequisites: [],
        attributes: ["Core", "Systems"],
        offerings: {
            fall: true,
            spring: true,
            summer: false,
        },
        instructors: ["Conte", "Peng"],
        difficulty: 4,
        workload: 16,
        threads: ["Systems & Architecture"],
        college: "CoC",
    },
    {
        id: "cs-2340",
        code: "CS 2340",
        title: "Objects and Design",
        credits: 3,
        description:
            "Object-oriented programming and design techniques. Software engineering principles, UML, design patterns, and team development.",
        prerequisites: [
            {
                type: "course",
                courses: ["CS 1332"],
                logic: "AND",
            },
        ],
        corequisites: [],
        attributes: ["Core", "Software Engineering"],
        offerings: {
            fall: true,
            spring: true,
            summer: false,
        },
        instructors: ["Waters", "McDaniel"],
        difficulty: 3,
        workload: 14,
        threads: ["People"],
        college: "CoC",
    },
    {
        id: "cs-3510",
        code: "CS 3510",
        title: "Design & Analysis of Algorithms",
        credits: 3,
        description:
            "Algorithm design techniques: divide-and-conquer, dynamic programming, greedy algorithms, and network flow algorithms.",
        prerequisites: [
            {
                type: "course",
                courses: ["CS 1332", "MATH 1554"],
                logic: "AND",
            },
        ],
        corequisites: [],
        attributes: ["Core", "Theory"],
        offerings: {
            fall: true,
            spring: true,
            summer: false,
        },
        instructors: ["Vigoda", "Tetali"],
        difficulty: 5,
        workload: 18,
        threads: ["Theory"],
        college: "CoC",
    },
    {
        id: "cs-3600",
        code: "CS 3600",
        title: "Introduction to Artificial Intelligence",
        credits: 3,
        description:
            "Basic concepts and methods of artificial intelligence including problem solving, knowledge representation, and machine learning.",
        prerequisites: [
            {
                type: "course",
                courses: ["CS 1332", "MATH 1554"],
                logic: "AND",
            },
        ],
        corequisites: [],
        attributes: ["Core", "AI"],
        offerings: {
            fall: true,
            spring: true,
            summer: false,
        },
        instructors: ["Riedl", "Thomaz"],
        difficulty: 4,
        workload: 15,
        threads: ["Intelligence"],
        college: "CoC",
    },
    {
        id: "cs-4641",
        code: "CS 4641",
        title: "Machine Learning",
        credits: 3,
        description:
            "Machine learning techniques and applications including supervised learning, unsupervised learning, and reinforcement learning.",
        prerequisites: [
            {
                type: "course",
                courses: ["CS 3510", "MATH 2550"],
                logic: "AND",
            },
        ],
        corequisites: [],
        attributes: ["Elective", "AI", "Popular"],
        offerings: {
            fall: true,
            spring: true,
            summer: false,
        },
        instructors: ["Mahajan", "Song"],
        difficulty: 4,
        workload: 16,
        threads: ["Intelligence"],
        college: "CoC",
    },
    {
        id: "math-1551",
        code: "MATH 1551",
        title: "Differential Calculus",
        credits: 2,
        description:
            "Differential calculus including limits, derivatives, and applications to optimization and related rates.",
        prerequisites: [],
        corequisites: [],
        attributes: ["Math", "Foundation"],
        offerings: {
            fall: true,
            spring: true,
            summer: true,
        },
        instructors: ["Various"],
        difficulty: 3,
        workload: 10,
        threads: [],
        college: "CoS",
    },
    {
        id: "math-1552",
        code: "MATH 1552",
        title: "Integral Calculus",
        credits: 4,
        description:
            "Integral calculus including techniques of integration, applications, and infinite series.",
        prerequisites: [
            {
                type: "course",
                courses: ["MATH 1551"],
                logic: "AND",
            },
        ],
        corequisites: [],
        attributes: ["Math", "Foundation"],
        offerings: {
            fall: true,
            spring: true,
            summer: true,
        },
        instructors: ["Various"],
        difficulty: 3,
        workload: 12,
        threads: [],
        college: "CoS",
    },
];

export const getCourseById = (id: string): Course | undefined => {
    return sampleCourses.find((course) => course.id === id);
};

export const getCoursesByThread = (thread: string): Course[] => {
    return sampleCourses.filter((course) => course.threads.includes(thread));
};

export const searchCourses = (query: string): Course[] => {
    const lowercaseQuery = query.toLowerCase();
    return sampleCourses.filter(
        (course) =>
            course.code.toLowerCase().includes(lowercaseQuery) ||
            course.title.toLowerCase().includes(lowercaseQuery) ||
            course.description.toLowerCase().includes(lowercaseQuery),
    );
};
