"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  updateTemplateVariablesAction,
  updateTemplateDocumentNameAction,
  deleteTemplateAction,
} from "@/lib/templateActions";
import { FieldAttributesSchema, type FieldData } from "@/lib/fieldSchema";
import { useTheme } from "@/components/ThemeProvider";

type ReactPdfModule = typeof import("react-pdf");

type PdfFieldType = "text" | "number" | "dropdown" | "checkbox" | "date" | "radio";

export type PdfVariable = {
  id: string;
  key: string;
  label: string;
  type: PdfFieldType;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  minDate?: string;
  maxDate?: string;
  allowDecimal?: boolean;
  dropdownOptions?: string[];
  checkboxOptions?: string[];
  required?: boolean;
};

type PDFContainerProps = {
  file: File;
  onLoadComplete?: () => void;
  templateId?: string;
  initialVariables?: PdfVariable[];
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

type VariablesHistory = {
  past: PdfVariable[][];
  present: PdfVariable[];
  future: PdfVariable[][];
};

const MAX_UNDO_HISTORY_EVENTS = 50;

const convertToStoredVariable = (pdfVar: PdfVariable) => {
  return {
    key: pdfVar.key,
    type: pdfVar.type,
    page: pdfVar.page,
    x: pdfVar.x,
    y: pdfVar.y,
    width: pdfVar.width ?? 100,
    height: pdfVar.height ?? 30,
    label: pdfVar.label,
    config:
      pdfVar.type === "dropdown" || pdfVar.type === "checkbox"
        ? {
            options:
              pdfVar.type === "dropdown"
                ? pdfVar.dropdownOptions ?? []
                : pdfVar.checkboxOptions ?? [],
          }
        : undefined,
    constraints: {
      minLength: pdfVar.minLength ?? null,
      maxLength: pdfVar.maxLength ?? null,
      minValue: pdfVar.minValue ?? null,
      maxValue: pdfVar.maxValue ?? null,
      minDate: pdfVar.minDate ?? null,
      maxDate: pdfVar.maxDate ?? null,
      allowDecimal: pdfVar.allowDecimal ?? false,
      required: pdfVar.required ?? false,
    },
  };
};

export function PDFContainer({ file, onLoadComplete, templateId, initialVariables }: PDFContainerProps) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInputValue, setPageInputValue] = useState("1");
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [documentName, setDocumentName] = useState(file.name);
  const [variablesHistory, setVariablesHistory] = useState<VariablesHistory>({
    past: [],
    present: initialVariables ?? [],
    future: [],
  });
  const [showPopup, setShowPopup] = useState(false);
  const [popupKey, setPopupKey] = useState("");
  const [popupLabel, setPopupLabel] = useState("");
  const [popupMinLength, setPopupMinLength] = useState("");
  const [popupMaxLength, setPopupMaxLength] = useState("");
  const [popupMinValue, setPopupMinValue] = useState("");
  const [popupMaxValue, setPopupMaxValue] = useState("");
  const [popupMinDate, setPopupMinDate] = useState("");
  const [popupMaxDate, setPopupMaxDate] = useState("");
  const [popupAllowDecimal, setPopupAllowDecimal] = useState(false);
  const [popupDropdownOptions, setPopupDropdownOptions] = useState<string[]>([]);
  const [popupCheckboxOptions, setPopupCheckboxOptions] = useState<string[]>([]);
  const [popupRequired, setPopupRequired] = useState(false);
  const [popupKeyError, setPopupKeyError] = useState("");
  const [popupFieldType, setPopupFieldType] = useState<PdfFieldType>("text");
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null);
  const [popupDropX, setPopupDropX] = useState(0);
  const [popupDropY, setPopupDropY] = useState(0);
  const [popupDropPage, setPopupDropPage] = useState(1);
  const [dragState, setDragState] = useState<VariableDragState | null>(null);
  const [showFieldDetails, setShowFieldDetails] = useState(false);
  const [resizeState, setResizeState] = useState<VariableResizeState | null>(null);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showGetApiModal, setShowGetApiModal] = useState(false);
  const [isApiUrlCopied, setIsApiUrlCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showUploadJsonModal, setShowUploadJsonModal] = useState(false);
  const [uploadJsonError, setUploadJsonError] = useState("");
  const [showUploadJsonErrorModal, setShowUploadJsonErrorModal] = useState(false);
  const [showDownloadValidationModal, setShowDownloadValidationModal] = useState(false);
  const [downloadValidationStatus, setDownloadValidationStatus] = useState<"progress" | "success" | "error">("progress");
  const [downloadValidationMessage, setDownloadValidationMessage] = useState("");
  const [pendingJsonFile, setPendingJsonFile] = useState<File | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pdfPageRef = useRef<HTMLDivElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const lastSyncedDocumentNameRef = useRef(file.name.trim() || file.name);
  const hasDraggedRef = useRef(false);
  const hasResizedRef = useRef(false);
  const dragStartVariablesRef = useRef<PdfVariable[] | null>(null);
  const resizeStartVariablesRef = useRef<PdfVariable[] | null>(null);
  const suppressClickVariableIdRef = useRef<string | null>(null);

  const variables = variablesHistory.present;

  const fileObject = useMemo(() => {
    return file;
  }, [file]);

  useEffect(() => {
    setDocumentName(file.name);
    lastSyncedDocumentNameRef.current = file.name.trim() || file.name;
  }, [file]);

  const persistDocumentName = useCallback(
    async (value: string) => {
      if (!templateId) return;

      const nextName = value.trim() || file.name;

      if (nextName === lastSyncedDocumentNameRef.current) {
        return;
      }

      const updatedTemplate = await updateTemplateDocumentNameAction(templateId, nextName);
      if (updatedTemplate) {
        lastSyncedDocumentNameRef.current = nextName;
      }
    },
    [file.name, templateId]
  );

  useEffect(() => {
    if (!templateId) return;

    const timer = window.setTimeout(() => {
      void persistDocumentName(documentName);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [documentName, persistDocumentName, templateId]);

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
  const canUndo = variablesHistory.past.length > 0;
  const canRedo = variablesHistory.future.length > 0;

  useEffect(() => {
    setPageInputValue(String(pageNumber));
  }, [pageNumber]);

  useEffect(() => {
    if (!numPages || !thumbnailContainerRef.current) {
      return;
    }

    const activeThumbnail = thumbnailContainerRef.current.querySelector<HTMLElement>(
      `[data-thumbnail-page="${pageNumber}"]`
    );

    if (activeThumbnail) {
      activeThumbnail.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [pageNumber, numPages]);

  const clampPageNumber = (value: number) => {
    const maxPage = numPages ?? 1;

    if (!Number.isFinite(value)) {
      return 1;
    }

    return Math.min(maxPage, Math.max(1, Math.floor(value)));
  };

  const applyPageInput = () => {
    const parsedPage = Number(pageInputValue);
    const nextPage = clampPageNumber(parsedPage);
    setPageNumber(nextPage);
    setPageInputValue(String(nextPage));
  };

  const getFieldTypeLabel = (fieldType: PdfFieldType) => {
    if (fieldType === "number") {
      return "Number";
    }

    if (fieldType === "date") {
      return "Date";
    }

    if (fieldType === "radio") {
      return "Radio";
    }

    if (fieldType === "dropdown") {
      return "Dropdown";
    }

    if (fieldType === "checkbox") {
      return "Checkbox";
    }

    return "Text";
  };

  const cloneVariables = (items: PdfVariable[]) =>
    items.map((variable) => ({
      ...variable,
      dropdownOptions: variable.dropdownOptions ? [...variable.dropdownOptions] : undefined,
      checkboxOptions: variable.checkboxOptions ? [...variable.checkboxOptions] : undefined,
    }));

  const areVariablesEqual = (left: PdfVariable[], right: PdfVariable[]) =>
    JSON.stringify(left) === JSON.stringify(right);

  const pushHistorySnapshot = (past: PdfVariable[][], snapshot: PdfVariable[]) => {
    const nextPast = [...past, cloneVariables(snapshot)];

    if (nextPast.length <= MAX_UNDO_HISTORY_EVENTS) {
      return nextPast;
    }

    return nextPast.slice(nextPast.length - MAX_UNDO_HISTORY_EVENTS);
  };

  const parseOptionalLength = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed)) {
      return undefined;
    }

    return Math.max(0, Math.floor(parsed));
  };

  const parseOptionalNumber = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed)) {
      return undefined;
    }

    return parsed;
  };

  const updateVariables = (
    updater: (previous: PdfVariable[]) => PdfVariable[],
    options?: { recordHistory?: boolean }
  ) => {
    const recordHistory = options?.recordHistory ?? true;

    setVariablesHistory((previousHistory) => {
      const nextPresent = updater(previousHistory.present);

      if (areVariablesEqual(previousHistory.present, nextPresent)) {
        return previousHistory;
      }

      if (!recordHistory) {
        return {
          ...previousHistory,
          present: cloneVariables(nextPresent),
        };
      }

      return {
        past: pushHistorySnapshot(previousHistory.past, previousHistory.present),
        present: cloneVariables(nextPresent),
        future: [],
      };
    });
  };

  const recordVariablesHistoryFromSnapshot = (snapshot: PdfVariable[]) => {
    setVariablesHistory((previousHistory) => {
      if (areVariablesEqual(snapshot, previousHistory.present)) {
        return previousHistory;
      }

      return {
        past: pushHistorySnapshot(previousHistory.past, snapshot),
        present: cloneVariables(previousHistory.present),
        future: [],
      };
    });
  };

  const handleUndo = () => {
    setVariablesHistory((previousHistory) => {
      if (previousHistory.past.length === 0) {
        return previousHistory;
      }

      const previousState = previousHistory.past[previousHistory.past.length - 1];

      return {
        past: previousHistory.past.slice(0, -1),
        present: cloneVariables(previousState),
        future: [cloneVariables(previousHistory.present), ...previousHistory.future],
      };
    });
  };

  const handleRedo = () => {
    setVariablesHistory((previousHistory) => {
      if (previousHistory.future.length === 0) {
        return previousHistory;
      }

      const [nextState, ...nextFuture] = previousHistory.future;

      return {
        past: pushHistorySnapshot(previousHistory.past, previousHistory.present),
        present: cloneVariables(nextState),
        future: nextFuture,
      };
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      const isEditableTarget =
        target?.isContentEditable || tagName === "input" || tagName === "textarea";

      if (isEditableTarget) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "z") {
        event.preventDefault();
        handleUndo();
        return;
      }

      if (key === "y") {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!templateId) return;
    const storedVariables = variables.map(convertToStoredVariable);
    updateTemplateVariablesAction(templateId, storedVariables);
  }, [templateId, variables]);

  const openFieldPopup = (fieldType: PdfFieldType) => {
    const pageRect = pdfPageRef.current?.getBoundingClientRect();
    const defaultX = pageRect ? pageRect.width / zoomScale / 2 : 0;
    const defaultY = pageRect ? pageRect.height / zoomScale / 2 : 0;
    setEditingVariableId(null);
    setPopupFieldType(fieldType);
    setPopupKey("");
    setPopupLabel("");
    setPopupMinLength("");
    setPopupMaxLength("");
    setPopupMinValue("");
    setPopupMaxValue("");
    setPopupMinDate("");
    setPopupMaxDate("");
    setPopupAllowDecimal(false);
    setPopupDropdownOptions(fieldType === "dropdown" ? [""] : []);
    setPopupCheckboxOptions(fieldType === "checkbox" ? [""] : []);
    setPopupRequired(false);
    setPopupKeyError("");
    setPopupDropX(defaultX);
    setPopupDropY(defaultY);
    setPopupDropPage(pageNumber);
    setShowPopup(true);
  };

  const handleAddTextField = () => {
    openFieldPopup("text");
  };

  const handleAddNumberField = () => {
    openFieldPopup("number");
  };

  const handleAddDropdownField = () => {
    openFieldPopup("dropdown");
  };

  const handleAddCheckboxField = () => {
    openFieldPopup("checkbox");
  };

  const handleAddDateField = () => {
    openFieldPopup("date");
  };

  const handleAddRadioField = () => {
    openFieldPopup("radio");
  };

  const handleAddDropdownOption = () => {
    setPopupDropdownOptions((previous) => [...previous, ""]);
  };

  const handleUpdateDropdownOption = (index: number, value: string) => {
    setPopupDropdownOptions((previous) =>
      previous.map((option, optionIndex) => (optionIndex === index ? value : option))
    );
  };

  const handleRemoveDropdownOption = (index: number) => {
    setPopupDropdownOptions((previous) => previous.filter((_, optionIndex) => optionIndex !== index));
  };

  const handleAddCheckboxOption = () => {
    setPopupCheckboxOptions((previous) => [...previous, ""]);
  };

  const handleUpdateCheckboxOption = (index: number, value: string) => {
    setPopupCheckboxOptions((previous) =>
      previous.map((option, optionIndex) => (optionIndex === index ? value : option))
    );
  };

  const handleRemoveCheckboxOption = (index: number) => {
    setPopupCheckboxOptions((previous) => previous.filter((_, optionIndex) => optionIndex !== index));
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    fieldType: PdfFieldType
  ) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/pdf-mapper-field-type", fieldType);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFieldType = e.dataTransfer.getData(
      "application/pdf-mapper-field-type"
    ) as PdfFieldType;

    if (
      (droppedFieldType === "text" ||
        droppedFieldType === "number" ||
        droppedFieldType === "dropdown" ||
        droppedFieldType === "checkbox" ||
        droppedFieldType === "date" ||
        droppedFieldType === "radio") &&
      pdfPageRef.current
    ) {
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
      setPopupFieldType(droppedFieldType);
      setPopupKey("");
      setPopupLabel("");
      setPopupMinLength("");
      setPopupMaxLength("");
      setPopupMinValue("");
      setPopupMaxValue("");
      setPopupMinDate("");
      setPopupMaxDate("");
      setPopupAllowDecimal(false);
      setPopupDropdownOptions(droppedFieldType === "dropdown" ? [""] : []);
      setPopupCheckboxOptions(droppedFieldType === "checkbox" ? [""] : []);
      setPopupRequired(false);
      setPopupKeyError("");
      setShowPopup(true);
    }
  };

  const handleEditVariable = (variable: PdfVariable) => {
    if (suppressClickVariableIdRef.current === variable.id) {
      suppressClickVariableIdRef.current = null;
      return;
    }

    setEditingVariableId(variable.id);
    setPopupFieldType(variable.type);
    setPopupKey(variable.key);
    setPopupLabel(variable.label);
    setPopupMinLength(variable.minLength?.toString() ?? "");
    setPopupMaxLength(variable.maxLength?.toString() ?? "");
    setPopupMinValue(variable.minValue?.toString() ?? "");
    setPopupMaxValue(variable.maxValue?.toString() ?? "");
    setPopupMinDate(variable.minDate ?? "");
    setPopupMaxDate(variable.maxDate ?? "");
    setPopupAllowDecimal(Boolean(variable.allowDecimal));
    setPopupDropdownOptions(
      variable.type === "dropdown"
        ? variable.dropdownOptions && variable.dropdownOptions.length > 0
          ? [...variable.dropdownOptions]
          : [""]
        : []
    );
    setPopupCheckboxOptions(
      variable.type === "checkbox"
        ? variable.checkboxOptions && variable.checkboxOptions.length > 0
          ? [...variable.checkboxOptions]
          : [""]
        : []
    );
    setPopupRequired(Boolean(variable.required));
    setPopupKeyError("");
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

    updateVariables((prev) => prev.filter((variable) => variable.id !== variableId));

    if (editingVariableId === variableId) {
      setShowPopup(false);
      setEditingVariableId(null);
      setPopupKey("");
      setPopupLabel("");
      setPopupMinLength("");
      setPopupMaxLength("");
      setPopupMinValue("");
      setPopupMaxValue("");
      setPopupMinDate("");
      setPopupMaxDate("");
      setPopupAllowDecimal(false);
      setPopupDropdownOptions([]);
      setPopupRequired(false);
      setPopupKeyError("");
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
    dragStartVariablesRef.current = cloneVariables(variables);
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
    resizeStartVariablesRef.current = cloneVariables(variables);
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

      updateVariables(
        (prev) =>
        prev.map((variable) =>
          variable.id === dragState.variableId
            ? {
                ...variable,
                x: nextX,
                y: nextY,
              }
            : variable
        ),
        { recordHistory: false }
      );
    };

    const handleMouseUp = () => {
      const releasedVariableId = dragState.variableId;

      if (hasDraggedRef.current) {
        suppressClickVariableIdRef.current = releasedVariableId;

        if (dragStartVariablesRef.current) {
          recordVariablesHistoryFromSnapshot(dragStartVariablesRef.current);
        }
      }

      setDragState(null);
      hasDraggedRef.current = false;
      dragStartVariablesRef.current = null;
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

      updateVariables(
        (prev) =>
        prev.map((variable) =>
          variable.id === resizeState.variableId
            ? {
                ...variable,
                width: nextWidth,
                height: nextHeight,
              }
            : variable
        ),
        { recordHistory: false }
      );
    };

    const handleMouseUp = () => {
      const releasedVariableId = resizeState.variableId;

      if (hasResizedRef.current) {
        suppressClickVariableIdRef.current = releasedVariableId;

        if (resizeStartVariablesRef.current) {
          recordVariablesHistoryFromSnapshot(resizeStartVariablesRef.current);
        }
      }

      setResizeState(null);
      hasResizedRef.current = false;
      resizeStartVariablesRef.current = null;
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
    const normalizedMinLength =
      popupFieldType === "text" ? parseOptionalLength(popupMinLength) : undefined;
    const normalizedMaxLength =
      popupFieldType === "text" ? parseOptionalLength(popupMaxLength) : undefined;
    const normalizedMinValue =
      popupFieldType === "number" ? parseOptionalNumber(popupMinValue) : undefined;
    const normalizedMaxValue =
      popupFieldType === "number" ? parseOptionalNumber(popupMaxValue) : undefined;
    const normalizedMinDate = popupFieldType === "date" ? popupMinDate.trim() || undefined : undefined;
    const normalizedMaxDate = popupFieldType === "date" ? popupMaxDate.trim() || undefined : undefined;
    const normalizedAllowDecimal = popupFieldType === "number" ? popupAllowDecimal : undefined;
    const normalizedDropdownOptions =
      popupFieldType === "dropdown"
        ? popupDropdownOptions.map((option) => option.trim()).filter((option) => option.length > 0)
        : undefined;
    const normalizedCheckboxOptions =
      popupFieldType === "checkbox"
        ? popupCheckboxOptions.map((option) => option.trim()).filter((option) => option.length > 0)
        : undefined;
    const normalizedRequired =
      popupFieldType === "text" || popupFieldType === "number" || popupFieldType === "date"
        ? popupRequired
        : undefined;

    if (!normalizedKey) {
      setPopupKeyError("Key is required.");
      return;
    }

    const duplicateKeyExists = variables.some(
      (variable) =>
        variable.id !== editingVariableId &&
        variable.key.trim().toLowerCase() === normalizedKey.toLowerCase()
    );

    if (duplicateKeyExists) {
      setPopupKeyError("Key must be unique across all fields.");
      return;
    }

    if (!normalizedLabel) {
      alert("Please fill in Label");
      return;
    }

    if (
      popupFieldType === "text" &&
      normalizedMinLength !== undefined &&
      normalizedMaxLength !== undefined &&
      normalizedMinLength > normalizedMaxLength
    ) {
      alert("Min Length cannot be greater than Max Length.");
      return;
    }

    if (
      popupFieldType === "text" &&
      normalizedRequired &&
      normalizedMaxLength === 0
    ) {
      alert("Required text fields cannot have Max Length as 0.");
      return;
    }

    if (
      popupFieldType === "number" &&
      normalizedMinValue !== undefined &&
      normalizedMaxValue !== undefined &&
      normalizedMinValue > normalizedMaxValue
    ) {
      alert("Minimum Value cannot be greater than Maximum Value.");
      return;
    }

    if (
      popupFieldType === "date" &&
      normalizedMinDate !== undefined &&
      normalizedMaxDate !== undefined &&
      normalizedMinDate > normalizedMaxDate
    ) {
      alert("Minimum Date cannot be greater than Maximum Date.");
      return;
    }

    if (popupFieldType === "dropdown" && (!normalizedDropdownOptions || normalizedDropdownOptions.length === 0)) {
      alert("Please add at least one dropdown option.");
      return;
    }

    if (popupFieldType === "checkbox" && (!normalizedCheckboxOptions || normalizedCheckboxOptions.length === 0)) {
      alert("Please add at least one checkbox option.");
      return;
    }

    setPopupKeyError("");

    if (editingVariableId) {
      updateVariables((prev) =>
        prev.map((variable) =>
          variable.id === editingVariableId
            ? {
                ...variable,
                key: normalizedKey,
                label: normalizedLabel,
                type: popupFieldType,
                minLength: popupFieldType === "text" ? normalizedMinLength : undefined,
                maxLength: popupFieldType === "text" ? normalizedMaxLength : undefined,
                minValue: popupFieldType === "number" ? normalizedMinValue : undefined,
                maxValue: popupFieldType === "number" ? normalizedMaxValue : undefined,
                minDate: popupFieldType === "date" ? normalizedMinDate : undefined,
                maxDate: popupFieldType === "date" ? normalizedMaxDate : undefined,
                allowDecimal: popupFieldType === "number" ? normalizedAllowDecimal : undefined,
                dropdownOptions: popupFieldType === "dropdown" ? normalizedDropdownOptions : undefined,
                checkboxOptions: popupFieldType === "checkbox" ? normalizedCheckboxOptions : undefined,
                required: normalizedRequired,
              }
            : variable
        )
      );
    } else {
      const newVariable: PdfVariable = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        key: normalizedKey,
        label: normalizedLabel,
        type: popupFieldType,
        page: popupDropPage,
        x: popupDropX,
        y: popupDropY,
        width: 100,
        height: 30,
        minLength: popupFieldType === "text" ? normalizedMinLength : undefined,
        maxLength: popupFieldType === "text" ? normalizedMaxLength : undefined,
        minValue: popupFieldType === "number" ? normalizedMinValue : undefined,
        maxValue: popupFieldType === "number" ? normalizedMaxValue : undefined,
        minDate: popupFieldType === "date" ? normalizedMinDate : undefined,
        maxDate: popupFieldType === "date" ? normalizedMaxDate : undefined,
        allowDecimal: popupFieldType === "number" ? normalizedAllowDecimal : undefined,
        dropdownOptions: popupFieldType === "dropdown" ? normalizedDropdownOptions : undefined,
        checkboxOptions: popupFieldType === "checkbox" ? normalizedCheckboxOptions : undefined,
        required: normalizedRequired,
      };

      updateVariables((prev) => {
        return [
          ...prev,
          newVariable,
        ];
      });
    }

    setShowPopup(false);
    setEditingVariableId(null);
    setPopupFieldType("text");
    setPopupKey("");
    setPopupLabel("");
    setPopupMinLength("");
    setPopupMaxLength("");
    setPopupMinValue("");
    setPopupMaxValue("");
    setPopupMinDate("");
    setPopupMaxDate("");
    setPopupAllowDecimal(false);
    setPopupDropdownOptions([]);
    setPopupCheckboxOptions([]);
    setPopupRequired(false);
    setPopupKeyError("");
  };

  const handleCancelPopup = () => {
    setShowFieldDetails(false);
    setShowPopup(false);
    setEditingVariableId(null);
    setPopupFieldType("text");
    setPopupKey("");
    setPopupLabel("");
    setPopupMinLength("");
    setPopupMaxLength("");
    setPopupMinValue("");
    setPopupMaxValue("");
    setPopupMinDate("");
    setPopupMaxDate("");
    setPopupAllowDecimal(false);
    setPopupDropdownOptions([]);
    setPopupCheckboxOptions([]);
    setPopupRequired(false);
    setPopupKeyError("");
  };

  const handleDownloadVariables = async () => {
    const normalizedDocumentName = documentName.trim() || file.name;

    setShowDownloadValidationModal(true);
    setDownloadValidationStatus("progress");
    setDownloadValidationMessage("JSON evaluation is in progress.");

    const getConstraints = (field: PdfVariable) => {
      if (field.type === "text") {
        return {
          minLength: field.minLength ?? null,
          maxLength: field.maxLength ?? null,
          required: field.required ?? false,
        };
      }

      if (field.type === "number") {
        return {
          minValue: field.minValue ?? null,
          maxValue: field.maxValue ?? null,
          allowDecimal: field.allowDecimal ?? false,
          required: field.required ?? false,
        };
      }

      if (field.type === "date") {
        return {
          minDate: field.minDate ?? null,
          maxDate: field.maxDate ?? null,
          required: field.required ?? false,
        };
      }

      return {};
    };

    const getConfig = (field: PdfVariable) => {
      if (field.type === "dropdown") {
        return {
          options: field.dropdownOptions ?? [],
        };
      }

      if (field.type === "checkbox") {
        return {
          options: field.checkboxOptions ?? [],
        };
      }

      return undefined;
    };

    const payload = {
      documentName: normalizedDocumentName,
      metadata: {
        coordinateSystem: {
          origin: "top-left",
          units: "pixels",
          pageIndex: "1-based",
        },
      },
      variables: variables.map((field) => {
        const config = getConfig(field);

        return {
          key: field.key,
          type: field.type,
          page: field.page,
          x: field.x,
          y: field.y,
          width: field.width ?? 100,
          height: field.height ?? 30,
          label: field.label,
          ...(config ? { config } : {}),
          constraints: getConstraints(field),
        };
      }),
    };

    try {
      const validationResult = FieldAttributesSchema.safeParse(payload);

      if (!validationResult.success) {
        setDownloadValidationStatus("error");
        setDownloadValidationMessage("JSON validation failed. Please review field attributes and try again.");
        return;
      }

      setDownloadValidationStatus("success");
      setDownloadValidationMessage("JSON Validation successful, download will begin shortly.");

      await new Promise((resolve) => window.setTimeout(resolve, 700));

      const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });

      const downloadUrl = URL.createObjectURL(jsonBlob);
      const link = document.createElement("a");
      const baseName = normalizedDocumentName.replace(/\.[^/.]+$/, "");

      link.href = downloadUrl;
      link.download = `${baseName}-variables.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setShowDownloadValidationModal(false);
      setDownloadValidationMessage("");
    } catch {
      setDownloadValidationStatus("error");
      setDownloadValidationMessage("JSON validation could not be completed. Please try again.");
    }
  };

  const handleReset = async () => {
    setVariablesHistory({
      past: [],
      present: [],
      future: [],
    });
    setShowResetConfirm(false);

    // Sync reset to server
    if (templateId) {
      await updateTemplateVariablesAction(templateId, []);
    }
  };

  const copyUrlToClipboard = () => {
    const apiUrl = `GET ${window.location.origin}/${templateId}/getJson`;
    navigator.clipboard.writeText(apiUrl);
    setIsApiUrlCopied(true);
    window.setTimeout(() => {
      setIsApiUrlCopied(false);
    }, 2000);
  };

  const handleJsonFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadJsonError("");

    // Check extension
    if (!file.name.endsWith(".json")) {
      setUploadJsonError("File must be a .json file");
      event.target.value = "";
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadJsonError("File size must not exceed 5MB");
      event.target.value = "";
      return;
    }

    // Store the file and open confirmation modal
    setPendingJsonFile(file);
    setShowUploadJsonModal(true);
    event.target.value = "";
  };

  const handleUploadJsonConfirm = async () => {
    if (!pendingJsonFile) return;

    try {
      const text = await pendingJsonFile.text();
      const json = JSON.parse(text);

      // Validate against schema
      const validationResult = FieldAttributesSchema.safeParse(json);
      if (!validationResult.success) {
        setUploadJsonError("Invalid JSON schema");
        setShowUploadJsonModal(false);
        setShowUploadJsonErrorModal(true);
        return;
      }

      const parsedPayload = validationResult.data;
      const payload = Array.isArray(parsedPayload) ? parsedPayload[0] : parsedPayload;

      if (!payload || !payload.variables) {
        setUploadJsonError("No valid fields found in JSON");
        setShowUploadJsonModal(false);
        setShowUploadJsonErrorModal(true);
        return;
      }

      const fields = payload.variables;

      // Check if all pages exist in the PDF
      const maxPage = numPages || 1;
      for (const field of fields) {
        if (field.page < 1 || field.page > maxPage) {
          setUploadJsonError(`Field references page ${field.page} but PDF has only ${maxPage} page(s)`);
          setShowUploadJsonModal(false);
          setShowUploadJsonErrorModal(true);
          return;
        }
      }

      // Convert FieldData to PdfVariable and load into editor
      const newVariables: PdfVariable[] = fields.map((field: FieldData) => ({
        id: `${Date.now()}-${Math.random()}`,
        key: field.key,
        label: field.label,
        type: field.type,
        page: field.page,
        x: field.x,
        y: field.y,
        width: field.width ?? 100,
        height: field.height ?? 30,
        minLength: field.constraints?.minLength ?? undefined,
        maxLength: field.constraints?.maxLength ?? undefined,
        minValue: field.constraints?.minValue ?? undefined,
        maxValue: field.constraints?.maxValue ?? undefined,
        allowDecimal: field.constraints?.allowDecimal ?? undefined,
        required: field.constraints?.required ?? undefined,
        minDate: field.constraints?.minDate ?? undefined,
        maxDate: field.constraints?.maxDate ?? undefined,
        dropdownOptions: field.config?.options ?? undefined,
        checkboxOptions: field.config?.options ?? undefined,
      }));

      // Replace all variables
      setVariablesHistory({
        past: [],
        present: newVariables,
        future: [],
      });

      // Sync to server
      if (templateId) {
        const storedVariables = newVariables.map((v) => convertToStoredVariable(v));
        await updateTemplateVariablesAction(templateId, storedVariables);
      }

      setShowUploadJsonModal(false);
      setPendingJsonFile(null);
      setUploadJsonError("");
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Failed to parse JSON";
      setUploadJsonError(errMsg);
      setShowUploadJsonModal(false);
      setShowUploadJsonErrorModal(true);
    }
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
    <div className="flex h-full min-h-0 w-full gap-4">
      {/* Left panel: field controls — hidden on mobile */}
      <div className="pane-side-surface hidden md:flex flex-col h-full w-[30%] flex-shrink-0 rounded-md border border-slate-200 bg-white p-3">
        <h2 className="text-sm font-semibold text-slate-950">Fields</h2>
        <p className="mt-1 text-xs text-slate-950">Drag fields onto the PDF to place them.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            draggable
            onDragStart={(e) => handleDragStart(e, "text")}
            onClick={handleAddTextField}
            className="rounded border border-slate-300 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 cursor-move"
          >
            <i className="fa-solid fa-language mr-2"></i>Text
          </button>
          <button
            type="button"
            draggable
            onDragStart={(e) => handleDragStart(e, "number")}
            onClick={handleAddNumberField}
            className="rounded border border-slate-300 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 cursor-move"
          >
            <i className="fa-solid fa-hashtag mr-2"></i>Number
          </button>
          <button
            type="button"
            draggable
            onDragStart={(e) => handleDragStart(e, "checkbox")}
            onClick={handleAddCheckboxField}
            className="rounded border border-slate-300 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 cursor-move"
          >
            <i className="fa-solid fa-list-check mr-2"></i>Checklist
          </button>
          <button
            type="button"
            draggable
            onDragStart={(e) => handleDragStart(e, "dropdown")}
            onClick={handleAddDropdownField}
            className="rounded border border-slate-300 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 cursor-move"
          >
            <i className="fa-solid fa-angles-down mr-2"></i>Dropdown
          </button>
          <button
            type="button"
            draggable
            onDragStart={(e) => handleDragStart(e, "date")}
            onClick={handleAddDateField}
            className="rounded border border-slate-300 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 cursor-move"
          >
            <i className="fa-solid fa-calendar-days mr-2"></i>Date
          </button>
          <button
            type="button"
            draggable
            onDragStart={(e) => handleDragStart(e, "radio")}
            onClick={handleAddRadioField}
            className="rounded border border-slate-300 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 cursor-move"
          >
            <i className="fa-solid fa-circle-dot mr-2"></i>Radio
          </button>
        </div>
        <p className="mt-4 text-xs text-slate-950">
          Total variables: <span className="font-medium text-slate-900">{variables.length}</span>
        </p>

        {/* Upload JSON Field Attributes */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Upload JSON Field Attributes</h3>
          <label className="flex items-center justify-center rounded border border-dashed border-slate-300 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleJsonFileSelect}
              className="hidden"
            />
            <span className="text-xs font-medium text-slate-700">Choose JSON File</span>
          </label>
        </div>

        {/* View Options */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">View Options</h3>
          <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="h-3.5 w-3.5 accent-blue-600"
            />
            <span className="text-xs text-slate-800">Show Labels</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={showCoordinates}
              onChange={(e) => setShowCoordinates(e.target.checked)}
              className="h-3.5 w-3.5 accent-blue-600"
            />
            <span className="text-xs text-slate-800">Show Coordinates</span>
          </label>
        </div>

        {/* Actions */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadVariables}
              className="rounded bg-blue-500 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => {
                setIsApiUrlCopied(false);
                setShowGetApiModal(true);
              }}
              className="rounded bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
            >
              Get API
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="rounded bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Reset
            </button>
            {templateId && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Middle: main PDF viewer + pagination — full width on mobile, 50% on desktop */}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col md:w-[55%] md:flex-none">
        {/* Top bar: editable document name + actions */}
        <div className="flex-shrink-0 rounded-md border border-slate-300 bg-white p-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={documentName}
              onChange={(event) => setDocumentName(event.target.value)}
              onBlur={(event) => {
                const nextName = event.target.value.trim() || file.name;
                setDocumentName(nextName);
                void persistDocumentName(nextName);
              }}
              className="w-full rounded border border-slate-300 px-3 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Document name"
              aria-label="Document name"
            />
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo"
                aria-label="Undo"
                className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={isDarkMode ? "text-white" : "text-blue-600"}>
                  <i className="fa-solid fa-rotate-left" />
                </span>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo"
                aria-label="Redo"
                className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={isDarkMode ? "text-white" : "text-blue-600"}>
                  <i className="fa-solid fa-rotate-right" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-2 text-base font-semibold text-black">Delete Template?</h3>
              <p className="mb-6 text-sm text-slate-900">
                Are you sure you want to delete <span className="font-medium">&ldquo;{file.name}&rdquo;</span>? This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="rounded border border-slate-300 px-4 py-2 text-sm text-black hover:bg-slate-50 disabled:opacity-50"
                >
                  No
                </button>
                <button
                  onClick={async () => {
                    if (!templateId) return;
                    setIsDeleting(true);
                    await deleteTemplateAction(templateId);
                    router.push("/");
                  }}
                  disabled={isDeleting}
                  className="rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Yes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-2 text-base font-semibold text-black">Reset All Fields?</h3>
              <p className="mb-6 text-sm text-slate-900">
                Are you sure you want to remove all added fields? This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded border border-slate-300 px-4 py-2 text-sm text-black hover:bg-slate-50"
                >
                  No
                </button>
                <button
                  onClick={handleReset}
                  className="rounded bg-yellow-500 px-4 py-2 text-sm text-white hover:bg-yellow-600"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {showGetApiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-base font-semibold text-black">API Endpoint</h3>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`GET ${typeof window !== 'undefined' ? window.location.origin : ''}/${templateId}/getJson`}
                  className="w-full max-w-[280px] rounded border border-slate-300 px-2 py-1.5 text-[11px] font-mono text-slate-700 bg-slate-50"
                />
                <button
                  onClick={copyUrlToClipboard}
                  className={`rounded px-3 py-2 text-xs font-medium text-white transition-colors ${
                    isApiUrlCopied ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {isApiUrlCopied ? "Copied to Clipboard" : "Copy to Clipboard"}
                </button>
              </div>
              <div className="mb-4 rounded bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-slate-700">
                  <span className="font-semibold">Instructions:</span> Copy the above URL and paste it in your browser or use API clients to fetch the JSON payload.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowGetApiModal(false);
                    setIsApiUrlCopied(false);
                  }}
                  className="rounded bg-slate-300 px-4 py-2 text-sm font-medium text-black hover:bg-slate-400"
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        )}

        {showDownloadValidationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-3 text-base font-semibold text-black">Download JSON</h3>
              {downloadValidationStatus === "progress" && (
                <div className="mb-4 flex items-center justify-center">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" aria-hidden="true" />
                </div>
              )}
              <p className="mb-6 text-sm text-slate-900">{downloadValidationMessage}</p>
              {downloadValidationStatus === "error" && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowDownloadValidationModal(false);
                      setDownloadValidationMessage("");
                    }}
                    className="rounded border border-slate-300 px-4 py-2 text-sm text-black hover:bg-slate-50"
                  >
                    Okay
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showUploadJsonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-3 text-base font-semibold text-black">Upload JSON Field Attributes?</h3>
              <p className="mb-2 text-sm text-slate-900">
                <span className="font-semibold">Warning:</span> Uploading a JSON file will remove all existing field configurations and replace them with the ones from the file.
              </p>
              <p className="mb-6 text-xs text-slate-700">
                It is recommended to download your current configuration before uploading a new one.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowUploadJsonModal(false);
                    setPendingJsonFile(null);
                    setUploadJsonError("");
                  }}
                  className="rounded border border-slate-300 px-4 py-2 text-sm text-black hover:bg-slate-50"
                >
                  Okay
                </button>
                <button
                  onClick={handleUploadJsonConfirm}
                  className="rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {showUploadJsonErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-3 text-base font-semibold text-black">Validation Error</h3>
              <p className="mb-6 text-sm text-slate-900">
                {uploadJsonError}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowUploadJsonErrorModal(false);
                    setPendingJsonFile(null);
                    setUploadJsonError("");
                  }}
                  className="rounded border border-slate-300 px-4 py-2 text-sm text-black hover:bg-slate-50"
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable main page area */}
        <div
          ref={pdfContainerRef}
          className="pdf-viewer-area mt-3 min-h-0 flex-1 overflow-auto rounded-md border border-slate-300 p-2"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex w-max min-w-full justify-center">
            <Document
              file={fileObject}
              onLoadSuccess={handleDocumentLoadSuccess}
              loading={<p className="text-slate-950">Loading PDF...</p>}
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
                      {showLabels && (
                        <span className="pointer-events-none flex h-full w-full items-center justify-center truncate px-2 text-center">
                          {`{{${variable.label}}}`}
                        </span>
                      )}
                      {showCoordinates && (
                        <span className="pointer-events-none absolute flex items-center justify-center rounded border border-blue-600 bg-blue-600 px-1.5 py-0.5 text-[9px] font-mono font-semibold leading-none text-white opacity-95 whitespace-nowrap" style={{ bottom: '100%', left: 0, transform: 'translateY(-2px)' }}>
                          {Math.round(variable.x)},{Math.round(variable.y)}
                        </span>
                      )}
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

        {/* Pagination controls — bottom section */}
        <div className="mt-2 flex-shrink-0 rounded-md border border-slate-300 bg-white p-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center justify-center gap-4">
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 text-sm text-black disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => canZoomOut && setZoomScale((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))}
              disabled={!canZoomOut}
            >
              −
            </button>
            <span className="min-w-14 text-center text-sm text-slate-900">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 text-sm text-black disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => canZoomIn && setZoomScale((z) => Math.min(2, Number((z + 0.1).toFixed(1))))}
              disabled={!canZoomIn}
            >
              +
            </button>

            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 text-sm text-black disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => canGoPrev && setPageNumber((p) => p - 1)}
              disabled={!canGoPrev}
            >
              ← Previous
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-900">
              <span>Page</span>
              <input
                type="text"
                inputMode="numeric"
                value={pageInputValue}
                onChange={(event) => {
                  const digitsOnly = event.target.value.replace(/\D/g, "");
                  setPageInputValue(digitsOnly);
                }}
                onBlur={applyPageInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyPageInput();
                    event.currentTarget.blur();
                  }
                }}
                disabled={!numPages}
                className="w-14 rounded border border-slate-300 px-2 py-1 text-center text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Page number"
              />
              <span>{numPages ? `of ${numPages}` : "of -"}</span>
            </div>
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1 text-sm text-black disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => canGoNext && setPageNumber((p) => p + 1)}
              disabled={!canGoNext}
            >
              Next →
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: scrollable thumbnail sidebar — 20%, hidden on mobile */}
      {numPages && (
        <div className="pane-side-surface hidden md:flex flex-col h-full w-[20%] flex-shrink-0 rounded-md border border-slate-200 bg-white p-3">
          <div ref={thumbnailContainerRef} className="thumbnail-scrollbar thumbnail-scrollbar-left h-full overflow-y-scroll overflow-x-hidden pl-1">
            <div className="thumbnail-scrollbar-content w-full">
              <Document
                file={fileObject}
                loading={null}
                className="ml-0 mr-auto w-fit translate-x-[15px]"
              >
                {Array.from({ length: numPages }, (_, i) => {
                  const pg = i + 1;
                  const isActive = pg === pageNumber;
                  return (
                    <div key={pg} className="mb-3 flex w-full justify-center">
                      <div
                        data-thumbnail-page={pg}
                        onClick={() => setPageNumber(pg)}
                        className={`w-fit cursor-pointer rounded border-2 transition ${
                          isActive
                            ? "border-blue-500"
                            : "border-slate-400 hover:border-slate-500"
                        }`}
                      >
                        <Page
                          pageNumber={pg}
                          width={112}
                          renderAnnotationLayer={false}
                          renderTextLayer={false}
                        />
                        <p className={`text-center text-xs py-0.5 ${
                          isActive ? "text-blue-600 font-semibold" : "text-slate-950"
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
        </div>
      )}
    </div>

    {/* Popup Modal */}
    {showPopup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="rounded-lg bg-white p-6 shadow-lg w-96">
          <h3 className="text-lg font-semibold text-slate-950 mb-4">
            {editingVariableId
              ? `Edit ${getFieldTypeLabel(popupFieldType)} Field`
              : `Add ${getFieldTypeLabel(popupFieldType)} Field`}
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Key
            </label>
            <input
              type="text"
              value={popupKey}
              onChange={(e) => {
                setPopupKey(e.target.value);
                if (popupKeyError) {
                  setPopupKeyError("");
                }
              }}
              placeholder="e.g., field_name"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {popupKeyError && (
              <p className="mt-1 text-xs text-red-600">{popupKeyError}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Label
            </label>
            <input
              type="text"
              value={popupLabel}
              onChange={(e) => setPopupLabel(e.target.value)}
              placeholder="e.g., Customer Name"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {popupFieldType === "text" && (
            <div className="mb-6 rounded border border-slate-200 p-3">
              <p className="mb-3 text-sm font-medium text-slate-900">Text Constraints</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-900">
                    Min Length
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={popupMinLength}
                    onChange={(event) => setPopupMinLength(event.target.value)}
                    placeholder="e.g., 2"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-900">
                    Max Length
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={popupMaxLength}
                    onChange={(event) => setPopupMaxLength(event.target.value)}
                    placeholder="e.g., 20"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-900">
                <input
                  type="checkbox"
                  checked={popupRequired}
                  onChange={(event) => setPopupRequired(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Required
              </label>
            </div>
          )}

          {popupFieldType === "number" && (
            <div className="mb-6 rounded border border-slate-200 p-3">
              <p className="mb-3 text-sm font-medium text-slate-900">Number Constraints</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-900">
                    Minimum Value
                  </label>
                  <input
                    type="number"
                    value={popupMinValue}
                    onChange={(event) => setPopupMinValue(event.target.value)}
                    placeholder="e.g., 0"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-900">
                    Maximum Value
                  </label>
                  <input
                    type="number"
                    value={popupMaxValue}
                    onChange={(event) => setPopupMaxValue(event.target.value)}
                    placeholder="e.g., 100"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-900">
                  <input
                    type="checkbox"
                    checked={popupAllowDecimal}
                    onChange={(event) => setPopupAllowDecimal(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Allow Decimal
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-900">
                  <input
                    type="checkbox"
                    checked={popupRequired}
                    onChange={(event) => setPopupRequired(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Required
                </label>
              </div>
            </div>
          )}

          {popupFieldType === "date" && (
            <div className="mb-6 rounded border border-slate-200 p-3">
              <p className="mb-3 text-sm font-medium text-slate-900">Date Constraints</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-900">
                    Minimum Date
                  </label>
                  <input
                    type="date"
                    value={popupMinDate}
                    onChange={(event) => setPopupMinDate(event.target.value)}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-900">
                    Maximum Date
                  </label>
                  <input
                    type="date"
                    value={popupMaxDate}
                    onChange={(event) => setPopupMaxDate(event.target.value)}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-900">
                <input
                  type="checkbox"
                  checked={popupRequired}
                  onChange={(event) => setPopupRequired(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Required
              </label>
            </div>
          )}

          {popupFieldType === "dropdown" && (
            <div className="mb-6 rounded border border-slate-200 p-3">
              <p className="mb-3 text-sm font-medium text-slate-900">Dropdown Options</p>
              <div className="space-y-2">
                {popupDropdownOptions.map((option, index) => (
                  <div key={`dropdown-option-${index}`} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(event) => handleUpdateDropdownOption(index, event.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {popupDropdownOptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDropdownOption(index)}
                        className="rounded border border-slate-300 px-2 py-2 text-xs text-black hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddDropdownOption}
                className="mt-3 rounded border border-slate-300 px-3 py-1.5 text-xs text-black hover:bg-slate-50"
              >
                + Add Option
              </button>
            </div>
          )}

          {popupFieldType === "checkbox" && (
            <div className="mb-6 rounded border border-slate-200 p-3">
              <p className="mb-3 text-sm font-medium text-slate-900">Checkbox Options</p>
              <div className="space-y-2">
                {popupCheckboxOptions.map((option, index) => (
                  <div key={`checkbox-option-${index}`} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(event) => handleUpdateCheckboxOption(index, event.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {popupCheckboxOptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCheckboxOption(index)}
                        className="rounded border border-slate-300 px-2 py-2 text-xs text-black hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddCheckboxOption}
                className="mt-3 rounded border border-slate-300 px-3 py-1.5 text-xs text-black hover:bg-slate-50"
              >
                + Add Option
              </button>
            </div>
          )}
          
            {/* Collapsible Field Details */}
            <div className="mb-6 border border-slate-200 rounded">
              <button
                type="button"
                onClick={() => setShowFieldDetails(!showFieldDetails)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition text-sm font-medium text-slate-900"
              >
                <span>Field Details</span>
                <span className={`transition ${showFieldDetails ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
            
              {showFieldDetails && (
                <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs space-y-2">
                  {editingVariableId ? (
                    (() => {
                      const editingVariable = variables.find((v) => v.id === editingVariableId);
                      return editingVariable ? (
                        <>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">ID:</span>
                            <span className="text-slate-950 font-mono">{editingVariable.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Type:</span>
                            <span className="text-slate-950 capitalize">{editingVariable.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Page:</span>
                            <span className="text-slate-950">{editingVariable.page}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">X:</span>
                            <span className="text-slate-950">{Math.round(editingVariable.x)}px</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Y:</span>
                            <span className="text-slate-950">{Math.round(editingVariable.y)}px</span>
                          </div>
                          {editingVariable.type === "text" && (
                            <>
                              <div className="flex justify-between">
                                <span className="font-medium text-slate-900">Min Length:</span>
                                <span className="text-slate-950">{editingVariable.minLength ?? "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-slate-900">Max Length:</span>
                                <span className="text-slate-950">{editingVariable.maxLength ?? "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-slate-900">Required:</span>
                                <span className="text-slate-950">{editingVariable.required ? "Yes" : "No"}</span>
                              </div>
                            </>
                          )}
                          {editingVariable.type === "number" && (
                            <>
                              <div className="flex justify-between">
                                <span className="font-medium text-slate-900">Minimum Value:</span>
                                <span className="text-slate-950">{editingVariable.minValue ?? "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-slate-900">Maximum Value:</span>
                                <span className="text-slate-950">{editingVariable.maxValue ?? "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-slate-900">Allow Decimal:</span>
                                <span className="text-slate-950">{editingVariable.allowDecimal ? "Yes" : "No"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-slate-900">Required:</span>
                                <span className="text-slate-950">{editingVariable.required ? "Yes" : "No"}</span>
                              </div>
                            </>
                          )}
                          {editingVariable.type === "date" && (
                            <>
                              <div className="flex justify-between">
                                <span className="font-medium text-slate-900">Minimum Date:</span>
                                <span className="text-slate-950">{editingVariable.minDate ?? "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-slate-900">Maximum Date:</span>
                                <span className="text-slate-950">{editingVariable.maxDate ?? "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-slate-900">Required:</span>
                                <span className="text-slate-950">{editingVariable.required ? "Yes" : "No"}</span>
                              </div>
                            </>
                          )}
                          {editingVariable.type === "dropdown" && (
                            <div>
                              <p className="mb-1 font-medium text-slate-900">Options:</p>
                              <p className="break-all text-slate-950">
                                {editingVariable.dropdownOptions && editingVariable.dropdownOptions.length > 0
                                  ? editingVariable.dropdownOptions.join(", ")
                                  : "-"}
                              </p>
                            </div>
                          )}
                          {editingVariable.type === "checkbox" && (
                            <div>
                              <p className="mb-1 font-medium text-slate-900">Options:</p>
                              <p className="break-all text-slate-950">
                                {editingVariable.checkboxOptions && editingVariable.checkboxOptions.length > 0
                                  ? editingVariable.checkboxOptions.join(", ")
                                  : "-"}
                              </p>
                            </div>
                          )}
                          {editingVariable.width && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-900">Width:</span>
                              <span className="text-slate-950">{Math.round(editingVariable.width)}px</span>
                            </div>
                          )}
                          {editingVariable.height && (
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-900">Height:</span>
                              <span className="text-slate-950">{Math.round(editingVariable.height)}px</span>
                            </div>
                          )}
                        </>
                      ) : null;
                    })()
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-900">Type:</span>
                        <span className="text-slate-950 capitalize">{popupFieldType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-900">Page:</span>
                        <span className="text-slate-950">{popupDropPage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-900">X:</span>
                        <span className="text-slate-950">{Math.round(popupDropX)}px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-900">Y:</span>
                        <span className="text-slate-950">{Math.round(popupDropY)}px</span>
                      </div>
                      {popupFieldType === "text" && (
                        <>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Min Length:</span>
                            <span className="text-slate-950">{popupMinLength.trim() || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Max Length:</span>
                            <span className="text-slate-950">{popupMaxLength.trim() || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Required:</span>
                            <span className="text-slate-950">{popupRequired ? "Yes" : "No"}</span>
                          </div>
                        </>
                      )}
                      {popupFieldType === "number" && (
                        <>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Minimum Value:</span>
                            <span className="text-slate-950">{popupMinValue.trim() || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Maximum Value:</span>
                            <span className="text-slate-950">{popupMaxValue.trim() || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Allow Decimal:</span>
                            <span className="text-slate-950">{popupAllowDecimal ? "Yes" : "No"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Required:</span>
                            <span className="text-slate-950">{popupRequired ? "Yes" : "No"}</span>
                          </div>
                        </>
                      )}
                      {popupFieldType === "date" && (
                        <>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Minimum Date:</span>
                            <span className="text-slate-950">{popupMinDate.trim() || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Maximum Date:</span>
                            <span className="text-slate-950">{popupMaxDate.trim() || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-900">Required:</span>
                            <span className="text-slate-950">{popupRequired ? "Yes" : "No"}</span>
                          </div>
                        </>
                      )}
                      {popupFieldType === "dropdown" && (
                        <div>
                          <p className="mb-1 font-medium text-slate-900">Options:</p>
                          <p className="break-all text-slate-950">
                            {popupDropdownOptions
                              .map((option) => option.trim())
                              .filter((option) => option.length > 0)
                              .join(", ") || "-"}
                          </p>
                        </div>
                      )}
                      {popupFieldType === "checkbox" && (
                        <div>
                          <p className="mb-1 font-medium text-slate-900">Options:</p>
                          <p className="break-all text-slate-950">
                            {popupCheckboxOptions
                              .map((option) => option.trim())
                              .filter((option) => option.length > 0)
                              .join(", ") || "-"}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancelPopup}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-900 hover:bg-slate-50"
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
