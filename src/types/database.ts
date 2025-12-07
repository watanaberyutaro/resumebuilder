// =====================================================
// Database Types (Generated from Supabase Schema)
// =====================================================

export type UserRole = 'user' | 'company' | 'admin';
export type OfferStatus = 'pending' | 'interested' | 'declined' | 'accepted' | 'hired';
export type NotificationType = 'scout' | 'message' | 'reminder' | 'system';
export type NotificationChannel = 'app' | 'email' | 'line';
export type BillingEventType = 'scout_success' | 'subscription' | 'refund';
export type JobCategory = 'engineer' | 'sales' | 'marketing' | 'design' | 'hr' | 'finance' | 'medical' | 'other';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  scout_enabled: boolean;
  blocked_company_ids: string[];
  preferred_language: string;
  line_user_id: string | null;
  line_notify_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  company_name: string;
  company_name_kana: string | null;
  industry: string | null;
  employee_count: string | null;
  website_url: string | null;
  logo_url: string | null;
  description: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Education {
  school_name: string;
  faculty: string | null;
  degree: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
}

export interface Language {
  language: string;
  level: string;
}

export interface Resume {
  id: string;
  user_id: string;
  full_name: string | null;
  full_name_kana: string | null;
  birth_date: string | null;
  gender: string | null;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  education: Education[];
  desired_job_category: JobCategory | null;
  desired_industries: string[] | null;
  desired_positions: string[] | null;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  desired_work_locations: string[] | null;
  photo_url: string | null;
  photo_processed_url: string | null;
  ai_summary: string | null;
  ai_self_pr: string | null;
  ai_career_objective: string | null;
  certifications: string[] | null;
  languages: Language[];
  is_public: boolean;
  is_complete: boolean;
  template_type: string;
  last_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkHistory {
  id: string;
  resume_id: string;
  user_id: string;
  company_name: string;
  company_name_hidden: string | null;
  industry: string | null;
  employee_count: string | null;
  position: string | null;
  department: string | null;
  job_category: JobCategory | null;
  employment_type: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  achievements: string | null;
  ai_description: string | null;
  ai_achievements: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  resume_id: string;
  user_id: string;
  skill_name: string;
  skill_type: 'hard' | 'soft';
  proficiency_level: number | null;
  years_of_experience: number | null;
  created_at: string;
  updated_at: string;
}

export interface AIGeneration {
  id: string;
  user_id: string;
  resume_id: string | null;
  generation_type: 'summary' | 'self_pr' | 'career_objective' | 'work_description' | 'chat';
  prompt: string;
  response: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_jpy: number | null;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  resume_id: string | null;
  title: string | null;
  current_step: 'education' | 'work' | 'skills' | 'pr' | 'complete';
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number | null;
  created_at: string;
}

export interface Offer {
  id: string;
  company_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  recipient_resume_id: string | null;
  subject: string;
  message: string;
  position_title: string | null;
  salary_range: string | null;
  status: OfferStatus;
  status_changed_at: string | null;
  candidate_response: string | null;
  is_contact_disclosed: boolean;
  disclosed_at: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfferMessage {
  id: string;
  offer_id: string;
  sender_user_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  sent_via_app: boolean;
  sent_via_email: boolean;
  sent_via_line: boolean;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface BillingEvent {
  id: string;
  company_id: string;
  event_type: BillingEventType;
  offer_id: string | null;
  amount_jpy: number;
  currency: string;
  is_paid: boolean;
  paid_at: string | null;
  external_payment_id: string | null;
  created_at: string;
}

export interface ProfileImport {
  id: string;
  user_id: string;
  resume_id: string | null;
  source_type: 'linkedin' | 'wantedly' | 'facebook';
  source_url: string;
  raw_data: Record<string, unknown> | null;
  parsed_data: Record<string, unknown> | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface PhotoJob {
  id: string;
  user_id: string;
  resume_id: string | null;
  original_url: string;
  processed_url: string | null;
  processing_options: {
    remove_background?: boolean;
    background_color?: string;
    crop_to_id?: boolean;
    apply_beauty?: boolean;
    add_suit?: boolean;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

// =====================================================
// Supabase Database Type
// =====================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      companies: {
        Row: Company;
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Company, 'id' | 'created_at'>>;
      };
      resumes: {
        Row: Resume;
        Insert: Omit<Resume, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Resume, 'id' | 'created_at'>>;
      };
      work_histories: {
        Row: WorkHistory;
        Insert: Omit<WorkHistory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WorkHistory, 'id' | 'created_at'>>;
      };
      skills: {
        Row: Skill;
        Insert: Omit<Skill, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Skill, 'id' | 'created_at'>>;
      };
      ai_generations: {
        Row: AIGeneration;
        Insert: Omit<AIGeneration, 'id' | 'created_at'>;
        Update: Partial<Omit<AIGeneration, 'id' | 'created_at'>>;
      };
      chat_sessions: {
        Row: ChatSession;
        Insert: Omit<ChatSession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ChatSession, 'id' | 'created_at'>>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>;
      };
      offers: {
        Row: Offer;
        Insert: Omit<Offer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Offer, 'id' | 'created_at'>>;
      };
      offer_messages: {
        Row: OfferMessage;
        Insert: Omit<OfferMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<OfferMessage, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      billing_events: {
        Row: BillingEvent;
        Insert: Omit<BillingEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<BillingEvent, 'id' | 'created_at'>>;
      };
      profile_imports: {
        Row: ProfileImport;
        Insert: Omit<ProfileImport, 'id' | 'created_at'>;
        Update: Partial<Omit<ProfileImport, 'id' | 'created_at'>>;
      };
      photo_jobs: {
        Row: PhotoJob;
        Insert: Omit<PhotoJob, 'id' | 'created_at'>;
        Update: Partial<Omit<PhotoJob, 'id' | 'created_at'>>;
      };
    };
  };
}
