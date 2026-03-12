"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type TemplateCardItem = {
  id: string;
  documentName: string;
  variableCount: number;
};

type TemplateNavBarProps = {
  templates: TemplateCardItem[];
};

export function TemplateNavBar({ templates }: TemplateNavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="relative border-b border-slate-300 bg-white px-4 py-3" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsMenuOpen((previous) => !previous)}
        aria-label="Open recent work"
        className="flex h-9 w-9 items-center justify-center rounded border border-slate-300 text-black hover:bg-slate-50"
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      {isMenuOpen && (
        <div className="absolute left-4 top-14 z-50 w-[420px] rounded-lg border border-slate-300 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Recent Work</h2>
            <button
              type="button"
              onClick={() => setIsDarkMode((previous) => !previous)}
              className="rounded border border-slate-300 px-3 py-1 text-xs text-black hover:bg-slate-50"
            >
              {isDarkMode ? "Dark Mode" : "Light Mode"}
            </button>
          </div>

          {templates.length === 0 ? (
            <p className="text-sm text-slate-500">No templates available yet.</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/${template.id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded border border-slate-200 bg-slate-50 px-3 py-2 hover:border-slate-400 hover:bg-slate-100"
                >
                  <p className="truncate text-sm font-medium text-black" title={template.documentName}>
                    {template.documentName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {template.variableCount} field{template.variableCount !== 1 ? "s" : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
