export type StoredVariable = {
  key: string;
  type: "text" | "number" | "dropdown" | "checkbox" | "date" | "radio";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  config?: {
    options: string[];
  };
  constraints: {
    minLength?: number | null;
    maxLength?: number | null;
    minValue?: number | null;
    maxValue?: number | null;
    minDate?: string | null;
    maxDate?: string | null;
    allowDecimal?: boolean;
    required?: boolean;
  };
};

export type StoredTemplate = {
  id: string;
  documentName: string;
  pdfBase64: string;
  metadata: {
    coordinateSystem: {
      origin: "top-left";
      units: "pixels";
      pageIndex: "1-based";
    };
  };
  variables: StoredVariable[];
};

type TemplateStore = Map<string, StoredTemplate>;

declare global {
  var __pdfTemplateStore: TemplateStore | undefined;
}

const createSeedStore = (): TemplateStore => {
  const store = new Map<string, StoredTemplate>();
  return store;
};

const templateStore: TemplateStore = globalThis.__pdfTemplateStore ?? createSeedStore();

if (!globalThis.__pdfTemplateStore) {
  globalThis.__pdfTemplateStore = templateStore;
}

export const getTemplateStore = () => templateStore;

export const getAllTemplates = (): StoredTemplate[] => Array.from(templateStore.values());

export const getTemplateById = (id: string): StoredTemplate | undefined => templateStore.get(id);

export const createTemplate = (
  id: string,
  documentName: string,
  pdfBase64: string
): StoredTemplate => {
  const template: StoredTemplate = {
    id,
    documentName,
    pdfBase64,
    metadata: {
      coordinateSystem: {
        origin: "top-left",
        units: "pixels",
        pageIndex: "1-based",
      },
    },
    variables: [],
  };

  templateStore.set(id, template);
  return template;
};

export const updateTemplateVariables = (
  id: string,
  variables: StoredVariable[]
): StoredTemplate | undefined => {
  const template = templateStore.get(id);
  if (!template) return undefined;

  template.variables = variables;
  return template;
};

export const deleteTemplate = (id: string): boolean => {
  return templateStore.delete(id);
};
