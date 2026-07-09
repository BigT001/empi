"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
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


import Link from "next/link";
import { ArrowRight, Sparkles, Wand2, ShoppingBag, Clock, ShieldCheck, Truck, BookOpen } from "lucide-react";
import { ScrollReveal } from "./components/ScrollReveal";
import { FloatingDecor } from "./components/FloatingDecor";
import { KineticScroll } from "./components/KineticScroll";

const dimensions = [
  {
    title: "Stage & Theatrical",
    bgImage: "/empiimages/IMG_1217.JPG",
    span: "lg:col-span-8 h-[500px]",
    index: "01"
  },
  {
    title: "Film & Television",
    bgImage: "/empiimages/IMG_0793.JPG",
    span: "lg:col-span-4 h-[500px]",
    index: "02"
  },
  {
    title: "Cultural & Heritage",
    bgImage: "/empiimages/IMG_1216.JPG",
    span: "lg:col-span-4 h-[600px]",
    index: "03"
  },
  {
    title: "Avant-Garde & Futuristic",
    bgImage: "/empiimages/IMG_9345.JPG",
    span: "lg:col-span-8 h-[600px]",
    index: "04"
  },
  {
    title: "Fantasy & Character",
    bgImage: "/empiimages/IMG_0732.JPG",
    span: "lg:col-span-6 h-[420px]",
    index: "05"
  },
  {
    title: "Performance & Concert",
    bgImage: "/empiimages/IMG_0794.JPG",
    span: "lg:col-span-6 h-[420px]",
    index: "06"
  }
];

const futurePlans = [
  { title: "Annual Showcases", desc: "Setting a permanent stage for live, theatrical costume runway shows." },
  { title: "Creative Masterclasses", desc: "Interactive workshops led by industry veterans for aspiring creators." },
  { title: "Industry Collaborations", desc: "Bridging the gap between designers, Nollywood filmmakers, and theatres." },
  { title: "Exhibitions & Galleries", desc: "Museum-grade interactive installations where costumes are treated as physical art." },
  { title: "Talent Discoveries", desc: "Creating platforms and mentorships for emerging designers." },
  { title: "Awards & Recognitions", desc: "Celebrating craftsmanship and innovation in technical costume design." }
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
      image: "/empiimages/IMG_1217.JPG",
      link: "/shop?category=adults",
      icon: <Sparkles className="w-5 h-5" />,
      color: "from-slate-900 to-slate-800"
    },
    {
      title: "Kids Fantasy",
      desc: "Magical outfits for the little ones.",
      image: "/empiimages/IMG_9906.JPG",
      link: "/shop?category=kids",
      icon: <Wand2 className="w-5 h-5" />,
      color: "from-lime-600 to-lime-500"
    },
    {
      title: "Bespoke Design",
      desc: "Custom made to your exact specifications.",
      image: "/empiimages/IMG_0732.JPG",
      link: "/custom-costumes",
      icon: <ShoppingBag className="w-5 h-5" />,
      color: "from-amber-600 to-amber-500"
    }
  ];

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-1000 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'
      }`}>
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
                      <img
                        src={dim.bgImage}
                        alt={dim.title}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
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
          <ScrollReveal>
            {/* Shop by Category - Stepped 3-Column Layout */}
            <KineticScroll>
              <section className="py-6 md:py-24 max-w-7xl mx-auto px-6">
                <div className="text-center mb-6 md:mb-16">
                  <h2 className="text-3xl md:text-5xl font-black mb-2 font-playfair tracking-tight">Our Collections</h2>
                  <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium text-[10px] md:text-base uppercase tracking-widest">Select Your Style</p>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-10 pb-6 md:pb-0">
                  {categories.map((cat, i) => (
                    <Link
                      href={cat.link}
                      key={i}
                      className={`group relative h-[250px] md:h-[600px] rounded-2xl md:rounded-[3rem] overflow-hidden shadow-lg md:shadow-2xl transition-all duration-700
                      ${i === 1 ? 'mt-4 md:mt-0' : i === 2 ? 'mt-8 md:mt-0' : ''}
                      hover:scale-[1.02] active:scale-95`}
                    >
                      <img
                        src={cat.image}
                        alt={cat.title}
                        className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-x-0 bottom-0 p-3 md:p-10">
                        <div className={`w-7 h-7 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-white mb-2 md:mb-6 shadow-xl`}>
                          <div className="scale-[0.6] md:scale-100">
                            {cat.icon}
                          </div>
                        </div>
                        <h3 className="text-[10px] md:text-3xl font-black text-white mb-1 md:mb-3 font-playfair leading-tight uppercase tracking-tighter">
                          {cat.title.split(' ')[0]}
                        </h3>
                        <div className="flex items-center gap-1 text-lime-400 font-black text-[7px] md:text-xs uppercase tracking-widest">
                          <span>Go</span>
                          <ArrowRight className="w-2 h-2 md:w-3 md:h-3" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </KineticScroll>
          </ScrollReveal>

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

          <ScrollReveal x={-40} y={0}>
            {/* Bespoke CTA Section */}
            <KineticScroll>
              <section className="py-32 max-w-7xl mx-auto px-6">
                <div className="relative rounded-[4rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
                  <div className="absolute inset-0">
                    <img src="/empiimages/IMG_0732.JPG" alt="Bespoke" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />

                  <div className="relative z-10 grid lg:grid-cols-2 gap-20 p-12 md:p-24 items-center">
                    <div>
                      <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-lime-500/10 rounded-full border border-lime-500/20 text-lime-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                        <Sparkles className="w-4 h-4" />
                        The Bespoke Experience
                      </div>
                      <h2 className="text-5xl md:text-7xl font-black text-white mb-10 font-playfair leading-[1.1]">
                        Where <span className="text-lime-500 italic">Vision</span> <br />Meets Artistry.
                      </h2>
                      <p className="text-gray-400 text-lg md:text-xl mb-12 leading-relaxed max-w-xl font-medium">
                        Can't find the perfect piece? Our master couturiers create one-of-a-kind bespoke costumes tailored to your individual spirit and measurements.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-6">
                        <Link href="/custom-costumes" className="px-12 py-6 bg-lime-500 hover:bg-lime-400 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-lime-500/20 flex items-center justify-center gap-3 active:scale-95 group">
                          Begin Your Design <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </Link>
                        <Link href="/about" className="px-12 py-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 backdrop-blur-md">
                          The EMPI Process
                        </Link>
                      </div>
                    </div>
                    <div className="hidden lg:block relative group">
                      <div className="absolute -inset-8 bg-lime-500/20 rounded-full blur-[120px] opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
                      <div className="relative z-10 p-4 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 rotate-2 group-hover:rotate-0 transition-transform duration-1000">
                        <img src="/empiimages/IMG_1216.JPG" alt="Featured Work" className="w-full h-[650px] object-cover rounded-[2.5rem] shadow-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </KineticScroll>
          </ScrollReveal>

          {/* Beyond the Debut & Future Plans */}
          <ScrollReveal y={30} delay={0.15}>
            <section className="py-24 relative z-10 max-w-7xl mx-auto px-6 border-t border-slate-100 dark:border-white/5">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-black font-playfair uppercase">
                  Beyond The <span className="text-lime-500 italic">Debut</span>
                </h2>
                <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
                  The first show is only the beginning. We aim to expand into a larger creative movement with future plans focused on cultural growth.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {futurePlans.map((plan, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl border backdrop-blur-sm space-y-4 transition-all duration-300 transform hover:-translate-y-1 border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:border-lime-500/20 dark:hover:border-lime-500/20 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-lime-100 dark:bg-lime-950/40 text-lime-600 dark:text-lime-400">
                      {idx + 1}
                    </div>
                    <h3 className="text-lg font-bold uppercase tracking-tight text-neutral-800 dark:text-white">{plan.title}</h3>
                    <p className="text-xs leading-relaxed text-neutral-500 dark:text-gray-400">{plan.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-16 p-8 border rounded-3xl max-w-5xl mx-auto bg-gradient-to-r from-lime-100/20 to-emerald-100/20 dark:from-lime-950/20 dark:to-emerald-950/20 border-lime-600/10 dark:border-lime-500/10">
                <p className="text-sm md:text-base leading-relaxed font-semibold text-center text-neutral-700 dark:text-gray-300">
                  The long-term vision is to establish THE COSTUME SHOW as a leading creative institution; one that influences culture, empowers artists, and places costume design on the global stage. As the creative industry continues to evolve, the demand for originality, storytelling, and visual excellence becomes stronger than ever.
                </p>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal scale={0.95}>
            {/* Artisan Spotlight / Quote Section */}
            <section className={`py-32 overflow-hidden ${theme === 'dark' ? 'bg-black/80' : 'bg-slate-50/50'}`}>
              <div className="max-w-5xl mx-auto px-6 text-center">
                <span className="text-lime-600 font-black uppercase tracking-[0.4em] text-[10px] mb-12 block">A Note from Our Founder</span>
                <blockquote className="text-3xl md:text-5xl lg:text-6xl font-playfair italic text-slate-900 dark:text-white leading-tight mb-16 relative">
                  <span className="absolute -top-12 -left-8 text-lime-500/20 text-9xl font-serif">&ldquo;</span>
                  We don&apos;t just make costumes; we craft the skin for your next great story. Every thread is an invitation to become <span className="text-lime-600 underline decoration-lime-500/30 underline-offset-8">extraordinary</span>.
                  <span className="absolute -bottom-24 -right-8 text-lime-500/20 text-9xl font-serif">&rdquo;</span>
                </blockquote>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px w-12 bg-slate-300" />
                  <cite className="not-italic font-black text-slate-500 uppercase tracking-widest text-xs">EMPI Creation Studio, Lagos</cite>
                  <div className="h-px w-12 bg-slate-300" />
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal y={40} delay={0.2}>
            {/* Why EMPI - SEO Section */}
            <KineticScroll>
              <section className={`py-24 px-6 ${theme === 'dark' ? 'bg-black/60' : 'bg-white'}`}>
                <div className="max-w-7xl mx-auto">
                  <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                      <p className="text-lime-600 font-black uppercase tracking-widest mb-4">Lagos's Finest</p>
                      <h2 className="text-4xl md:text-5xl font-black mb-8 font-playfair tracking-tight">Why Choose EMPI <br />Costumes?</h2>
                      <div className="grid sm:grid-cols-2 gap-8">
                        {[
                          { title: "Lagos's Top Maker", desc: "Most trusted name in Nigeria with thousands of satisfied clients." },
                          { title: "Wide Selection", desc: "Thousands of themes from traditional to modern fantasy." },
                          { title: "Affordable Luxury", desc: "Premium quality at prices that make sense for everyone." },
                          { title: "Reliable Service", desc: "Professional alterations and on-time delivery across Lagos." }
                        ].map((item, i) => (
                          <div key={i}>
                            <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_10px_rgba(132,204,22,0.6)]" />
                              {item.title}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <img src="/empiimages/IMG_0793.JPG" className="rounded-3xl w-full h-80 object-cover shadow-xl" alt="Gallery" />
                      <img src="/empiimages/IMG_0794.JPG" className="rounded-3xl w-full h-80 object-cover shadow-xl translate-y-8" alt="Gallery" />
                    </div>
                  </div>
                </div>
              </section>
            </KineticScroll>
          </ScrollReveal>
        </main>
      </div>

      <Footer />
    </div>
  );
}
