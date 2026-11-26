"use client";
import { getSupabaseStorageUrl } from "@/lib/book-images";

import * as React from "react";
import Image from "next/image";
import {
  Users,
  Search,
  CheckCircle2,
  Instagram,
  MessageCircle,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  X,
  UploadCloud,
  AlertTriangle,
  UserCheck,
  UserX,
} from "lucide-react";
import type { AdminSupporter } from "@/types/admin";
import {
  buildBilingualSearchText,
  getLanguageCompleteness,
  REQUIRE_BOTH_LANGUAGES_TO_PUBLISH,
  type AppLocale,
} from "@/lib/i18n";
import { BilingualListBadge, BilingualTabs } from "@/components/admin/BilingualTabs";

const SUPPORTER_REQUIRED_BILINGUAL_FIELDS = ["name", "role"];

interface MemberFormData {
  id?: string;
  nameEn: string;
  nameTa: string;
  roleEn: string;
  roleTa: string;
  taglineEn: string;
  taglineTa: string;
  descriptionEn: string;
  descriptionTa: string;
  photoAltEn: string;
  photoAltTa: string;
  image: string;
  logo_or_photo_path?: string;
  logo_or_photo_url?: string;
  status: "draft" | "published";
  instagramUrl: string;
  whatsappUrl: string;
  isActive: boolean;
}

const initialFormData: MemberFormData = {
  nameEn: "",
  nameTa: "",
  roleEn: "",
  roleTa: "",
  taglineEn: "",
  taglineTa: "",
  descriptionEn: "",
  descriptionTa: "",
  photoAltEn: "",
  photoAltTa: "",
  image: getSupabaseStorageUrl("supporters", "harvin.webp"),
  logo_or_photo_path: "",
  logo_or_photo_url: "",
  status: "published",
  instagramUrl: "",
  whatsappUrl: "",
  isActive: true,
};

export default function AdminSupportersPage() {
  const [supporters, setSupporters] = React.useState<AdminSupporter[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive" | "missing_tamil">("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modals state
  const [modalMode, setModalMode] = React.useState<"add" | "edit" | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminSupporter | null>(null);
  const [formData, setFormData] = React.useState<MemberFormData>(initialFormData);
  const [activeLangTab, setActiveLangTab] = React.useState<AppLocale>("en");
  const initialLangSnapshotRef = React.useRef({
    en: { nameEn: "", roleEn: "", taglineEn: "", descriptionEn: "", photoAltEn: "" },
    ta: { nameTa: "", roleTa: "", taglineTa: "", descriptionTa: "", photoAltTa: "" },
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch supporters on mount
  React.useEffect(() => {
    async function loadSupporters() {
      try {
        const res = await fetch("/api/admin/supporters");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.supporters)) {
            setSupporters(data.supporters);
            return;
          }
        }
        showToast("Failed to load supporters from Supabase.");
      } catch {
        showToast("Network error loading supporters.");
      }
    }
    loadSupporters();
  }, []);

  // Handle Photo File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "supporters");

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        const result = await res.json();
        setFormData((prev) => ({
          ...prev,
          image: result.publicUrl || result.path,
          logo_or_photo_url: result.publicUrl || result.path,
          logo_or_photo_path: result.path,
        }));
        showToast("Profile photo uploaded successfully!");
      } else {
        showToast("Photo upload failed. Using default image.");
      }
    } catch {
      showToast("Error uploading photo.");
    } finally {
      setUploadProgress(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (supporterId: string) => {
    const current = supporters.find((s) => s.id === supporterId);
    if (!current) return;

    const nextActive = !current.isActive;
    // Optimistic UI update
    setSupporters((prev) =>
      prev.map((s) => (s.id === supporterId ? { ...s, isActive: nextActive } : s))
    );
    showToast(nextActive ? "Member activated!" : "Member deactivated!");

    try {
      const res = await fetch("/api/admin/supporters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: supporterId, isActive: nextActive }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSupporters((prev) =>
          prev.map((s) => (s.id === supporterId ? { ...s, isActive: !nextActive } : s))
        );
        showToast(err.error || "Failed to update status on server.");
      }
    } catch {
      // Revert on error
      setSupporters((prev) =>
        prev.map((s) => (s.id === supporterId ? { ...s, isActive: !nextActive } : s))
      );
      showToast("Failed to update status on server.");
    }
  };

  const setSnapshotFromForm = (data: MemberFormData) => {
    initialLangSnapshotRef.current = {
      en: {
        nameEn: data.nameEn,
        roleEn: data.roleEn,
        taglineEn: data.taglineEn,
        descriptionEn: data.descriptionEn,
        photoAltEn: data.photoAltEn,
      },
      ta: {
        nameTa: data.nameTa,
        roleTa: data.roleTa,
        taglineTa: data.taglineTa,
        descriptionTa: data.descriptionTa,
        photoAltTa: data.photoAltTa,
      },
    };
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData(initialFormData);
    setSnapshotFromForm(initialFormData);
    setActiveLangTab("en");
    setModalMode("add");
  };

  // Open Edit Modal
  const handleOpenEdit = (supporter: AdminSupporter) => {
    const populated: MemberFormData = {
      id: supporter.id,
      nameEn: supporter.nameEn || "",
      nameTa: supporter.nameTa || "",
      roleEn: supporter.roleEn || "",
      roleTa: supporter.roleTa || "",
      taglineEn: supporter.taglineEn || supporter.tagline || "",
      taglineTa: supporter.taglineTa || "",
      descriptionEn: supporter.descriptionEn || supporter.description || "",
      descriptionTa: supporter.descriptionTa || "",
      photoAltEn: supporter.photoAltEn || "",
      photoAltTa: supporter.photoAltTa || "",
      image: supporter.image,
      logo_or_photo_path: supporter.logo_or_photo_path || "",
      logo_or_photo_url: supporter.logo_or_photo_url || supporter.image,
      status: supporter.status || (supporter.isActive ? "published" : "draft"),
      instagramUrl: supporter.instagramUrl || "",
      whatsappUrl: supporter.whatsappUrl || "",
      isActive: supporter.isActive,
    };
    setFormData(populated);
    setSnapshotFromForm(populated);
    setActiveLangTab("en");
    setModalMode("edit");
  };

  const formCompleteness = React.useMemo(
    () => getLanguageCompleteness(formData as unknown as Record<string, unknown>, SUPPORTER_REQUIRED_BILINGUAL_FIELDS),
    [formData]
  );

  const isActiveTabDirty = React.useMemo(() => {
    const snap = initialLangSnapshotRef.current;
    if (activeLangTab === "en") {
      return (
        formData.nameEn !== snap.en.nameEn ||
        formData.roleEn !== snap.en.roleEn ||
        formData.taglineEn !== snap.en.taglineEn ||
        formData.descriptionEn !== snap.en.descriptionEn ||
        formData.photoAltEn !== snap.en.photoAltEn
      );
    }
    return (
      formData.nameTa !== snap.ta.nameTa ||
      formData.roleTa !== snap.ta.roleTa ||
      formData.taglineTa !== snap.ta.taglineTa ||
      formData.descriptionTa !== snap.ta.descriptionTa ||
      formData.photoAltTa !== snap.ta.photoAltTa
    );
  }, [activeLangTab, formData]);

  // Unified Create / Edit Submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn.trim() || !formData.roleEn.trim()) {
      setActiveLangTab("en");
      showToast("English name and English role are required.");
      return;
    }
    if (
      REQUIRE_BOTH_LANGUAGES_TO_PUBLISH &&
      formData.isActive &&
      (!formData.nameTa.trim() || !formData.roleTa.trim())
    ) {
      setActiveLangTab("ta");
      showToast("Tamil name and Tamil role are required before publishing.");
      return;
    }

    const payload = {
      ...formData,
      name: formData.nameEn.trim(),
      name_en: formData.nameEn.trim(),
      name_ta: formData.nameTa.trim() || null,
      role_en: formData.roleEn.trim(),
      role_ta: formData.roleTa.trim() || null,
      tagline_en: formData.taglineEn.trim() || null,
      tagline_ta: formData.taglineTa.trim() || null,
      description_en: formData.descriptionEn.trim() || null,
      description_ta: formData.descriptionTa.trim() || null,
      photo_alt_en: formData.photoAltEn.trim() || null,
      photo_alt_ta: formData.photoAltTa.trim() || null,
      status: formData.isActive ? "published" : "draft",
    };

    setIsSubmitting(true);
    try {
      if (modalMode === "edit" && formData.id) {
        const res = await fetch("/api/admin/supporters", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const result = await res.json();
          setSupporters((prev) => prev.map((s) => (s.id === formData.id ? result.supporter : s)));
          setModalMode(null);
          showToast("Member updated successfully!");
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.error || "Failed to update member.");
        }
      } else {
        const res = await fetch("/api/admin/supporters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const result = await res.json();
          setSupporters((prev) => [result.supporter, ...prev]);
          setModalMode(null);
          setFormData(initialFormData);
          showToast("New member added to roster successfully!");
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.error || "Failed to save member.");
        }
      }
    } catch {
      showToast("Network error saving member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await fetch(`/api/admin/supporters?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
    } catch {
      // Ignore
    }

    setSupporters((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast("Member removed from roster.");
  };

  const filteredSupporters = supporters.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const corpus = buildBilingualSearchText(s as unknown as Record<string, unknown>, [
      "name",
      "role",
      "tagline",
      "description",
    ]);
    const matchesSearch = !q || corpus.includes(q);
    const langComp = getLanguageCompleteness(
      s as unknown as Record<string, unknown>,
      SUPPORTER_REQUIRED_BILINGUAL_FIELDS
    );

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.isActive) ||
      (statusFilter === "inactive" && !s.isActive) ||
      (statusFilter === "missing_tamil" && langComp.missingTamil);

    return matchesSearch && matchesStatus;
  });

  const totalCount = supporters.length;
  const activeCount = supporters.filter((s) => s.isActive).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Team & Patron Roster Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage archival contributors, leadership, and public patrons displayed on the supporters portal.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500">Total Members</div>
            <div className="text-xl font-extrabold text-gray-900 mt-0.5">{totalCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500">Active Patrons</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{activeCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500">Inactive / Hidden</div>
            <div className="text-xl font-extrabold text-gray-600 mt-0.5">{inactiveCount}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, or social handle..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(["all", "active", "inactive", "missing_tamil"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer min-h-[40px] whitespace-nowrap ${
                statusFilter === filter
                  ? "bg-[#0A6847] text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter === "all"
                ? `All (${totalCount})`
                : filter === "active"
                ? `Active (${activeCount})`
                : filter === "inactive"
                ? `Inactive (${inactiveCount})`
                : "Missing Tamil"}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      {filteredSupporters.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center space-y-3">
          <Users className="h-10 w-10 text-gray-300 mx-auto" />
          <div className="text-sm font-bold text-gray-700">No members found matching your search.</div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="text-xs font-semibold text-[#0A6847] hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSupporters.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs flex flex-col justify-between gap-4 hover:shadow-md transition-shadow group relative"
            >
              <div className="flex items-start gap-3.5">
                {/* Avatar with fallback */}
                <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0 shadow-2xs">
                  <Image
                    src={s.image || getSupabaseStorageUrl("supporters", "harvin.webp")}
                    alt={s.nameEn || s.nameTa}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div
                    className={`absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white ${
                      s.isActive ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-bold text-sm text-gray-900 truncate" title={s.nameEn}>
                      {s.nameEn || s.nameTa}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 border ${
                        s.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {s.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>

                  {s.nameTa && s.nameTa !== s.nameEn && (
                    <div className="text-[11px] text-gray-400 font-tamil truncate">
                      {s.nameTa}
                    </div>
                  )}

                  <p className="text-xs text-[#0A6847] font-semibold mt-1 leading-snug line-clamp-1 font-tamil">
                    {s.roleEn || s.roleTa}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <BilingualListBadge
                      completeness={getLanguageCompleteness(
                        s as unknown as Record<string, unknown>,
                        SUPPORTER_REQUIRED_BILINGUAL_FIELDS
                      )}
                    />
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>{s.joinedAt}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Social Channels & Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {s.instagramUrl && (
                    <a
                      href={s.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]"
                      title="Open Instagram"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {s.whatsappUrl && (
                    <a
                      href={s.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]"
                      title="Open WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(s.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[44px] sm:min-h-[36px] flex items-center justify-center ${
                      s.isActive
                        ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                    }`}
                    title="Toggle active on public roster"
                  >
                    {s.isActive ? "Active" : "Inactive"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    className="h-10 w-10 sm:h-9 sm:w-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]"
                    title="Edit Member Details"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(s)}
                    className="h-10 w-10 sm:h-9 sm:w-9 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]"
                    title="Remove Member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          UNIFIED ADD / EDIT MEMBER MODAL (Dual-Language Tabs)
          ========================================================================= */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:p-6 pb-4 shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {modalMode === "edit" ? "Edit Member Details" : "Add New Team Member"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {modalMode === "edit"
                    ? "Update team role, bilingual details, and social channels."
                    : "Publish a bilingual contributor or patron profile on the roster."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer min-h-[44px] min-w-[44px]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {/* Profile Photo Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                      <Image
                        src={formData.image || getSupabaseStorageUrl("supporters", "harvin.webp")}
                        alt="Preview"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadProgress}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
                      >
                        <UploadCloud className="h-4 w-4 text-gray-500" />
                        <span>{uploadProgress ? "Uploading..." : modalMode === "edit" ? "Replace Photo" : "Upload New Photo"}</span>
                      </button>
                      <p className="text-[11px] text-gray-400 mt-1">Accepts JPG, PNG, WebP up to 5 MB.</p>
                    </div>
                  </div>
                </div>

                {/* Dual-Language Text Tabs (English | தமிழ்) */}
                <div className="rounded-2xl border border-gray-200 p-4 space-y-3.5">
                  <BilingualTabs
                    activeTab={activeLangTab}
                    onTabChange={setActiveLangTab}
                    completeness={formCompleteness}
                    isActiveTabDirty={isActiveTabDirty}
                  />

                  {activeLangTab === "en" ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Name (English) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.nameEn}
                          onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                          placeholder="e.g. Deepak Harvin"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Role / Title (English) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.roleEn}
                          onChange={(e) => setFormData({ ...formData, roleEn: e.target.value })}
                          placeholder="e.g. Archival Documenter"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Photo Alt Text (English)</label>
                        <input
                          type="text"
                          value={formData.photoAltEn}
                          onChange={(e) => setFormData({ ...formData, photoAltEn: e.target.value })}
                          placeholder="Portrait photo of member"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 font-tamil mb-1">பெயர் (Name in Tamil)</label>
                        <input
                          type="text"
                          value={formData.nameTa}
                          onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
                          placeholder="e.g. தீபக் ஹார்வின்"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 font-tamil mb-1">பதவி / பங்களிப்பு (Role in Tamil)</label>
                        <input
                          type="text"
                          value={formData.roleTa}
                          onChange={(e) => setFormData({ ...formData, roleTa: e.target.value })}
                          placeholder="e.g. ஆவணப் பதிவாளர்"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 font-tamil mb-1">பட விவரம் (Photo Alt in Tamil)</label>
                        <input
                          type="text"
                          value={formData.photoAltTa}
                          onChange={(e) => setFormData({ ...formData, photoAltTa: e.target.value })}
                          placeholder="உறுப்பினர் நிழற்படம்"
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Channels */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Instagram URL</label>
                    <div className="relative">
                      <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-600" />
                      <input
                        type="url"
                        value={formData.instagramUrl}
                        onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                        placeholder="https://www.instagram.com/handle"
                        className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Link or Number</label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                      <input
                        type="text"
                        value={formData.whatsappUrl}
                        onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
                        placeholder="https://wa.me/918248654946"
                        className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div>
                    <div className="text-xs font-bold text-gray-900">Member Visibility</div>
                    <div className="text-[11px] text-gray-500">Show this member on the public supporters page</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-5 w-5 rounded text-[#0A6847] focus:ring-[#0A6847] cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer min-h-[44px]"
                >
                  {isSubmitting
                    ? "Saving..."
                    : modalMode === "edit"
                    ? "Save Changes"
                    : "Add to Roster"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Remove Team Member?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to remove{" "}
                <span className="font-bold text-gray-900">{deleteTarget.nameEn}</span> from the roster? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer min-h-[44px]"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
