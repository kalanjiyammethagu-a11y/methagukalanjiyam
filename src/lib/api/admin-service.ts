/* ============================================================
   API SERVICE STUBS — PREPARED BACKEND (NOT CONNECTED)
   
   These functions simulate backend API calls using mock data.
   When the real Supabase backend is connected, replace the 
   mock imports with actual Supabase client queries.
   
   Each function signature matches the intended REST/RPC pattern
   so the frontend code requires zero refactoring on connection.
   ============================================================ */

import type {
  AdminOrder,
  AdminBook,
  AdminArticle,
  AdminSupporter,
  DashboardStats,
  RevenueDataPoint,
  TopSellingBook,
  RecentActivity,
  OrderStatus,
  ArticleStatus,
} from "@/types/admin";

import {
  dashboardStats,
  revenueData,
  topSellingBooks,
  recentActivities,
  mockOrders,
  mockAdminBooks,
  mockArticles,
  mockSupporters,
} from "@/data/admin-mock";

// Simulate network latency
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ————————————————————————————————————
   DASHBOARD
   ———————————————————————————————————— */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  await delay(200);
  return dashboardStats;
}

export async function fetchRevenueData(): Promise<RevenueDataPoint[]> {
  await delay(150);
  return revenueData;
}

export async function fetchTopSellingBooks(): Promise<TopSellingBook[]> {
  await delay(150);
  return topSellingBooks;
}

export async function fetchRecentActivities(): Promise<RecentActivity[]> {
  await delay(100);
  return recentActivities;
}

/* ————————————————————————————————————
   ORDERS
   ———————————————————————————————————— */
export async function fetchOrders(filters?: {
  status?: OrderStatus;
  search?: string;
}): Promise<AdminOrder[]> {
  await delay(250);
  let list = [...mockOrders];
  if (filters?.status) {
    list = list.filter((o) => o.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    );
  }
  return list;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string
): Promise<AdminOrder> {
  await delay(300);
  const order = mockOrders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found");
  return { ...order, status, trackingNumber: trackingNumber || order.trackingNumber, updatedAt: new Date().toISOString() };
}

/* ————————————————————————————————————
   BOOKS
   ———————————————————————————————————— */
export async function fetchAdminBooks(filters?: {
  status?: string;
  search?: string;
}): Promise<AdminBook[]> {
  await delay(200);
  let list = [...mockAdminBooks];
  if (filters?.status) {
    list = list.filter((b) => b.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.titleEn.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function createBook(book: Omit<AdminBook, "id" | "createdAt" | "updatedAt" | "salesCount">): Promise<AdminBook> {
  await delay(400);
  return {
    ...book,
    id: `book-${Date.now()}`,
    salesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateBook(bookId: string, updates: Partial<AdminBook>): Promise<AdminBook> {
  await delay(300);
  const book = mockAdminBooks.find((b) => b.id === bookId);
  if (!book) throw new Error("Book not found");
  return { ...book, ...updates, updatedAt: new Date().toISOString() };
}

export async function deleteBook(bookId: string): Promise<void> {
  await delay(200);
  const exists = mockAdminBooks.some((b) => b.id === bookId);
  if (!exists) throw new Error("Book not found");
}

/* ————————————————————————————————————
   ARTICLES
   ———————————————————————————————————— */
export async function fetchAdminArticles(filters?: {
  status?: ArticleStatus;
  search?: string;
}): Promise<AdminArticle[]> {
  await delay(200);
  let list = [...mockArticles];
  if (filters?.status) {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (a) =>
        a.titleTa.toLowerCase().includes(q) ||
        a.titleEn.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function updateArticleStatus(
  articleId: string,
  status: ArticleStatus
): Promise<AdminArticle> {
  await delay(300);
  const article = mockArticles.find((a) => a.id === articleId);
  if (!article) throw new Error("Article not found");
  return { ...article, status, updatedAt: new Date().toISOString() };
}

/* ————————————————————————————————————
   SUPPORTERS
   ———————————————————————————————————— */
export async function fetchAdminSupporters(): Promise<AdminSupporter[]> {
  await delay(150);
  return [...mockSupporters];
}

export async function updateSupporter(
  supporterId: string,
  updates: Partial<AdminSupporter>
): Promise<AdminSupporter> {
  await delay(300);
  const supporter = mockSupporters.find((s) => s.id === supporterId);
  if (!supporter) throw new Error("Supporter not found");
  return { ...supporter, ...updates };
}
