"use client";

import { Header } from "../components/Header";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function About() {
  const router = useRouter();
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("adults");

  const handleCategoryChange = useCallback((newCategory: string) => {
    // Small delay to ensure state updates before navigation
    setTimeout(() => {
      router.push("/");
    }, 100);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white text-gray-900 flex flex-col">
      {/* Header with Logo and Navigation */}
      <header className="border-b border-gray-200/50 sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto w-full px-2 md:px-6 py-2 md:py-4 flex items-center justify-center gap-2 md:justify-between md:gap-8">
          {/* Logo - from Header */}
          <Header />
          
          {/* Navigation */}
          <nav className="flex items-center flex-1">
            <Navigation 
              category={category}
              onCategoryChange={handleCategoryChange}
              currency={currency}
              onCurrencyChange={setCurrency}
            />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Dramatic Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-lime-900 to-slate-900 py-24 md:py-32 px-4">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_25%,rgba(68,68,68,.2)_50%,transparent_50%,transparent_75%,rgba(68,68,68,.2)_75%,rgba(68,68,68,.2))] bg-[length:40px_40px]"></div>
          </div>
          
          <div className="relative max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-block">
              <span className="inline-block px-4 py-2 bg-lime-500/20 text-lime-300 rounded-full text-sm font-semibold border border-lime-500/40 backdrop-blur">
                ✨ Est. 2019 | Award-Winning Costumes
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight drop-shadow-lg">
              The Art of <span className="bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent">Transformation</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed drop-shadow">
              Creating memories through exceptional costume design, craftsmanship, and creative excellence since 2019
            </p>
            <div className="flex gap-4 justify-center pt-4 flex-wrap">
              <div className="text-center">
                <div className="text-3xl font-bold text-lime-400">1000+</div>
                <div className="text-gray-300 text-sm">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-lime-400">5+</div>
                <div className="text-gray-300 text-sm">Years Excellence</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-lime-400">∞</div>
                <div className="text-gray-300 text-sm">Creative Designs</div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-16">

          {/* Our Story - Dramatic */}
          <section className="relative">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-gray-900">Our Story</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-lime-500 to-green-500"></div>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Born in 2019 from the passion of two thespians, <span className="font-semibold text-gray-900">Money Precious Odiriverere</span> and <span className="font-semibold text-gray-900">Onuoha Peter</span>, EMPI Costumes emerged as a vision to revolutionize the costume industry in Lagos.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  In 2020, we welcomed <span className="font-semibold text-gray-900">Oyinkansola Adejomehin</span> to the team, amplifying our creative capacity and strengthening our commitment to excellence.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Today, EMPI Costumes stands as a <span className="font-semibold text-gray-900">registered Limited Liability Company</span>, driving innovation and setting new standards in Nigeria's costume industry.
                </p>
              </div>
              <div className="relative h-80 bg-gradient-to-br from-lime-400 to-green-600 rounded-2xl shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white text-6xl font-bold opacity-20">
                  🎭
                </div>
              </div>
            </div>
          </section>

          {/* Mission - Bold Card */}
          <section className="relative">
            <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl p-8 md:p-12 border-2 border-lime-200 shadow-lg">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-lime-500 to-green-500 mb-6"></div>
              <p className="text-xl text-gray-800 leading-relaxed font-semibold">
                To enhance and promote creative costume craftsmanship while building a thriving costuming industry in Nigeria that meets global standards.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mt-4">
                We're dedicated to making quality costumes accessible to everyone while celebrating culture, creativity, and the art of transformation.
              </p>
            </div>
          </section>

          {/* What We Create - Dynamic Grid */}
          <section>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">What We Create</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-lime-500 to-green-500 mb-8"></div>
            <p className="text-lg text-gray-700 mb-8">
              Our diverse portfolio spans across multiple creative categories:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "🌍", title: "African Traditional Costumes", desc: "Celebrating heritage and culture" },
                { icon: "🎮", title: "Cosplay", desc: "Bringing characters to life" },
                { icon: "🎉", title: "Carnival Costumes", desc: "Energy and vibrant expression" },
                { icon: "✨", title: "Themed & Custom", desc: "Personalized creative visions" },
                { icon: "🎭", title: "Props & Accessories", desc: "Completing every look" },
                { icon: "🎪", title: "Event Costumes", desc: "Making moments unforgettable" }
              ].map((item, idx) => (
                <div key={idx} className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-lime-400 hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* What We Do - Impactful */}
          <section>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Our Impact</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-lime-500 to-green-500 mb-8"></div>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                "🌟 Celebrating culture and heritage through authentic costume design",
                "🎬 Enhancing film and stage productions with professional costumes",
                "🎊 Elevating events and celebrations with creative excellence",
                "📸 Styling content creators with trendy and unique designs",
                "🎂 Beautifying birthday shoots and special moments",
                "🎆 Adding vibrancy to after-party experiences and celebrations"
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-lg bg-lime-50 border border-lime-200 hover:bg-lime-100 transition-all">
                  <span className="text-2xl flex-shrink-0">{item.split(" ")[0]}</span>
                  <p className="text-gray-800">{item.substring(2)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Locations - Modern */}
          <section>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Our Locations</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-lime-500 to-green-500 mb-8"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-300 shadow-lg">
                <div className="text-4xl mb-3">🏭</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Production Hub</h3>
                <p className="text-gray-700 text-lg">Iba New Site, Ojo, Lagos</p>
                <p className="text-gray-600 mt-2">Where creativity meets craftsmanship</p>
              </div>
              <div className="p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-300 shadow-lg">
                <div className="text-4xl mb-3">🎭</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Rental Showroom</h3>
                <p className="text-gray-700 text-lg">Surulere, Lagos</p>
                <p className="text-gray-600 mt-2">Experience our full collection</p>
              </div>
            </div>
          </section>

          {/* Samba Performances */}
          <section className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-2xl p-8 md:p-12 border-2 border-amber-300">
            <div className="flex items-start gap-4 md:gap-6">
              <div className="text-5xl md:text-7xl flex-shrink-0">💃</div>
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Samba Dance Performances</h2>
                <p className="text-lg text-gray-800 leading-relaxed">
                  Beyond costumes, we ignite celebrations with dazzling Samba Dance performances featuring our signature carnival costumes. We bring energy, colour, and unforgettable moments to your events.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section - Dramatic */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-lime-600 to-green-600 p-12 md:p-16 text-center shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_25%,rgba(68,68,68,.2)_50%,transparent_50%,transparent_75%,rgba(68,68,68,.2)_75%,rgba(68,68,68,.2))] bg-[length:40px_40px]"></div>
            </div>
            <div className="relative space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-white">Ready to Transform?</h2>
              <p className="text-xl text-white/90">Browse our collection and discover the perfect costume for your next adventure</p>
              <Link 
                href="/" 
                className="inline-block bg-white hover:bg-gray-100 text-lime-600 font-bold px-10 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Explore Our Collection
              </Link>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

