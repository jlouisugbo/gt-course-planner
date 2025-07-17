import { CourseFilters } from '@/types';
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    page: number;
    totalPages: number;
    pageSize: number;
}

export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    filters?: CourseFilters;
    limit?: number;
}

export interface College {
    id: number;
    name: string;
    abbreviation: string;
    is_active: boolean;
}