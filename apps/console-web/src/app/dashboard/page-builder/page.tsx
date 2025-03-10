import { Metadata } from "next";
import { PageBuilderSteps } from "@/app/dashboard/page-builder/components/page-builder-steps";

export const metadata: Metadata = {
  title: "Page Builder",
  description: "Create custom pages for your website.",
};

export default function PageBuilderPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Page Builder</h1>
        <p className="text-sm text-muted-foreground">
          Create custom pages for your website with our drag-and-drop page builder.
        </p>
      </div>
      <PageBuilderSteps />
    </div>
  );
}