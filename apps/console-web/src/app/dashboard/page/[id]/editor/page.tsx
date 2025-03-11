import { Metadata } from "next";
import { PageBuilderSteps } from "./components/page-builder-steps";
import { notFound } from "next/navigation";
import { PageEditorProvider } from "../context";

export const metadata: Metadata = {
  title: "Page Editor",
  description: "Create and edit custom pages for your website.",
};

interface PageEditorProps {
  params: {
    id: string;
  };
}

export default function PageEditor({ params }: PageEditorProps) {
  // Check if this is a new page (id is "new")
  const isNewPage = params.id === "new";
  
  // In a real implementation, you would fetch page data here
  // For now, we'll just check if id is valid
  if (!isNewPage && !isValidPageId(params.id)) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageEditorProvider pageId={params.id} isNewPage={isNewPage}>
        <PageBuilderSteps />
      </PageEditorProvider>
    </div>
  );
}

// Helper function to validate page IDs
function isValidPageId(id: string): boolean {
  // For now, any string that looks like an ID is valid
  // In a real implementation, you would check if the page exists
  return /^[a-zA-Z0-9_-]+$/.test(id);
}