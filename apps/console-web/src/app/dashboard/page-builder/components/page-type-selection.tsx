"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

type PageType = {
  id: string;
  title: string;
  description: string;
  useCases: string[];
  icon: JSX.Element;
};

const pageTypes: PageType[] = [
  {
    id: "flash-sale",
    title: "Flash Sale Page",
    description: "Create urgency with limited-time offers and discounts.",
    useCases: ["Product launches", "Holiday sales", "Inventory clearance"],
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-yellow-500"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
      </svg>
    ),
  },
  {
    id: "event-registration",
    title: "Event Registration Page",
    description: "Collect attendee information and drive event sign-ups.",
    useCases: ["Webinars", "Workshops", "Conferences"],
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-blue-500"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
        <line x1="16" x2="16" y1="2" y2="6"></line>
        <line x1="8" x2="8" y1="2" y2="6"></line>
        <line x1="3" x2="21" y1="10" y2="10"></line>
        <path d="m9 16 2 2 4-4"></path>
      </svg>
    ),
  },
  {
    id: "countdown-landing",
    title: "Countdown Landing Page",
    description: "Build anticipation for upcoming launches or events.",
    useCases: ["Product pre-orders", "Event announcements", "Coming soon pages"],
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-purple-500"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    ),
  },
  {
    id: "limited-time-offer",
    title: "Limited-Time Offer Page",
    description: "Promote special deals with clear expiration dates.",
    useCases: ["Seasonal promotions", "Bundle deals", "Membership discounts"],
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-500"
      >
        <path d="M10.1 2.182a1 1 0 0 1 1.819 0l1.726 3.497a1 1 0 0 0 .754.547l3.857.56a1 1 0 0 1 .555 1.705l-2.792 2.72a1 1 0 0 0-.288.885l.659 3.842a1 1 0 0 1-1.451 1.054L12 14.856l-3.448 1.812a1 1 0 0 1-1.452-1.054l.66-3.842a1 1 0 0 0-.288-.885l-2.792-2.72a1 1 0 0 1 .555-1.705l3.857-.56a1 1 0 0 0 .753-.547l1.726-3.497z"></path>
      </svg>
    ),
  },
];

export function PageTypeSelection() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Step 1: Select Page Type</h2>
        <p className="text-muted-foreground">
          Choose the type of page you want to create based on your campaign goals.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pageTypes.map((pageType) => (
          <Card 
            key={pageType.id}
            className={`cursor-pointer border-2 transition-all ${
              selectedType === pageType.id 
                ? "border-primary shadow-md" 
                : "hover:border-primary/50"
            }`}
            onClick={() => setSelectedType(pageType.id)}
          >
            <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">{pageType.title}</CardTitle>
                <CardDescription>{pageType.description}</CardDescription>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                {pageType.icon}
              </div>
              {selectedType === pageType.id && (
                <div className="absolute -right-2 -top-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recommended for:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {pageType.useCases.map((useCase, index) => (
                    <li key={index} className="flex items-center">
                      <span className="mr-2 h-1 w-1 rounded-full bg-muted-foreground"></span>
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant={selectedType === pageType.id ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedType(pageType.id);
                }}
              >
                {selectedType === pageType.id ? "Selected" : "Select"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="pt-6 flex justify-end">
        <Button 
          size="lg"
          disabled={!selectedType} 
          className="w-full sm:w-auto"
        >
          Continue to Content
        </Button>
      </div>
    </div>
  );
}