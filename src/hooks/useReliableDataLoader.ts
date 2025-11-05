"use client";

import { useEffect, useMemo, useState } from 'react';

// Minimal shapes to satisfy consumers
interface MinimalProgramSection {
  id: number | string;
  name: string;
  description?: string;
  courses?: Array<any>;
  minCredits?: number;
}

interface MinimalDegreeProgram {
  id: number | string;
  name: string;
  degreeType?: string;
  code?: string;
  college?: string;
  totalCredits?: number;
  requirements?: MinimalProgramSection[];
  footnotes?: Array<{ id?: number; number?: number; text: string }>;
}

interface MinimalUserProfile {
  major?: string;
}

export function useReliableDataLoader() {
  const [isInitialized, setInitialized] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Placeholders; a more complete implementation should load real data
  const userProfile: MinimalUserProfile | null = useMemo(() => ({ major: 'Unknown' }), []);
  const degreeProgram: MinimalDegreeProgram | null = useMemo(() => null, []);
  const minorPrograms: MinimalDegreeProgram[] = useMemo(() => [], []);

  useEffect(() => {
    // Mark initialized on mount to unlock UI flows
    setInitialized(true);
  }, []);

  const reload = () => {
    setLoading(true);
    try {
      // No-op for now; integrate with real loaders later
    } catch (e: any) {
      setError(e?.message || 'Failed to reload');
    } finally {
      setLoading(false);
    }
  };

  return {
    userProfile,
    degreeProgram,
    minorPrograms,
    isLoading,
    error,
    isInitialized,
    reload,
  };
}
