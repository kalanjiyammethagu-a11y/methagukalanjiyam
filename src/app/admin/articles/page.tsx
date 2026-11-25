"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Clock,
  CheckCircle2,
  Trash2,
  X,
  ExternalLink,
  Edit,
  Upload,
  ImageIcon,
  Loader2,
} from "lucide-react";
import type { AdminArticle, ArticleStatus } from "@/types/admin";
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

const ARTICLE_REQUIRED_BILINGUAL_FIELDS = ["title", "body"];

interface ArticleItem {
  id: string;
  title: string;
  titleEn: string;
  titleTa: string;
  slug: string;
  excerpt: string;
  excerptEn: string;
  excerptTa: string;
  content: string;
  bodyEn: string;
  bodyTa: string;
  category: string;
  categoryEn: string;
  categoryTa: string;
  author: string;
  authorEn: string;
  authorTa: string;
  seoTitleEn: string;
  seoTitleTa: string;
  seoDescriptionEn: string;
  seoDescriptionTa: string;
  coverAltEn: string;
  coverAltTa: string;
  status: ArticleStatus;
  readingTimeMinutes: number;
  publishedAt: string;
  viewCount: number;
  coverImage: string;
  coverImagePath: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_OPTIONS = [
  "Historical Record",
  "Personal Memoir",
  "Martyrdom History",
  "Analysis & Essay",
  "Announcements & News",
];

const DEFAULT_COVER = "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/blog/thalapathi-vinayagam-banner.webp";

function mapSupabaseBlog(b: any): ArticleItem {
  const rawBody =
    typeof b.body === "string"
      ? b.body
      : typeof b.content === "object" && b.content
      ? b.content.body || ""
      : b.content || "";

  const titlePair = resolveBilingualPair({
    en: b.title_en || b.seo_title || b.meta_title,
    ta: b.title_ta,
    legacy: b.title,
  });
  const excerptPair = resolveBilingualPair({
    en: b.excerpt_en || b.seo_description || b.meta_description,
    ta: b.excerpt_ta,
    legacy: b.excerpt,
  });
  const bodyPair = resolveBilingualPair({
    en: b.body_en || (typeof b.content === "object" && b.content ? b.content.body_en : undefined),
    ta: b.body_ta || (typeof b.content === "object" && b.content ? b.content.body_ta : undefined),
    legacy: rawBody,
  });
  const authorPair = resolveBilingualPair({
    en: b.author_en,
    ta: b.author_ta,
    legacy: b.author || b.profiles?.full_name || "Methagu Kalanjiyam",
  });
  const resolvedStatus: ArticleStatus =
    b.status === "draft" || b.status === "archived"
      ? b.status
      : b.status === "published" || b.is_published
      ? "published"
      : "draft";

  return {
    id: b.id,
    title: titlePair.ta || titlePair.en || b.title || "Untitled Article",
    titleEn: titlePair.en || "",
    titleTa: titlePair.ta || "",
    slug: b.slug || `article-${b.id}`,
    excerpt: excerptPair.ta || excerptPair.en || "",
    excerptEn: excerptPair.en || "",
    excerptTa: excerptPair.ta || "",
    content: bodyPair.ta || bodyPair.en || "",
    bodyEn: bodyPair.en || "",
    bodyTa: bodyPair.ta || "",
    category: b.category_en || b.category_ta || (Array.isArray(b.keywords) && b.keywords[0]) || "Historical Record",
    categoryEn: b.category_en || (Array.isArray(b.keywords) && b.keywords[0]) || "Historical Record",
    categoryTa: b.category_ta || "வரலாற்று ஆவணம்",
    author: authorPair.ta || authorPair.en || "Methagu Kalanjiyam",
    authorEn: authorPair.en || "Methagu Kalanjiyam",
    authorTa: authorPair.ta || "மேதகு களஞ்சியம்",
    seoTitleEn: b.seo_title_en || b.seo_title || b.meta_title || "",
    seoTitleTa: b.seo_title_ta || "",
    seoDescriptionEn: b.seo_description_en || b.seo_description || b.meta_description || "",
    seoDescriptionTa: b.seo_description_ta || "",
    coverAltEn: b.cover_alt_en || "",
    coverAltTa: b.cover_alt_ta || "",
    status: resolvedStatus,
    readingTimeMinutes: b.reading_time_mins || 5,
    publishedAt: b.published_at ? b.published_at.split("T")[0] : "",
    viewCount: b.view_count || 0,
    coverImage: b.cover_image_url || b.cover_image || DEFAULT_COVER,
    coverImagePath: b.cover_image_path || "",
    createdAt: b.created_at || new Date().toISOString(),
    updatedAt: b.updated_at || new Date().toISOString(),
  };
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = React.useState<ArticleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedLangFilter, setSelectedLangFilter] = React.useState<"all" | "missing_tamil">("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingArticle, setEditingArticle] = React.useState<ArticleItem | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<ArticleItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [activeLangTab, setActiveLangTab] = React.useState<AppLocale>("en");
  const initialSnapshotRef = React.useRef({
    en: { titleEn: "", excerptEn: "", bodyEn: "", authorEn: "", coverAltEn: "" },
    ta: { titleTa: "", excerptTa: "", bodyTa: "", authorTa: "", coverAltTa: "" },
  });

  // Form State
  const [formData, setFormData] = React.useState({
    slug: "",
    titleEn: "",
    titleTa: "",
    excerptEn: "",
    excerptTa: "",
    bodyEn: "",
    bodyTa: "",
    categoryEn: "Historical Record",
    categoryTa: "வரலாற்று ஆவணம்",
    authorEn: "Deepak Harvin",
    authorTa: "தீபக் ஹார்வின்",
    coverAltEn: "",
    coverAltTa: "",
    readingTimeMinutes: 5,
    status: "published" as ArticleStatus,
    coverImage: DEFAULT_COVER,
    cover_image_path: "",
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchArticles = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles");
      if (res.ok) {
        const data = await res.json();
        if (data.articles && Array.isArray(data.articles)) {
          setArticles(data.articles.map(mapSupabaseBlog));
          setLoading(false);
          return;
        }
      }
      showToast("Failed to load articles from database.");
    } catch {
      showToast("Network error loading articles from database.");
    }
    setArticles([]);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchArticles().finally(() => setLoading(false));
  }, [fetchArticles]);

  // Lock scroll when modal is open
  React.useEffect(() => {
    if (!isModalOpen && !deleteTarget) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener("keydown", onKey);
    };
  }, [isModalOpen, deleteTarget]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingArticle(null);
    const empty = {
      slug: "",
      titleEn: "",
      titleTa: "",
      excerptEn: "",
      excerptTa: "",
      bodyEn: "",
      bodyTa: "",
      categoryEn: "Historical Record",
      categoryTa: "வரலாற்று ஆவணம்",
      authorEn: "Deepak Harvin",
      authorTa: "தீபக் ஹார்வின்",
      coverAltEn: "",
      coverAltTa: "",
      readingTimeMinutes: 5,
      status: "published" as ArticleStatus,
      coverImage: DEFAULT_COVER,
      cover_image_path: "",
    };
    setFormData(empty);
    initialSnapshotRef.current = {
      en: { titleEn: "", excerptEn: "", bodyEn: "", authorEn: empty.authorEn, coverAltEn: "" },
      ta: { titleTa: "", excerptTa: "", bodyTa: "", authorTa: empty.authorTa, coverAltTa: "" },
    };
    setActiveLangTab("en");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (article: ArticleItem) => {
    setEditingArticle(article);
    const populated = {
      slug: article.slug,
      titleEn: article.titleEn || "",
      titleTa: article.titleTa || (article.title !== article.titleEn ? article.title : ""),
      excerptEn: article.excerptEn || "",
      excerptTa: article.excerptTa || (article.excerpt !== article.excerptEn ? article.excerpt : ""),
      bodyEn: article.bodyEn || "",
      bodyTa: article.bodyTa || (article.content !== article.bodyEn ? article.content : ""),
      categoryEn: article.categoryEn || article.category || "Historical Record",
      categoryTa: article.categoryTa || "வரலாற்று ஆவணம்",
      authorEn: article.authorEn || "Deepak Harvin",
      authorTa: article.authorTa || "தீபக் ஹார்வின்",
      coverAltEn: article.coverAltEn || "",
      coverAltTa: article.coverAltTa || "",
      readingTimeMinutes: article.readingTimeMinutes,
      status: article.status,
      coverImage: article.coverImage,
      cover_image_path: article.coverImagePath || "",
    };
    setFormData(populated);
    initialSnapshotRef.current = {
      en: {
        titleEn: populated.titleEn,
        excerptEn: populated.excerptEn,
        bodyEn: populated.bodyEn,
        authorEn: populated.authorEn,
        coverAltEn: populated.coverAltEn,
      },
      ta: {
        titleTa: populated.titleTa,
        excerptTa: populated.excerptTa,
        bodyTa: populated.bodyTa,
        authorTa: populated.authorTa,
        coverAltTa: populated.coverAltTa,
      },
    };
    setActiveLangTab("en");
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);

    const localUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, coverImage: localUrl }));

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "blog");
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        const publicUrl = data.url || data.path;
        const storagePath = data.path;
        setFormData((prev) => ({
          ...prev,
          coverImage: publicUrl,
          cover_image_path: storagePath,
        }));
        showToast("Article cover image uploaded to Supabase Storage.");
      } else {
        const err = await res.json();
        showToast(err.error || "Image upload failed.");
        if (editingArticle) {
          setFormData((prev) => ({ ...prev, coverImage: editingArticle.coverImage }));
        }
      }
    } catch {
      showToast("Network error uploading cover image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleStatus = async (article: ArticleItem) => {
    const nextStatus: ArticleStatus = article.status === "published" ? "draft" : "published";
    const nextPublished = nextStatus === "published";

    setArticles((prev) =>
      prev.map((a) =>
        a.id === article.id
          ? {
            ...a,
            status: nextStatus,
            publishedAt: nextPublished ? new Date().toISOString().split("T")[0] : "",
            updatedAt: new Date().toISOString(),
          }
          : a
      )
    );

    try {
      const res = await fetch("/api/admin/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: article.id,
          status: nextStatus,
          is_published: nextPublished,
        }),
      });

      if (!res.ok) {
        setArticles((prev) =>
          prev.map((a) => (a.id === article.id ? { ...a, status: article.status } : a))
        );
        showToast("Failed to toggle status in database.");
        return;
      }
      showToast(`Article status updated to ${nextStatus}.`);
    } catch {
      showToast("Network error toggling status.");
    }
  };

  const formCompleteness = React.useMemo(
    () =>
      getLanguageCompleteness(
        {
          titleEn: formData.titleEn,
          titleTa: formData.titleTa,
          bodyEn: formData.bodyEn,
          bodyTa: formData.bodyTa,
        },
        ARTICLE_REQUIRED_BILINGUAL_FIELDS
      ),
    [formData]
  );

  const isActiveTabDirty = React.useMemo(() => {
    const snap = initialSnapshotRef.current;
    if (activeLangTab === "en") {
      return (
        formData.titleEn !== snap.en.titleEn ||
        formData.excerptEn !== snap.en.excerptEn ||
        formData.bodyEn !== snap.en.bodyEn ||
        formData.authorEn !== snap.en.authorEn ||
        formData.coverAltEn !== snap.en.coverAltEn
      );
    }
    return (
      formData.titleTa !== snap.ta.titleTa ||
      formData.excerptTa !== snap.ta.excerptTa ||
      formData.bodyTa !== snap.ta.bodyTa ||
      formData.authorTa !== snap.ta.authorTa ||
      formData.coverAltTa !== snap.ta.coverAltTa
    );
  }, [activeLangTab, formData]);

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleEn.trim() || !formData.bodyEn.trim()) {
      setActiveLangTab("en");
      showToast("English title and English article body are required.");
      return;
    }
    if (
      REQUIRE_BOTH_LANGUAGES_TO_PUBLISH &&
      formData.status === "published" &&
      (!formData.titleTa.trim() || !formData.bodyTa.trim())
    ) {
      setActiveLangTab("ta");
      showToast("Tamil title and Tamil body are required to publish.");
      return;
    }

    const generatedSlug = (formData.slug.trim() || generateAsciiSlug(formData.titleEn, "article")).toLowerCase();
    if (!isAsciiSlug(generatedSlug)) {
      showToast("Slug must contain only ASCII lowercase letters, numbers, and hyphens.");
      return;
    }
    setSaving(true);

    const apiPayload = {
      title: formData.titleTa.trim() || formData.titleEn.trim(),
      title_en: formData.titleEn.trim(),
      title_ta: formData.titleTa.trim() || null,
      slug: generatedSlug,
      excerpt: formData.excerptTa.trim() || formData.excerptEn.trim() || null,
      excerpt_en: formData.excerptEn.trim() || null,
      excerpt_ta: formData.excerptTa.trim() || null,
      body: formData.bodyTa.trim() || formData.bodyEn.trim(),
      body_en: formData.bodyEn.trim(),
      body_ta: formData.bodyTa.trim() || null,
      category_en: formData.categoryEn,
      category_ta: formData.categoryTa || "வரலாற்று ஆவணம்",
      author: formData.authorTa.trim() || formData.authorEn.trim() || "மேதகு களஞ்சியம்",
      author_en: formData.authorEn.trim() || "Methagu Kalanjiyam",
      author_ta: formData.authorTa.trim() || null,
      cover_alt_en: formData.coverAltEn.trim() || null,
      cover_alt_ta: formData.coverAltTa.trim() || null,
      seo_title: formData.titleEn.trim(),
      seo_description: formData.excerptEn.trim() || null,
      reading_time_mins: Number(formData.readingTimeMinutes),
      status: formData.status === "archived" ? "draft" : formData.status,
      cover_image_url: formData.coverImage,
      cover_image_path: formData.cover_image_path || undefined,
    };

    try {
      if (editingArticle) {
        const res = await fetch("/api/admin/articles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingArticle.id,
            ...apiPayload,
          }),
        });

        if (res.ok) {
          const resData = await res.json().catch(() => ({}));
          const updatedItem = resData.article
            ? mapSupabaseBlog(resData.article)
            : {
                ...editingArticle,
                title: apiPayload.title,
                titleEn: formData.titleEn.trim(),
                titleTa: formData.titleTa.trim(),
                slug: generatedSlug,
                excerpt: apiPayload.excerpt || "",
                excerptEn: formData.excerptEn.trim(),
                excerptTa: formData.excerptTa.trim(),
                content: apiPayload.body,
                bodyEn: formData.bodyEn.trim(),
                bodyTa: formData.bodyTa.trim(),
                category: formData.categoryEn,
                categoryEn: formData.categoryEn,
                categoryTa: formData.categoryTa,
                author: apiPayload.author,
                authorEn: formData.authorEn.trim(),
                authorTa: formData.authorTa.trim(),
                coverAltEn: formData.coverAltEn.trim(),
                coverAltTa: formData.coverAltTa.trim(),
                readingTimeMinutes: Number(formData.readingTimeMinutes),
                status: formData.status,
                coverImage: formData.coverImage,
                updatedAt: new Date().toISOString(),
              };

          setArticles((prev) => prev.map((a) => (a.id === editingArticle.id ? updatedItem : a)));
          showToast("Article updated successfully.");
          setIsModalOpen(false);
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.error || "Failed to update article in database.");
        }
      } else {
        const res = await fetch("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        });

        if (res.ok) {
          const data = await res.json();
          const newArt: ArticleItem = data.article
            ? mapSupabaseBlog(data.article)
            : {
                id: `art-${Date.now()}`,
                title: apiPayload.title,
                titleEn: formData.titleEn.trim(),
                titleTa: formData.titleTa.trim(),
                slug: generatedSlug,
                excerpt: apiPayload.excerpt || "",
                excerptEn: formData.excerptEn.trim(),
                excerptTa: formData.excerptTa.trim(),
                content: apiPayload.body,
                bodyEn: formData.bodyEn.trim(),
                bodyTa: formData.bodyTa.trim(),
                category: formData.categoryEn,
                categoryEn: formData.categoryEn,
                categoryTa: formData.categoryTa,
                author: apiPayload.author,
                authorEn: formData.authorEn.trim(),
                authorTa: formData.authorTa.trim(),
                seoTitleEn: formData.titleEn.trim(),
                seoTitleTa: formData.titleTa.trim(),
                seoDescriptionEn: formData.excerptEn.trim(),
                seoDescriptionTa: formData.excerptTa.trim(),
                coverAltEn: formData.coverAltEn.trim(),
                coverAltTa: formData.coverAltTa.trim(),
                status: formData.status,
                readingTimeMinutes: Number(formData.readingTimeMinutes),
                publishedAt: formData.status === "published" ? new Date().toISOString().split("T")[0] : "",
                viewCount: 0,
                coverImage: formData.coverImage,
                coverImagePath: formData.cover_image_path,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

          setArticles((prev) => [newArt, ...prev]);
          showToast("New article created and published.");
          setIsModalOpen(false);
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.error || "Failed to create article in database.");
        }
      }
    } catch {
      showToast("Network error saving article.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteArticle = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/articles?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        showToast("Article removed from database and storage.");
        setDeleteTarget(null);
      } else {
        showToast("Failed to delete article from database.");
      }
    } catch {
      showToast("Network error deleting article.");
    } finally {
      setDeleting(false);
    }
  };

  // Filter articles (bilingual search + status + category + missing Tamil filter)
  const filteredArticles = articles.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    const corpus = buildBilingualSearchText(
      {
        titleEn: a.titleEn,
        titleTa: a.titleTa,
        excerptEn: a.excerptEn,
        excerptTa: a.excerptTa,
        authorEn: a.authorEn,
        authorTa: a.authorTa,
        slug: a.slug,
      },
      ["title", "excerpt", "author"]
    );
    const matchesSearch = !q || corpus.includes(q);
    const matchesStatus = selectedStatus === "all" || a.status === selectedStatus;
    const matchesCategory = selectedCategory === "all" || a.category === selectedCategory;
    const langComp = getLanguageCompleteness(
      { titleEn: a.titleEn, titleTa: a.titleTa, bodyEn: a.bodyEn, bodyTa: a.bodyTa },
      ARTICLE_REQUIRED_BILINGUAL_FIELDS
    );
    const matchesLang =
      selectedLangFilter === "all" || (selectedLangFilter === "missing_tamil" && langComp.missingTamil);

    return matchesSearch && matchesStatus && matchesCategory && matchesLang;
  });

  const totalPublished = articles.filter((a) => a.status === "published").length;
  const totalDrafts = articles.filter((a) => a.status === "draft").length;
  const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Articles & Editorial Management
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Create, edit, upload cover images, and publish historical features to the archive
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer min-h-[42px]"
        >
          <Plus className="h-4 w-4" />
          <span>Write New Article</span>
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Total Articles
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono mt-1">
            {articles.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Published
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {totalPublished}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Drafts
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1">
            {totalDrafts}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Total Views
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono mt-1">
            {totalViews.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title, slug, or author..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={selectedLangFilter}
            onChange={(e) => setSelectedLangFilter(e.target.value as "all" | "missing_tamil")}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px] cursor-pointer"
          >
            <option value="all">All Languages</option>
            <option value="missing_tamil">Missing Tamil</option>
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Article</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Author</th>
                <th className="py-3.5 px-4 text-center">Views</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0A6847]" />
                    Loading archival articles...
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <FileText className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No articles match your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                    {/* Title & Cover & Metadata */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0 shadow-xs">
                          <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                            unoptimized={article.coverImage.startsWith("blob:")}
                          />
                        </div>
                        <div className="min-w-0 max-w-sm sm:max-w-md">
                          <h4 className="font-bold text-gray-900 truncate font-tamil leading-[1.45]">
                            {article.titleTa || article.titleEn || article.title}
                          </h4>
                          {article.titleEn && article.titleTa && article.titleEn !== article.titleTa && (
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">{article.titleEn}</p>
                          )}
                          <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] text-gray-400">
                              /blog/{article.slug}
                            </span>
                            <BilingualListBadge
                              completeness={getLanguageCompleteness(
                                {
                                  titleEn: article.titleEn,
                                  titleTa: article.titleTa,
                                  bodyEn: article.bodyEn,
                                  bodyTa: article.bodyTa,
                                },
                                ARTICLE_REQUIRED_BILINGUAL_FIELDS
                              )}
                            />
                            <span className="flex items-center gap-1 font-mono text-[10px] text-gray-400">
                              <Clock className="h-3 w-3" />
                              {article.readingTimeMinutes} mins
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-semibold whitespace-nowrap">
                        {article.category}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="py-3.5 px-4 font-semibold text-gray-800 whitespace-nowrap">
                      {article.author}
                    </td>

                    {/* Views */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-700 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3 text-gray-400" />
                        <span>{article.viewCount}</span>
                      </div>
                    </td>

                    {/* Status Toggle Button */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(article)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${article.status === "published"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                          }`}
                        title="Click to toggle Published / Draft"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${article.status === "published" ? "bg-emerald-600" : "bg-amber-600"
                            }`}
                        />
                        <span className="capitalize">{article.status}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#0A6847] hover:text-white text-gray-600 flex items-center justify-center transition-colors"
                          title="View Live Article"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(article)}
                          className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#0A6847] hover:text-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit Article"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(article)}
                          className="h-9 w-9 rounded-xl bg-gray-100 hover:bg-rose-600 hover:text-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete Article"
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
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Delete &ldquo;{deleteTarget.title}&rdquo;?
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                This action is permanent and cannot be undone. The article entry and any uploaded cover image in Supabase Storage will be deleted immediately.
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
                onClick={confirmDeleteArticle}
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

      {/* Create / Edit Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingArticle ? "Edit Archival Article" : "Create New Archival Feature"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingArticle ? "Update publication content and settings" : "Write and publish a new feature to the blog archive"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4">
              {/* Cover Image Upload */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  Article Cover Image
                </label>
                <div className="flex items-start gap-4">
                  {/* Preview Container */}
                  <div className="relative h-24 w-36 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 shrink-0 flex items-center justify-center">
                    {formData.coverImage ? (
                      <Image
                        src={formData.coverImage}
                        alt="Cover preview"
                        fill
                        sizes="144px"
                        className="object-cover"
                        unoptimized={formData.coverImage.startsWith("blob:")}
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-300" />
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-[#0A6847]" />
                      </div>
                    )}
                  </div>

                  {/* Drop zone / Upload button */}
                  <div className="flex-1 space-y-2">
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-xl p-3.5 text-center cursor-pointer hover:border-[#0A6847] hover:bg-emerald-50/30 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    >
                      <Upload className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-gray-600">
                        Click to upload cover image or drag & drop
                      </p>
                      <p className="text-[11px] text-gray-400">
                        JPEG, PNG, WebP · max 5 MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    <input
                      type="text"
                      value={formData.coverImage}
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                      placeholder="https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/blog/thalapathi-vinayagam-banner.webp"
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Dual-Language Text Tabs (English | தமிழ்) */}
              <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
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
                        <label className="text-xs font-bold text-gray-700">Article Title (English) *</label>
                        <input
                          type="text"
                          value={formData.titleEn}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              titleEn: val,
                              slug: editingArticle
                                ? prev.slug
                                : prev.slug || generateAsciiSlug(val, "article"),
                            }));
                          }}
                          placeholder="e.g. Commander Vinayagam Commemoration"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Author (English)</label>
                        <input
                          type="text"
                          value={formData.authorEn}
                          onChange={(e) => setFormData({ ...formData, authorEn: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Cover Image Alt Text (English)</label>
                        <input
                          type="text"
                          value={formData.coverAltEn}
                          onChange={(e) => setFormData({ ...formData, coverAltEn: e.target.value })}
                          placeholder="Banner illustrating archival feature"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Short Excerpt (English)</label>
                        <input
                          type="text"
                          value={formData.excerptEn}
                          onChange={(e) => setFormData({ ...formData, excerptEn: e.target.value })}
                          placeholder="Concise summary for cards and SEO..."
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Article Body Content (English) *</label>
                      <textarea
                        rows={5}
                        value={formData.bodyEn}
                        onChange={(e) => setFormData({ ...formData, bodyEn: e.target.value })}
                        placeholder="Write or paste English article content..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs resize-y focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 font-sans"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 font-tamil">கட்டுரைத் தலைப்பு (Tamil)</label>
                        <input
                          type="text"
                          value={formData.titleTa}
                          onChange={(e) => setFormData({ ...formData, titleTa: e.target.value })}
                          placeholder="தமிழில் கட்டுரைத் தலைப்பு..."
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-tamil focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 font-tamil">ஆசிரியர் (Author in Tamil)</label>
                        <input
                          type="text"
                          value={formData.authorTa}
                          onChange={(e) => setFormData({ ...formData, authorTa: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-tamil min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 font-tamil">பட விவரம் (Cover Alt in Tamil)</label>
                        <input
                          type="text"
                          value={formData.coverAltTa}
                          onChange={(e) => setFormData({ ...formData, coverAltTa: e.target.value })}
                          placeholder="கட்டுரை முகப்புப் படம்"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-tamil min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 font-tamil">சுருக்கக் குறிப்பு (Excerpt in Tamil)</label>
                        <input
                          type="text"
                          value={formData.excerptTa}
                          onChange={(e) => setFormData({ ...formData, excerptTa: e.target.value })}
                          placeholder="கட்டுரை முன்னுரைச் சுருக்கம்..."
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-tamil min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 font-tamil">கட்டுரை உள்ளடக்கம் (Article Body in Tamil)</label>
                      <textarea
                        rows={5}
                        value={formData.bodyTa}
                        onChange={(e) => setFormData({ ...formData, bodyTa: e.target.value })}
                        placeholder="தமிழில் முழுக் கட்டுரை உள்ளடக்கத்தை உள்ளிடவும்..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-tamil leading-[1.65] resize-y focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ASCII Slug, Category, Reading Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">URL Slug (ASCII only)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    placeholder="commander-vinayagam"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Category</label>
                  <select
                    value={formData.categoryEn}
                    onChange={(e) => setFormData({ ...formData, categoryEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Est. Reading Time (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={formData.readingTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, readingTimeMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                </div>
              </div>

              {/* Publication Status Selector */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-gray-700 block">
                  Publication Status
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                    <input
                      type="radio"
                      name="articleStatus"
                      checked={formData.status === "published"}
                      onChange={() => setFormData({ ...formData, status: "published" })}
                      className="text-[#0A6847]"
                    />
                    <span>Publish Immediately</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-600">
                    <input
                      type="radio"
                      name="articleStatus"
                      checked={formData.status === "draft"}
                      onChange={() => setFormData({ ...formData, status: "draft" })}
                      className="text-amber-600"
                    />
                    <span>Save as Draft</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 min-h-[40px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-5 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] disabled:opacity-60 text-white text-xs font-bold min-h-[40px] shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingArticle ? "Save Changes" : "Publish Article"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
