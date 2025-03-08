"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function CartSummary() {
  const { cart } = useCart();
  const isEmpty = cart.items.length === 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isEmpty ? (
            <p className="text-center text-muted-foreground py-4">
              Your cart is empty
            </p>
          ) : (
            <>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{formatCurrency(cart.total)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {!isEmpty && (
          <Link href="/checkout" className="w-full">
            <Button className="w-full" size="lg">
              Proceed to Checkout
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
} 