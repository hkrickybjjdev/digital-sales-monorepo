import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Limited-Time Digital Products
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Discover exclusive digital products from independent creators. 
                Available for a limited time only.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/sales">
                <Button size="lg">Browse Products</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Our platform makes selling digital products simple and secure.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-background">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold">Create</h3>
                <p className="text-muted-foreground text-center">
                  Upload your digital products and set your price.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-background">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold">Share</h3>
                <p className="text-muted-foreground text-center">
                  Share your unique sales page with your audience.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-background">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold">Sell</h3>
                <p className="text-muted-foreground text-center">
                  Get paid instantly when customers purchase your products.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Start Selling?
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Create your first sales page in minutes.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/create">
                <Button size="lg">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
