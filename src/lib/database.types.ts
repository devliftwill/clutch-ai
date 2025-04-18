export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type IndustryType =
  | 'Technology'
  | 'Healthcare'
  | 'Finance'
  | 'Education'
  | 'Manufacturing'
  | 'Retail'
  | 'Media'
  | 'Construction'
  | 'Transportation'
  | 'Entertainment'
  | 'Agriculture'
  | 'Energy'
  | 'Real Estate'
  | 'Hospitality'
  | 'Consulting'
  | 'Other'

export type ExperienceLevel =
  | 'Entry Level'
  | 'Junior'
  | 'Mid Level'
  | 'Senior'
  | 'Lead'
  | 'Executive'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          account_type: 'candidates' | 'employer'
          company_name: string | null
          website: string | null
          industry: IndustryType | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          account_type: 'candidates' | 'employer'
          company_name?: string | null
          website?: string | null
          industry?: IndustryType | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          account_type?: 'candidates' | 'employer'
          company_name?: string | null
          website?: string | null
          industry?: IndustryType | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          status: string
          video_url: string | null
          video_completed: boolean
          video_completed_at: string | null
          audio_url: string | null
          transcript: string | null
          metadata: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          status: string
          video_url?: string | null
          video_completed?: boolean
          video_completed_at?: string | null
          audio_url?: string | null
          transcript?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          candidate_id?: string
          status?: string
          video_url?: string | null
          video_completed?: boolean
          video_completed_at?: string | null
          audio_url?: string | null
          transcript?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string | null
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          company_id: string
          type: string
          location: string
          overview: string
          requirements: string[]
          responsibilities: string[]
          active: boolean
          salary_min: number | null
          salary_max: number | null
          salary_currency: string
          salary_period: string
          experience_level: ExperienceLevel
          benefits: string[]
          work_schedule: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          company_id: string
          type: string
          location: string
          overview: string
          requirements: string[]
          responsibilities: string[]
          active?: boolean
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          salary_period?: string
          experience_level: ExperienceLevel
          benefits?: string[]
          work_schedule?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          company_id?: string
          type?: string
          location?: string
          overview?: string
          requirements?: string[]
          responsibilities?: string[]
          active?: boolean
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          salary_period?: string
          experience_level?: ExperienceLevel
          benefits?: string[]
          work_schedule?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      industry_type: IndustryType
    }
  }
}