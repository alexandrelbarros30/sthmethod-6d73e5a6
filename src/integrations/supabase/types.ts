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
      automation_logs: {
        Row: {
          action_taken: string | null
          contact_phone: string
          created_at: string | null
          event_type: string
          flow_state: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          queue_type: string | null
          reason: string | null
          severity: string | null
          template_hash: string | null
        }
        Insert: {
          action_taken?: string | null
          contact_phone: string
          created_at?: string | null
          event_type: string
          flow_state?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          queue_type?: string | null
          reason?: string | null
          severity?: string | null
          template_hash?: string | null
        }
        Update: {
          action_taken?: string | null
          contact_phone?: string
          created_at?: string | null
          event_type?: string
          flow_state?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          queue_type?: string | null
          reason?: string | null
          severity?: string | null
          template_hash?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      cas_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          discipline: string
          embedding: string | null
          id: number
          page_end: number
          page_start: number
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          discipline: string
          embedding?: string | null
          id?: number
          page_end: number
          page_start: number
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          discipline?: string
          embedding?: string | null
          id?: number
          page_end?: number
          page_start?: number
        }
        Relationships: []
      }
      cas_quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          discipline: string
          exam: string
          id: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          page_ref: number | null
          question_num: number
          statement: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          discipline: string
          exam: string
          id?: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          page_ref?: number | null
          question_num: number
          statement: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          discipline?: string
          exam?: string
          id?: number
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          page_ref?: number | null
          question_num?: number
          statement?: string
        }
        Relationships: []
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
      crm_ai_memory: {
        Row: {
          category: string
          confidence: number | null
          contact_phone: string | null
          content: string
          created_at: string
          expires_at: string | null
          id: string
          scope: string
          source_conversation_id: string | null
          source_message_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          confidence?: number | null
          contact_phone?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          scope?: string
          source_conversation_id?: string | null
          source_message_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          confidence?: number | null
          contact_phone?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          scope?: string
          source_conversation_id?: string | null
          source_message_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      crm_ai_runs: {
        Row: {
          conversation_id: string | null
          created_at: string
          created_by: string | null
          id: string
          model: string | null
          prompt: string | null
          response: string | null
          tokens: number | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          model?: string | null
          prompt?: string | null
          response?: string | null
          tokens?: number | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          model?: string | null
          prompt?: string | null
          response?: string | null
          tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_ai_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_away_locks: {
        Row: {
          conversation_id: string
          last_sent_at: string
        }
        Insert: {
          conversation_id: string
          last_sent_at?: string
        }
        Update: {
          conversation_id?: string
          last_sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_away_locks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaign_recipients: {
        Row: {
          campaign_id: string
          created_at: string
          display_name: string | null
          error: string | null
          id: string
          phone: string
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          display_name?: string | null
          error?: string | null
          id?: string
          phone: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          display_name?: string | null
          error?: string | null
          id?: string
          phone?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaigns: {
        Row: {
          channel: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          media_url: string | null
          message_template: string
          name: string
          scheduled_at: string | null
          sent_count: number
          status: string
          target_filter: Json
          total_count: number
          updated_at: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          media_url?: string | null
          message_template: string
          name: string
          scheduled_at?: string | null
          sent_count?: number
          status?: string
          target_filter?: Json
          total_count?: number
          updated_at?: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          media_url?: string | null
          message_template?: string
          name?: string
          scheduled_at?: string | null
          sent_count?: number
          status?: string
          target_filter?: Json
          total_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      crm_conversation_tags: {
        Row: {
          conversation_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_conversation_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_conversations: {
        Row: {
          ai_paused_until: string | null
          assigned_to: string | null
          channel: string
          created_at: string
          display_name: string | null
          flow_context: Json
          flow_state: string | null
          human_handoff: boolean
          human_intro_sent: boolean
          id: string
          identified_as: string | null
          inactivity_warned_at: string | null
          is_lead: boolean
          last_bot_message_at: string | null
          last_direction: string | null
          last_message_at: string | null
          last_message_preview: string | null
          nutri_category: string | null
          phone: string
          pinned: boolean
          pipeline_stage: string | null
          provider: string | null
          queue_type: string | null
          session_count: number
          session_expires_at: string | null
          session_started_at: string | null
          status: string
          unread_count: number
          updated_at: string
          user_id: string | null
          wa_id: string | null
        }
        Insert: {
          ai_paused_until?: string | null
          assigned_to?: string | null
          channel?: string
          created_at?: string
          display_name?: string | null
          flow_context?: Json
          flow_state?: string | null
          human_handoff?: boolean
          human_intro_sent?: boolean
          id?: string
          identified_as?: string | null
          inactivity_warned_at?: string | null
          is_lead?: boolean
          last_bot_message_at?: string | null
          last_direction?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          nutri_category?: string | null
          phone: string
          pinned?: boolean
          pipeline_stage?: string | null
          provider?: string | null
          queue_type?: string | null
          session_count?: number
          session_expires_at?: string | null
          session_started_at?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
          user_id?: string | null
          wa_id?: string | null
        }
        Update: {
          ai_paused_until?: string | null
          assigned_to?: string | null
          channel?: string
          created_at?: string
          display_name?: string | null
          flow_context?: Json
          flow_state?: string | null
          human_handoff?: boolean
          human_intro_sent?: boolean
          id?: string
          identified_as?: string | null
          inactivity_warned_at?: string | null
          is_lead?: boolean
          last_bot_message_at?: string | null
          last_direction?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          nutri_category?: string | null
          phone?: string
          pinned?: boolean
          pipeline_stage?: string | null
          provider?: string | null
          queue_type?: string | null
          session_count?: number
          session_expires_at?: string | null
          session_started_at?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
          user_id?: string | null
          wa_id?: string | null
        }
        Relationships: []
      }
      crm_flow_steps: {
        Row: {
          actions: Json | null
          created_at: string | null
          display_format: string | null
          id: string
          key: string
          label: string
          media_type: string | null
          media_url: string | null
          message: string | null
          order_index: number | null
          position_x: number | null
          position_y: number | null
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          created_at?: string | null
          display_format?: string | null
          id?: string
          key: string
          label: string
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          order_index?: number | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          created_at?: string | null
          display_format?: string | null
          id?: string
          key?: string
          label?: string
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          order_index?: number | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_group_broadcasts: {
        Row: {
          active: boolean
          created_at: string
          group_ids: string[]
          hour_brt: number
          id: string
          image_urls: string[]
          key: string
          label: string
          last_sent_at: string | null
          message_body: string
          text_first: boolean
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          group_ids?: string[]
          hour_brt: number
          id?: string
          image_urls?: string[]
          key: string
          label: string
          last_sent_at?: string | null
          message_body: string
          text_first?: boolean
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          created_at?: string
          group_ids?: string[]
          hour_brt?: number
          id?: string
          image_urls?: string[]
          key?: string
          label?: string
          last_sent_at?: string | null
          message_body?: string
          text_first?: boolean
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      crm_message_locks: {
        Row: {
          context_key: string | null
          locked_at: string | null
          phone: string
        }
        Insert: {
          context_key?: string | null
          locked_at?: string | null
          phone: string
        }
        Update: {
          context_key?: string | null
          locked_at?: string | null
          phone?: string
        }
        Relationships: []
      }
      crm_message_templates: {
        Row: {
          active: boolean
          automation_trigger: string | null
          body: string
          category: string
          channel: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_automatic: boolean
          key: string
          media_url: string | null
          name: string
          pdf_url: string | null
          silent_dispatch: boolean
          updated_at: string
          variables: string[]
        }
        Insert: {
          active?: boolean
          automation_trigger?: string | null
          body: string
          category?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_automatic?: boolean
          key: string
          media_url?: string | null
          name: string
          pdf_url?: string | null
          silent_dispatch?: boolean
          updated_at?: string
          variables?: string[]
        }
        Update: {
          active?: boolean
          automation_trigger?: string | null
          body?: string
          category?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_automatic?: boolean
          key?: string
          media_url?: string | null
          name?: string
          pdf_url?: string | null
          silent_dispatch?: boolean
          updated_at?: string
          variables?: string[]
        }
        Relationships: []
      }
      crm_messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          direction: string
          external_id: string | null
          id: string
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          sent_by: string | null
          source: string
          status: string
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          direction: string
          external_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          sent_by?: string | null
          source?: string
          status?: string
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          external_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          sent_by?: string | null
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_queue_items: {
        Row: {
          closed_at: string | null
          conversation_id: string | null
          entered_at: string
          id: string
          notes: string | null
          phone: string | null
          picked_at: string | null
          picked_by: string | null
          priority: number
          queue_id: string
        }
        Insert: {
          closed_at?: string | null
          conversation_id?: string | null
          entered_at?: string
          id?: string
          notes?: string | null
          phone?: string | null
          picked_at?: string | null
          picked_by?: string | null
          priority?: number
          queue_id: string
        }
        Update: {
          closed_at?: string | null
          conversation_id?: string | null
          entered_at?: string
          id?: string
          notes?: string | null
          phone?: string | null
          picked_at?: string | null
          picked_by?: string | null
          priority?: number
          queue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_queue_items_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_queue_items_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "crm_queues"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_queues: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
          type: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          type: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      crm_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      crm_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          assigned_to: string | null
          conversation_id: string | null
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          notes: string | null
          phone: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_payment_links: {
        Row: {
          active: boolean
          amount: number
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          expires_at: string | null
          id: string
          label: string
          max_uses: number
          notes: string | null
          student_user_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount: number
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          label: string
          max_uses?: number
          notes?: string | null
          student_user_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          label?: string
          max_uses?: number
          notes?: string | null
          student_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          link_id: string
          method: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          payer_email: string | null
          payer_name: string
          payer_phone: string | null
          payer_user_id: string | null
          reconciled: boolean
          reconciled_at: string | null
          reconciled_by: string | null
          reconciled_notes: string | null
          reconciled_plan_id: string | null
          reconciled_subscription_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          link_id: string
          method?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payer_email?: string | null
          payer_name: string
          payer_phone?: string | null
          payer_user_id?: string | null
          reconciled?: boolean
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciled_notes?: string | null
          reconciled_plan_id?: string | null
          reconciled_subscription_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          link_id?: string
          method?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payer_email?: string | null
          payer_name?: string
          payer_phone?: string | null
          payer_user_id?: string | null
          reconciled?: boolean
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciled_notes?: string | null
          reconciled_plan_id?: string | null
          reconciled_subscription_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_payments_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "custom_payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_payments_reconciled_plan_id_fkey"
            columns: ["reconciled_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_payments_reconciled_subscription_id_fkey"
            columns: ["reconciled_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
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
      email_scheduled_sends: {
        Row: {
          attempts: number
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          recipient_email: string
          recipient_name: string | null
          recipient_user_id: string | null
          scheduled_at: string
          source: string
          status: string
          template_data: Json
          template_key: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          scheduled_at?: string
          source?: string
          status?: string
          template_data?: Json
          template_key: string
        }
        Update: {
          attempts?: number
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          scheduled_at?: string
          source?: string
          status?: string
          template_data?: Json
          template_key?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_template_settings: {
        Row: {
          auto_send: boolean
          automation_rule: Json | null
          body_html_override: string | null
          category: string
          custom_variables: Json
          enabled: boolean
          notes: string | null
          subject_override: string | null
          template_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_send?: boolean
          automation_rule?: Json | null
          body_html_override?: string | null
          category?: string
          custom_variables?: Json
          enabled?: boolean
          notes?: string | null
          subject_override?: string | null
          template_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_send?: boolean
          automation_rule?: Json | null
          body_html_override?: string | null
          category?: string
          custom_variables?: Json
          enabled?: boolean
          notes?: string | null
          subject_override?: string | null
          template_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      identity_verification_requests: {
        Row: {
          audit: Json
          change_type: string
          channel: string
          code_attempts: number
          code_expires_at: string | null
          code_hash: string | null
          code_sent_to: string | null
          code_verified: boolean
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          ip: string | null
          kba_attempts: number
          kba_passed: boolean
          new_value: string | null
          self_service_token: string | null
          status: string
          target_user_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          audit?: Json
          change_type: string
          channel?: string
          code_attempts?: number
          code_expires_at?: string | null
          code_hash?: string | null
          code_sent_to?: string | null
          code_verified?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ip?: string | null
          kba_attempts?: number
          kba_passed?: boolean
          new_value?: string | null
          self_service_token?: string | null
          status?: string
          target_user_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          audit?: Json
          change_type?: string
          channel?: string
          code_attempts?: number
          code_expires_at?: string | null
          code_hash?: string | null
          code_sent_to?: string | null
          code_verified?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ip?: string | null
          kba_attempts?: number
          kba_passed?: boolean
          new_value?: string | null
          self_service_token?: string | null
          status?: string
          target_user_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      image_consents: {
        Row: {
          allow_tagging: boolean | null
          authorized: boolean | null
          created_at: string
          created_by: string | null
          id: string
          ip_address: string | null
          notes: string | null
          payer_email: string | null
          payer_name: string
          payer_phone: string | null
          responded_at: string | null
          signature_name: string | null
          social_handle: string | null
          token: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          allow_tagging?: boolean | null
          authorized?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          payer_email?: string | null
          payer_name?: string
          payer_phone?: string | null
          responded_at?: string | null
          signature_name?: string | null
          social_handle?: string | null
          token?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          allow_tagging?: boolean | null
          authorized?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          payer_email?: string | null
          payer_name?: string
          payer_phone?: string | null
          responded_at?: string | null
          signature_name?: string | null
          social_handle?: string | null
          token?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
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
          automation_sent_at: string | null
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
          automation_sent_at?: string | null
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
          automation_sent_at?: string | null
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
          whatsapp_id: string | null
          whatsapp_opt_out: boolean
          whatsapp_opt_out_at: string | null
          whatsapp_opt_out_reason: string | null
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
          whatsapp_id?: string | null
          whatsapp_opt_out?: boolean
          whatsapp_opt_out_at?: string | null
          whatsapp_opt_out_reason?: string | null
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
          whatsapp_id?: string | null
          whatsapp_opt_out?: boolean
          whatsapp_opt_out_at?: string | null
          whatsapp_opt_out_reason?: string | null
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
      subscription_reminder_log: {
        Row: {
          end_date: string
          error_message: string | null
          id: string
          sent_at: string
          status: string
          subscription_id: string | null
          trigger: string
          user_id: string
        }
        Insert: {
          end_date: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          subscription_id?: string | null
          trigger: string
          user_id: string
        }
        Update: {
          end_date?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          subscription_id?: string | null
          trigger?: string
          user_id?: string
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
      supercoach_sync: {
        Row: {
          created_at: string
          divergent_found_name: string | null
          id: string
          last_updated_at: string | null
          observation: string | null
          status: string
          updated_at: string
          updated_by: string | null
          updated_by_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          divergent_found_name?: string | null
          id?: string
          last_updated_at?: string | null
          observation?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          divergent_found_name?: string | null
          id?: string
          last_updated_at?: string | null
          observation?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      supercoach_sync_logs: {
        Row: {
          created_at: string
          id: string
          observation: string | null
          performed_by: string | null
          performed_by_name: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          observation?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          observation?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      supplement_budgets: {
        Row: {
          created_at: string
          duration: string | null
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
          duration?: string | null
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
          duration?: string | null
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      crm_expire_idle_conversations: { Args: never; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_image_consent_by_token: {
        Args: { _token: string }
        Returns: {
          allow_tagging: boolean
          authorized: boolean
          has_user: boolean
          id: string
          payer_email: string
          payer_name: string
          payer_phone: string
          responded_at: string
          signature_name: string
          social_handle: string
          token: string
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
      identity_kba_available: { Args: { _user_id: string }; Returns: Json }
      is_consultant_of: {
        Args: { _consultant_id: string; _student_id: string }
        Returns: boolean
      }
      is_crm_staff: { Args: { _user_id: string }; Returns: boolean }
      is_phone_opted_out: { Args: { _phone: string }; Returns: boolean }
      match_cas_chunks: {
        Args: {
          filter_discipline?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          discipline: string
          id: number
          page_end: number
          page_start: number
          similarity: number
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      search_cas_chunks_fts: {
        Args: { filter_discipline?: string; match_count?: number; q: string }
        Returns: {
          content: string
          discipline: string
          id: number
          page_end: number
          page_start: number
          similarity: number
        }[]
      }
      submit_image_consent: {
        Args: {
          _allow_tagging: boolean
          _authorized: boolean
          _ip_address: string
          _payer_email: string
          _payer_name: string
          _payer_phone: string
          _signature_name: string
          _social_handle: string
          _token: string
          _user_agent: string
        }
        Returns: Json
      }
      verify_identity_kba: {
        Args: { _birth_date: string; _cpf_last4: string; _user_id: string }
        Returns: boolean
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
