"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Navigation } from "./components/Navigation";
import { MobileHeader } from "./components/MobileHeader";
import { ProductGrid } from "./components/ProductGrid";
import { Footer } from "./components/Footer";
import { DiscountPopup } from "./components/DiscountPopup";
import { HeroSection } from "./components/HeroSection";
import { useHomeMode } from "./context/HomeModeContext";
import { useCurrency } from "./context/CurrencyContext";
import CustomCostumesPage from "./custom-costumes/page";
import { useTheme } from "./context/ThemeContext";
import { MagazineReader } from "./components/MagazineReader";


import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Wand2, ShoppingBag, Clock, ShieldCheck, Truck, BookOpen } from "lucide-react";
import { ScrollReveal } from "./components/ScrollReveal";
import { FloatingDecor } from "./components/FloatingDecor";
import { KineticScroll } from "./components/KineticScroll";


const magazineImages = [
  "/costumeshow/Image 11-07-2026 at 13.07.png",
  "/costumeshow/Image 11-07-2026 at 13.10.png",
  "/costumeshow/Image 11-07-2026 at 13.10 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.11.png",
  "/costumeshow/Image 11-07-2026 at 13.11 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.12.png",
  "/costumeshow/Image 11-07-2026 at 13.12 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.12 (2).png",
  "/costumeshow/Image 11-07-2026 at 13.13.png",
  "/costumeshow/Image 11-07-2026 at 13.13 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.13 (2).png",
  "/costumeshow/Image 11-07-2026 at 13.14.png",
  "/costumeshow/Image 11-07-2026 at 13.14 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.14 (2).png",
  "/costumeshow/Image 11-07-2026 at 13.40.png",
  "/costumeshow/Image 11-07-2026 at 13.41.png",
  "/costumeshow/Image 11-07-2026 at 13.41 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.42.png",
  "/costumeshow/Image 11-07-2026 at 13.42 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.42 (2).png",
  "/costumeshow/Image 11-07-2026 at 13.43.png",
  "/costumeshow/Image 11-07-2026 at 13.43 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.43 (2).png",
  "/costumeshow/Image 11-07-2026 at 13.44.png",
  "/costumeshow/Image 11-07-2026 at 13.44 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.44 (2).png",
  "/costumeshow/Image 11-07-2026 at 13.45.png",
  "/costumeshow/Image 11-07-2026 at 13.45 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.46.png",
  "/costumeshow/Image 11-07-2026 at 13.46 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.46 (2).png",
  "/costumeshow/Image 11-07-2026 at 13.47.png",
  "/costumeshow/Image 11-07-2026 at 13.47 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.47 (2).png",
  "/costumeshow/Image 11-07-2026 at 13.48.png",
  "/costumeshow/Image 11-07-2026 at 13.48 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.51.png",
  "/costumeshow/Image 11-07-2026 at 13.51 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.52.png",
  "/costumeshow/Image 11-07-2026 at 13.52 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.52 (2).png",
  "/costumeshow/Image 11-07-2026 at 13.53.png",
  "/costumeshow/Image 11-07-2026 at 13.53 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.53 (2).png",
  "/costumeshow/Image 11-07-2026 at 13.54.png",
  "/costumeshow/Image 11-07-2026 at 13.54 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.54 (2).png",
  "/costumeshow/Image 11-07-2026 at 13.55.png",
  "/costumeshow/Image 11-07-2026 at 13.55 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.56.png",
  "/costumeshow/Image 11-07-2026 at 13.57.png",
  "/costumeshow/Image 11-07-2026 at 13.57 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.58.png",
  "/costumeshow/Image 11-07-2026 at 13.58 (1).png",
  "/costumeshow/Image 11-07-2026 at 13.59.png",
  "/costumeshow/Image 11-07-2026 at 13.59 (1).png",
  "/costumeshow/Image 11-07-2026 at 14.00.png",
  "/costumeshow/Image 11-07-2026 at 14.01.png",
  "/costumeshow/Image 11-07-2026 at 14.02.png",
  "/costumeshow/Image 11-07-2026 at 14.02 (1).png",
  "/costumeshow/Image 11-07-2026 at 14.04.png",
  "/costumeshow/Image 11-07-2026 at 14.04 (1).png",
  "/costumeshow/Image 11-07-2026 at 14.04 (2).png",
  "/costumeshow/Image 11-07-2026 at 14.05.png",
  "/costumeshow/Image 11-07-2026 at 14.05 (1).png",
  "/costumeshow/Image 11-07-2026 at 14.05 (2).png",
  "/costumeshow/Image 11-07-2026 at 14.06.png",
  "/costumeshow/Image 11-07-2026 at 14.06 (1).png",
  "/costumeshow/Image 11-07-2026 at 14.06 (2).png",
  "/costumeshow/Image 11-07-2026 at 14.08.png",
  "/costumeshow/Image 11-07-2026 at 14.08 (1).png",
  "/costumeshow/Image 11-07-2026 at 14.09.png",
  "/costumeshow/Image 11-07-2026 at 14.09 (1).png",
  "/costumeshow/Image 11-07-2026 at 14.09 (2).png",
  "/costumeshow/Image 11-07-2026 at 14.10.png",
  "/costumeshow/Image 11-07-2026 at 14.10 (1).png",
  "/costumeshow/Image 11-07-2026 at 14.11.png",
  "/costumeshow/Image 11-07-2026 at 14.11 (1).png",
  "/costumeshow/Image 11-07-2026 at 14.11 (2).png",
  "/costumeshow/Image 11-07-2026 at 14.11 (3).png",
  "/costumeshow/Image 11-07-2026 at 14.12.png"
];

const dimensions = [
  {
    title: "Stage and theatrical costumes",
    bgImage: magazineImages[1], // Page 2 (Image 13.10.png)
    span: "lg:col-span-8 h-[500px]",
    index: "01"
  },
  {
    title: "Film and television costume design",
    bgImage: magazineImages[11], // Page 12 (Image 13.14.png)
    span: "lg:col-span-4 h-[500px]",
    index: "02"
  },
  {
    title: "Cultural and heritage-inspired costumes",
    bgImage: magazineImages[69], // Page 70 (Image 13.53 (1).png)
    span: "lg:col-span-4 h-[600px]",
    index: "03"
  },
  {
    title: "Avant-garde and futuristic costume concepts",
    bgImage: magazineImages[3], // Page 4
    span: "lg:col-span-8 h-[600px]",
    index: "04"
  },
  {
    title: "Fantasy, mythological, and character-based creations",
    bgImage: magazineImages[4], // Page 5
    span: "lg:col-span-6 h-[420px]",
    index: "05"
  },
  {
    title: "Contemporary performance and entertainment costumes",
    bgImage: magazineImages[5], // Page 6
    span: "lg:col-span-6 h-[420px]",
    index: "06"
  }
];


export default function Home() {
  const { currency, setCurrency } = useCurrency();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState("adults");
  const [searchQuery, setSearchQuery] = useState("");
  const { mode, setMode } = useHomeMode();
  const { theme } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized.current) return;

    // Read category and search query from URL params
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("q");

    if (categoryParam && (categoryParam === "adults" || categoryParam === "kids" || categoryParam === "custom")) {
      setCategory(categoryParam);
    }

    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // If custom is selected, show the custom costumes page instead
  if (category === "custom") {
    return (
      <div className="animate-in fade-in duration-500">
        <CustomCostumesPage
          category={category}
          onCategoryChange={setCategory}
          currency={currency}
          onCurrencyChange={setCurrency}
        />
      </div>
    );
  }

  // Only render when hydrated to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
      </div>
    );
  }

  const categories = [
    {
      title: "Adult Collection",
      desc: "Premium historical, themed, and party costumes.",
      image: magazineImages[8],
      link: "/shop?category=adults",
      icon: <Sparkles className="w-5 h-5" />,
      color: "from-slate-900 to-slate-800"
    },
    {
      title: "Kids Fantasy",
      desc: "Magical outfits for the little ones.",
      image: magazineImages[9],
      link: "/shop?category=kids",
      icon: <Wand2 className="w-5 h-5" />,
      color: "from-lime-600 to-lime-500"
    },
    {
      title: "Bespoke Design",
      desc: "Custom made to your exact specifications.",
      image: magazineImages[10],
      link: "/custom-costumes",
      icon: <ShoppingBag className="w-5 h-5" />,
      color: "from-amber-600 to-amber-500"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white">
      {/* Navigation */}
      <Navigation
        category={category}
        onCategoryChange={setCategory}
        currency={currency}
        onCurrencyChange={setCurrency}
        mode={mode}
        onModeChange={setMode}
      />

      <MobileHeader
        category={category}
        onCategoryChange={setCategory}
        currency={currency}
        onCurrencyChange={setCurrency}
        mode={mode}
        onModeChange={setMode}
      />

      <HeroSection />

      <div className="relative overflow-hidden">
        <FloatingDecor />
        <DiscountPopup intervalMinutes={7} />

        <ScrollReveal y={20} delay={0.1}>
          {/* Trust Bar - Refined and Integrated */}
          <div className={`py-10 border-b border-gray-100 dark:border-white/5 ${theme === 'dark' ? 'bg-black/40' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                {[
                  { icon: <Clock className="w-5 h-5 text-lime-600" />, title: "Rapid Fulfillment", desc: "Expert tailoring in record time" },
                  { icon: <ShieldCheck className="w-5 h-5 text-lime-600" />, title: "Elite Artistry", desc: "Master-crafted in our local studio" },
                  { icon: <Truck className="w-5 h-5 text-lime-600" />, title: "Seamless Logistics", desc: "Direct delivery across Lagos" },
                  { icon: <Sparkles className="w-5 h-5 text-lime-600" />, title: "Bespoke Precision", desc: "Tailored to your unique spirit" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 group">
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl group-hover:bg-lime-500/10 transition-colors duration-500 border border-transparent group-hover:border-lime-500/20">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Mobile-only Costume Show Highlight Page - Full Width */}
        <div className="block lg:hidden pb-12 w-full">
          <div className="relative overflow-hidden shadow-2xl border-y border-white/5 w-full">
            <Image 
              src="/costumeshow/Image 11-07-2026 at 13.10 (1).png" 
              alt="Costume Show Highlight"
              width={750}
              height={1000}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* The Movement Section */}
        <ScrollReveal y={30} delay={0.15}>
          <section className="py-24 relative max-w-7xl mx-auto px-6 border-b border-gray-100 dark:border-white/5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
              <div className="lg:col-span-5 space-y-6">
                <div className="w-12 h-1 bg-lime-500" />
                <h2 className="text-3xl md:text-4xl font-black font-playfair uppercase tracking-tight leading-tight">
                  A Movement <br />
                  Beyond Creative <br />
                  <span className="text-lime-500 italic">Boundaries.</span>
                </h2>
                <p className="font-medium leading-relaxed text-gray-500 dark:text-gray-400">
                  In every generation, there comes a movement that challenges creative boundaries, redefines artistic expression, and gives new meaning to culture through visual storytelling.
                </p>
              </div>
              <div className="lg:col-span-7 border rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                <div className="absolute top-0 right-0 w-24 h-24 bg-lime-500/10 rounded-full blur-2xl" />
                <p className="text-lg md:text-xl leading-relaxed font-semibold mb-6 text-neutral-800 dark:text-gray-200">
                  "THE COSTUME SHOW is an innovative platform created to celebrate, showcase, and elevate the art of costume design and creative fashion expression."
                </p>
                <p className="text-sm leading-relaxed text-neutral-500 dark:text-gray-400">
                  More than just a show, it is a creative experience, a cultural statement, and a growing movement dedicated to exploring the limitless possibilities of costume artistry in modern times.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Celebration & Magazine Gallery Section */}
        <ScrollReveal y={40} delay={0.2}>
          <section className="py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-0 md:px-6">
              <div className="text-center max-w-3xl mx-auto mb-16 px-6 md:px-0">
                <h2 className="text-3xl md:text-5xl font-black uppercase font-playfair mb-6">
                  Creativity Without <span className="text-lime-500 italic">Limits</span>
                </h2>
                <p className="text-base md:text-lg leading-relaxed text-neutral-600 dark:text-gray-300">
                  At its core, THE COSTUME SHOW is a celebration of creativity where fashion meets storytelling, where tradition meets innovation, and where artistic expression takes physical form.
                </p>
              </div>

              {/* Editorial Magazine Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-0 md:gap-8">
                {dimensions.map((dim, idx) => (
                  <div
                    key={idx}
                    className={`group relative rounded-none md:rounded-2xl overflow-hidden border-0 md:border transition-all duration-500 flex flex-col justify-end p-8 ${dim.span} border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5`}
                  >
                    <div className="absolute inset-0 z-0 opacity-[0.88] group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700 ease-out">
                      <Image
                        src={dim.bgImage}
                        alt={dim.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>

                    <div className="relative z-10 text-white text-left font-outfit">
                      <span className="text-xs font-mono text-lime-400 tracking-widest block mb-1">
                        {dim.index} // COLLECTION
                      </span>
                      <h3 className="text-xl md:text-2xl font-black font-playfair uppercase tracking-tight">
                        {dim.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 p-6 rounded-2xl border max-w-4xl mx-auto text-center backdrop-blur-sm bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5">
                <p className="text-sm md:text-base leading-relaxed text-neutral-600 dark:text-gray-300">
                  Every piece showcased tells a story. Every design carries emotion, purpose, and identity. Through this platform, audiences are invited into the minds of creators, to see not just what is worn, but what it represents.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <main className="flex-grow">


          <ScrollReveal y={60}>
            {/* The Runway Collection Section */}
            <KineticScroll>
              <section className={`py-6 md:py-24 ${theme === 'dark' ? 'bg-black/40' : 'bg-slate-50'}`}>
                <div className="max-w-7xl mx-auto px-6">
                  <div className="flex items-end justify-between mb-8 md:mb-12">
                    <div>
                      <h2 className="text-3xl md:text-5xl font-black mb-2 md:mb-4 font-playfair tracking-tight">The Runway Collection</h2>
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-xs md:text-base">Exclusive hand-crafted showpieces designed for the runway.</p>
                    </div>
                    <Link href="/costume-show-shop" className="hidden md:flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 px-8 py-4 rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95">
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div id="product-grid">
                    <ProductGrid
                      currency={currency}
                      category="costume-show"
                      mode={mode}
                      onModeChange={setMode}
                      limit={8}
                      hideHeader={true}
                      hideFilters={true}
                    />
                  </div>

                  <div className="mt-12 text-center md:hidden">
                    <Link href="/costume-show-shop" className="inline-flex items-center gap-2 bg-slate-900 dark:bg-lime-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl">
                      Shop the Show <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </section>
            </KineticScroll>
          </ScrollReveal>





          {/* The Evolution of Costume Creativity */}
          <ScrollReveal y={40} delay={0.2}>
            <section className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
                <div className="lg:col-span-7 space-y-6 animate-in fade-in slide-in-from-left duration-700">
                  <div className="w-12 h-1 bg-lime-500 animate-pulse" />
                  <h2 className="text-3xl md:text-5xl font-black font-playfair uppercase tracking-tight leading-tight">
                    The Evolution of <br />
                    Costume Creativity
                  </h2>
                  <p className="text-base md:text-lg leading-relaxed text-gray-300 font-medium">
                    Costume design has evolved tremendously over the years. What once served purely functional purposes has transformed into one of the most powerful tools of visual communication.
                  </p>
                  <p className="text-sm leading-relaxed text-gray-400">
                    Across global entertainment industries from Broadway productions to Nollywood films, fashion editorials, live performances, and cultural festivals, costume has become an essential storytelling language. In Nigeria especially, costume artistry continues to grow as creatives merge indigenous heritage with contemporary design, creating pieces that speak both locally and globally. THE COSTUME SHOW embraces this evolution by becoming a stage where history, technology, craftsmanship, culture, and imagination coexist.
                  </p>
                </div>
                <div className="lg:col-span-5 relative group">
                  <div className="absolute -inset-4 bg-lime-500/10 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative p-3 bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="relative w-full h-[400px]">
                      <Image
                        src={magazineImages[6]}
                        alt="Evolution of Costume design"
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* The First Show Section */}
          <ScrollReveal y={40} delay={0.2}>
            <section className="py-24 relative border-t border-white/5 bg-black/20">
              <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
                  <div className="lg:col-span-5 relative order-2 lg:order-1 group">
                    <div className="absolute -inset-4 bg-lime-500/10 rounded-3xl blur-2xl opacity-50" />
                    <div className="relative p-3 bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                      <div className="relative w-full h-[400px]">
                        <Image
                          src={magazineImages[7]}
                          alt="Debut Show Character"
                          fill
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          className="object-cover rounded-2xl"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
                    <div className="w-12 h-1 bg-lime-500" />
                    <h2 className="text-3xl md:text-5xl font-black font-playfair uppercase tracking-tight leading-tight">
                      The First Show: <br />
                      A Beginning of <br />
                      Something Powerful
                    </h2>
                    <p className="text-base md:text-lg leading-relaxed text-gray-300 font-medium">
                      The debut edition of THE COSTUME SHOW marks the beginning of a bold creative journey. This first showcase serves as an introduction to the vision, a carefully curated experience featuring groundbreaking designs, immersive performances, unforgettable characters, and stories brought to life through costume.
                    </p>
                    <p className="text-sm leading-relaxed text-gray-400">
                      It is the moment where creators step out from behind the scenes and take center stage. It is where audiences witness the depth, discipline, and brilliance that costume creation truly demands. And most importantly, it sets the foundation for what promises to become a defining platform in the creative industry.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* Outro Cinematic Typography */}
          <ScrollReveal y={50} delay={0.2}>
            <section className="py-32 relative border-t border-white/5">
              <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
                <div className="space-y-6 mb-16">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-2xl md:text-4xl font-black tracking-widest uppercase font-playfair text-lime-400"
                  >
                    This is not just a show.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-2xl md:text-4xl font-black tracking-widest uppercase font-playfair text-lime-500"
                  >
                    This is a movement.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-2xl md:text-4xl font-black tracking-widest uppercase font-playfair text-lime-600"
                  >
                    This is a celebration of imagination.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-2xl md:text-4xl font-black tracking-widest uppercase font-playfair text-gray-200"
                  >
                    This is where stories are worn.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="text-2xl md:text-5xl font-black tracking-widest uppercase font-playfair text-white"
                  >
                    This is where the future is costumed.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 50, delay: 1 }}
                  className="space-y-8"
                >
                  <h2 className="text-4xl md:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-lime-500 to-green-500 font-playfair uppercase">
                    WELCOME TO THE COSTUME SHOW!!!
                  </h2>
                  <div className="pt-8">
                    <Link
                      href="/costume-show-shop"
                      className="px-10 py-5 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-400 hover:to-green-500 text-white font-black text-sm rounded-full shadow-lg shadow-lime-500/20 hover:shadow-xl hover:shadow-lime-500/35 transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center gap-2 group tracking-widest uppercase"
                    >
                      Enter the Showroom
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </section>
          </ScrollReveal>
        </main>
      </div>

      <Footer />
    </div>
  );
}
