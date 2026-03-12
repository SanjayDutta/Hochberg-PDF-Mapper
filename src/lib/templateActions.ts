"use server";

import {
  createTemplate,
  updateTemplateVariables,
  updateTemplateDocumentName,
  deleteTemplate,
  type StoredVariable,
} from "./templateStore";

export async function createTemplateAction(
  uuid: string,
  documentName: string,
  pdfBase64: string
) {
  return createTemplate(uuid, documentName, pdfBase64);
}

export async function updateTemplateVariablesAction(
  uuid: string,
  variables: StoredVariable[]
) {
  return updateTemplateVariables(uuid, variables);
}

export async function updateTemplateDocumentNameAction(
  uuid: string,
  documentName: string
) {
  return updateTemplateDocumentName(uuid, documentName);
}

export async function deleteTemplateAction(uuid: string) {
  return deleteTemplate(uuid);
}
