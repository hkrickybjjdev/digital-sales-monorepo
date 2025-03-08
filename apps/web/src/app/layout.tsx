import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Digital Product Sales Platform",
  description: "A temporary sales platform for independent creators, freelancers, and small businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <header className="border-b">
              <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                <a href="/" className="text-xl font-bold">DigitalSales</a>
                <nav className="flex items-center gap-4">
                  <a href="/cart" className="hover:underline">Cart</a>
                </nav>
              </div>
            </header>
            <main className="flex-1 container mx-auto py-8 px-4">
              {children}
            </main>
            <footer className="border-t py-6">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} DigitalSales. All rights reserved.
              </div>
            </footer>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
