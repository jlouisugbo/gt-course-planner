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
