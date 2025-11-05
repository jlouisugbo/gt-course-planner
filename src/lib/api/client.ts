/* Lightweight API client wrapper used by frontend hooks to call our Next.js API routes.
   Provides a simple `client` helper and a small `api` object for table-oriented calls.
*/
export type ClientOptions = {
  method?: string;
  params?: Record<string, unknown> | URLSearchParams;
  body?: unknown;
  headers?: Record<string, string>;
};

async function client<T = unknown>(path: string, options: ClientOptions = {}): Promise<T> {
  const { method = 'GET', params, body, headers = {} } = options;

  let url = path;
  if (params) {
    let qsParams = '';
    if (params instanceof URLSearchParams) {
      qsParams = params.toString();
    } else {
      const s = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (Array.isArray(v)) {
          v.forEach((item) => s.append(k, String(item)));
        } else {
          s.append(k, String(v));
        }
      });
      qsParams = s.toString();
    }
    url = `${path}${path.includes('?') ? '&' : '?'}${qsParams}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': body ? 'application/json' : 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const res = await fetch(url, fetchOptions);
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // non-json response
    data = text;
  }

  if (!res.ok) {
    const anyData = (data ?? {}) as Record<string, any>;
    const err = new Error(anyData?.error?.message || anyData?.message || `Request failed: ${res.status}`);
    (err as any).status = res.status;
    (err as any).body = data;
    throw err;
  }

  return data as T;
}

export const api = {
  users: {
    getProfile: () => client<UserProfile>('/api/user-profile'),
    updateProfile: (data: Partial<UserProfileUpdate>) => client<UserProfile>(
      '/api/user-profile',
      { method: 'PUT', body: data }
    ),
  },
  courses: {
  getAll: (params?: CourseListParams) => client<CoursesResponse>('/api/courses/all', { params: params as unknown as Record<string, unknown> }),
    search: (query?: string) => client<CoursesResponse>('/api/courses/search', { params: { q: query } }),
  },
  semesters: {
    // Note: server returns { semesters: Record<string, SemesterLike> }
    getAll: () => client<{ semesters: Record<string, unknown> }>('/api/semesters'),
    create: (data: Partial<Semester>) => client<any>('/api/semesters', { method: 'POST', body: data }),
    delete: (params: { semesterId?: number; courseId?: number }) => client<{ success: true }>(
      '/api/semesters',
      { method: 'DELETE', params }
    ),
    // PUT /api/semesters/:id - implemented by route handler that accepts path param
    update: (id: number | string, data: Partial<Semester>) => client<any>(`/api/semesters/${id}`, { method: 'PUT', body: data }),
    bulkCreate: (records: Partial<Semester>[]) => client<{ semesters?: unknown; count?: number; message?: string }>(
      '/api/semesters/bulk',
      { method: 'POST', body: { semesters: records } }
    ),
  },
  deadlines: {
    getAll: () => client<Deadline[]>('/api/deadlines'),
    create: (data: DeadlineCreate) => client<Deadline>('/api/deadlines', { method: 'POST', body: data }),
    update: (id: number, data: Partial<DeadlineCreate>) => client<Deadline>(`/api/deadlines/${id}`, { method: 'PUT', body: data }),
    delete: (id: number) => client<{ success: true }>(`/api/deadlines/${id}`, { method: 'DELETE' }),
  },
  degreePrograms: {
    get: (params: DegreeProgramParams) => client<DegreeProgram>(
      '/api/degree-programs',
      { params: { major: params.major, degree_type: params.degreeType ?? 'BS' } }
    ),
    getAll: () => client<{ programs: DegreeProgram[] }>(
      '/api/degree-programs/all'
    ),
  },
  requirements: {
    calculate: (_degreeProgramId?: string | number) =>
      client<any>(
        '/api/requirements/calculate',
        { method: 'POST' }
      ),
  },
  advisors: {
    list: (params?: Record<string, unknown>) => client<any>(
      '/api/advisors',
      { params }
    ),
    get: (id: number | string) => client<any>(`/api/advisors/${id}`),
    connections: {
      list: () => client<any>('/api/advisors/connections'),
      create: (data: any) => client<any>('/api/advisors/connections', { method: 'POST', body: data }),
    },
    appointments: {
      list: () => client<any>('/api/advisors/appointments'),
      get: (id: number | string) => client<any>(`/api/advisors/appointments/${id}`),
      create: (data: any) => client<any>('/api/advisors/appointments', { method: 'POST', body: data }),
      update: (id: number | string, data: any) => client<any>(`/api/advisors/appointments/${id}`, { method: 'PATCH', body: data }),
      delete: (id: number | string) => client<any>(`/api/advisors/appointments/${id}`, { method: 'DELETE' }),
    },
  },
  opportunities: {
    list: (params?: Record<string, unknown>) => client<any>('/api/opportunities', { params }),
    applications: {
      list: () => client<any>('/api/opportunities/applications'),
      get: (id: number | string) => client<any>(`/api/opportunities/applications/${id}`),
      create: (data: any) => client<any>('/api/opportunities/applications', { method: 'POST', body: data }),
      update: (id: number | string, data: any) => client<any>(`/api/opportunities/applications/${id}`, { method: 'PATCH', body: data }),
      delete: (id: number | string) => client<any>(`/api/opportunities/applications/${id}`, { method: 'DELETE' }),
    },
  },
  // Add other tables as needed
};

export default client;

// ===== Types used by API client (minimized to avoid cross-layer coupling) =====
export interface UserProfile {
  id: number;
  auth_id: string;
  email: string;
  fullName?: string | null;
  gtUsername?: string | null;
  graduationYear?: number | null;
  major?: string | null;
  minors?: string[];
  selectedThreads?: string[];
  degreeProgramId?: number | null;
  completedCourses?: string[];
  completedGroups?: string[];
  hasDetailedGPA?: boolean;
  semesterGPAs?: Array<{ semester: string; gpa: number; credits: number }>;
  overallGPA?: number;
  planSettings?: Record<string, unknown>;
  admin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileUpdate {
  full_name?: string;
  gt_username?: string;
  graduation_year?: number;
  major?: string;
  minors?: string[];
  threads?: string[];
  plan_settings?: Record<string, unknown>;
  degree_program_id?: number;
}

export interface CourseListParams {
  search?: string;
  subject?: string;
  limit?: number;
  offset?: number;
}

import type { Course } from '@/types/courses';
export interface CoursesResponse { data: Course[]; count: number; hasMore: boolean }

export interface Semester {
  // Backend shape used by user_semesters
  id?: number;
  semesterId?: number; // client-side identifier (YYYYSS numeric)
  user_id?: number;
  term?: string; // for legacy compatibility (e.g., "Fall 2025")
  year?: number;
  season?: 'Fall' | 'Spring' | 'Summer';
  courses?: Array<any> | Array<{ code: string; credits?: number; grade?: string }>;
  total_credits?: number;
  max_credits?: number;
  is_active?: boolean;
  gpa?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Deadline {
  id: number;
  title: string;
  description?: string;
  date?: string;
  due_date?: string;
  type: 'registration' | 'withdrawal' | 'graduation' | 'thread-confirmation' | 'financial' | 'housing';
  category?: string;
  urgent: boolean;
  is_active: boolean;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DeadlineCreate {
  title: string;
  description?: string;
  due_date: string;
  type: 'registration' | 'withdrawal' | 'graduation' | 'thread-confirmation' | 'financial' | 'housing';
  category?: string;
  is_active?: boolean;
}

export interface DegreeProgram {
  id: number;
  name: string;
  degree_type: 'BS' | 'MS' | 'PhD' | 'Minor' | 'Thread';
  total_credits: number;
  requirements: unknown;
  footnotes?: string;
}

export interface DegreeProgramParams {
  major: string;
  degreeType?: 'BS' | 'MS' | 'PhD' | 'Minor' | 'Thread';
}
