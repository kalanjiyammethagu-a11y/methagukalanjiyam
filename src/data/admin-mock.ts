/* ============================================================
   ADMIN MOCK DATA
   Comprehensive mock dataset for all admin panel sections.
   All data is realistic and matches the public-facing site content.
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
} from "@/types/admin";

/* ————————————————————————————————————
   DASHBOARD STATISTICS
   ———————————————————————————————————— */
export const dashboardStats: DashboardStats = {
  totalBooks: 27,
  totalOrders: 342,
  totalRevenue: 48650,
  totalArticles: 14,
  totalSupporters: 9,
  pendingOrders: 7,
  lowStockBooks: 3,
  monthlyRevenue: 8240,
  revenueGrowth: 12.5,
  orderGrowth: 8.3,
};

/* ————————————————————————————————————
   MONTHLY REVENUE CHART DATA
   ———————————————————————————————————— */
export const revenueData: RevenueDataPoint[] = [
  { month: "மே", revenue: 4200, orders: 28 },
  { month: "ஜூன்", revenue: 5100, orders: 34 },
  { month: "ஜூலை", revenue: 7800, orders: 52 },
  { month: "ஆகஸ்ட்", revenue: 6400, orders: 43 },
  { month: "செப்டம்பர்", revenue: 7200, orders: 48 },
  { month: "அக்டோபர்", revenue: 8240, orders: 55 },
];

/* ————————————————————————————————————
   TOP SELLING BOOKS
   ———————————————————————————————————— */
export const topSellingBooks: TopSellingBook[] = [
  { id: "1", title: "கட்டுநாயக்கா தாக்குதல் வெற்றி", titleEn: "Katunayake Air Base Victory", salesCount: 84, revenue: 8400, image: "/images/books/book-20.webp" },
  { id: "2", title: "நெஞ்சுரம்", titleEn: "Nenjuram — Fortitude of Spirit", salesCount: 62, revenue: 9300, image: "/images/books/book-16.webp" },
  { id: "3", title: "திலீபம்", titleEn: "Thileepam — Lt. Col. Thileepan", salesCount: 55, revenue: 4950, image: "/images/blogs/deelipan-memorial.webp" },
  { id: "5", title: "புறநானூற்று வீரன்", titleEn: "Purananooru Veeran", salesCount: 48, revenue: 4800, image: "/images/books/book-07.webp" },
  { id: "4", title: "கண்டேன் கண்டேன்", titleEn: "Kanden Kanden", salesCount: 41, revenue: 5330, image: "/images/blogs/kanden-kanden-banner.webp" },
];

/* ————————————————————————————————————
   RECENT ACTIVITY FEED
   ———————————————————————————————————— */
export const recentActivities: RecentActivity[] = [
  { id: "a1", type: "order", descriptionTa: "ஆர்டர் #MK-0342 — 3 நூல்கள் — சென்னை", descriptionEn: "Order #MK-0342 — 3 books — Chennai", timestamp: "2026-10-29T10:30:00" },
  { id: "a2", type: "stock_update", descriptionTa: "நெஞ்சுரம் — இருப்பு 8 → 5 ஆகக் குறைந்தது", descriptionEn: "Nenjuram — Stock reduced from 8 → 5", timestamp: "2026-10-29T09:15:00" },
  { id: "a3", type: "order", descriptionTa: "ஆர்டர் #MK-0341 — 1 நூல் — மதுரை", descriptionEn: "Order #MK-0341 — 1 book — Madurai", timestamp: "2026-10-28T18:45:00" },
  { id: "a4", type: "article_published", descriptionTa: "புதிய பதிவு: திலீபன் நினைவு நாள் ஆவணம்", descriptionEn: "New article: Thileepan Memorial Day Document", timestamp: "2026-10-28T14:00:00" },
  { id: "a5", type: "book_added", descriptionTa: "புதிய நூல்: 'தமிழீழ மக்கள் வரலாறு' சேர்க்கப்பட்டது", descriptionEn: "New book: 'Tamil Eelam People's History' added", timestamp: "2026-10-27T11:20:00" },
  { id: "a6", type: "order", descriptionTa: "ஆர்டர் #MK-0340 — 2 நூல்கள் — கோயம்புத்தூர்", descriptionEn: "Order #MK-0340 — 2 books — Coimbatore", timestamp: "2026-10-27T09:00:00" },
  { id: "a7", type: "stock_update", descriptionTa: "கட்டுநாயக்கா — 50 பிரதிகள் மறுபதிப்பு சேர்க்கப்பட்டது", descriptionEn: "Katunayake — 50 copies restocked from reprint", timestamp: "2026-10-26T16:30:00" },
  { id: "a8", type: "order", descriptionTa: "ஆர்டர் #MK-0339 — 5 நூல்கள் — திருச்சி", descriptionEn: "Order #MK-0339 — 5 books — Trichy", timestamp: "2026-10-26T10:10:00" },
];

/* ————————————————————————————————————
   ORDERS MOCK DATA
   ———————————————————————————————————— */
export const mockOrders: AdminOrder[] = [
  {
    id: "ord-1",
    orderNumber: "MK-0342",
    customerName: "கார்த்திக் ராஜா",
    customerPhone: "+91 98765 43210",
    customerCity: "சென்னை",
    customerState: "தமிழ்நாடு",
    items: [
      { bookId: "1", title: "கட்டுநாயக்கா தாக்குதல் வெற்றி", titleEn: "Katunayake Air Base Victory", quantity: 1, price: 100 },
      { bookId: "2", title: "நெஞ்சுரம்", titleEn: "Nenjuram", quantity: 1, price: 150 },
      { bookId: "5", title: "புறநானூற்று வீரன்", titleEn: "Purananooru Veeran", quantity: 1, price: 100 },
    ],
    subtotal: 350,
    shipping: 60,
    total: 410,
    status: "confirmed",
    paymentMethod: "whatsapp_cod",
    createdAt: "2026-10-29T10:30:00",
    updatedAt: "2026-10-29T10:45:00",
  },
  {
    id: "ord-2",
    orderNumber: "MK-0341",
    customerName: "செல்வராஜ் முருகன்",
    customerPhone: "+91 87654 32109",
    customerCity: "மதுரை",
    customerState: "தமிழ்நாடு",
    items: [
      { bookId: "3", title: "திசை தவறாக்கணை தளபதிவிநாயகம்", titleEn: "Commander Vinayagam", quantity: 1, price: 85 },
    ],
    subtotal: 85,
    shipping: 60,
    total: 145,
    status: "shipped",
    paymentMethod: "upi",
    trackingNumber: "ST-TN-29834756",
    courierPartner: "ST Courier",
    createdAt: "2026-10-28T18:45:00",
    updatedAt: "2026-10-29T08:00:00",
  },
  {
    id: "ord-3",
    orderNumber: "MK-0340",
    customerName: "பிரியா தேவி",
    customerPhone: "+91 76543 21098",
    customerCity: "கோயம்புத்தூர்",
    customerState: "தமிழ்நாடு",
    items: [
      { bookId: "2", title: "நெஞ்சுரம்", titleEn: "Nenjuram", quantity: 2, price: 150 },
    ],
    subtotal: 300,
    shipping: 60,
    total: 360,
    status: "pending",
    paymentMethod: "whatsapp_cod",
    createdAt: "2026-10-27T09:00:00",
    updatedAt: "2026-10-27T09:00:00",
  },
  {
    id: "ord-4",
    orderNumber: "MK-0339",
    customerName: "ராஜேஷ் குமார்",
    customerPhone: "+91 65432 10987",
    customerCity: "திருச்சி",
    customerState: "தமிழ்நாடு",
    items: [
      { bookId: "1", title: "கட்டுநாயக்கா தாக்குதல் வெற்றி", titleEn: "Katunayake Victory", quantity: 2, price: 100 },
      { bookId: "4", title: "கண்டேன் கண்டேன்", titleEn: "Kanden Kanden", quantity: 2, price: 130 },
      { bookId: "6", title: "திலீபம்", titleEn: "Thileepam", quantity: 1, price: 90 },
    ],
    subtotal: 550,
    shipping: 0,
    total: 550,
    status: "delivered",
    paymentMethod: "bank_transfer",
    trackingNumber: "IP-TN-98234521",
    courierPartner: "India Post",
    createdAt: "2026-10-26T10:10:00",
    updatedAt: "2026-10-28T14:30:00",
  },
  {
    id: "ord-5",
    orderNumber: "MK-0338",
    customerName: "விஜய் சிவகுமார்",
    customerPhone: "+91 54321 09876",
    customerCity: "பெங்களூரு",
    customerState: "கர்நாடகா",
    items: [
      { bookId: "5", title: "புறநானூற்று வீரன்", titleEn: "Purananooru Veeran", quantity: 1, price: 100 },
    ],
    subtotal: 100,
    shipping: 100,
    total: 200,
    status: "shipped",
    paymentMethod: "upi",
    trackingNumber: "IP-KA-77823491",
    courierPartner: "India Post",
    createdAt: "2026-10-25T16:00:00",
    updatedAt: "2026-10-26T11:00:00",
  },
  {
    id: "ord-6",
    orderNumber: "MK-0337",
    customerName: "அன்பரசி நடராஜன்",
    customerPhone: "+91 43210 98765",
    customerCity: "திருநெல்வேலி",
    customerState: "தமிழ்நாடு",
    items: [
      { bookId: "2", title: "நெஞ்சுரம்", titleEn: "Nenjuram", quantity: 1, price: 150 },
      { bookId: "1", title: "கட்டுநாயக்கா தாக்குதல் வெற்றி", titleEn: "Katunayake Victory", quantity: 1, price: 100 },
    ],
    subtotal: 250,
    shipping: 60,
    total: 310,
    status: "delivered",
    paymentMethod: "whatsapp_cod",
    trackingNumber: "ST-TN-11234567",
    courierPartner: "ST Courier",
    createdAt: "2026-10-24T08:30:00",
    updatedAt: "2026-10-27T10:00:00",
  },
  {
    id: "ord-7",
    orderNumber: "MK-0336",
    customerName: "மாலதி சுந்தரம்",
    customerPhone: "+91 32109 87654",
    customerCity: "தூத்துக்குடி",
    customerState: "தமிழ்நாடு",
    items: [
      { bookId: "6", title: "திலீபம்", titleEn: "Thileepam", quantity: 3, price: 90 },
    ],
    subtotal: 270,
    shipping: 60,
    total: 330,
    status: "cancelled",
    paymentMethod: "whatsapp_cod",
    notes: "வாடிக்கையாளர் ரத்து கோரினார் — தொடர்பு எண் மாற்றம்",
    createdAt: "2026-10-23T14:20:00",
    updatedAt: "2026-10-24T09:00:00",
  },
];

/* ————————————————————————————————————
   BOOKS MANAGEMENT MOCK DATA
   ———————————————————————————————————— */
export const mockAdminBooks: AdminBook[] = [
  {
    id: "1", title: "கட்டுநாயக்கா தாக்குதல் வெற்றி", titleEn: "Katunayake Air Base Victory",
    author: "சாந்தி நேசக்கரம்", authorEn: "Saanthi Nesakaram", price: 100, categoryTa: "ஆவணத் தொகுப்பு",
    categoryEn: "Archival Compilation", categorySlug: "archives", image: "/images/books/book-20.webp", stock: 10,
    slug: "katunayake-attack-victory", year: "2001", pages: 220, publisher: "மேதகு களஞ்சியம்",
    publisherEn: "Methagu Kalanjiyam", descriptionTa: "கட்டுநாயக்கா சர்வதேச விமான நிலையத் தாக்குதல் வரலாறு.",
    descriptionEn: "Complete archival record of the Katunayake airbase operation.", status: "in_stock",
    salesCount: 84, createdAt: "2026-05-01", updatedAt: "2026-10-29",
  },
  {
    id: "2", title: "நெஞ்சுரம்", titleEn: "Nenjuram — Fortitude of Spirit",
    author: "துளசிச்செல்வன்", authorEn: "Thulasichelvan", price: 150, categoryTa: "வரலாறு",
    categoryEn: "History", categorySlug: "history", image: "/images/books/book-16.webp", stock: 5,
    slug: "nenjuram", year: "2003", pages: 280, publisher: "மேதகு களஞ்சியம்",
    publisherEn: "Methagu Kalanjiyam", descriptionTa: "போராளிகளின் நெஞ்சுரம் பற்றிய நூல்.",
    descriptionEn: "Authentic chronicles of fighters' unwavering fortitude.", status: "in_stock",
    salesCount: 62, createdAt: "2026-05-01", updatedAt: "2026-10-28",
  },
  {
    id: "3", title: "திசை தவறாக்கணை தளபதிவிநாயகம்", titleEn: "Commander Vinayagam — The Unswerving Arrow",
    author: "சாந்தி நேசக்கரம்", authorEn: "Saanthi Nesakaram", price: 85, categoryTa: "ஆவண நூல்",
    categoryEn: "Documentary", categorySlug: "archives", image: "/images/blogs/thalapathi-vinayagam-banner.webp", stock: 15,
    slug: "unswerving-arrow-commander-vinayagam", year: "2004", pages: 196, publisher: "மேதகு களஞ்சியம்",
    publisherEn: "Methagu Kalanjiyam", descriptionTa: "தளபதி விநாயகம் அவர்களின் போர்க்கள வரலாறு.",
    descriptionEn: "Military biography of Commander Vinayagam.", status: "in_stock",
    salesCount: 35, createdAt: "2026-05-15", updatedAt: "2026-10-20",
  },
  {
    id: "4", title: "கண்டேன் கண்டேன்", titleEn: "Kanden Kanden — I Witnessed, I Witnessed",
    author: "சாந்தி நேசக்கரம்", authorEn: "Saanthi Nesakaram", price: 130, categoryTa: "போர்முனை நினைவுகள்",
    categoryEn: "Battlefield Memoirs", categorySlug: "memoirs", image: "/images/blogs/kanden-kanden-banner.webp", stock: 3,
    slug: "kanden-kanden", year: "2005", pages: 310, publisher: "மேதகு களஞ்சியம்",
    publisherEn: "Methagu Kalanjiyam", descriptionTa: "நேரில் கண்ட போர்க்களக் காட்சிகள்.",
    descriptionEn: "Firsthand eyewitness accounts from battlefield experiences.", status: "low_stock",
    salesCount: 41, createdAt: "2026-06-01", updatedAt: "2026-10-28",
  },
  {
    id: "5", title: "புறநானூற்று வீரன்", titleEn: "Purananooru Veeran",
    author: "திருமுருகன்காளிலிங்கம்", authorEn: "Thirumurugan Kaleelingam", price: 100, categoryTa: "வரலாற்று ஆய்வு",
    categoryEn: "Historical Research", categorySlug: "history", image: "/images/books/book-07.webp", stock: 12,
    slug: "purananooru-veeran", year: "2006", pages: 248, publisher: "மேதகு களஞ்சியம்",
    publisherEn: "Methagu Kalanjiyam", descriptionTa: "புறநானூற்றுக் கால வீரர்களின் ஒப்பாய்வு.",
    descriptionEn: "Comparative historical analysis of warriors in Purananooru era.", status: "in_stock",
    salesCount: 48, createdAt: "2026-06-10", updatedAt: "2026-10-25",
  },
  {
    id: "6", title: "திலீபம்", titleEn: "Thileepam — Lt. Col. Thileepan",
    author: "சாந்தி நேசக்கரம்", authorEn: "Saanthi Nesakaram", price: 90, categoryTa: "நினைவேந்தல்",
    categoryEn: "Memorial", categorySlug: "biographies", image: "/images/blogs/deelipan-memorial.webp", stock: 0,
    slug: "thileepam", year: "2007", pages: 180, publisher: "மேதகு களஞ்சியம்",
    publisherEn: "Methagu Kalanjiyam", descriptionTa: "லெப். கேணல் திலீபன் அவர்களின் வரலாறு.",
    descriptionEn: "Biography and fasting struggle of Lt. Col. Thileepan.", status: "out_of_stock",
    salesCount: 55, createdAt: "2026-05-20", updatedAt: "2026-10-15",
  },
];

/* ————————————————————————————————————
   ARTICLES MANAGEMENT MOCK DATA
   ———————————————————————————————————— */
export const mockArticles: AdminArticle[] = [
  {
    id: "art-1", titleTa: "மாவீரர் நாள் 2026 — நினைவேந்தல் சிறப்புப் பதிவு", titleEn: "Maaveerar Naal 2026 — Special Memorial Feature",
    subtitleTa: "ஒவ்வோர் ஆண்டும் நவம்பர் 27 அன்று நினைவுகூரப்படும் மாவீரர்களின் தியாகங்கள்.", subtitleEn: "Annual November 27 commemoration honouring fallen heroes.",
    slug: "maaveerar-naal-2026", categoryTa: "நினைவேந்தல்", categoryEn: "Memorial",
    author: "தீபக் ஹார்வின்", authorEn: "Deepak Harvin", status: "published",
    readingTimeMinutes: 8, publishedAt: "2026-10-25", viewCount: 1240,
    createdAt: "2026-10-20", updatedAt: "2026-10-25",
  },
  {
    id: "art-2", titleTa: "கட்டுநாயக்கா — 25 ஆண்டு வரலாற்றுப் பின்னோக்கி", titleEn: "Katunayake — 25-Year Historical Retrospective",
    subtitleTa: "2001 ஜூலை 24 நிகழ்வின் முழுமையான வரலாற்று ஆய்வு.", subtitleEn: "Comprehensive historical analysis of the July 24, 2001 operation.",
    slug: "katunayake-25-year-retrospective", categoryTa: "வரலாற்று ஆய்வு", categoryEn: "Historical Analysis",
    author: "சூரியபிரகாஷ்", authorEn: "Suriyaprakash", status: "published",
    readingTimeMinutes: 12, publishedAt: "2026-10-18", viewCount: 890,
    createdAt: "2026-10-10", updatedAt: "2026-10-18",
  },
  {
    id: "art-3", titleTa: "திலீபன் நினைவு நாள் ஆவணம்", titleEn: "Thileepan Memorial Day Document",
    subtitleTa: "செப்டம்பர் 26 — உண்ணாவிரத வீரர் லெப். கேணல் திலீபன் நினைவு.", subtitleEn: "September 26 — Remembering Lt. Col. Thileepan's hunger strike.",
    slug: "thileepan-memorial-day", categoryTa: "நினைவேந்தல்", categoryEn: "Memorial",
    author: "சுபி மதன்", authorEn: "Subi Madhan", status: "published",
    readingTimeMinutes: 6, publishedAt: "2026-09-26", viewCount: 650,
    createdAt: "2026-09-20", updatedAt: "2026-09-26",
  },
  {
    id: "art-4", titleTa: "புதிய நூல்கள் — அக்டோபர் 2026 வெளியீடு", titleEn: "New Arrivals — October 2026 Release",
    subtitleTa: "இந்த மாதம் களஞ்சியத்தில் சேர்க்கப்பட்ட புதிய அரிய நூல்கள் பற்றிய அறிவிப்பு.", subtitleEn: "Announcement of newly catalogued rare books this month.",
    slug: "new-arrivals-october-2026", categoryTa: "அறிவிப்பு", categoryEn: "Announcement",
    author: "தீபக் ஹார்வின்", authorEn: "Deepak Harvin", status: "draft",
    readingTimeMinutes: 4, publishedAt: "", viewCount: 0,
    createdAt: "2026-10-28", updatedAt: "2026-10-28",
  },
  {
    id: "art-5", titleTa: "நூல் பாதுகாப்பு — ஒரு வழிகாட்டி", titleEn: "Book Preservation — A Guide",
    subtitleTa: "வரலாற்று நூல்களை நீண்ட காலம் பாதுகாப்பாக வைக்கும் முறைகள்.", subtitleEn: "Methods for long-term preservation of historical books.",
    slug: "book-preservation-guide", categoryTa: "வழிகாட்டி", categoryEn: "Guide",
    author: "பச்ச முத்து", authorEn: "Pacha Muthu", status: "archived",
    readingTimeMinutes: 10, publishedAt: "2026-08-15", viewCount: 320,
    createdAt: "2026-08-10", updatedAt: "2026-08-15",
  },
];

/* ————————————————————————————————————
   SUPPORTERS MANAGEMENT MOCK DATA
   ———————————————————————————————————— */
export const mockSupporters: AdminSupporter[] = [
  { id: "1", nameTa: "தீபக் ஹார்வின்", nameEn: "Deepak Harvin", roleTa: "நிறுவனத்தின் முதல்வர் மற்றும் நிறுவனர்", roleEn: "Founder & Principal Director", image: "/images/supporters/harvin.webp", instagramUrl: "https://www.instagram.com/harvin_72", whatsappUrl: "https://wa.me/918248654946", isActive: true, joinedAt: "2024-01-01" },
  { id: "2", nameTa: "சுபி மதன்", nameEn: "Subi Madhan", roleTa: "நிறுவனத்தின் முதல்வர் மற்றும் நிறுவனர்", roleEn: "Founder & Principal Director", image: "/images/supporters/subi.webp", instagramUrl: "https://www.instagram.com/thilo.subi", whatsappUrl: "https://wa.me/916374849095", isActive: true, joinedAt: "2024-01-01" },
  { id: "3", nameTa: "பச்ச முத்து", nameEn: "Pacha Muthu", roleTa: "திட்ட நெறியாளர்", roleEn: "Project Coordinator", image: "/images/supporters/pachamuthu.webp", instagramUrl: "https://www.instagram.com/pachamuthu_2004", isActive: true, joinedAt: "2024-03-15" },
  { id: "4", nameTa: "ரஞ்சித்", nameEn: "Ranjith", roleTa: "களஞ்சிய மேலாண்மையாளர்", roleEn: "Archives Manager", image: "/images/supporters/ranjith.webp", instagramUrl: "https://www.instagram.com/ranjith_tamileelam", isActive: true, joinedAt: "2024-04-01" },
  { id: "5", nameTa: "முனிஸ்வரன்", nameEn: "Muniswaran", roleTa: "படவரி நிர்வாகி", roleEn: "Media Administrator", image: "/images/supporters/muniswaran.webp", instagramUrl: "https://www.instagram.com/_pandimuni", isActive: true, joinedAt: "2024-05-01" },
  { id: "6", nameTa: "அஜய்", nameEn: "Ajay", roleTa: "ஆவணப் பதிவாளர்", roleEn: "Documenter & Cinematographer", image: "/images/supporters/ajay.webp", instagramUrl: "https://www.instagram.com/d_ajay_offizal", whatsappUrl: "https://wa.me/919884325269", isActive: true, joinedAt: "2024-06-01" },
  { id: "7", nameTa: "சூரியபிரகாஷ்", nameEn: "Suriyaprakash", roleTa: "தொழில்நுட்ப உருவாக்குநர்", roleEn: "Platform Architect", image: "/images/supporters/suriya.webp", instagramUrl: "https://www.instagram.com/soora_byte", whatsappUrl: "https://wa.me/916382630040", isActive: true, joinedAt: "2024-07-01" },
  { id: "8", nameTa: "திலீபன்", nameEn: "Dhilipan", roleTa: "தரவு ஒருங்கிணைப்பாளர்", roleEn: "Data Coordinator", image: "/images/supporters/deelip.webp", instagramUrl: "https://www.instagram.com/dhilip_offizial", isActive: true, joinedAt: "2024-08-01" },
  { id: "9", nameTa: "செல்வா", nameEn: "Selva", roleTa: "சமூக நிர்வாகி", roleEn: "Community Administrator", image: "/images/supporters/selva.webp", instagramUrl: "https://www.instagram.com/tamil_warriors2.0", isActive: false, joinedAt: "2024-09-01" },
];
