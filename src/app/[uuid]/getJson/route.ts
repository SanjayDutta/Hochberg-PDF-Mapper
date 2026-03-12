import { NextRequest, NextResponse } from "next/server";
import { getTemplateById } from "@/lib/templateStore";
import type { StoredVariable } from "@/lib/templateStore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    const template = getTemplateById(uuid);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const getConstraints = (field: StoredVariable) => {
      if (field.type === "text") {
        return {
          minLength: field.constraints?.minLength ?? null,
          maxLength: field.constraints?.maxLength ?? null,
          required: field.constraints?.required ?? false,
        };
      }

      if (field.type === "number") {
        return {
          minValue: field.constraints?.minValue ?? null,
          maxValue: field.constraints?.maxValue ?? null,
          allowDecimal: field.constraints?.allowDecimal ?? false,
          required: field.constraints?.required ?? false,
        };
      }

      if (field.type === "date") {
        return {
          minDate: field.constraints?.minDate ?? null,
          maxDate: field.constraints?.maxDate ?? null,
          required: field.constraints?.required ?? false,
        };
      }

      return {};
    };

    const getConfig = (field: StoredVariable) => {
      if (field.type === "dropdown") {
        return {
          options: field.config?.options ?? [],
        };
      }

      if (field.type === "checkbox") {
        return {
          options: field.config?.options ?? [],
        };
      }

      return undefined;
    };

    const payload = {
      documentName: template.documentName,
      metadata: {
        coordinateSystem: {
          origin: "top-left",
          units: "pixels",
          pageIndex: "1-based",
        },
      },
      variables: template.variables.map((field) => {
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

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error in getJson route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
