"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import CartSummary from "@/components/CartSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateUUID } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  const isEmpty = cart.items.length === 0;
  
  // In a real app, this would call the Stripe API
  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isEmpty) {
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate order ID
    const orderId = generateUUID();
    
    // Clear cart after successful checkout
    clearCart();
    
    // Redirect to success page
    router.push(`/success?orderId=${orderId}`);
  };
  
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p>Add some products to your cart before checking out.</p>
        <Link href="/">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <Link href="/cart" className="flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Cart
      </Link>
      
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <CreditCard className="h-8 w-8" />
        Checkout
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleCheckout} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Contact Information</h2>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Payment Information</h2>
              <p className="text-sm text-muted-foreground">
                This is a demo application. No actual payment will be processed.
              </p>
              
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-center">
                  Stripe integration would be implemented here in a real application.
                </p>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? "Processing..." : "Complete Purchase"}
            </Button>
          </form>
        </div>
        
        <div>
          <CartSummary />
        </div>
      </div>
    </div>
  );
} 