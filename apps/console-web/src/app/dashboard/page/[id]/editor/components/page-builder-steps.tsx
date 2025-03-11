"use client";

import { useState, useEffect } from "react";
import { PageTypeSelection } from "./page-type-selection";
import { GeneralSettings } from "./general-settings";
import { PagePreview } from "./page-preview";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronDown, Save, ArrowLeft, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePageEditor } from "../../context";

export function PageBuilderSteps() {
  const { pageData, updatePageData, savePage, isNewPage, isLoading } = usePageEditor();
  
  const [showPageTypeSelection, setShowPageTypeSelection] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Set initial view based on whether we have a page type for editing or are creating a new page
  useEffect(() => {
    if (!isNewPage && pageData.pageType) {
      setShowPageTypeSelection(false);
    }
  }, [isNewPage, pageData.pageType]);

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlePageTypeSelection = (pageType: string) => {
    updatePageData({ pageType });
    setShowPageTypeSelection(false);
  };

  // Handle page data changes
  const handlePageDataChange = (data: any) => {
    updatePageData(data);
  };

  // Render for mobile
  if (isMobile) {
    return (
      <div className="flex flex-col w-full">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-background p-2 border-b">
          <div className="flex items-center">
            {!showPageTypeSelection && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2"
                onClick={() => setShowPageTypeSelection(true)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to page type</span>
              </Button>
            )}
            <div className="flex flex-col">
              <h3 className="font-medium">
                {showPageTypeSelection ? "Select Page Type" : "Page Editor"}
              </h3>
            </div>
          </div>
          {!showPageTypeSelection && (
            <Button 
              variant="default"
              size="sm"
              className="h-8"
              onClick={savePage}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="mt-4">Loading...</span>
            </div>
          ) : (
            <>
              {showPageTypeSelection ? (
                <PageTypeSelection onNext={handlePageTypeSelection} />
              ) : (
                <div className="p-4">
                  <GeneralSettings 
                    pageType={pageData.pageType || null} 
                    onDataChange={handlePageDataChange}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Preview Sheet for Mobile */}
        {!showPageTypeSelection && (
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="fixed bottom-20 right-4 z-30 rounded-full h-10 w-10 p-0 shadow-md"
                disabled={!pageData.pageType}
              >
                <Eye className="h-5 w-5" />
                <span className="sr-only">Preview</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] sm:h-[90vh] p-0">
              <div className="p-4 border-b">
                <h3 className="font-medium">Page Preview</h3>
              </div>
              <div className="p-4 h-[calc(100%-60px)] overflow-auto">
                <PagePreview pageType={pageData.pageType || null} pageData={pageData} />
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Fixed Navigation Footer for Type Selection */}
        {showPageTypeSelection && pageData.pageType && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-end z-20">
            <Button
              onClick={() => setShowPageTypeSelection(false)}
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop view with two-panel layout
  return (
    <div className="flex flex-col h-full">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="mt-4">Loading page data...</span>
        </div>
      ) : (
        <>
          {/* Only show the type selection step by itself */}
          {showPageTypeSelection ? (
            <div className="flex flex-col">
              <PageTypeSelection onNext={handlePageTypeSelection} />
              {pageData.pageType && (
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => setShowPageTypeSelection(false)}
                  >
                    Continue to Editor
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-6 h-full">
              {/* Left Panel - Editor Content */}
              <div className={`flex flex-col ${showPreview ? 'w-1/2' : 'w-full'}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => setShowPageTypeSelection(true)}
                    >
                      <ChevronDown className="h-4 w-4 rotate-90 mr-1" />
                      Back to Page Type
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <h3 className="font-medium">Page Editor</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? "Hide Preview" : "Show Preview"}
                    </Button>
                    <Button 
                      variant="default"
                      size="sm"
                      className="h-8"
                      onClick={savePage}
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto pb-20">
                  <GeneralSettings 
                    pageType={pageData.pageType || null} 
                    onDataChange={handlePageDataChange}
                  />
                </div>
              </div>
              
              {/* Right Panel - Preview */}
              {showPreview && (
                <div className="w-1/2 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Preview</h3>
                  </div>
                  <div className="h-full border rounded-lg overflow-hidden">
                    <PagePreview pageType={pageData.pageType || null} pageData={pageData} />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}