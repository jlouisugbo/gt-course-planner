"use client";

import { Course } from '@/types/courses';

interface UseAllCoursesProps {
  search?: string;
}

export function useAllCourses(_props: UseAllCoursesProps = {}) {
  const courses: Course[] = [];
  return {
    courses,
    filteredCourses: courses,
    isLoading: false,
    error: null as Error | null,
    hasMore: false,
    loadMore: () => {},
    totalCount: 0,
    total: 0,
  };
}
