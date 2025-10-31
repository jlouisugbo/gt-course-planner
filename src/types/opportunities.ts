// =====================================================
// OPPORTUNITIES TYPES
// =====================================================

export interface Opportunity {
  id: number;
  title: string;
  company: string;
  description: string | null;
  opportunity_type: 'internship' | 'co-op' | 'research' | 'job';
  application_deadline: string | null;
  requirements: Record<string, any> | null;
  location: string | null;
  is_active: boolean;
  posted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpportunityApplication {
  id: number;
  user_id: number;
  opportunity_id: number;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  cover_letter: string | null;
  resume_url: string | null;
  application_answers: Record<string, any> | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  opportunity?: Opportunity; // Join result
}

export interface OpportunityFilters {
  type?: 'internship' | 'co-op' | 'research' | 'job';
  search?: string;
}

export interface CreateApplicationData {
  opportunity_id: number;
  cover_letter?: string;
  application_answers?: Record<string, any>;
}

export interface UpdateApplicationData {
  cover_letter?: string;
  application_answers?: Record<string, any>;
  status?: 'draft' | 'submitted';
}
