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
      clients: {
        Row: {
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
        Relationships: []
      }
      daily_services: {
        Row: {
          car_color: string | null
          car_make_model: string | null
          car_plate: string
          client_id: string | null
          client_name: string
          client_phone: string
          created_at: string | null
          date_yyyymmdd: string
          id: string
          service_name: string
          status: string
          user_id: string
          value: number
          vehicle_type: string | null
        }
        Insert: {
          car_color?: string | null
          car_make_model?: string | null
          car_plate: string
          client_id?: string | null
          client_name: string
          client_phone: string
          created_at?: string | null
          date_yyyymmdd: string
          id?: string
          service_name: string
          status?: string
          user_id: string
          value: number
          vehicle_type?: string | null
        }
        Update: {
          car_color?: string | null
          car_make_model?: string | null
          car_plate?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string | null
          date_yyyymmdd?: string
          id?: string
          service_name?: string
          status?: string
          user_id?: string
          value?: number
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_reminders: {
        Row: {
          created_at: string
          expense_id: string
          id: string
          shown_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          shown_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          shown_date?: string
          user_id?: string
        }
        Relationships: [
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
          created_at?: string
          default_value?: number | null
          due_day?: number
          expense_name?: string
          id?: string
          is_fixed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount_paid: number | null
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          expense_name: string
          expense_type_id: string | null
          id: string
          is_recurring: boolean | null
          month_year: string
          paid_at: string | null
          requested_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          expense_name: string
          expense_type_id?: string | null
          id?: string
          is_recurring?: boolean | null
          month_year: string
          paid_at?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          expense_name?: string
          expense_type_id?: string | null
          id?: string
          is_recurring?: boolean | null
          month_year?: string
          paid_at?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_expense_type_id_fkey"
            columns: ["expense_type_id"]
            isOneToOne: false
            referencedRelation: "expense_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_prices: {
        Row: {
          created_at: string | null
          id: string
          price: number
          service_name: string
          updated_at: string | null
          user_id: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          price: number
          service_name: string
          updated_at?: string | null
          user_id: string
          vehicle_type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number
          service_name?: string
          updated_at?: string | null
          user_id?: string
          vehicle_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      initialize_expense_types: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      initialize_service_prices: {
        Args: { p_user_id: string }
        Returns: undefined
      }
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
