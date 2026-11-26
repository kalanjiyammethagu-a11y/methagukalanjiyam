"use client";
import { getSupabaseStorageUrl } from "@/lib/book-images";

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
import {
  buildBilingualSearchText,
  generateAsciiSlug,
  getLanguageCompleteness,
  isAsciiSlug,
  isTamilText,
  REQUIRE_BOTH_LANGUAGES_TO_PUBLISH,
  resolveBilingualPair,
  type AppLocale,
} from "@/lib/i18n";
import { BilingualListBadge, BilingualTabs } from "@/components/admin/BilingualTabs";
import {
  VIDEO_CATEGORY_OPTIONS,
  normalizeVideoEmbedUrl,
  resolveVideoMedia,
} from "@/lib/video-utils";

const VIDEO_REQUIRED_BILINGUAL_FIELDS = ["title"];

interface VideoFormData {
  id?: string;
  title_en: string;
  title_ta: string;
  slug: string;
  description_en: string;
  description_ta: string;
  category_en: string;
  category_ta: string;
  poster_alt_en: string;
  poster_alt_ta: string;
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
  title_en: "",
  title_ta: "",
  slug: "",
  description_en: "",
  description_ta: "",
  category_en: "Book Showcase",
  category_ta: "புத்தகக் காணொளி",
  poster_alt_en: "",
  poster_alt_ta: "",
  sourceType: "upload",
  video_path: "",
  video_url: "",
  embed_url: "",
  poster_path: "",
  poster_url: getSupabaseStorageUrl("video-posters", "1.webp"),
  duration_seconds: 0,
  file_size_bytes: 0,
  mime_type: "video/mp4",
  sort_order: 0,
  status: "published",
  is_active: true,
};

export default function AdminVideosPage() {
  const [videos, setVideos] = React.useState<AdminVideoItem[]>([]);
  const [usingFallback, setUsingFallback] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft" | "missing_tamil">("all");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminVideoItem | null>(null);
  const [formData, setFormData] = React.useState<VideoFormData>(initialFormData);
  const [activeLangTab, setActiveLangTab] = React.useState<AppLocale>("en");
  const initialLangSnapshotRef = React.useRef({
    en: { title_en: "", description_en: "", poster_alt_en: "" },
    ta: { title_ta: "", description_ta: "", poster_alt_ta: "" },
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Upload progress states
  const [videoUploadProgress, setVideoUploadProgress] = React.useState<number | null>(null);
  const [posterUploadProgress, setPosterUploadProgress] = React.useState(false);
  const [resolvingOdysee, setResolvingOdysee] = React.useState(false);
  const [showOdyseePreview, setShowOdyseePreview] = React.useState(false);
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
          setUsingFallback(Boolean(data.usingFallback));
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
      const resolvedMime = file.type || "video/mp4";
      const signRes = await fetch("/api/admin/videos/signed-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: resolvedMime,
          sizeBytes: file.size,
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
        embed_url: "",
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

  // Resolve Odysee URL metadata + thumbnail into Admin form
  const handleResolveOdysee = async () => {
    const rawInput = formData.embed_url.trim();
    if (!rawInput) {
      showToast("Paste an Odysee link or lbry:// URI first.");
      return;
    }
    setResolvingOdysee(true);
    try {
      const res = await fetch("/api/admin/videos/odysee-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rawInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Could not resolve Odysee URL.");
        return;
      }

      const resolvedTitle = String(data.title || "").trim();
      const resolvedDesc = String(data.description || "").trim();
      const titleIsTamil = isTamilText(resolvedTitle);
      const descIsTamil = isTamilText(resolvedDesc);

      setFormData((prev) => ({
        ...prev,
        embed_url: data.embedUrl || prev.embed_url,
        title_en:
          !prev.title_en.trim() && resolvedTitle && !titleIsTamil
            ? resolvedTitle
            : prev.title_en,
        title_ta:
          !prev.title_ta.trim() && resolvedTitle && titleIsTamil
            ? resolvedTitle
            : prev.title_ta,
        description_en:
          !prev.description_en.trim() && resolvedDesc && !descIsTamil
            ? resolvedDesc
            : prev.description_en,
        description_ta:
          !prev.description_ta.trim() && resolvedDesc && descIsTamil
            ? resolvedDesc
            : prev.description_ta,
        slug: !prev.slug.trim() && data.slug ? data.slug : prev.slug,
        duration_seconds:
          !prev.duration_seconds && Number(data.durationSeconds) > 0
            ? Number(data.durationSeconds)
            : prev.duration_seconds,
        poster_url: data.posterUrl || prev.poster_url,
        poster_path: data.posterPath || prev.poster_path,
      }));
      setShowOdyseePreview(true);
      showToast(
        resolvedTitle
          ? "Odysee embed & metadata auto-filled!"
          : "Odysee embed URL normalized."
      );
    } catch {
      showToast("Network error resolving Odysee link.");
    } finally {
      setResolvingOdysee(false);
    }
  };

  // Toggle Video Status (published / draft)
  const handleToggleStatus = async (videoId: string, currentStatus: "published" | "draft") => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    try {
      const res = await fetch("/api/admin/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoId, status: nextStatus, is_active: nextStatus === "published" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to update video status in database.");
        return;
      }
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, status: nextStatus, is_active: nextStatus === "published" } : v))
      );
      showToast(`Video marked as ${nextStatus}!`);
    } catch {
      showToast("Network error updating video status.");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (v: AdminVideoItem) => {
    const titlePair = resolveBilingualPair({ en: v.title_en, ta: v.title_ta, legacy: v.title });
    const descPair = resolveBilingualPair({ en: v.description_en, ta: v.description_ta, legacy: v.description });
    const media = resolveVideoMedia({
      embed_url: v.embed_url,
      video_url: v.video_url,
      video_path: v.video_path,
    });
    const matchedCat = VIDEO_CATEGORY_OPTIONS.find(
      (c) =>
        c.labelEn.toLowerCase() === (v.category_en || "").toLowerCase() ||
        c.labelTa.toLowerCase() === (v.category_ta || "").toLowerCase()
    );
    const populated: VideoFormData = {
      id: v.id,
      title_en: titlePair.en,
      title_ta: titlePair.ta,
      slug: v.slug,
      description_en: descPair.en,
      description_ta: descPair.ta,
      category_en: matchedCat?.labelEn || v.category_en || "Book Showcase",
      category_ta: matchedCat?.labelTa || v.category_ta || "புத்தகக் காணொளி",
      poster_alt_en: v.poster_alt_en || "",
      poster_alt_ta: v.poster_alt_ta || "",
      sourceType: media.mode,
      video_path: media.mode === "upload" ? v.video_path || "" : "",
      video_url: media.mode === "upload" ? media.videoUrl || "" : "",
      embed_url: media.mode === "embed" ? media.embedUrl : "",
      poster_path: v.poster_path || "",
      poster_url: v.poster_url,
      duration_seconds: v.duration_seconds || 0,
      file_size_bytes: v.file_size_bytes || 0,
      mime_type: v.mime_type || "video/mp4",
      sort_order: v.sort_order,
      status: v.status,
      is_active: v.is_active,
    };
    setFormData(populated);
    initialLangSnapshotRef.current = {
      en: {
        title_en: populated.title_en,
        description_en: populated.description_en,
        poster_alt_en: populated.poster_alt_en,
      },
      ta: {
        title_ta: populated.title_ta,
        description_ta: populated.description_ta,
        poster_alt_ta: populated.poster_alt_ta,
      },
    };
    setActiveLangTab("en");
    setUploadWarning(null);
    setIsEditOpen(true);
  };

  const formCompleteness = React.useMemo(
    () => getLanguageCompleteness(formData as unknown as Record<string, unknown>, VIDEO_REQUIRED_BILINGUAL_FIELDS),
    [formData]
  );

  const isActiveTabDirty = React.useMemo(() => {
    const snap = initialLangSnapshotRef.current;
    if (activeLangTab === "en") {
      return (
        formData.title_en !== snap.en.title_en ||
        formData.description_en !== snap.en.description_en ||
        formData.poster_alt_en !== snap.en.poster_alt_en
      );
    }
    return (
      formData.title_ta !== snap.ta.title_ta ||
      formData.description_ta !== snap.ta.description_ta ||
      formData.poster_alt_ta !== snap.ta.poster_alt_ta
    );
  }, [activeLangTab, formData]);

  const validateAndBuildVideoPayload = () => {
    if (!formData.title_en.trim()) {
      setActiveLangTab("en");
      showToast("English video title is required.");
      return null;
    }
    if (
      REQUIRE_BOTH_LANGUAGES_TO_PUBLISH &&
      formData.status === "published" &&
      !formData.title_ta.trim()
    ) {
      setActiveLangTab("ta");
      showToast("Tamil video title is required to publish.");
      return null;
    }
    const cleanSlug = (formData.slug.trim() || generateAsciiSlug(formData.title_en, "video")).toLowerCase();
    if (!isAsciiSlug(cleanSlug)) {
      showToast("Slug must contain only ASCII lowercase letters, numbers, and hyphens.");
      return null;
    }
    const isUpload = formData.sourceType === "upload";
    if (isUpload && !formData.video_url.trim() && !formData.video_path.trim()) {
      showToast("Please upload a video file to Supabase Storage or switch to External Embed.");
      return null;
    }
    if (!isUpload && !formData.embed_url.trim()) {
      showToast("Please enter an Odysee, YouTube, or Vimeo video URL.");
      return null;
    }
    const normalizedEmbed = !isUpload ? normalizeVideoEmbedUrl(formData.embed_url) : "";
    return {
      ...formData,
      title: formData.title_ta.trim() || formData.title_en.trim(),
      title_en: formData.title_en.trim(),
      title_ta: formData.title_ta.trim() || null,
      description: formData.description_ta.trim() || formData.description_en.trim() || "",
      description_en: formData.description_en.trim() || null,
      description_ta: formData.description_ta.trim() || null,
      slug: cleanSlug,
      video_path: isUpload ? formData.video_path.trim() : "",
      video_url: isUpload ? formData.video_url.trim() : "",
      embed_url: isUpload ? formData.video_url.trim() : normalizedEmbed,
      file_size_bytes: isUpload ? formData.file_size_bytes : 0,
      mime_type: isUpload ? formData.mime_type : "",
    };
  };

  // Submit Create Video
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = validateAndBuildVideoPayload();
    if (!payload) return;
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
        body: JSON.stringify(payload),
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
    const payload = validateAndBuildVideoPayload();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      const res = await fetch(`/api/admin/videos?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to delete video from database.");
        return;
      }
      setVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      showToast("Video and associated storage assets deleted.");
    } catch {
      showToast("Failed to delete video.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredVideos = videos.filter((v) => {
    const q = searchQuery.trim().toLowerCase();
    const corpus = buildBilingualSearchText(v as unknown as Record<string, unknown>, [
      "title",
      "description",
      "category",
    ]);
    const matchesSearch = !q || corpus.includes(q);
    const langComp = getLanguageCompleteness(
      v as unknown as Record<string, unknown>,
      VIDEO_REQUIRED_BILINGUAL_FIELDS
    );

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && v.status === "published") ||
      (statusFilter === "draft" && v.status === "draft") ||
      (statusFilter === "missing_tamil" && langComp.missingTamil);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[60] bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {usingFallback && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Showing static fallback videos because the Supabase <code className="font-mono">videos</code> table is currently empty or migrations (<code className="font-mono">015/017/019</code>) have not been executed yet. Use <strong>Add Video Entry</strong> to publish a new database-backed video, or run the migrations first to manage existing ones.
          </span>
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
            initialLangSnapshotRef.current = {
              en: { title_en: "", description_en: "", poster_alt_en: "" },
              ta: { title_ta: "", description_ta: "", poster_alt_ta: "" },
            };
            setActiveLangTab("en");
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
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "published", "draft", "missing_tamil"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer min-h-[44px] whitespace-nowrap ${
                statusFilter === st
                  ? "bg-[#0A6847] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st === "missing_tamil" ? "Missing Tamil" : st}
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
                        <div className="space-y-1 max-w-xs">
                          <div className="font-bold text-gray-900 line-clamp-1 font-tamil leading-[1.45]">
                            {v.title_ta || v.title_en || v.title}
                          </div>
                          {v.title_en && v.title_ta && v.title_en !== v.title_ta && (
                            <div className="text-[11px] text-gray-500 line-clamp-1">{v.title_en}</div>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-gray-400 font-mono truncate">{v.slug}</span>
                            <BilingualListBadge
                              completeness={getLanguageCompleteness(
                                v as unknown as Record<string, unknown>,
                                VIDEO_REQUIRED_BILINGUAL_FIELDS
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {resolveVideoMedia({
                        embed_url: v.embed_url,
                        video_url: v.video_url,
                        video_path: v.video_path,
                      }).mode === "upload" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <HardDrive className="h-3 w-3" />
                          Supabase Storage
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <Globe className="h-3 w-3" />
                          {v.embed_url?.includes("odysee.com") ? "Odysee Embed" : "External Embed"}
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden my-4 sm:my-8 max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
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
              {/* Dual-Language Text Tabs (English | தமிழ் — Text Fields Only) */}
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
                        Video Title (English) *
                      </label>
                      <input
                        type="text"
                        value={formData.title_en}
                        onChange={(e) => {
                          const nextTitle = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            title_en: nextTitle,
                            slug: isEditOpen
                              ? prev.slug
                              : prev.slug || generateAsciiSlug(nextTitle, "video"),
                          }));
                        }}
                        placeholder="e.g. Methagu Kalanjiyam — Platform Introduction"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Description (English)</label>
                      <textarea
                        rows={2}
                        value={formData.description_en}
                        onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                        placeholder="English summary and archival context..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Poster Alt Text (English)</label>
                      <input
                        type="text"
                        value={formData.poster_alt_en}
                        onChange={(e) => setFormData({ ...formData, poster_alt_en: e.target.value })}
                        placeholder="Thumbnail preview of video"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 font-tamil mb-1">
                        காணொளித் தலைப்பு (Title in Tamil)
                      </label>
                      <input
                        type="text"
                        value={formData.title_ta}
                        onChange={(e) => setFormData({ ...formData, title_ta: e.target.value })}
                        placeholder="மேதகு களஞ்சியம் — அறிமுகக் காணொளி"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 font-tamil mb-1">விளக்கம் (Description in Tamil)</label>
                      <textarea
                        rows={2}
                        value={formData.description_ta}
                        onChange={(e) => setFormData({ ...formData, description_ta: e.target.value })}
                        placeholder="தமிழில் காணொளி விளக்கம்..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 font-tamil leading-[1.6] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 font-tamil mb-1">பட விவரம் (Poster Alt in Tamil)</label>
                      <input
                        type="text"
                        value={formData.poster_alt_ta}
                        onChange={(e) => setFormData({ ...formData, poster_alt_ta: e.target.value })}
                        placeholder="காணொளி முன்னோட்டப் படம்"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 font-tamil focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ASCII Slug */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">URL Slug (ASCII only)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  placeholder="introduction-video"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
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
                      accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
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
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-gray-800">
                      Odysee / Embed Link (Watch, Embed, or lbry://) *
                    </label>
                    <a
                      href="https://odysee.com/$/upload"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      Upload on Odysee
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={formData.embed_url}
                      onChange={(e) => setFormData({ ...formData, embed_url: e.target.value })}
                      onBlur={() => {
                        const norm = normalizeVideoEmbedUrl(formData.embed_url);
                        if (norm && norm !== formData.embed_url) {
                          setFormData((prev) => ({ ...prev, embed_url: norm }));
                        }
                      }}
                      placeholder="https://odysee.com/@Methagu_kalanjiyam:7/... or lbry://..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={handleResolveOdysee}
                      disabled={resolvingOdysee || !formData.embed_url.trim()}
                      className="px-3.5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
                    >
                      {resolvingOdysee ? "Fetching..." : "Auto-Fill from Odysee"}
                    </button>
                  </div>
                  {formData.embed_url.trim() && (
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono text-blue-800 truncate flex-1">
                        Embed: {normalizeVideoEmbedUrl(formData.embed_url)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowOdyseePreview((v) => !v)}
                        className="font-bold text-blue-700 hover:underline shrink-0 cursor-pointer"
                      >
                        {showOdyseePreview ? "Hide Preview" : "Preview Player"}
                      </button>
                    </div>
                  )}
                  {showOdyseePreview && formData.embed_url.trim() && (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-blue-200">
                      <iframe
                        src={normalizeVideoEmbedUrl(formData.embed_url)}
                        title="Odysee Preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full border-0"
                      />
                    </div>
                  )}
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

              {/* Category, Duration, Sort Order & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category_en}
                    onChange={(e) => {
                      const opt = VIDEO_CATEGORY_OPTIONS.find((c) => c.labelEn === e.target.value);
                      setFormData({
                        ...formData,
                        category_en: opt?.labelEn || e.target.value,
                        category_ta: opt?.labelTa || formData.category_ta,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                  >
                    {VIDEO_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.slug} value={opt.labelEn}>
                        {opt.labelEn} ({opt.labelTa})
                      </option>
                    ))}
                  </select>
                </div>
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Order</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.sort_order}
                      onChange={(e) =>
                        setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
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
                      className="w-full px-2.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[44px]"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
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
