// ARCHIVO GENERADO. No se edita a mano (docs/conventions.md).
// Se vuelve a generar desde el esquema de Supabase cada vez que cambia una migración.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          advisor_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          legal_name: string
          phone: string | null
          tax_id: string
        }
        Insert: {
          advisor_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          legal_name: string
          phone?: string | null
          tax_id: string
        }
        Update: {
          advisor_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string
          phone?: string | null
          tax_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_data: {
        Row: {
          ai_proposal: Json | null
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          category_code: string | null
          document_id: string
          issue_date: string | null
          needs_review: boolean
          pending_fields: string[]
          supplier: string | null
          supplier_tax_id: string | null
          tax_base: number | null
          total: number | null
          updated_at: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          ai_proposal?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          category_code?: string | null
          document_id: string
          issue_date?: string | null
          needs_review?: boolean
          pending_fields?: string[]
          supplier?: string | null
          supplier_tax_id?: string | null
          tax_base?: number | null
          total?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          ai_proposal?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          category_code?: string | null
          document_id?: string
          issue_date?: string | null
          needs_review?: boolean
          pending_fields?: string[]
          supplier?: string | null
          supplier_tax_id?: string | null
          tax_base?: number | null
          total?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_data_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "document_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requests: {
        Row: {
          created_at: string
          description: string | null
          dossier_id: string
          due_date: string
          id: string
          reminder_sent_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dossier_id: string
          due_date: string
          id?: string
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dossier_id?: string
          due_date?: string
          id?: string
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          dossier_id: string
          id: string
          mime_type: string
          original_name: string
          rejection_reason: string | null
          request_id: string | null
          size_bytes: number
          status: Database["public"]["Enums"]["document_status"]
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          dossier_id: string
          id?: string
          mime_type: string
          original_name: string
          rejection_reason?: string | null
          request_id?: string | null
          size_bytes: number
          status?: Database["public"]["Enums"]["document_status"]
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          dossier_id?: string
          id?: string
          mime_type?: string
          original_name?: string
          rejection_reason?: string | null
          request_id?: string | null
          size_bytes?: number
          status?: Database["public"]["Enums"]["document_status"]
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_request_same_dossier"
            columns: ["request_id", "dossier_id"]
            isOneToOne: false
            referencedRelation: "document_requests"
            referencedColumns: ["id", "dossier_id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers: {
        Row: {
          client_id: string
          created_at: string
          id: string
          quarter: number
          status: Database["public"]["Enums"]["dossier_status"]
          year: number
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          quarter: number
          status?: Database["public"]["Enums"]["dossier_status"]
          year: number
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          quarter?: number
          status?: Database["public"]["Enums"]["dossier_status"]
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          code: string
          label: string
          sort_order: number
        }
        Insert: {
          code: string
          label: string
          sort_order: number
        }
        Update: {
          code?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      document_status:
        | "uploaded"
        | "reading"
        | "pending_review"
        | "approved"
        | "rejected"
      dossier_status: "open" | "closed"
      request_status: "pending" | "fulfilled" | "cancelled"
      user_role: "admin" | "advisor" | "client"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      document_status: [
        "uploaded",
        "reading",
        "pending_review",
        "approved",
        "rejected",
      ],
      dossier_status: ["open", "closed"],
      request_status: ["pending", "fulfilled", "cancelled"],
      user_role: ["admin", "advisor", "client"],
    },
  },
} as const
