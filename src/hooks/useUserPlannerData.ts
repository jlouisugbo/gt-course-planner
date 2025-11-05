'use client';

import { useUserProfile } from '@/hooks/useUserProfile';
import { useSemesters } from '@/hooks/useSemesters';
import { useMultipleDegreePrograms } from '@/hooks/useDegreePrograms';

export interface UserPlannerData {
  profile: ReturnType<typeof useUserProfile>['profile'];
  semesters: Record<string, any>;
  programs: ReturnType<typeof useMultipleDegreePrograms>['programs'];
  isLoading: boolean;
  error: Error | null;
}

export function useUserPlannerData(): UserPlannerData {
  const { profile, isLoading: profileLoading, error: profileError } = useUserProfile();
  const semestersQuery = useSemesters();
  const semesters = (semestersQuery.data as any) || {};
  const semestersLoading = semestersQuery.isLoading;
  const semestersError = semestersQuery.error as Error | null;

  const params = [] as Array<{ major: string; degreeType: 'BS' | 'MS' | 'PhD' | 'Minor' | 'Thread' }>;
  if (profile?.major) {
    params.push({ major: profile.major, degreeType: 'BS' });
  }
  const minorParams = (profile?.minors ?? []).map((m) => ({ major: m, degreeType: 'Minor' as const }));
  const { programs, isLoading: programsLoading, errors: programErrors } = useMultipleDegreePrograms([
    ...params,
    ...minorParams,
  ]);

  const isLoading = profileLoading || semestersLoading || programsLoading;
  const error = profileError || semestersError || (programErrors?.find(Boolean) as Error | null) || null;

  return { profile, semesters, programs, isLoading, error };
}

export default useUserPlannerData;
