"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Clock,
  CheckCircle2,
  Edit,
  Trash2,
  Calendar,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { mockArticles } from "@/data/admin-mock";
import type { AdminArticle, ArticleStatus } from "@/types/admin";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminArticlesPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [articles, setArticles] = React.useState<AdminArticle[]>(mockArticles);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newTitleTa, setNewTitleTa] = React.useState("");
  const [newTitleEn, setNewTitleEn] = React.useState("");
  const [newAuthor, setNewAuthor] = React.useState("தீபக் ஹார்வின்");
  const [newCategory, setNewCategory] = React.useState("நினைவேந்தல்");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleStatus = (articleId: string) => {
    setArticles((prev) =>
      prev.map((a) => {
        if (a.id !== articleId) return a;
        const nextStatus: ArticleStatus = a.status === "published" ? "draft" : "published";
        return {
          ...a,
          status: nextStatus,
          publishedAt: nextStatus === "published" ? new Date().toISOString().split("T")[0] : "",
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast(isTa ? "பதிவு நிலை புதுப்பிக்கப்பட்டது!" : "Article status updated!");
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleTa.trim()) return;

    const newArt: AdminArticle = {
      id: `art-${Date.now()}`,
      titleTa: newTitleTa,
      titleEn: newTitleEn || newTitleTa,
      subtitleTa: "களஞ்சிய வரலாற்று ஆவணக் கட்டுரை.",
      subtitleEn: "Archival historical analysis feature.",
      slug: newTitleEn
        ? newTitleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : `article-${Date.now()}`,
      categoryTa: newCategory,
      categoryEn: "Archives",
      author: newAuthor,
      authorEn: newAuthor,
      status: "published",
      readingTimeMinutes: 6,
      publishedAt: new Date().toISOString().split("T")[0],
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setArticles([newArt, ...articles]);
    showToast(isTa ? "புதிய பதிவு வெளியிடப்பட்டது!" : "New article published!");
    setIsModalOpen(false);
    setNewTitleTa("");
    setNewTitleEn("");
  };

  const handleDeleteArticle = (articleId: string) => {
    if (confirm(isTa ? "இப்பதிவை நீக்க விரும்புகிறீர்களா?" : "Delete article?")) {
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      showToast(isTa ? "பதிவு நீக்கப்பட்டது!" : "Article deleted!");
    }
  };

  const filteredArticles = articles.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      a.titleTa.toLowerCase().includes(q) ||
      a.titleEn.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q);

    const matchesStatus =
      selectedStatus === "all" || a.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold font-tamil">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-tamil text-zinc-900">
            {isTa ? "களஞ்சியப் பதிவுகள் மேலாண்மை" : "Articles & Editorial Management"}
          </h2>
          <p className="text-xs text-zinc-500 font-tamil mt-1">
            {isTa
              ? `மொத்தம் ${articles.length} வரலாற்று ஆவணக் கட்டுரைகள் • வெளியீடு மற்றும் வாசிப்புத் தரவுகள்`
              : `${articles.length} historical features and blog essays published in archive`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold font-tamil shadow-sm transition-all active:scale-95 cursor-pointer min-h-[42px]"
        >
          <Plus className="h-4 w-4" />
          <span>{isTa ? "புதிய பதிவு எழுதுக" : "Write New Article"}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-black/8 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isTa
                ? "கட்டுரையின் தலைப்பு, ஆசிரியர் கொண்டு தேடுக..."
                : "Search articles by title or author..."
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-black/10 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-black/10 bg-white text-xs font-semibold text-zinc-700 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px] cursor-pointer"
        >
          <option value="all">{isTa ? "அனைத்து நிலைகளும்" : "All Statuses"}</option>
          <option value="published">{isTa ? "வெளியிடப்பட்டது (Published)" : "Published"}</option>
          <option value="draft">{isTa ? "வரைவு (Draft)" : "Draft"}</option>
          <option value="archived">{isTa ? "காப்பகம் (Archived)" : "Archived"}</option>
        </select>
      </div>

      {/* Articles Grid / Table */}
      <div className="bg-white rounded-2xl border border-black/8 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-black/8 text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-tamil">
                <th className="py-3.5 px-4">{isTa ? "கட்டுரை தலைப்பு" : "Article Title"}</th>
                <th className="py-3.5 px-4">{isTa ? "பிரிவு" : "Category"}</th>
                <th className="py-3.5 px-4">{isTa ? "ஆசிரியர்" : "Author"}</th>
                <th className="py-3.5 px-4 text-center">{isTa ? "வாசிப்புகள்" : "Views"}</th>
                <th className="py-3.5 px-4">{isTa ? "நிலை" : "Status"}</th>
                <th className="py-3.5 px-4 text-right">{isTa ? "செயல்" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 text-xs text-zinc-800">
              {filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-zinc-900 font-tamil max-w-md">
                      {isTa ? article.titleTa : article.titleEn}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-tamil mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                        <Calendar className="h-3 w-3" />
                        {article.publishedAt || "Not published"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {article.readingTimeMinutes} mins
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-[11px] font-semibold font-tamil">
                      {isTa ? article.categoryTa : article.categoryEn}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-tamil font-semibold text-zinc-800">
                    {isTa ? article.author : article.authorEn}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-700">
                    <div className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3 text-zinc-400" />
                      <span>{article.viewCount}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(article.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-tamil transition-all cursor-pointer ${
                        article.status === "published"
                          ? "bg-emerald-500/15 text-emerald-800 border border-emerald-400/30"
                          : article.status === "draft"
                          ? "bg-amber-500/15 text-amber-800 border border-amber-400/30"
                          : "bg-zinc-100 text-zinc-700 border border-zinc-300"
                      }`}
                      title={isTa ? "நிலையை மாற்ற சொடுக்கவும்" : "Click to toggle"}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          article.status === "published" ? "bg-emerald-600" : "bg-amber-600"
                        }`}
                      ></span>
                      <span>
                        {article.status === "published"
                          ? isTa
                            ? "வெளியானது"
                            : "Published"
                          : article.status === "draft"
                          ? isTa
                            ? "வரைவு"
                            : "Draft"
                          : isTa
                          ? "காப்பகம்"
                          : "Archived"}
                      </span>
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/blog/${article.slug}`}
                        className="h-8 w-8 rounded-lg bg-zinc-100 hover:bg-[#0A6847] hover:text-white text-zinc-700 flex items-center justify-center transition-colors"
                        title={isTa ? "தளத்தில் காண்க" : "View on Site"}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(article.id)}
                        className="h-8 w-8 rounded-lg bg-zinc-100 hover:bg-rose-600 hover:text-white text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                        title={isTa ? "நீக்க" : "Delete"}
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
      </div>

      {/* Add Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-black/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/8">
              <h3 className="text-lg font-bold text-zinc-900 font-tamil">
                {isTa ? "புதிய ஆவணப் பதிவு உருவாக்குக" : "Create New Archival Feature"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 font-tamil">
                  {isTa ? "கட்டுரைத் தலைப்பு (தமிழ்) *" : "Article Title (Tamil) *"}
                </label>
                <input
                  type="text"
                  required
                  value={newTitleTa}
                  onChange={(e) => setNewTitleTa(e.target.value)}
                  placeholder="எ.கா. மாவீரர் நாள் 2026 சிறப்பு ஆவணம்"
                  className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs min-h-[38px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">
                  {isTa ? "தலைப்பு (ஆங்கிலம்)" : "Article Title (English)"}
                </label>
                <input
                  type="text"
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="e.g. Maaveerar Naal 2026 Archival Essay"
                  className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs min-h-[38px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 font-tamil">
                    {isTa ? "பிரிவு" : "Category"}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs font-tamil min-h-[38px]"
                  >
                    <option value="நினைவேந்தல்">நினைவேந்தல்</option>
                    <option value="வரலாற்று ஆய்வு">வரலாற்று ஆய்வு</option>
                    <option value="அறிவிப்பு">அறிவிப்பு</option>
                    <option value="வழிகாட்டி">வழிகாட்டி</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 font-tamil">
                    {isTa ? "எழுத்தாளர்" : "Author"}
                  </label>
                  <select
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/12 text-xs font-tamil min-h-[38px]"
                  >
                    <option value="தீபக் ஹார்வின்">தீபக் ஹார்வின்</option>
                    <option value="சுபி மதன்">சுபி மதன்</option>
                    <option value="சூரியபிரகாஷ்">சூரியபிரகாஷ்</option>
                    <option value="பச்ச முத்து">பச்ச முத்து</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black/10 text-xs font-bold text-zinc-700 hover:bg-zinc-100 min-h-[40px] font-tamil"
                >
                  {isTa ? "ரத்து" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold min-h-[40px] font-tamil shadow-xs"
                >
                  {isTa ? "வெளியிடுக" : "Publish Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
