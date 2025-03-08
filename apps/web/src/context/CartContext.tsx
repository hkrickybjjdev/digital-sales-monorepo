"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Cart, CartItem, Product } from "@/types";
import { generateUUID } from "@/lib/utils";

// Initial empty cart
const initialCart: Cart = {
  items: [],
  total: 0,
};

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(initialCart);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Calculate total whenever cart items change
  const calculateTotal = (items: CartItem[]): number => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(
        (item) => item.productId === product.id
      );

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        updatedItems = [...prevCart.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        };
      } else {
        // Add new item
        const newItem: CartItem = {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        };
        updatedItems = [...prevCart.items, newItem];
      }

      return {
        items: updatedItems,
        total: calculateTotal(updatedItems),
      };
    });
  };

  // Remove product from cart
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const updatedItems = prevCart.items.filter(
        (item) => item.productId !== productId
      );
      return {
        items: updatedItems,
        total: calculateTotal(updatedItems),
      };
    });
  };

  // Update quantity of a product in cart
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) => {
      const updatedItems = prevCart.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      return {
        items: updatedItems,
        total: calculateTotal(updatedItems),
      };
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart(initialCart);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
} 