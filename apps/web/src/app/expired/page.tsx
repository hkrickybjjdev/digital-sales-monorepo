"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock } from "lucide-react";

export default function ExpiredPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [pageTitle, setPageTitle] = useState("This Content Has Expired");
  
  useEffect(() => {
    // In a real app, we could fetch more details about the expired page
    if (id === "sales-page-4") {
      setPageTitle("Email Marketing Templates - Expired");
    }
  }, [id]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        <Clock className="h-24 w-24 text-muted-foreground" />
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <p className="text-muted-foreground max-w-md">
          The product or sales page you're trying to access is no longer available.
          Our products are available for a limited time only (24 hours from launch).
        </p>
      </div>
      
      <div className="p-6 border rounded-lg max-w-md bg-muted/10">
        <p className="text-sm text-muted-foreground">
          Sales and product pages automatically expire 24 hours after they become available.
          This helps create urgency and ensures content remains fresh and relevant.
        </p>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If you're interested in accessing this content, please contact the creator directly.
        </p>
      </div>
    </div>
  );
} 