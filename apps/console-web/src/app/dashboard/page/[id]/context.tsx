"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PageData {
  id: string;
  title?: string;
  slug?: string;
  primaryColor?: string;
  secondaryColor?: string;
  content?: any;
  pageType?: string;
  [key: string]: any;
}

interface PageEditorContextType {
  pageData: PageData;
  isNewPage: boolean;
  isLoading: boolean;
  updatePageData: (data: Partial<PageData>) => void;
  savePage: () => Promise<void>;
}

const PageEditorContext = createContext<PageEditorContextType | undefined>(undefined);

interface PageEditorProviderProps {
  children: React.ReactNode;
  pageId: string;
  isNewPage: boolean;
}

export function PageEditorProvider({ children, pageId, isNewPage }: PageEditorProviderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pageData, setPageData] = useState<PageData>({
    id: isNewPage ? "" : pageId,
  });

  // Fetch page data if editing an existing page
  useEffect(() => {
    async function fetchPageData() {
      if (isNewPage) {
        // For new pages, we don't need to fetch data
        setIsLoading(false);
        return;
      }

      try {
        // In a real implementation, you would fetch the page data from your API
        // For now, we'll simulate a fetch delay and return mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data - in production this would come from your API
        setPageData({
          id: pageId,
          title: `Example Page ${pageId}`,
          slug: `example-page-${pageId}`,
          pageType: "flash-sale", // Example page type
          primaryColor: "#3498db",
          secondaryColor: "#e74c3c",
          // Add other properties as needed
        });
      } catch (error) {
        console.error("Error fetching page data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPageData();
  }, [pageId, isNewPage]);

  // Update the page data
  const updatePageData = (data: Partial<PageData>) => {
    setPageData(prevData => ({
      ...prevData,
      ...data
    }));
  };

  // Save the page (create new or update existing)
  const savePage = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you would send the data to your API
      // For now, we'll simulate a save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isNewPage) {
        // Generate a random ID for the new page
        const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
        
        // In a real implementation, you would create a new page in your database
        console.log("Creating new page with data:", pageData);
        
        // Redirect to the edit page for the new page
        router.push(`/dashboard/page/${newId}/editor`);
      } else {
        // In a real implementation, you would update the page in your database
        console.log("Updating page with data:", pageData);
      }
    } catch (error) {
      console.error("Error saving page:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageEditorContext.Provider 
      value={{ 
        pageData, 
        isNewPage, 
        isLoading, 
        updatePageData, 
        savePage 
      }}
    >
      {children}
    </PageEditorContext.Provider>
  );
}

export function usePageEditor() {
  const context = useContext(PageEditorContext);
  if (context === undefined) {
    throw new Error("usePageEditor must be used within a PageEditorProvider");
  }
  return context;
}