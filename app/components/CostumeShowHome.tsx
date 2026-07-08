"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "../context/ThemeContext";

export function CostumeShowHome() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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

  return (
    <div className={`min-h-screen font-outfit overflow-x-hidden transition-colors duration-500 ${
      isDark ? 'bg-[#050505] text-white' : 'bg-[#FAF9F5] text-neutral-900'
    }`}>
      {/* Cinematic Glowing Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={`absolute top-[10%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[180px] ${
          isDark ? 'bg-lime-900/10' : 'bg-lime-100/20'
        }`} />
        <div className={`absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[150px] ${
          isDark ? 'bg-green-950/20' : 'bg-green-100/30'
        }`} />
        <div className={`absolute top-[50%] left-[30%] w-[700px] h-[700px] rounded-full blur-[200px] ${
          isDark ? 'bg-emerald-950/10' : 'bg-emerald-50/20'
        }`} />
      </div>

      {/* Hero Section */}
      <section className="relative lg:fixed inset-0 h-[85vh] lg:h-screen w-full z-0 flex items-center justify-center pt-20 lg:pt-24 pointer-events-none">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 select-none">
          <img
            src="/empiimages/IMG_1216.JPG"
            alt="Costume Show Hero Background"
            className="w-full h-full object-cover object-top"
          />
          {/* Subtle gradient to keep text readable without washing out the photo */}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pointer-events-auto text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-lime-400 text-xs font-black uppercase tracking-[0.3em] mb-8"
          >
            <Sparkles className="w-4 h-4 animate-pulse text-lime-500" />
            Empicostumes Presents
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="text-4xl md:text-7xl lg:text-[5.5rem] font-black leading-[0.95] tracking-tight uppercase font-playfair mb-6"
          >
            The Costume <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-green-500 italic font-black">
              Show
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-base md:text-xl font-semibold tracking-[0.15em] max-w-2xl mx-auto mb-12 uppercase text-gray-300"
          >
            Where Imagination Wears Form!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/costume-show-shop"
              className="px-8 py-4 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-400 hover:to-green-500 text-white font-extrabold text-sm rounded-full shadow-lg shadow-lime-500/20 hover:shadow-xl hover:shadow-lime-500/35 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 group"
            >
              Explore the 2026 Collection
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 ${
          isDark ? 'text-white/40' : 'text-black/40'
        }`}>
          <span className="text-[10px] font-black uppercase tracking-[0.25em]">Scroll Down</span>
          <div className="w-1.5 h-6 rounded-full bg-white/20 relative overflow-hidden">
            <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="w-1.5 h-1.5 bg-lime-500 rounded-full absolute top-1 left-0"
            />
          </div>
        </div>
      </section>

      {/* Overlay Scrollable Container */}
      <div className={`relative z-10 mt-0 lg:mt-[100vh] transition-colors duration-500 border-t ${
        isDark 
          ? 'bg-[#050505] border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.9)]' 
          : 'bg-[#FAF9F5] border-black/5 shadow-[0_-20px_40px_rgba(0,0,0,0.08)]'
      }`}>
        
        {/* The Movement Section */}
        <section className="py-24 relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="w-12 h-1 bg-lime-500" />
              <h2 className="text-3xl md:text-4xl font-black font-playfair uppercase tracking-tight leading-tight">
                A Movement <br />
                Beyond Creative <br />
                <span className={`italic ${isDark ? 'text-lime-400' : 'text-lime-600'}`}>Boundaries.</span>
              </h2>
              <p className={`font-medium leading-relaxed ${isDark ? 'text-gray-400' : 'text-neutral-600'}`}>
                In every generation, there comes a movement that challenges creative boundaries, redefines artistic expression, and gives new meaning to culture through visual storytelling.
              </p>
            </div>
            <div className={`lg:col-span-7 border rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-lime-500/10 rounded-full blur-2xl" />
              <p className={`text-lg md:text-xl leading-relaxed font-semibold mb-6 ${
                isDark ? 'text-gray-200' : 'text-neutral-800'
              }`}>
                "THE COSTUME SHOW is an innovative platform created to celebrate, showcase, and elevate the art of costume design and creative fashion expression."
              </p>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-neutral-500'}`}>
                More than just a show, it is a creative experience, a cultural statement, and a growing movement dedicated to exploring the limitless possibilities of costume artistry in modern times.
              </p>
            </div>
          </div>
        </section>

        {/* Celebration & Magazine Gallery Section */}
        <section className={`py-24 relative z-10 border-t ${
          isDark ? 'bg-black/40 border-white/5' : 'bg-black/[0.01] border-black/5'
        }`}>
          <div className="max-w-7xl mx-auto px-0 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 px-6 md:px-0">
              <h2 className="text-3xl md:text-5xl font-black uppercase font-playfair mb-6">
                Creativity Without <span className={`italic ${isDark ? 'text-lime-400' : 'text-lime-600'}`}>Limits</span>
              </h2>
              <p className={`text-base md:text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-neutral-600'}`}>
                At its core, THE COSTUME SHOW is a celebration of creativity where fashion meets storytelling, where tradition meets innovation, and where artistic expression takes physical form.
              </p>
            </div>

            {/* Editorial Magazine Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-0 md:gap-8">
              {dimensions.map((dim, idx) => (
                <div
                  key={idx}
                  className={`group relative rounded-none md:rounded-2xl overflow-hidden border-0 md:border transition-all duration-500 flex flex-col justify-end p-8 ${dim.span} ${
                    isDark ? 'md:border-white/10 md:bg-white/5' : 'md:border-black/10 md:bg-black/5'
                  }`}
                >
                  {/* Full Bleed Image Backdrop */}
                  <div className="absolute inset-0 z-0 opacity-[0.88] group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-700 ease-out">
                    <img
                      src={dim.bgImage}
                      alt={dim.title}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                    {/* Dark bottom vignette for legible text rendering */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>

                  {/* Serif Title Overlay (Clean magazine styling) */}
                  <div className="relative z-10 text-white text-left">
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

            <div className={`mt-16 p-6 rounded-2xl border max-w-4xl mx-auto text-center backdrop-blur-sm ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'
            }`}>
              <p className={`text-sm md:text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-neutral-600'}`}>
                Every piece showcased tells a story. Every design carries emotion, purpose, and identity. Through this platform, audiences are invited into the minds of creators, to see not just what is worn, but what it represents.
              </p>
            </div>
          </div>
        </section>

        {/* The Evolution Section */}
        <section className={`py-24 relative z-10 max-w-7xl mx-auto px-6 border-t ${
          isDark ? 'border-white/5' : 'border-black/5'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className={`lg:col-span-6 relative h-[400px] rounded-3xl overflow-hidden border ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}>
              <img
                src="/empiimages/IMG_9345.JPG"
                alt="Evolution of Costume design"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-4">
                <span className={`text-xs font-black uppercase tracking-[0.25em] flex items-center gap-2 ${
                  isDark ? 'text-lime-400' : 'text-lime-600'
                }`}>
                  <BookOpen className="w-4 h-4" /> Editorial & History
                </span>
                <h2 className="text-3xl md:text-4xl font-black font-playfair uppercase">
                  The Evolution of <br />
                  Costume <span className={`italic ${isDark ? 'text-lime-400' : 'text-lime-600'}`}>Creativity</span>
                </h2>
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-neutral-600'}`}>
                Costume design has evolved tremendously over the years. What once served purely functional purposes has transformed into one of the most powerful tools of visual communication.
              </p>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-neutral-500'}`}>
                Across global entertainment industries from Broadway productions to Nollywood films, fashion editorials, live performances, and cultural festivals, costume has become an essential storytelling language. In Nigeria especially, costume artistry continues to grow as creatives merge indigenous heritage with contemporary design, creating pieces that speak both locally and globally.
              </p>
              <div className={`p-4 border-l-2 rounded-r-xl ${
                isDark ? 'border-lime-500 bg-white/5' : 'border-lime-600 bg-black/5'
              }`}>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-neutral-800'}`}>
                  THE COSTUME SHOW embraces this evolution by becoming a stage where history, technology, craftsmanship, culture, and imagination coexist.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Debut Section */}
        <section className={`py-24 relative z-10 border-t ${
          isDark ? 'bg-black/60 border-white/5' : 'bg-black/[0.02] border-black/5'
        }`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1 space-y-6">
                <span className={`text-xs font-black uppercase tracking-[0.25em] ${
                  isDark ? 'text-lime-400' : 'text-lime-600'
                }`}>Act I: The Beginning</span>
                <h2 className="text-3xl md:text-4xl font-black font-playfair uppercase leading-tight">
                  The First Show: <br />
                  A Beginning of <br />
                  Something <span className={`italic ${isDark ? 'text-lime-400' : 'text-lime-600'}`}>Powerful</span>
                </h2>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-neutral-600'}`}>
                  The debut edition of THE COSTUME SHOW marks the beginning of a bold creative journey. This first showcase serves as an introduction to the vision, a carefully curated experience featuring groundbreaking designs, immersive performances, unforgettable characters, and stories brought to life through costume.
                </p>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-neutral-500'}`}>
                  It is the moment where creators step out from behind the scenes and take center stage. It is where audiences witness the depth, discipline, and brilliance that costume creation truly demands. And most importantly, it sets the foundation for what promises to become a defining platform in the creative industry.
                </p>
              </div>
              <div className={`lg:col-span-6 order-1 lg:order-2 relative h-[380px] rounded-3xl overflow-hidden border ${
                isDark ? 'border-white/10 shadow-2xl' : 'border-black/10 shadow-lg'
              }`}>
                <img
                  src="/empiimages/IMG_0732.JPG"
                  alt="Debut Show Character"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Beyond the Debut & Future Plans */}
        <section className={`py-24 relative z-10 max-w-7xl mx-auto px-6 border-t ${
          isDark ? 'border-white/5' : 'border-black/5'
        }`}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black font-playfair uppercase">
              Beyond The <span className={`italic ${isDark ? 'text-lime-400' : 'text-lime-600'}`}>Debut</span>
            </h2>
            <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-neutral-600'}`}>
              The first show is only the beginning. We aim to expand into a larger creative movement with future plans focused on cultural growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {futurePlans.map((plan, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border backdrop-blur-sm space-y-4 transition-all duration-300 transform hover:-translate-y-1 ${
                  isDark 
                    ? 'border-white/5 bg-white/5 hover:border-lime-500/20 shadow-md' 
                    : 'border-black/5 bg-black/5 hover:border-lime-600/20 shadow-sm'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isDark ? 'bg-lime-950/40 text-lime-400' : 'bg-lime-100 text-lime-600'
                }`}>
                  {idx + 1}
                </div>
                <h3 className={`text-lg font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-neutral-800'}`}>{plan.title}</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-neutral-500'}`}>{plan.desc}</p>
              </div>
            ))}
          </div>

          <div className={`mt-16 p-8 border rounded-3xl max-w-5xl mx-auto ${
            isDark 
              ? 'bg-gradient-to-r from-lime-950/20 to-emerald-950/20 border-lime-500/10' 
              : 'bg-gradient-to-r from-lime-100/20 to-emerald-100/20 border-lime-600/10'
          }`}>
            <p className={`text-sm md:text-base leading-relaxed font-semibold text-center ${isDark ? 'text-gray-300' : 'text-neutral-700'}`}>
              The long-term vision is to establish THE COSTUME SHOW as a leading creative institution; one that influences culture, empowers artists, and places costume design on the global stage. As the creative industry continues to evolve, the demand for originality, storytelling, and visual excellence becomes stronger than ever.
            </p>
          </div>
        </section>

        {/* Outro Cinematic Typography */}
        <section className={`py-32 relative z-10 border-t ${
          isDark ? 'bg-black border-white/5' : 'bg-white border-black/5'
        }`}>
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <div className="space-y-4 mb-16">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className={`text-lg md:text-2xl font-black tracking-widest uppercase font-playfair ${
                  isDark ? 'text-lime-400' : 'text-lime-600'
                }`}
              >
                This is not just a show.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: 0.2 }}
                className={`text-lg md:text-2xl font-black tracking-widest uppercase font-playfair ${
                  isDark ? 'text-lime-400' : 'text-lime-600'
                }`}
              >
                This is a movement.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.4 }}
                className={`text-lg md:text-2xl font-black tracking-widest uppercase font-playfair ${
                  isDark ? 'text-lime-400' : 'text-lime-600'
                }`}
              >
                This is a celebration of imagination.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-150px" }}
                transition={{ delay: 0.6 }}
                className={`text-lg md:text-2xl font-black tracking-widest uppercase font-playfair ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                This is where stories are worn.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-200px" }}
                transition={{ delay: 0.8 }}
                className={`text-lg md:text-3xl font-black tracking-widest uppercase font-playfair ${
                  isDark ? 'text-white' : 'text-neutral-900'
                }`}
              >
                This is where the future is costumed.
              </motion.p>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 50 }}
              className="space-y-8"
            >
              <h2 className="text-3xl md:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-green-600 font-playfair">
                WELCOME TO THE COSTUME SHOW!!!
              </h2>
              <div className="pt-8">
                <Link
                  href="/costume-show-shop"
                  className="px-10 py-5 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-400 hover:to-green-500 text-white font-extrabold text-sm rounded-full shadow-lg shadow-lime-500/20 hover:shadow-xl hover:shadow-lime-500/35 transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center gap-2 group"
                >
                  Enter the Showroom
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
