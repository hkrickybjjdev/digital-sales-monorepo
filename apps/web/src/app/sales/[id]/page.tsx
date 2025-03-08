"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Product, SalesPage } from "@/types";
import { isAvailableForSale, isExpired } from "@/lib/utils";
import CountdownTimer from "@/components/CountdownTimer";
import ProductGrid from "@/components/ProductGrid";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Mock data - in a real app, this would come from an API
const getMockSalesPage = (id: string): SalesPage => {
  const now = new Date();
  const launchTime = new Date(now);
  launchTime.setHours(launchTime.getHours() - 1); // 1 hour ago
  
  const expiresAt = new Date(now);
  expiresAt.setHours(expiresAt.getHours() + 23); // 23 hours from now
  
  // For demo purposes, create a sales page with 1 or multiple products
  const isSingleProduct = id.includes("single");
  
  const baseProduct: Product = {
    id: "product-1",
    name: "Digital Marketing Guide",
    description: "A comprehensive guide to digital marketing strategies for small businesses.",
    price: 19.99,
    imageUrl: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5",
    createdAt: new Date(),
    launchTime,
    expiresAt,
    isAvailable: true,
    sellerId: "seller-1",
  };
  
  const products: Product[] = isSingleProduct 
    ? [baseProduct] 
    : [
        baseProduct,
        {
          ...baseProduct,
          id: "product-2",
          name: "Social Media Templates",
          description: "20 professional social media templates for Instagram and Facebook.",
          price: 14.99,
          imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7",
        },
        {
          ...baseProduct,
          id: "product-3",
          name: "SEO Checklist",
          description: "Complete SEO checklist to improve your website's search engine ranking.",
          price: 9.99,
          imageUrl: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1",
        },
        {
          ...baseProduct,
          id: "product-4",
          name: "Email Marketing Course",
          description: "Learn how to create effective email marketing campaigns.",
          price: 29.99,
          imageUrl: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2",
        },
      ];
  
  return {
    id,
    title: isSingleProduct ? "Digital Marketing Guide" : "Digital Marketing Bundle",
    description: isSingleProduct 
      ? "A comprehensive guide to digital marketing strategies for small businesses."
      : "Complete set of digital marketing resources for small businesses and freelancers.",
    sellerId: "seller-1",
    products,
    createdAt: new Date(),
    launchTime,
    expiresAt,
    isActive: true,
  };
};

export default function SalesPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [salesPage, setSalesPage] = useState<SalesPage | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, this would be an API call
    if (params.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      const mockSalesPage = getMockSalesPage(id);
      setSalesPage(mockSalesPage);
      setLoading(false);
    }
  }, [params.id]);
  
  const handleExpire = () => {
    router.push("/expired");
  };
  
  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!salesPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold">Sales Page Not Found</h1>
        <p>The sales page you're looking for doesn't exist or has been removed.</p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }
  
  // Check if the sales page is expired
  if (isExpired(salesPage.expiresAt)) {
    router.push("/expired");
    return null;
  }
  
  // Check if the sales page is not yet available
  if (!isAvailableForSale(salesPage.launchTime, salesPage.expiresAt)) {
    router.push(`/not-available?id=${salesPage.id}`);
    return null;
  }
  
  const isSingleProduct = salesPage.products.length === 1;
  const singleProduct = isSingleProduct ? salesPage.products[0] : null;
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{salesPage.title}</h1>
        {salesPage.description && (
          <p className="text-muted-foreground">{salesPage.description}</p>
        )}
        
        <CountdownTimer 
          targetDate={salesPage.expiresAt} 
          onExpire={handleExpire}
          type="expiration"
        />
      </div>
      
      {isSingleProduct && singleProduct ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {singleProduct.imageUrl && (
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <img
                src={singleProduct.imageUrl}
                alt={singleProduct.name}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">{singleProduct.name}</h2>
              <p className="mt-2">{singleProduct.description}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">${singleProduct.price.toFixed(2)}</p>
              <Button 
                size="lg"
                onClick={() => handleAddToCart(singleProduct)}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <ProductGrid 
          products={salesPage.products} 
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
} 