"use client";

import { useTheme } from "@/components/ThemeProvider";

export function RootNavBar() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="w-full border-b border-slate-300 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold uppercase tracking-wide text-slate-900">
          PDF Variable Mapper
        </h1>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded border border-slate-300 text-black hover:bg-slate-50"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <i className={isDarkMode ? "fa-solid fa-sun" : "fa-solid fa-moon"} />
        </button>
      </div>
    </div>
  );
}
