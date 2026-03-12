"use server";

import { createTemplate, updateTemplateVariables, deleteTemplate, type StoredVariable } from "./templateStore";

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

export async function deleteTemplateAction(uuid: string) {
  return deleteTemplate(uuid);
}
