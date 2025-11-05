import { api } from '@/lib/api/client';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import type { SemesterData, PlannedCourse } from '@/types';

// Idempotent migration from localStorage (Zustand persist) to DB via API
// Returns true if migration ran and attempted an upsert, false otherwise
export async function migrateSemestersToDB(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;

    // Skip if already migrated
    if (localStorage.getItem('gt-semesters-migrated') === 'true') return false;

    // 1) Try to get semesters from the in-memory store
    const store = usePlannerStore.getState();
    let semesters: Record<number, SemesterData> = store?.semesters ?? {};

    // 2) If empty, scan localStorage persisted entries for legacy data
    if (!semesters || Object.keys(semesters).length === 0) {
      const legacy = findLegacyPersistedSemesters();
      if (legacy) semesters = legacy;
    }

    if (!semesters || Object.keys(semesters).length === 0) {
      // Nothing to migrate
      localStorage.setItem('gt-semesters-migrated', 'true');
      return false;
    }

    // Map to server payload
    const records = Object.values(semesters).map((sem) => toServerSemesterRecord(sem));

    // Upsert to server
    try {
      await api.semesters.bulkCreate(records as any);
    } catch (e) {
      console.error('[semestersMigration] bulkCreate failed:', e);
      return false; // do not set migrated flag on error
    }

    // Mark as migrated and clean up localStorage payload to avoid future writes
    localStorage.setItem('gt-semesters-migrated', 'true');
    scrubLegacyPersistedSemesters();
    return true;
  } catch (e) {
    console.error('[semestersMigration] unexpected error:', e);
    return false;
  }
}

function findLegacyPersistedSemesters(): Record<number, SemesterData> | null {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('gt-planner-storage-'));
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.state && parsed.state.semesters && typeof parsed.state.semesters === 'object') {
          return parsed.state.semesters as Record<number, SemesterData>;
        }
        // Older shapes might persist directly without .state nesting
        if (parsed && parsed.semesters && typeof parsed.semesters === 'object') {
          return parsed.semesters as Record<number, SemesterData>;
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function scrubLegacyPersistedSemesters() {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('gt-planner-storage-'));
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.semesters) {
          delete parsed.state.semesters;
          localStorage.setItem(key, JSON.stringify(parsed));
          continue;
        }
        if (parsed?.semesters) {
          delete parsed.semesters;
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

function toServerSemesterRecord(sem: SemesterData) {
  const totalCredits = (sem.courses || []).reduce((sum: number, c: PlannedCourse) => sum + (c?.credits || 0), 0);
  return {
    semesterId: sem.id,
    year: sem.year,
    season: sem.season,
    term: `${sem.season} ${sem.year}`,
    courses: (sem.courses || []).map((c: PlannedCourse) => ({
      id: c.id,
      code: c.code,
      credits: c.credits,
      grade: c.grade,
      status: c.status,
    })),
    total_credits: totalCredits,
    max_credits: sem.maxCredits ?? 18,
    is_active: true,
    gpa: sem.gpa ?? 0,
  };
}
