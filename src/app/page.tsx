import { getAllTemplates } from "@/lib/templateStore";
import { TemplateCards } from "@/components/TemplateCards";
import { UploadPdf } from "@/components/UploadPdf";
import { RootNavBar } from "@/components/RootNavBar";
import { FeatureCardsCarousel } from "@/components/FeatureCardsCarousel";
import { unstable_noStore as noStore } from "next/cache";

export default function Home() {
  noStore();

  const templates = getAllTemplates().map((t) => ({
    id: t.id,
    documentName: t.documentName,
    variableCount: t.variables.length,
  }));

  const featureCards = [
    {
      title: "Smart Field Mapping",
      description: "Add text, number, dropdown, checklist, date, and radio fields directly on PDF pages.",
      iconClass: "fa-solid fa-layer-group",
    },
    {
      title: "Precise Placement",
      description: "Drag, resize, and configure every field with coordinates and label visibility controls.",
      iconClass: "fa-solid fa-crosshairs",
    },
    {
      title: "Export + API",
      description: "Download field attributes as JSON or use the generated GET endpoint for integrations.",
      iconClass: "fa-solid fa-code",
    },
    {
      title: "Resume Anytime",
      description: "Reopen recent templates and continue editing across tabs.",
      iconClass: "fa-solid fa-clock-rotate-left",
    },
    {
      title: "Light / Dark Theme",
      description: "Switch themes instantly for comfortable editing in any environment.",
      iconClass: "fa-solid fa-circle-half-stroke",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <RootNavBar />
      <div className="mx-6 mt-4">
        <TemplateCards templates={templates} />
      </div>
      <div className="flex justify-center px-6 pt-3 pb-8">
        <UploadPdf />
      </div>
      <div className="mx-6 mt-8 pb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-900">Features</h2>
        <FeatureCardsCarousel cards={featureCards} />
      </div>
    </div>
  );
}
