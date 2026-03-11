"use client";

import { useEffect, useMemo, useState } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

type PDFContainerProps = {
  file: File;
  onLoadComplete?: () => void;
};

type ReactPdfModule = typeof import("react-pdf");

export function PDFContainer({ file, onLoadComplete }: PDFContainerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const fileObject = useMemo(() => {
    return file;
  }, [file]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import("react-pdf");
      mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      if (mounted) {
        setReactPdf(mod);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setZoomScale(1);
    onLoadComplete?.();
  };

  const canGoPrev = pageNumber > 1;
  const canGoNext = numPages !== null && pageNumber < numPages;
  const canZoomOut = zoomScale > 0.6;
  const canZoomIn = zoomScale < 2;

  if (!reactPdf) {
    return null;
  }

  const { Document, Page } = reactPdf;

  return (
    <div className="flex gap-4 w-full h-full">
      {/* Left panel: 35% — hidden on mobile, empty for now (future use) */}
      <div className="hidden md:flex flex-col h-full w-[30%] flex-shrink-0 rounded-md border border-slate-200 bg-white p-3">
        {/* Content will be added in later steps */}
      </div>

      {/* Middle: main PDF viewer + pagination — full width on mobile, 50% on desktop */}
      <div className="flex flex-col flex-1 md:w-[55%] md:flex-none h-full min-w-0">
        {/* Pagination controls — top section */}
        <div className="flex-shrink-0 rounded-md border border-slate-300 bg-white p-2">
          <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => canZoomOut && setZoomScale((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))}
            disabled={!canZoomOut}
          >
            −
          </button>
          <span className="min-w-14 text-center text-sm text-slate-700">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => canZoomIn && setZoomScale((z) => Math.min(2, Number((z + 0.1).toFixed(1))))}
            disabled={!canZoomIn}
          >
            +
          </button>

          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => canGoPrev && setPageNumber((p) => p - 1)}
            disabled={!canGoPrev}
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-700">
            Page {pageNumber}
            {numPages ? ` of ${numPages}` : ""}
          </span>
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => canGoNext && setPageNumber((p) => p + 1)}
            disabled={!canGoNext}
          >
            Next →
          </button>
          </div>
        </div>

        {/* Scrollable main page area */}
        <div className="mt-3 flex-1 overflow-y-auto flex justify-center rounded-md border border-slate-300 bg-slate-100 p-2">
          <Document
            file={fileObject}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={<p className="text-slate-500">Loading PDF...</p>}
          >
            <div className="relative">
              <Page pageNumber={pageNumber} scale={zoomScale} />
              <div className="pointer-events-none absolute inset-0">
                {/* Future overlay layers will be rendered here */}
              </div>
            </div>
          </Document>
        </div>
      </div>

      {/* Right: scrollable thumbnail sidebar — 20%, hidden on mobile */}
      {numPages && (
        <div className="hidden md:flex flex-col h-full w-[20%] flex-shrink-0 rounded-md border border-slate-200 bg-white p-3">
          <div className="h-full overflow-y-auto pr-2">
            <Document
              file={fileObject}
              loading={null}
              className="w-full"
            >
              {Array.from({ length: numPages }, (_, i) => {
                const pg = i + 1;
                const isActive = pg === pageNumber;
                return (
                  <div key={pg} className="mb-3 w-full flex justify-center -translate-x-8">
                    <div
                      onClick={() => setPageNumber(pg)}
                      className={`w-fit cursor-pointer rounded border-2 transition ${
                        isActive
                          ? "border-blue-500"
                          : "border-transparent hover:border-slate-300"
                      }`}
                    >
                      <Page
                        pageNumber={pg}
                        width={112}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                      />
                      <p className={`text-center text-xs py-0.5 ${
                        isActive ? "text-blue-600 font-semibold" : "text-slate-500"
                      }`}>
                        {pg}
                      </p>
                    </div>
                  </div>
                );
              })}
            </Document>
          </div>
        </div>
      )}
    </div>
  );
}
