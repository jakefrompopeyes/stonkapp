export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_stock_views: {
        Row: {
          created_at: string
          id: string
          last_reset_at: string
          ticker: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reset_at?: string
          ticker: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reset_at?: string
          ticker?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stock_views_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          subscription_status: string | null
          subscription_tier: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 