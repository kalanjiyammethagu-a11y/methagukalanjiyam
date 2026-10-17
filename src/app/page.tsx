import Link from "next/link";
import Image from "next/image";
import { BookOpen, ArrowRight, ShieldCheck, Truck, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { formatINR } from "@/lib/utils";

// Featured books from catalog
const featuredBooks = [
  {
    id: "1",
    title: "கட்டுநாயக்கா தாக்குதல் வெற்றி",
    author: "சாந்தி நேசக்கரம்",
    price: 100,
    category: "ஆவணத் தொகுப்பு",
    image: "/book 20.webp",
    stock: 10,
    slug: "katunayake-attack-victory",
  },
  {
    id: "2",
    title: "நெஞ்சுரம்",
    author: "துளசிச்செல்வன் (தேவராஜா ராஜ்மதன்)",
    price: 150,
    category: "வரலாறு",
    image: "/book 16.webp",
    stock: 8,
    slug: "nenjuram",
  },
  {
    id: "3",
    title: "திசை தவறாக்கணை தளபதிவிநாயகம்",
    author: "சாந்தி நேசக்கரம்",
    price: 85,
    category: "ஆவண நூல்",
    image: "/book 13.webp",
    stock: 15,
    slug: "dhisai-thavara-kanai",
  },
  {
    id: "4",
    title: "நிறையாப் பெருவெளி",
    author: "சாந்தி நேசக்கரம்",
    price: 85,
    category: "வரலாறு",
    image: "/book 12.webp",
    stock: 12,
    slug: "niraiyaa-peruveli",
  },
];

const categories = [
  { name: "வரலாறு & ஆவணங்கள்", slug: "history", count: "19 நூல்கள்", icon: "📜" },
  { name: "போராட்ட நினைவுகள்", slug: "memoirs", count: "15 நூல்கள்", icon: "🛡️" },
  { name: "ஆவணத் தொகுப்பு", slug: "archives", count: "12 நூல்கள்", icon: "📁" },
  { name: "தலைவர்கள் வரலாறு", slug: "biography", count: "8 நூல்கள்", icon: "⭐" },
];

export default function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* ============================================================
          HERO SECTION (Apple Minimal Glassmorphic)
          ============================================================ */}
      <section className="relative pt-6 sm:pt-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        
        {/* Subtle Ambient Glow (Non-distracting, organic) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#0A6847]/8 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A6847]/10 text-[#0A6847] text-xs font-semibold tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              <span>தமிழ்த் தேசிய ஆவணப் பெட்டகம்</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-[1.15] font-tamil">
              அழியாத வீர வரலாற்றை, <br className="hidden sm:inline" />
              <span className="text-[#0A6847] italic font-serif">ஆவணங்களாகக்</span> காப்போம்.
            </h1>

            <p className="text-base sm:text-lg text-[#555555] max-w-xl mx-auto lg:mx-0 leading-relaxed font-tamil">
              ஈழ விடுதலைப் போராட்டத்தின் தியாகங்கள், தலைவர்களின் சிந்தனைகள் மற்றும் அரிய வரலாற்று ஆவண நூல்களை உங்கள் இல்லத்திற்கு நேரடியாகப் பெறுங்கள்.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
              <Link href="/books">
                <Button size="lg" className="font-tamil gap-2">
                  <span>முழுத் தொகுப்பைக் காண்க</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="glass" size="lg" className="font-tamil">
                  <span>களஞ்சியப் பதிவுகள்</span>
                </Button>
              </Link>
            </div>

            {/* Micro Stats */}
            <div className="pt-6 border-t border-black/8 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
              <div>
                <span className="text-xl sm:text-2xl font-bold text-[#111111]">50+</span>
                <p className="text-xs text-[#666666] font-tamil mt-0.5">அரிய நூல்கள்</p>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-[#111111]">100%</span>
                <p className="text-xs text-[#666666] font-tamil mt-0.5">சரிபார்க்கப்பட்டவை</p>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold text-[#111111]">ST & Post</span>
                <p className="text-xs text-[#666666] font-tamil mt-0.5">பாதுகாப்பான அஞ்சல்</p>
              </div>
            </div>
          </div>

          {/* Right Floating Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <GlassPanel className="p-5 sm:p-6 max-w-sm w-full relative group">
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden shadow-xl bg-zinc-100 flex items-center justify-center">
                <img
                  src="/book 20.webp"
                  alt="கட்டுநாயக்கா தாக்குதல் வெற்றி"
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <Badge variant="in_stock" className="absolute top-3 right-3 shadow-sm">
                  கையிருப்பில் உள்ளது
                </Badge>
              </div>
              <div className="mt-4 space-y-1.5 font-tamil">
                <span className="text-xs text-[#0A6847] font-semibold">
                  ஆவணத் தொகுப்பு
                </span>
                <h3 className="font-bold text-base text-[#111111] line-clamp-1">
                  கட்டுநாயக்கா தாக்குதல் வெற்றி
                </h3>
                <p className="text-xs text-[#666666]">சாந்தி நேசக்கரம்</p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-[#111111]">₹100</span>
                  <Link href="/books/katunayake-attack-victory">
                    <Button size="sm" variant="primary">
                      ஆர்டர் செய்க
                    </Button>
                  </Link>
                </div>
              </div>
            </GlassPanel>
          </div>

        </div>
      </section>

      {/* ============================================================
          FEATURED BOOKS GRID
          ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs font-bold text-[#0A6847] uppercase tracking-wider block font-tamil">
              சிறப்புப் படைப்புகள்
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] font-tamil mt-1">
              வரலாற்று நூல்கள் (Featured Books)
            </h2>
          </div>
          <Link
            href="/books"
            className="text-xs sm:text-sm font-semibold text-[#0A6847] hover:underline flex items-center gap-1 font-tamil"
          >
            <span>அனைத்தும் காண்க</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBooks.map((book) => (
            <GlassPanel
              key={book.id}
              interactive
              className="p-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-zinc-100 shadow-sm">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                  <Badge
                    variant="in_stock"
                    className="absolute top-2.5 right-2.5 shadow-xs"
                  >
                    In Stock
                  </Badge>
                </div>

                <div className="space-y-1 font-tamil">
                  <span className="text-[11px] text-[#0A6847] font-semibold">
                    {book.category}
                  </span>
                  <h3 className="font-bold text-sm text-[#111111] line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-[#666666] line-clamp-1">
                    {book.author}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/6 flex items-center justify-between">
                <span className="text-base font-bold text-[#111111]">
                  {formatINR(book.price)}
                </span>
                <Link href={`/books/${book.slug}`}>
                  <Button size="sm" variant="primary">
                    வாங்குக
                  </Button>
                </Link>
              </div>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* ============================================================
          CATEGORIES GRID
          ============================================================ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-bold text-[#0A6847] uppercase tracking-wider block font-tamil">
            பிரிவுகள் வாரியாக
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111] font-tamil mt-1">
            நூல் வகைகள் (Categories)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/books?category=${cat.slug}`}>
              <GlassPanel interactive className="p-5 flex items-center gap-4">
                <span className="text-3xl">{cat.icon}</span>
                <div className="font-tamil">
                  <h4 className="text-sm font-bold text-[#111111]">
                    {cat.name}
                  </h4>
                  <span className="text-xs text-[#666666]">{cat.count}</span>
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
