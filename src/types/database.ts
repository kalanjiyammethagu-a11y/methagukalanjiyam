export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type CourierProvider = "india_post" | "st_courier" | "professional_courier";

export type PostType = "article" | "feed_update";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          role: "customer" | "admin";
          avatar_url: string | null;
          locale: "ta" | "en";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          role?: "customer" | "admin";
          avatar_url?: string | null;
          locale?: "ta" | "en";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          role?: "customer" | "admin";
          avatar_url?: string | null;
          locale?: "ta" | "en";
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name_ta: string;
          name_en: string;
          slug: string;
          sort_order: number;
          is_active: boolean;
          book_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name_ta: string;
          name_en: string;
          slug: string;
          sort_order?: number;
          is_active?: boolean;
          book_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name_ta?: string;
          name_en?: string;
          slug?: string;
          sort_order?: number;
          is_active?: boolean;
          book_count?: number;
          updated_at?: string;
        };
      };
      books: {
        Row: {
          id: string;
          title: string;
          slug: string;
          author: string;
          description: string | null;
          price: number;
          discount_price: number | null;
          stock: number;
          is_in_stock: boolean;
          category_id: string | null;
          cover_front: string | null;
          cover_back: string | null;
          isbn: string | null;
          pages: number | null;
          publisher: string | null;
          published_year: number | null;
          weight_grams: number | null;
          tags: string[];
          transliteration_keywords: string[];
          search_vector: string | null;
          sort_order: number;
          is_featured: boolean;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          author: string;
          description?: string | null;
          price: number;
          discount_price?: number | null;
          stock?: number;
          category_id?: string | null;
          cover_front?: string | null;
          cover_back?: string | null;
          isbn?: string | null;
          pages?: number | null;
          publisher?: string | null;
          published_year?: number | null;
          weight_grams?: number | null;
          tags?: string[];
          transliteration_keywords?: string[];
          sort_order?: number;
          is_featured?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          author?: string;
          description?: string | null;
          price?: number;
          discount_price?: number | null;
          stock?: number;
          category_id?: string | null;
          cover_front?: string | null;
          cover_back?: string | null;
          isbn?: string | null;
          pages?: number | null;
          publisher?: string | null;
          published_year?: number | null;
          weight_grams?: number | null;
          tags?: string[];
          transliteration_keywords?: string[];
          sort_order?: number;
          is_featured?: boolean;
          view_count?: number;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          full_name: string;
          phone: string;
          house_name: string;
          street: string | null;
          landmark: string | null;
          city: string;
          state: string;
          pincode: string;
          country: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          full_name: string;
          phone: string;
          house_name: string;
          street?: string | null;
          landmark?: string | null;
          city: string;
          state: string;
          pincode: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string;
          full_name?: string;
          phone?: string;
          house_name?: string;
          street?: string | null;
          landmark?: string | null;
          city?: string;
          state?: string;
          pincode?: string;
          country?: string;
          is_default?: boolean;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          is_guest_checkout: boolean;
          guest_phone: string | null;
          guest_email: string | null;
          stock_reserved_until: string | null;
          subtotal: number;
          shipping_fee: number;
          discount: number;
          total_amount: number;
          currency: string;
          status: OrderStatus;
          payment_status: PaymentStatus;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          shipping_address: Json;
          courier: CourierProvider | null;
          tracking_number: string | null;
          tracking_url: string | null;
          dispatched_at: string | null;
          delivered_at: string | null;
          customer_notes: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          is_guest_checkout?: boolean;
          guest_phone?: string | null;
          guest_email?: string | null;
          stock_reserved_until?: string | null;
          subtotal: number;
          shipping_fee?: number;
          discount?: number;
          total_amount: number;
          currency?: string;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          shipping_address: Json;
          courier?: CourierProvider | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          dispatched_at?: string | null;
          delivered_at?: string | null;
          customer_notes?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          courier?: CourierProvider | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          dispatched_at?: string | null;
          delivered_at?: string | null;
          admin_notes?: string | null;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          book_id: string | null;
          title: string;
          price: number;
          quantity: number;
          line_total: number;
          cover_url: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          book_id?: string | null;
          title: string;
          price: number;
          quantity: number;
          line_total: number;
          cover_url?: string | null;
        };
        Update: {
          quantity?: number;
          line_total?: number;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          quantity?: number;
          updated_at?: string;
        };
      };
      blogs: {
        Row: {
          id: string;
          post_type: PostType;
          title: string;
          slug: string;
          excerpt: string | null;
          content: Json;
          cover_image: string;
          gallery_images: string[];
          keywords: string[];
          transliteration_keywords: string[];
          author_id: string | null;
          is_published: boolean;
          published_at: string | null;
          reading_time_mins: number;
          view_count: number;
          meta_title: string | null;
          meta_description: string | null;
          search_vector: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_type?: PostType;
          title: string;
          slug: string;
          excerpt?: string | null;
          content: Json;
          cover_image: string;
          gallery_images?: string[];
          keywords?: string[];
          transliteration_keywords?: string[];
          author_id?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          reading_time_mins?: number;
          view_count?: number;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          post_type?: PostType;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: Json;
          cover_image?: string;
          gallery_images?: string[];
          keywords?: string[];
          transliteration_keywords?: string[];
          is_published?: boolean;
          published_at?: string | null;
          reading_time_mins?: number;
          view_count?: number;
          meta_title?: string | null;
          meta_description?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
