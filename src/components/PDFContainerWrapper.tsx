"use client";

import { useMemo } from "react";
import { PDFContainer } from "./PDFContainer";
import type { StoredVariable } from "@/lib/templateStore";
import type { PdfVariable } from "./PDFContainer";

interface PDFContainerWrapperProps {
  templateId: string;
  pdfBase64: string;
  documentName: string;
  initialVariables: StoredVariable[];
}

function convertToPdfVariable(sv: StoredVariable): PdfVariable {
  return {
    id: sv.key,
    key: sv.key,
    label: sv.label,
    type: sv.type,
    page: sv.page,
    x: sv.x,
    y: sv.y,
    width: sv.width,
    height: sv.height,
    minLength: sv.constraints.minLength ?? undefined,
    maxLength: sv.constraints.maxLength ?? undefined,
    minValue: sv.constraints.minValue ?? undefined,
    maxValue: sv.constraints.maxValue ?? undefined,
    minDate: sv.constraints.minDate ?? undefined,
    maxDate: sv.constraints.maxDate ?? undefined,
    allowDecimal: sv.constraints.allowDecimal,
    required: sv.constraints.required,
    dropdownOptions: sv.type === "dropdown" ? sv.config?.options : undefined,
    checkboxOptions: sv.type === "checkbox" ? sv.config?.options : undefined,
  };
}

export function PDFContainerWrapper({
  templateId,
  pdfBase64,
  documentName,
  initialVariables,
}: PDFContainerWrapperProps) {
  const pdfFile = useMemo(() => {
    const byteChars = atob(pdfBase64);
    const byteNums = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteNums], { type: "application/pdf" });
    return new File([blob], documentName, { type: "application/pdf" });
  }, [pdfBase64, documentName]);

  const pdfVariables = useMemo(
    () => initialVariables.map(convertToPdfVariable),
    [initialVariables]
  );

  return <PDFContainer file={pdfFile} templateId={templateId} initialVariables={pdfVariables} />;
}
