"use client";

import { CartItem as CartItemType } from "@/types";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, X } from "lucide-react";

interface CartItemProps {
  item: CartItemType;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
}

export default function CartItem({
  item,
  updateQuantity,
  removeFromCart,
}: CartItemProps) {
  const handleIncrement = () => {
    updateQuantity(item.productId, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.productId, item.quantity - 1);
    } else {
      removeFromCart(item.productId);
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b">
      <div className="flex-1">
        <h3 className="font-medium">{item.name}</h3>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(item.price)} × {item.quantity}
        </p>
      </div>
      
      <div className="flex items-center gap-2 mr-4">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleDecrement}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <span className="w-8 text-center">{item.quantity}</span>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleIncrement}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <p className="font-medium">
          {formatCurrency(item.price * item.quantity)}
        </p>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => removeFromCart(item.productId)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 