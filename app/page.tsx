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


import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Wand2, ShoppingBag, Clock, ShieldCheck, Truck, BookOpen } from "lucide-react";
import { ScrollReveal } from "./components/ScrollReveal";
import { FloatingDecor } from "./components/FloatingDecor";
import { KineticScroll } from "./components/KineticScroll";

const dimensions = [
  {
    title: "Stage and theatrical costumes",
    bgImage: "/empiimages/IMG_1217.JPG",
    span: "lg:col-span-8 h-[500px]",
    index: "01"
  },
  {
    title: "Film and television costume design",
    bgImage: "/empiimages/IMG_0793.JPG",
    span: "lg:col-span-4 h-[500px]",
    index: "02"
  },
  {
    title: "Cultural and heritage-inspired costumes",
    bgImage: "/empiimages/IMG_1216.JPG",
    span: "lg:col-span-4 h-[600px]",
    index: "03"
  },
  {
    title: "Avant-garde and futuristic costume concepts",
    bgImage: "/empiimages/IMG_9345.JPG",
    span: "lg:col-span-8 h-[600px]",
    index: "04"
  },
  {
    title: "Fantasy, mythological, and character-based creations",
    bgImage: "/empiimages/IMG_0732.JPG",
    span: "lg:col-span-6 h-[420px]",
    index: "05"
  },
  {
    title: "Contemporary performance and entertainment costumes",
    bgImage: "/empiimages/IMG_0794.JPG",
    span: "lg:col-span-6 h-[420px]",
    index: "06"
  }
];

const futurePlans = [
  { title: "Annual Showcases", desc: "Annual costume showcases and live productions" },
  { title: "Masterclasses", desc: "Creative workshops and masterclasses for young designers" },
  { title: "Collaborations", desc: "Industry collaborations across film, theatre, fashion, and entertainment" },
  { title: "Exhibitions", desc: "Costume exhibitions and interactive installations" },
  { title: "Talent Discovery", desc: "Talent discovery platforms for emerging creators" },
  { title: "Partnerships", desc: "National and international partnerships" },
  { title: "Storytelling", desc: "Digital content, documentaries, and behind-the-scenes storytelling" },
  { title: "Awards & Recognitions", desc: "Awards and recognition programs for excellence in costume design" }
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
                    <img
                      src="/empiimages/IMG_9345.JPG"
                      alt="Evolution of Costume design"
                      className="w-full h-[400px] object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700"
                    />
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
                      <img
                        src="/empiimages/IMG_0732.JPG"
                        alt="Debut Show Character"
                        className="w-full h-[400px] object-cover rounded-2xl"
                      />
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
