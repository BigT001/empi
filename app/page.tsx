"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Feather,
  Globe2,
  HatGlasses,
  PartyPopper,
  Shapes,
  ShieldCheck,
  Sparkles,
  Swords,
  Truck,
} from "lucide-react";
import { Navigation } from "./components/Navigation";
import { MobileHeader } from "./components/MobileHeader";
import { ProductGrid } from "./components/ProductGrid";
import { Footer } from "./components/Footer";
import { DiscountPopup } from "./components/DiscountPopup";
import { HeroSection } from "./components/HeroSection";
import { ScrollReveal } from "./components/ScrollReveal";
import { FloatingDecor } from "./components/FloatingDecor";
import { useHomeMode } from "./context/HomeModeContext";
import { useCurrency } from "./context/CurrencyContext";
import { useTheme } from "./context/ThemeContext";
import CustomCostumesPage from "./custom-costumes/page";

const collections = [
  {
    title: "Carnival",
    filterValue: "Carnival",
    image: "/empiimages/IMG_9906.JPG",
    icon: PartyPopper,
  },
  {
    title: "Fantasy Costume",
    filterValue: "Angel",
    image: "/empiimages/IMG_0794.JPG",
    icon: Feather,
  },
  {
    title: "Western",
    filterValue: "Western",
    image: "/empiimages/IMG_9345.JPG",
    icon: HatGlasses,
  },
  {
    title: "Traditional Africa",
    filterValue: "Traditional Africa",
    image: "/empiimages/d7376ba7-6379-410e-bd4a-627a6e521ffc.JPG",
    icon: Globe2,
  },
  {
    title: "Cosplay",
    filterValue: "Cosplay",
    image: "https://res.cloudinary.com/dtxbk2uid/image/upload/v1770802824/empi/kssxgbjqzymeqbcdvjzl.jpg",
    icon: Swords,
  },
  {
    title: "Other",
    filterValue: "Other",
    image: "https://res.cloudinary.com/dtxbk2uid/image/upload/v1784721550/empi/hgd2cukqt5psbw29tcd4.jpg",
    icon: Shapes,
  },
];

const serviceHighlights = [
  {
    icon: Clock,
    title: "Rapid Fulfillment",
    description: "Expert tailoring in record time",
  },
  {
    icon: ShieldCheck,
    title: "Elite Artistry",
    description: "Master-crafted in our local studio",
  },
  {
    icon: Truck,
    title: "Seamless Logistics",
    description: "Direct delivery across Lagos",
  },
  {
    icon: Sparkles,
    title: "Bespoke Precision",
    description: "Tailored to your unique spirit",
  },
];

function HomeContent() {
  const { currency, setCurrency } = useCurrency();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [category, setCategory] = useState(() =>
    initialCategory === "adults" ||
    initialCategory === "kids" ||
    initialCategory === "custom"
      ? initialCategory
      : "adults",
  );
  const searchQuery = searchParams.get("q") ?? "";
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

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-lime-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-white">
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

      {/* This component intentionally remains unchanged. */}
      <HeroSection />

      <div className="relative overflow-hidden">
        <FloatingDecor />
        <DiscountPopup intervalMinutes={7} />

        <ScrollReveal y={20} delay={0.1}>
          <section
            className={`border-b border-gray-100 py-8 md:py-10 dark:border-white/5 ${
              theme === "dark" ? "bg-black/40" : "bg-white"
            }`}
            aria-label="Why shop with EMPI"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-8 px-4 sm:px-6 lg:grid-cols-4 lg:gap-12">
              {serviceHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="group flex flex-col items-center gap-3 text-center md:flex-row md:items-start md:text-left"
                  >
                    <div className="rounded-2xl border border-transparent bg-gray-50 p-3 transition-colors duration-500 group-hover:border-lime-500/20 group-hover:bg-lime-500/10 dark:bg-white/5">
                      <Icon className="h-5 w-5 text-lime-600" />
                    </div>
                    <div>
                      <h2 className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-900 dark:text-white">
                        {item.title}
                      </h2>
                      <p className="text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400 md:text-xs">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </ScrollReveal>

        <main className="flex-grow">
          <ScrollReveal y={30} delay={0.1}>
            <section className="bg-[#080808] py-12 md:py-18">
              <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-7 flex flex-col gap-3 md:mb-9 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-2xl">
                    <span className="mb-2.5 block text-[10px] font-black uppercase tracking-[0.28em] text-lime-500 md:text-xs">
                      Find your look
                    </span>
                    <h2 className="font-playfair text-3xl font-black uppercase tracking-tight text-white md:text-5xl">
                      Shop by category
                    </h2>
                  </div>
                  <p className="max-w-md text-xs leading-5 text-white/55 md:text-right md:text-sm">
                    Pick a style and go straight to its collection.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5 md:gap-4 lg:grid-cols-6">
                  {collections.map((collection) => {
                    const Icon = collection.icon;
                    return (
                      <Link
                        key={collection.title}
                        href={`/shop?costumeType=${encodeURIComponent(collection.filterValue ?? collection.title)}`}
                        className="group relative h-[132px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-left transition duration-300 hover:-translate-y-1 hover:border-lime-500/60 active:scale-95 md:h-[170px] md:rounded-3xl"
                      >
                        <Image
                          src={collection.image}
                          alt=""
                          fill
                          sizes="(max-width: 1024px) 33vw, 16vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/5" />
                        <span className="absolute right-2.5 top-2.5 rounded-full border border-white/15 bg-black/45 p-1.5 text-lime-400 backdrop-blur-md md:right-3 md:top-3 md:p-2">
                          <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" strokeWidth={1.8} />
                        </span>
                        <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                          <h3 className="text-[9px] font-black uppercase leading-3 tracking-[0.06em] text-white drop-shadow-lg md:text-[11px] md:leading-4">
                            {collection.title}
                          </h3>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal y={35} delay={0.1}>
            <section className={theme === "dark" ? "bg-black" : "bg-slate-50"}>
              <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 md:pt-18">
                <div className="border-b border-black/10 pb-7 dark:border-white/10">
                  <span className="mb-2.5 block text-[10px] font-black uppercase tracking-[0.28em] text-lime-600 md:text-xs">
                    The EMPI edit
                  </span>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-playfair text-3xl font-black uppercase tracking-tight text-slate-950 dark:text-white md:text-5xl">
                      Shop all
                    </h2>
                    <Link
                      href="/shop"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-lime-500 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.08em] text-black shadow-[0_12px_30px_rgba(132,204,22,0.18)] transition hover:bg-lime-400 sm:gap-2 sm:px-5 sm:py-3 sm:text-xs"
                    >
                      View all products
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Link>
                  </div>
                  <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500 dark:text-white/55 md:text-sm">
                    Shop and Costume Show favourites, curated together.
                  </p>
                </div>
              </div>

              <div id="product-grid">
                <ProductGrid
                  currency={currency}
                  category="all"
                  mode={mode}
                  onModeChange={setMode}
                  searchQuery={searchQuery}
                  limit={12}
                  hideHeader
                  hideFilters
                  mixCostumeShowProducts
                />
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal y={30} delay={0.1}>
            <section className="bg-[#080808] px-4 py-12 sm:px-6 md:py-20">
              <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-[#111] md:grid-cols-2">
                <div className="relative z-10 flex flex-col justify-center p-7 md:p-12 lg:p-16">
                  <span className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-lime-500 md:text-xs">
                    Made for your moment
                  </span>
                  <h2 className="max-w-xl font-playfair text-3xl font-black uppercase leading-tight text-white md:text-5xl">
                    Your idea, made wearable.
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-white/55">
                    Can&apos;t find the exact character or concept you have in
                    mind? Work with EMPI to turn your reference, story or
                    imagination into a one-of-one costume.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-wider text-white/65 md:text-[10px]">
                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      Share your vision
                    </span>
                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      We craft it
                    </span>
                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      Own the moment
                    </span>
                  </div>

                  <Link
                    href="/custom-costumes"
                    className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-lime-500 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black shadow-[0_16px_36px_rgba(132,204,22,0.2)] transition hover:bg-lime-400 active:scale-95"
                  >
                    Start a custom costume
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="relative min-h-[320px] md:min-h-[520px]">
                  <Image
                    src="/empiimages/IMG_0729.JPG"
                    alt="A bespoke EMPI angel costume"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent md:bg-gradient-to-r md:from-[#111] md:via-transparent md:to-transparent" />
                </div>
              </div>
            </section>
          </ScrollReveal>
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
