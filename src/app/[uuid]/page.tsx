import { getAllTemplates, getTemplateById } from "@/lib/templateStore";
import { PDFContainerWrapper } from "../../components/PDFContainerWrapper";
import { TemplateNavBar } from "../../components/TemplateNavBar";

export default async function TemplatePage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  const template = getTemplateById(uuid);
  const templates = getAllTemplates().map((item) => ({
    id: item.id,
    documentName: item.documentName,
    variableCount: item.variables.length,
  }));

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-sm text-center">
          <h1 className="mb-4 text-2xl font-semibold text-black">Template Not Found</h1>
          <p className="mb-6 text-sm text-slate-900">
            The template with ID <code className="text-xs text-black">{uuid}</code> does not exist.
          </p>
          <a
            href="/"
            className="inline-block rounded border border-slate-300 px-4 py-2 text-sm text-black hover:bg-slate-50"
          >
            Back to Upload
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col">
      <TemplateNavBar templates={templates} />
      <div className="flex-1 min-h-0 p-6">
        <PDFContainerWrapper
          templateId={uuid}
          pdfBase64={template.pdfBase64}
          documentName={template.documentName}
          initialVariables={template.variables}
        />
      </div>
    </div>
  );
}
