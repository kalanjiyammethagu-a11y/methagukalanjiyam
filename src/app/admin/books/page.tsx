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
} from "lucide-react";
import { mockAdminBooks } from "@/data/admin-mock";
import type { AdminBook, BookStatus } from "@/types/admin";
import { formatINR } from "@/lib/utils";

function mapSupabaseBook(b: any): AdminBook {
  const cat = b.categories || {};
  return {
    id: b.id,
    title: b.title,
    titleEn: b.slug ? b.slug.replace(/-/g, " ") : b.title,
    author: b.author,
    authorEn: b.author,
    price: Number(b.price || 0),
    discountPrice: b.discount_price ? Number(b.discount_price) : null,
    categoryTa: cat.name_en || "History",
    categoryEn: cat.name_en || "History",
    categorySlug: cat.slug || "history",
    image: b.cover_image_url || b.cover_front || "/images/books/book-placeholder.webp",
    coverImagePath: b.cover_image_path || null,
    coverImageUrl: b.cover_image_url || b.cover_front || null,
    whatsappLink: b.whatsapp_link || null,
    cmsStatus: (b.status === "draft" ? "draft" : "published") as "draft" | "published",
    stock: Number(b.stock || 0),
    slug: b.slug,
    pages: b.pages,
    publisher: b.publisher,
    descriptionTa: b.description || "",
    descriptionEn: b.description || "",
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
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [selectedCmsStatus, setSelectedCmsStatus] = React.useState("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState<AdminBook | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = React.useState<AdminBook | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Image upload state
  const [imagePreview, setImagePreview] = React.useState<string>("/images/books/book-placeholder.webp");
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = React.useState({
    title: "",
    titleEn: "",
    author: "",
    authorEn: "",
    price: 150,
    stock: 20,
    categorySlug: "history",
    categoryTa: "History & Archives",
    categoryEn: "History & Archives",
    image: "/images/books/book-placeholder.webp",
    cover_image_path: "",
    description: "",
    whatsapp_link: "",
    cmsStatus: "published" as "published" | "draft",
  });

  const fetchBooks = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/books");
      if (res.ok) {
        const data = await res.json();
        if (data.books && Array.isArray(data.books)) {
          setBooks(data.books.map(mapSupabaseBook));
          return;
        }
      }
    } catch {}
    setBooks(mockAdminBooks);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchBooks().finally(() => setLoading(false));
  }, [fetchBooks]);

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
    setTimeout(() => setToastMessage(null), 3500);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      titleEn: "",
      author: "",
      authorEn: "",
      price: 150,
      stock: 20,
      categorySlug: "history",
      categoryTa: "History & Archives",
      categoryEn: "History & Archives",
      image: "/images/books/book-placeholder.webp",
      cover_image_path: "",
      description: "",
      whatsapp_link: "",
      cmsStatus: "published",
    });
    setImagePreview("/images/books/book-placeholder.webp");
  };

  const handleOpenAddModal = () => {
    setEditingBook(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: AdminBook) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      titleEn: book.titleEn,
      author: book.author,
      authorEn: book.authorEn,
      price: book.price,
      stock: book.stock,
      categorySlug: book.categorySlug || "history",
      categoryTa: book.categoryTa || "History & Archives",
      categoryEn: book.categoryEn || "History & Archives",
      image: book.image,
      cover_image_path: book.coverImagePath || "",
      description: book.descriptionTa || book.descriptionEn || "",
      whatsapp_link: book.whatsappLink || "",
      cmsStatus: book.cmsStatus || "published",
    });
    setImagePreview(book.image);
    setIsModalOpen(true);
  };

  // Image upload handler to Supabase Storage bucket `books`
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);

    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "books");

      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        const publicUrl = data.url || data.path;
        const storagePath = data.path;
        setFormData((prev) => ({
          ...prev,
          image: publicUrl,
          cover_image_path: storagePath,
        }));
        setImagePreview(publicUrl);
        showToast("Cover image uploaded to Supabase Storage.");
      } else {
        const err = await res.json();
        showToast(err.error || "Image upload failed.");
        setImagePreview(formData.image);
      }
    } catch {
      showToast("Network error uploading image.");
      setImagePreview(formData.image);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author) {
      showToast("Title and Author are required.");
      return;
    }
    setSaving(true);

    try {
      if (editingBook) {
        const res = await fetch("/api/admin/books", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingBook.id,
            title: formData.title,
            author: formData.author,
            price: Number(formData.price),
            stock: Number(formData.stock),
            cover_image_url: formData.image,
            cover_image_path: formData.cover_image_path || undefined,
            description: formData.description,
            whatsapp_link: formData.whatsapp_link || null,
            status: formData.cmsStatus,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setBooks((prev) =>
            prev.map((b) =>
              b.id === editingBook.id
                ? {
                    ...b,
                    title: formData.title,
                    author: formData.author,
                    price: Number(formData.price),
                    stock: Number(formData.stock),
                    image: formData.image,
                    coverImageUrl: formData.image,
                    coverImagePath: formData.cover_image_path || b.coverImagePath,
                    descriptionTa: formData.description,
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
          const err = await res.json();
          showToast(err.error || "Failed to update book.");
        }
      } else {
        const res = await fetch("/api/admin/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            author: formData.author,
            price: Number(formData.price),
            stock: Number(formData.stock),
            cover_image_url: formData.image,
            cover_image_path: formData.cover_image_path || undefined,
            description: formData.description,
            whatsapp_link: formData.whatsapp_link || null,
            status: formData.cmsStatus,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.book) setBooks((prev) => [mapSupabaseBook(data.book), ...prev]);
          showToast("New book added to catalog.");
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          showToast(err.error || "Failed to create book.");
        }
      }
    } catch {
      showToast("Network error saving book.");
    } finally {
      setSaving(false);
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

  const filteredBooks = React.useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        searchQuery === "" ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.authorEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || b.categorySlug === selectedCategory;

      const matchesStatus =
        selectedStatus === "all" || b.status === selectedStatus;

      const matchesCmsStatus =
        selectedCmsStatus === "all" || b.cmsStatus === selectedCmsStatus;

      return matchesSearch && matchesCategory && matchesStatus && matchesCmsStatus;
    });
  }, [books, searchQuery, selectedCategory, selectedStatus, selectedCmsStatus]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
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
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold transition-all shadow-sm hover:shadow min-h-[44px] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Publication
        </button>
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
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
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
        </div>
      </div>

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
                <th className="py-3.5 px-4">Visibility</th>
                <th className="py-3.5 px-4">Inventory</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0A6847]" />
                    Loading database catalog...
                  </td>
                </tr>
              ) : filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
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
                          <h4 className="font-semibold text-gray-900 truncate font-tamil">{book.title}</h4>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{book.author}</p>
                          <span className="text-[10px] text-gray-400 font-mono">/{book.slug}</span>
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
                      {book.stock}
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
              {/* Cover Image Upload */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  Cover Image (Supabase Storage: books bucket) *
                </label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="relative h-28 w-20 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 shrink-0 flex items-center justify-center">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Preview"
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
                      className="border-2 border-dashed border-gray-200 hover:border-[#0A6847] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-emerald-50/20"
                    >
                      <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-gray-700">
                        Upload cover image to Supabase Storage
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
                      value={formData.image}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, image: e.target.value }));
                        setImagePreview(e.target.value);
                      }}
                      placeholder="Storage public URL or image path"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Book Title (Tamil / Primary) *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="கட்டுநாயக்கா தாக்குதல் வெற்றி"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Author *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="சாந்தி நேசக்கரம்"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[44px]"
                  />
                </div>
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

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Book Description / Abstract</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter archival treatise background, historical context, or publisher notes..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none"
                />
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
    </div>
  );
}
