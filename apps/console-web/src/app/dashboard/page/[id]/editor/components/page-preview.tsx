"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Tablet } from "lucide-react";

interface PagePreviewProps {
  pageType: string | null;
  pageData?: {
    title?: string;
    slug?: string;
    primaryColor?: string;
    secondaryColor?: string;
    // Add more properties as needed
  };
}

export function PagePreview({ pageType, pageData = {} }: PagePreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  
  // Get a placeholder title based on the page type
  const getPageTitle = () => {
    if (pageData.title) return pageData.title;
    
    switch (pageType) {
      case "flash-sale":
        return "Flash Sale";
      case "event-registration":
        return "Event Registration";
      case "countdown-landing":
        return "Countdown Landing";
      case "limited-time-offer":
        return "Limited-Time Offer";
      default:
        return "Your Page";
    }
  };

  // Get preview content based on page type
  const getPreviewContent = () => {
    switch (pageType) {
      case "flash-sale":
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
            <h1 className="text-2xl font-bold" style={{ color: pageData.primaryColor }}>
              {pageData.title || "Flash Sale!"}
            </h1>
            <p className="text-sm text-muted-foreground">Limited time offer - Don't miss out!</p>
            <div className="flex space-x-4 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 rounded-md p-2 w-12 h-12 flex items-center justify-center font-bold">
                  24
                </div>
                <span className="text-xs mt-1">Hours</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 rounded-md p-2 w-12 h-12 flex items-center justify-center font-bold">
                  00
                </div>
                <span className="text-xs mt-1">Minutes</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 rounded-md p-2 w-12 h-12 flex items-center justify-center font-bold">
                  00
                </div>
                <span className="text-xs mt-1">Seconds</span>
              </div>
            </div>
            <Button 
              className="mt-4 w-full" 
              style={{ 
                backgroundColor: pageData.primaryColor,
                color: "#ffffff"
              }}
            >
              Shop Now
            </Button>
          </div>
        );
      
      case "event-registration":
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-4">
            <h1 className="text-2xl font-bold text-center" style={{ color: pageData.primaryColor }}>
              {pageData.title || "Event Registration"}
            </h1>
            <p className="text-sm text-muted-foreground text-center">Join us for this exclusive event!</p>
            <div className="w-full space-y-2 mt-4">
              <div className="h-8 bg-muted/50 rounded w-full"></div>
              <div className="h-8 bg-muted/50 rounded w-full"></div>
              <div className="h-8 bg-muted/50 rounded w-full"></div>
              <div className="h-24 bg-muted/50 rounded w-full"></div>
            </div>
            <Button 
              className="mt-4 w-full" 
              style={{ 
                backgroundColor: pageData.primaryColor,
                color: "#ffffff"
              }}
            >
              Register Now
            </Button>
          </div>
        );
        
      case "countdown-landing":
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
            <h1 className="text-2xl font-bold" style={{ color: pageData.primaryColor }}>
              {pageData.title || "Coming Soon"}
            </h1>
            <p className="text-sm text-muted-foreground">Get ready for something amazing!</p>
            <div className="flex space-x-2 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 rounded-md p-2 w-10 h-10 flex items-center justify-center font-bold">
                  15
                </div>
                <span className="text-xs mt-1">Days</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 rounded-md p-2 w-10 h-10 flex items-center justify-center font-bold">
                  10
                </div>
                <span className="text-xs mt-1">Hours</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 rounded-md p-2 w-10 h-10 flex items-center justify-center font-bold">
                  24
                </div>
                <span className="text-xs mt-1">Minutes</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 rounded-md p-2 w-10 h-10 flex items-center justify-center font-bold">
                  33
                </div>
                <span className="text-xs mt-1">Seconds</span>
              </div>
            </div>
            <div className="w-full space-y-2 mt-4">
              <div className="h-8 bg-muted/50 rounded w-full"></div>
            </div>
            <Button 
              className="mt-4 w-full" 
              style={{ 
                backgroundColor: pageData.primaryColor,
                color: "#ffffff"
              }}
            >
              Notify Me
            </Button>
          </div>
        );
        
      case "limited-time-offer":
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
            <div className="bg-primary/10 rounded-full px-3 py-1 text-xs font-medium" style={{ color: pageData.primaryColor }}>
              Limited Time Only
            </div>
            <h1 className="text-2xl font-bold" style={{ color: pageData.primaryColor }}>
              {pageData.title || "Special Offer"}
            </h1>
            <p className="text-sm text-muted-foreground">Exclusive deal ends soon!</p>
            <div className="w-full h-32 bg-muted/50 rounded flex items-center justify-center">
              <span className="text-muted-foreground">Product Image</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xl font-bold" style={{ color: pageData.secondaryColor }}>$49.99</span>
              <span className="text-sm line-through text-muted-foreground">$99.99</span>
              <span className="bg-secondary/10 text-secondary text-xs rounded-full px-2 py-0.5">50% OFF</span>
            </div>
            <Button 
              className="mt-2 w-full" 
              style={{ 
                backgroundColor: pageData.primaryColor,
                color: "#ffffff"
              }}
            >
              Claim Offer
            </Button>
          </div>
        );
        
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-muted-foreground">Select a page type to see a preview</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end items-center mb-4">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="h-9">
          <TabsList className="h-8">
            <TabsTrigger value="desktop" className="h-7 w-7 p-0">
              <Monitor className="h-4 w-4" />
              <span className="sr-only">Desktop</span>
            </TabsTrigger>
            <TabsTrigger value="tablet" className="h-7 w-7 p-0">
              <Tablet className="h-4 w-4" />
              <span className="sr-only">Tablet</span>
            </TabsTrigger>
            <TabsTrigger value="mobile" className="h-7 w-7 p-0">
              <Smartphone className="h-4 w-4" />
              <span className="sr-only">Mobile</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Card className={`flex-1 overflow-hidden border-2 ${pageType ? 'border-muted' : 'border-dashed border-muted'}`}>
        <div className={`h-full overflow-auto bg-background ${
          viewMode === "desktop" ? "w-full" :
          viewMode === "tablet" ? "w-[768px] mx-auto" :
          "w-[375px] mx-auto"
        }`}>
          {getPreviewContent()}
        </div>
      </Card>
      
      <div className="mt-4 text-xs text-center text-muted-foreground">
        This is a preview. The actual page may look different.
      </div>
    </div>
  );
}