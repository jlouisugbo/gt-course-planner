'use client';

import { useUserPlannerData } from './useUserPlannerData';

function getDefaultPlannerData() {
  return {
    profile: null,
    semesters: {},
    programs: [],
  };
}

export function useReliablePlannerData() {
  const data = useUserPlannerData();

  if (data.error) {
    // TODO: plug in cached values (localStorage/memory) if needed
    const fallback = getDefaultPlannerData();
    return { ...fallback, isLoading: false, error: data.error } as const;
  }

  return data;
}

export default useReliablePlannerData;
