"use client";

import { useCart } from "@/context/CartContext";
import CartItem from "@/components/CartItem";
import CartSummary from "@/components/CartSummary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const isEmpty = cart.items.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-8 w-8" />
          Your Cart
        </h1>
        {!isEmpty && (
          <Button 
            variant="outline" 
            onClick={clearCart}
          >
            Clear Cart
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-muted-foreground">Your cart is empty</p>
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
              />
            ))}
          </div>
          <div>
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
} 