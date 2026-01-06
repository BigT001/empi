"use client";

export function BrandsSection() {
  const logos = ["✨", "👑", "🎭", "🎪", "💎", "🌟", "✨", "👑", "🎭", "🎪", "💎", "🌟"];

  return (
    <section className="bg-black py-4 md:py-6 mb-8 md:mb-12 overflow-hidden border-b border-lime-900/30">
      <style jsx>{`
        @keyframes scroll-horizontal {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .brands-scroll {
          animation: scroll-horizontal 20s linear infinite;
        }
        .brands-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="relative w-full bg-black">
        {/* Color Overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-black via-lime-950/20 to-black pointer-events-none"></div>

        {/* Left Gradient Overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-linear-to-r from-black to-transparent z-10"></div>
        
        {/* Right Gradient Overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-linear-to-l from-black to-transparent z-10"></div>

        {/* Scrolling Logos Container */}
        <div className="flex overflow-hidden relative z-0">
          <div className="brands-scroll flex items-center justify-center gap-8 md:gap-16 whitespace-nowrap py-2 md:py-3">
            {logos.map((logo, index) => (
              <div
                key={index}
                className="shrink-0 text-4xl md:text-6xl opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
