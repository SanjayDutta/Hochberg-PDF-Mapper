import { z } from "zod";

const ConstraintsSchema = z.object({
  minLength: z.number().nullable().optional(),
  maxLength: z.number().nullable().optional(),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  minDate: z.string().nullable().optional(),
  maxDate: z.string().nullable().optional(),
  allowDecimal: z.boolean().optional(),
  required: z.boolean().optional(),
});

const FieldConfigSchema = z.object({
  options: z.array(z.string()).optional(),
});

const FieldSchema = z.object({
  key: z.string(),
  type: z.enum(["text", "number", "dropdown", "checkbox", "date", "radio"]),
  page: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  label: z.string(),
  config: FieldConfigSchema.optional(),
  constraints: ConstraintsSchema.optional(),
});

const MetadataSchema = z.object({
  coordinateSystem: z.object({
    origin: z.string().optional(),
    units: z.string().optional(),
    pageIndex: z.string().optional(),
  }).optional(),
}).optional();

const DocumentPayloadSchema = z.object({
  documentName: z.string(),
  metadata: MetadataSchema,
  variables: z.array(FieldSchema),
});

export const FieldAttributesSchema = z.union([
  DocumentPayloadSchema,
  z.array(DocumentPayloadSchema).min(1),
]);

export type FieldAttributes = z.infer<typeof FieldAttributesSchema>;
export type DocumentPayload = z.infer<typeof DocumentPayloadSchema>;
export type FieldData = z.infer<typeof FieldSchema>;
