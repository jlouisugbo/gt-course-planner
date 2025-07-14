export interface CourseFilters{
    search?: string
    credits?: number
    code?: string
    title?: string
    course_type?: string
}

export interface PaginatedResponse<T>{
    data: T[];
    total: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    page: number;
    totalPages: number;
    pageSize: number;
}

export interface PaginationParams{
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    filters?: CourseFilters;
    limit?: number;
}