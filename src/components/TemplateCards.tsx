"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteTemplateAction } from "@/lib/templateActions";

type TemplateCardItem = {
  id: string;
  documentName: string;
  variableCount: number;
};

export function TemplateCards({ templates: initialTemplates }: { templates: TemplateCardItem[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    await deleteTemplateAction(confirmDeleteId);
    setTemplates((prev) => prev.filter((t) => t.id !== confirmDeleteId));
    setConfirmDeleteId(null);
    setIsDeleting(false);
  };

  const cardToDelete = templates.find((t) => t.id === confirmDeleteId);

  return (
    <>
      <div className="w-full rounded-xl border border-slate-200 bg-white px-6 py-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Recent Work
          </h2>
        </div>
        {templates.length === 0 ? (
          <p className="text-sm text-slate-500">
            No templates yet. Upload a PDF below to get started. Your work gets saved automatically.
          </p>
        ) : (
          <div className="mt-2 flex flex-row gap-3 overflow-x-auto pb-1 pt-1">
            {templates.map((t) => (
              <div key={t.id} className="relative min-w-[180px] max-w-[220px]">
                <button
                  onClick={() => setConfirmDeleteId(t.id)}
                  className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-black text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                  title="Delete template"
                >
                  ×
                </button>
                <Link
                  href={`/${t.id}`}
                  className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm hover:border-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <span
                    className="truncate text-sm font-medium text-black"
                    title={t.documentName}
                  >
                    {t.documentName}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t.variableCount} field{t.variableCount !== 1 ? "s" : ""}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-base font-semibold text-black">Delete Template?</h3>
            <p className="mb-6 text-sm text-slate-900">
              Are you sure you want to delete{" "}
              <span className="font-medium">&ldquo;{cardToDelete?.documentName}&rdquo;</span>? This
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                className="rounded border border-slate-300 px-4 py-2 text-sm text-black hover:bg-slate-50 disabled:opacity-50"
              >
                No
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
