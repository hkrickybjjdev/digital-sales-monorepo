"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// In a real app, this would just be an empty page or a creator login page
// For demo purposes, we'll redirect to a sample sales page
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to a demo sales page - in a real app this wouldn't exist
    router.push("/s/sales-page-1");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to demo sales page...</p>
    </div>
  );
}
