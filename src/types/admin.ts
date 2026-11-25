/* ============================================================
   ADMIN TYPE DEFINITIONS
   All admin-related TypeScript interfaces & enums.
   Backend-ready: These types mirror the expected Supabase schema.
   ============================================================ */

import type { ShipmentEventItem, ShipmentStatus } from "@/lib/tracking";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "whatsapp_cod" | "upi" | "bank_transfer";
export type ArticleStatus = "draft" | "published" | "archived";
export type BookStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerState: string;
  items: { bookId: string; title: string; titleEn: string; quantity: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  trackingNumber?: string;
  courierPartner?: string;
  courierName: string;
  trackingId?: string;
  shipmentStatus: ShipmentStatus;
  trackingUrl?: string;
  shippedAt?: string | null;
  estimatedDeliveryDate?: string | null;
  customerNoteEn?: string | null;
  customerNoteTa?: string | null;
  internalNote?: string | null;
  shipmentEvents?: ShipmentEventItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBook {
  id: string;
  title: string;
  titleEn: string;
  titleTa?: string;
  author: string;
  authorEn: string;
  authorTa?: string;
  price: number;
  discountPrice?: number | null;
  categoryTa: string;
  categoryEn: string;
  categorySlug: string;
  image: string;
  stock: number;
  slug: string;
  year?: string;
  pages?: number;
  publisher?: string;
  publisherEn?: string;
  publisherTa?: string;
  quoteTa?: string;
  quoteEn?: string;
  descriptionTa: string;
  descriptionEn: string;
  status: BookStatus;
  cmsStatus?: "draft" | "published";
  coverImagePath?: string | null;
  coverImageUrl?: string | null;
  coverIsFront?: boolean;
  coverAltEn?: string | null;
  coverAltTa?: string | null;
  galleryImages?: Array<{
    url: string;
    path?: string | null;
    kind?: "inside" | "back_cover" | "spread" | "other";
    alt_en?: string | null;
    alt_ta?: string | null;
  }>;
  whatsappLink?: string | null;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminArticle {
  id: string;
  titleTa: string;
  titleEn: string;
  subtitleTa: string;
  subtitleEn: string;
  excerptTa?: string;
  excerptEn?: string;
  bodyTa?: string;
  bodyEn?: string;
  slug: string;
  categoryTa: string;
  categoryEn: string;
  author: string;
  authorEn: string;
  authorTa?: string;
  seoTitleEn?: string;
  seoTitleTa?: string;
  seoDescriptionEn?: string;
  seoDescriptionTa?: string;
  coverAltEn?: string | null;
  coverAltTa?: string | null;
  status: ArticleStatus;
  readingTimeMinutes: number;
  publishedAt: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSupporter {
  id: string;
  nameTa: string;
  nameEn: string;
  roleTa: string;
  roleEn: string;
  taglineEn?: string;
  taglineTa?: string;
  descriptionEn?: string;
  descriptionTa?: string;
  photoAltEn?: string;
  photoAltTa?: string;
  image: string;
  logo_or_photo_path?: string;
  logo_or_photo_url?: string;
  website_url?: string;
  tagline?: string;
  description?: string;
  sort_order?: number;
  status?: "draft" | "published";
  instagramUrl?: string;
  whatsappUrl?: string;
  isActive: boolean;
  joinedAt: string;
}

export interface DashboardStats {
  totalBooks: number;
  totalOrders: number;
  totalRevenue: number;
  totalArticles: number;
  totalSupporters: number;
  pendingOrders: number;
  lowStockBooks: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  orderGrowth: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  orders: number;
}

export interface TopSellingBook {
  id: string;
  title: string;
  titleEn: string;
  salesCount: number;
  revenue: number;
  image: string;
}

export interface RecentActivity {
  id: string;
  type: "order" | "book_added" | "article_published" | "stock_update";
  descriptionTa: string;
  descriptionEn: string;
  timestamp: string;
}
