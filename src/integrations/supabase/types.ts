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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_reminders: {
        Row: {
          created_at: string
          due_date: string
          id: string
          notes: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      body_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_current: boolean
          type: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_current?: boolean
          type: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_current?: boolean
          type?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content: {
        Row: {
          body: string | null
          created_at: string
          description: string | null
          id: string
          min_plan_level: number
          published: boolean
          title: string
          type: string
          url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          description?: string | null
          id?: string
          min_plan_level?: number
          published?: boolean
          title: string
          type: string
          url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          description?: string | null
          id?: string
          min_plan_level?: number
          published?: boolean
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: []
      }
      diet_foods: {
        Row: {
          id: string
          item: string
          meal_id: string
          notes: string | null
          quantity: string
          sort_order: number
        }
        Insert: {
          id?: string
          item: string
          meal_id: string
          notes?: string | null
          quantity: string
          sort_order?: number
        }
        Update: {
          id?: string
          item?: string
          meal_id?: string
          notes?: string | null
          quantity?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "diet_foods_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "diet_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_meals: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          time: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      landing_evolutions: {
        Row: {
          active: boolean
          caption: string
          created_at: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          caption?: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          caption?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: []
      }
      landing_sections: {
        Row: {
          active: boolean
          id: string
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          id?: string
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          id?: string
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      landing_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      landing_steps: {
        Row: {
          active: boolean
          created_at: string
          footer: string
          icon: string
          id: string
          is_optional: boolean
          items: string[]
          sort_order: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          footer?: string
          icon?: string
          id?: string
          is_optional?: boolean
          items?: string[]
          sort_order?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          footer?: string
          icon?: string
          id?: string
          is_optional?: boolean
          items?: string[]
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      landing_testimonials: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          tag: string
          text: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          tag?: string
          text: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          tag?: string
          text?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          id: string
          installments: number
          method: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          original_amount: number
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type?: string
          amount: number
          created_at?: string
          id?: string
          installments?: number
          method?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          original_amount: number
          plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          id?: string
          installments?: number
          method?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          original_amount?: number
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_payment_links: {
        Row: {
          card_enabled: boolean
          card_link: string | null
          created_at: string
          id: string
          pix_code: string | null
          pix_enabled: boolean
          plan_id: string
          updated_at: string
        }
        Insert: {
          card_enabled?: boolean
          card_link?: string | null
          created_at?: string
          id?: string
          pix_code?: string | null
          pix_enabled?: boolean
          plan_id: string
          updated_at?: string
        }
        Update: {
          card_enabled?: boolean
          card_link?: string | null
          created_at?: string
          id?: string
          pix_code?: string | null
          pix_enabled?: boolean
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_payment_links_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          benefits: string[]
          created_at: string
          discount_type: string
          discount_value: number
          duration: string
          duration_days: number
          id: string
          name: string
          price: string
          subtitle: string
        }
        Insert: {
          active?: boolean
          benefits?: string[]
          created_at?: string
          discount_type?: string
          discount_value?: number
          duration: string
          duration_days?: number
          id?: string
          name: string
          price: string
          subtitle?: string
        }
        Update: {
          active?: boolean
          benefits?: string[]
          created_at?: string
          discount_type?: string
          discount_value?: number
          duration?: string
          duration_days?: number
          id?: string
          name?: string
          price?: string
          subtitle?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          comorbidities: string | null
          created_at: string
          current_protocol: string | null
          email: string
          full_name: string
          height: number | null
          id: string
          lab_exam_url: string | null
          medical_prescription_url: string | null
          objective: string | null
          onboarding_complete: boolean
          phone: string | null
          physical_activity: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          comorbidities?: string | null
          created_at?: string
          current_protocol?: string | null
          email?: string
          full_name?: string
          height?: number | null
          id?: string
          lab_exam_url?: string | null
          medical_prescription_url?: string | null
          objective?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          physical_activity?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          comorbidities?: string | null
          created_at?: string
          current_protocol?: string | null
          email?: string
          full_name?: string
          height?: number | null
          id?: string
          lab_exam_url?: string | null
          medical_prescription_url?: string | null
          objective?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          physical_activity?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      protocols: {
        Row: {
          category: string
          created_at: string
          dosage: string
          frequency: string
          id: string
          name: string
          notes: string | null
          sort_order: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          dosage?: string
          frequency?: string
          id?: string
          name: string
          notes?: string | null
          sort_order?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          dosage?: string
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          key: string
          label?: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_diets: {
        Row: {
          content: string | null
          created_at: string
          id: string
          pdf_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_protocols: {
        Row: {
          content: string | null
          created_at: string
          id: string
          pdf_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_trainings: {
        Row: {
          content: string | null
          created_at: string
          id: string
          pdf_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          title?: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          plan_id: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          plan_id: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_exercises: {
        Row: {
          id: string
          name: string
          notes: string | null
          reps: string
          sets: string
          sort_order: number
          video_url: string | null
          week_id: string
        }
        Insert: {
          id?: string
          name: string
          notes?: string | null
          reps?: string
          sets?: string
          sort_order?: number
          video_url?: string | null
          week_id: string
        }
        Update: {
          id?: string
          name?: string
          notes?: string | null
          reps?: string
          sets?: string
          sort_order?: number
          video_url?: string | null
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_exercises_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "training_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      training_weeks: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
