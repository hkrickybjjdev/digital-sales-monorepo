"use client";

import { useEffect, useState } from "react";
import { getTimeRemaining } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface CountdownTimerProps {
  targetDate: Date;
  onExpire?: () => void;
  type: "launch" | "expiration";
}

export default function CountdownTimer({
  targetDate,
  onExpire,
  type,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(targetDate));
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(targetDate);
      setTimeRemaining(remaining);
      
      if (remaining.total <= 0) {
        clearInterval(timer);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (!isClient) {
    // Server-side rendering or hydration
    return null;
  }

  if (timeRemaining.total <= 0) {
    return (
      <Card className="w-full bg-primary/10">
        <CardContent className="p-4 text-center">
          <p className="text-lg font-semibold">
            {type === "launch" ? "Available now!" : "This product has expired"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-primary/10">
      <CardContent className="p-4 text-center">
        <p className="text-sm mb-2">
          {type === "launch" ? "Available in" : "Expires in"}
        </p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{timeRemaining.days}</span>
            <span className="text-xs">Days</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{timeRemaining.hours}</span>
            <span className="text-xs">Hours</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{timeRemaining.minutes}</span>
            <span className="text-xs">Minutes</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{timeRemaining.seconds}</span>
            <span className="text-xs">Seconds</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 