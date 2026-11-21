"use client";

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
  Check,
  AlertTriangle,
  UserCheck,
  UserX,
  ExternalLink,
} from "lucide-react";
import { mockSupporters } from "@/data/admin-mock";
import type { AdminSupporter } from "@/types/admin";

interface MemberFormData {
  id?: string;
  nameEn: string;
  nameTa: string;
  roleEn: string;
  roleTa: string;
  image: string;
  instagramUrl: string;
  whatsappUrl: string;
  isActive: boolean;
}

const initialFormData: MemberFormData = {
  nameEn: "",
  nameTa: "",
  roleEn: "",
  roleTa: "",
  image: "/images/supporters/harvin.webp",
  instagramUrl: "",
  whatsappUrl: "",
  isActive: true,
};

export default function AdminSupportersPage() {
  const [supporters, setSupporters] = React.useState<AdminSupporter[]>(mockSupporters);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminSupporter | null>(null);
  const [formData, setFormData] = React.useState<MemberFormData>(initialFormData);
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
          if (data.supporters && data.supporters.length > 0) {
            setSupporters(data.supporters);
          }
        }
      } catch {
        // Fallback to initial mock state
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
        setFormData((prev) => ({ ...prev, image: result.path }));
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
      await fetch("/api/admin/supporters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: supporterId, isActive: nextActive }),
      });
    } catch {
      // Revert on error
      setSupporters((prev) =>
        prev.map((s) => (s.id === supporterId ? { ...s, isActive: !nextActive } : s))
      );
      showToast("Failed to update status on server.");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (supporter: AdminSupporter) => {
    setFormData({
      id: supporter.id,
      nameEn: supporter.nameEn,
      nameTa: supporter.nameTa,
      roleEn: supporter.roleEn,
      roleTa: supporter.roleTa,
      image: supporter.image,
      instagramUrl: supporter.instagramUrl || "",
      whatsappUrl: supporter.whatsappUrl || "",
      isActive: supporter.isActive,
    });
    setIsEditOpen(true);
  };

  // Submit Create Member
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn && !formData.nameTa) {
      showToast("Please enter a name for the member.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/supporters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const result = await res.json();
        setSupporters((prev) => [result.supporter, ...prev]);
        setIsAddOpen(false);
        setFormData(initialFormData);
        showToast("New member added to roster successfully!");
      } else {
        showToast("Failed to save member.");
      }
    } catch {
      // Offline fallback
      const localMember: AdminSupporter = {
        id: `sup-${Date.now()}`,
        nameEn: formData.nameEn || formData.nameTa,
        nameTa: formData.nameTa || formData.nameEn,
        roleEn: formData.roleEn || "Archival Contributor",
        roleTa: formData.roleTa || "ஆவணப் பங்களிப்பாளர்",
        image: formData.image,
        instagramUrl: formData.instagramUrl || undefined,
        whatsappUrl: formData.whatsappUrl || undefined,
        isActive: formData.isActive,
        joinedAt: new Date().toISOString().split("T")[0],
      };
      setSupporters((prev) => [localMember, ...prev]);
      setIsAddOpen(false);
      setFormData(initialFormData);
      showToast("Member saved locally!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Member
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/supporters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const result = await res.json();
        setSupporters((prev) =>
          prev.map((s) => (s.id === formData.id ? result.supporter : s))
        );
        setIsEditOpen(false);
        showToast("Member updated successfully!");
      } else {
        showToast("Failed to update member.");
      }
    } catch {
      // Offline fallback
      setSupporters((prev) =>
        prev.map((s) =>
          s.id === formData.id
            ? {
                ...s,
                nameEn: formData.nameEn,
                nameTa: formData.nameTa,
                roleEn: formData.roleEn,
                roleTa: formData.roleTa,
                image: formData.image,
                instagramUrl: formData.instagramUrl || undefined,
                whatsappUrl: formData.whatsappUrl || undefined,
                isActive: formData.isActive,
              }
            : s
        )
      );
      setIsEditOpen(false);
      showToast("Member updated locally!");
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
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.nameEn.toLowerCase().includes(q) ||
      s.nameTa.toLowerCase().includes(q) ||
      s.roleEn.toLowerCase().includes(q) ||
      s.roleTa.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.isActive) ||
      (statusFilter === "inactive" && !s.isActive);

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
          onClick={() => {
            setFormData(initialFormData);
            setIsAddOpen(true);
          }}
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
          {(["all", "active", "inactive"] as const).map((filter) => (
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
              {filter === "all" ? `All (${totalCount})` : filter === "active" ? `Active (${activeCount})` : `Inactive (${inactiveCount})`}
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
                    src={s.image || "/images/supporters/harvin.webp"}
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

                  <p className="text-xs text-[#0A6847] font-semibold mt-1 leading-snug line-clamp-1">
                    {s.roleEn || s.roleTa}
                  </p>

                  <p className="text-[10px] text-gray-400 font-mono mt-1.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>Joined: {s.joinedAt}</span>
                  </p>
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
                      className="h-8 w-8 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 flex items-center justify-center transition-colors min-h-[32px] min-w-[32px]"
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
                      className="h-8 w-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors min-h-[32px] min-w-[32px]"
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
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
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
                    className="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer min-h-[36px] min-w-[36px]"
                    title="Edit Member Details"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(s)}
                    className="h-9 w-9 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer min-h-[36px] min-w-[36px]"
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
          ADD MEMBER MODAL
          ========================================================================= */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:p-6 pb-4 shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Add New Team Member</h2>
                <p className="text-xs text-gray-500 mt-0.5">Publish a contributor or patron on the roster.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer min-h-[44px] min-w-[44px]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Profile Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                    <Image
                      src={formData.image || "/images/supporters/harvin.webp"}
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
                      <span>{uploadProgress ? "Uploading..." : "Upload New Photo"}</span>
                    </button>
                    <p className="text-[11px] text-gray-400 mt-1">Accepts JPG, PNG, WebP up to 5 MB.</p>
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="e.g. Deepak Harvin"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Name (Tamil)</label>
                  <input
                    type="text"
                    value={formData.nameTa}
                    onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
                    placeholder="e.g. தீபக் ஹார்வின்"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Roles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Role / Title (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roleEn}
                    onChange={(e) => setFormData({ ...formData, roleEn: e.target.value })}
                    placeholder="e.g. Archival Documenter"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Role / Title (Tamil)</label>
                  <input
                    type="text"
                    value={formData.roleTa}
                    onChange={(e) => setFormData({ ...formData, roleTa: e.target.value })}
                    placeholder="e.g. ஆவணப் பதிவாளர்"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  />
                </div>
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
                  <div className="text-xs font-bold text-gray-900">Publish Immediately</div>
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
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer min-h-[44px]"
              >
                {isSubmitting ? "Saving..." : "Add to Roster"}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* =========================================================================
          EDIT MEMBER MODAL
          ========================================================================= */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:p-6 pb-4 shrink-0">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Edit Member Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">Update team role, credentials, and social channels.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer min-h-[44px] min-w-[44px]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                    <Image
                      src={formData.image || "/images/supporters/harvin.webp"}
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
                      <span>{uploadProgress ? "Uploading..." : "Replace Photo"}</span>
                    </button>
                    <p className="text-[11px] text-gray-400 mt-1">Accepts JPG, PNG, WebP up to 5 MB.</p>
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Name (Tamil)</label>
                  <input
                    type="text"
                    value={formData.nameTa}
                    onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Roles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Role / Title (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roleEn}
                    onChange={(e) => setFormData({ ...formData, roleEn: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Role / Title (Tamil)</label>
                  <input
                    type="text"
                    value={formData.roleTa}
                    onChange={(e) => setFormData({ ...formData, roleTa: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  />
                </div>
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
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <div className="text-xs font-bold text-gray-900">Member Status</div>
                  <div className="text-[11px] text-gray-500">Visible to visitors on public website</div>
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
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer min-h-[44px]"
              >
                {isSubmitting ? "Updating..." : "Save Changes"}
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
