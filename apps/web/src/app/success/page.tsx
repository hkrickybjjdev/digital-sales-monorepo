"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [countdown, setCountdown] = useState(24 * 60 * 60); // 24 hours in seconds
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        <CheckCircle2 className="h-24 w-24 text-green-500" />
        <h1 className="text-3xl font-bold">Thank You for Your Purchase!</h1>
        <p className="text-muted-foreground max-w-md">
          Your order has been successfully processed. You will receive an email
          with your download links shortly.
        </p>
      </div>
      
      {orderId && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-sm">Order ID: {orderId}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Your download links will expire in:
        </p>
        <p className="text-xl font-mono">{formatTime(countdown)}</p>
      </div>
      
      <div className="space-y-4">
        <div className="p-6 border rounded-lg max-w-md">
          <h2 className="text-lg font-semibold mb-4">Download Links</h2>
          <div className="space-y-2">
            <div className="p-2 bg-muted rounded flex justify-between items-center">
              <span className="text-sm truncate">Digital Marketing Guide.pdf</span>
              <Button size="sm" variant="outline">
                Download
              </Button>
            </div>
          </div>
        </div>
        
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    </div>
  );
} 