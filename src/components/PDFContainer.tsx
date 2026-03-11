"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

type PDFContainerProps = {
  file: File;
  onLoadComplete?: () => void;
};

type ReactPdfModule = typeof import("react-pdf");

type PdfFieldType = "text" | "number" | "dropdown" | "checkbox";

type PdfVariable = {
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
  allowDecimal?: boolean;
  dropdownOptions?: string[];
  checkboxOptions?: string[];
  required?: boolean;
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

export function PDFContainer({ file, onLoadComplete }: PDFContainerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [documentName, setDocumentName] = useState(file.name);
  const [variablesHistory, setVariablesHistory] = useState<VariablesHistory>({
    past: [],
    present: [],
    future: [],
  });
  const [showPopup, setShowPopup] = useState(false);
  const [popupKey, setPopupKey] = useState("");
  const [popupLabel, setPopupLabel] = useState("");
  const [popupMinLength, setPopupMinLength] = useState("");
  const [popupMaxLength, setPopupMaxLength] = useState("");
  const [popupMinValue, setPopupMinValue] = useState("");
  const [popupMaxValue, setPopupMaxValue] = useState("");
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
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pdfPageRef = useRef<HTMLDivElement>(null);
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
  const canUndo = variablesHistory.past.length > 0;
  const canRedo = variablesHistory.future.length > 0;

  const getFieldTypeLabel = (fieldType: PdfFieldType) => {
    if (fieldType === "number") {
      return "Number";
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
        droppedFieldType === "checkbox") &&
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
      popupFieldType === "text" || popupFieldType === "number"
        ? popupRequired
        : undefined;
    let savedVariable: PdfVariable | null = null;

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
      const existingVariable = variables.find((variable) => variable.id === editingVariableId);
      savedVariable = existingVariable
        ? {
            ...existingVariable,
            key: normalizedKey,
            label: normalizedLabel,
            type: popupFieldType,
            minLength: popupFieldType === "text" ? normalizedMinLength : undefined,
            maxLength: popupFieldType === "text" ? normalizedMaxLength : undefined,
            minValue: popupFieldType === "number" ? normalizedMinValue : undefined,
            maxValue: popupFieldType === "number" ? normalizedMaxValue : undefined,
            allowDecimal: popupFieldType === "number" ? normalizedAllowDecimal : undefined,
            dropdownOptions: popupFieldType === "dropdown" ? normalizedDropdownOptions : undefined,
            checkboxOptions: popupFieldType === "checkbox" ? normalizedCheckboxOptions : undefined,
            required: normalizedRequired,
          }
        : {
            id: editingVariableId,
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
            allowDecimal: popupFieldType === "number" ? normalizedAllowDecimal : undefined,
            dropdownOptions: popupFieldType === "dropdown" ? normalizedDropdownOptions : undefined,
            checkboxOptions: popupFieldType === "checkbox" ? normalizedCheckboxOptions : undefined,
            required: normalizedRequired,
          };

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
        allowDecimal: popupFieldType === "number" ? normalizedAllowDecimal : undefined,
        dropdownOptions: popupFieldType === "dropdown" ? normalizedDropdownOptions : undefined,
        checkboxOptions: popupFieldType === "checkbox" ? normalizedCheckboxOptions : undefined,
        required: normalizedRequired,
      };

      savedVariable = newVariable;

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
    setPopupAllowDecimal(false);
    setPopupDropdownOptions([]);
    setPopupCheckboxOptions([]);
    setPopupRequired(false);
    setPopupKeyError("");

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
            minLength: savedVariable.minLength,
            maxLength: savedVariable.maxLength,
            minValue: savedVariable.minValue,
            maxValue: savedVariable.maxValue,
            allowDecimal: savedVariable.allowDecimal,
            dropdownOptions: savedVariable.dropdownOptions,
            checkboxOptions: savedVariable.checkboxOptions,
            required: savedVariable.required,
          },
          null,
          2
        )}`
      );
    }
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
    setPopupAllowDecimal(false);
    setPopupDropdownOptions([]);
    setPopupCheckboxOptions([]);
    setPopupRequired(false);
    setPopupKeyError("");
  };

  const handleDownloadVariables = () => {
    const normalizedDocumentName = documentName.trim() || file.name;

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

    const payload = [
      {
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
      },
    ];

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
        <h2 className="text-sm font-semibold text-slate-950">Fields</h2>
        <p className="mt-1 text-xs text-slate-950">Drag fields onto the PDF to place them.</p>
        <button
          type="button"
          draggable
          onDragStart={(e) => handleDragStart(e, "text")}
          onClick={handleAddTextField}
          className="mt-3 rounded border border-slate-300 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 cursor-move"
        >
          + Text Field
        </button>
        <button
          type="button"
          draggable
          onDragStart={(e) => handleDragStart(e, "number")}
          onClick={handleAddNumberField}
          className="mt-2 rounded border border-slate-300 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 cursor-move"
        >
          + Number Field
        </button>
        <button
          type="button"
          draggable
          onDragStart={(e) => handleDragStart(e, "checkbox")}
          onClick={handleAddCheckboxField}
          className="mt-2 rounded border border-slate-300 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 cursor-move"
        >
          + Checkbox Field
        </button>
        <button
          type="button"
          draggable
          onDragStart={(e) => handleDragStart(e, "dropdown")}
          onClick={handleAddDropdownField}
          className="mt-2 rounded border border-slate-300 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 cursor-move"
        >
          + Dropdown Field
        </button>
        <p className="mt-3 text-xs text-slate-950">
          Total variables: <span className="font-medium text-slate-900">{variables.length}</span>
        </p>
      </div>

      {/* Middle: main PDF viewer + pagination — full width on mobile, 50% on desktop */}
      <div className="flex flex-col flex-1 md:w-[55%] md:flex-none h-full min-w-0">
        {/* Top bar: editable document name + actions */}
        <div className="flex-shrink-0 rounded-md border border-slate-300 bg-white p-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={documentName}
              onChange={(event) => setDocumentName(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Document name"
              aria-label="Document name"
            />
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadVariables}
                className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-900 hover:bg-slate-50"
              >
                Download
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Redo
              </button>
            </div>
          </div>
        </div>

        {/* Pagination controls — top section */}
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
            <span className="text-sm text-slate-900">
              Page {pageNumber}
              {numPages ? ` of ${numPages}` : ""}
            </span>
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

        {/* Scrollable main page area */}
        <div
          ref={pdfContainerRef}
          className="mt-3 flex-1 overflow-auto rounded-md border border-slate-300 bg-slate-100 p-2"
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
