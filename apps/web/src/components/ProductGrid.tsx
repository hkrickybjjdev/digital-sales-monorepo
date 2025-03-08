"use client";

import { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  salesPageId: string;
  onAddToCart?: (product: Product) => void;
}

export default function ProductGrid({ products, salesPageId, onAddToCart }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No products available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product}
          salesPageId={salesPageId}
          onAddToCart={() => onAddToCart && onAddToCart(product)}
        />
      ))}
    </div>
  );
} 