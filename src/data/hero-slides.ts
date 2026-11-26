import type { BookItem } from "@/data/books";
import type { HeroSlideData } from "@/types/hero-slider";
import { getSupabaseStorageUrl } from "@/lib/book-images";

export const defaultHeroSlides: HeroSlideData[] = [
  {
    id: "flagship-archives",
    bannerImage: "/images/brand/banner-1600.webp",
    mobileBannerImage: "/images/brand/banner-800.webp",
    objectPositionMobile: "object-[18%_25%] sm:object-center",
    bookImage: getSupabaseStorageUrl("books", "book-07.webp"),
    slug: "purananooru-veeran",
    year: "2005",
    categoryTa: "தேசிய வரலாறு",
    categoryEn: "National History",
    eyebrowTa: "தேசிய ஆவணக் களஞ்சியம் • முதன்மைப் பதிப்பகம்",
    eyebrowEn: "National Historical Archives • Premier Bookstore",
    titleTa: "மேதகு களஞ்சியம் — தேசிய வரலாற்று அறிவுப் பெட்டகம்",
    titleEn: "Methagu Kalanjiyam — The Treasury of Tamil History",
    subtitleTa:
      "தமிழீழ விடுதலைப் போராட்ட வரலாறுகள், போர்க்கள நினைவுகள் மற்றும் அரிய வரலாற்று ஆவணங்களின் பிரத்யேகத் தொகுப்பு.",
    subtitleEn:
      "An authoritative repository of rare Tamil political literature, battlefield memoirs, and historical records.",
    ctaPrimaryLabelTa: "நூல்களைக் காண்க",
    ctaPrimaryLabelEn: "Explore Catalog",
    ctaPrimaryHref: "/books",
    ctaSecondaryLabelTa: "ஆவணப் பட்டியல்",
    ctaSecondaryLabelEn: "View Archives",
    ctaSecondaryHref: "/books",
    quoteTa: "அழிந்துவிடாமல் பாதுகாக்கப்படும் வரலாறே எதிர்கால சந்ததிக்கான வழிகாட்டும் கலங்கரை விளக்கம்.",
    quoteEn: "Preserved history is the guiding light for the freedom of future generations.",
  },
  {
    id: "thileepan-satyagraha",
    bannerImage: getSupabaseStorageUrl("blog", "deelipan-widescreen.webp"),
    objectPositionMobile: "object-[70%_18%] sm:object-center",
    bookImage: getSupabaseStorageUrl("books", "book-02.webp"),
    slug: "thileepanudan-12-naatkal",
    year: "1987",
    categoryTa: "அறப்போர் ஆவணம்",
    categoryEn: "Historic Satyagraha",
    eyebrowTa: "அறப்போர் ஆவணம் • தியாக தீபம் திலீபன் 1987",
    eyebrowEn: "Historic Satyagraha • Flame of Sacrifice 1987",
    titleTa: "திலீபனுடன் 12 நாட்கள் — வரலாற்று ஆவணம்",
    titleEn: "12 Days with Thileepan — Eyewitness Record",
    subtitleTa:
      "நீராகாரமும் இன்றி 12 நாட்கள் யாழ் நல்லூர் முன்றலில் நிகழ்ந்த ஒப்பற்ற அறப்போராட்டத்தின் நேரடி வரலாற்றுச் சாட்சியம்.",
    subtitleEn:
      "The historic 12-day fast unto death without water at Nallur, Jaffna — a sacrifice that inspired generations.",
    ctaPrimaryLabelTa: "நூலை ஆர்டர் செய்க",
    ctaPrimaryLabelEn: "Order Book",
    ctaPrimaryHref: "/books/thileepanudan-12-naatkal",
    ctaSecondaryLabelTa: "விபரம் காண்க",
    ctaSecondaryLabelEn: "Read Details",
    ctaSecondaryHref: "/blog/remembrance-memory",
    quoteTa: "தான் நேசித்த மக்களுக்காக, தான் நேசித்த மண்ணுக்காக ஒருவன் எத்தகைய உன்னதமான தியாகத்தை செய்ய முடியுமோ, அதைத் திலீபன் செய்தான்.",
    quoteEn: "He offered the supreme sacrifice a human being could ever render for his people and soil.",
  },
  {
    id: "katunayake-victory",
    bannerImage: getSupabaseStorageUrl("blog", "saanthi-nesakaram-banner-1.webp"),
    objectPositionMobile: "object-[74%_20%] sm:object-center",
    bookImage: getSupabaseStorageUrl("books", "book-20.webp"),
    slug: "katunayake-attack-victory",
    year: "2001",
    categoryTa: "கள ஆவணத் தொகுப்பு",
    categoryEn: "Archival Monograph",
    eyebrowTa: "முதன்மை ஆவணம் • சாந்தி நேசக்கரம் 2001",
    eyebrowEn: "Primary Archive • Saanthi Nesakaram 2001",
    titleTa: "கட்டுநாயக்கா தாக்குதல் வெற்றி",
    titleEn: "Katunayake Air Base Victory",
    subtitleTa:
      "தமிழீழ விடுதலைப் போராட்ட வரலாற்றில் சாந்தி நேசக்கரம் ஆவணப்படுத்திய அரிய வரலாற்றுத் தடம்.",
    subtitleEn:
      "An unprecedented archival documentation of battlefield precision and sacrifice from the national archives.",
    ctaPrimaryLabelTa: "நூலை ஆர்டர் செய்க",
    ctaPrimaryLabelEn: "Order Book Now",
    ctaPrimaryHref: "/books/katunayake-attack-victory",
    ctaSecondaryLabelTa: "நூல் விபரம்",
    ctaSecondaryLabelEn: "Archive Details",
    ctaSecondaryHref: "/books/katunayake-attack-victory",
    quoteTa: "வீரத்திற்கும் தியாகத்திற்கும் உச்சமான அர்த்தம் கொடுத்து மடிந்துபோன வீரர்களின் நினைவிடம்.",
    quoteEn: "A sacred memorial for fighters who gave the ultimate meaning to valor and dedication.",
  },
  {
    id: "leader-thoughts",
    bannerImage: getSupabaseStorageUrl("blog", "prabakaran-dad-banner.webp"),
    objectPositionMobile: "object-[24%_18%] sm:object-center",
    bookImage: getSupabaseStorageUrl("books", "prabakaran-dad.webp"),
    slug: "leader-thoughts",
    year: "2005",
    categoryTa: "சிந்தனைப் பெட்டகம்",
    categoryEn: "Political Philosophy",
    eyebrowTa: "தேசிய ஆவணம் • கொள்கைப் பிரகடனங்கள்",
    eyebrowEn: "National Archive • Historical Pronouncements",
    titleTa: "வரலாற்று நாயகனின் உரைத் தொகுப்பு",
    titleEn: "The Living Mind of the Leader",
    subtitleTa:
      "தேசியத் தலைவர் மேதகு வே. பிரபாகரன் அவர்களின் வரலாற்றுப் பிரகடனங்கள் மற்றும் சிந்தனை ஆவணங்கள்.",
    subtitleEn:
      "The authoritative compilation of historic speeches and political philosophy of Leader V. Prabhakaran.",
    ctaPrimaryLabelTa: "நூலை வாசிக்க",
    ctaPrimaryLabelEn: "Explore Archive",
    ctaPrimaryHref: "/books",
    ctaSecondaryLabelTa: "முழு ஆவணம்",
    ctaSecondaryLabelEn: "View Records",
    ctaSecondaryHref: "/blog/publishing-mission",
    quoteTa: "ஒரு விடுதலைப் போராளியின் சாவும் ஒரு சாதாரண மனிதனின் மரணமும் ஒன்றல்ல. அது சரித்திரத்தை உருவாக்குகிறது.",
    quoteEn: "The death of a liberation fighter is not ordinary; it creates living history.",
  },
];

export interface BlogPostSlideSource {
  slug: string;
  cover_image_url?: string | null;
  cover_image?: string | null;
}

const SLIDE_BLOG_SLUG_MAP: Record<string, string> = {
  "thileepan-satyagraha": "remembrance-memory",
  "katunayake-victory": "movement-structure",
  "leader-thoughts": "publishing-mission",
};

/**
 * Resolves hero slider book covers & blog banners dynamically from live Supabase rows,
 * falling back cleanly to Supabase Storage URLs in `defaultHeroSlides`.
 */
export function buildDynamicHeroSlides(
  books: BookItem[],
  blogPosts: BlogPostSlideSource[] = []
): HeroSlideData[] {
  const booksBySlug = new Map(books.map((b) => [b.slug, b]));
  const blogsBySlug = new Map(blogPosts.map((p) => [p.slug, p]));

  return defaultHeroSlides.map((slide) => {
    const matchedBook = booksBySlug.get(slide.slug);
    const mappedBlogSlug = SLIDE_BLOG_SLUG_MAP[slide.id];
    const matchedBlog = mappedBlogSlug ? blogsBySlug.get(mappedBlogSlug) : undefined;

    const liveBookImage =
      matchedBook?.image && !matchedBook.image.includes("book-placeholder")
        ? matchedBook.image
        : slide.bookImage;

    const candidateBlogBanner = matchedBlog?.cover_image_url || matchedBlog?.cover_image;
    const liveBannerImage =
      candidateBlogBanner && candidateBlogBanner.startsWith("http")
        ? candidateBlogBanner
        : slide.bannerImage;

    return {
      ...slide,
      bookImage: liveBookImage,
      bannerImage: liveBannerImage,
    };
  });
}
