"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock } from "lucide-react";

export default function ExpiredPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        <Clock className="h-24 w-24 text-muted-foreground" />
        <h1 className="text-3xl font-bold">This Content Has Expired</h1>
        <p className="text-muted-foreground max-w-md">
          The product or sales page you're trying to access is no longer available.
          Our products are available for a limited time only.
        </p>
      </div>
      
      <div className="space-y-4">
        <Link href="/">
          <Button>Browse Other Products</Button>
        </Link>
      </div>
    </div>
  );
} 