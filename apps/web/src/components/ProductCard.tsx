"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, isAvailableForSale } from "@/lib/utils";
import { Product } from "@/types";
import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  showBuyButton?: boolean;
  onAddToCart?: () => void;
}

export default function ProductCard({ product, showBuyButton = true, onAddToCart }: ProductCardProps) {
  const isAvailable = isAvailableForSale(product.launchTime, product.expiresAt);
  
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {product.imageUrl && (
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {product.description}
        </p>
        <p className="font-bold text-lg">{formatCurrency(product.price)}</p>
      </CardContent>
      <CardFooter>
        {isAvailable ? (
          showBuyButton ? (
            <div className="flex gap-2 w-full">
              <Button 
                className="flex-1"
                onClick={onAddToCart}
              >
                Add to Cart
              </Button>
              <Link
                href={`/products/${product.id}`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  Details
                </Button>
              </Link>
            </div>
          ) : (
            <Link
              href={`/products/${product.id}`}
              className="w-full"
            >
              <Button className="w-full">
                View Details
              </Button>
            </Link>
          )
        ) : (
          <Button disabled className="w-full">
            Not Available
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 