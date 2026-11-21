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
    image: b.cover_front || "/images/books/book-placeholder.webp",
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
];

function statusBadge(status: string) {
  if (status === "in_stock")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
        In Stock
      </span>
    );
  if (status === "low_stock")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
        Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-bold">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
      Out of Stock
    </span>
  );
}

export default function AdminBooksPage() {
  const [books, setBooks] = React.useState<AdminBook[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState<AdminBook | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Image upload state
  const [imagePreview, setImagePreview] = React.useState<string>("/images/books/book-20.webp");
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = React.useState({
    title: "",
    titleEn: "",
    author: "",
    authorEn: "",
    price: 150,
    stock: 20,
    categoryTa: "History & Archives",
    categoryEn: "History & Archives",
    categorySlug: "history",
    image: "/images/books/book-20.webp",
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
    if (!isModalOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsModalOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = orig; window.removeEventListener("keydown", onKey); };
  }, [isModalOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      titleEn: "",
      author: "",
      authorEn: "",
      price: 150,
      stock: 20,
      categoryTa: "History & Archives",
      categoryEn: "History & Archives",
      categorySlug: "history",
      image: "/images/books/book-20.webp",
    });
    setImagePreview("/images/books/book-20.webp");
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
      categoryTa: book.categoryTa,
      categoryEn: book.categoryEn,
      categorySlug: book.categorySlug,
      image: book.image,
    });
    setImagePreview(book.image);
    setIsModalOpen(true);
  };

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, image: data.path }));
        setImagePreview(data.path);
        showToast("Cover image uploaded successfully.");
      } else {
        const err = await res.json();
        showToast(err.error || "Image upload failed.");
        setImagePreview(formData.image); // revert preview
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
    if (!formData.title) return;
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
            cover_front: formData.image,
          }),
        });
        if (res.ok) {
          setBooks((prev) =>
            prev.map((b) =>
              b.id === editingBook.id
                ? {
                    ...b,
                    ...formData,
                    status: (
                      formData.stock <= 0 ? "out_of_stock" : formData.stock <= 5 ? "low_stock" : "in_stock"
                    ) as BookStatus,
                    updatedAt: new Date().toISOString(),
                  }
                : b
            )
          );
          showToast("Book updated successfully.");
        } else {
          showToast("Failed to update book.");
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
            cover_front: formData.image,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.book) setBooks((prev) => [mapSupabaseBook(data.book), ...prev]);
          showToast("New book added to catalog.");
        } else {
          showToast("Failed to create book.");
        }
      }
    } catch {
      showToast("Network error saving book.");
    } finally {
      setSaving(false);
      setIsModalOpen(false);
    }
  };

  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`Delete "${title}" from the catalog?`)) return;
    try {
      const res = await fetch(`/api/admin/books?id=${bookId}`, { method: "DELETE" });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== bookId));
        showToast("Book removed from catalog.");
      } else {
        showToast("Failed to delete book.");
      }
    } catch {
      showToast("Network error deleting book.");
    }
  };

  const handleAdjustStock = async (bookId: string, delta: number) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;
    const newStock = Math.max(0, book.stock + delta);
    try {
      const res = await fetch("/api/admin/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookId, stock: newStock }),
      });
      if (res.ok) {
        setBooks((prev) =>
          prev.map((b) => {
            if (b.id !== bookId) return b;
            return {
              ...b,
              stock: newStock,
              status: (
                newStock <= 0 ? "out_of_stock" : newStock <= 5 ? "low_stock" : "in_stock"
              ) as BookStatus,
            };
          })
        );
      }
    } catch {
      showToast("Failed to adjust stock.");
    }
  };

  const filteredBooks = books.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.titleEn.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q);
    const matchCat = selectedCategory === "all" || b.categorySlug === selectedCategory;
    const matchStat = selectedStatus === "all" || b.status === selectedStatus;
    return matchSearch && matchCat && matchStat;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Books Catalog</h2>
          <p className="text-xs text-gray-400 mt-1">
            {books.length} titles · manage inventory, pricing & cover images
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-sm font-bold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          Add New Book
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or author..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] min-h-[40px] transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px] cursor-pointer"
          >
            <option value="all">All Statuses</option>
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
                <th className="py-3.5 px-4">Book</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4 text-center">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Sales</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading catalog...
                  </td>
                </tr>
              ) : filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No books match your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0 shadow-sm">
                          <Image
                            src={book.image}
                            alt={book.titleEn}
                            width={40}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <h4 className="font-semibold text-gray-900 truncate">{book.titleEn}</h4>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{book.authorEn}</p>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {book.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-semibold">
                        {book.categoryEn}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 font-mono">{formatINR(book.price)}</div>
                      {book.discountPrice && (
                        <div className="text-[10px] text-gray-400 line-through font-mono">
                          {formatINR(book.discountPrice)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(book.id, -1)}
                          className="h-6 w-6 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-200 flex items-center justify-center cursor-pointer text-base leading-none"
                          title="-1 stock"
                        >
                          −
                        </button>
                        <span className="font-bold font-mono text-gray-900 min-w-[20px] text-center">
                          {book.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(book.id, 1)}
                          className="h-6 w-6 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-200 flex items-center justify-center cursor-pointer text-base leading-none"
                          title="+1 stock"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{statusBadge(book.status)}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-gray-600">
                      {book.salesCount}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(book)}
                          className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#0A6847] hover:text-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit book"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBook(book.id, book.titleEn)}
                          className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-rose-600 hover:text-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete book"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingBook ? "Edit Book" : "Add New Book"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingBook ? "Update catalog entry details" : "Add a new title to the archival catalog"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 space-y-5">
              {/* Cover Image Upload */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">
                  Cover Image
                </label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="relative h-28 w-20 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 shrink-0 flex items-center justify-center">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                        unoptimized={imagePreview.startsWith("blob:")}
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

                  {/* Upload area */}
                  <div className="flex-1 space-y-2">
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#0A6847] hover:bg-emerald-50/30 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    >
                      <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-gray-600">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
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
                    {/* Manual path input as fallback */}
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, image: e.target.value }));
                        setImagePreview(e.target.value);
                      }}
                      placeholder="/images/books/my-book.webp"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847]"
                    />
                  </div>
                </div>
              </div>

              {/* Title Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Title (Primary / Tamil) *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Tamil Eelam Liberation Struggle"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none focus:border-[#0A6847] min-h-[38px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Title (English)</label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="e.g. Tamil Eelam Liberation Struggle"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none focus:border-[#0A6847] min-h-[38px]"
                  />
                </div>
              </div>

              {/* Author Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Author *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g. Deepak Harvin"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none focus:border-[#0A6847] min-h-[38px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Author (English)</label>
                  <input
                    type="text"
                    value={formData.authorEn}
                    onChange={(e) => setFormData({ ...formData, authorEn: e.target.value })}
                    placeholder="e.g. Deepak Harvin"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none focus:border-[#0A6847] min-h-[38px]"
                  />
                </div>
              </div>

              {/* Price / Stock / Category */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[38px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[38px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Category</label>
                  <select
                    value={formData.categorySlug}
                    onChange={(e) => {
                      const opt = CATEGORY_OPTIONS.find((c) => c.slug === e.target.value);
                      setFormData({
                        ...formData,
                        categorySlug: e.target.value,
                        categoryTa: opt?.label || "History",
                        categoryEn: opt?.label || "History",
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#0A6847]/30 focus:outline-none min-h-[38px] cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
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
                  className="px-5 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] disabled:opacity-60 text-white text-xs font-bold min-h-[40px] shadow-sm flex items-center gap-2 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingBook ? "Save Changes" : "Add Book"}</>
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
