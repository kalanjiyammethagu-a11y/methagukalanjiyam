export interface AnnouncementItem {
  id: string;
  dateLabelTa: string;
  dateLabelEn: string;
  titleTa: string;
  titleEn: string;
  descTa: string;
  descEn: string;
  linkUrl?: string | null;
}

export interface AnnouncementRecord {
  id: string;
  date_label: string;
  date_label_en: string;
  date_label_ta: string;
  title_en: string;
  title_ta: string;
  desc_en: string;
  desc_ta: string;
  link_url?: string | null;
  sort_order: number;
  is_active: boolean;
}

export const DEFAULT_ANNOUNCEMENTS_RECORDS: AnnouncementRecord[] = [
  {
    id: "c0000000-0000-0000-0000-000000000001",
    date_label: "07 ஆகஸ்ட் 2026",
    date_label_en: "07 August 2026",
    date_label_ta: "07 ஆகஸ்ட் 2026",
    title_en: "New Book Release: Katunayake Attack Victory",
    title_ta: "புதிய நூல் வெளியீடு: கட்டுநாயக்கா தாக்குதல் வெற்றி",
    desc_en:
      "Special archival monograph detailing the landmark 2001 Katunayake military airbase operation is now available.",
    desc_ta:
      "ஜூலை 24, 2001 அன்று நடந்த வான்படைத்தளத் தாக்குதல் பற்றிய ஆவண நூல் தற்போது கையிருப்பில் உள்ளது.",
    link_url: null,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000002",
    date_label: "05 ஆகஸ்ட் 2026",
    date_label_en: "05 August 2026",
    date_label_ta: "05 ஆகஸ்ட் 2026",
    title_en: "Reprint: Lt. Col. Thileepan Commemorative Volumes",
    title_ta: "தியாக தீபம் திலீபன் நூல்கள் மறுபதிப்பு",
    desc_en:
      "Rare photographic and documentary archival volumes on the historic fast-unto-death in Jaffna.",
    desc_ta:
      "நல்லூர் வீதியில் நிகழ்ந்த வரலாற்று உன்னத தியாகத்தின் அரிய புகைப்படங்கள் அடங்கிய தொகுப்பு.",
    link_url: null,
    sort_order: 2,
    is_active: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    date_label: "28 ஜூலை 2026",
    date_label_en: "28 July 2026",
    date_label_ta: "28 ஜூலை 2026",
    title_en: "Worldwide Courier Dispatch Active",
    title_ta: "அஞ்சல் வழியே அரிய ஆவணங்கள் பெறலாம்",
    desc_en:
      "Speed Post dispatch available to all 19,100+ PIN codes across India and worldwide destinations.",
    desc_ta:
      "இந்தியா மற்றும் வெளிநாடுகளுக்கு விரைவு அஞ்சல் மூலம் நூல்கள் அனுப்பி வைக்கப்படுகின்றன.",
    link_url: null,
    sort_order: 3,
    is_active: true,
  },
];

export function mapAnnouncementRecordToItem(row: Record<string, any>): AnnouncementItem {
  return {
    id: String(row.id || ""),
    dateLabelTa: row.date_label_ta || row.date_label || row.date_label_en || "",
    dateLabelEn: row.date_label_en || row.date_label || row.date_label_ta || "",
    titleTa: row.title_ta || row.title_en || "",
    titleEn: row.title_en || row.title_ta || "",
    descTa: row.desc_ta || row.desc_en || "",
    descEn: row.desc_en || row.desc_ta || "",
    linkUrl: row.link_url || null,
  };
}

export const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] =
  DEFAULT_ANNOUNCEMENTS_RECORDS.map(mapAnnouncementRecordToItem);
