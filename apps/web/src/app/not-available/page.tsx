"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import CountdownTimer from "@/components/CountdownTimer";
import Link from "next/link";
import { Clock, AlertCircle } from "lucide-react";

// Mock data - in a real app, this would come from an API
const getMockLaunchTime = (): Date => {
  const launchTime = new Date();
  launchTime.setHours(launchTime.getHours() + 2); // 2 hours from now
  return launchTime;
};

export default function NotAvailablePage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [launchTime, setLaunchTime] = useState<Date | null>(null);
  
  useEffect(() => {
    // In a real app, this would be an API call to get the actual launch time
    setLaunchTime(getMockLaunchTime());
  }, []);
  
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
        <h1 className="text-3xl font-bold">Coming Soon</h1>
        <p className="text-muted-foreground max-w-md">
          This product is not yet available for purchase.
          Please check back at the scheduled launch time.
        </p>
      </div>
      
      <div className="max-w-md w-full">
        <CountdownTimer 
          targetDate={launchTime} 
          type="launch"
        />
      </div>
      
      <div className="space-y-4">
        <Link href="/">
          <Button>Browse Other Products</Button>
        </Link>
      </div>
    </div>
  );
} 