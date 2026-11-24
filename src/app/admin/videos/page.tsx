"use client";

import * as React from "react";
import Image from "next/image";
import {
  Film,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  Play,
  Clock,
  HardDrive,
  FileVideo,
  Globe,
  ExternalLink,
} from "lucide-react";
import type { AdminVideoItem } from "@/app/api/admin/videos/route";

interface VideoFormData {
  id?: string;
  title: string;
  slug: string;
  description: string;
  sourceType: "upload" | "embed";
  video_path: string;
  video_url: string;
  embed_url: string;
  poster_path: string;
  poster_url: string;
  duration_seconds: number;
  file_size_bytes: number;
  mime_type: string;
  sort_order: number;
  status: "draft" | "published";
  is_active: boolean;
}

const initialFormData: VideoFormData = {
  title: "",
  slug: "",
  description: "",
  sourceType: "upload",
  video_path: "",
  video_url: "",
  embed_url: "",
  poster_path: "",
  poster_url: "https://yxghkhizyjsfrevtekbc.supabase.co/storage/v1/object/public/video-posters/1.webp",
  duration_seconds: 0,
  file_size_bytes: 0,
  mime_type: "video/mp4",
  sort_order: 0,
  status: "published",
  is_active: true,
};

export default function AdminVideosPage() {
  const [videos, setVideos] = React.useState<AdminVideoItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft">("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminVideoItem | null>(null);
  const [formData, setFormData] = React.useState<VideoFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Upload progress states
  const [videoUploadProgress, setVideoUploadProgress] = React.useState<number | null>(null);
  const [posterUploadProgress, setPosterUploadProgress] = React.useState(false);
  const [uploadWarning, setUploadWarning] = React.useState<string | null>(null);

  const posterInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load videos on mount
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/videos");
      if (res.ok) {
        const data = await res.json();
        if (data.videos) {
          setVideos(data.videos);
        }
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchVideos();
  }, []);

  // Handle Poster Image Upload
  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPosterUploadProgress(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "video-posters");

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        const result = await res.json();
        setFormData((prev) => ({
          ...prev,
          poster_url: result.publicUrl || result.path,
          poster_path: result.path,
        }));
        showToast("Poster thumbnail uploaded successfully!");
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Poster upload failed.");
      }
    } catch {
      showToast("Error uploading poster image.");
    } finally {
      setPosterUploadProgress(false);
    }
  };

  // Handle Direct Video Upload using Supabase Signed Upload URL
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 50MB free tier warning
    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > 50) {
      setUploadWarning(
        `File size is ${sizeInMb.toFixed(1)} MB. Supabase Free tier allows up to 50 MB per file. Pro tier allows 500 MB.`
      );
    } else {
      setUploadWarning(null);
    }

    try {
      setVideoUploadProgress(5);

      // Step 1: Request signed upload URL from admin API
      const signRes = await fetch("/api/admin/videos/signed-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "video/mp4",
          fileSize: file.size,
        }),
      });

      if (!signRes.ok) {
        const err = await signRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate signed upload URL");
      }

      const { signedUrl, path, publicUrl } = await signRes.json();

      // Step 2: Direct-to-storage upload using XMLHttpRequest with progress events
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 90) + 5;
            setVideoUploadProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Direct storage upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during direct storage upload"));
        xhr.send(file);
      });

      setVideoUploadProgress(100);

      // Update form state with uploaded video metadata
      setFormData((prev) => ({
        ...prev,
        video_path: path,
        video_url: publicUrl,
        embed_url: publicUrl,
        file_size_bytes: file.size,
        mime_type: file.type || "video/mp4",
      }));

      showToast("Video file uploaded directly to Supabase Storage!");
    } catch (err: any) {
      console.error("Video upload error:", err);
      showToast(err.message || "Failed to upload video file.");
    } finally {
      setTimeout(() => setVideoUploadProgress(null), 1500);
    }
  };

  // Toggle Video Status (published / draft)
  const handleToggleStatus = async (videoId: string, currentStatus: "published" | "draft") => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, status: nextStatus, is_active: nextStatus === "published" } : v))
    );
    showToast(`Video marked as ${nextStatus}!`);

    try {
      await fetch("/api/admin/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoId, status: nextStatus, is_active: nextStatus === "published" }),
      });
    } catch {
      fetchVideos();
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (v: AdminVideoItem) => {
    setFormData({
      id: v.id,
      title: v.title,
      slug: v.slug,
      description: v.description,
      sourceType: v.video_url ? "upload" : "embed",
      video_path: v.video_path || "",
      video_url: v.video_url || "",
      embed_url: v.embed_url || "",
      poster_path: v.poster_path || "",
      poster_url: v.poster_url,
      duration_seconds: v.duration_seconds || 0,
      file_size_bytes: v.file_size_bytes || 0,
      mime_type: v.mime_type || "video/mp4",
      sort_order: v.sort_order,
      status: v.status,
      is_active: v.is_active,
    });
    setUploadWarning(null);
    setIsEditOpen(true);
  };

  // Submit Create Video
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Please enter a video title.");
      return;
    }
    if (!formData.poster_url) {
      showToast("Poster thumbnail is required.");
      return;
    }
    if (!formData.video_url && !formData.embed_url) {
      showToast("Please provide an uploaded video or embed URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const result = await res.json();
        setVideos((prev) => [result.video, ...prev]);
        setIsAddOpen(false);
        setFormData(initialFormData);
        showToast("Video added and published successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to save video.");
      }
    } catch {
      showToast("Network error saving video.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Video
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const result = await res.json();
        setVideos((prev) => prev.map((v) => (v.id === formData.id ? result.video : v)));
        setIsEditOpen(false);
        showToast("Video updated successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to update video.");
      }
    } catch {
      showToast("Network error updating video.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await fetch(`/api/admin/videos?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      setVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      showToast("Video and associated storage assets deleted.");
    } catch {
      showToast("Failed to delete video.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredVideos = videos.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      v.title.toLowerCase().includes(q) ||
      v.slug.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && v.status === "published") ||
      (statusFilter === "draft" && v.status === "draft");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Film className="h-6 w-6 text-[#0A6847]" />
            Video Archival CMS
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Upload historical documentaries directly to Supabase Storage or configure embeds
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
          Add Video Entry
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by title, slug, or description..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "published", "draft"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer min-h-[44px] ${
                statusFilter === st
                  ? "bg-[#0A6847] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Videos List Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading videos...</div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">No videos found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Video</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVideos.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-24 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          <Image
                            src={
                              v.poster_url?.startsWith("http") || v.poster_url?.startsWith("/")
                                ? v.poster_url
                                : `/${v.poster_url}`
                            }
                            alt={v.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="space-y-0.5 max-w-xs">
                          <div className="font-bold text-gray-900 line-clamp-1">{v.title}</div>
                          <div className="text-[11px] text-gray-400 font-mono truncate">{v.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {v.video_url ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <HardDrive className="h-3 w-3" />
                          Supabase Storage
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <Globe className="h-3 w-3" />
                          External Embed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-mono">
                      {v.duration_formatted || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(v.id, v.status)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all cursor-pointer min-h-[36px] ${
                          v.status === "published"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {v.status}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          className="h-9 w-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]"
                          title="Edit Video"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(v)}
                          className="h-9 w-9 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]"
                          title="Delete Video"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          ADD / EDIT VIDEO MODAL
          ========================================================================= */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                {isAddOpen ? "Add Archival Video" : "Edit Video Entry"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  setIsEditOpen(false);
                }}
                className="h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={isAddOpen ? handleCreateSubmit : handleEditSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Video Title (Tamil / English) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="மேதகு களஞ்சியம் — அறிமுகக் காணொளி"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed context and archival notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 resize-none"
                />
              </div>

              {/* Source Switcher */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Video Delivery Mode</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sourceType: "upload" })}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
                      formData.sourceType === "upload"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <HardDrive className="h-3.5 w-3.5 text-[#0A6847]" />
                    Supabase Storage (Direct)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sourceType: "embed" })}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
                      formData.sourceType === "embed"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5 text-blue-600" />
                    External Embed / Odysee
                  </button>
                </div>
              </div>

              {/* Video Upload Section */}
              {formData.sourceType === "upload" ? (
                <div className="space-y-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-900">Upload Video File</div>
                      <div className="text-[11px] text-gray-500">
                        MP4, WebM directly into Supabase Storage &apos;videos&apos; bucket
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-[#0A6847] text-white text-xs font-bold hover:bg-[#085036] transition-colors cursor-pointer min-h-[36px]"
                    >
                      Browse File
                    </button>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </div>

                  {uploadWarning && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <span>{uploadWarning}</span>
                    </div>
                  )}

                  {videoUploadProgress !== null && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-bold text-gray-700">
                        <span>Uploading directly to storage...</span>
                        <span>{videoUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#0A6847] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${videoUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {formData.video_url && (
                    <div className="text-[11px] font-mono text-emerald-700 truncate bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      ✓ Ready: {formData.video_path || formData.video_url}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Embed URL (Odysee / YouTube / Vimeo) *
                  </label>
                  <input
                    type="url"
                    value={formData.embed_url}
                    onChange={(e) => setFormData({ ...formData, embed_url: e.target.value })}
                    placeholder="https://odysee.com/$/embed/@Methagu_kalanjiyam:7/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  />
                </div>
              )}

              {/* Mandatory Poster Image Upload */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-900">Poster Thumbnail *</div>
                    <div className="text-[11px] text-gray-500">
                      Mandatory preview thumbnail stored in &apos;video-posters&apos; bucket
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => posterInputRef.current?.click()}
                    disabled={posterUploadProgress}
                    className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer min-h-[36px]"
                  >
                    {posterUploadProgress ? "Uploading..." : "Upload Poster"}
                  </button>
                  <input
                    ref={posterInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePosterUpload}
                    className="hidden"
                  />
                </div>

                {formData.poster_url && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="relative h-16 w-28 rounded-lg overflow-hidden bg-gray-200 border border-gray-300 shrink-0">
                      <Image
                        src={
                          formData.poster_url.startsWith("http") || formData.poster_url.startsWith("/")
                            ? formData.poster_url
                            : `/${formData.poster_url}`
                        }
                        alt="Poster preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-[11px] font-mono text-gray-500 truncate flex-1">
                      {formData.poster_path || formData.poster_url}
                    </div>
                  </div>
                )}
              </div>

              {/* Duration and Sort Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.duration_seconds}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "draft" | "published",
                        is_active: e.target.value === "published",
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#0A6847] hover:bg-[#085036] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer min-h-[44px]"
                >
                  {isSubmitting ? "Saving..." : isAddOpen ? "Publish Video" : "Save Changes"}
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
              <h3 className="text-base font-bold text-gray-900">Delete Video Entry?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete{" "}
                <span className="font-bold text-gray-900">&quot;{deleteTarget.title}&quot;</span>? This will also remove the video and poster files from Supabase Storage.
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
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
