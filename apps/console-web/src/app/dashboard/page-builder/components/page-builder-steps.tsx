"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTypeSelection } from "./page-type-selection";
import { GeneralSettings } from "./general-settings";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu, X } from "lucide-react";

export function PageBuilderSteps() {
  const [currentStep, setCurrentStep] = useState("type-selection");
  const [selectedPageType, setSelectedPageType] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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
      setSelectedPageType(pageType);
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
    setSelectedPageType(pageType);
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
                          (step.id !== "type-selection" && !selectedPageType) || 
                          (index > 0 && index > steps.findIndex(s => s.id === currentStep))
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={
                          (step.id !== "type-selection" && !selectedPageType) || 
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
          {currentStep === "type-selection" && <PageTypeSelection onNext={handleMobilePageTypeSelection} />}
          {currentStep === "general-settings" && <GeneralSettings pageType={selectedPageType} onNext={handleNextStep} />}
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
                if (currentStep === "type-selection" && selectedPageType) {
                  handleNextStep();
                } else if (currentStep !== "type-selection") {
                  handleNextStep();
                }
              }
            }}
            disabled={(currentStep === "type-selection" && !selectedPageType) || currentIndex === steps.length - 1}
          >
            {currentIndex === steps.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    );
  }

  // Desktop view with vertical tabs
  return (
    <Tabs
      defaultValue="type-selection"
      value={currentStep}
      onValueChange={setCurrentStep}
      className="flex gap-8"
      orientation="vertical"
    >
      <div className="sticky top-4 self-start">
        <TabsList className="flex flex-col h-auto w-48 bg-muted/60">
          {steps.map((step, index) => (
            <TabsTrigger
              key={step.id}
              value={step.id}
              className="justify-start text-left w-full py-3 px-4"
              disabled={
                (step.id !== "type-selection" && !selectedPageType) || // Disable if no page type is selected
                (index > 0 && index > steps.findIndex(s => s.id === currentStep)) // Disable future steps
              }
            >
              <div className="flex items-center w-full">
                <div className="flex items-center justify-center rounded-full min-w-7 h-7 bg-muted-foreground/20 text-sm font-medium mr-3">
                  {index + 1}
                </div>
                <span className="text-left">{step.label}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="flex-1">
        <TabsContent value="type-selection" className="m-0">
          <PageTypeSelection onNext={handleNextStep} />
        </TabsContent>
        <TabsContent value="general-settings" className="m-0">
          <GeneralSettings pageType={selectedPageType} onNext={handleNextStep} />
        </TabsContent>
        <TabsContent value="content" className="m-0">
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold">Content</h2>
            <p className="text-muted-foreground">This step will be implemented next.</p>
          </div>
        </TabsContent>
        <TabsContent value="design" className="m-0">
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold">Design</h2>
            <p className="text-muted-foreground">This step will be implemented next.</p>
          </div>
        </TabsContent>
        <TabsContent value="preview" className="m-0">
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold">Preview & Publish</h2>
            <p className="text-muted-foreground">This step will be implemented next.</p>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}