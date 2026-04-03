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
      access_logs: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          is_free: boolean
          logged_in_at: string
          logged_out_at: string | null
          page_path: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_free?: boolean
          logged_in_at?: string
          logged_out_at?: string | null
          page_path?: string | null
          session_id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_free?: boolean
          logged_in_at?: string
          logged_out_at?: string | null
          page_path?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
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
      anamnesis_entries: {
        Row: {
          created_at: string
          id: string
          notes: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bioimpedance_logs: {
        Row: {
          bmr_kcal: number | null
          body_fat_pct: number | null
          created_at: string
          extracellular_water_l: number | null
          fat_mass_kg: number | null
          id: string
          intracellular_water_l: number | null
          lean_mass_kg: number | null
          logged_at: string
          metabolic_age: number | null
          notes: string | null
          phase_angle: number | null
          seg_left_arm: number | null
          seg_left_leg: number | null
          seg_right_arm: number | null
          seg_right_leg: number | null
          seg_trunk: number | null
          skeletal_muscle_kg: number | null
          total_water_l: number | null
          total_water_pct: number | null
          total_weight: number | null
          user_id: string
          visceral_fat: number | null
        }
        Insert: {
          bmr_kcal?: number | null
          body_fat_pct?: number | null
          created_at?: string
          extracellular_water_l?: number | null
          fat_mass_kg?: number | null
          id?: string
          intracellular_water_l?: number | null
          lean_mass_kg?: number | null
          logged_at?: string
          metabolic_age?: number | null
          notes?: string | null
          phase_angle?: number | null
          seg_left_arm?: number | null
          seg_left_leg?: number | null
          seg_right_arm?: number | null
          seg_right_leg?: number | null
          seg_trunk?: number | null
          skeletal_muscle_kg?: number | null
          total_water_l?: number | null
          total_water_pct?: number | null
          total_weight?: number | null
          user_id: string
          visceral_fat?: number | null
        }
        Update: {
          bmr_kcal?: number | null
          body_fat_pct?: number | null
          created_at?: string
          extracellular_water_l?: number | null
          fat_mass_kg?: number | null
          id?: string
          intracellular_water_l?: number | null
          lean_mass_kg?: number | null
          logged_at?: string
          metabolic_age?: number | null
          notes?: string | null
          phase_angle?: number | null
          seg_left_arm?: number | null
          seg_left_leg?: number | null
          seg_right_arm?: number | null
          seg_right_leg?: number | null
          seg_trunk?: number | null
          skeletal_muscle_kg?: number | null
          total_water_l?: number | null
          total_water_pct?: number | null
          total_weight?: number | null
          user_id?: string
          visceral_fat?: number | null
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
      clinical_documents: {
        Row: {
          created_at: string
          file_url: string
          id: string
          type: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          type: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          type?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consultant_students: {
        Row: {
          consultant_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          consultant_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          consultant_id?: string
          created_at?: string
          id?: string
          student_id?: string
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
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number
          plan_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number
          plan_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number
          plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_foods: {
        Row: {
          carbs_g: number
          cholesterol_mg: number
          energy_kcal: number
          fat_g: number
          fiber_g: number
          food_id: string | null
          id: string
          item: string
          meal_id: string
          notes: string | null
          protein_g: number
          quantity: string
          quantity_grams: number | null
          sodium_mg: number
          sort_order: number
          sugar_g: number
        }
        Insert: {
          carbs_g?: number
          cholesterol_mg?: number
          energy_kcal?: number
          fat_g?: number
          fiber_g?: number
          food_id?: string | null
          id?: string
          item: string
          meal_id: string
          notes?: string | null
          protein_g?: number
          quantity: string
          quantity_grams?: number | null
          sodium_mg?: number
          sort_order?: number
          sugar_g?: number
        }
        Update: {
          carbs_g?: number
          cholesterol_mg?: number
          energy_kcal?: number
          fat_g?: number
          fiber_g?: number
          food_id?: string | null
          id?: string
          item?: string
          meal_id?: string
          notes?: string | null
          protein_g?: number
          quantity?: string
          quantity_grams?: number | null
          sodium_mg?: number
          sort_order?: number
          sugar_g?: number
        }
        Relationships: [
          {
            foreignKeyName: "diet_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_foods_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "diet_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_library: {
        Row: {
          carbs_g: number
          content: string
          created_at: string
          created_by: string
          energy_kcal: number
          fat_g: number
          id: string
          protein_g: number
          title: string
          updated_at: string
        }
        Insert: {
          carbs_g?: number
          content?: string
          created_at?: string
          created_by: string
          energy_kcal?: number
          fat_g?: number
          id?: string
          protein_g?: number
          title: string
          updated_at?: string
        }
        Update: {
          carbs_g?: number
          content?: string
          created_at?: string
          created_by?: string
          energy_kcal?: number
          fat_g?: number
          id?: string
          protein_g?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      diet_meals: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          sort_order: number
          time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          sort_order?: number
          time: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          sort_order?: number
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_library: {
        Row: {
          created_at: string
          description: string | null
          id: string
          muscle_group: string | null
          name: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          muscle_group?: string | null
          name: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          muscle_group?: string | null
          name?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      foods: {
        Row: {
          carbs_g: number
          category: string
          cholesterol_mg: number
          created_at: string
          energy_kcal: number
          fat_g: number
          fiber_g: number
          id: string
          name: string
          protein_g: number
          serving_size: number
          serving_unit: string
          sodium_mg: number
          source: string
          sugar_g: number
        }
        Insert: {
          carbs_g?: number
          category?: string
          cholesterol_mg?: number
          created_at?: string
          energy_kcal?: number
          fat_g?: number
          fiber_g?: number
          id?: string
          name: string
          protein_g?: number
          serving_size?: number
          serving_unit?: string
          sodium_mg?: number
          source?: string
          sugar_g?: number
        }
        Update: {
          carbs_g?: number
          category?: string
          cholesterol_mg?: number
          created_at?: string
          energy_kcal?: number
          fat_g?: number
          fiber_g?: number
          id?: string
          name?: string
          protein_g?: number
          serving_size?: number
          serving_unit?: string
          sodium_mg?: number
          source?: string
          sugar_g?: number
        }
        Relationships: []
      }
      free_leads: {
        Row: {
          age: number | null
          converted: boolean
          created_at: string
          email: string
          frequency: number | null
          full_name: string | null
          gender: string | null
          height: number | null
          id: string
          objective: string | null
          phone: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          converted?: boolean
          created_at?: string
          email: string
          frequency?: number | null
          full_name?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          objective?: string | null
          phone: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          converted?: boolean
          created_at?: string
          email?: string
          frequency?: number | null
          full_name?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          objective?: string | null
          phone?: string
          weight?: number | null
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
      meal_completions: {
        Row: {
          completed_at: string
          completed_date: string
          id: string
          meal_id: string
          notes: string | null
          skipped: boolean
          user_id: string
        }
        Insert: {
          completed_at?: string
          completed_date?: string
          id?: string
          meal_id: string
          notes?: string | null
          skipped?: boolean
          user_id: string
        }
        Update: {
          completed_at?: string
          completed_date?: string
          id?: string
          meal_id?: string
          notes?: string | null
          skipped?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_completions_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "diet_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      message_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      message_history: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          error_message: string | null
          id: string
          image_url: string | null
          recipient_name: string | null
          recipient_phone: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          error_message?: string | null
          id?: string
          image_url?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          error_message?: string | null
          id?: string
          image_url?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_history_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "message_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          category_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_reusable: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_reusable?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_reusable?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "message_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      message_variables: {
        Row: {
          created_at: string
          example: string
          id: string
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          example?: string
          id?: string
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          example?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      payment_gateway_details: {
        Row: {
          ai_verification_notes: string | null
          ai_verification_status: string | null
          created_at: string
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          payment_id: string
          receipt_url: string | null
        }
        Insert: {
          ai_verification_notes?: string | null
          ai_verification_status?: string | null
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payment_id: string
          receipt_url?: string | null
        }
        Update: {
          ai_verification_notes?: string | null
          ai_verification_status?: string | null
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payment_id?: string
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateway_details_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
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
          coupon_discount: number | null
          coupon_id: string | null
          created_at: string
          id: string
          installments: number
          method: string
          original_amount: number
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type?: string
          amount: number
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string
          id?: string
          installments?: number
          method?: string
          original_amount: number
          plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string
          id?: string
          installments?: number
          method?: string
          original_amount?: number
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
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
          card_price: string
          created_at: string
          discount_type: string
          discount_value: number
          duration: string
          duration_days: number
          id: string
          name: string
          price: string
          subtitle: string
          visibility: string
        }
        Insert: {
          active?: boolean
          benefits?: string[]
          card_price?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          duration: string
          duration_days?: number
          id?: string
          name: string
          price: string
          subtitle?: string
          visibility?: string
        }
        Update: {
          active?: boolean
          benefits?: string[]
          card_price?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          duration?: string
          duration_days?: number
          id?: string
          name?: string
          price?: string
          subtitle?: string
          visibility?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_type: string | null
          additional_info: string | null
          admin_confirmed: boolean
          avatar_url: string | null
          birth_date: string | null
          bmr: number | null
          carbs_g: number | null
          cardio_days_per_week: number | null
          cardio_duration_minutes: number | null
          cardio_intensity: string | null
          comorbidities: string | null
          cpf: string | null
          created_at: string
          current_protocol: string | null
          daily_calories: number | null
          does_cardio: boolean | null
          email: string
          fat_g: number | null
          full_name: string
          gender: string | null
          height: number | null
          id: string
          lab_exam_url: string | null
          medical_prescription_url: string | null
          objective: string | null
          onboarding_complete: boolean
          phone: string | null
          physical_activity: string | null
          physical_activity_level: string | null
          protein_g: number | null
          tdee: number | null
          training_days_per_week: number | null
          training_duration_minutes: number | null
          training_intensity: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_type?: string | null
          additional_info?: string | null
          admin_confirmed?: boolean
          avatar_url?: string | null
          birth_date?: string | null
          bmr?: number | null
          carbs_g?: number | null
          cardio_days_per_week?: number | null
          cardio_duration_minutes?: number | null
          cardio_intensity?: string | null
          comorbidities?: string | null
          cpf?: string | null
          created_at?: string
          current_protocol?: string | null
          daily_calories?: number | null
          does_cardio?: boolean | null
          email?: string
          fat_g?: number | null
          full_name?: string
          gender?: string | null
          height?: number | null
          id?: string
          lab_exam_url?: string | null
          medical_prescription_url?: string | null
          objective?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          physical_activity?: string | null
          physical_activity_level?: string | null
          protein_g?: number | null
          tdee?: number | null
          training_days_per_week?: number | null
          training_duration_minutes?: number | null
          training_intensity?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_type?: string | null
          additional_info?: string | null
          admin_confirmed?: boolean
          avatar_url?: string | null
          birth_date?: string | null
          bmr?: number | null
          carbs_g?: number | null
          cardio_days_per_week?: number | null
          cardio_duration_minutes?: number | null
          cardio_intensity?: string | null
          comorbidities?: string | null
          cpf?: string | null
          created_at?: string
          current_protocol?: string | null
          daily_calories?: number | null
          does_cardio?: boolean | null
          email?: string
          fat_g?: number | null
          full_name?: string
          gender?: string | null
          height?: number | null
          id?: string
          lab_exam_url?: string | null
          medical_prescription_url?: string | null
          objective?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          physical_activity?: string | null
          physical_activity_level?: string | null
          protein_g?: number | null
          tdee?: number | null
          training_days_per_week?: number | null
          training_duration_minutes?: number | null
          training_intensity?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      protocol_category_content: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      protocol_extra_categories: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      protocol_library: {
        Row: {
          category_contents_json: Json
          content: string
          created_at: string
          created_by: string
          extra_categories_json: Json
          id: string
          items_json: Json
          title: string
          updated_at: string
        }
        Insert: {
          category_contents_json?: Json
          content?: string
          created_at?: string
          created_by: string
          extra_categories_json?: Json
          id?: string
          items_json?: Json
          title: string
          updated_at?: string
        }
        Update: {
          category_contents_json?: Json
          content?: string
          created_at?: string
          created_by?: string
          extra_categories_json?: Json
          id?: string
          items_json?: Json
          title?: string
          updated_at?: string
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
          carbs_g: number | null
          content: string | null
          created_at: string
          energy_kcal: number | null
          fat_g: number | null
          hydration_l: number | null
          id: string
          pdf_url: string | null
          protein_g: number | null
          release_date: string | null
          title: string
          updated_at: string
          user_id: string
          visible: boolean
        }
        Insert: {
          carbs_g?: number | null
          content?: string | null
          created_at?: string
          energy_kcal?: number | null
          fat_g?: number | null
          hydration_l?: number | null
          id?: string
          pdf_url?: string | null
          protein_g?: number | null
          release_date?: string | null
          title?: string
          updated_at?: string
          user_id: string
          visible?: boolean
        }
        Update: {
          carbs_g?: number | null
          content?: string | null
          created_at?: string
          energy_kcal?: number | null
          fat_g?: number | null
          hydration_l?: number | null
          id?: string
          pdf_url?: string | null
          protein_g?: number | null
          release_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visible?: boolean
        }
        Relationships: []
      }
      student_exercise_logs: {
        Row: {
          assignment_id: string
          id: string
          load_used: string | null
          logged_at: string
          notes: string | null
          template_exercise_id: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          id?: string
          load_used?: string | null
          logged_at?: string
          notes?: string | null
          template_exercise_id: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          id?: string
          load_used?: string | null
          logged_at?: string
          notes?: string | null
          template_exercise_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_exercise_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "student_workout_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_exercise_logs_template_exercise_id_fkey"
            columns: ["template_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_template_exercises"
            referencedColumns: ["id"]
          },
        ]
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
      student_workout_assignments: {
        Row: {
          active: boolean | null
          assigned_at: string
          assigned_by: string
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          assigned_at?: string
          assigned_by: string
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          assigned_at?: string
          assigned_by?: string
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_workout_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
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
          description: string | null
          id: string
          load_suggestion: string | null
          name: string
          notes: string | null
          reps: string
          rest_interval: string | null
          sets: string
          sort_order: number
          video_url: string | null
          week_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          load_suggestion?: string | null
          name: string
          notes?: string | null
          reps?: string
          rest_interval?: string | null
          sets?: string
          sort_order?: number
          video_url?: string | null
          week_id: string
        }
        Update: {
          description?: string | null
          id?: string
          load_suggestion?: string | null
          name?: string
          notes?: string | null
          reps?: string
          rest_interval?: string | null
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
      training_programs: {
        Row: {
          created_at: string
          created_by: string
          details: string | null
          id: string
          poster_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          details?: string | null
          id?: string
          poster_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          details?: string | null
          id?: string
          poster_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      water_logs: {
        Row: {
          amount_ml: number
          id: string
          log_date: string
          logged_at: string
          user_id: string
        }
        Insert: {
          amount_ml?: number
          id?: string
          log_date?: string
          logged_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          id?: string
          log_date?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          id: string
          logged_at: string
          notes: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          logged_at?: string
          notes?: string | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          logged_at?: string
          notes?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      workout_template_exercises: {
        Row: {
          custom_description: string | null
          custom_name: string | null
          exercise_id: string | null
          id: string
          load_suggestion: string | null
          reps: string | null
          rest_interval: string | null
          sets: string | null
          sort_order: number | null
          template_id: string
          video_url: string | null
        }
        Insert: {
          custom_description?: string | null
          custom_name?: string | null
          exercise_id?: string | null
          id?: string
          load_suggestion?: string | null
          reps?: string | null
          rest_interval?: string | null
          sets?: string | null
          sort_order?: number | null
          template_id: string
          video_url?: string | null
        }
        Update: {
          custom_description?: string | null
          custom_name?: string | null
          exercise_id?: string | null
          id?: string
          load_suggestion?: string | null
          reps?: string | null
          rest_interval?: string | null
          sets?: string | null
          sort_order?: number | null
          template_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          created_by: string
          days_per_week: number | null
          description: string | null
          id: string
          minutes_per_day: number | null
          program_id: string | null
          released: boolean
          sort_order: number | null
          subtitle: string | null
          title: string
          updated_at: string
          weeks: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          days_per_week?: number | null
          description?: string | null
          id?: string
          minutes_per_day?: number | null
          program_id?: string | null
          released?: boolean
          sort_order?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string
          weeks?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          days_per_week?: number | null
          description?: string | null
          id?: string
          minutes_per_day?: number | null
          program_id?: string | null
          released?: boolean
          sort_order?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          weeks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
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
      is_consultant_of: {
        Args: { _consultant_id: string; _student_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student" | "consultor" | "assistente" | "financeiro"
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
      app_role: ["admin", "student", "consultor", "assistente", "financeiro"],
    },
  },
} as const
