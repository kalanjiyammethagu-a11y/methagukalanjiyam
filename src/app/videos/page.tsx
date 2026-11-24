"use client";

import * as React from "react";
import Image from "next/image";
import { Search, Film, X, Play } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CategoryPills, type CategoryOption } from "@/components/ui/CategoryPills";
import { VideoCard, type VideoData } from "@/components/videos/VideoCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage } from "@/context/LanguageContext";

/* Authentic 23 videos from archival repository */
const allVideos: VideoData[] = [
  {
    id: "1",
    titleTa: "மேதகு களஞ்சியம் — அறிமுகக் காணொளி",
    titleEn: "Methagu Kalanjiyam — Official Platform Introduction",
    descriptionTa: "அரிய தமிழீழ தேசிய இலக்கியங்கள், வரலாற்று ஆவண நூல்கள் மற்றும் மேதகு களஞ்சியத்தின் நோக்கம் பற்றிய அறிமுகக் காணொளி.",
    descriptionEn: "Introductory overview exploring Methagu Kalanjiyam's mission to preserve and courier rare Tamil national literature worldwide.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FIntroduction-Video%3A16?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/1.webp",
    categoryTa: "அறிமுகம்",
    categoryEn: "Overview",
    duration: "2:45",
    publishedDate: "2026",
  },
  {
    id: "2",
    titleTa: "மேதகு களஞ்சியம் — வலைதள பயன்பாட்டு வழிகாட்டி",
    titleEn: "Methagu Kalanjiyam — Website Usage Walkthrough",
    descriptionTa: "வலைதளத்தில் நூல்களைத் தேடுதல், விவரங்களைப் படித்தல் மற்றும் சர்வதேச தபால் மூலம் நூல்களைப் பெறுவதற்கான வழிகாட்டல்.",
    descriptionEn: "Step-by-step walkthrough of browsing books, viewing details, and placing orders securely on the platform.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fwebsite-2%3Ab?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/2.webp",
    categoryTa: "அறிமுகம்",
    categoryEn: "Overview",
    duration: "3:10",
    publishedDate: "2026",
  },
  {
    id: "3",
    titleTa: "கண்டேன் கண்டேன் தலைவரைக் கண்டேன் — புத்தகக் காணொளி",
    titleEn: "Kanden Kanden Thalaivarak Kanden — Book Trailer",
    descriptionTa: "தேசியத் தலைவருடனான நேர்மையான நினைவுகளையும், வரலாற்றுச் சம்பவங்களையும் விவரிக்கும் சிறப்பு நூலின் அறிமுகக் காட்சிப்பதிவு.",
    descriptionEn: "Documentary preview of the poignant historical book recounting memorable encounters with the National Leader.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2F%E0%AE%95%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AF%87%E0%AE%A9%E0%AF%8D-%E0%AE%95%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AF%87%E0%AE%A9%E0%AF%8D-%E0%AE%A4%E0%AE%B2%E0%AF%88%E0%AE%B5%E0%AE%B0%E0%AF%8D-%E0%AE%95%E0%AE%A3%E0%AF%8D%E0%AE%9F%E0%AF%87%E0%AE%A9%E0%AF%8D%3Ab?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/3.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "4:05",
    publishedDate: "2026",
  },
  {
    id: "4",
    titleTa: "தோழர் தமிழரசனின் மூன்று அறிக்கைகள் — புத்தகக் காணொளி",
    titleEn: "Comrade Tamilarasan's Three Manifestos — Book Trailer",
    descriptionTa: "தமிழ்நாடு விடுதலைப் படைத் தலைவர் தோழர் தமிழரசன் அவர்களின் வரலாற்று அறிக்கைகள் மற்றும் அரசியல் சிந்தனைகள் அடங்கிய நூல்.",
    descriptionEn: "Historical monograph and political manifestos of TNLA leader Comrade Tamilarasan.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FThozhar-Tamilarasan%3Ae?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/4.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "3:50",
    publishedDate: "2026",
  },
  {
    id: "5",
    titleTa: "தமிழீழ தேசியத் தலைவர் வே.பிரபாகரன் — வரலாற்று நூல் காட்சிப்படுத்தல்",
    titleEn: "Leader Velupillai Prabhakaran — Historical Monograph",
    descriptionTa: "தேசியத் தலைவரின் சிந்தனைகள், பிரகடனங்கள் மற்றும் வாழ்க்கை வரலாற்றை விவரிக்கும் சிறப்பு நூலின் காட்சிப்படுத்தல்.",
    descriptionEn: "Visual preview and historical monograph presentation on National Leader Velupillai Prabhakaran.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2F%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%80%E0%AE%B4-%E0%AE%A4%E0%AF%87%E0%AE%9A%E0%AE%BF%E0%AE%AF%E0%AE%A4%E0%AF%8D-%E0%AE%A4%E0%AE%B2%E0%AF%88%E0%AE%B5%E0%AE%B0%E0%AF%8D-%E0%AE%B5%E0%AF%87.%E0%AE%AA%E0%AE%BF%E0%AE%B0%E0%AE%AA%E0%AE%BE%E0%AE%95%E0%AE%B0%E0%AE%A9%E0%AF%8D%3A3?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/5.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "5:15",
    publishedDate: "2026",
  },
  {
    id: "6",
    titleTa: "மேதகு களஞ்சிய புத்தக விற்பனை நிலையம் — நூல் தொகுப்பு",
    titleEn: "Methagu Kalanjiyam Book Center — Monograph Collection",
    descriptionTa: "அரசியல், வரலாறு, ஆயுதப் போராட்டம் மற்றும் தமிழ் தேசியம் சார்ந்த அரிய வெளியீடுகளின் தொகுப்பு காட்சி.",
    descriptionEn: "Curated display of rare publications in political history, resistance struggles, and Tamil literature.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2F%E0%AE%AE%E0%AF%87%E0%AE%A4%E0%AE%95%E0%AF%81-%E0%AE%95%E0%AE%B3%E0%AE%9E%E0%AF%8D%E0%AE%9A%E0%AE%BF%E0%AE%AF-%E0%AE%AA%E0%AF%81%E0%AE%A4%E0%AF%8D%E0%AE%A4%E0%AE%95-%E0%AE%B5%E0%AE%BF%E0%AE%B1%E0%AF%8D%E0%AE%AA%E0%AE%A9%E0%AF%88-%E0%AE%A8%E0%AE%BF%E0%AE%B2%E0%AF%88%E0%AE%AF%E0%AE%AE%E0%AF%8D%3A5?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/6.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "3:25",
    publishedDate: "2026",
  },
  {
    id: "7",
    titleTa: "மே 18 — நினைவேந்தல் ஆவணக் காணொளி",
    titleEn: "May 18 — Mullivaikkal Memorial Documentary",
    descriptionTa: "தமிழீழ தேசிய நினைவேந்தல் நாள் மற்றும் மாவீரர்கள், பொதுமக்களின் தியாகங்களை நினைவுகூரும் சிறப்பு ஆவணப் பதிவு.",
    descriptionEn: "Solemn memorial documentary commemorating the martyrs and civilian sacrifices of May 18 Mullivaikkal.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FMay-18---Memorial-Day%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/7.webp",
    categoryTa: "நினைவேந்தல்",
    categoryEn: "Memorial",
    duration: "4:32",
    publishedDate: "2026",
  },
  {
    id: "8",
    titleTa: "தலைவர் — காட்சிப்படுத்தும் புத்தகக் காணொளி",
    titleEn: "Leader — Book Presentation Showcase",
    descriptionTa: "தேசியத் தலைவரின் வரலாற்று ஆவண நூல்கள் மற்றும் வாழ்க்கை வரலாற்றுப் புத்தகங்களின் காட்சிப்படுத்தல்.",
    descriptionEn: "Visual preview and historical monograph presentation on National Leader Velupillai Prabhakaran.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FT-H-A-L-A-I-V-A-R%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/8.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "3:45",
    publishedDate: "2026",
  },
  {
    id: "9",
    titleTa: "திலீபம் — புத்தக வரலாற்று ஆவணக் காணொளி",
    titleEn: "Thileepam — Historical Book Showcase",
    descriptionTa: "தியாக தீபம் லெப். கேணல் திலீபன் அவர்களின் உண்ணாவிரத அறப்போர் மற்றும் 'திலீபம்' நூலின் முழு விபரம்.",
    descriptionEn: "Documentary preview exploring the non-violent struggle of Lt. Col. Thileepan and the book 'Thileepam'.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FDhilipam---TEVP-TEVP%3Ae?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/9.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "5:12",
    publishedDate: "2026",
  },
  {
    id: "10",
    titleTa: "யூலை 5 — கரும்புலிகள் நாள் சிறப்பு உரை & பதிவு",
    titleEn: "July 5 — Black Tigers Day Memorial Speech",
    descriptionTa: "1987 ஜூலை 5 அன்று நெல்லியடியில் கப்டன் மில்லர் நிகழ்த்திய முதல் கரும்புலித் தாக்குதலின் வரலாற்றுப் பதிவு.",
    descriptionEn: "Commemorating the first Black Tiger mission by Captain Miller at Nelliady on July 5, 1987.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FJuly-5-Black-Tigers-Speech%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/10.webp",
    categoryTa: "வரலாற்று ஆவணம்",
    categoryEn: "History",
    duration: "6:20",
    publishedDate: "2026",
  },
  {
    id: "11",
    titleTa: "யூலை 5 — கரும்புலிகள் நாள் சிறப்புத் தொகுப்பு",
    titleEn: "July 5 — Black Tigers Commemorative Archive",
    descriptionTa: "மாவீரர் கப்டன் மில்லர் முதல் தியாக வேள்வி புரிந்த கரும்புலி மாவீரர்களின் வரலாற்று ஆவணத் தொகுப்பு.",
    descriptionEn: "Archival tribute and historical retrospective dedicated to the Black Tigers.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FJuly-5-Black-Tigers-Speech-with-Edit%3A3?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/11.webp",
    categoryTa: "வரலாற்று ஆவணம்",
    categoryEn: "History",
    duration: "5:40",
    publishedDate: "2026",
  },
  {
    id: "12",
    titleTa: "கட்டுநாயக்கா தாக்குதல் — கள வரலாற்று ஆவணப் பதிவு",
    titleEn: "Katunayake Operation — Archival Tactical Record",
    descriptionTa: "2001 கட்டுநாயக்கா சர்வதேச விமான நிலைய வான்படைத் தளம் மீது 14 கரும்புலிகள் நடத்திய தாக்குதலின் தொகுப்பு.",
    descriptionEn: "Archival footage and tactical overview of the landmark July 24, 2001 Katunayake military airbase operation.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fkattanayaka%3A5?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/12.webp",
    categoryTa: "கள ஆவணம்",
    categoryEn: "Tactical",
    duration: "8:10",
    publishedDate: "2026",
  },
  {
    id: "13",
    titleTa: "குட்டிமணி — தங்கதுரை நினைவு நாள் வரலாற்றுப் பதிவு",
    titleEn: "Kuttimani & Thangadurai Memorial Monograph",
    descriptionTa: "வெலிக்கடை சிறைப்படுகொலை மாவீரர்கள் தங்கதுரை, குட்டிமணி ஆகியோரின் இறுதி உரை மற்றும் வீர வரலாறு.",
    descriptionEn: "Remembering pioneers Thangadurai and Kuttimani and their unforgettable courtroom address for Tamil freedom.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fkuttimani---thanga-durai%3A1?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/13.webp",
    categoryTa: "நினைவேந்தல்",
    categoryEn: "Memorial",
    duration: "4:50",
    publishedDate: "2026",
  },
  {
    id: "14",
    titleTa: "மீரா — முன்னேற்றப் பதிவு & வரலாற்று நூல்",
    titleEn: "Meera — Memoir & Documentary Profile",
    descriptionTa: "போராட்ட வரலாற்றின் முக்கிய நிகழ்வுகளையும் நினைவுகளையும் பதிவு செய்யும் 'மீரா' நூல் பற்றிய அறிமுகம்.",
    descriptionEn: "Special documentary preview and literary overview for the memoir work 'Meera'.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FMeera%3A8?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/14.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "3:15",
    publishedDate: "2026",
  },
  {
    id: "15",
    titleTa: "பொன்னிறை — முன்னேற்றப் பதிவு & கள அனுபவம்",
    titleEn: "Ponnirai — Memoir & Historical Perspective",
    descriptionTa: "களப் போராட்ட அனுபவங்களையும் வீர காவியங்களையும் தொகுக்கும் 'பொன்னிறை' நூலின் ஆவணக் காட்சி.",
    descriptionEn: "Visual monograph exploring the battlefront experiences and narrative of 'Ponnirai'.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FPonnirai%3A6?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/15.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "3:40",
    publishedDate: "2026",
  },
  {
    id: "16",
    titleTa: "புறநானூற்று வீரன் — புத்தகக் காணொளி",
    titleEn: "Purananooru Veeran — Book Trailer",
    descriptionTa: "திருமுருகன்காளிலிங்கம் எழுதிய பெருவிற்பனை வரலாற்று ஆய்வு நூல் 'புறநானூற்று வீரன்' அறிமுகக் காணொளி.",
    descriptionEn: "Official video preview of the acclaimed historical research monograph 'Purananooru Veeran'.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FPurananutru-Veeran%3Ac?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/16.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "3:30",
    publishedDate: "2026",
  },
  {
    id: "17",
    titleTa: "வரலாற்றுத் தலைவனின் வழிகாட்டல் — புத்தகக் காணொளி",
    titleEn: "Historical Leader's Guidance — Monograph Trailer",
    descriptionTa: "தேசியத் தலைவர் பிரபாகரன் அவர்களின் போரியல் மற்றும் அரசியல் வழிகாட்டல்களை விளக்கும் ஆவண நூல்.",
    descriptionEn: "Historical monograph detailing the strategic and political guidance of the National Leader.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FVaralaatru-Thalaivanin-valikaatal%3A0?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/17.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "4:20",
    publishedDate: "2026",
  },
  {
    id: "18",
    titleTa: "மேதகு களஞ்சியம் — வலைதள அறிமுகமும் நூல்கள் விநியோகமும்",
    titleEn: "Methagu Kalanjiyam — Platform & Delivery System",
    descriptionTa: "உலகத் தமிழர்களுக்கு அரிய தேசிய இலக்கியங்களை தபால் வழியாக பாதுகாப்பாக கொண்டு சேர்க்கும் மேதகு களஞ்சியத்தின் சேவை.",
    descriptionEn: "Introduction to Methagu Kalanjiyam's mission to preserve and courier rare Tamil national literature worldwide.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FWebsite%3A27?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/18.webp",
    categoryTa: "அறிமுகம்",
    categoryEn: "Overview",
    duration: "2:55",
    publishedDate: "2026",
  },
  {
    id: "19",
    titleTa: "விநாயகம் மற்றும் பொட்டு அம்மான் — வரலாற்று ஆவணப் புத்தகம்",
    titleEn: "Vinayagam & Pottu Amman — Intelligence & Tactical Monograph",
    descriptionTa: "விடுதலைப் புலிகளின் உளவுத்துறை மற்றும் சிறப்புப் படை நடவடிக்கைகளின் வரலாற்றுப் பதிவுகள் கொண்ட நூல்.",
    descriptionEn: "Tactical profile and intelligence history documentary on key commanders Vinayagam and Pottu Amman.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2FVinayagam-and-pottu-amman%3A9?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/19.webp",
    categoryTa: "கள ஆவணம்",
    categoryEn: "Tactical",
    duration: "5:05",
    publishedDate: "2026",
  },
  {
    id: "20",
    titleTa: "புறநானூறு 2 — புத்தகக் காணொளி",
    titleEn: "Purananooru Part 2 — Book Trailer",
    descriptionTa: "சங்க இலக்கிய வீரமும் சமகால விடுதலைப் போரின் தியாகங்களும் இணைந்த வரலாற்றுத் தொடர் நூல்.",
    descriptionEn: "Connecting classical Sangam heroism with modern national liberation history.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fpurananuru-2%3A3?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/20.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "3:45",
    publishedDate: "2026",
  },
  {
    id: "21",
    titleTa: "நெஞ்சுரம் — வரலாற்று ஆவணப் புத்தகக் காணொளி",
    titleEn: "Nenjuram — Fortitude of Spirit Book Trailer",
    descriptionTa: "துளசிச்செல்வன் எழுதிய கள அனுபவ ஆவணப் புத்தகம் 'நெஞ்சுரம்' நூலின் சிறப்பு அறிமுகக் காட்சிப்பதிவு.",
    descriptionEn: "Video showcase for Thulasichelvan's powerful memoir 'Nenjuram — Fortitude of Spirit'.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fnenjuram%3Ac?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/21.webp",
    categoryTa: "புத்தகக் காணொளி",
    categoryEn: "Book Showcase",
    duration: "4:15",
    publishedDate: "2026",
  },
  {
    id: "22",
    titleTa: "தளபதி விநாயகம் — வரலாற்று ஆவணப் புத்தகம் பகுதி 1",
    titleEn: "Commander Vinayagam — Historical Monograph Part 1",
    descriptionTa: "களமுனைகளில் தளபதி விநாயகம் அவர்களின் போர்த்திறன் மற்றும் தியாகங்களை விளக்கும் வரலாற்று ஆவணம்.",
    descriptionEn: "Biographical documentary and battlefield monograph on legendary commander Vinayagam.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fthalapathi-vinayagam%3Ac?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/22.webp",
    categoryTa: "கள ஆவணம்",
    categoryEn: "Tactical",
    duration: "4:40",
    publishedDate: "2026",
  },
  {
    id: "23",
    titleTa: "தளபதி விநாயகம் — வரலாற்று ஆவணக் காணொளி பகுதி 2",
    titleEn: "Commander Vinayagam — Historical Monograph Part 2",
    descriptionTa: "தளபதி விநாயகம் அவர்களின் இறுதிப் போர் நடவடிக்கைகள் மற்றும் ஈகத்தை ஆவணப்படுத்தும் பகுதி 2.",
    descriptionEn: "Part 2 archival documentary detailing the culminating battlefield operations and supreme sacrifice.",
    embedUrl: "https://odysee.com/%24/embed/%40Methagu_kalanjiyam%3A7%2Fthalapathi-vinayagam1%3A7?r=6xcYAw9JZsByyDRs15seJiTu86nXt3Ln",
    posterImage: "/images/video-posters/23.webp",
    categoryTa: "கள ஆவணம்",
    categoryEn: "Tactical",
    duration: "5:20",
    publishedDate: "2026",
  },
];

const categoryOptions: CategoryOption[] = [
  { slug: "book-showcase", labelTa: "புத்தகக் காணொளி", labelEn: "Book Showcase" },
  { slug: "memorial", labelTa: "நினைவேந்தல்", labelEn: "Memorials" },
  { slug: "history", labelTa: "வரலாற்று ஆவணம்", labelEn: "History" },
  { slug: "tactical", labelTa: "கள ஆவணம்", labelEn: "Tactical" },
  { slug: "overview", labelTa: "அறிமுகம்", labelEn: "Overview" },
];

function getAutoplayUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("autoplay", "true");
    u.searchParams.set("muted", "0");
    u.searchParams.set("playsinline", "1");
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}autoplay=true&muted=0&playsinline=1`;
  }
}

export default function VideosPage() {
  const { locale } = useLanguage();
  const isTa = locale === "ta";
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  // In-feed playback state: ID of the currently playing card in the feed
  const [playingVideoId, setPlayingVideoId] = React.useState<string | null>(null);

  // Optional full theater modal state
  const [modalVideo, setModalVideo] = React.useState<VideoData | null>(null);

  // Filter pipeline
  const filteredVideos = React.useMemo(() => {
    let list = [...allVideos];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.titleTa.toLowerCase().includes(q) ||
          v.titleEn.toLowerCase().includes(q) ||
          v.descriptionTa.toLowerCase().includes(q) ||
          v.descriptionEn.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      const catObj = categoryOptions.find((c) => c.slug === selectedCategory);
      if (catObj) {
        list = list.filter(
          (v) =>
            v.categoryTa.toLowerCase() === catObj.labelTa.toLowerCase() ||
            v.categoryEn.toLowerCase() === catObj.labelEn.toLowerCase()
        );
      }
    }

    return list;
  }, [search, selectedCategory]);

  // Stop playback when category or search changes to prevent hidden audio
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setPlayingVideoId(null);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPlayingVideoId(null);
  };

  // Lock body scroll and close modal on Escape
  React.useEffect(() => {
    if (modalVideo) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setModalVideo(null);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [modalVideo]);

  return (
    <div className="min-h-[100dvh] pb-24">
      {/* Top Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Breadcrumbs
          items={[
            { label: isTa ? "காணொளி ஆவணங்கள்" : "Video Archives" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111111] tracking-tight font-tamil leading-tight">
            {isTa ? "காணொளி ஆவணங்கள்" : "Video Documentaries & Previews"}
          </h1>
          <p className="text-sm sm:text-base text-[#444444] font-tamil max-w-2xl mx-auto leading-relaxed">
            {isTa
              ? "மேதகு களஞ்சியத்தின் அரிய வரலாற்று ஆவணங்கள், புத்தக அறிமுகக் காட்சிகள் மற்றும் மாவீரர் நினைவேந்தல் காணொளிகள் நேரடியாக இங்கே காணலாம்."
              : "Rare archival video clips, literary book trailers, and historic documentary footage playable directly in the feed."}
          </p>
        </div>

        {/* Archival Panorama Banner Frame */}
        <div className="relative aspect-[21/9] sm:aspect-[2.6/1] w-full rounded-3xl overflow-hidden border border-black/10 shadow-lg bg-black">
          <Image
            src="/images/brand/banner-video-archive.webp"
            alt={isTa ? "வீடியோ ஆவணங்கள் வரலாற்று பதாகை" : "Archival Video Records Panorama"}
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 sm:p-8">
            <div className="text-white space-y-1">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-300 font-bold font-tamil">
                {isTa ? "வரலாற்று ஒலி-ஒளி காப்பகம்" : "Archival Audio-Visual Repository"}
              </span>
              <p className="text-xs sm:text-sm font-tamil text-white/90 max-w-xl">
                {isTa
                  ? "தலைவரின் வரலாற்றுப் பிரகடனங்கள், புத்தக முன்னோட்டங்கள் மற்றும் களத்து நினைவேந்தல் ஆவணங்கள்"
                  : "Preserved speeches, literary monographs, and solemn memorial documentaries from national archives"}
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Search + Categories */}
        <div className="space-y-4 pt-4 border-t border-black/8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A6847]" />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={isTa ? "காணொளிகளைத் தேடுக (Search videos)..." : "Search videos..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/12 bg-white/80 text-base sm:text-sm font-tamil text-[#111111] placeholder:text-[#777777] focus:outline-none focus:ring-2 focus:ring-[#0A6847]/40 focus:border-[#0A6847] transition-all min-h-[44px]"
              />
            </div>

            <span className="text-xs font-semibold text-[#555555] font-tamil self-center sm:self-auto">
              {isTa
                ? `${filteredVideos.length} காணொளிகள் கிடைக்கின்றன`
                : `${filteredVideos.length} videos available`}
            </span>
          </div>

          <CategoryPills
            categories={categoryOptions}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
            locale={locale}
          />
        </div>

        {/* Video Grid with In-Feed Playback */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" id="videos-feed-grid">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                locale={locale}
                isPlaying={playingVideoId === video.id}
                onPlay={(v) => {
                  setPlayingVideoId(v.id);
                }}
                onStop={() => {
                  setPlayingVideoId(null);
                }}
                onExpand={(v) => {
                  setModalVideo(v);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Film className="h-10 w-10 text-[#0A6847]" />}
            titleTa="காணொளிகள் எதுவும் கிடைக்கவில்லை"
            titleEn="No Videos Found"
            descriptionTa="நீங்கள் தேடிய தலைப்பில் காணொளிகள் இல்லை. மாற்று சொற்களைப் பயன்படுத்தி மீண்டும் தேடவும்."
            descriptionEn="No videos matched your search query. Try another term or clear active filters."
            actionLabelTa="அனைத்து காணொளிகளையும் காண்க"
            actionLabelEn="View All Videos"
            onAction={() => {
              setSearch("");
              setSelectedCategory("all");
              setPlayingVideoId(null);
            }}
          />
        )}

      </div>

      {/* Full Theater Modal (Optional Expansion Mode) */}
      {modalVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setModalVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-neutral-900 border-b border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-[#0A6847] text-white flex items-center justify-center">
                  <Play className="h-4 w-4 ml-0.5 fill-white" />
                </div>
                <h3 id="video-modal-title" className="text-sm sm:text-base font-bold text-white font-tamil line-clamp-1">
                  {isTa ? modalVideo.titleTa : modalVideo.titleEn}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setModalVideo(null)}
                className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                aria-label={isTa ? "மூடுக" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player Iframe */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={getAutoplayUrl(modalVideo.embedUrl)}
                title={isTa ? modalVideo.titleTa : modalVideo.titleEn}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>

            {/* Modal Footer Description */}
            <div className="p-4 sm:p-5 bg-neutral-900 text-xs sm:text-sm text-neutral-300 font-tamil leading-relaxed">
              {isTa ? modalVideo.descriptionTa : modalVideo.descriptionEn}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
