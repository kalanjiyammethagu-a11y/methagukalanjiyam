"use client";

import * as React from "react";
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

export interface AdminAnnouncementRecord {
  id: string;
  date_label: string;
  date_label_en?: string | null;
  date_label_ta?: string | null;
  title_en: string;
  title_ta: string;
  desc_en: string;
  desc_ta: string;
  link_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AnnouncementsManagerProps {
  onToast: (msg: string) => void;
}

export function AnnouncementsManager({ onToast }: AnnouncementsManagerProps) {
  const [announcements, setAnnouncements] = React.useState<AdminAnnouncementRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [reordering, setReordering] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<AdminAnnouncementRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminAnnouncementRecord | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    date_label_en: "",
    date_label_ta: "",
    title_en: "",
    title_ta: "",
    desc_en: "",
    desc_ta: "",
    link_url: "",
    sort_order: 1,
    is_active: true,
  });

  const fetchAnnouncements = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
          setLoading(false);
          return;
        }
      }
      onToast("Failed to load recent announcements.");
    } catch {
      onToast("Network error loading recent announcements.");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  React.useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

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

  const openAddModal = () => {
    setEditingItem(null);
    setFormError(null);
    const today = new Date();
    const formattedEn = today.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const formattedTa = today.toLocaleDateString("ta-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    setFormData({
      date_label_en: formattedEn,
      date_label_ta: formattedTa,
      title_en: "",
      title_ta: "",
      desc_en: "",
      desc_ta: "",
      link_url: "",
      sort_order: announcements.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: AdminAnnouncementRecord) => {
    setEditingItem(item);
    setFormError(null);
    setFormData({
      date_label_en: item.date_label_en || item.date_label || "",
      date_label_ta: item.date_label_ta || item.date_label || "",
      title_en: item.title_en || "",
      title_ta: item.title_ta || "",
      desc_en: item.desc_en || "",
      desc_ta: item.desc_ta || "",
      link_url: item.link_url || "",
      sort_order: item.sort_order ?? 1,
      is_active: item.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.date_label_en.trim() && !formData.date_label_ta.trim()) {
      setFormError("Please enter a date label in English or Tamil.");
      return;
    }
    if (!formData.title_en.trim() && !formData.title_ta.trim()) {
      setFormError("Please enter a title in English or Tamil.");
      return;
    }
    if (!formData.desc_en.trim() && !formData.desc_ta.trim()) {
      setFormError("Please enter a description in English or Tamil.");
      return;
    }

    setSaving(true);
    const cleanDateTa = formData.date_label_ta.trim() || formData.date_label_en.trim();
    const cleanDateEn = formData.date_label_en.trim() || formData.date_label_ta.trim();
    const payload = {
      ...(editingItem ? { id: editingItem.id } : {}),
      date_label: cleanDateTa,
      date_label_en: cleanDateEn,
      date_label_ta: cleanDateTa,
      title_en: formData.title_en.trim() || formData.title_ta.trim(),
      title_ta: formData.title_ta.trim() || formData.title_en.trim(),
      desc_en: formData.desc_en.trim() || formData.desc_ta.trim(),
      desc_ta: formData.desc_ta.trim() || formData.desc_en.trim(),
      link_url: formData.link_url.trim() || null,
      sort_order: Number(formData.sort_order) || 0,
      is_active: formData.is_active,
    };

    try {
      const res = await fetch("/api/admin/announcements", {
        method: editingItem ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || "Failed to save announcement.";
        setFormError(msg);
        onToast(msg);
        return;
      }

      if (editingItem && data.announcement) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingItem.id ? data.announcement : a))
        );
        onToast("Announcement updated.");
      } else if (data.announcement) {
        setAnnouncements((prev) =>
          [...prev, data.announcement].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        );
        onToast("Announcement created and published.");
      }
      setIsModalOpen(false);
    } catch {
      setFormError("Network error saving announcement.");
      onToast("Network error saving announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: AdminAnnouncementRecord) => {
    const nextActive = !item.is_active;
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, is_active: nextActive } : a))
    );
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_active: nextActive }),
      });
      if (!res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, is_active: item.is_active } : a))
        );
        onToast("Failed to update visibility.");
        return;
      }
      onToast(nextActive ? "Announcement is now live on Home & /blog." : "Announcement hidden.");
    } catch {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, is_active: item.is_active } : a))
      );
      onToast("Network error updating announcement.");
    }
  };

  const handleMove = async (index: number, delta: -1 | 1) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= announcements.length) return;
    const previous = announcements;
    const reordered = [...announcements];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);
    const updated = reordered.map((item, idx) => ({ ...item, sort_order: idx + 1 }));

    setAnnouncements(updated);
    setReordering(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: updated.map((a) => a.id) }),
      });
      if (!res.ok) {
        setAnnouncements(previous);
        onToast("Failed to save announcement order.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.announcements) && data.announcements.length > 0) {
        setAnnouncements(data.announcements);
      }
      onToast("Announcement order updated.");
    } catch {
      setAnnouncements(previous);
      onToast("Network error updating announcement order.");
    } finally {
      setReordering(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/announcements?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        onToast("Announcement deleted.");
        setDeleteTarget(null);
      } else {
        const data = await res.json().catch(() => ({}));
        onToast(data.error || "Failed to delete announcement.");
      }
    } catch {
      onToast("Network error deleting announcement.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Banner Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-[#0A6847] flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Recent Announcements Banner (`/blog`)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Create, edit, reorder, or hide the announcement cards highlighted at the top of the Articles & News page.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[42px] shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center text-xs text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0A6847]" />
          Loading recent announcements...
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center space-y-3">
          <Bell className="h-8 w-8 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-700">No announcements configured yet</p>
          <p className="text-xs text-gray-400">
            Add an announcement to display news updates in the Recent Announcements section on `/blog`.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A6847] text-white text-xs font-bold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Announcement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {announcements.map((item, idx) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between gap-4 transition-all ${
                item.is_active ? "border-gray-200" : "border-gray-200 opacity-65 bg-gray-50"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#0A6847] font-tamil">
                    {item.date_label_ta || item.date_label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                      item.is_active
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-gray-100 text-gray-600 border-gray-300"
                    }`}
                  >
                    {item.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <span>{item.is_active ? "Visible" : "Hidden"}</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900 leading-snug">
                    {item.title_en}
                  </h4>
                  {item.title_ta && item.title_ta !== item.title_en && (
                    <p className="text-xs font-semibold text-[#0A6847] font-tamil leading-snug">
                      {item.title_ta}
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {item.desc_en}
                </p>
                {item.desc_ta && item.desc_ta !== item.desc_en && (
                  <p className="text-[11px] text-gray-500 font-tamil leading-relaxed line-clamp-2">
                    {item.desc_ta}
                  </p>
                )}

                {item.link_url && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[200px]">{item.link_url}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={reordering || idx === 0}
                    onClick={() => handleMove(idx, -1)}
                    className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-35 text-gray-600 flex items-center justify-center cursor-pointer"
                    title="Move earlier"
                    aria-label="Move announcement up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={reordering || idx === announcements.length - 1}
                    onClick={() => handleMove(idx, 1)}
                    className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-35 text-gray-600 flex items-center justify-center cursor-pointer"
                    title="Move later"
                    aria-label="Move announcement down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-gray-400 pl-1">#{idx + 1}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-[#0A6847] hover:text-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Edit announcement"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-rose-600 hover:text-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete announcement"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingItem ? "Edit Recent Announcement" : "New Recent Announcement"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Appears in the Recent Announcements section on the public `/blog` page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold"
                >
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Date Label (English)</label>
                  <input
                    type="text"
                    value={formData.date_label_en}
                    onChange={(e) => setFormData({ ...formData, date_label_en: e.target.value })}
                    placeholder="e.g. 07 August 2026"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 font-tamil">
                    தேதி (Date Label in Tamil)
                  </label>
                  <input
                    type="text"
                    value={formData.date_label_ta}
                    onChange={(e) => setFormData({ ...formData, date_label_ta: e.target.value })}
                    placeholder="எ.கா. 07 ஆகஸ்ட் 2026"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-tamil min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Title (English) *</label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    placeholder="New Book Release: ..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 font-tamil">
                    தலைப்பு (Title in Tamil)
                  </label>
                  <input
                    type="text"
                    value={formData.title_ta}
                    onChange={(e) => setFormData({ ...formData, title_ta: e.target.value })}
                    placeholder="புதிய நூல் வெளியீடு: ..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-tamil min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Description (English) *</label>
                  <textarea
                    rows={3}
                    value={formData.desc_en}
                    onChange={(e) => setFormData({ ...formData, desc_en: e.target.value })}
                    placeholder="Short announcement summary in English..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 font-tamil">
                    விளக்கம் (Description in Tamil)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.desc_ta}
                    onChange={(e) => setFormData({ ...formData, desc_ta: e.target.value })}
                    placeholder="தமிழில் சிறு அறிவிப்புச் சுருக்கம்..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-tamil leading-[1.6] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-700">Optional Target Link</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="/books/katunayake-attack-victory (optional)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono min-h-[42px] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Visibility</label>
                  <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 min-h-[42px] cursor-pointer text-xs font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 accent-[#0A6847]"
                    />
                    <span>Show on /blog</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 min-h-[40px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#0A6847] hover:bg-[#085036] disabled:opacity-60 text-white text-xs font-bold min-h-[40px] flex items-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingItem ? "Save Changes" : "Publish Announcement"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Delete announcement &ldquo;{deleteTarget.title_en || deleteTarget.title_ta}&rdquo;?
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              This will permanently remove this announcement from the public Recent Announcements banner.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 min-h-[40px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[40px] flex items-center gap-2 cursor-pointer"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
