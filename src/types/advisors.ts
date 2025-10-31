// =====================================================
// ADVISORS TYPES
// =====================================================

export interface Advisor {
  id: number;
  user_id: string | null;
  full_name: string;
  email: string;
  title: string | null;
  specializations: string[];
  departments: string[];
  bio: string | null;
  office_location: string | null;
  office_hours: Record<string, any> | null;
  booking_url: string | null;
  is_accepting_students: boolean;
  max_students: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdvisorConnection {
  id: number;
  student_id: number;
  advisor_id: number;
  connection_type: 'requested' | 'assigned' | 'self-selected';
  status: 'pending' | 'active' | 'declined' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
  advisor?: Advisor; // Join result
}

export interface AdvisorAppointment {
  id: number;
  student_id: number;
  advisor_id: number;
  appointment_date: string;
  duration_minutes: number;
  meeting_type: 'in-person' | 'virtual' | 'phone';
  meeting_link: string | null;
  topic: string | null;
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  created_at: string;
  updated_at: string;
  advisor?: Advisor; // Join result
}

export interface AdvisorFilters {
  search?: string;
  specialization?: string;
  department?: string;
  acceptingStudents?: boolean;
}

export interface CreateConnectionData {
  advisor_id: number;
  connection_type?: 'requested' | 'self-selected';
  notes?: string;
}

export interface CreateAppointmentData {
  advisor_id: number;
  appointment_date: string;
  duration_minutes?: number;
  meeting_type: 'in-person' | 'virtual' | 'phone';
  meeting_link?: string;
  topic?: string;
  notes?: string;
}

export interface UpdateAppointmentData {
  appointment_date?: string;
  duration_minutes?: number;
  meeting_type?: 'in-person' | 'virtual' | 'phone';
  meeting_link?: string;
  topic?: string;
  notes?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
}
