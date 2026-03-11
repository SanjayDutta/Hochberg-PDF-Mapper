"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

type PDFContainerProps = {
  file: File;
  onLoadComplete?: () => void;
};

type ReactPdfModule = typeof import("react-pdf");

type PdfVariable = {
  id: string;
  key: string;
  label: string;
  type: string;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
};

type VariableDragState = {
  variableId: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  variableWidth: number;
  variableHeight: number;
};

type VariableResizeState = {
  variableId: string;
  resizeAxis: "width" | "height";
  startClientX: number;
  startClientY: number;
  startWidth: number;
  startHeight: number;
  startX: number;
  startY: number;
};

export function PDFContainer({ file, onLoadComplete }: PDFContainerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [variables, setVariables] = useState<PdfVariable[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupKey, setPopupKey] = useState("");
  const [popupLabel, setPopupLabel] = useState("");
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null);
  const [popupDropX, setPopupDropX] = useState(0);
  const [popupDropY, setPopupDropY] = useState(0);
  const [popupDropPage, setPopupDropPage] = useState(1);
  const [dragState, setDragState] = useState<VariableDragState | null>(null);
  const [resizeState, setResizeState] = useState<VariableResizeState | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pdfPageRef = useRef<HTMLDivElement>(null);
  const hasDraggedRef = useRef(false);
  const hasResizedRef = useRef(false);
  const suppressClickVariableIdRef = useRef<string | null>(null);

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

  const handleAddTextField = () => {
    const pageRect = pdfPageRef.current?.getBoundingClientRect();
    const defaultX = pageRect ? pageRect.width / zoomScale / 2 : 0;
    const defaultY = pageRect ? pageRect.height / zoomScale / 2 : 0;
    setEditingVariableId(null);
    setPopupKey("");
    setPopupLabel("");
    setPopupDropX(defaultX);
    setPopupDropY(defaultY);
    setPopupDropPage(pageNumber);
    setShowPopup(true);
  };

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", "textfield");
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.getData("text/plain") === "textfield" && pdfPageRef.current) {
      const rect = pdfPageRef.current.getBoundingClientRect();

      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      const dropX = (e.clientX - rect.left) / zoomScale;
      const dropY = (e.clientY - rect.top) / zoomScale;
      const pageWidth = rect.width / zoomScale;
      const pageHeight = rect.height / zoomScale;

      const validDropX = Math.max(0, Math.min(pageWidth, dropX));
      const validDropY = Math.max(0, Math.min(pageHeight, dropY));

      setPopupDropX(validDropX);
      setPopupDropY(validDropY);
      setPopupDropPage(pageNumber);
      setEditingVariableId(null);
      setPopupKey("");
      setPopupLabel("");
      setShowPopup(true);
    }
  };

  const handleEditVariable = (variable: PdfVariable) => {
    if (suppressClickVariableIdRef.current === variable.id) {
      suppressClickVariableIdRef.current = null;
      return;
    }

    setEditingVariableId(variable.id);
    setPopupKey(variable.key);
    setPopupLabel(variable.label);
    setPopupDropX(variable.x);
    setPopupDropY(variable.y);
    setPopupDropPage(variable.page);
    setShowPopup(true);
  };

  const handleDeleteVariable = (
    e: React.MouseEvent<HTMLSpanElement>,
    variableId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setVariables((prev) => prev.filter((variable) => variable.id !== variableId));

    if (editingVariableId === variableId) {
      setShowPopup(false);
      setEditingVariableId(null);
      setPopupKey("");
      setPopupLabel("");
    }

    suppressClickVariableIdRef.current = variableId;
  };

  const handleVariableMouseDown = (
    e: React.MouseEvent<HTMLButtonElement>,
    variable: PdfVariable
  ) => {
    e.preventDefault();
    e.stopPropagation();

    hasDraggedRef.current = false;
    setDragState({
      variableId: variable.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: variable.x,
      startY: variable.y,
      variableWidth: variable.width ?? 100,
      variableHeight: variable.height ?? 30,
    });
  };

  const handleVariableResizeMouseDown = (
    e: React.MouseEvent<HTMLSpanElement>,
    variable: PdfVariable,
    resizeAxis: "width" | "height"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    hasResizedRef.current = false;
    setResizeState({
      variableId: variable.id,
      resizeAxis,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startWidth: variable.width ?? 100,
      startHeight: variable.height ?? 30,
      startX: variable.x,
      startY: variable.y,
    });
  };

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!pdfPageRef.current) {
        return;
      }

      const rect = pdfPageRef.current.getBoundingClientRect();
      const pageWidth = rect.width / zoomScale;
      const pageHeight = rect.height / zoomScale;
      const deltaX = (event.clientX - dragState.startClientX) / zoomScale;
      const deltaY = (event.clientY - dragState.startClientY) / zoomScale;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        hasDraggedRef.current = true;
      }

      const maxX = Math.max(0, pageWidth - dragState.variableWidth);
      const maxY = Math.max(0, pageHeight - dragState.variableHeight);
      const nextX = Math.max(0, Math.min(maxX, dragState.startX + deltaX));
      const nextY = Math.max(0, Math.min(maxY, dragState.startY + deltaY));

      setVariables((prev) =>
        prev.map((variable) =>
          variable.id === dragState.variableId
            ? {
                ...variable,
                x: nextX,
                y: nextY,
              }
            : variable
        )
      );
    };

    const handleMouseUp = () => {
      const releasedVariableId = dragState.variableId;

      if (hasDraggedRef.current) {
        suppressClickVariableIdRef.current = releasedVariableId;
      }

      setDragState(null);
      hasDraggedRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, zoomScale]);

  useEffect(() => {
    if (!resizeState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!pdfPageRef.current) {
        return;
      }

      const rect = pdfPageRef.current.getBoundingClientRect();
      const pageWidth = rect.width / zoomScale;
      const pageHeight = rect.height / zoomScale;
      const deltaX = (event.clientX - resizeState.startClientX) / zoomScale;
      const deltaY = (event.clientY - resizeState.startClientY) / zoomScale;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        hasResizedRef.current = true;
      }

      const nextWidth =
        resizeState.resizeAxis === "width"
          ? Math.max(
              40,
              Math.min(pageWidth - resizeState.startX, resizeState.startWidth + deltaX)
            )
          : resizeState.startWidth;
      const nextHeight =
        resizeState.resizeAxis === "height"
          ? Math.max(
              24,
              Math.min(pageHeight - resizeState.startY, resizeState.startHeight + deltaY)
            )
          : resizeState.startHeight;

      setVariables((prev) =>
        prev.map((variable) =>
          variable.id === resizeState.variableId
            ? {
                ...variable,
                width: nextWidth,
                height: nextHeight,
              }
            : variable
        )
      );
    };

    const handleMouseUp = () => {
      const releasedVariableId = resizeState.variableId;

      if (hasResizedRef.current) {
        suppressClickVariableIdRef.current = releasedVariableId;
      }

      setResizeState(null);
      hasResizedRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizeState, zoomScale]);

  const handleAddVariable = () => {
    const normalizedKey = popupKey.trim();
    const normalizedLabel = popupLabel.trim();
    let savedVariable: PdfVariable | null = null;

    if (!normalizedKey || !normalizedLabel) {
      alert("Please fill in both Key and Label");
      return;
    }

    if (editingVariableId) {
      const existingVariable = variables.find((variable) => variable.id === editingVariableId);
      savedVariable = existingVariable
        ? {
            ...existingVariable,
            key: normalizedKey,
            label: normalizedLabel,
            type: "text",
          }
        : {
            id: editingVariableId,
            key: normalizedKey,
            label: normalizedLabel,
            type: "text",
            page: popupDropPage,
            x: popupDropX,
            y: popupDropY,
            width: 100,
            height: 30,
          };

      setVariables((prev) =>
        prev.map((variable) =>
          variable.id === editingVariableId
            ? {
                ...variable,
                key: normalizedKey,
                label: normalizedLabel,
                type: "text",
              }
            : variable
        )
      );
    } else {
      const newVariable: PdfVariable = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        key: normalizedKey,
        label: normalizedLabel,
        type: "text",
        page: popupDropPage,
        x: popupDropX,
        y: popupDropY,
        width: 100,
        height: 30,
      };

      savedVariable = newVariable;

      setVariables((prev) => {
        return [
          ...prev,
          newVariable,
        ];
      });
    }

    setShowPopup(false);
    setEditingVariableId(null);
    setPopupKey("");
    setPopupLabel("");

    if (savedVariable) {
      alert(
        `Variable attributes:\n${JSON.stringify(
          {
            id: savedVariable.id,
            key: savedVariable.key,
            label: savedVariable.label,
            type: savedVariable.type,
            page: savedVariable.page,
            x: savedVariable.x,
            y: savedVariable.y,
            width: savedVariable.width,
            height: savedVariable.height,
          },
          null,
          2
        )}`
      );
    }
  };

  const handleCancelPopup = () => {
    setShowPopup(false);
    setEditingVariableId(null);
    setPopupKey("");
    setPopupLabel("");
  };

  const currentPageVariables = useMemo(
    () => variables.filter((variable) => variable.page === pageNumber),
    [variables, pageNumber]
  );

  if (!reactPdf) {
    return null;
  }

  const { Document, Page } = reactPdf;

  return (
    <>
    <div className="flex gap-4 w-full h-full">
      {/* Left panel: field controls — hidden on mobile */}
      <div className="hidden md:flex flex-col h-full w-[30%] flex-shrink-0 rounded-md border border-slate-200 bg-white p-3">
        <h2 className="text-sm font-semibold text-slate-800">Fields</h2>
        <p className="mt-1 text-xs text-slate-500">Drag fields onto the PDF to place them.</p>
        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          onClick={handleAddTextField}
          className="mt-3 rounded border border-slate-300 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-move"
        >
          + Text Field
        </button>
        <p className="mt-3 text-xs text-slate-500">
          Total variables: <span className="font-medium text-slate-700">{variables.length}</span>
        </p>
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
        <div
          ref={pdfContainerRef}
          className="mt-3 flex-1 overflow-y-auto flex justify-center rounded-md border border-slate-300 bg-slate-100 p-2"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Document
            file={fileObject}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={<p className="text-slate-500">Loading PDF...</p>}
          >
            <div ref={pdfPageRef} className="relative">
              <Page pageNumber={pageNumber} scale={zoomScale} />
              <div className="absolute inset-0 z-20">
                {currentPageVariables.map((variable) => (
                  <button
                    type="button"
                    draggable={false}
                    key={variable.id}
                    onClick={() => handleEditVariable(variable)}
                    onMouseDown={(e) => handleVariableMouseDown(e, variable)}
                    className="absolute cursor-grab select-none rounded border border-blue-400 bg-blue-50 text-xs text-blue-700 hover:bg-blue-100 active:cursor-grabbing"
                    style={{
                      left: `${variable.x * zoomScale}px`,
                      top: `${variable.y * zoomScale}px`,
                      width: `${(variable.width ?? 100) * zoomScale}px`,
                      height: `${(variable.height ?? 30) * zoomScale}px`,
                    }}
                  >
                    <span className="pointer-events-none flex h-full w-full items-center justify-center truncate px-2 text-center">
                      {`{{${variable.label}}}`}
                    </span>
                    <span
                      onMouseDown={(e) => handleDeleteVariable(e, variable.id)}
                      onClick={(e) => handleDeleteVariable(e, variable.id)}
                      className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-red-300 bg-red-500 text-[10px] font-bold leading-none text-white"
                    >
                      ×
                    </span>
                    <span
                      onMouseDown={(e) => handleVariableResizeMouseDown(e, variable, "width")}
                      className="absolute right-0 top-1/2 h-6 w-2 -translate-y-1/2 cursor-ew-resize rounded-l border-l border-blue-500 bg-blue-300"
                    />
                    <span
                      onMouseDown={(e) => handleVariableResizeMouseDown(e, variable, "height")}
                      className="absolute bottom-0 left-1/2 h-2 w-6 -translate-x-1/2 cursor-ns-resize rounded-t border-t border-blue-500 bg-blue-300"
                    />
                  </button>
                ))}
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

    {/* Popup Modal */}
    {showPopup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="rounded-lg bg-white p-6 shadow-lg w-96">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {editingVariableId ? "Edit Text Field" : "Add Text Field"}
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Key
            </label>
            <input
              type="text"
              value={popupKey}
              onChange={(e) => setPopupKey(e.target.value)}
              placeholder="e.g., field_name"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={popupLabel}
              onChange={(e) => setPopupLabel(e.target.value)}
              placeholder="e.g., Customer Name"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancelPopup}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddVariable}
              className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
            >
              {editingVariableId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
