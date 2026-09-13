import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function HeroCarousel({ slides }) {
  const [idx, setIdx] = useState(0);
  const n = slides.length;

  useEffect(() => {
    if (n <= 1) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % n), 5000);
    return () => clearInterval(timer);
  }, [n]);

  if (n === 0) return null;
  const go = (d) => setIdx((i) => (i + d + n) % n);
  const slide = slides[idx];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      <div className="relative h-64 sm:h-80 md:h-96">
        <Image src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" fittingType="fill" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-lg px-6 sm:px-10">
            <h2 className="text-2xl font-bold text-white sm:text-4xl">{slide.title}</h2>
            <p className="mt-2 max-w-md text-sm text-white/90 sm:text-base">{slide.sub}</p>
            {slide.badges?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {slide.badges.map((b) => (
                  <span key={b} className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#133827]">{b}</span>
                ))}
              </div>
            )}
            <a href="#deals" className="mt-5 inline-flex items-center rounded-full bg-[#006633] px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#005528]">Shop Now</a>
          </div>
        </div>
      </div>

      {n > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#133827] shadow transition hover:bg-white" aria-label="Previous"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#133827] shadow transition hover:bg-white" aria-label="Next"><ChevronRight className="h-5 w-5" /></button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-2 bg-white/60"}`} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}