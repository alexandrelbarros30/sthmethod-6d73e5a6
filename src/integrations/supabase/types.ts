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
      ads: {
        Row: {
          active: boolean
          created_at: string
          description: string
          display_duration_seconds: number | null
          end_date: string | null
          external_link: string | null
          id: string
          image_url: string | null
          popup_content: string | null
          sort_order: number
          start_date: string
          title: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          display_duration_seconds?: number | null
          end_date?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          popup_content?: string | null
          sort_order?: number
          start_date?: string
          title?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          display_duration_seconds?: number | null
          end_date?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          popup_content?: string | null
          sort_order?: number
          start_date?: string
          title?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      ai_assistant_chats: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_assistant_config: {
        Row: {
          assistant_name: string
          auto_reply_enabled: boolean
          auto_reply_office_hours: boolean
          business_hours: Json
          enforce_business_hours: boolean
          engine: string
          fallback_enabled: boolean
          fallback_message: string | null
          gemini_fallback_model: string | null
          gemini_last_error: string | null
          gemini_last_status: string | null
          gemini_last_used_at: string | null
          gemini_max_tokens: number | null
          gemini_model: string | null
          gemini_temperature: number | null
          id: number
          local_prompt: string
          model: string
          out_of_hours_message: string
          system_prompt: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assistant_name?: string
          auto_reply_enabled?: boolean
          auto_reply_office_hours?: boolean
          business_hours?: Json
          enforce_business_hours?: boolean
          engine?: string
          fallback_enabled?: boolean
          fallback_message?: string | null
          gemini_fallback_model?: string | null
          gemini_last_error?: string | null
          gemini_last_status?: string | null
          gemini_last_used_at?: string | null
          gemini_max_tokens?: number | null
          gemini_model?: string | null
          gemini_temperature?: number | null
          id?: number
          local_prompt?: string
          model?: string
          out_of_hours_message?: string
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assistant_name?: string
          auto_reply_enabled?: boolean
          auto_reply_office_hours?: boolean
          business_hours?: Json
          enforce_business_hours?: boolean
          engine?: string
          fallback_enabled?: boolean
          fallback_message?: string | null
          gemini_fallback_model?: string | null
          gemini_last_error?: string | null
          gemini_last_status?: string | null
          gemini_last_used_at?: string | null
          gemini_max_tokens?: number | null
          gemini_model?: string | null
          gemini_temperature?: number | null
          id?: number
          local_prompt?: string
          model?: string
          out_of_hours_message?: string
          system_prompt?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_assistant_conversation: {
        Row: {
          content: string
          created_at: string
          id: string
          intent: string | null
          phone: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          intent?: string | null
          phone: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          intent?: string | null
          phone?: string
          role?: string
        }
        Relationships: []
      }
      ai_assistant_training: {
        Row: {
          attachments: Json
          created_at: string
          created_by: string | null
          enabled: boolean
          hits: number
          id: string
          keywords: string[]
          label: string
          priority: number
          reply: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          hits?: number
          id?: string
          keywords?: string[]
          label: string
          priority?: number
          reply: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          hits?: number
          id?: string
          keywords?: string[]
          label?: string
          priority?: number
          reply?: string
          updated_at?: string
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
      api_channels: {
        Row: {
          base_url: string | null
          calls_unlocked_until: string | null
          channel_type: string
          connected_number: string | null
          connection_status: string
          created_at: string
          description: string | null
          id: string
          instance_id: string | null
          instance_name: string | null
          is_active: boolean
          last_sync_at: string | null
          name: string
          provider: string
          qr_code: string | null
          reject_call_message: string
          reject_calls: boolean
          responsible_user_id: string | null
          slug: string | null
          status: string
          updated_at: string
          webhook_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          base_url?: string | null
          calls_unlocked_until?: string | null
          channel_type: string
          connected_number?: string | null
          connection_status?: string
          created_at?: string
          description?: string | null
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          is_active?: boolean
          last_sync_at?: string | null
          name: string
          provider: string
          qr_code?: string | null
          reject_call_message?: string
          reject_calls?: boolean
          responsible_user_id?: string | null
          slug?: string | null
          status?: string
          updated_at?: string
          webhook_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          base_url?: string | null
          calls_unlocked_until?: string | null
          channel_type?: string
          connected_number?: string | null
          connection_status?: string
          created_at?: string
          description?: string | null
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          is_active?: boolean
          last_sync_at?: string | null
          name?: string
          provider?: string
          qr_code?: string | null
          reject_call_message?: string
          reject_calls?: boolean
          responsible_user_id?: string | null
          slug?: string | null
          status?: string
          updated_at?: string
          webhook_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      api_credentials: {
        Row: {
          access_token_encrypted: string | null
          api_key_encrypted: string | null
          channel_id: string
          client_id_encrypted: string | null
          client_secret_encrypted: string | null
          created_at: string
          id: string
          refresh_token_encrypted: string | null
          token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          channel_id: string
          client_id_encrypted?: string | null
          client_secret_encrypted?: string | null
          created_at?: string
          id?: string
          refresh_token_encrypted?: string | null
          token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          channel_id?: string
          client_id_encrypted?: string | null
          client_secret_encrypted?: string | null
          created_at?: string
          id?: string
          refresh_token_encrypted?: string | null
          token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_credentials_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "api_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      api_logs: {
        Row: {
          channel_id: string | null
          created_at: string
          error_message: string | null
          event_description: string | null
          event_type: string
          id: string
          ip: string | null
          provider: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          error_message?: string | null
          event_description?: string | null
          event_type: string
          id?: string
          ip?: string | null
          provider?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          error_message?: string | null
          event_description?: string | null
          event_type?: string
          id?: string
          ip?: string | null
          provider?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_logs_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "api_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          created_by: string | null
          duration_min: number
          ended_at: string | null
          id: string
          modality: Database["public"]["Enums"]["appointment_modality"]
          notes: string | null
          patient_notes: string | null
          patient_user_id: string
          professional_user_id: string
          reason: string | null
          scheduled_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_min?: number
          ended_at?: string | null
          id?: string
          modality?: Database["public"]["Enums"]["appointment_modality"]
          notes?: string | null
          patient_notes?: string | null
          patient_user_id: string
          professional_user_id: string
          reason?: string | null
          scheduled_at: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_min?: number
          ended_at?: string | null
          id?: string
          modality?: Database["public"]["Enums"]["appointment_modality"]
          notes?: string | null
          patient_notes?: string | null
          patient_user_id?: string
          professional_user_id?: string
          reason?: string | null
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      billing_actions: {
        Row: {
          assigned_to: string | null
          attempts: number
          created_at: string
          id: string
          ignore_until: string | null
          last_contact_at: string | null
          last_template: string | null
          observations: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          attempts?: number
          created_at?: string
          id?: string
          ignore_until?: string | null
          last_contact_at?: string | null
          last_template?: string | null
          observations?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          attempts?: number
          created_at?: string
          id?: string
          ignore_until?: string | null
          last_contact_at?: string | null
          last_template?: string | null
          observations?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_automation: {
        Row: {
          enabled: boolean
          id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      billing_campaigns: {
        Row: {
          auto_send: boolean
          created_at: string
          end_date: string
          id: string
          last_charged_at: string | null
          next_due_at: string
          notes: string | null
          plan_id: string | null
          responsible_user_id: string | null
          stage: number
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_send?: boolean
          created_at?: string
          end_date: string
          id?: string
          last_charged_at?: string | null
          next_due_at?: string
          notes?: string | null
          plan_id?: string | null
          responsible_user_id?: string | null
          stage?: number
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_send?: boolean
          created_at?: string
          end_date?: string
          id?: string
          last_charged_at?: string | null
          next_due_at?: string
          notes?: string | null
          plan_id?: string | null
          responsible_user_id?: string | null
          stage?: number
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_charges: {
        Row: {
          campaign_id: string | null
          delivery_error: string | null
          delivery_status: string
          document_name: string | null
          document_url: string | null
          id: string
          image_url: string | null
          message: string | null
          phone: string | null
          responsible_user_id: string | null
          sent_at: string
          stage: number
          template_key: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          delivery_error?: string | null
          delivery_status?: string
          document_name?: string | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          phone?: string | null
          responsible_user_id?: string | null
          sent_at?: string
          stage: number
          template_key?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          delivery_error?: string | null
          delivery_status?: string
          document_name?: string | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          phone?: string | null
          responsible_user_id?: string | null
          sent_at?: string
          stage?: number
          template_key?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_charges_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "billing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      bioimpedance_logs: {
        Row: {
          arm_cm: number | null
          bmr_kcal: number | null
          body_fat_pct: number | null
          calf_cm: number | null
          chest_cm: number | null
          created_at: string
          extracellular_water_l: number | null
          fat_mass_kg: number | null
          hip_cm: number | null
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
          thigh_cm: number | null
          total_water_l: number | null
          total_water_pct: number | null
          total_weight: number | null
          user_id: string
          visceral_fat: number | null
          waist_cm: number | null
        }
        Insert: {
          arm_cm?: number | null
          bmr_kcal?: number | null
          body_fat_pct?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          extracellular_water_l?: number | null
          fat_mass_kg?: number | null
          hip_cm?: number | null
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
          thigh_cm?: number | null
          total_water_l?: number | null
          total_water_pct?: number | null
          total_weight?: number | null
          user_id: string
          visceral_fat?: number | null
          waist_cm?: number | null
        }
        Update: {
          arm_cm?: number | null
          bmr_kcal?: number | null
          body_fat_pct?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          extracellular_water_l?: number | null
          fat_mass_kg?: number | null
          hip_cm?: number | null
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
          thigh_cm?: number | null
          total_water_l?: number | null
          total_water_pct?: number | null
          total_weight?: number | null
          user_id?: string
          visceral_fat?: number | null
          waist_cm?: number | null
        }
        Relationships: []
      }
      body_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_current: boolean
          storage_path: string | null
          type: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_current?: boolean
          storage_path?: string | null
          type: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_current?: boolean
          storage_path?: string | null
          type?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      call_reject_throttle: {
        Row: {
          channel_id: string
          last_at: string
          phone: string
        }
        Insert: {
          channel_id: string
          last_at?: string
          phone: string
        }
        Update: {
          channel_id?: string
          last_at?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_reject_throttle_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "api_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_documents: {
        Row: {
          created_at: string
          file_url: string
          id: string
          storage_path: string | null
          type: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          storage_path?: string | null
          type: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          storage_path?: string | null
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
          plan_ids: string[]
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
          plan_ids?: string[]
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
          plan_ids?: string[]
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
      crm_automation_runs: {
        Row: {
          automation_id: string
          context: Json | null
          error: string | null
          failed_count: number
          id: string
          matched_count: number
          sent_count: number
          status: string
          triggered_at: string
        }
        Insert: {
          automation_id: string
          context?: Json | null
          error?: string | null
          failed_count?: number
          id?: string
          matched_count?: number
          sent_count?: number
          status?: string
          triggered_at?: string
        }
        Update: {
          automation_id?: string
          context?: Json | null
          error?: string | null
          failed_count?: number
          id?: string
          matched_count?: number
          sent_count?: number
          status?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "crm_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automations: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          description: string | null
          id: string
          last_run_at: string | null
          media_ids: string[]
          name: string
          next_check_at: string | null
          run_count: number
          scope: string
          segment_id: string | null
          sent_count: number
          template_id: string | null
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          media_ids?: string[]
          name: string
          next_check_at?: string | null
          run_count?: number
          scope?: string
          segment_id?: string | null
          sent_count?: number
          template_id?: string | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          media_ids?: string[]
          name?: string
          next_check_at?: string | null
          run_count?: number
          scope?: string
          segment_id?: string | null
          sent_count?: number
          template_id?: string | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_automations_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "crm_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_automations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaign_messages: {
        Row: {
          campaign_id: string
          created_at: string
          deleted_at: string | null
          error: string | null
          id: string
          media_url: string | null
          provider_message_id: string | null
          recipient_name: string | null
          recipient_phone: string
          recipient_user_id: string | null
          rendered_content: string | null
          responded_at: string | null
          run_id: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          deleted_at?: string | null
          error?: string | null
          id?: string
          media_url?: string | null
          provider_message_id?: string | null
          recipient_name?: string | null
          recipient_phone: string
          recipient_user_id?: string | null
          rendered_content?: string | null
          responded_at?: string | null
          run_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          deleted_at?: string | null
          error?: string | null
          id?: string
          media_url?: string | null
          provider_message_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string
          recipient_user_id?: string | null
          rendered_content?: string | null
          responded_at?: string | null
          run_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_messages_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "crm_campaign_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaign_runs: {
        Row: {
          campaign_id: string
          error: string | null
          failed_count: number
          finished_at: string | null
          id: string
          sent_count: number
          started_at: string
          total_recipients: number
          trigger_type: string
          triggered_by: string | null
        }
        Insert: {
          campaign_id: string
          error?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          sent_count?: number
          started_at?: string
          total_recipients?: number
          trigger_type?: string
          triggered_by?: string | null
        }
        Update: {
          campaign_id?: string
          error?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          sent_count?: number
          started_at?: string
          total_recipients?: number
          trigger_type?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_runs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaigns: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          failed_count: number
          id: string
          last_run_at: string | null
          media_ids: string[] | null
          name: string
          next_run_at: string | null
          recurrence: Json | null
          response_count: number
          scheduled_at: string | null
          scope: string
          segment_id: string | null
          segment_snapshot: Json | null
          sent_count: number
          status: string
          template_id: string | null
          template_snapshot: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          failed_count?: number
          id?: string
          last_run_at?: string | null
          media_ids?: string[] | null
          name: string
          next_run_at?: string | null
          recurrence?: Json | null
          response_count?: number
          scheduled_at?: string | null
          scope?: string
          segment_id?: string | null
          segment_snapshot?: Json | null
          sent_count?: number
          status?: string
          template_id?: string | null
          template_snapshot?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          failed_count?: number
          id?: string
          last_run_at?: string | null
          media_ids?: string[] | null
          name?: string
          next_run_at?: string | null
          recurrence?: Json | null
          response_count?: number
          scheduled_at?: string | null
          scope?: string
          segment_id?: string | null
          segment_snapshot?: Json | null
          sent_count?: number
          status?: string
          template_id?: string | null
          template_snapshot?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "crm_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "crm_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          kind: string
          last_weight_update: string | null
          lead_status: string | null
          notes: string | null
          objective: string | null
          origin: string | null
          phone: string
          plan_end: string | null
          plan_name: string | null
          plan_start: string | null
          plan_status: string | null
          tags: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          kind?: string
          last_weight_update?: string | null
          lead_status?: string | null
          notes?: string | null
          objective?: string | null
          origin?: string | null
          phone: string
          plan_end?: string | null
          plan_name?: string | null
          plan_start?: string | null
          plan_status?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          kind?: string
          last_weight_update?: string | null
          lead_status?: string | null
          notes?: string | null
          objective?: string | null
          origin?: string | null
          phone?: string
          plan_end?: string | null
          plan_name?: string | null
          plan_start?: string | null
          plan_status?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      crm_media: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          favorite: boolean
          file_path: string | null
          id: string
          mime_type: string | null
          size_bytes: number | null
          tags: string[] | null
          title: string | null
          type: string
          updated_at: string
          uploaded_by: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          favorite?: boolean
          file_path?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          tags?: string[] | null
          title?: string | null
          type: string
          updated_at?: string
          uploaded_by: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          favorite?: boolean
          file_path?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          tags?: string[] | null
          title?: string | null
          type?: string
          updated_at?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: []
      }
      crm_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          body: string
          contact_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          body: string
          contact_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          contact_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_op_templates: {
        Row: {
          active: boolean
          body: string
          category: string
          channel: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          category: string
          channel: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          category?: string
          channel?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_segments: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          filters: Json
          id: string
          name: string
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          filters?: Json
          id?: string
          name: string
          scope?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          filters?: Json
          id?: string
          name?: string
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          kind: string | null
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          kind?: string | null
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          kind?: string | null
          name?: string
        }
        Relationships: []
      }
      crm_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          media_ids: string[] | null
          preview_text: string | null
          scope: string
          subcategory: string | null
          title: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          media_ids?: string[] | null
          preview_text?: string | null
          scope?: string
          subcategory?: string | null
          title: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          media_ids?: string[] | null
          preview_text?: string | null
          scope?: string
          subcategory?: string | null
          title?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      crm_ticket_messages: {
        Row: {
          body: string | null
          created_at: string
          direction: string
          id: string
          instance_id: string | null
          media_url: string | null
          message_id: string | null
          phone: string | null
          provider: string | null
          status: string | null
          ticket_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction: string
          id?: string
          instance_id?: string | null
          media_url?: string | null
          message_id?: string | null
          phone?: string | null
          provider?: string | null
          status?: string | null
          ticket_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: string
          id?: string
          instance_id?: string | null
          media_url?: string | null
          message_id?: string | null
          phone?: string | null
          provider?: string | null
          status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "crm_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tickets: {
        Row: {
          assigned_to: string | null
          channel: string
          closed_at: string | null
          contact_id: string
          created_at: string
          first_message_at: string
          id: string
          internal_notes: string | null
          last_message_at: string
          priority: string
          protocol: string | null
          protocol_seq: number | null
          status: string
          tags: string[]
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel: string
          closed_at?: string | null
          contact_id: string
          created_at?: string
          first_message_at?: string
          id?: string
          internal_notes?: string | null
          last_message_at?: string
          priority?: string
          protocol?: string | null
          protocol_seq?: number | null
          status?: string
          tags?: string[]
          type?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          closed_at?: string | null
          contact_id?: string
          created_at?: string
          first_message_at?: string
          id?: string
          internal_notes?: string | null
          last_message_at?: string
          priority?: string
          protocol?: string | null
          protocol_seq?: number | null
          status?: string
          tags?: string[]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_webhook_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          processed: boolean | null
          provider: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          provider: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          provider?: string
        }
        Relationships: []
      }
      custom_popups: {
        Row: {
          active: boolean
          button_route: string | null
          button_text: string | null
          created_at: string
          end_date: string | null
          id: string
          message: string
          start_date: string
          target_type: string
          target_user_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          button_route?: string | null
          button_text?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          message?: string
          start_date?: string
          target_type?: string
          target_user_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          button_route?: string | null
          button_text?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          message?: string
          start_date?: string
          target_type?: string
          target_user_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          hydration_l: number
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
          hydration_l?: number
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
          hydration_l?: number
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
          diet_id: string | null
          id: string
          image_url: string | null
          name: string
          sort_order: number
          time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diet_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          sort_order?: number
          time: string
          user_id: string
        }
        Update: {
          created_at?: string
          diet_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sort_order?: number
          time?: string
          user_id?: string
        }
        Relationships: []
      }
      diet_planning: {
        Row: {
          content_html: string
          created_at: string
          created_by: string | null
          id: string
          plan_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_html?: string
          created_at?: string
          created_by?: string | null
          id?: string
          plan_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_html?: string
          created_at?: string
          created_by?: string | null
          id?: string
          plan_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      evolution_notifications: {
        Row: {
          arm_cm: number | null
          calf_cm: number | null
          chest_cm: number | null
          created_at: string
          has_photos: boolean
          hip_cm: number | null
          id: string
          new_weight: number | null
          notes: string | null
          previous_weight: number | null
          seen: boolean
          student_message: string | null
          student_name: string
          student_user_id: string
          thigh_cm: number | null
          waist_cm: number | null
        }
        Insert: {
          arm_cm?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          has_photos?: boolean
          hip_cm?: number | null
          id?: string
          new_weight?: number | null
          notes?: string | null
          previous_weight?: number | null
          seen?: boolean
          student_message?: string | null
          student_name?: string
          student_user_id: string
          thigh_cm?: number | null
          waist_cm?: number | null
        }
        Update: {
          arm_cm?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          has_photos?: boolean
          hip_cm?: number | null
          id?: string
          new_weight?: number | null
          notes?: string | null
          previous_weight?: number | null
          seen?: boolean
          student_message?: string | null
          student_name?: string
          student_user_id?: string
          thigh_cm?: number | null
          waist_cm?: number | null
        }
        Relationships: []
      }
      evolution_reminders: {
        Row: {
          auto_sent_at: string | null
          created_at: string
          cycle_number: number
          due_date: string
          id: string
          seen: boolean
          student_name: string
          student_user_id: string
          subscription_id: string
        }
        Insert: {
          auto_sent_at?: string | null
          created_at?: string
          cycle_number?: number
          due_date: string
          id?: string
          seen?: boolean
          student_name?: string
          student_user_id: string
          subscription_id: string
        }
        Update: {
          auto_sent_at?: string | null
          created_at?: string
          cycle_number?: number
          due_date?: string
          id?: string
          seen?: boolean
          student_name?: string
          student_user_id?: string
          subscription_id?: string
        }
        Relationships: []
      }
      evolution_snapshots: {
        Row: {
          activity_type: string | null
          bioimpedance_log_id: string | null
          bmr: number | null
          body_fat_pct: number | null
          body_image_back_url: string | null
          body_image_front_url: string | null
          body_image_profile_url: string | null
          carbs_g: number | null
          cardio_days_per_week: number | null
          cardio_duration_minutes: number | null
          cardio_intensity: string | null
          created_at: string
          daily_calories: number | null
          does_cardio: boolean | null
          fat_g: number | null
          fat_mass_kg: number | null
          id: string
          lean_mass_kg: number | null
          notes: string
          physical_activity_level: string | null
          protein_g: number | null
          source: string
          tdee: number | null
          training_days_per_week: number | null
          training_duration_minutes: number | null
          training_intensity: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_type?: string | null
          bioimpedance_log_id?: string | null
          bmr?: number | null
          body_fat_pct?: number | null
          body_image_back_url?: string | null
          body_image_front_url?: string | null
          body_image_profile_url?: string | null
          carbs_g?: number | null
          cardio_days_per_week?: number | null
          cardio_duration_minutes?: number | null
          cardio_intensity?: string | null
          created_at?: string
          daily_calories?: number | null
          does_cardio?: boolean | null
          fat_g?: number | null
          fat_mass_kg?: number | null
          id?: string
          lean_mass_kg?: number | null
          notes?: string
          physical_activity_level?: string | null
          protein_g?: number | null
          source?: string
          tdee?: number | null
          training_days_per_week?: number | null
          training_duration_minutes?: number | null
          training_intensity?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_type?: string | null
          bioimpedance_log_id?: string | null
          bmr?: number | null
          body_fat_pct?: number | null
          body_image_back_url?: string | null
          body_image_front_url?: string | null
          body_image_profile_url?: string | null
          carbs_g?: number | null
          cardio_days_per_week?: number | null
          cardio_duration_minutes?: number | null
          cardio_intensity?: string | null
          created_at?: string
          daily_calories?: number | null
          does_cardio?: boolean | null
          fat_g?: number | null
          fat_mass_kg?: number | null
          id?: string
          lean_mass_kg?: number | null
          notes?: string
          physical_activity_level?: string | null
          protein_g?: number | null
          source?: string
          tdee?: number | null
          training_days_per_week?: number | null
          training_duration_minutes?: number | null
          training_intensity?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      exercise_library: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          muscle_group: string | null
          name: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          muscle_group?: string | null
          name: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          muscle_group?: string | null
          name?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      food_diary_entries: {
        Row: {
          carbs_g: number
          created_at: string
          energy_kcal: number
          fat_g: number
          fiber_g: number
          food_id: string | null
          id: string
          item_name: string
          log_date: string
          meal_label: string
          meal_type: string
          protein_g: number
          quantity: number
          sodium_mg: number
          sort_order: number
          unit: string
          user_id: string
        }
        Insert: {
          carbs_g?: number
          created_at?: string
          energy_kcal?: number
          fat_g?: number
          fiber_g?: number
          food_id?: string | null
          id?: string
          item_name: string
          log_date?: string
          meal_label?: string
          meal_type?: string
          protein_g?: number
          quantity?: number
          sodium_mg?: number
          sort_order?: number
          unit?: string
          user_id: string
        }
        Update: {
          carbs_g?: number
          created_at?: string
          energy_kcal?: number
          fat_g?: number
          fiber_g?: number
          food_id?: string | null
          id?: string
          item_name?: string
          log_date?: string
          meal_label?: string
          meal_type?: string
          protein_g?: number
          quantity?: number
          sodium_mg?: number
          sort_order?: number
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      food_diary_goals: {
        Row: {
          carbs_g: number
          daily_kcal: number
          fat_g: number
          protein_g: number
          updated_at: string
          user_id: string
          water_ml: number
        }
        Insert: {
          carbs_g?: number
          daily_kcal?: number
          fat_g?: number
          protein_g?: number
          updated_at?: string
          user_id: string
          water_ml?: number
        }
        Update: {
          carbs_g?: number
          daily_kcal?: number
          fat_g?: number
          protein_g?: number
          updated_at?: string
          user_id?: string
          water_ml?: number
        }
        Relationships: []
      }
      food_diary_water: {
        Row: {
          id: string
          log_date: string
          ml: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          log_date?: string
          ml?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          log_date?: string
          ml?: number
          updated_at?: string
          user_id?: string
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
      lab_screenings: {
        Row: {
          age: number | null
          biological_sex: string
          blood_pressure: string | null
          body_fat_pct: number | null
          compounds: string[] | null
          contacted: boolean
          created_at: string
          email: string | null
          full_name: string
          has_medical_followup: boolean | null
          height_cm: number | null
          id: string
          markers: Json
          notes: string | null
          risk_history: string[] | null
          summary: Json
          symptoms: string[] | null
          usage_duration: string | null
          usage_status: string
          uses_aggressive: boolean | null
          uses_ai_caber: boolean | null
          uses_gh_insulin: boolean | null
          uses_oral_17aa: boolean | null
          uses_testosterone: boolean | null
          weekly_dose: string | null
          weight_kg: number | null
          whatsapp: string
        }
        Insert: {
          age?: number | null
          biological_sex: string
          blood_pressure?: string | null
          body_fat_pct?: number | null
          compounds?: string[] | null
          contacted?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          has_medical_followup?: boolean | null
          height_cm?: number | null
          id?: string
          markers?: Json
          notes?: string | null
          risk_history?: string[] | null
          summary?: Json
          symptoms?: string[] | null
          usage_duration?: string | null
          usage_status: string
          uses_aggressive?: boolean | null
          uses_ai_caber?: boolean | null
          uses_gh_insulin?: boolean | null
          uses_oral_17aa?: boolean | null
          uses_testosterone?: boolean | null
          weekly_dose?: string | null
          weight_kg?: number | null
          whatsapp: string
        }
        Update: {
          age?: number | null
          biological_sex?: string
          blood_pressure?: string | null
          body_fat_pct?: number | null
          compounds?: string[] | null
          contacted?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          has_medical_followup?: boolean | null
          height_cm?: number | null
          id?: string
          markers?: Json
          notes?: string | null
          risk_history?: string[] | null
          summary?: Json
          symptoms?: string[] | null
          usage_duration?: string | null
          usage_status?: string
          uses_aggressive?: boolean | null
          uses_ai_caber?: boolean | null
          uses_gh_insulin?: boolean | null
          uses_oral_17aa?: boolean | null
          uses_testosterone?: boolean | null
          weekly_dose?: string | null
          weight_kg?: number | null
          whatsapp?: string
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
      medical_records: {
        Row: {
          ai_summary: string | null
          appointment_id: string | null
          content: string | null
          created_at: string
          id: string
          metadata: Json
          patient_user_id: string
          pinned: boolean
          professional_user_id: string
          section: Database["public"]["Enums"]["medical_record_section"]
          title: string | null
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          appointment_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          patient_user_id: string
          pinned?: boolean
          professional_user_id: string
          section: Database["public"]["Enums"]["medical_record_section"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          appointment_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          patient_user_id?: string
          pinned?: boolean
          professional_user_id?: string
          section?: Database["public"]["Enums"]["medical_record_section"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
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
          system_description: string | null
          system_key: string | null
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
          system_description?: string | null
          system_key?: string | null
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
          system_description?: string | null
          system_key?: string | null
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
      metabolic_panels: {
        Row: {
          content: string
          created_at: string
          id: string
          seen_by_student: boolean
          title: string
          updated_at: string
          user_id: string
          visible: boolean
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          seen_by_student?: boolean
          title?: string
          updated_at?: string
          user_id: string
          visible?: boolean
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          seen_by_student?: boolean
          title?: string
          updated_at?: string
          user_id?: string
          visible?: boolean
        }
        Relationships: []
      }
      nutri_business_hours: {
        Row: {
          away_message: string
          enabled: boolean
          id: string
          schedule: Json
          send_once_per_day: boolean
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          away_message?: string
          enabled?: boolean
          id?: string
          schedule?: Json
          send_once_per_day?: boolean
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          away_message?: string
          enabled?: boolean
          id?: string
          schedule?: Json
          send_once_per_day?: boolean
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      nutri_conversations: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          internal_notes: string | null
          last_away_at: string | null
          last_inbound_at: string | null
          last_message_at: string | null
          last_message_preview: string | null
          priority: string
          status: string
          tags: string[]
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          internal_notes?: string | null
          last_away_at?: string | null
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          priority?: string
          status?: string
          tags?: string[]
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          internal_notes?: string | null
          last_away_at?: string | null
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          priority?: string
          status?: string
          tags?: string[]
          unread_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutri_messages: {
        Row: {
          body: string
          created_at: string
          direction: string
          error: string | null
          id: string
          media_url: string | null
          phone: string
          sent_by: string | null
          status: string
          user_id: string
          wapi_message_id: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          direction: string
          error?: string | null
          id?: string
          media_url?: string | null
          phone: string
          sent_by?: string | null
          status?: string
          user_id: string
          wapi_message_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          direction?: string
          error?: string | null
          id?: string
          media_url?: string | null
          phone?: string
          sent_by?: string | null
          status?: string
          user_id?: string
          wapi_message_id?: string | null
        }
        Relationships: []
      }
      nutri_opt_outs: {
        Row: {
          created_at: string
          opted_out_by: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          opted_out_by?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          opted_out_by?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nutri_templates: {
        Row: {
          active: boolean
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          plan_scope: string | null
          tags: string[] | null
          title: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          plan_scope?: string | null
          tags?: string[] | null
          title: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          plan_scope?: string | null
          tags?: string[] | null
          title?: string
          tone?: string | null
          updated_at?: string
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
      payment_notifications: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          id: string
          method: string
          payment_id: string
          payment_status: string
          plan_name: string
          seen: boolean
          student_name: string
          student_user_id: string
        }
        Insert: {
          action_type?: string
          amount?: number
          created_at?: string
          id?: string
          method?: string
          payment_id: string
          payment_status?: string
          plan_name?: string
          seen?: boolean
          student_name?: string
          student_user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          id?: string
          method?: string
          payment_id?: string
          payment_status?: string
          plan_name?: string
          seen?: boolean
          student_name?: string
          student_user_id?: string
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
          title: string | null
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
          title?: string | null
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
          title?: string | null
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
      platform_updates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          impact: string
          published: boolean
          released_at: string
          title: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          impact: string
          published?: boolean
          released_at?: string
          title: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          impact?: string
          published?: boolean
          released_at?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      popup_dismissals: {
        Row: {
          dismissed_at: string
          id: string
          popup_id: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          id?: string
          popup_id: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          id?: string
          popup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "popup_dismissals_popup_id_fkey"
            columns: ["popup_id"]
            isOneToOne: false
            referencedRelation: "custom_popups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accessibility_theme: string | null
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
          notify_on_updates: boolean
          objective: string | null
          onboarding_complete: boolean
          phone: string | null
          physical_activity: string | null
          physical_activity_level: string | null
          preview_unlocked: boolean
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
          accessibility_theme?: string | null
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
          notify_on_updates?: boolean
          objective?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          physical_activity?: string | null
          physical_activity_level?: string | null
          preview_unlocked?: boolean
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
          accessibility_theme?: string | null
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
          notify_on_updates?: boolean
          objective?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          physical_activity?: string | null
          physical_activity_level?: string | null
          preview_unlocked?: boolean
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
      protocol_continuity_decisions: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision: string
          gap_days: number
          id: string
          previous_subscription_id: string | null
          subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          gap_days?: number
          id?: string
          previous_subscription_id?: string | null
          subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          gap_days?: number
          id?: string
          previous_subscription_id?: string | null
          subscription_id?: string
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
          pdf_url: string | null
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
          pdf_url?: string | null
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
          pdf_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      protocol_phase_checkins: {
        Row: {
          checkin_date: string
          completed_at: string
          created_at: string
          id: string
          phase_key: string
          user_id: string
        }
        Insert: {
          checkin_date?: string
          completed_at?: string
          created_at?: string
          id?: string
          phase_key: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          completed_at?: string
          created_at?: string
          id?: string
          phase_key?: string
          user_id?: string
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
      queue_join_requests: {
        Row: {
          called_at: string | null
          created_at: string
          done_at: string | null
          id: string
          joined_at: string
          source: string
          status: string
          student_name: string
          student_user_id: string | null
          updated_at: string
          visitor_name: string | null
          visitor_phone: string | null
        }
        Insert: {
          called_at?: string | null
          created_at?: string
          done_at?: string | null
          id?: string
          joined_at?: string
          source?: string
          status?: string
          student_name?: string
          student_user_id?: string | null
          updated_at?: string
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Update: {
          called_at?: string | null
          created_at?: string
          done_at?: string | null
          id?: string
          joined_at?: string
          source?: string
          status?: string
          student_name?: string
          student_user_id?: string | null
          updated_at?: string
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Relationships: []
      }
      queue_link_tokens: {
        Row: {
          created_at: string
          id: string
          student_user_id: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          student_user_id: string
          token: string
        }
        Update: {
          created_at?: string
          id?: string
          student_user_id?: string
          token?: string
        }
        Relationships: []
      }
      response_engine_settings: {
        Row: {
          after_hours_message: string | null
          ai_enabled: boolean
          ai_model: string
          auto_reply_enabled: boolean
          business_hours: Json
          channel_id: string
          created_at: string
          fallback_prompt: string | null
          handoff_to_human_after_minutes: number
          human_enabled: boolean
          id: string
          main_prompt: string | null
          max_auto_replies: number
          safety_prompt: string | null
          temperature: number
          updated_at: string
        }
        Insert: {
          after_hours_message?: string | null
          ai_enabled?: boolean
          ai_model?: string
          auto_reply_enabled?: boolean
          business_hours?: Json
          channel_id: string
          created_at?: string
          fallback_prompt?: string | null
          handoff_to_human_after_minutes?: number
          human_enabled?: boolean
          id?: string
          main_prompt?: string | null
          max_auto_replies?: number
          safety_prompt?: string | null
          temperature?: number
          updated_at?: string
        }
        Update: {
          after_hours_message?: string | null
          ai_enabled?: boolean
          ai_model?: string
          auto_reply_enabled?: boolean
          business_hours?: Json
          channel_id?: string
          created_at?: string
          fallback_prompt?: string | null
          handoff_to_human_after_minutes?: number
          human_enabled?: boolean
          id?: string
          main_prompt?: string | null
          max_auto_replies?: number
          safety_prompt?: string | null
          temperature?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_engine_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "api_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_meal_items: {
        Row: {
          carbs_g: number
          energy_kcal: number
          fat_g: number
          food_id: string | null
          id: string
          item_name: string
          protein_g: number
          quantity: number
          saved_meal_id: string
          sort_order: number
          unit: string
        }
        Insert: {
          carbs_g?: number
          energy_kcal?: number
          fat_g?: number
          food_id?: string | null
          id?: string
          item_name: string
          protein_g?: number
          quantity?: number
          saved_meal_id: string
          sort_order?: number
          unit?: string
        }
        Update: {
          carbs_g?: number
          energy_kcal?: number
          fat_g?: number
          food_id?: string | null
          id?: string
          item_name?: string
          protein_g?: number
          quantity?: number
          saved_meal_id?: string
          sort_order?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_meal_items_saved_meal_id_fkey"
            columns: ["saved_meal_id"]
            isOneToOne: false
            referencedRelation: "saved_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_meals: {
        Row: {
          created_at: string
          id: string
          name: string
          total_carbs: number
          total_fat: number
          total_kcal: number
          total_protein: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          total_carbs?: number
          total_fat?: number
          total_kcal?: number
          total_protein?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          total_carbs?: number
          total_fat?: number
          total_kcal?: number
          total_protein?: number
          user_id?: string
        }
        Relationships: []
      }
      service_queue_dismissals: {
        Row: {
          dismissed_at: string
          dismissed_by: string
          id: string
          occurred_at: string
          type: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          dismissed_by: string
          id?: string
          occurred_at: string
          type: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          dismissed_by?: string
          id?: string
          occurred_at?: string
          type?: string
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
      sth_ai_drafts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          confidence: number | null
          contact_name: string | null
          contact_type: string | null
          created_at: string
          draft_text: string
          engine: string
          final_text: string | null
          id: string
          inbound_text: string | null
          intent: string | null
          latency_ms: number | null
          memory_id: string | null
          meta: Json
          model: string | null
          phone: string | null
          rejected_reason: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          ticket_id: string | null
          tokens_in: number | null
          tokens_out: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number | null
          contact_name?: string | null
          contact_type?: string | null
          created_at?: string
          draft_text: string
          engine?: string
          final_text?: string | null
          id?: string
          inbound_text?: string | null
          intent?: string | null
          latency_ms?: number | null
          memory_id?: string | null
          meta?: Json
          model?: string | null
          phone?: string | null
          rejected_reason?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          ticket_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number | null
          contact_name?: string | null
          contact_type?: string | null
          created_at?: string
          draft_text?: string
          engine?: string
          final_text?: string | null
          id?: string
          inbound_text?: string | null
          intent?: string | null
          latency_ms?: number | null
          memory_id?: string | null
          meta?: Json
          model?: string | null
          phone?: string | null
          rejected_reason?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          ticket_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sth_ai_drafts_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "sth_memory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sth_ai_drafts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sth_ai_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sth_ai_templates: {
        Row: {
          active: boolean
          body: string
          category: string
          created_at: string
          created_by: string | null
          engine: string
          id: string
          name: string
          success_count: number
          tags: string[]
          updated_at: string
          uses_count: number
        }
        Insert: {
          active?: boolean
          body: string
          category: string
          created_at?: string
          created_by?: string | null
          engine?: string
          id?: string
          name: string
          success_count?: number
          tags?: string[]
          updated_at?: string
          uses_count?: number
        }
        Update: {
          active?: boolean
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          engine?: string
          id?: string
          name?: string
          success_count?: number
          tags?: string[]
          updated_at?: string
          uses_count?: number
        }
        Relationships: []
      }
      sth_ai_unsolved: {
        Row: {
          created_at: string
          id: string
          memory_id: string | null
          phone: string | null
          question: string
          reason: string | null
          resolved: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          memory_id?: string | null
          phone?: string | null
          question: string
          reason?: string | null
          resolved?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          memory_id?: string | null
          phone?: string | null
          question?: string
          reason?: string | null
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sth_ai_unsolved_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "sth_memory"
            referencedColumns: ["id"]
          },
        ]
      }
      sth_auto_events: {
        Row: {
          action_taken: string | null
          channel: string | null
          classification: string | null
          created_at: string
          decision: string | null
          id: string
          intent: string | null
          memory_id: string | null
          payload: Json | null
          phone: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          channel?: string | null
          classification?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          intent?: string | null
          memory_id?: string | null
          payload?: Json | null
          phone: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          channel?: string | null
          classification?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          intent?: string | null
          memory_id?: string | null
          payload?: Json | null
          phone?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sth_auto_score_log: {
        Row: {
          created_at: string
          delta: number
          id: string
          memory_id: string | null
          phone: string
          reason: string
        }
        Insert: {
          created_at?: string
          delta?: number
          id?: string
          memory_id?: string | null
          phone: string
          reason: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          memory_id?: string | null
          phone?: string
          reason?: string
        }
        Relationships: []
      }
      sth_auto_sessions: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          idle_warned: boolean
          last_inbound_at: string
          last_outbound_at: string | null
          phone: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          idle_warned?: boolean
          last_inbound_at?: string
          last_outbound_at?: string | null
          phone: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          idle_warned?: boolean
          last_inbound_at?: string
          last_outbound_at?: string | null
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sth_kb_articles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_id: string | null
          author_name: string | null
          category: string
          content: string
          created_at: string
          id: string
          search_vector: unknown
          status: string
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          uses_count: number
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          author_name?: string | null
          category: string
          content: string
          created_at?: string
          id?: string
          search_vector?: unknown
          status?: string
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          uses_count?: number
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          search_vector?: unknown
          status?: string
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          uses_count?: number
          version?: number
        }
        Relationships: []
      }
      sth_kb_versions: {
        Row: {
          article_id: string
          category: string
          change_note: string | null
          content: string
          created_at: string
          edited_by: string | null
          edited_by_name: string | null
          id: string
          status: string
          tags: string[]
          title: string
          version: number
        }
        Insert: {
          article_id: string
          category: string
          change_note?: string | null
          content: string
          created_at?: string
          edited_by?: string | null
          edited_by_name?: string | null
          id?: string
          status: string
          tags?: string[]
          title: string
          version: number
        }
        Update: {
          article_id?: string
          category?: string
          change_note?: string | null
          content?: string
          created_at?: string
          edited_by?: string | null
          edited_by_name?: string | null
          id?: string
          status?: string
          tags?: string[]
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sth_kb_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "sth_kb_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      sth_knowledge_base: {
        Row: {
          content: string
          created_at: string
          enabled: boolean
          id: string
          priority: number
          slug: string
          tags: string[]
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          content: string
          created_at?: string
          enabled?: boolean
          id?: string
          priority?: number
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          enabled?: boolean
          id?: string
          priority?: number
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      sth_memory: {
        Row: {
          avg_response_seconds: number | null
          created_at: string
          current_weight: number | null
          difficulties: string[] | null
          full_name: string | null
          id: string
          initial_weight: number | null
          last_answer: string | null
          last_interaction_at: string | null
          last_physical_update: string | null
          last_question: string | null
          last_seen_at: string | null
          lead_interest: string | null
          lead_plan_presented: string | null
          meta: Json
          objective: string | null
          phone: string
          photos_count: number
          plan_name: string | null
          plan_status: string | null
          preferences: string[] | null
          preferred_format: string | null
          preferred_tone: string | null
          response_frequency: string | null
          score: number
          temperature: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avg_response_seconds?: number | null
          created_at?: string
          current_weight?: number | null
          difficulties?: string[] | null
          full_name?: string | null
          id?: string
          initial_weight?: number | null
          last_answer?: string | null
          last_interaction_at?: string | null
          last_physical_update?: string | null
          last_question?: string | null
          last_seen_at?: string | null
          lead_interest?: string | null
          lead_plan_presented?: string | null
          meta?: Json
          objective?: string | null
          phone: string
          photos_count?: number
          plan_name?: string | null
          plan_status?: string | null
          preferences?: string[] | null
          preferred_format?: string | null
          preferred_tone?: string | null
          response_frequency?: string | null
          score?: number
          temperature?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avg_response_seconds?: number | null
          created_at?: string
          current_weight?: number | null
          difficulties?: string[] | null
          full_name?: string | null
          id?: string
          initial_weight?: number | null
          last_answer?: string | null
          last_interaction_at?: string | null
          last_physical_update?: string | null
          last_question?: string | null
          last_seen_at?: string | null
          lead_interest?: string | null
          lead_plan_presented?: string | null
          meta?: Json
          objective?: string | null
          phone?: string
          photos_count?: number
          plan_name?: string | null
          plan_status?: string | null
          preferences?: string[] | null
          preferred_format?: string | null
          preferred_tone?: string | null
          response_frequency?: string | null
          score?: number
          temperature?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sth_memory_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          data: Json
          id: string
          memory_id: string
          message: string
          severity: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          data?: Json
          id?: string
          memory_id: string
          message: string
          severity?: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          data?: Json
          id?: string
          memory_id?: string
          message?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "sth_memory_alerts_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "sth_memory"
            referencedColumns: ["id"]
          },
        ]
      }
      sth_memory_learning: {
        Row: {
          answer: string | null
          created_at: string
          engine: string | null
          id: string
          intent: string | null
          memory_id: string | null
          outcome: string | null
          phone: string | null
          question: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          engine?: string | null
          id?: string
          intent?: string | null
          memory_id?: string | null
          outcome?: string | null
          phone?: string | null
          question: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          engine?: string | null
          id?: string
          intent?: string | null
          memory_id?: string | null
          outcome?: string | null
          phone?: string | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "sth_memory_learning_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "sth_memory"
            referencedColumns: ["id"]
          },
        ]
      }
      sth_memory_objections: {
        Row: {
          created_at: string
          id: string
          memory_id: string
          objection_key: string
          raw_text: string | null
          resolution_note: string | null
          resolved: boolean
          resolved_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          memory_id: string
          objection_key: string
          raw_text?: string | null
          resolution_note?: string | null
          resolved?: boolean
          resolved_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          memory_id?: string
          objection_key?: string
          raw_text?: string | null
          resolution_note?: string | null
          resolved?: boolean
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sth_memory_objections_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "sth_memory"
            referencedColumns: ["id"]
          },
        ]
      }
      sth_memory_timeline: {
        Row: {
          created_at: string
          created_by: string | null
          event_data: Json
          event_description: string | null
          event_title: string
          event_type: string
          id: string
          memory_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_data?: Json
          event_description?: string | null
          event_title: string
          event_type: string
          id?: string
          memory_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_data?: Json
          event_description?: string | null
          event_title?: string
          event_type?: string
          id?: string
          memory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sth_memory_timeline_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "sth_memory"
            referencedColumns: ["id"]
          },
        ]
      }
      student_content_batches: {
        Row: {
          batch_started_at: string | null
          combined_sent_at: string | null
          created_at: string
          diet_ready_at: string | null
          last_individual_sent: Json
          protocol_ready_at: string | null
          training_ready_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_started_at?: string | null
          combined_sent_at?: string | null
          created_at?: string
          diet_ready_at?: string | null
          last_individual_sent?: Json
          protocol_ready_at?: string | null
          training_ready_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_started_at?: string | null
          combined_sent_at?: string | null
          created_at?: string
          diet_ready_at?: string | null
          last_individual_sent?: Json
          protocol_ready_at?: string | null
          training_ready_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_diets: {
        Row: {
          carbs_g: number | null
          content: string | null
          created_at: string
          end_date: string | null
          energy_kcal: number | null
          fat_g: number | null
          hydration_l: number | null
          id: string
          is_active: boolean
          pdf_url: string | null
          protein_g: number | null
          release_date: string | null
          seen_by_student: boolean
          start_date: string | null
          storage_path: string | null
          tab_label: string | null
          title: string
          updated_at: string
          user_id: string
          visible: boolean
        }
        Insert: {
          carbs_g?: number | null
          content?: string | null
          created_at?: string
          end_date?: string | null
          energy_kcal?: number | null
          fat_g?: number | null
          hydration_l?: number | null
          id?: string
          is_active?: boolean
          pdf_url?: string | null
          protein_g?: number | null
          release_date?: string | null
          seen_by_student?: boolean
          start_date?: string | null
          storage_path?: string | null
          tab_label?: string | null
          title?: string
          updated_at?: string
          user_id: string
          visible?: boolean
        }
        Update: {
          carbs_g?: number | null
          content?: string | null
          created_at?: string
          end_date?: string | null
          energy_kcal?: number | null
          fat_g?: number | null
          hydration_l?: number | null
          id?: string
          is_active?: boolean
          pdf_url?: string | null
          protein_g?: number | null
          release_date?: string | null
          seen_by_student?: boolean
          start_date?: string | null
          storage_path?: string | null
          tab_label?: string | null
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
      student_flow_status: {
        Row: {
          cadastro_recebido_at: string | null
          created_at: string
          dados_em_analise_at: string | null
          estrategia_estruturando_at: string | null
          id: string
          notes: string | null
          plano_avancado_pronto_at: string | null
          plataforma_liberada_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cadastro_recebido_at?: string | null
          created_at?: string
          dados_em_analise_at?: string | null
          estrategia_estruturando_at?: string | null
          id?: string
          notes?: string | null
          plano_avancado_pronto_at?: string | null
          plataforma_liberada_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cadastro_recebido_at?: string | null
          created_at?: string
          dados_em_analise_at?: string | null
          estrategia_estruturando_at?: string | null
          id?: string
          notes?: string | null
          plano_avancado_pronto_at?: string | null
          plataforma_liberada_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_program_assignments: {
        Row: {
          active: boolean
          assigned_at: string
          assigned_by: string
          id: string
          program_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          assigned_at?: string
          assigned_by: string
          id?: string
          program_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          assigned_at?: string
          assigned_by?: string
          id?: string
          program_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_program_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      student_protocols: {
        Row: {
          content: string | null
          created_at: string
          end_date: string | null
          id: string
          pdf_url: string | null
          release_date: string | null
          seen_by_student: boolean
          storage_path: string | null
          title: string
          updated_at: string
          user_id: string
          visible: boolean
        }
        Insert: {
          content?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          pdf_url?: string | null
          release_date?: string | null
          seen_by_student?: boolean
          storage_path?: string | null
          title?: string
          updated_at?: string
          user_id: string
          visible?: boolean
        }
        Update: {
          content?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          pdf_url?: string | null
          release_date?: string | null
          seen_by_student?: boolean
          storage_path?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visible?: boolean
        }
        Relationships: []
      }
      student_trainings: {
        Row: {
          content: string | null
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          pdf_url: string | null
          seen_by_student: boolean
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          pdf_url?: string | null
          seen_by_student?: boolean
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          pdf_url?: string | null
          seen_by_student?: boolean
          start_date?: string | null
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
          seen_by_student: boolean
          template_id: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          assigned_at?: string
          assigned_by: string
          id?: string
          seen_by_student?: boolean
          template_id: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          assigned_at?: string
          assigned_by?: string
          id?: string
          seen_by_student?: boolean
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
      student_workout_sessions: {
        Row: {
          assignment_id: string
          feedback: string | null
          finished_at: string | null
          id: string
          started_at: string
          template_id: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          template_id: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_workout_sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "student_workout_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_workout_sessions_template_id_fkey"
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
      supplement_budgets: {
        Row: {
          created_at: string
          id: string
          items: Json
          notes: string | null
          status: string
          title: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          title?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          title?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tele_professionals: {
        Row: {
          active: boolean
          bio: string | null
          council_id: string | null
          council_uf: string | null
          created_at: string
          id: string
          specialty: Database["public"]["Enums"]["tele_specialty"]
          updated_at: string
          user_id: string
          video_room_url: string | null
        }
        Insert: {
          active?: boolean
          bio?: string | null
          council_id?: string | null
          council_uf?: string | null
          created_at?: string
          id?: string
          specialty?: Database["public"]["Enums"]["tele_specialty"]
          updated_at?: string
          user_id: string
          video_room_url?: string | null
        }
        Update: {
          active?: boolean
          bio?: string | null
          council_id?: string | null
          council_uf?: string | null
          created_at?: string
          id?: string
          specialty?: Database["public"]["Enums"]["tele_specialty"]
          updated_at?: string
          user_id?: string
          video_room_url?: string | null
        }
        Relationships: []
      }
      training_exercises: {
        Row: {
          description: string | null
          id: string
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
          difficulty: string
          expires_at: string | null
          id: string
          objective: string
          poster_url: string | null
          status: string
          subtitle: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          details?: string | null
          difficulty?: string
          expires_at?: string | null
          id?: string
          objective?: string
          poster_url?: string | null
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          details?: string | null
          difficulty?: string
          expires_at?: string | null
          id?: string
          objective?: string
          poster_url?: string | null
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      training_weeks: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          start_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          start_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          start_date?: string | null
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
          arm_cm: number | null
          calf_cm: number | null
          chest_cm: number | null
          created_at: string
          hip_cm: number | null
          id: string
          logged_at: string
          notes: string | null
          student_message: string | null
          thigh_cm: number | null
          user_id: string
          waist_cm: number | null
          weight: number
        }
        Insert: {
          arm_cm?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          student_message?: string | null
          thigh_cm?: number | null
          user_id: string
          waist_cm?: number | null
          weight: number
        }
        Update: {
          arm_cm?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          student_message?: string | null
          thigh_cm?: number | null
          user_id?: string
          waist_cm?: number | null
          weight?: number
        }
        Relationships: []
      }
      whatsapp_menu_audit: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          changed_by: string | null
          created_at: string
          id: string
          menu_key: string | null
          option_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          changed_by?: string | null
          created_at?: string
          id?: string
          menu_key?: string | null
          option_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          changed_by?: string | null
          created_at?: string
          id?: string
          menu_key?: string | null
          option_id?: string | null
        }
        Relationships: []
      }
      whatsapp_menu_options: {
        Row: {
          active: boolean
          channel: string
          created_at: string
          display_order: number
          ends_session: boolean
          id: string
          label: string
          menu_key: string
          next_menu_key: string | null
          option_number: number
          queue: string | null
          requires_active_student: boolean
          requires_human: boolean
          response_message: string
          returns_to_menu: boolean
          tag: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          channel?: string
          created_at?: string
          display_order?: number
          ends_session?: boolean
          id?: string
          label: string
          menu_key: string
          next_menu_key?: string | null
          option_number: number
          queue?: string | null
          requires_active_student?: boolean
          requires_human?: boolean
          response_message?: string
          returns_to_menu?: boolean
          tag?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          channel?: string
          created_at?: string
          display_order?: number
          ends_session?: boolean
          id?: string
          label?: string
          menu_key?: string
          next_menu_key?: string | null
          option_number?: number
          queue?: string | null
          requires_active_student?: boolean
          requires_human?: boolean
          response_message?: string
          returns_to_menu?: boolean
          tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_menu_options_menu_key_fkey"
            columns: ["menu_key"]
            isOneToOne: false
            referencedRelation: "whatsapp_menus"
            referencedColumns: ["key"]
          },
        ]
      }
      whatsapp_menus: {
        Row: {
          active: boolean
          created_at: string
          footer_message: string
          header_message: string
          id: string
          key: string
          parent_key: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          footer_message?: string
          header_message?: string
          id?: string
          key: string
          parent_key?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          footer_message?: string
          header_message?: string
          id?: string
          key?: string
          parent_key?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_session_tags: {
        Row: {
          created_at: string
          id: string
          session_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_session_tags_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          assigned_queue: string | null
          context: Json
          created_at: string
          current_menu_key: string | null
          id: string
          last_interaction_at: string
          phone: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_queue?: string | null
          context?: Json
          created_at?: string
          current_menu_key?: string | null
          id?: string
          last_interaction_at?: string
          phone: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_queue?: string | null
          context?: Json
          created_at?: string
          current_menu_key?: string | null
          id?: string
          last_interaction_at?: string
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_settings: {
        Row: {
          active_main_menu_key: string
          enabled: boolean
          id: boolean
          updated_at: string
        }
        Insert: {
          active_main_menu_key?: string
          enabled?: boolean
          id?: boolean
          updated_at?: string
        }
        Update: {
          active_main_menu_key?: string
          enabled?: boolean
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      workout_template_exercises: {
        Row: {
          custom_description: string | null
          custom_name: string | null
          exercise_id: string | null
          group_color: string | null
          group_id: string | null
          group_name: string | null
          id: string
          image_url: string | null
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
          group_color?: string | null
          group_id?: string | null
          group_name?: string | null
          id?: string
          image_url?: string | null
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
          group_color?: string | null
          group_id?: string | null
          group_name?: string | null
          id?: string
          image_url?: string | null
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
          image_url: string | null
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
          image_url?: string | null
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
          image_url?: string | null
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
      advance_billing_campaign: {
        Args: { _campaign_id: string }
        Returns: {
          auto_send: boolean
          created_at: string
          end_date: string
          id: string
          last_charged_at: string | null
          next_due_at: string
          notes: string | null
          plan_id: string | null
          responsible_user_id: string | null
          stage: number
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "billing_campaigns"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      crm_route_inbound: {
        Args: {
          _body: string
          _instance_id?: string
          _media_url?: string
          _message_id?: string
          _phone: string
          _provider: string
        }
        Returns: string
      }
      find_profile_by_phone: {
        Args: { _phone: string }
        Returns: {
          email: string
          full_name: string
          objective: string
          phone: string
          user_id: string
        }[]
      }
      has_admin_view: { Args: { _user_id: string }; Returns: boolean }
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
      sth_ai_engine_stats: { Args: never; Returns: Json }
      sth_automation_dashboard: { Args: never; Returns: Json }
      sth_command_center: { Args: never; Returns: Json }
      sth_crm_dashboard_stats: { Args: never; Returns: Json }
      sth_growth_dashboard: { Args: never; Returns: Json }
      sth_kb_search: {
        Args: { _category?: string; _limit?: number; _query: string }
        Returns: {
          category: string
          content: string
          id: string
          rank: number
          summary: string
          tags: string[]
          title: string
        }[]
      }
      sth_memory_recalc_score: { Args: { _memory_id: string }; Returns: number }
      sth_memory_upsert: {
        Args: { _patch?: Json; _phone: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "student"
        | "consultor"
        | "assistente"
        | "financeiro"
        | "admin_viewer"
      appointment_modality: "video" | "in_person" | "chat"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      medical_record_section:
        | "anamnese"
        | "evolucao_clinica"
        | "exames"
        | "estrategia_nutricional"
        | "protocolo"
        | "prescricao"
        | "emocoes_humor"
        | "sono"
        | "performance"
        | "sintomas"
        | "historico"
        | "outros"
      tele_specialty:
        | "medico"
        | "nutricionista"
        | "psicologo"
        | "psiquiatra"
        | "terapeuta"
        | "educador_fisico"
        | "consultor"
        | "outro"
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
      app_role: [
        "admin",
        "student",
        "consultor",
        "assistente",
        "financeiro",
        "admin_viewer",
      ],
      appointment_modality: ["video", "in_person", "chat"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      medical_record_section: [
        "anamnese",
        "evolucao_clinica",
        "exames",
        "estrategia_nutricional",
        "protocolo",
        "prescricao",
        "emocoes_humor",
        "sono",
        "performance",
        "sintomas",
        "historico",
        "outros",
      ],
      tele_specialty: [
        "medico",
        "nutricionista",
        "psicologo",
        "psiquiatra",
        "terapeuta",
        "educador_fisico",
        "consultor",
        "outro",
      ],
    },
  },
} as const
