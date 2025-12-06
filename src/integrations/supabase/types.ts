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
      application_form_data: {
        Row: {
          app1_address: string | null
          app1_bonuses: number | null
          app1_bonuses_frequency: string | null
          app1_children_ages: string | null
          app1_commissions: number | null
          app1_commissions_frequency: string | null
          app1_date_of_birth: string | null
          app1_email: string | null
          app1_forenames: string | null
          app1_gender: string | null
          app1_gross_salary: number | null
          app1_lodger_income: number | null
          app1_marital_status: string | null
          app1_nationality: string | null
          app1_no_of_children: number | null
          app1_other_household_income: number | null
          app1_other_income: number | null
          app1_other_income_details: string | null
          app1_other_income_frequency: string | null
          app1_other_names: string | null
          app1_overtime: number | null
          app1_overtime_frequency: string | null
          app1_phone: string | null
          app1_pps_number: string | null
          app1_residential_investment_income: number | null
          app1_salary_frequency: string | null
          app1_surname: string | null
          app1_title: string | null
          app1_years_at_address: number | null
          app2_address: string | null
          app2_bonuses: number | null
          app2_bonuses_frequency: string | null
          app2_children_ages: string | null
          app2_commissions: number | null
          app2_commissions_frequency: string | null
          app2_date_of_birth: string | null
          app2_email: string | null
          app2_enabled: boolean | null
          app2_forenames: string | null
          app2_gender: string | null
          app2_gross_salary: number | null
          app2_is_guarantor: boolean | null
          app2_lodger_income: number | null
          app2_marital_status: string | null
          app2_nationality: string | null
          app2_no_of_children: number | null
          app2_other_income: number | null
          app2_other_income_details: string | null
          app2_other_income_frequency: string | null
          app2_other_names: string | null
          app2_overtime: number | null
          app2_overtime_frequency: string | null
          app2_phone: string | null
          app2_pps_number: string | null
          app2_residential_investment_income: number | null
          app2_salary_frequency: string | null
          app2_surname: string | null
          app2_title: string | null
          app2_years_at_address: number | null
          application_id: string | null
          arrears_details: string | null
          ber_rating: string | null
          broker_notes: string | null
          ccj_details: string | null
          created_at: string
          credit_cards: number | null
          credit_history: string | null
          deposit_amount: number | null
          estimated_closing_date: string | null
          existing_loans: number | null
          first_time_buyer: boolean | null
          has_arrears: boolean | null
          has_ccj: boolean | null
          has_judgements: boolean | null
          has_missed_repayments: boolean | null
          has_other_mortgage: boolean | null
          help_to_buy: boolean | null
          id: string
          judgements_details: string | null
          loan_amount: number | null
          missed_repayments_details: string | null
          monthly_commitments: number | null
          mortgage_term: number | null
          mortgage_type: string | null
          other_mortgage_details: string | null
          property_address: string | null
          property_new_or_secondhand: string | null
          property_type: string | null
          property_value: number | null
          savings: number | null
          security_address: string | null
          security_current_loan_balance: number | null
          security_lending_institution: string | null
          security_market_value: number | null
          security_monthly_repayment: number | null
          security_type: string | null
          updated_at: string
          user_id: string
          year_built: number | null
        }
        Insert: {
          app1_address?: string | null
          app1_bonuses?: number | null
          app1_bonuses_frequency?: string | null
          app1_children_ages?: string | null
          app1_commissions?: number | null
          app1_commissions_frequency?: string | null
          app1_date_of_birth?: string | null
          app1_email?: string | null
          app1_forenames?: string | null
          app1_gender?: string | null
          app1_gross_salary?: number | null
          app1_lodger_income?: number | null
          app1_marital_status?: string | null
          app1_nationality?: string | null
          app1_no_of_children?: number | null
          app1_other_household_income?: number | null
          app1_other_income?: number | null
          app1_other_income_details?: string | null
          app1_other_income_frequency?: string | null
          app1_other_names?: string | null
          app1_overtime?: number | null
          app1_overtime_frequency?: string | null
          app1_phone?: string | null
          app1_pps_number?: string | null
          app1_residential_investment_income?: number | null
          app1_salary_frequency?: string | null
          app1_surname?: string | null
          app1_title?: string | null
          app1_years_at_address?: number | null
          app2_address?: string | null
          app2_bonuses?: number | null
          app2_bonuses_frequency?: string | null
          app2_children_ages?: string | null
          app2_commissions?: number | null
          app2_commissions_frequency?: string | null
          app2_date_of_birth?: string | null
          app2_email?: string | null
          app2_enabled?: boolean | null
          app2_forenames?: string | null
          app2_gender?: string | null
          app2_gross_salary?: number | null
          app2_is_guarantor?: boolean | null
          app2_lodger_income?: number | null
          app2_marital_status?: string | null
          app2_nationality?: string | null
          app2_no_of_children?: number | null
          app2_other_income?: number | null
          app2_other_income_details?: string | null
          app2_other_income_frequency?: string | null
          app2_other_names?: string | null
          app2_overtime?: number | null
          app2_overtime_frequency?: string | null
          app2_phone?: string | null
          app2_pps_number?: string | null
          app2_residential_investment_income?: number | null
          app2_salary_frequency?: string | null
          app2_surname?: string | null
          app2_title?: string | null
          app2_years_at_address?: number | null
          application_id?: string | null
          arrears_details?: string | null
          ber_rating?: string | null
          broker_notes?: string | null
          ccj_details?: string | null
          created_at?: string
          credit_cards?: number | null
          credit_history?: string | null
          deposit_amount?: number | null
          estimated_closing_date?: string | null
          existing_loans?: number | null
          first_time_buyer?: boolean | null
          has_arrears?: boolean | null
          has_ccj?: boolean | null
          has_judgements?: boolean | null
          has_missed_repayments?: boolean | null
          has_other_mortgage?: boolean | null
          help_to_buy?: boolean | null
          id?: string
          judgements_details?: string | null
          loan_amount?: number | null
          missed_repayments_details?: string | null
          monthly_commitments?: number | null
          mortgage_term?: number | null
          mortgage_type?: string | null
          other_mortgage_details?: string | null
          property_address?: string | null
          property_new_or_secondhand?: string | null
          property_type?: string | null
          property_value?: number | null
          savings?: number | null
          security_address?: string | null
          security_current_loan_balance?: number | null
          security_lending_institution?: string | null
          security_market_value?: number | null
          security_monthly_repayment?: number | null
          security_type?: string | null
          updated_at?: string
          user_id: string
          year_built?: number | null
        }
        Update: {
          app1_address?: string | null
          app1_bonuses?: number | null
          app1_bonuses_frequency?: string | null
          app1_children_ages?: string | null
          app1_commissions?: number | null
          app1_commissions_frequency?: string | null
          app1_date_of_birth?: string | null
          app1_email?: string | null
          app1_forenames?: string | null
          app1_gender?: string | null
          app1_gross_salary?: number | null
          app1_lodger_income?: number | null
          app1_marital_status?: string | null
          app1_nationality?: string | null
          app1_no_of_children?: number | null
          app1_other_household_income?: number | null
          app1_other_income?: number | null
          app1_other_income_details?: string | null
          app1_other_income_frequency?: string | null
          app1_other_names?: string | null
          app1_overtime?: number | null
          app1_overtime_frequency?: string | null
          app1_phone?: string | null
          app1_pps_number?: string | null
          app1_residential_investment_income?: number | null
          app1_salary_frequency?: string | null
          app1_surname?: string | null
          app1_title?: string | null
          app1_years_at_address?: number | null
          app2_address?: string | null
          app2_bonuses?: number | null
          app2_bonuses_frequency?: string | null
          app2_children_ages?: string | null
          app2_commissions?: number | null
          app2_commissions_frequency?: string | null
          app2_date_of_birth?: string | null
          app2_email?: string | null
          app2_enabled?: boolean | null
          app2_forenames?: string | null
          app2_gender?: string | null
          app2_gross_salary?: number | null
          app2_is_guarantor?: boolean | null
          app2_lodger_income?: number | null
          app2_marital_status?: string | null
          app2_nationality?: string | null
          app2_no_of_children?: number | null
          app2_other_income?: number | null
          app2_other_income_details?: string | null
          app2_other_income_frequency?: string | null
          app2_other_names?: string | null
          app2_overtime?: number | null
          app2_overtime_frequency?: string | null
          app2_phone?: string | null
          app2_pps_number?: string | null
          app2_residential_investment_income?: number | null
          app2_salary_frequency?: string | null
          app2_surname?: string | null
          app2_title?: string | null
          app2_years_at_address?: number | null
          application_id?: string | null
          arrears_details?: string | null
          ber_rating?: string | null
          broker_notes?: string | null
          ccj_details?: string | null
          created_at?: string
          credit_cards?: number | null
          credit_history?: string | null
          deposit_amount?: number | null
          estimated_closing_date?: string | null
          existing_loans?: number | null
          first_time_buyer?: boolean | null
          has_arrears?: boolean | null
          has_ccj?: boolean | null
          has_judgements?: boolean | null
          has_missed_repayments?: boolean | null
          has_other_mortgage?: boolean | null
          help_to_buy?: boolean | null
          id?: string
          judgements_details?: string | null
          loan_amount?: number | null
          missed_repayments_details?: string | null
          monthly_commitments?: number | null
          mortgage_term?: number | null
          mortgage_type?: string | null
          other_mortgage_details?: string | null
          property_address?: string | null
          property_new_or_secondhand?: string | null
          property_type?: string | null
          property_value?: number | null
          savings?: number | null
          security_address?: string | null
          security_current_loan_balance?: number | null
          security_lending_institution?: string | null
          security_market_value?: number | null
          security_monthly_repayment?: number | null
          security_type?: string | null
          updated_at?: string
          user_id?: string
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "application_form_data_application_id_fkey"
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
      loan_offers: {
        Row: {
          application_id: string
          created_at: string | null
          created_by: string | null
          document_url: string | null
          fixed_period: number | null
          id: string
          interest_rate: number
          is_mock: boolean | null
          lender_name: string
          loan_term: number
          monthly_repayment: number | null
          notes: string | null
          offer_amount: number
          offer_type: string | null
          offer_valid_until: string | null
          status: string | null
          total_repayment: number | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          fixed_period?: number | null
          id?: string
          interest_rate: number
          is_mock?: boolean | null
          lender_name: string
          loan_term: number
          monthly_repayment?: number | null
          notes?: string | null
          offer_amount: number
          offer_type?: string | null
          offer_valid_until?: string | null
          status?: string | null
          total_repayment?: number | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          fixed_period?: number | null
          id?: string
          interest_rate?: number
          is_mock?: boolean | null
          lender_name?: string
          loan_term?: number
          monthly_repayment?: number | null
          notes?: string | null
          offer_amount?: number
          offer_type?: string | null
          offer_valid_until?: string | null
          status?: string | null
          total_repayment?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
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
      pre_eligibility_data: {
        Row: {
          applicant_type: string
          borrowing_capacity_high: number | null
          borrowing_capacity_low: number | null
          created_at: string
          credit_history: string
          deposit_amount: number
          desired_term: number
          eligibility_score: number | null
          email: string | null
          employment_type: string
          estimated_monthly_payment: number | null
          first_time_buyer: boolean
          id: string
          income_1: number
          income_2: number | null
          monthly_commitments: number
          phone: string | null
          property_value: number
          residency_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applicant_type: string
          borrowing_capacity_high?: number | null
          borrowing_capacity_low?: number | null
          created_at?: string
          credit_history: string
          deposit_amount: number
          desired_term?: number
          eligibility_score?: number | null
          email?: string | null
          employment_type: string
          estimated_monthly_payment?: number | null
          first_time_buyer?: boolean
          id?: string
          income_1: number
          income_2?: number | null
          monthly_commitments: number
          phone?: string | null
          property_value: number
          residency_status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applicant_type?: string
          borrowing_capacity_high?: number | null
          borrowing_capacity_low?: number | null
          created_at?: string
          credit_history?: string
          deposit_amount?: number
          desired_term?: number
          eligibility_score?: number | null
          email?: string | null
          employment_type?: string
          estimated_monthly_payment?: number | null
          first_time_buyer?: boolean
          id?: string
          income_1?: number
          income_2?: number | null
          monthly_commitments?: number
          phone?: string | null
          property_value?: number
          residency_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
