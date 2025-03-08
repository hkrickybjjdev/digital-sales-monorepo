"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/types";
import { formatCurrency, isAvailableForSale, isExpired } from "@/lib/utils";
import CountdownTimer from "@/components/CountdownTimer";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import Image from "next/image";

// Mock data - in a real app, this would come from an API
const getMockProduct = (id: string): Product => {
  const now = new Date();
  const launchTime = new Date(now);
  launchTime.setHours(launchTime.getHours() - 1); // 1 hour ago
  
  const expiresAt = new Date(now);
  expiresAt.setHours(expiresAt.getHours() + 23); // 23 hours from now
  
  return {
    id,
    name: "Digital Marketing Guide",
    description: `A comprehensive guide to digital marketing strategies for small businesses. 
    
    This guide includes:
    - Social media marketing strategies
    - Email marketing templates
    - SEO best practices
    - Content marketing ideas
    - Analytics and tracking tips
    
    Perfect for entrepreneurs and small business owners looking to grow their online presence.`,
    price: 19.99,
    imageUrl: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5",
    createdAt: new Date(),
    launchTime,
    expiresAt,
    isAvailable: true,
    sellerId: "seller-1",
  };
};

export default function ProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get the sales page ID from the query params
  const salesPageId = searchParams.get("salesPageId");
  
  useEffect(() => {
    // In a real app, this would be an API call
    if (params.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id;
      const mockProduct = getMockProduct(id);
      setProduct(mockProduct);
      setLoading(false);
    }
  }, [params.id]);
  
  const handleExpire = () => {
    router.push("/expired");
  };
  
  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      router.push("/cart");
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        {salesPageId && (
          <Link href={`/s/${salesPageId}`}>
            <Button>Return to Sales Page</Button>
          </Link>
        )}
      </div>
    );
  }
  
  // Check if the product is expired
  if (isExpired(product.expiresAt)) {
    router.push("/expired");
    return null;
  }
  
  // Check if the product is not yet available
  if (!isAvailableForSale(product.launchTime, product.expiresAt)) {
    router.push(`/not-available?id=${product.id}`);
    return null;
  }
  
  return (
    <div className="space-y-8">
      {salesPageId && (
        <Link href={`/s/${salesPageId}`} className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Products
        </Link>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {product.imageUrl && (
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(product.price)}</p>
          </div>
          
          <div className="prose max-w-none">
            <p className="whitespace-pre-line">{product.description}</p>
          </div>
          
          <CountdownTimer 
            targetDate={product.expiresAt} 
            onExpire={handleExpire}
            type="expiration"
          />
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            
            <Link href="/checkout" className="flex-1">
              <Button 
                variant="secondary" 
                size="lg"
                className="w-full"
              >
                Buy Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 