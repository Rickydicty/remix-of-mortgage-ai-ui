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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aip_audit_logs: {
        Row: {
          actor_id: string | null
          actor_type: string | null
          application_id: string
          changes: Json | null
          created_at: string | null
          document_id: string | null
          event_description: string
          event_type: string
          id: string
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string | null
          application_id: string
          changes?: Json | null
          created_at?: string | null
          document_id?: string | null
          event_description: string
          event_type: string
          id?: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string | null
          application_id?: string
          changes?: Json | null
          created_at?: string | null
          document_id?: string | null
          event_description?: string
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aip_audit_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      aip_conditions: {
        Row: {
          application_id: string
          assigned_to: string | null
          condition_type: string
          created_at: string | null
          description: string
          document_ids: Json | null
          id: string
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          severity: string
          status: string
          updated_at: string | null
        }
        Insert: {
          application_id: string
          assigned_to?: string | null
          condition_type: string
          created_at?: string | null
          description: string
          document_ids?: Json | null
          id?: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          severity?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          assigned_to?: string | null
          condition_type?: string
          created_at?: string | null
          description?: string
          document_ids?: Json | null
          id?: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          severity?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aip_conditions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          aip_affordability_data: Json | null
          aip_ai_prediction: Json | null
          aip_approved_amount: number | null
          aip_approved_date: string | null
          aip_assigned_underwriter: string | null
          aip_conditions: Json | null
          aip_eligibility_score: number | null
          aip_internal_messages: Json | null
          aip_issue_date: string | null
          aip_lender_name: string | null
          aip_letter_url: string | null
          aip_max_term: number | null
          aip_monthly_repayment: number | null
          aip_rate_range_max: number | null
          aip_rate_range_min: number | null
          aip_risk_flags: Json | null
          aip_status: string | null
          aip_submitted_date: string | null
          aip_turnaround_hours: number | null
          aip_underwriter_notes: string | null
          aip_validity_period: number | null
          application_number: string
          assigned_broker_id: string | null
          created_at: string
          current_step: number
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aip_affordability_data?: Json | null
          aip_ai_prediction?: Json | null
          aip_approved_amount?: number | null
          aip_approved_date?: string | null
          aip_assigned_underwriter?: string | null
          aip_conditions?: Json | null
          aip_eligibility_score?: number | null
          aip_internal_messages?: Json | null
          aip_issue_date?: string | null
          aip_lender_name?: string | null
          aip_letter_url?: string | null
          aip_max_term?: number | null
          aip_monthly_repayment?: number | null
          aip_rate_range_max?: number | null
          aip_rate_range_min?: number | null
          aip_risk_flags?: Json | null
          aip_status?: string | null
          aip_submitted_date?: string | null
          aip_turnaround_hours?: number | null
          aip_underwriter_notes?: string | null
          aip_validity_period?: number | null
          application_number: string
          assigned_broker_id?: string | null
          created_at?: string
          current_step?: number
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aip_affordability_data?: Json | null
          aip_ai_prediction?: Json | null
          aip_approved_amount?: number | null
          aip_approved_date?: string | null
          aip_assigned_underwriter?: string | null
          aip_conditions?: Json | null
          aip_eligibility_score?: number | null
          aip_internal_messages?: Json | null
          aip_issue_date?: string | null
          aip_lender_name?: string | null
          aip_letter_url?: string | null
          aip_max_term?: number | null
          aip_monthly_repayment?: number | null
          aip_rate_range_max?: number | null
          aip_rate_range_min?: number | null
          aip_risk_flags?: Json | null
          aip_status?: string | null
          aip_submitted_date?: string | null
          aip_turnaround_hours?: number | null
          aip_underwriter_notes?: string | null
          aip_validity_period?: number | null
          application_number?: string
          assigned_broker_id?: string | null
          created_at?: string
          current_step?: number
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          analysis_text: string | null
          created_at: string | null
          document_type: string
          file_path: string
          filename: string
          id: string
          score: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_text?: string | null
          created_at?: string | null
          document_type: string
          file_path: string
          filename: string
          id?: string
          score?: number | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_text?: string | null
          created_at?: string | null
          document_type?: string
          file_path?: string
          filename?: string
          id?: string
          score?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          application_id: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      signatures: {
        Row: {
          application_id: string
          created_at: string
          document_type: string
          id: string
          signature_data: string
          signed_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: string
          id?: string
          signature_data: string
          signed_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: string
          id?: string
          signature_data?: string
          signed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      valuations: {
        Row: {
          application_id: string
          appointment_date: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          ordered_at: string | null
          ordered_by: string | null
          report_url: string | null
          status: string
          updated_at: string | null
          valuation_amount: number | null
          valuer_contact: string | null
          valuer_name: string | null
        }
        Insert: {
          application_id: string
          appointment_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string | null
          ordered_by?: string | null
          report_url?: string | null
          status?: string
          updated_at?: string | null
          valuation_amount?: number | null
          valuer_contact?: string | null
          valuer_name?: string | null
        }
        Update: {
          application_id?: string
          appointment_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string | null
          ordered_by?: string | null
          report_url?: string | null
          status?: string
          updated_at?: string | null
          valuation_amount?: number | null
          valuer_contact?: string | null
          valuer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valuations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_application_number: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "broker" | "admin"
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
    Enums: {
      app_role: ["client", "broker", "admin"],
    },
  },
} as const
