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
      business_day_state: {
        Row: {
          active_date_yyyymmdd: string
          business_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          active_date_yyyymmdd: string
          business_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          active_date_yyyymmdd?: string
          business_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_day_state_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_invites: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          display_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          display_name: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          display_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          business_id: string | null
          car_color: string | null
          car_make_model: string
          car_plate: string
          client_name: string
          client_phone: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          car_color?: string | null
          car_make_model: string
          car_plate: string
          client_name: string
          client_phone: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          car_color?: string | null
          car_make_model?: string
          car_plate?: string
          client_name?: string
          client_phone?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_services: {
        Row: {
          business_id: string | null
          car_color: string | null
          car_make_model: string | null
          car_plate: string
          client_id: string | null
          client_name: string
          client_phone: string
          created_at: string | null
          created_by_member_id: string | null
          date_yyyymmdd: string
          finished_by_member_id: string | null
          id: string
          service_name: string
          status: string
          user_id: string
          value: number
          vehicle_type: string | null
        }
        Insert: {
          business_id?: string | null
          car_color?: string | null
          car_make_model?: string | null
          car_plate: string
          client_id?: string | null
          client_name: string
          client_phone: string
          created_at?: string | null
          created_by_member_id?: string | null
          date_yyyymmdd: string
          finished_by_member_id?: string | null
          id?: string
          service_name: string
          status?: string
          user_id: string
          value: number
          vehicle_type?: string | null
        }
        Update: {
          business_id?: string | null
          car_color?: string | null
          car_make_model?: string | null
          car_plate?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string | null
          created_by_member_id?: string | null
          date_yyyymmdd?: string
          finished_by_member_id?: string | null
          id?: string
          service_name?: string
          status?: string
          user_id?: string
          value?: number
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_services_created_by_member_id_fkey"
            columns: ["created_by_member_id"]
            isOneToOne: false
            referencedRelation: "business_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_services_finished_by_member_id_fkey"
            columns: ["finished_by_member_id"]
            isOneToOne: false
            referencedRelation: "business_members"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_reminders: {
        Row: {
          business_id: string | null
          created_at: string
          expense_id: string
          id: string
          shown_date: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          expense_id: string
          id?: string
          shown_date: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          expense_id?: string
          id?: string
          shown_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_reminders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_reminders_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_types: {
        Row: {
          available_day: number
          business_id: string | null
          created_at: string
          default_value: number | null
          due_day: number
          expense_name: string
          id: string
          is_fixed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          available_day: number
          business_id?: string | null
          created_at?: string
          default_value?: number | null
          due_day: number
          expense_name: string
          id?: string
          is_fixed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          available_day?: number
          business_id?: string | null
          created_at?: string
          default_value?: number | null
          due_day?: number
          expense_name?: string
          id?: string
          is_fixed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_types_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_paid: number | null
          business_id: string | null
          category: string | null
          created_at: string
          created_by_member_id: string | null
          description: string | null
          due_date: string | null
          expense_name: string
          expense_type_id: string | null
          id: string
          is_recurring: boolean | null
          month_year: string
          paid_at: string | null
          paid_by_member_id: string | null
          requested_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          business_id?: string | null
          category?: string | null
          created_at?: string
          created_by_member_id?: string | null
          description?: string | null
          due_date?: string | null
          expense_name: string
          expense_type_id?: string | null
          id?: string
          is_recurring?: boolean | null
          month_year: string
          paid_at?: string | null
          paid_by_member_id?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          business_id?: string | null
          category?: string | null
          created_at?: string
          created_by_member_id?: string | null
          description?: string | null
          due_date?: string | null
          expense_name?: string
          expense_type_id?: string | null
          id?: string
          is_recurring?: boolean | null
          month_year?: string
          paid_at?: string | null
          paid_by_member_id?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_member_id_fkey"
            columns: ["created_by_member_id"]
            isOneToOne: false
            referencedRelation: "business_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_expense_type_id_fkey"
            columns: ["expense_type_id"]
            isOneToOne: false
            referencedRelation: "expense_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_member_id_fkey"
            columns: ["paid_by_member_id"]
            isOneToOne: false
            referencedRelation: "business_members"
            referencedColumns: ["id"]
          },
        ]
      }
      service_prices: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          price: number
          service_name: string
          updated_at: string | null
          user_id: string
          vehicle_type: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          price: number
          service_name: string
          updated_at?: string | null
          user_id: string
          vehicle_type?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          price?: number
          service_name?: string
          updated_at?: string | null
          user_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_prices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      connect_to_business: {
        Args: { p_code: string; p_display_name: string }
        Returns: boolean
      }
      create_my_business: { Args: { p_display_name: string }; Returns: string }
      disconnect_from_business: { Args: never; Returns: boolean }
      find_business_by_code: {
        Args: { p_code: string }
        Returns: {
          id: string
          name: string
          owner_name: string
        }[]
      }
      get_member_name: { Args: { member_id: string }; Returns: string }
      get_user_business_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_business_access: {
        Args: { check_business_id: string }
        Returns: boolean
      }
      initialize_expense_types:
        | { Args: { p_user_id: string }; Returns: undefined }
        | {
            Args: { p_business_id?: string; p_user_id: string }
            Returns: undefined
          }
      initialize_service_prices:
        | { Args: { p_user_id: string }; Returns: undefined }
        | {
            Args: { p_business_id?: string; p_user_id: string }
            Returns: undefined
          }
    }
    Enums: {
      app_role: "owner" | "partner"
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
      app_role: ["owner", "partner"],
    },
  },
} as const
