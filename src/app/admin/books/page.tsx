"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { mockAdminBooks } from "@/data/admin-mock";
import type { AdminBook, BookStatus } from "@/types/admin";
import { formatINR } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminBooksPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [books, setBooks] = React.useState<AdminBook[]>(mockAdminBooks);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState<AdminBook | null>(null);

  // Form fields
  const [formData, setFormData] = React.useState({
    title: "",
    titleEn: "",
    author: "",
    authorEn: "",
    price: 150,
    stock: 20,
    categoryTa: "வரலாறு & ஆவணங்கள்",
    categoryEn: "History & Archives",
    categorySlug: "history",
    image: "/images/books/book-20.webp",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setFormData({
      title: "",
      titleEn: "",
      author: "",
      authorEn: "",
      price: 150,
      stock: 20,
      categoryTa: "வரலாறு & ஆவணங்கள்",
      categoryEn: "History & Archives",
      categorySlug: "history",
      image: "/images/books/book-20.webp",
    });
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
    setIsModalOpen(true);
  };

  // Lock body scroll and dismiss on Escape
  React.useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsModalOpen(false);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isModalOpen]);

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    if (editingBook) {
      // Update
      setBooks((prev) =>
        prev.map((b) =>
          b.id === editingBook.id
            ? {
                ...b,
                ...formData,
                status: (formData.stock <= 0
                  ? "out_of_stock"
                  : formData.stock <= 5
                  ? "low_stock"
                  : "in_stock") as BookStatus,
                updatedAt: new Date().toISOString(),
              }
            : b
        )
      );
      showToast(isTa ? "நூல் விவரங்கள் புதுப்பிக்கப்பட்டன!" : "Book updated successfully!");
    } else {
      // Create new
      const newBook: AdminBook = {
        id: `book-${Date.now()}`,
        ...formData,
        slug: formData.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        status: (formData.stock <= 0
          ? "out_of_stock"
          : formData.stock <= 5
          ? "low_stock"
          : "in_stock") as BookStatus,
        salesCount: 0,
        descriptionTa: "புதிய அரிய நூல் ஆவணம்.",
        descriptionEn: "New rare historical catalog entry.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBooks((prev) => [newBook, ...prev]);
      showToast(isTa ? "புதிய நூல் சேர்க்கப்பட்டது!" : "New book added to catalog!");
    }
    setIsModalOpen(false);
  };

  const handleDeleteBook = (bookId: string, title: string) => {
    if (confirm(isTa ? `"${title}" நூலை நீக்க விரும்புகிறீர்களா?` : `Delete "${title}"?`)) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      showToast(isTa ? "நூல் நீக்கப்பட்டது!" : "Book removed from catalog!");
    }
  };

  const handleAdjustStock = (bookId: string, delta: number) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const newStock = Math.max(0, b.stock + delta);
        return {
          ...b,
          stock: newStock,
          status: (newStock <= 0 ? "out_of_stock" : newStock <= 5 ? "low_stock" : "in_stock") as BookStatus,
        };
      })
    );
  };

  // Filter books
  const filteredBooks = books.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.titleEn.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === "all" || b.categorySlug === selectedCategory;

    const matchesStatus =
      selectedStatus === "all" || b.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold font-tamil">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-tamil text-zinc-900">
            {isTa ? "நூல் தொகுப்பு மேலாண்மை" : "Books Catalog Management"}
          </h2>
          <p className="text-xs text-zinc-500 font-tamil mt-1">
            {isTa
              ? `மொத்தம் ${books.length} நூல்கள் களஞ்சியக் பட்டியலில் உள்ளன • கையிருப்பு & விலைக் கட்டுப்பாடு`
              : `${books.length} titles in archival catalog • Manage inventory and pricing`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold font-tamil shadow-sm transition-all active:scale-95 cursor-pointer min-h-[42px]"
        >
          <Plus className="h-4 w-4" />
          <span>{isTa ? "புதிய நூல் சேர்க்க" : "Add New Book"}</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-black/8 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isTa
                ? "நூலின் பெயர், ஆசிரியர் பெயர் கொண்டு தேடுக..."
                : "Search by book title or author..."
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-black/10 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 focus:border-[#0A6847] transition-all min-h-[40px]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-black/10 bg-white text-xs font-semibold text-zinc-700 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px] cursor-pointer"
          >
            <option value="all">{isTa ? "அனைத்துப் பிரிவுகள்" : "All Categories"}</option>
            <option value="history">{isTa ? "வரலாறு & ஆவணங்கள்" : "History & Records"}</option>
            <option value="memoirs">{isTa ? "போர்முனை நினைவுகள்" : "Memoirs"}</option>
            <option value="biographies">{isTa ? "வாழ்க்கை வரலாறு" : "Biographies"}</option>
          </select>

          {/* Stock Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-black/10 bg-white text-xs font-semibold text-zinc-700 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px] cursor-pointer"
          >
            <option value="all">{isTa ? "அனைத்து இருப்பு நிலைகள்" : "All Stock Statuses"}</option>
            <option value="in_stock">{isTa ? "கையிருப்பில் உள்ளது" : "In Stock"}</option>
            <option value="low_stock">{isTa ? "குறைந்த இருப்பு (≤5)" : "Low Stock"}</option>
            <option value="out_of_stock">{isTa ? "விற்றுத் தீர்ந்தது" : "Out of Stock"}</option>
          </select>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-2xl border border-black/8 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-black/8 text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-tamil">
                <th className="py-3.5 px-4">{isTa ? "நூல் விவரம்" : "Book Details"}</th>
                <th className="py-3.5 px-4">{isTa ? "பிரிவு" : "Category"}</th>
                <th className="py-3.5 px-4">{isTa ? "விலை" : "Price"}</th>
                <th className="py-3.5 px-4 text-center">{isTa ? "கையிருப்பு" : "Stock"}</th>
                <th className="py-3.5 px-4">{isTa ? "நிலை" : "Status"}</th>
                <th className="py-3.5 px-4 text-center">{isTa ? "விற்பனை" : "Sales"}</th>
                <th className="py-3.5 px-4 text-right">{isTa ? "செயல்கள்" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 text-xs text-zinc-800">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-zinc-50/80 transition-colors">
                  {/* Book Details */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-10 rounded-lg overflow-hidden border border-black/10 bg-zinc-100 shrink-0 shadow-2xs">
                        <Image
                          src={book.image}
                          alt={book.title}
                          width={40}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <h4 className="font-bold text-zinc-900 font-tamil truncate">
                          {isTa ? book.title : book.titleEn}
                        </h4>
                        <p className="text-[11px] text-zinc-500 font-tamil truncate">
                          {isTa ? book.author : book.authorEn}
                        </p>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ID: {book.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-[11px] font-semibold font-tamil">
                      {isTa ? book.categoryTa : book.categoryEn}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-zinc-900 font-mono">
                      {formatINR(book.price)}
                    </div>
                    {book.discountPrice && (
                      <div className="text-[10px] text-zinc-400 line-through font-mono">
                        {formatINR(book.discountPrice)}
                      </div>
                    )}
                  </td>

                  {/* Stock with quick +/- buttons */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-zinc-100 px-2 py-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(book.id, -1)}
                        className="h-6 w-6 rounded-lg bg-white border border-black/10 text-zinc-700 font-bold hover:bg-zinc-200 flex items-center justify-center cursor-pointer"
                        title={isTa ? "1 குறைக்க" : "-1"}
                      >
                        -
                      </button>
                      <span className="font-bold font-mono text-zinc-900 min-w-[20px]">
                        {book.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(book.id, 1)}
                        className="h-6 w-6 rounded-lg bg-white border border-black/10 text-zinc-700 font-bold hover:bg-zinc-200 flex items-center justify-center cursor-pointer"
                        title={isTa ? "1 கூட்டுக" : "+1"}
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    {book.status === "in_stock" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-400/30 text-[10px] font-bold font-tamil">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                        {isTa ? "கையிருப்பில்" : "In Stock"}
                      </span>
                    ) : book.status === "low_stock" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-400/30 text-[10px] font-bold font-tamil">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                        {isTa ? "குறைந்த இருப்பு" : "Low Stock"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-800 border border-rose-400/30 text-[10px] font-bold font-tamil">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                        {isTa ? "விற்றுத் தீர்ந்தது" : "Sold Out"}
                      </span>
                    )}
                  </td>

                  {/* Sales Count */}
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-zinc-600">
                    {book.salesCount}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(book)}
                        className="h-8 w-8 rounded-lg bg-zinc-100 hover:bg-[#0A6847] hover:text-white text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                        title={isTa ? "திருத்த" : "Edit Book"}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBook(book.id, isTa ? book.title : book.titleEn)}
                        className="h-8 w-8 rounded-lg bg-zinc-100 hover:bg-rose-600 hover:text-white text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                        title={isTa ? "நீக்க" : "Delete Book"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBooks.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-tamil">
            <BookOpen className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">
              {isTa ? "நூல்கள் எதுவும் கண்டறியப்படவில்லை" : "No books match your criteria"}
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-black/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <h3 className="text-lg font-bold text-zinc-900 font-tamil">
                {editingBook
                  ? isTa
                    ? "நூல் விவரங்களைத் திருத்துக"
                    : "Edit Book Details"
                  : isTa
                  ? "புதிய நூலைச் சேர்க்க"
                  : "Add New Archival Book"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title Ta */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 font-tamil">
                    {isTa ? "நூலின் தலைப்பு (தமிழ்) *" : "Title (Tamil) *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="எ.கா. தமிழீழ விடுதலைப் போராட்டம்"
                    className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs focus:ring-2 focus:ring-[#0A6847]/30 min-h-[38px]"
                  />
                </div>

                {/* Title En */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">
                    {isTa ? "தலைப்பு (ஆங்கிலம்)" : "Title (English)"}
                  </label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="e.g. Tamil Eelam Liberation Struggle"
                    className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs focus:ring-2 focus:ring-[#0A6847]/30 min-h-[38px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Author Ta */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 font-tamil">
                    {isTa ? "ஆசிரியர் (தமிழ்) *" : "Author (Tamil) *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="எ.கா. தீபக் ஹார்வின்"
                    className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs focus:ring-2 focus:ring-[#0A6847]/30 min-h-[38px]"
                  />
                </div>

                {/* Author En */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">
                    {isTa ? "ஆசிரியர் (ஆங்கிலம்)" : "Author (English)"}
                  </label>
                  <input
                    type="text"
                    value={formData.authorEn}
                    onChange={(e) => setFormData({ ...formData, authorEn: e.target.value })}
                    placeholder="e.g. Deepak Harvin"
                    className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs focus:ring-2 focus:ring-[#0A6847]/30 min-h-[38px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Price */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 font-tamil">
                    {isTa ? "விலை (₹) *" : "Price (₹) *"}
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs font-mono min-h-[38px]"
                  />
                </div>

                {/* Initial Stock */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 font-tamil">
                    {isTa ? "இருப்பு எண்ணிக்கை *" : "Stock Quantity *"}
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs font-mono min-h-[38px]"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 font-tamil">
                    {isTa ? "பிரிவு" : "Category"}
                  </label>
                  <select
                    value={formData.categorySlug}
                    onChange={(e) => {
                      const val = e.target.value;
                      const taMap: Record<string, string> = {
                        history: "வரலாறு & ஆவணங்கள்",
                        memoirs: "போர்முனை நினைவுகள்",
                        biographies: "வாழ்க்கை வரலாறு",
                      };
                      setFormData({
                        ...formData,
                        categorySlug: val,
                        categoryTa: taMap[val] || "வரலாறு",
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs font-tamil min-h-[38px]"
                  >
                    <option value="history">வரலாறு & ஆவணங்கள்</option>
                    <option value="memoirs">போர்முனை நினைவுகள்</option>
                    <option value="biographies">வாழ்க்கை வரலாறு</option>
                  </select>
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 font-tamil">
                  {isTa ? "அட்டைப் படம் (Cover Image Path)" : "Cover Image"}
                </label>
                <select
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs min-h-[38px]"
                >
                  <option value="/images/books/book-20.webp">/images/books/book-20.webp (கட்டுநாயக்கா)</option>
                  <option value="/images/books/book-16.webp">/images/books/book-16.webp (நெஞ்சுரம்)</option>
                  <option value="/images/blogs/deelipan-memorial.webp">/images/blogs/deelipan-memorial.webp (திலீபம்)</option>
                  <option value="/images/books/book-07.webp">/images/books/book-07.webp (புறநானூற்று வீரன்)</option>
                  <option value="/images/blogs/kanden-kanden-banner.webp">/images/blogs/kanden-kanden-banner.webp</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black/10 text-xs font-bold text-zinc-700 hover:bg-zinc-100 min-h-[40px] font-tamil"
                >
                  {isTa ? "ரத்து செய்க" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold min-h-[40px] font-tamil shadow-xs"
                >
                  {isTa ? "சேமிக்க" : "Save Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
