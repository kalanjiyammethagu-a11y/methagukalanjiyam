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
  Calendar,
  X,
  ExternalLink,
  Edit,
  Upload,
  ImageIcon,
  Loader2,
  Sparkles,
  BookOpen,
  Filter,
} from "lucide-react";
import { mockArticles } from "@/data/admin-mock";
import type { AdminArticle, ArticleStatus } from "@/types/admin";

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  status: ArticleStatus;
  readingTimeMinutes: number;
  publishedAt: string;
  viewCount: number;
  coverImage: string;
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

const DEFAULT_COVER = "/images/blogs/thalapathi-vinayagam-banner.webp";

function mapSupabaseBlog(b: any): ArticleItem {
  return {
    id: b.id,
    title: b.title || "Untitled Article",
    slug: b.slug || `article-${b.id}`,
    excerpt: b.excerpt || "",
    content: typeof b.content === "object" ? b.content.body || "" : b.content || "",
    category: Array.isArray(b.keywords) && b.keywords[0] ? b.keywords[0] : "Historical Record",
    author: b.profiles?.full_name || "Archives Editorial",
    status: b.is_published ? "published" : "draft",
    readingTimeMinutes: b.reading_time_mins || 5,
    publishedAt: b.published_at ? b.published_at.split("T")[0] : "",
    viewCount: b.view_count || 0,
    coverImage: b.cover_image || DEFAULT_COVER,
    createdAt: b.created_at || new Date().toISOString(),
    updatedAt: b.updated_at || new Date().toISOString(),
  };
}

function mapMockArticle(a: AdminArticle): ArticleItem {
  return {
    id: a.id,
    title: a.titleEn || a.titleTa,
    slug: a.slug,
    excerpt: a.subtitleEn || a.subtitleTa,
    content: "Detailed historical archival documentation and contextual records.",
    category: a.categoryEn || a.categoryTa,
    author: a.authorEn || a.author,
    status: a.status,
    readingTimeMinutes: a.readingTimeMinutes,
    publishedAt: a.publishedAt,
    viewCount: a.viewCount,
    coverImage: DEFAULT_COVER,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = React.useState<ArticleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingArticle, setEditingArticle] = React.useState<ArticleItem | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Historical Record",
    author: "Deepak Harvin",
    readingTimeMinutes: 5,
    status: "published" as ArticleStatus,
    coverImage: DEFAULT_COVER,
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchArticles = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles");
      if (res.ok) {
        const data = await res.json();
        if (data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles(data.articles.map(mapSupabaseBlog));
          return;
        }
      }
    } catch {}
    setArticles(mockArticles.map(mapMockArticle));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchArticles().finally(() => setLoading(false));
  }, [fetchArticles]);

  // Lock scroll when modal is open
  React.useEffect(() => {
    if (!isModalOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener("keydown", onKey);
    };
  }, [isModalOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingArticle(null);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "Historical Record",
      author: "Deepak Harvin",
      readingTimeMinutes: 5,
      status: "published",
      coverImage: DEFAULT_COVER,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (article: ArticleItem) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      author: article.author,
      readingTimeMinutes: article.readingTimeMinutes,
      status: article.status,
      coverImage: article.coverImage,
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);

    // Immediate local preview
    const localUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, coverImage: localUrl }));

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "blogs");
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, coverImage: data.path }));
        showToast("Article cover image uploaded successfully.");
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

    // Optimistic UI update
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
          is_published: nextPublished,
        }),
      });

      if (!res.ok) {
        // Rollback
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

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSaving(true);

    const generatedSlug =
      formData.slug.trim() ||
      formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    try {
      if (editingArticle) {
        // Update existing article
        const res = await fetch("/api/admin/articles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingArticle.id,
            title: formData.title,
            slug: generatedSlug,
            excerpt: formData.excerpt,
            content: formData.content,
            cover_image: formData.coverImage,
            category: formData.category,
            reading_time_mins: Number(formData.readingTimeMinutes),
            is_published: formData.status === "published",
          }),
        });

        if (res.ok) {
          setArticles((prev) =>
            prev.map((a) =>
              a.id === editingArticle.id
                ? {
                    ...a,
                    title: formData.title,
                    slug: generatedSlug,
                    excerpt: formData.excerpt,
                    content: formData.content,
                    category: formData.category,
                    author: formData.author,
                    readingTimeMinutes: Number(formData.readingTimeMinutes),
                    status: formData.status,
                    coverImage: formData.coverImage,
                    updatedAt: new Date().toISOString(),
                  }
                : a
            )
          );
          showToast("Article updated successfully.");
        } else {
          showToast("Failed to update article in database.");
        }
      } else {
        // Create new article
        const res = await fetch("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            slug: generatedSlug,
            excerpt: formData.excerpt,
            content: formData.content,
            cover_image: formData.coverImage,
            author: formData.author,
            category: formData.category,
            reading_time_mins: Number(formData.readingTimeMinutes),
            is_published: formData.status === "published",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const newArt: ArticleItem = data.article
            ? mapSupabaseBlog(data.article)
            : {
                id: `art-${Date.now()}`,
                title: formData.title,
                slug: generatedSlug,
                excerpt: formData.excerpt,
                content: formData.content,
                category: formData.category,
                author: formData.author,
                status: formData.status,
                readingTimeMinutes: Number(formData.readingTimeMinutes),
                publishedAt: formData.status === "published" ? new Date().toISOString().split("T")[0] : "",
                viewCount: 0,
                coverImage: formData.coverImage,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

          setArticles((prev) => [newArt, ...prev]);
          showToast("New article created and published.");
        } else {
          showToast("Failed to create article in database.");
        }
      }
    } catch {
      showToast("Network error saving article.");
    } finally {
      setSaving(false);
      setIsModalOpen(false);
    }
  };

  const handleDeleteArticle = async (articleId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/articles?id=${articleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== articleId));
        showToast("Article removed successfully.");
      } else {
        showToast("Failed to delete article from database.");
      }
    } catch {
      showToast("Network error deleting article.");
    }
  };

  // Filter articles
  const filteredArticles = articles.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q);

    const matchesStatus = selectedStatus === "all" || a.status === selectedStatus;
    const matchesCategory = selectedCategory === "all" || a.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
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
                          <h4 className="font-bold text-gray-900 truncate">
                            {article.title}
                          </h4>
                          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                            <span className="font-mono text-[10px] text-gray-400">
                              /blog/{article.slug}
                            </span>
                            <span>•</span>
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          article.status === "published"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                        }`}
                        title="Click to toggle Published / Draft"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            article.status === "published" ? "bg-emerald-600" : "bg-amber-600"
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
                          onClick={() => handleDeleteArticle(article.id, article.title)}
                          className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-rose-600 hover:text-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
                      placeholder="/images/blogs/thalapathi-vinayagam-banner.webp"
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        title: val,
                        slug: prev.slug ? prev.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      }));
                    }}
                    placeholder="e.g. Commander Vinayagam Commemoration"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[38px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. commander-vinayagam-commemoration"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[38px]"
                  />
                </div>
              </div>

              {/* Category, Author, Reading Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs min-h-[38px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    Author
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs min-h-[38px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    Est. Reading Time (Mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={formData.readingTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, readingTimeMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono min-h-[38px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                </div>
              </div>

              {/* Excerpt / Summary */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  Short Excerpt / Teaser
                </label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="A concise summary of the article displayed on card teasers and search results..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                />
              </div>

              {/* Article Content */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  Article Body Content
                </label>
                <textarea
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write or paste your article content here..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs resize-y focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 font-sans"
                />
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
