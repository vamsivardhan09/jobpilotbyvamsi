export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      interview_questions: {
        Row: {
          answer_text: string | null
          created_at: string
          feedback: Json | null
          id: string
          question_number: number
          question_text: string
          score: number | null
          session_id: string
        }
        Insert: {
          answer_text?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          question_number: number
          question_text: string
          score?: number | null
          session_id: string
        }
        Update: {
          answer_text?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          question_number?: number
          question_text?: string
          score?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          communication_score: number | null
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          id: string
          improvements: string[] | null
          interview_type: string
          job_role: string
          problem_solving_score: number | null
          recommended_topics: string[] | null
          status: string
          strengths: string[] | null
          technical_score: number | null
          total_score: number | null
          user_id: string
        }
        Insert: {
          communication_score?: number | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          improvements?: string[] | null
          interview_type: string
          job_role: string
          problem_solving_score?: number | null
          recommended_topics?: string[] | null
          status?: string
          strengths?: string[] | null
          technical_score?: number | null
          total_score?: number | null
          user_id: string
        }
        Update: {
          communication_score?: number | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          improvements?: string[] | null
          interview_type?: string
          job_role?: string
          problem_solving_score?: number | null
          recommended_topics?: string[] | null
          status?: string
          strengths?: string[] | null
          technical_score?: number | null
          total_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      job_matches: {
        Row: {
          apply_url: string | null
          company: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          match_score: number | null
          matched_skills: string[] | null
          missing_skills: string[] | null
          required_skills: string[] | null
          salary_range: string | null
          source_url: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          apply_url?: string | null
          company?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          match_score?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          required_skills?: string[] | null
          salary_range?: string | null
          source_url?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          apply_url?: string | null
          company?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          match_score?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          required_skills?: string[] | null
          salary_range?: string | null
          source_url?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      optimized_resumes: {
        Row: {
          ats_keywords: string[] | null
          created_at: string
          id: string
          job_match_id: string | null
          optimized_content: Json | null
          original_resume_id: string | null
          user_id: string
        }
        Insert: {
          ats_keywords?: string[] | null
          created_at?: string
          id?: string
          job_match_id?: string | null
          optimized_content?: Json | null
          original_resume_id?: string | null
          user_id: string
        }
        Update: {
          ats_keywords?: string[] | null
          created_at?: string
          id?: string
          job_match_id?: string | null
          optimized_content?: Json | null
          original_resume_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimized_resumes_job_match_id_fkey"
            columns: ["job_match_id"]
            isOneToOne: false
            referencedRelation: "job_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimized_resumes_original_resume_id_fkey"
            columns: ["original_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          experience_level: string | null
          full_name: string | null
          headline: string | null
          id: string
          preferred_locations: string[] | null
          preferred_roles: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          experience_level?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          preferred_locations?: string[] | null
          preferred_roles?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          experience_level?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          preferred_locations?: string[] | null
          preferred_roles?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          file_name: string
          file_url: string | null
          id: string
          is_primary: boolean | null
          parsed_data: Json | null
          raw_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_url?: string | null
          id?: string
          is_primary?: boolean | null
          parsed_data?: Json | null
          raw_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_url?: string | null
          id?: string
          is_primary?: boolean | null
          parsed_data?: Json | null
          raw_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          proficiency: string | null
          resume_id: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          proficiency?: string | null
          resume_id?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          proficiency?: string | null
          resume_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          alert_frequency: string | null
          created_at: string
          id: string
          job_alerts_enabled: boolean | null
          match_threshold: number | null
          preferred_job_types: string[] | null
          remote_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_frequency?: string | null
          created_at?: string
          id?: string
          job_alerts_enabled?: boolean | null
          match_threshold?: number | null
          preferred_job_types?: string[] | null
          remote_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_frequency?: string | null
          created_at?: string
          id?: string
          job_alerts_enabled?: boolean | null
          match_threshold?: number | null
          preferred_job_types?: string[] | null
          remote_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
