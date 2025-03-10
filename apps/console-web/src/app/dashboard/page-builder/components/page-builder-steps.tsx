"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTypeSelection } from "./page-type-selection";

export function PageBuilderSteps() {
  const [currentStep, setCurrentStep] = useState("type-selection");

  const steps = [
    { id: "type-selection", label: "Page Type" },
    { id: "content", label: "Content" },
    { id: "design", label: "Design" },
    { id: "settings", label: "Settings" },
    { id: "preview", label: "Preview & Publish" },
  ];

  return (
    <Tabs
      defaultValue="type-selection"
      value={currentStep}
      onValueChange={setCurrentStep}
      className="flex gap-8"
      orientation="vertical"
    >
      <TabsList className="flex flex-col h-auto w-48 bg-muted/60">
        {steps.map((step, index) => (
          <TabsTrigger
            key={step.id}
            value={step.id}
            className="justify-start text-left w-full py-3 px-4"
            disabled={step.id !== "type-selection"} // Only enable the first step for now
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
      <div className="flex-1">
        <TabsContent value="type-selection" className="m-0">
          <PageTypeSelection />
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
        <TabsContent value="settings" className="m-0">
          <div className="p-6 border rounded-lg">
            <h2 className="text-lg font-semibold">Settings</h2>
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