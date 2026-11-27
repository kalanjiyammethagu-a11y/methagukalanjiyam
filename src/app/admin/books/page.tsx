"use client";

import * as React from "react";
import Image from "next/image";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  Upload,
  ImageIcon,
  Loader2,
  Globe,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Star,
  Tag,
} from "lucide-react";
import type { AdminBook, BookStatus } from "@/types/admin";

interface AdminCategoryItem {
  id: string;
  name_ta: string;
  name_en: string;
  description_ta?: string | null;
  description_en?: string | null;
  slug: string;
  sort_order: number;
  is_active: boolean;
  book_count?: number;
}
import { formatINR } from "@/lib/utils";
import {
  BOOK_PLACEHOLDER_IMAGE,
  isFlaggedBookCoverSlug,
  normalizeGalleryImages,
  resolveBookFrontCover,
  type BookGalleryImage,
} from "@/lib/book-images";
import {
  buildBilingualSearchText,
  generateAsciiSlug,
  getLanguageCompleteness,
  isAsciiSlug,
  REQUIRE_BOTH_LANGUAGES_TO_PUBLISH,
  resolveBilingualPair,
  type AppLocale,
} from "@/lib/i18n";
import { BilingualListBadge, BilingualTabs } from "@/components/admin/BilingualTabs";

const BOOK_REQUIRED_BILINGUAL_FIELDS = ["title", "author"];

function mapSupabaseBook(b: any): AdminBook {
  const cat = b.categories || {};
  const cover = resolveBookFrontCover(b);
  const galleryImages = normalizeGalleryImages(b.gallery_images, b.cover_back, cover.url);

  const titlePair = resolveBilingualPair({ en: b.title_en, ta: b.title_ta, legacy: b.title });
  const authorPair = resolveBilingualPair({ en: b.author_en, ta: b.author_ta, legacy: b.author });
  const descPair = resolveBilingualPair({ en: b.description_en, ta: b.description_ta, legacy: b.description });
  const pubPair = resolveBilingualPair({ en: b.publisher_en, ta: b.publisher_ta, legacy: b.publisher });

  return {
    id: b.id,
    title: titlePair.ta || titlePair.en || b.title,
    titleTa: titlePair.ta || "",
    titleEn: titlePair.en || (b.slug ? b.slug.replace(/-/g, " ") : ""),
    author: authorPair.ta || authorPair.en || b.author,
    authorTa: authorPair.ta || "",
    authorEn: authorPair.en || "",
    price: Number(b.price || 0),
    discountPrice: b.discount_price ? Number(b.discount_price) : null,
    categoryTa: cat.name_ta || cat.name_en || "History",
    categoryEn: cat.name_en || "History",
    categorySlug: cat.slug || "history",
    categoryId: b.category_id || cat.id || null,
    isFeatured: Boolean(b.is_featured),
    image: cover.url,
    coverImagePath: cover.path,
    coverImageUrl: cover.url,
    coverIsFront: cover.isFront,
    coverAltEn: b.cover_alt_en || null,
    coverAltTa: b.cover_alt_ta || null,
    galleryImages,
    whatsappLink: b.whatsapp_link || null,
    cmsStatus: (b.status === "draft" ? "draft" : "published") as "draft" | "published",
    stock: Number(b.stock || 0),
    slug: b.slug,
    pages: b.pages,
    publisher: pubPair.ta || pubPair.en || b.publisher || "",
    publisherEn: pubPair.en || "",
    publisherTa: pubPair.ta || "",
    quoteEn: b.quote_en || "",
    quoteTa: b.quote_ta || "",
    descriptionTa: descPair.ta || "",
    descriptionEn: descPair.en || "",
    status: (b.stock <= 0 ? "out_of_stock" : b.stock <= 5 ? "low_stock" : "in_stock") as BookStatus,
    salesCount: b.view_count || 0,
    createdAt: b.created_at || new Date().toISOString(),
    updatedAt: b.updated_at || new Date().toISOString(),
  };
}

const CATEGORY_OPTIONS = [
  { slug: "history", label: "History & Archives" },
  { slug: "memoirs", label: "Memoirs" },
  { slug: "biographies", label: "Biographies" },
  { slug: "archives", label: "Archival Compilations" },
];

function statusBadge(status: string) {
  if (status === "in_stock")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
        In Stock
      </span>
    );
  if (status === "low_stock")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
        Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-300 text-[11px] font-bold">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
      Out of Stock
    </span>
  );
}

function cmsStatusBadge(status?: "draft" | "published") {
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300 text-[10px] font-bold uppercase tracking-wider">
        <EyeOff className="h-3 w-3 text-gray-500" />
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#0A6847] border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
      <Eye className="h-3 w-3 text-[#0A6847]" />
      Live
    </span>
  );
}

export default function AdminBooksPage() {
  const [books, setBooks] = React.useState<AdminBook[]>([]);
  const [usingFallback, setUsingFallback] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [selectedCmsStatus, setSelectedCmsStatus] = React.useState("all");
  const [selectedCoverFilter, setSelectedCoverFilter] = React.useState<"all" | "best_sellers" | "needs_cover" | "missing_tamil">("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [categoriesList, setCategoriesList] = React.useState<AdminCategoryItem[]>([]);
  const [togglingFeaturedId, setTogglingFeaturedId] = React.useState<string | null>(null);

  // Category Management Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [editingCat, setEditingCat] = React.useState<AdminCategoryItem | null>(null);
  const [catSaving, setCatSaving] = React.useState(false);
  const [catError, setCatError] = React.useState<string | null>(null);
  const [catForm, setCatForm] = React.useState({
    name_en: "",
    name_ta: "",
    slug: "",
    description_en: "",
    description_ta: "",
    sort_order: 10,
  });

  // Inline Quick-Category Creator inside Book Modal
  const [showQuickCat, setShowQuickCat] = React.useState(false);
  const [quickCatEn, setQuickCatEn] = React.useState("");
  const [quickCatTa, setQuickCatTa] = React.useState("");
  const [quickCatSlug, setQuickCatSlug] = React.useState("");
  const [creatingQuickCat, setCreatingQuickCat] = React.useState(false);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState<AdminBook | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [updatingStockId, setUpdatingStockId] = React.useState<string | null>(null);
  const [activeLangTab, setActiveLangTab] = React.useState<AppLocale>("en");
  const initialLangSnapshotRef = React.useRef({
    en: { titleEn: "", authorEn: "", descriptionEn: "", publisherEn: "", quoteEn: "", coverAltEn: "" },
    ta: { titleTa: "", authorTa: "", descriptionTa: "", publisherTa: "", quoteTa: "", coverAltTa: "" },
  });

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = React.useState<AdminBook | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Image upload state
  const [imagePreview, setImagePreview] = React.useState<string>(BOOK_PLACEHOLDER_IMAGE);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [uploadingGallery, setUploadingGallery] = React.useState(false);
  const [galleryUrlInput, setGalleryUrlInput] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const galleryFileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = React.useState({
    slug: "",
    titleEn: "",
    titleTa: "",
    authorEn: "",
    authorTa: "",
    price: 150,
    stock: 20,
    categorySlug: "history",
    categoryTa: "History & Archives",
    categoryEn: "History & Archives",
    categoryId: "",
    isFeatured: false,
    image: "",
    cover_image_path: "",
    coverAltEn: "",
    coverAltTa: "",
    galleryImages: [] as BookGalleryImage[],
    descriptionEn: "",
    descriptionTa: "",
    publisherEn: "Methagu Kalanjiyam",
    publisherTa: "மேதகு களஞ்சியம்",
    quoteEn: "",
    quoteTa: "",
    whatsapp_link: "",
    cmsStatus: "published" as "published" | "draft",
  });

  const fetchBooks = React.useCallback(async () => {
    setLoading(true);
    try {
      const [res, catRes] = await Promise.all([
        fetch("/api/admin/books"),
        fetch("/api/admin/categories"),
      ]);
      if (catRes.ok) {
        const catData = await catRes.json().catch(() => ({}));
        if (Array.isArray(catData.categories)) {
          setCategoriesList(catData.categories);
        }
      }
      if (res.ok) {
        const data = await res.json();
        if (data.books && Array.isArray(data.books)) {
          setBooks(data.books.map(mapSupabaseBook));
          setUsingFallback(false);
          setLoading(false);
          return;
        }
      }
    } catch { }
    setBooks([]);
    setUsingFallback(true);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchBooks().finally(() => setLoading(false));
  }, [fetchBooks]);

  // Lock scroll when modal is open
  React.useEffect(() => {
    if (!isModalOpen && !deleteTarget && !isCategoryModalOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setDeleteTarget(null);
        setIsCategoryModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener("keydown", onKey);
    };
  }, [isModalOpen, deleteTarget, isCategoryModalOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const resetForm = () => {
    const firstActiveCat = categoriesList.find((c) => c.is_active) || categoriesList[0];
    const empty = {
      slug: "",
      titleEn: "",
      titleTa: "",
      authorEn: "",
      authorTa: "",
      price: 150,
      stock: 20,
      categorySlug: firstActiveCat?.slug || "history",
      categoryTa: firstActiveCat?.name_ta || "History & Archives",
      categoryEn: firstActiveCat?.name_en || "History & Archives",
      categoryId: firstActiveCat?.id || "",
      isFeatured: false,
      image: "",
      cover_image_path: "",
      coverAltEn: "",
      coverAltTa: "",
      galleryImages: [] as BookGalleryImage[],
      descriptionEn: "",
      descriptionTa: "",
      publisherEn: "Methagu Kalanjiyam",
      publisherTa: "மேதகு களஞ்சியம்",
      quoteEn: "",
      quoteTa: "",
      whatsapp_link: "",
      cmsStatus: "published" as "published" | "draft",
    };
    setFormData(empty);
    setShowQuickCat(false);
    setQuickCatEn("");
    setQuickCatTa("");
    setQuickCatSlug("");
    initialLangSnapshotRef.current = {
      en: {
        titleEn: empty.titleEn,
        authorEn: empty.authorEn,
        descriptionEn: empty.descriptionEn,
        publisherEn: empty.publisherEn,
        quoteEn: empty.quoteEn,
        coverAltEn: empty.coverAltEn,
      },
      ta: {
        titleTa: empty.titleTa,
        authorTa: empty.authorTa,
        descriptionTa: empty.descriptionTa,
        publisherTa: empty.publisherTa,
        quoteTa: empty.quoteTa,
        coverAltTa: empty.coverAltTa,
      },
    };
    setActiveLangTab("en");
    setGalleryUrlInput("");
    setImagePreview(BOOK_PLACEHOLDER_IMAGE);
  };

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setFormError(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: AdminBook) => {
    setEditingBook(book);
    setFormError(null);
    const hasRealCover = Boolean(book.image && book.image !== BOOK_PLACEHOLDER_IMAGE);
    const titleEnVal = book.titleEn || "";
    const titleTaVal = book.titleTa || (book.title !== book.titleEn ? book.title : "");
    const authorEnVal = book.authorEn || "";
    const authorTaVal = book.authorTa || (book.author !== book.authorEn ? book.author : "");

    const matchedCat =
      categoriesList.find((c) => c.id === book.categoryId) ||
      categoriesList.find((c) => c.slug === book.categorySlug);

    const populated = {
      slug: book.slug || "",
      titleEn: titleEnVal,
      titleTa: titleTaVal,
      authorEn: authorEnVal,
      authorTa: authorTaVal,
      price: book.price,
      stock: book.stock,
      categorySlug: matchedCat?.slug || book.categorySlug || "history",
      categoryTa: matchedCat?.name_ta || book.categoryTa || "History & Archives",
      categoryEn: matchedCat?.name_en || book.categoryEn || "History & Archives",
      categoryId: matchedCat?.id || book.categoryId || "",
      isFeatured: Boolean(book.isFeatured),
      image: hasRealCover ? book.image : "",
      cover_image_path: book.coverImagePath || "",
      coverAltEn: book.coverAltEn || "",
      coverAltTa: book.coverAltTa || "",
      galleryImages: normalizeGalleryImages(book.galleryImages, null, book.image),
      descriptionEn: book.descriptionEn || "",
      descriptionTa: book.descriptionTa || "",
      publisherEn: book.publisherEn || "Methagu Kalanjiyam",
      publisherTa: book.publisherTa || book.publisher || "மேதகு களஞ்சியம்",
      quoteEn: book.quoteEn || "",
      quoteTa: book.quoteTa || "",
      whatsapp_link: book.whatsappLink || "",
      cmsStatus: book.cmsStatus || ("published" as "published" | "draft"),
    };
    setFormData(populated);
    initialLangSnapshotRef.current = {
      en: {
        titleEn: populated.titleEn,
        authorEn: populated.authorEn,
        descriptionEn: populated.descriptionEn,
        publisherEn: populated.publisherEn,
        quoteEn: populated.quoteEn,
        coverAltEn: populated.coverAltEn,
      },
      ta: {
        titleTa: populated.titleTa,
        authorTa: populated.authorTa,
        descriptionTa: populated.descriptionTa,
        publisherTa: populated.publisherTa,
        quoteTa: populated.quoteTa,
        coverAltTa: populated.coverAltTa,
      },
    };
    setActiveLangTab("en");
    setShowQuickCat(false);
    setQuickCatEn("");
    setQuickCatTa("");
    setQuickCatSlug("");
    setGalleryUrlInput("");
    setImagePreview(book.image || BOOK_PLACEHOLDER_IMAGE);
    setIsModalOpen(true);
  };

  const uploadBookAsset = async (file: File): Promise<{ url: string; path: string } | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "books");

    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Image upload failed.");
      return null;
    }
    return {
      url: data.url || data.publicUrl || data.path,
      path: data.path,
    };
  };

  // Front cover (outside) upload handler to Supabase Storage bucket `books`
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);

    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    try {
      const uploaded = await uploadBookAsset(file);
      if (uploaded) {
        setFormData((prev) => ({
          ...prev,
          image: uploaded.url,
          cover_image_path: uploaded.path,
        }));
        setImagePreview(uploaded.url);
        showToast("Front cover (outside) uploaded to Supabase Storage.");
      } else {
        setImagePreview(formData.image || BOOK_PLACEHOLDER_IMAGE);
      }
    } catch {
      showToast("Network error uploading front cover.");
      setImagePreview(formData.image || BOOK_PLACEHOLDER_IMAGE);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    let uploadedCount = 0;

    try {
      const newItems: BookGalleryImage[] = [];
      for (const file of Array.from(files)) {
        const uploaded = await uploadBookAsset(file);
        if (uploaded) {
          newItems.push({
            url: uploaded.url,
            path: uploaded.path,
            kind: "inside",
            alt_en: "",
            alt_ta: "",
          });
          uploadedCount++;
        }
      }
      if (newItems.length > 0) {
        setFormData((prev) => {
          const existingUrls = new Set(prev.galleryImages.map((g) => g.url));
          if (prev.image) existingUrls.add(prev.image);
          const merged = [...prev.galleryImages];
          for (const item of newItems) {
            if (!existingUrls.has(item.url)) {
              existingUrls.add(item.url);
              merged.push(item);
            }
          }
          return { ...prev, galleryImages: merged };
        });
        showToast(`Uploaded ${uploadedCount} inside page image(s).`);
      }
    } catch {
      showToast("Network error uploading gallery image(s).");
    } finally {
      setUploadingGallery(false);
    }
  };

  const moveGalleryItem = (index: number, delta: -1 | 1) => {
    setFormData((prev) => {
      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= prev.galleryImages.length) return prev;
      const copy = [...prev.galleryImages];
      const [moved] = copy.splice(index, 1);
      if (moved) {
        copy.splice(nextIndex, 0, moved);
      }
      return { ...prev, galleryImages: copy };
    });
  };

  const removeGalleryItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, idx) => idx !== index),
    }));
  };

  const addGalleryByUrl = () => {
    const cleanUrl = galleryUrlInput.trim();
    if (!cleanUrl) return;
    if (cleanUrl === formData.image.trim()) {
      showToast("Front cover is already set as the main outside cover.");
      return;
    }
    setFormData((prev) => {
      if (prev.galleryImages.some((g) => g.url === cleanUrl)) return prev;
      return {
        ...prev,
        galleryImages: [
          ...prev.galleryImages,
          { url: cleanUrl, path: null, kind: "inside", alt_en: "", alt_ta: "" },
        ],
      };
    });
    setGalleryUrlInput("");
  };

  const formCompleteness = React.useMemo(
    () => getLanguageCompleteness(formData, BOOK_REQUIRED_BILINGUAL_FIELDS),
    [formData]
  );

  const isActiveTabDirty = React.useMemo(() => {
    const snap = initialLangSnapshotRef.current;
    if (activeLangTab === "en") {
      return (
        formData.titleEn !== snap.en.titleEn ||
        formData.authorEn !== snap.en.authorEn ||
        formData.descriptionEn !== snap.en.descriptionEn ||
        formData.publisherEn !== snap.en.publisherEn ||
        formData.quoteEn !== snap.en.quoteEn ||
        formData.coverAltEn !== snap.en.coverAltEn
      );
    }
    return (
      formData.titleTa !== snap.ta.titleTa ||
      formData.authorTa !== snap.ta.authorTa ||
      formData.descriptionTa !== snap.ta.descriptionTa ||
      formData.publisherTa !== snap.ta.publisherTa ||
      formData.quoteTa !== snap.ta.quoteTa ||
      formData.coverAltTa !== snap.ta.coverAltTa
    );
  }, [activeLangTab, formData]);

  const handleQuickStockAdjust = async (book: AdminBook, delta: number) => {
    if (usingFallback) {
      showToast("Cannot change stock on fallback mock data — ensure Supabase books table is loaded.");
      return;
    }
    const nextStock = Math.max(0, Number(book.stock || 0) + delta);
    setUpdatingStockId(book.id);
    try {
      const res = await fetch("/api/admin/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: book.id, stock: nextStock }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Failed to update stock quantity.");
        return;
      }
      const updated = data.book ? mapSupabaseBook(data.book) : null;
      setBooks((prev) =>
        prev.map((b) =>
          b.id === book.id
            ? updated || {
              ...b,
              stock: nextStock,
              status: (nextStock <= 0 ? "out_of_stock" : nextStock <= 5 ? "low_stock" : "in_stock") as BookStatus,
              updatedAt: new Date().toISOString(),
            }
            : b
        )
      );
      showToast(`Stock updated to ${nextStock} copies.`);
    } catch {
      showToast("Network error updating stock quantity.");
    } finally {
      setUpdatingStockId(null);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const hasTitle = Boolean(formData.titleEn.trim() || (editingBook && formData.titleTa.trim()));
    const hasAuthor = Boolean(formData.authorEn.trim() || (editingBook && formData.authorTa.trim()));

    if (!editingBook && (!formData.titleEn.trim() || !formData.authorEn.trim())) {
      const msg = "English title and English author are required.";
      setActiveLangTab("en");
      setFormError(msg);
      showToast(msg);
      return;
    }
    if (editingBook && (!hasTitle || !hasAuthor)) {
      const msg = "Book title and author cannot be empty.";
      setActiveLangTab("en");
      setFormError(msg);
      showToast(msg);
      return;
    }
    if (
      REQUIRE_BOTH_LANGUAGES_TO_PUBLISH &&
      formData.cmsStatus === "published" &&
      (!formData.titleTa.trim() || !formData.authorTa.trim())
    ) {
      const msg = "Tamil title and Tamil author are required before publishing.";
      setActiveLangTab("ta");
      setFormError(msg);
      showToast(msg);
      return;
    }
    const cleanSlug = (formData.slug.trim() || generateAsciiSlug(formData.titleEn || formData.titleTa, "book")).toLowerCase();
    if (!isAsciiSlug(cleanSlug)) {
      const msg = "Slug must contain only ASCII lowercase letters, numbers, and hyphens.";
      setFormError(msg);
      showToast(msg);
      return;
    }
    const cleanCoverUrl = formData.image.trim();
    if (!editingBook && (!cleanCoverUrl || cleanCoverUrl === BOOK_PLACEHOLDER_IMAGE)) {
      const msg = "Front cover (outside) image is required.";
      setFormError(msg);
      showToast(msg);
      return;
    }
    setSaving(true);

    const requestPayload = {
      slug: cleanSlug,
      title: formData.titleTa.trim() || formData.titleEn.trim(),
      title_en: formData.titleEn.trim() || null,
      title_ta: formData.titleTa.trim() || null,
      author: formData.authorTa.trim() || formData.authorEn.trim(),
      author_en: formData.authorEn.trim() || null,
      author_ta: formData.authorTa.trim() || null,
      description: formData.descriptionTa.trim() || formData.descriptionEn.trim() || null,
      description_en: formData.descriptionEn.trim() || null,
      description_ta: formData.descriptionTa.trim() || null,
      publisher: formData.publisherTa.trim() || formData.publisherEn.trim() || "மேதகு களஞ்சியம்",
      publisher_en: formData.publisherEn.trim() || "Methagu Kalanjiyam",
      publisher_ta: formData.publisherTa.trim() || "மேதகு களஞ்சியம்",
      quote_en: formData.quoteEn.trim() || null,
      quote_ta: formData.quoteTa.trim() || null,
      price: Number(formData.price),
      stock: Number(formData.stock),
      category_id: formData.categoryId || null,
      is_featured: Boolean(formData.isFeatured),
      ...(cleanCoverUrl && cleanCoverUrl !== BOOK_PLACEHOLDER_IMAGE
        ? {
          cover_image_url: cleanCoverUrl,
          cover_image_path: formData.cover_image_path || null,
          cover_is_front: true,
        }
        : {}),
      cover_alt_en: formData.coverAltEn.trim() || null,
      cover_alt_ta: formData.coverAltTa.trim() || null,
      gallery_images: formData.galleryImages,
      whatsapp_link: formData.whatsapp_link || null,
      status: formData.cmsStatus,
    };

    try {
      if (editingBook) {
        const res = await fetch("/api/admin/books", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingBook.id,
            ...requestPayload,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const savedBook = data.book ? mapSupabaseBook(data.book) : null;
          setBooks((prev) =>
            prev.map((b) =>
              b.id === editingBook.id
                ? savedBook || {
                  ...b,
                  slug: cleanSlug,
                  title: requestPayload.title,
                  titleEn: formData.titleEn.trim(),
                  titleTa: formData.titleTa.trim(),
                  author: requestPayload.author,
                  authorEn: formData.authorEn.trim(),
                  authorTa: formData.authorTa.trim(),
                  price: Number(formData.price),
                  stock: Number(formData.stock),
                  image: cleanCoverUrl,
                  coverImageUrl: cleanCoverUrl,
                  coverImagePath: formData.cover_image_path || null,
                  coverIsFront: true,
                  coverAltEn: formData.coverAltEn.trim() || null,
                  coverAltTa: formData.coverAltTa.trim() || null,
                  galleryImages: formData.galleryImages,
                  descriptionTa: formData.descriptionTa.trim(),
                  descriptionEn: formData.descriptionEn.trim(),
                  publisherTa: formData.publisherTa.trim(),
                  publisherEn: formData.publisherEn.trim(),
                  whatsappLink: formData.whatsapp_link,
                  cmsStatus: formData.cmsStatus,
                  status: (
                    formData.stock <= 0 ? "out_of_stock" : formData.stock <= 5 ? "low_stock" : "in_stock"
                  ) as BookStatus,
                  updatedAt: new Date().toISOString(),
                }
                : b
            )
          );
          showToast("Book updated successfully.");
          setIsModalOpen(false);
        } else {
          const err = await res.json().catch(() => ({}));
          const msg = err.error || "Failed to update book.";
          setFormError(msg);
          showToast(msg);
        }
      } else {
        const res = await fetch("/api/admin/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.book) setBooks((prev) => [mapSupabaseBook(data.book), ...prev]);
          showToast("New book added to catalog.");
          setIsModalOpen(false);
        } else {
          const err = await res.json().catch(() => ({}));
          const msg = err.error || "Failed to create book.";
          setFormError(msg);
          showToast(msg);
        }
      }
    } catch {
      setFormError("Network error saving book.");
      showToast("Network error saving book.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async (book: AdminBook) => {
    const nextFeatured = !book.isFeatured;
    setTogglingFeaturedId(book.id);
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, isFeatured: nextFeatured } : b))
    );
    try {
      const res = await fetch("/api/admin/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: book.id,
          is_featured: nextFeatured,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.book) {
          const saved = mapSupabaseBook(data.book);
          setBooks((prev) => prev.map((b) => (b.id === book.id ? saved : b)));
        }
        showToast(nextFeatured ? "Flagged as Best Seller." : "Best Seller flag removed.");
      } else {
        setBooks((prev) =>
          prev.map((b) => (b.id === book.id ? { ...b, isFeatured: book.isFeatured } : b))
        );
        showToast(data.error || "Failed to update Best Seller flag.");
      }
    } catch {
      setBooks((prev) =>
        prev.map((b) => (b.id === book.id ? { ...b, isFeatured: book.isFeatured } : b))
      );
      showToast("Network error updating Best Seller flag.");
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  const openManageCategoriesModal = () => {
    setEditingCat(null);
    setCatError(null);
    setCatForm({
      name_en: "",
      name_ta: "",
      slug: "",
      description_en: "",
      description_ta: "",
      sort_order: categoriesList.length + 1,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    const cleanEn = catForm.name_en.trim();
    const cleanTa = catForm.name_ta.trim();
    if (!cleanEn || !cleanTa) {
      setCatError("Both English and Tamil category names are required.");
      return;
    }
    const cleanSlug = (catForm.slug.trim() || generateAsciiSlug(cleanEn, "cat")).toLowerCase();
    if (!isAsciiSlug(cleanSlug)) {
      setCatError("Slug must use lowercase ASCII letters, numbers, and hyphens only.");
      return;
    }

    setCatSaving(true);
    try {
      const payload = {
        ...(editingCat ? { id: editingCat.id } : {}),
        name_en: cleanEn,
        name_ta: cleanTa,
        slug: cleanSlug,
        description_en: catForm.description_en.trim() || null,
        description_ta: catForm.description_ta.trim() || null,
        sort_order: Number(catForm.sort_order) || 0,
      };
      const res = await fetch("/api/admin/categories", {
        method: editingCat ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCatError(data.error || "Failed to save category.");
        return;
      }
      if (editingCat && data.category) {
        const updatedCat = data.category;
        setCategoriesList((prev) =>
          prev.map((c) => (c.id === editingCat.id ? { ...c, ...updatedCat } : c))
        );
        setBooks((prev) =>
          prev.map((b) =>
            b.categoryId === editingCat.id || b.categorySlug === editingCat.slug
              ? {
                ...b,
                categoryId: updatedCat.id,
                categorySlug: updatedCat.slug,
                categoryEn: updatedCat.name_en,
                categoryTa: updatedCat.name_ta,
              }
              : b
          )
        );
        showToast(`Updated category "${updatedCat.name_en}".`);
      } else if (data.category) {
        setCategoriesList((prev) => [...prev, data.category]);
        showToast(`Created category "${data.category.name_en}".`);
      }
      setEditingCat(null);
      setCatForm({
        name_en: "",
        name_ta: "",
        slug: "",
        description_en: "",
        description_ta: "",
        sort_order: categoriesList.length + 2,
      });
    } catch {
      setCatError("Network error saving category.");
    } finally {
      setCatSaving(false);
    }
  };

  const handleToggleCategoryActive = async (cat: AdminCategoryItem) => {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id, is_active: !cat.is_active }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.category) {
        setCategoriesList((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, is_active: data.category.is_active } : c))
        );
        showToast(data.category.is_active ? `Activated "${cat.name_en}".` : `Deactivated "${cat.name_en}".`);
      } else {
        showToast(data.error || "Failed to update category.");
      }
    } catch {
      showToast("Network error updating category.");
    }
  };

  const handleDeleteCategory = async (cat: AdminCategoryItem) => {
    try {
      const res = await fetch(`/api/admin/categories?id=${cat.id}&permanent=true`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCategoriesList((prev) => prev.filter((c) => c.id !== cat.id));
        showToast(`Deleted category "${cat.name_en}".`);
      } else {
        showToast(data.error || "Could not delete category.");
      }
    } catch {
      showToast("Network error deleting category.");
    }
  };

  const handleQuickCreateCategory = async () => {
    const cleanEn = quickCatEn.trim();
    const cleanTa = quickCatTa.trim();
    if (!cleanEn || !cleanTa) {
      showToast("Enter both English and Tamil category names.");
      return;
    }
    const cleanSlug = (quickCatSlug.trim() || generateAsciiSlug(cleanEn, "cat")).toLowerCase();
    if (!isAsciiSlug(cleanSlug)) {
      showToast("Category slug must be ASCII lowercase letters, numbers, and hyphens.");
      return;
    }
    setCreatingQuickCat(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_en: cleanEn,
          name_ta: cleanTa,
          slug: cleanSlug,
          sort_order: categoriesList.length + 1,
          is_active: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.category) {
        showToast(data.error || "Failed to create category.");
        return;
      }
      const created: AdminCategoryItem = data.category;
      setCategoriesList((prev) => [...prev, created]);
      setFormData((prev) => ({
        ...prev,
        categoryId: created.id,
        categorySlug: created.slug,
        categoryEn: created.name_en,
        categoryTa: created.name_ta,
      }));
      setQuickCatEn("");
      setQuickCatTa("");
      setQuickCatSlug("");
      setShowQuickCat(false);
      showToast(`Category "${created.name_en}" created & selected.`);
    } catch {
      showToast("Network error creating category.");
    } finally {
      setCreatingQuickCat(false);
    }
  };

  const handleToggleStatus = async (book: AdminBook) => {
    const nextStatus = book.cmsStatus === "published" ? "draft" : "published";
    try {
      const res = await fetch("/api/admin/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: book.id,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        setBooks((prev) =>
          prev.map((b) => (b.id === book.id ? { ...b, cmsStatus: nextStatus } : b))
        );
        showToast(`Book status switched to ${nextStatus}.`);
      } else {
        showToast("Failed to toggle status.");
      }
    } catch {
      showToast("Network error toggling status.");
    }
  };

  const confirmDeleteBook = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/books?id=${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== deleteTarget.id));
        showToast("Book deleted from database and storage.");
        setDeleteTarget(null);
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete book.");
      }
    } catch {
      showToast("Network error deleting book.");
    } finally {
      setDeleting(false);
    }
  };

  const flaggedCoverCount = React.useMemo(
    () =>
      books.filter(
        (b) => b.coverIsFront === false || isFlaggedBookCoverSlug(b.slug) || b.image === BOOK_PLACEHOLDER_IMAGE
      ).length,
    [books]
  );

  const bestSellerCount = React.useMemo(
    () => books.filter((b) => Boolean(b.isFeatured)).length,
    [books]
  );

  const activeCategories = React.useMemo(() => {
    if (categoriesList.length > 0) {
      return categoriesList.filter((c) => c.is_active);
    }
    return CATEGORY_OPTIONS.map((c) => ({
      id: "",
      slug: c.slug,
      name_en: c.label,
      name_ta: c.label,
      sort_order: 0,
      is_active: true,
    }));
  }, [categoriesList]);

  const filteredBooks = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return books.filter((b) => {
      const searchCorpus = buildBilingualSearchText(b, ["title", "author", "description", "publisher"]);
      const matchesSearch = !normalizedQuery || searchCorpus.includes(normalizedQuery);

      const matchesCategory =
        selectedCategory === "all" || b.categorySlug === selectedCategory;

      const matchesStatus =
        selectedStatus === "all" || b.status === selectedStatus;

      const matchesCmsStatus =
        selectedCmsStatus === "all" || b.cmsStatus === selectedCmsStatus;

      const needsFrontCover =
        b.coverIsFront === false || isFlaggedBookCoverSlug(b.slug) || b.image === BOOK_PLACEHOLDER_IMAGE;
      const langState = getLanguageCompleteness(b, BOOK_REQUIRED_BILINGUAL_FIELDS);
      const matchesCoverFilter =
        selectedCoverFilter === "all" ||
        (selectedCoverFilter === "best_sellers" && Boolean(b.isFeatured)) ||
        (selectedCoverFilter === "needs_cover" && needsFrontCover) ||
        (selectedCoverFilter === "missing_tamil" && langState.missingTamil);

      return matchesSearch && matchesCategory && matchesStatus && matchesCmsStatus && matchesCoverFilter;
    });
  }, [books, searchQuery, selectedCategory, selectedStatus, selectedCmsStatus, selectedCoverFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {usingFallback && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-start gap-2.5 text-xs text-rose-900">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <span>
            Could not load books from Supabase (<code className="font-mono">/api/admin/books</code>). Verify your admin session and Supabase connection, then refresh.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[#0A6847]" />
            Books Catalog
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Dynamic CRUD management for publications, prices, stock, cover images, and public visibility.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openManageCategoriesModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold transition-all shadow-2xs min-h-[44px] cursor-pointer"
          >
            <Tag className="h-4 w-4 text-[#0A6847]" />
            <span>Manage Categories ({categoriesList.length})</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold transition-all shadow-sm hover:shadow min-h-[44px] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Publication
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Tamil title, English title, author, or slug..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-base sm:text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {activeCategories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name_en} ({c.name_ta})
              </option>
            ))}
          </select>

          <select
            value={selectedCmsStatus}
            onChange={(e) => setSelectedCmsStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px] cursor-pointer"
          >
            <option value="all">All Visibility</option>
            <option value="published">Live Only</option>
            <option value="draft">Draft Only</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px] cursor-pointer"
          >
            <option value="all">All Inventory</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            value={selectedCoverFilter}
            onChange={(e) =>
              setSelectedCoverFilter(
                e.target.value as "all" | "best_sellers" | "needs_cover" | "missing_tamil"
              )
            }
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px] cursor-pointer"
          >
            <option value="all">All Collections & Flags</option>
            <option value="best_sellers">
              Best Sellers Only{bestSellerCount > 0 ? ` (${bestSellerCount})` : ""}
            </option>
            <option value="needs_cover">
              Needs Front Cover{flaggedCoverCount > 0 ? ` (${flaggedCoverCount})` : ""}
            </option>
            <option value="missing_tamil">Missing Tamil</option>
          </select>
        </div>
      </div>

      {flaggedCoverCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-start sm:items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>{flaggedCoverCount}</strong> book(s) need manual front-cover verification/upload (e.g. <code className="font-mono">methagu-kalanjiyam-aavanam</code>).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCoverFilter(selectedCoverFilter === "needs_cover" ? "all" : "needs_cover")}
            className="text-xs font-bold text-amber-900 underline cursor-pointer self-start sm:self-auto"
          >
            {selectedCoverFilter === "needs_cover" ? "Show all books" : "Filter flagged books"}
          </button>
        </div>
      )}

      {/* Books Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Publication</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4 text-center">Stock</th>
                <th className="py-3.5 px-4 text-center">Best Seller</th>
                <th className="py-3.5 px-4">Visibility</th>
                <th className="py-3.5 px-4">Inventory</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0A6847]" />
                    Loading database catalog...
                  </td>
                </tr>
              ) : filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No books match your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0 shadow-xs">
                          <Image
                            src={book.image}
                            alt={book.title}
                            width={40}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <h4 className="font-semibold text-gray-900 truncate font-tamil leading-[1.45]">
                            {book.titleTa || book.titleEn || book.title}
                          </h4>
                          {book.titleEn && book.titleTa && book.titleEn !== book.titleTa && (
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">{book.titleEn}</p>
                          )}
                          <p className="text-[11px] text-gray-500 truncate mt-0.5 font-tamil">
                            {book.authorTa || book.authorEn || book.author}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-gray-400 font-mono">/{book.slug}</span>
                            <BilingualListBadge completeness={getLanguageCompleteness(book, BOOK_REQUIRED_BILINGUAL_FIELDS)} />
                            {(book.coverIsFront === false ||
                              isFlaggedBookCoverSlug(book.slug) ||
                              book.image === BOOK_PLACEHOLDER_IMAGE) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  Needs Front Cover
                                </span>
                              )}
                            {book.galleryImages && book.galleryImages.length > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-semibold">
                                +{book.galleryImages.length} gallery
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      {book.categoryTa || book.categoryEn}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      {formatINR(book.price)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={updatingStockId === book.id || book.stock <= 0}
                          onClick={() => handleQuickStockAdjust(book, -1)}
                          aria-label={`Decrease stock for ${book.titleEn || book.title}`}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-700 font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center tabular-nums">{book.stock}</span>
                        <button
                          type="button"
                          disabled={updatingStockId === book.id}
                          onClick={() => handleQuickStockAdjust(book, 1)}
                          aria-label={`Increase stock for ${book.titleEn || book.title}`}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-700 font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        disabled={togglingFeaturedId === book.id}
                        onClick={() => handleToggleFeatured(book)}
                        aria-pressed={Boolean(book.isFeatured)}
                        title={
                          book.isFeatured
                            ? "Click to remove Best Seller flag"
                            : "Click to flag as Best Seller"
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer disabled:opacity-50 ${book.isFeatured
                          ? "bg-amber-50 text-amber-800 border-amber-300 shadow-2xs hover:bg-amber-100"
                          : "bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-700"
                          }`}
                      >
                        <Star
                          className={`h-3 w-3 ${book.isFeatured ? "fill-amber-500 text-amber-500" : "text-gray-400"
                            }`}
                        />
                        <span>{book.isFeatured ? "Best Seller" : "Flag"}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(book)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        title="Click to toggle visibility"
                      >
                        {cmsStatusBadge(book.cmsStatus)}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">{statusBadge(book.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(book)}
                          className="h-9 w-9 rounded-xl bg-gray-100 hover:bg-[#0A6847] hover:text-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit book"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(book)}
                          className="h-9 w-9 rounded-xl bg-gray-100 hover:bg-rose-600 hover:text-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete book"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Delete &ldquo;{deleteTarget.title}&rdquo;?
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                This action is destructive. If historical orders reference this publication, it will be safely shifted to Draft status. Otherwise, it and its storage assets will be permanently removed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 min-h-[44px] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteBook}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[44px] shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingBook ? "Edit Publication" : "Add New Publication"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Images upload directly to Supabase Storage with instant public synchronization.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 space-y-5">
              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              {/* Front Cover (Outside) Upload — Required */}
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-gray-800">
                    Front cover (outside) *
                  </label>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-[#0A6847]">
                    Primary Card & Hero Image
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="relative h-28 w-20 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 shrink-0 flex items-center justify-center">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Front cover preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-300" />
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Upload Dropzone */}
                  <div className="flex-1 space-y-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 hover:border-[#0A6847] rounded-2xl p-3.5 text-center cursor-pointer transition-colors bg-white hover:bg-emerald-50/20"
                    >
                      <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-gray-700">
                        Upload outside front cover to Supabase Storage
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        JPEG, PNG, WebP, AVIF · max 5 MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    <input
                      type="text"
                      required={!editingBook}
                      value={formData.image}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          image: nextVal,
                          cover_image_path: nextVal === editingBook?.coverImageUrl ? prev.cover_image_path : "",
                        }));
                        setImagePreview(nextVal || BOOK_PLACEHOLDER_IMAGE);
                      }}
                      placeholder="Front cover public URL (required)"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Inside Pages / Gallery (Optional, Multiple, Reorderable) */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-800 block">
                      Inside pages / gallery (optional)
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Shown after the outside front cover on the book detail page. Reorder cleanly with arrows.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={uploadingGallery}
                    onClick={() => galleryFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-[#0A6847] text-xs font-semibold text-gray-700 min-h-[40px] cursor-pointer"
                  >
                    {uploadingGallery ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Upload Inside Pages
                  </button>
                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => {
                      handleGalleryUpload(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Add Gallery URL Row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={galleryUrlInput}
                    onChange={(e) => setGalleryUrlInput(e.target.value)}
                    placeholder="Or paste inside page / back cover URL..."
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-base sm:text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
                  />
                  <button
                    type="button"
                    onClick={addGalleryByUrl}
                    className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold min-h-[40px] cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Reorderable Gallery List */}
                {formData.galleryImages.length > 0 && (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {formData.galleryImages.map((item, index) => (
                      <div
                        key={`${item.url}-${index}`}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-gray-200"
                      >
                        <div className="relative h-14 w-10 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                          <Image
                            src={item.url}
                            alt={item.alt_en || `Inside page ${index + 1}`}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500">#{index + 1}</span>
                            <select
                              value={item.kind || "inside"}
                              onChange={(e) => {
                                const nextKind = e.target.value as BookGalleryImage["kind"];
                                setFormData((prev) => ({
                                  ...prev,
                                  galleryImages: prev.galleryImages.map((g, idx) =>
                                    idx === index ? { ...g, kind: nextKind } : g
                                  ),
                                }));
                              }}
                              className="px-2 py-0.5 rounded border border-gray-200 text-[11px] font-semibold text-gray-700 bg-gray-50"
                            >
                              <option value="inside">Inside page</option>
                              <option value="back_cover">Back cover</option>
                              <option value="spread">Double-page spread</option>
                              <option value="other">Other photo</option>
                            </select>
                          </div>
                          <p className="text-[11px] font-mono text-gray-500 truncate">{item.url}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveGalleryItem(index, -1)}
                            className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                            title="Move up"
                            aria-label="Move gallery image up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === formData.galleryImages.length - 1}
                            onClick={() => moveGalleryItem(index, 1)}
                            className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                            title="Move down"
                            aria-label="Move gallery image down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGalleryItem(index)}
                            className="h-8 w-8 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                            title="Remove from gallery"
                            aria-label="Remove gallery image"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dual-Language Text Tabs (English | தமிழ்) */}
              <div className="rounded-2xl border border-gray-200 p-4 space-y-4 bg-white">
                <BilingualTabs
                  activeTab={activeLangTab}
                  onTabChange={setActiveLangTab}
                  completeness={formCompleteness}
                  isActiveTabDirty={isActiveTabDirty}
                />

                {activeLangTab === "en" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Book Title (English) *</label>
                        <input
                          type="text"
                          value={formData.titleEn}
                          onChange={(e) => {
                            const nextTitle = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              titleEn: nextTitle,
                              slug: editingBook
                                ? prev.slug
                                : prev.slug || generateAsciiSlug(nextTitle, "book"),
                            }));
                          }}
                          placeholder="e.g. Katunayake Air Base Victory"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Author (English) *</label>
                        <input
                          type="text"
                          value={formData.authorEn}
                          onChange={(e) => setFormData({ ...formData, authorEn: e.target.value })}
                          placeholder="e.g. Saanthi Nesakaram"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Publisher (English)</label>
                        <input
                          type="text"
                          value={formData.publisherEn}
                          onChange={(e) => setFormData({ ...formData, publisherEn: e.target.value })}
                          placeholder="Methagu Kalanjiyam"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Cover Alt Text (English)</label>
                        <input
                          type="text"
                          value={formData.coverAltEn}
                          onChange={(e) => setFormData({ ...formData, coverAltEn: e.target.value })}
                          placeholder="Front cover of Katunayake Air Base Victory"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Description / Abstract (English)</label>
                      <textarea
                        rows={3}
                        value={formData.descriptionEn}
                        onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                        placeholder="Enter English archival summary and context..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 font-tamil">
                          நூல் தலைப்பு (Tamil)
                        </label>
                        <input
                          type="text"
                          value={formData.titleTa}
                          onChange={(e) => setFormData({ ...formData, titleTa: e.target.value })}
                          placeholder="கட்டுநாயக்கா தாக்குதல் வெற்றி"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs font-tamil focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 font-tamil">
                          ஆசிரியர் (Author in Tamil)
                        </label>
                        <input
                          type="text"
                          value={formData.authorTa}
                          onChange={(e) => setFormData({ ...formData, authorTa: e.target.value })}
                          placeholder="சாந்தி நேசக்கரம்"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs font-tamil focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 font-tamil">பதிப்பகம் (Publisher in Tamil)</label>
                        <input
                          type="text"
                          value={formData.publisherTa}
                          onChange={(e) => setFormData({ ...formData, publisherTa: e.target.value })}
                          placeholder="மேதகு களஞ்சியம்"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs font-tamil focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 font-tamil">அட்டைப்பட விவரம் (Cover Alt in Tamil)</label>
                        <input
                          type="text"
                          value={formData.coverAltTa}
                          onChange={(e) => setFormData({ ...formData, coverAltTa: e.target.value })}
                          placeholder="நூல் முன் அட்டைப்படம்"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs font-tamil focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 font-tamil">நூல் குறிப்பு / சுருக்கம் (Description in Tamil)</label>
                      <textarea
                        rows={3}
                        value={formData.descriptionTa}
                        onChange={(e) => setFormData({ ...formData, descriptionTa: e.target.value })}
                        placeholder="தமிழில் நூல் குறிப்பு மற்றும் வரலாற்றுப் பின்னணி..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs font-tamil leading-[1.65] focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ASCII URL Slug */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">URL Slug (ASCII only — English-based)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  placeholder="katunayake-attack-victory"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs font-mono focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Category Selection (+ Inline New Category) & Best Seller Flag */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-gray-700">Book Category</label>
                      <button
                        type="button"
                        onClick={() => setShowQuickCat((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0A6847] hover:underline cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        {showQuickCat ? "Close New Category" : "Create New Category"}
                      </button>
                    </div>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const found = categoriesList.find((c) => c.id === selectedId);
                        setFormData((prev) => ({
                          ...prev,
                          categoryId: selectedId,
                          categorySlug: found?.slug || prev.categorySlug,
                          categoryEn: found?.name_en || prev.categoryEn,
                          categoryTa: found?.name_ta || prev.categoryTa,
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-base sm:text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px] cursor-pointer"
                    >
                      <option value="">Uncategorized</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name_en} — {cat.name_ta}{!cat.is_active ? " (Inactive)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      Best Seller Highlight
                    </label>
                    <label className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-amber-300 transition-colors min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.isFeatured)}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
                        }
                        className="h-4 w-4 accent-amber-500 rounded cursor-pointer"
                      />
                      <Star
                        className={`h-4 w-4 shrink-0 ${formData.isFeatured ? "fill-amber-500 text-amber-500" : "text-gray-400"
                          }`}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block leading-tight">
                          Flag as Best Seller
                        </span>
                        <span className="text-[10px] text-gray-500 block leading-tight">
                          Shows Best Seller badge & spotlight priority
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {showQuickCat && (
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-3">
                    <div className="text-[11px] font-bold text-[#0A6847] uppercase tracking-wider">
                      Quick Create & Assign Category
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={quickCatEn}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuickCatEn(val);
                          setQuickCatSlug((prevSlug) =>
                            prevSlug ? prevSlug : generateAsciiSlug(val, "cat")
                          );
                        }}
                        placeholder="Category Name (English) *"
                        className="px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[40px]"
                      />
                      <input
                        type="text"
                        value={quickCatTa}
                        onChange={(e) => setQuickCatTa(e.target.value)}
                        placeholder="வகைப் பெயர் (Tamil) *"
                        className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-tamil focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[40px]"
                      />
                      <input
                        type="text"
                        value={quickCatSlug}
                        onChange={(e) => setQuickCatSlug(e.target.value.toLowerCase())}
                        placeholder="ascii-slug"
                        className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[40px]"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowQuickCat(false)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={creatingQuickCat}
                        onClick={handleQuickCreateCategory}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0A6847] hover:bg-[#085036] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        {creatingQuickCat && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>Create & Select</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Price, Stock, Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs font-mono focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs font-mono focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Publication Visibility *</label>
                  <select
                    value={formData.cmsStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, cmsStatus: e.target.value as "published" | "draft" })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs font-bold text-gray-800 focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px] cursor-pointer"
                  >
                    <option value="published">Published (Public)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Optional WhatsApp Direct Link */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">WhatsApp Buy / Inquiry Link (Optional)</label>
                <input
                  type="text"
                  value={formData.whatsapp_link}
                  onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
                  placeholder="https://wa.me/918248654946?text=..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 min-h-[44px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] disabled:opacity-60 text-white text-xs font-bold min-h-[44px] shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving to Database...
                    </>
                  ) : (
                    <>{editingBook ? "Save Changes" : "Create Publication"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#0A6847]" />
                  Book Categories Management
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Create bilingual book categories, edit names/descriptions, and sync immediately to the storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <form onSubmit={handleSaveCategory} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    {editingCat ? `Editing: ${editingCat.name_en}` : "Create New Category"}
                  </span>
                  {editingCat && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCat(null);
                        setCatForm({
                          name_en: "",
                          name_ta: "",
                          slug: "",
                          description_en: "",
                          description_ta: "",
                          sort_order: categoriesList.length + 1,
                        });
                      }}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-800 underline cursor-pointer"
                    >
                      Switch to New Category
                    </button>
                  )}
                </div>

                {catError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    {catError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={catForm.name_en}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCatForm((prev) => ({
                        ...prev,
                        name_en: val,
                        slug: editingCat
                          ? prev.slug
                          : prev.slug || generateAsciiSlug(val, "cat"),
                      }));
                    }}
                    placeholder="English Name *"
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                  <input
                    type="text"
                    required
                    value={catForm.name_ta}
                    onChange={(e) => setCatForm((prev) => ({ ...prev, name_ta: e.target.value }))}
                    placeholder="தமிழ் பெயர் *"
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-tamil min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={catForm.slug}
                      onChange={(e) =>
                        setCatForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))
                      }
                      placeholder="url-slug"
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                    />
                    <input
                      type="number"
                      min={0}
                      value={catForm.sort_order}
                      onChange={(e) =>
                        setCatForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))
                      }
                      title="Sort order"
                      className="w-16 px-2.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={catForm.description_en}
                    onChange={(e) =>
                      setCatForm((prev) => ({ ...prev, description_en: e.target.value }))
                    }
                    placeholder="Short description (English, optional)"
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                  <input
                    type="text"
                    value={catForm.description_ta}
                    onChange={(e) =>
                      setCatForm((prev) => ({ ...prev, description_ta: e.target.value }))
                    }
                    placeholder="சிறு விளக்கம் (தமிழ், விருப்பத்தேர்வு)"
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-tamil min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={catSaving}
                    className="px-5 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] disabled:opacity-60 text-white text-xs font-bold min-h-[40px] flex items-center gap-2 cursor-pointer"
                  >
                    {catSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{editingCat ? "Update Category" : "Create Category"}</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Existing Categories ({categoriesList.length})
                </div>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  {categoriesList.map((cat) => {
                    const liveBookCount =
                      books.filter(
                        (b) => b.categoryId === cat.id || (!b.categoryId && b.categorySlug === cat.slug)
                      ).length || cat.book_count || 0;
                    return (
                      <div
                        key={cat.id}
                        className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-900">{cat.name_en}</span>
                            <span className="text-xs font-semibold text-[#0A6847] font-tamil">
                              {cat.name_ta}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">/{cat.slug}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {liveBookCount} books
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryActive(cat)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer ${cat.is_active
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}
                          >
                            {cat.is_active ? "Active" : "Hidden"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCat(cat);
                              setCatError(null);
                              setCatForm({
                                name_en: cat.name_en,
                                name_ta: cat.name_ta,
                                slug: cat.slug,
                                description_en: cat.description_en || "",
                                description_ta: cat.description_ta || "",
                                sort_order: cat.sort_order ?? 0,
                              });
                            }}
                            className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#0A6847] hover:text-white text-gray-600 flex items-center justify-center cursor-pointer"
                            title="Edit category"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={liveBookCount > 0}
                            onClick={() => handleDeleteCategory(cat)}
                            className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-rose-600 hover:text-white disabled:opacity-35 disabled:hover:bg-gray-100 disabled:hover:text-gray-600 text-gray-600 flex items-center justify-center cursor-pointer"
                            title={
                              liveBookCount > 0
                                ? "Reassign books before deleting category"
                                : "Delete category"
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
