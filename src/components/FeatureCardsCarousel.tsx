"use client";

import { useRef } from "react";

type FeatureCard = {
  title: string;
  description: string;
  iconClass: string;
};

type FeatureCardsCarouselProps = {
  cards: FeatureCard[];
};

const SCROLL_STEP_PX = 300;

export function FeatureCardsCarousel({ cards }: FeatureCardsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: -SCROLL_STEP_PX, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: SCROLL_STEP_PX, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={scrollLeft}
        aria-label="Scroll features left"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-black hover:bg-slate-50"
      >
        <i className="fa-solid fa-chevron-left" />
      </button>

      <div ref={scrollRef} className="feature-scroll-track flex gap-3 overflow-x-auto pb-2">
        {cards.map((card) => (
          <div
            key={card.title}
            className="min-w-[240px] max-w-[280px] flex-shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <i className={`${card.iconClass} text-blue-600`} />
              <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
            </div>
            <p className="text-xs leading-5 text-slate-700">{card.description}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={scrollRight}
        aria-label="Scroll features right"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-black hover:bg-slate-50"
      >
        <i className="fa-solid fa-chevron-right" />
      </button>
    </div>
  );
}
