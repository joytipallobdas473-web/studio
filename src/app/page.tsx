
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, ShieldCheck, ShoppingCart, ArrowRight, BarChart3 } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 font-headline font-bold text-2xl text-primary">
          <Package className="h-8 w-8 text-accent" />
          <span>Retails Stocks</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-primary hover:bg-primary/90">Sign Up</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary leading-tight">
              Manage Your Retail <span className="text-accent">Inventory</span> Like a Pro.
            </h1>
            <p className="text-xl text-muted-foreground font-body leading-relaxed max-w-lg">
              The unified platform for secure stock ordering, biometric authentication, and real-time inventory tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-accent text-accent-foreground font-bold hover:bg-accent/90 px-8 h-14 text-lg">
                  Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 h-14 text-lg">
                  Existing User? Log In
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Secure Biometric Login</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Real-time History</span>
              </div>
            </div>
          </div>
          <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right-8 duration-700">
            <Image 
              src="https://picsum.photos/seed/retail1/1200/600" 
              alt="Logistics Warehouse" 
              fill 
              className="object-cover"
              data-ai-hint="warehouse logistics"
            />
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-20 border-y">
          <div className="container mx-auto px-4 text-center space-y-16">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl font-headline font-bold text-primary">Everything you need for efficient stock control</h2>
              <p className="text-muted-foreground">Streamline your daily retail operations with our professional toolset.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Smart Ordering", desc: "Submit complex stock requests with customized priority levels and categories.", icon: ShoppingCart },
                { title: "Biometric Security", desc: "Access your dashboard instantly and securely using mobile fingerprint technology.", icon: ShieldCheck },
                { title: "Full History", desc: "Track every order ever placed with detailed status updates and cost analysis.", icon: History }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-xl bg-background border hover:border-accent/50 transition-colors space-y-4 group">
                  <div className="w-14 h-14 rounded-lg bg-primary/5 flex items-center justify-center mx-auto group-hover:bg-accent/10 transition-colors">
                    <feature.icon className="h-7 w-7 text-primary group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 font-headline font-bold text-xl mb-6">
            <Package className="h-6 w-6 text-accent" />
            <span>Retails Stocks</span>
          </div>
          <p className="opacity-70 text-sm">© 2024 Retails Stocks Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function History(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
