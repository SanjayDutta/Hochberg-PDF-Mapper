"use client";

import { useCallback, useState } from "react";
import { PDFContainer } from "./PDFContainer";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function UploadPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<null | { ok: boolean; message: string }>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isPdfReady, setIsPdfReady] = useState(false);

  const validateAndStore = useCallback((selectedFile: File | null) => {
    if (!selectedFile) {
      setStatus({ ok: false, message: "No file selected." });
      return;
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFile(null);
      setStatus({ ok: false, message: "File upload fail: only PDF files are allowed." });
      return;
    }

    if (selectedFile.size > MAX_SIZE_BYTES) {
      setFile(null);
      setStatus({ ok: false, message: "File upload fail: file size must be ≤ 5MB." });
      return;
    }

    setFile(selectedFile);
    setIsPdfReady(false);
    setIsLoadingPdf(true);
    setStatus({
      ok: true,
      message: `File upload success. Size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB.`,
    });
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    validateAndStore(selectedFile);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    validateAndStore(droppedFile);
  };

  // Phase 3: PDF is ready — show only PDFContainer, upload UI is gone
  if (isPdfReady && file) {
    return (
      <div className="h-screen overflow-hidden bg-slate-50 flex flex-col p-6">
        <PDFContainer file={file} />
      </div>
    );
  }

  // Phase 2: Loading screen — PDFContainer mounts hidden to trigger load
  if (isLoadingPdf && file) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <div
          className="animate-spin inline-block w-12 h-12 border-4 rounded-full border-slate-300 border-t-blue-600"
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
        <p className="text-slate-900 text-sm">Reading <span className="font-medium">{file.name}</span>...</p>
        <div className="hidden">
          <PDFContainer
            file={file}
            onLoadComplete={() => {
              setIsLoadingPdf(false);
              setIsPdfReady(true);
            }}
          />
        </div>
      </div>
    );
  }

  // Phase 1: Upload form
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-center text-2xl font-semibold text-slate-950">
          Upload PDF
        </h1>
        <div
          className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.getElementById("pdf-file-input");
            if (input instanceof HTMLInputElement) {
              input.click();
            }
          }}
        >
          <p className="mb-1 text-sm font-medium text-slate-900">
            Drag & drop a PDF here
          </p>
          <p className="mb-2 text-xs text-slate-950">or click to select a file</p>
          <p className="text-xs text-slate-900">Max size: 5MB</p>
        </div>
        <input
          id="pdf-file-input"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />

        {status && (
          <p
            className={`mt-2 text-sm ${
              status.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}
