"use client";

import { Navigation } from "../components/Navigation";
import { MobileHeader } from "../components/MobileHeader";
import { Footer } from "../components/Footer";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { Sparkles, History, Target, Shield, MapPin, ArrowRight, Star, Quote } from "lucide-react";

export default function About() {
  const router = useRouter();
  const { theme } = useTheme();
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleCategoryChange = useCallback((newCategory: string) => {
    setTimeout(() => {
      router.push("/");
    }, 100);
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-1000">
      <Navigation
        category={category}
        onCategoryChange={handleCategoryChange}
        currency={currency}
        onCurrencyChange={setCurrency}
      />
      <MobileHeader
        category={category}
        onCategoryChange={handleCategoryChange}
        currency={currency}
        onCurrencyChange={setCurrency}
      />

      <main className="flex-1 w-full overflow-hidden">
        {/* Cinematic Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden py-24 px-4">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-lime-500/10 via-transparent to-transparent dark:from-lime-500/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-lime-500/5 rounded-full blur-[120px] animate-pulse" />
          </div>

          <div className={`relative z-10 max-w-5xl mx-auto text-center space-y-8 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-600 dark:text-lime-400 text-xs md:text-sm font-black tracking-widest uppercase">
              <Sparkles className="h-4 w-4" />
              Established 2019
            </div>
            <h1 className="text-6xl md:text-9xl font-black leading-none tracking-tight">
              Our <span className="bg-gradient-to-r from-lime-600 to-green-600 dark:from-lime-400 dark:to-green-400 bg-clip-text text-transparent">Story</span>
            </h1>
            <p className="text-xl md:text-3xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed font-medium">
              We don&apos;t just make costumes. We craft the art of <span className="text-gray-900 dark:text-white font-black">transformation</span>, one masterpiece at a time.
            </p>

            {/* Removed stats section */}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-32 pb-32">

          {/* Legend Section */}
          <section className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`space-y-8 transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
              <div className="flex items-center gap-4 text-lime-600 dark:text-lime-500 font-black tracking-widest uppercase text-sm">
                <History className="h-5 w-5" />
                The Genesis
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight">
                Where Passion Meets <span className="italic font-serif">Craft</span>
              </h2>
              <div className="space-y-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>
                  EMPI Costumes isn&apos;t just a business; it&apos;s a dream realized. Born in 2019 in the heart of Lagos, our journey began with two visionaries—<span className="text-gray-900 dark:text-white font-bold">Money Precious Odiriverere</span> and <span className="text-gray-900 dark:text-white font-bold">Onuoha Peter</span>.
                </p>
                <div className="relative p-8 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 italic font-medium">
                  <Quote className="absolute top-4 left-4 h-8 w-8 text-lime-500/20" />
                  &quot;We saw a gap in the industry where storytelling was missing from costumes. We wanted to build characters, not just clothes.&quot;
                </div>
                <p>
                  In 2020, <span className="text-gray-900 dark:text-white font-bold">Oyinkansola Adejomehin</span> joined the ranks, infusing the brand with new creative energy that propelled EMPI to become a registered Limited Liability Company and a beacon of excellence in Nigeria.
                </p>
              </div>
            </div>
            <div className={`relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-lime-500/20 to-green-600/20 mix-blend-overlay z-10" />
              <img
                src="/empiimages/IMG_1216.JPG"
                alt="EMPI Craftsmanship"
                className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-[2000ms]"
              />
              <div className="absolute bottom-8 left-8 right-8 p-6 glass-morphism rounded-2xl border border-white/20 z-20">
                <p className="text-white font-bold">The EMPI Atelier — Lagos, Nigeria</p>
              </div>
            </div>
          </section>

          {/* Mission & Vision - Dynamic Cards */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="group relative p-12 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-black dark:from-[#111] dark:to-black text-white overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-lime-500/20" />
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-lime-500 flex items-center justify-center shadow-lg shadow-lime-500/40">
                  <Target className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Our Mission</h3>
                <p className="text-xl text-gray-300 leading-relaxed font-medium">
                  To elevate creative craftsmanship and build a thriving costuming ecosystem in Nigeria that sets global benchmarks for excellence.
                </p>
              </div>
            </div>

            <div className="group relative p-12 rounded-[2.5rem] bg-gradient-to-br from-lime-600 to-green-600 text-white overflow-hidden shadow-2xl">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32 transition-all group-hover:bg-white/20" />
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                  <Shield className="h-8 w-8 text-lime-600" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Our Vision</h3>
                <p className="text-xl text-white/90 leading-relaxed font-medium">
                  Becoming the global standard for African costume artistry, where every stitch tells a story of heritage and future.
                </p>
              </div>
            </div>
          </section>

          {/* Artisan Gallery Section */}
          <section className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Artisan Showcase</h2>
              <div className="h-1.5 w-24 bg-lime-500 mx-auto rounded-full" />
              <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto">
                A glimpse into our atelier, where raw materials are transformed into legendary characters.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { src: "/empiimages/IMG_0729.JPG", alt: "Craftsmanship 1" },
                { src: "/empiimages/IMG_0793.JPG", alt: "Craftsmanship 2" },
                { src: "/empiimages/IMG_9345.JPG", alt: "Craftsmanship 3" }
              ].map((img, idx) => (
                <div key={idx} className="group relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="text-white font-black text-sm uppercase tracking-widest">Detail & Precision</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Creation Carousel (Grid Style) */}
          <section className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white">Our Masteries</h2>
                <div className="h-1.5 w-24 bg-lime-500 rounded-full" />
              </div>
              <p className="text-gray-500 max-w-md font-medium">From the depth of traditional heritage to the pulse of modern cosplay.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: "🌍", title: "Cultural Heritage", desc: "Authentic African traditional designs" },
                { icon: "⚔️", title: "Cosplay Mastery", desc: "Legendary characters brought to life" },
                { icon: "🎨", title: "Carnival Spirits", desc: "Vibrant energy and rhythmic designs" },
                { icon: "🎭", title: "Theatrical Art", desc: "Props and stage-ready excellence" },
                { icon: "👑", title: "Royal Bespoke", desc: "Custom luxury for special moments" },
                { icon: "📸", title: "Content Styling", desc: "Ready for the digital spotlight" }
              ].map((item, idx) => (
                <div key={idx} className="group p-8 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-lime-500 dark:hover:border-lime-500 transition-all duration-500 hover:shadow-2xl hover:shadow-lime-500/10 hover:-translate-y-2">
                  <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-500 inline-block">{item.icon}</div>
                  <h4 className="text-xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{item.title}</h4>
                  <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Performance Highlight */}
          <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 py-20 px-8 md:px-16 text-white shadow-3xl">
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-lime-500/20 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-block px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest">
                Live Experiences
              </div>
              <h2 className="text-4xl md:text-6xl font-black leading-tight">Samba Dance <span className="text-lime-400">& Performances</span></h2>
              <p className="text-xl text-gray-300 leading-relaxed font-medium mx-auto max-w-2xl">
                Beyond the atelier, we ignite the stage. Our Samba Dance squad brings the energy of the carnival to your celebrations, draped in EMPI&apos;s signature custom wear.
              </p>
              {/* Removed performance social proof */}
            </div>
          </section>

          {/* Locations Section */}
          <section className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Find Us</h2>
              <p className="text-gray-500 font-medium">Our physical presence across Lagos.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  type: "Production Hub",
                  loc: "Iba New Site, Ojo, Lagos",
                  icon: <MapPin className="h-6 w-6" />,
                  color: "bg-blue-500",
                  bg: "bg-blue-50 dark:bg-blue-500/5",
                  border: "border-blue-100 dark:border-blue-500/20"
                },
                {
                  type: "Rental Showroom",
                  loc: "Surulere, Lagos",
                  icon: <MapPin className="h-6 w-6" />,
                  color: "bg-lime-500",
                  bg: "bg-lime-50 dark:bg-lime-500/5",
                  border: "border-lime-100 dark:border-lime-500/20"
                }
              ].map((loc, i) => (
                <div key={i} className={`p-10 rounded-[2.5rem] ${loc.bg} border ${loc.border} group hover:scale-[1.02] transition-all duration-500 shadow-xl`}>
                  <div className={`w-14 h-14 ${loc.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-black/10`}>
                    {loc.icon}
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{loc.type}</h4>
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-bold mb-4">{loc.loc}</p>
                  <Link href="https://maps.google.com" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:gap-4 transition-all">
                    Get Directions <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Ultimate CTA */}
          <section className="relative p-12 md:p-24 rounded-[4rem] bg-gradient-to-br from-lime-600 to-green-600 dark:from-lime-500 dark:to-green-600 text-white overflow-hidden shadow-[0_40px_80px_rgba(132,204,22,0.3)]">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="relative z-10 text-center space-y-8">
              <h2 className="text-5xl md:text-8xl font-black leading-none uppercase tracking-tighter">Join the Legend</h2>
              <p className="text-xl md:text-3xl text-white/80 max-w-2xl mx-auto font-medium">
                Whether it&apos;s your first cosplay or your next high-budget production, EMPI is your creative partner.
              </p>
              <div className="flex flex-wrap justify-center gap-6 pt-8">
                <Link
                  href="/auth"
                  className="px-12 py-5 bg-white text-lime-600 rounded-2xl font-black text-lg hover:scale-110 active:scale-95 transition-all shadow-2xl"
                >
                  Start Your Journey
                </Link>
                <Link
                  href="/"
                  className="px-12 py-5 bg-black/20 backdrop-blur-xl border border-white/20 text-white rounded-2xl font-black text-lg hover:bg-black/40 transition-all"
                >
                  Browse Creations
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}

