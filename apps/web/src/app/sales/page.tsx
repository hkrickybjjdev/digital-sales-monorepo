"use client";

import { useEffect, useState } from "react";
import { SalesPage } from "@/types";
import { isAvailableForSale } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data - in a real app, this would come from an API
const getMockSalesPages = (): SalesPage[] => {
  const now = new Date();
  
  // Create a mix of available, upcoming, and expired sales pages
  return [
    // Available sales pages
    {
      id: "sales-page-1",
      title: "Digital Marketing Bundle",
      description: "Complete set of digital marketing resources for small businesses.",
      sellerId: "seller-1",
      products: [],
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      launchTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      expiresAt: new Date(now.getTime() + 23 * 60 * 60 * 1000), // 23 hours from now
      isActive: true,
    },
    {
      id: "sales-page-2-single",
      title: "Social Media Strategy Guide",
      description: "Learn how to create an effective social media strategy for your business.",
      sellerId: "seller-2",
      products: [],
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      launchTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      expiresAt: new Date(now.getTime() + 22 * 60 * 60 * 1000), // 22 hours from now
      isActive: true,
    },
    // Upcoming sales page
    {
      id: "sales-page-3",
      title: "Content Creation Masterclass",
      description: "Learn how to create engaging content for your audience.",
      sellerId: "seller-3",
      products: [],
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      launchTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      expiresAt: new Date(now.getTime() + 26 * 60 * 60 * 1000), // 26 hours from now
      isActive: true,
    },
    // Expired sales page
    {
      id: "sales-page-4",
      title: "Email Marketing Templates",
      description: "Ready-to-use email marketing templates for your campaigns.",
      sellerId: "seller-4",
      products: [],
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      launchTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      expiresAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      isActive: false,
    },
  ];
};

export default function SalesListingPage() {
  const [salesPages, setSalesPages] = useState<SalesPage[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, this would be an API call
    const mockSalesPages = getMockSalesPages();
    setSalesPages(mockSalesPages);
    setLoading(false);
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Loading...</p>
      </div>
    );
  }
  
  // Filter sales pages by status
  const availableSalesPages = salesPages.filter(page => 
    isAvailableForSale(page.launchTime, page.expiresAt)
  );
  
  const upcomingSalesPages = salesPages.filter(page => 
    new Date() < page.launchTime
  );
  
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-6">Available Sales</h1>
        
        {availableSalesPages.length === 0 ? (
          <p className="text-muted-foreground">No sales currently available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableSalesPages.map((page) => (
              <Card key={page.id} className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{page.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {page.description}
                  </p>
                  <div className="text-sm">
                    <p className="text-green-600 font-medium">Available now</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/sales/${page.id}`} className="w-full">
                    <Button className="w-full">View Products</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {upcomingSalesPages.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Coming Soon</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingSalesPages.map((page) => (
              <Card key={page.id} className="flex flex-col h-full">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{page.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {page.description}
                  </p>
                  <div className="text-sm">
                    <p className="text-amber-600 font-medium">Launching soon</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/not-available?id=${page.id}`} className="w-full">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 