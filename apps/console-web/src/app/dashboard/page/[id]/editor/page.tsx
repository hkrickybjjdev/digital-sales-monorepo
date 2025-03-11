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

export default async function PageEditor({ params }: PageEditorProps) {
  // In Next.js 15, params is a Promise that needs to be awaited
  const { id } = await params;
  const isNewPage = id === "new";
  
  // In a real implementation, you would fetch page data here
  // For now, we'll just check if id is valid
  if (!isNewPage && !isValidPageId(id)) {
    return notFound();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <PageEditorProvider pageId={id} isNewPage={isNewPage}>
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