"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import CountdownTimer from "@/components/CountdownTimer";
import Link from "next/link";
import { Clock, AlertCircle } from "lucide-react";

// Mock data - in a real app, this would come from an API
const getMockLaunchTime = (id: string | null = null): Date => {
  const now = new Date();
  const launchTime = new Date(now);
  
  // For sales-page-3, set a specific launch time
  if (id === "sales-page-3") {
    launchTime.setHours(launchTime.getHours() + 2); // 2 hours from now
  } else {
    // Default case
    launchTime.setHours(launchTime.getHours() + 1); // 1 hour from now
  }
  
  return launchTime;
};

export default function NotAvailablePage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [launchTime, setLaunchTime] = useState<Date | null>(null);
  const [pageTitle, setPageTitle] = useState<string>("Coming Soon");
  const [pageDescription, setPageDescription] = useState<string>(
    "This product is not yet available for purchase. Please check back at the scheduled launch time."
  );
  
  useEffect(() => {
    // In a real app, this would be an API call to get the actual launch time
    setLaunchTime(getMockLaunchTime(id));
    
    // Set specific details based on the ID
    if (id === "sales-page-3") {
      setPageTitle("Content Creation Masterclass - Coming Soon");
      setPageDescription("Our comprehensive masterclass on content creation will be available soon. Check back in a couple of hours!");
    }
  }, [id]);
  
  if (!launchTime) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        <AlertCircle className="h-24 w-24 text-amber-500" />
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <p className="text-muted-foreground max-w-md">
          {pageDescription}
        </p>
      </div>
      
      <div className="max-w-md w-full">
        <CountdownTimer 
          targetDate={launchTime} 
          type="launch"
        />
      </div>
      
      <div className="p-6 border rounded-lg max-w-md bg-muted/10">
        <p className="text-sm text-muted-foreground">
          This creator has scheduled this content to launch at a specific time.
          When the countdown ends, you'll be able to purchase the product.
          All products are available for exactly 24 hours from their launch time.
        </p>
      </div>
      
      {id && (
        <div className="text-sm text-muted-foreground">
          <p>Sales page ID: {id}</p>
          <p>Launch time: {launchTime.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
} 