import { Metadata } from "next";
import { PageBuilderSteps } from "@/app/dashboard/page-builder/components/page-builder-steps";

export const metadata: Metadata = {
  title: "Page Builder",
  description: "Create custom pages for your website.",
};

export default function PageBuilderPage() {
  return (
    <div className="flex flex-col gap-6 p-6">      
      <PageBuilderSteps />
    </div>
  );
}