import { getAllTemplates } from "@/lib/templateStore";
import { TemplateCards } from "@/components/TemplateCards";
import { UploadPdf } from "@/components/UploadPdf";

export default function Home() {
  const templates = getAllTemplates().map((t) => ({
    id: t.id,
    documentName: t.documentName,
    variableCount: t.variables.length,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <TemplateCards templates={templates} />
      <div className="flex flex-1 items-center justify-center">
        <UploadPdf />
      </div>
    </div>
  );
}
