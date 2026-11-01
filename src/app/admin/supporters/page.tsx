"use client";

import * as React from "react";
import Image from "next/image";
import {
  Users,
  Search,
  CheckCircle2,
  ExternalLink,
  Instagram,
  MessageCircle,
  Plus,
  Trash2,
  Calendar,
  Shield,
} from "lucide-react";
import { mockSupporters } from "@/data/admin-mock";
import type { AdminSupporter } from "@/types/admin";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminSupportersPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [supporters, setSupporters] = React.useState<AdminSupporter[]>(mockSupporters);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleActive = (supporterId: string) => {
    setSupporters((prev) =>
      prev.map((s) => (s.id === supporterId ? { ...s, isActive: !s.isActive } : s))
    );
    showToast(isTa ? "ஆதரவாளர் நிலை மாற்றப்பட்டது!" : "Supporter status updated!");
  };

  const filteredSupporters = supporters.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      s.nameTa.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.roleTa.toLowerCase().includes(q)
    );
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
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold font-tamil text-zinc-900">
          {isTa ? "ஆதரவாளர்கள் & களஞ்சியக் குழு" : "Patrons & Archives Team"}
        </h2>
        <p className="text-xs text-zinc-500 font-tamil mt-1">
          {isTa
            ? `மொத்தம் ${supporters.length} களஞ்சியப் பொறுப்பாளர்கள் மற்றும் ஆதரவாளர்கள் • பொதுத் தளத்தில் தோன்றும் வரிசை & தொடர்புகள்`
            : `${supporters.length} archival contributors and patrons displayed on the public supporters roster`}
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-black/8 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isTa
                ? "பெயர் அல்லது பொறுப்பு கொண்டு தேடுக..."
                : "Search contributors by name or role..."
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-black/10 bg-zinc-50/50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/30 min-h-[40px]"
          />
        </div>
      </div>

      {/* Supporters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSupporters.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl p-5 border border-black/8 shadow-2xs flex flex-col justify-between gap-4 hover:shadow-xs transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-black/10 bg-zinc-100 shrink-0 shadow-xs">
                <Image
                  src={s.image}
                  alt={s.nameTa}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900 font-tamil truncate">
                    {isTa ? s.nameTa : s.nameEn}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(s.id)}
                    className={`h-2.5 w-2.5 rounded-full shrink-0 cursor-pointer ${
                      s.isActive ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-zinc-300"
                    }`}
                    title={s.isActive ? "Active (Click to disable)" : "Inactive (Click to enable)"}
                  />
                </div>
                <p className="text-xs text-[#0A6847] font-tamil font-semibold mt-0.5 leading-snug">
                  {isTa ? s.roleTa : s.roleEn}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{isTa ? "இணைந்தது:" : "Joined:"} {s.joinedAt}</span>
                </p>
              </div>
            </div>

            {/* Social Links & Controls */}
            <div className="pt-3 border-t border-black/6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {s.instagramUrl && (
                  <a
                    href={s.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 flex items-center justify-center transition-colors shadow-2xs"
                    title="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {s.whatsappUrl && (
                  <a
                    href={s.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors shadow-2xs"
                    title="WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleToggleActive(s.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold font-tamil transition-all ${
                  s.isActive
                    ? "bg-emerald-500/10 text-emerald-800 border border-emerald-400/30"
                    : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                }`}
              >
                {s.isActive ? (isTa ? "செயலில் உள்ளார்" : "Active") : (isTa ? "செயலற்றது" : "Inactive")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
