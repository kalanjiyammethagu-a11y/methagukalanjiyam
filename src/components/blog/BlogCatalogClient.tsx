"use client";
import { getSupabaseStorageUrl } from "@/lib/book-images";

import * as React from "react";
import Link from "next/link";
import { Search, Newspaper } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CategoryPills, type CategoryOption } from "@/components/ui/CategoryPills";
import { ArticleCard, type ArticleCardData } from "@/components/blog/ArticleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage } from "@/context/LanguageContext";
import {
  ARTICLE_CATEGORY_OPTIONS,
  matchesArticleCategory,
  type ArticleCategoryOption,
} from "@/lib/blog-utils";
import { RecentAnnouncementsBanner } from "@/components/shared/RecentAnnouncementsBanner";
import { DEFAULT_ANNOUNCEMENTS, type AnnouncementItem } from "@/lib/announcements";
export type { AnnouncementItem };

/* Authentic articles extracted from feeds.html & feed-item.html */
const blogArticles: ArticleCardData[] = [
  {
    slug: "eelam-liberation",
    titleTa: "மூத்த புலனாய்வுத் தளபதியின் தியாக வாழ்வும் வீரமும்",
    titleEn: "The Martyrdom & Valour of Senior Intelligence Commander Vinayagam",
    excerptTa:
      "சேகரிப்பிள்ளை விநாயகமூர்த்தி என்ற இயற்பெயர் கொண்ட தளபதி விநாயகம், 1964 இல் பிறந்து, 2001 கட்டுநாயக்கா வான்படைத்தளத் தாக்குதலுக்கு வழிகாட்டி, வரலாறு படைத்த மாபெரும் வீரனின் வாழ்க்கை வரலாறு.",
    excerptEn:
      "The extraordinary biography of Commander Vinayagam (Vinayagamoorthy), the mastermind behind the 2001 Katunayake Air Base operation and steadfast guardian of Eelam history.",
    coverImage: getSupabaseStorageUrl("blog", "thalapathi-vinayagam-banner.webp"),
    categoryTa: "வரலாற்று ஆவணம்",
    categoryEn: "Historical Record",
    publishedAt: "2026-08-06",
    readingTimeMinutes: 8,
    featured: true,
  },
  {
    slug: "movement-structure",
    titleTa: "பொட்டு அம்மானின் வரலாற்றை எழுதுவதற்கு சாந்தி நேசக்கரம் ஆகிய நான் யார்?",
    titleEn: "Who am I, Saanthi Nesakaram, to Write the History of Pottu Amman?",
    excerptTa:
      "1997 இல் ஆரம்பித்த தமிழ் வெப் ரேடியோ, வன்னியிலிருந்து அம்புறுஸ் அண்ணன் மற்றும் அருணன் உடனாகிய தொடர்புகள், மற்றும் புலனாய்வுத்துறைப் பொறுப்பாளர் பொட்டு அம்மானின் நேர்முக சந்திப்பு நினைவுகள்.",
    excerptEn:
      "A personal historical memoir by author Saanthi Nesakaram exploring early digital broadcasting with TamilWebRadio, correspondence from Vanni, and intimate meetings with Pottu Amman.",
    coverImage: getSupabaseStorageUrl("blog", "saanthi-nesakaram-banner-1.webp"),
    categoryTa: "நினைவுக் குறிப்பு",
    categoryEn: "Personal Memoir",
    publishedAt: "2026-08-08",
    readingTimeMinutes: 12,
  },
  {
    slug: "remembrance-memory",
    titleTa: "தியாக தீபம் லெப். கேணல் திலீபனின் வாழ்க்கை வரலாறு",
    titleEn: "Biography of the Flame of Sacrifice, Lt. Col. Thileepan",
    excerptTa:
      "\"தான் நேசித்த மக்களுக்காக, தான் நேசித்த மண்ணுக்காக ஒருவன் எத்தகைய உயர்ந்த, உன்னதமான தியாகத்தை செய்ய முடியுமோ, அந்த அற்புதமான அர்ப்பணிப்பைத்தான் திலீபன் செய்திருக்கிறான்...\" - தேசியத் தலைவர்.",
    excerptEn:
      "The historic non-violent hunger strike of Lt. Col. Thileepan in 1987 in Jaffna, an unmatched sacrifice in modern Tamil history for the fundamental rights of his people.",
    coverImage: getSupabaseStorageUrl("blog", "deelipan-book-cover.webp"),
    categoryTa: "தியாக வரலாறு",
    categoryEn: "Martyrdom History",
    publishedAt: "2026-08-05",
    readingTimeMinutes: 10,
  },
  {
    slug: "biography-workshop",
    titleTa: "தந்தையிடம் பிரபாகரன் கூறியது — மகன் பிரபாகரன் விளக்கம்",
    titleEn: "What Prabhakaran Told His Father — An Inspiring Dialogue",
    excerptTa:
      "“அப்பா! காந்தியடிகள் நல்லவர்; உயர்ந்தவர். ஆனால் இந்தியச் சூழ்நிலை வேறு; இலங்கைச் சூழ்நிலை வேறு என்பதை நாம் எண்ணிப் பார்க்க வேண்டும்...” இளமைக்கால வரலாற்று உரையாடல்.",
    excerptEn:
      "The early ideological dialogues between young Velupillai Prabhakaran and his father Thiruvenkadam, setting the philosophical foundation for the Eelam liberation movement.",
    coverImage: getSupabaseStorageUrl("blog", "prabakaran-dad-banner.webp"),
    categoryTa: "வாழ்க்கை வரலாறு",
    categoryEn: "Biography",
    publishedAt: "2026-08-01",
    readingTimeMinutes: 7,
  },
  {
    slug: "language-national-literature",
    titleTa: "ஐயா! என் பெயர் தமிழ்ப் பெயர் தானே? தலைவர் கேட்டார்?",
    titleEn: "Sir! Isn't My Name a Tamil Name? The Leader Asked",
    excerptTa:
      "பேராசிரியர் அறிவரசனிடம் தலைவர் பிரபாகரன் தனது பெயர் குறித்து நிகழ்த்திய சுவையான கலந்துரையாடல் மற்றும் தமிழ் மொழிப்பற்று குறித்த வரலாற்றுச் சுருக்கம்.",
    excerptEn:
      "An insightful literary interaction between Prof. Arivarasan and National Leader Prabhakaran regarding Tamil linguistics, naming traditions, and cultural heritage.",
    coverImage: getSupabaseStorageUrl("blog", "kanden-kanden-banner.webp"),
    categoryTa: "இலக்கிய உரையாடல்",
    categoryEn: "Literature & Language",
    publishedAt: "2026-07-28",
    readingTimeMinutes: 6,
  },
];

const categoryOptions: CategoryOption[] = ARTICLE_CATEGORY_OPTIONS.map((opt) => ({
  slug: opt.slug,
  labelTa: opt.labelTa,
  labelEn: opt.labelEn,
}));

export interface BlogCategoryFilterOption extends CategoryOption {
  aliases?: string[];
}

export function BlogCatalogClient({
  initialArticles,
  initialAnnouncements,
  initialCategories,
}: {
  initialArticles?: ArticleCardData[];
  initialAnnouncements?: AnnouncementItem[];
  initialCategories?: BlogCategoryFilterOption[];
} = {}) {
  const { locale } = useLanguage();
  const isTa = locale === "ta";

  const [articlesList, setArticlesList] = React.useState<ArticleCardData[]>(
    initialArticles && initialArticles.length > 0 ? initialArticles : blogArticles
  );

  const announcementsList =
    initialAnnouncements !== undefined ? initialAnnouncements : DEFAULT_ANNOUNCEMENTS;

  const activeCategoryList = React.useMemo<BlogCategoryFilterOption[]>(() => {
    if (initialCategories && initialCategories.length > 0) {
      return initialCategories;
    }
    return categoryOptions;
  }, [initialCategories]);

  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  const filteredArticles = React.useMemo(() => {
    const selectedCatObj = activeCategoryList.find((c) => c.slug === selectedCategory);
    return articlesList.filter((article) => {
      const matchesSearch =
        search === "" ||
        article.titleTa.toLowerCase().includes(search.toLowerCase()) ||
        article.titleEn.toLowerCase().includes(search.toLowerCase()) ||
        article.excerptTa.toLowerCase().includes(search.toLowerCase()) ||
        article.excerptEn.toLowerCase().includes(search.toLowerCase());

      let matchesCategory = matchesArticleCategory(article, selectedCategory);
      if (!matchesCategory && selectedCatObj) {
        const catEn = (article.categoryEn || "").trim().toLowerCase();
        const catTa = (article.categoryTa || "").trim().toLowerCase();
        const customAliases = [
          selectedCatObj.slug,
          selectedCatObj.labelEn,
          selectedCatObj.labelTa,
          ...(selectedCatObj.aliases || []),
        ]
          .filter(Boolean)
          .map((a) => a.toLowerCase());
        matchesCategory = customAliases.some(
          (alias) => catEn === alias || catTa === alias || catEn.includes(alias) || catTa.includes(alias)
        );
      }

      return matchesSearch && matchesCategory;
    });
  }, [articlesList, search, selectedCategory, activeCategoryList]);

  return (
    <div className="min-h-screen pb-24">
      {/* Top Breadcrumbs Navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          items={[
            { label: isTa ? "செய்திகள் & பதிவுகள்" : "News & Articles" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0A6847] dark:bg-emerald-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#0A6847] dark:text-emerald-400 font-tamil">
              {isTa ? "வரலாற்றுப் பெட்டகம்" : "Historical Chronicles"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111111] dark:text-zinc-100 font-tamil-serif tracking-tight">
                {isTa ? "செய்திகள் & ஆவணப் பதிவுகள்" : "Articles, Stories & News"}
              </h1>
              <p className="text-sm sm:text-base text-[#444444] dark:text-zinc-300 font-tamil mt-2 max-w-2xl leading-relaxed">
                {isTa
                  ? "அரிய வரலாற்று ஆவணங்கள், கள ஆய்வுகள், நினைவுப் பதிவுகள் மற்றும் மேதகு களஞ்சியத்தின் அதிகாரப்பூர்வ அறிவிப்புகள்."
                  : "Preserved historical articles, memoirs, field research, and official announcements from Methagu Kalanjiyam."}
              </p>
            </div>
          </div>
        </div>

        {/* Live Announcements Ticker / Feed Banner */}
        <RecentAnnouncementsBanner announcements={announcementsList} />

        {/* Search & Category Filter Toolbar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A6847] dark:text-emerald-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isTa ? "பதிவுகளைத் தேடுக (Search articles)..." : "Search articles..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/12 dark:border-white/15 bg-white/80 dark:bg-zinc-900/90 text-base sm:text-sm font-tamil text-[#111111] dark:text-zinc-100 placeholder:text-[#555555] dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0A6847]/40 focus:border-[#0A6847] transition-all min-h-[44px]"
              />
            </div>

            {/* Results counter */}
            <span className="text-xs font-semibold text-[#555555] dark:text-zinc-300 font-tamil self-center sm:self-auto">
              {isTa
                ? `${filteredArticles.length} கட்டுரைகள் கிடைக்கின்றன`
                : `${filteredArticles.length} articles found`}
            </span>
          </div>

          {/* Category Filter Pills (Hick's Law) */}
          <CategoryPills
            categories={activeCategoryList}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            locale={locale}
          />
        </div>

        {/* Articles Grid (F-Pattern & Gestalt Similarity) */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.slug}
                article={article}
                locale={locale}
                variant="standard"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Newspaper className="h-10 w-10 text-[#0A6847] dark:text-emerald-400" />}
            titleTa="பதிவுகள் எதுவும் கிடைக்கவில்லை"
            titleEn="No Articles Found"
            descriptionTa="நீங்கள் தேடிய தலைப்பில் ஆவணங்கள் எதுவும் இல்லை. மாற்று சொற்களைப் பயன்படுத்தி மீண்டும் தேடவும்."
            descriptionEn="We couldn't find any articles matching your search criteria. Try using different keywords or clearing filters."
            actionLabelTa="அனைத்து பதிவுகளையும் காண்க"
            actionLabelEn="View All Articles"
            onAction={() => {
              setSearch("");
              setSelectedCategory("all");
            }}
          />
        )}
      </div>
    </div>
  );
}
