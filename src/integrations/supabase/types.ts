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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          button_link: string | null
          button_text: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          created_by_seller: string | null
          icon: string | null
          id: string
          is_active: boolean
          label: string
          slug: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by_seller?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by_seller?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_created_by_seller_fkey"
            columns: ["created_by_seller"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean
          message: string
          seller_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          seller_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          seller_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          selected_size: string | null
          seller_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity?: number
          selected_size?: string | null
          seller_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          selected_size?: string | null
          seller_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          commission_paid: boolean
          created_at: string | null
          customer_address: string
          customer_location: string
          customer_name: string
          customer_phone: string
          district: string | null
          id: string
          map_url: string | null
          municipality: string | null
          notes: string | null
          order_number: string
          payment_method: string
          promo_code: string | null
          promo_discount: number
          province: string | null
          seller_id: string
          status: string
          subtotal: number
          total: number
          updated_at: string | null
          ward_number: number | null
        }
        Insert: {
          commission_paid?: boolean
          created_at?: string | null
          customer_address: string
          customer_location: string
          customer_name: string
          customer_phone: string
          district?: string | null
          id?: string
          map_url?: string | null
          municipality?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string
          promo_code?: string | null
          promo_discount?: number
          province?: string | null
          seller_id: string
          status?: string
          subtotal: number
          total: number
          updated_at?: string | null
          ward_number?: number | null
        }
        Update: {
          commission_paid?: boolean
          created_at?: string | null
          customer_address?: string
          customer_location?: string
          customer_name?: string
          customer_phone?: string
          district?: string | null
          id?: string
          map_url?: string | null
          municipality?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string
          promo_code?: string | null
          promo_discount?: number
          province?: string | null
          seller_id?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
          ward_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          phone: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone?: string
          verified?: boolean
        }
        Relationships: []
      }
      products: {
        Row: {
          avg_rating: number
          categories: string[] | null
          category: string
          created_at: string | null
          cut_price: number | null
          description: string | null
          id: string
          image_urls: string[]
          is_active: boolean
          name: string
          real_price: number
          review_count: number
          seller_id: string
          stock: number
          updated_at: string | null
          video_data: string | null
          video_url: string | null
        }
        Insert: {
          avg_rating?: number
          categories?: string[] | null
          category?: string
          created_at?: string | null
          cut_price?: number | null
          description?: string | null
          id?: string
          image_urls?: string[]
          is_active?: boolean
          name: string
          real_price: number
          review_count?: number
          seller_id: string
          stock?: number
          updated_at?: string | null
          video_data?: string | null
          video_url?: string | null
        }
        Update: {
          avg_rating?: number
          categories?: string[] | null
          category?: string
          created_at?: string | null
          cut_price?: number | null
          description?: string | null
          id?: string
          image_urls?: string[]
          is_active?: boolean
          name?: string
          real_price?: number
          review_count?: number
          seller_id?: string
          stock?: number
          updated_at?: string | null
          video_data?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_usage: number | null
          seller_id: string | null
          usage_count: number
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_percent: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_usage?: number | null
          seller_id?: string | null
          usage_count?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_usage?: number | null
          seller_id?: string | null
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          product_id: string
          rating: number
          reviewer_name: string
          seller_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          rating: number
          reviewer_name: string
          seller_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          rating?: number
          reviewer_name?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          business_license_url: string | null
          business_name: string
          citizenship_back_url: string | null
          citizenship_front_url: string | null
          commission_rate: number
          created_at: string | null
          district: string | null
          document_url: string | null
          email: string
          face_image_url: string | null
          full_name: string
          id: string
          instagram: string | null
          map_url: string | null
          municipality: string | null
          pan_vat_url: string | null
          password_hash: string
          phone: string
          province: string | null
          shop_banner_url: string | null
          shop_description: string | null
          shop_location: string
          shop_logo_url: string | null
          shop_registration_url: string | null
          shop_slug: string | null
          status: string
          terms_agreed: boolean
          terms_business_agreed: boolean
          terms_legal_agreed: boolean
          tiktok: string | null
          updated_at: string | null
          ward_number: number | null
        }
        Insert: {
          business_license_url?: string | null
          business_name: string
          citizenship_back_url?: string | null
          citizenship_front_url?: string | null
          commission_rate?: number
          created_at?: string | null
          district?: string | null
          document_url?: string | null
          email: string
          face_image_url?: string | null
          full_name: string
          id?: string
          instagram?: string | null
          map_url?: string | null
          municipality?: string | null
          pan_vat_url?: string | null
          password_hash: string
          phone: string
          province?: string | null
          shop_banner_url?: string | null
          shop_description?: string | null
          shop_location?: string
          shop_logo_url?: string | null
          shop_registration_url?: string | null
          shop_slug?: string | null
          status?: string
          terms_agreed?: boolean
          terms_business_agreed?: boolean
          terms_legal_agreed?: boolean
          tiktok?: string | null
          updated_at?: string | null
          ward_number?: number | null
        }
        Update: {
          business_license_url?: string | null
          business_name?: string
          citizenship_back_url?: string | null
          citizenship_front_url?: string | null
          commission_rate?: number
          created_at?: string | null
          district?: string | null
          document_url?: string | null
          email?: string
          face_image_url?: string | null
          full_name?: string
          id?: string
          instagram?: string | null
          map_url?: string | null
          municipality?: string | null
          pan_vat_url?: string | null
          password_hash?: string
          phone?: string
          province?: string | null
          shop_banner_url?: string | null
          shop_description?: string | null
          shop_location?: string
          shop_logo_url?: string | null
          shop_registration_url?: string | null
          shop_slug?: string | null
          status?: string
          terms_agreed?: boolean
          terms_business_agreed?: boolean
          terms_legal_agreed?: boolean
          tiktok?: string | null
          updated_at?: string | null
          ward_number?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      wearza_make_slug: {
        Args: { _id: string; _name: string }
        Returns: string
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
    Enums: {},
  },
} as const
