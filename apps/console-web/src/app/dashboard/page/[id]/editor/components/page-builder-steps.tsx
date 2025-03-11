"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTypeSelection } from "./page-type-selection";
import { GeneralSettings } from "./general-settings";
import { PagePreview } from "./page-preview";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu, X, Eye, EyeOff, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePageEditor } from "../../context";

export function PageBuilderSteps() {
  const { pageData, updatePageData, savePage, isNewPage, isLoading } = usePageEditor();
  
  const [currentStep, setCurrentStep] = useState("type-selection");
  const [isMobile, setIsMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Set initial step based on whether we have a page type for editing or are creating a new page
  useEffect(() => {
    if (!isNewPage && pageData.pageType) {
      setCurrentStep("general-settings");
    }
  }, [isNewPage, pageData.pageType]);

  const steps = [
    { id: "type-selection", label: "Page Type" },
    { id: "general-settings", label: "General Settings" },
    { id: "content", label: "Content" },
    { id: "design", label: "Design" },
    { id: "preview", label: "Preview & Publish" },
  ];

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNextStep = (pageType?: string) => {
    if (pageType) {
      updatePageData({ pageType });
    }
    
    // Find the current step index
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex !== -1 && currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  // Create a separate handler for mobile page type selection
  const handleMobilePageTypeSelection = (pageType: string) => {
    // Just update the selected page type, don't navigate to next step
    updatePageData({ pageType });
  };

  // Handle page data changes
  const handlePageDataChange = (data: any) => {
    updatePageData(data);
  };

  const currentStepLabel = steps.find(step => step.id === currentStep)?.label || "";
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  // Render for mobile
  if (isMobile) {
    return (
      <div className="flex flex-col w-full">
        {/* Mobile Step Progress Bar */}
        <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-background p-2 border-b">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="mr-2">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open steps menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                <SheetTitle>Page Builder Steps</SheetTitle>
                <div className="py-4">
                  <h3 className="text-lg font-medium mb-4">Page Builder Steps</h3>
                  <div className="flex flex-col space-y-1">
                    {steps.map((step, index) => (
                      <button
                        key={step.id}
                        className={`flex items-center p-2 rounded-md ${
                          currentStep === step.id 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        } ${
                          (step.id !== "type-selection" && !pageData.pageType) || 
                          (index > 0 && index > steps.findIndex(s => s.id === currentStep))
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={
                          (step.id !== "type-selection" && !pageData.pageType) || 
                          (index > 0 && index > steps.findIndex(s => s.id === currentStep))
                        }
                        onClick={() => setCurrentStep(step.id)}
                      >
                        <div className="flex items-center justify-center rounded-full w-6 h-6 bg-muted-foreground/20 text-xs font-medium mr-2">
                          {index + 1}
                        </div>
                        <span>{step.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <h3 className="font-medium">Step {currentIndex + 1}: {currentStepLabel}</h3>
              <div className="w-full bg-muted h-1 mt-1 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300" 
                  style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 pb-20"> {/* Add padding at bottom for fixed navigation */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="mt-4">Loading...</span>
            </div>
          ) : (
            <>
              {currentStep === "type-selection" && <PageTypeSelection onNext={handleMobilePageTypeSelection} />}
              {currentStep === "general-settings" && <GeneralSettings pageType={pageData.pageType || null} onNext={handleNextStep} onDataChange={handlePageDataChange} />}
              {currentStep === "content" && (
                <div className="p-6 border rounded-lg">
                  <h2 className="text-lg font-semibold">Content</h2>
                  <p className="text-muted-foreground">This step will be implemented next.</p>
                </div>
              )}
              {currentStep === "design" && (
                <div className="p-6 border rounded-lg">
                  <h2 className="text-lg font-semibold">Design</h2>
                  <p className="text-muted-foreground">This step will be implemented next.</p>
                </div>
              )}
              {currentStep === "preview" && (
                <div className="p-6 border rounded-lg">
                  <h2 className="text-lg font-semibold">Preview & Publish</h2>
                  <p className="text-muted-foreground">This step will be implemented next.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Preview Sheet for Mobile */}
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

        {/* Save Button for Mobile */}
        <Button
          variant="default"
          size="sm"
          className="fixed bottom-20 left-4 z-30 rounded-full h-10 w-10 p-0 shadow-md"
          onClick={savePage}
          disabled={isLoading || !pageData.pageType}
        >
          <Save className="h-5 w-5" />
          <span className="sr-only">Save Page</span>
        </Button>

        {/* Fixed Navigation Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-between z-20">
          <Button
            variant="outline"
            onClick={() => {
              // Go back to previous step
              const prevIndex = currentIndex - 1;
              if (prevIndex >= 0) {
                setCurrentStep(steps[prevIndex].id);
              }
            }}
            disabled={currentIndex === 0}
          >
            Back
          </Button>
          <Button
            onClick={() => {
              // Move to next step
              const nextIndex = currentIndex + 1;
              if (nextIndex < steps.length) {
                if (currentStep === "type-selection" && pageData.pageType) {
                  handleNextStep();
                } else if (currentStep !== "type-selection") {
                  handleNextStep();
                }
              }
            }}
            disabled={(currentStep === "type-selection" && !pageData.pageType) || currentIndex === steps.length - 1}
          >
            {currentIndex === steps.length - 1 ? "Publish" : "Next"}
          </Button>
        </div>
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
          {currentStep === "type-selection" ? (
            <PageTypeSelection onNext={handleNextStep} />
          ) : (
            <div className="flex gap-6 h-full">
              {/* Left Panel - Steps Navigation and Content */}
              <div className={`flex flex-col ${showPreview ? 'w-1/2' : 'w-full'}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => {
                        // Go back to previous step
                        const prevIndex = currentIndex - 1;
                        if (prevIndex >= 0) {
                          setCurrentStep(steps[prevIndex].id);
                        }
                      }}
                      disabled={currentIndex === 0}
                    >
                      <ChevronDown className="h-4 w-4 rotate-90 mr-1" />
                      Back
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <h3 className="font-medium">Step {currentIndex + 1}: {currentStepLabel}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline"
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
                  {currentStep === "general-settings" && (
                    <GeneralSettings 
                      pageType={pageData.pageType || null} 
                      onNext={handleNextStep} 
                      onDataChange={handlePageDataChange}
                    />
                  )}
                  {currentStep === "content" && (
                    <div className="p-6 border rounded-lg">
                      <h2 className="text-lg font-semibold">Content</h2>
                      <p className="text-muted-foreground">This step will be implemented next.</p>
                    </div>
                  )}
                  {currentStep === "design" && (
                    <div className="p-6 border rounded-lg">
                      <h2 className="text-lg font-semibold">Design</h2>
                      <p className="text-muted-foreground">This step will be implemented next.</p>
                    </div>
                  )}
                  {currentStep === "preview" && (
                    <div className="p-6 border rounded-lg">
                      <h2 className="text-lg font-semibold">Preview & Publish</h2>
                      <p className="text-muted-foreground">This step will be implemented next.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Panel - Preview */}
              {showPreview && (
                <div className="w-1/2 flex flex-col">
                  <div className="h-full">
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