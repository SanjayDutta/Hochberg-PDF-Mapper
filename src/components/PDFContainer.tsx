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
    onLoadComplete?.();
  };

  const canGoPrev = pageNumber > 1;
  const canGoNext = numPages !== null && pageNumber < numPages;

  if (!reactPdf) {
    return null;
  }

  const { Document, Page } = reactPdf;

  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      <div className="relative inline-block rounded-md border border-slate-300 bg-slate-100 p-2">
        <Document
          file={fileObject}
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={<p className="text-slate-500">Loading PDF...</p>}
        >
          <div className="relative">
            <Page pageNumber={pageNumber} />
            <div className="pointer-events-none absolute inset-0">
              {/* Future overlay layers will be rendered here */}
            </div>
          </div>
        </Document>
      </div>

      <div className="flex items-center gap-4">
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
  );
}
