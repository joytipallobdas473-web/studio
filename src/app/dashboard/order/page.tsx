
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { 
  Package, 
  ShoppingBag, 
  CheckCircle, 
  Loader2, 
  Search, 
  Filter, 
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ArrowRight,
  LayoutGrid,
  Cpu,
  Shirt,
  Apple,
  Briefcase,
  TrendingDown,
  Layers,
  Sparkles,
  ShoppingBasket
} from "lucide-react";
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, query, doc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { addDocumentNonBlocking } from "@/firebase";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", name: "Master Collection", icon: LayoutGrid },
  { id: "Electronics", name: "High-Tech Nodes", icon: Cpu },
  { id: "Apparel", name: "Fashion Clusters", icon: Shirt },
  { id: "Grocery", name: "Pantry Boutique", icon: Apple },
  { id: "Office Supplies", name: "Registry Tools", icon: Briefcase },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  mrp: number;
  quantity: number;
  sku: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user?.uid]);

  const { data: store } = useDoc(storeRef);

  useEffect(() => {
    if (store) {
      setPhoneNumber(store.phoneNumber || "");
      setDeliveryAddress(store.location || "");
    }
  }, [store]);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "products"));
  }, [db]);

  const { data: products, isLoading: loading } = useCollection(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let list = [...products].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    
    return list.filter(p => {
      const name = (p.name || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const pCat = p.category || "";
      
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || sku.includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || pCat === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev[product.id];
      if (existing) {
        return {
          ...prev,
          [product.id]: { ...existing, quantity: existing.quantity + 1 }
        };
      }
      return {
        ...prev,
        [product.id]: {
          id: product.id,
          name: product.name,
          price: product.price,
          mrp: product.mrp || product.price,
          sku: product.sku,
          quantity: 1
        }
      };
    });
    toast({ title: "Item Curated", description: `${product.name} added to reorder.` });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const item = prev[id];
      if (!item) return prev;
      const newQty = Math.max(1, item.quantity + delta);
      return { ...prev, [id]: { ...item, quantity: newQty } };
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  const cartTotal = useMemo(() => Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const cartItemCount = useMemo(() => Object.values(cart).reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const handleSubmitOrder = () => {
    if (!db || !user || cartItemCount === 0) {
      toast({ title: "Sync Required", description: "Identity node or cart empty.", variant: "destructive" });
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 8) {
      toast({ title: "Validation Error", description: "Contact number required.", variant: "destructive" });
      return;
    }

    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      toast({ title: "Validation Error", description: "Destination required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    const itemSummary = Object.values(cart)
      .map(i => `${i.name} (x${i.quantity})`)
      .join(", ");

    const orderData = {
      items: itemSummary,
      userId: user.uid,
      quantity: cartItemCount,
      total: cartTotal,
      phoneNumber: phoneNumber.trim(),
      deliveryAddress: deliveryAddress.trim(),
      paymentMethod: paymentMethod,
      email: store?.email || user.email || "N/A",
      status: "pending",
      storeName: store?.name || "Branch Node", 
      location: store?.location || "North East",
      createdAt: serverTimestamp()
    };

    addDocumentNonBlocking(collection(db, "orders"), orderData)
      .then(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        setCart({});
        toast({ title: "Payload Transmitted", description: "Regional logistics node has accepted the packet." });
        setTimeout(() => router.push("/dashboard"), 2000);
      })
      .catch(() => {
        setIsSubmitting(false);
        toast({ title: "Protocol Denied", description: "Network sync timeout.", variant: "destructive" });
      });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-8 animate-in zoom-in duration-500">
        <div className="bg-emerald-50 p-10 rounded-full shadow-lg relative border border-emerald-100">
          <CheckCircle className="h-20 w-20 text-emerald-600" />
          <div className="absolute top-0 right-0 p-3 bg-white rounded-full shadow-md -translate-y-1/4 translate-x-1/4 border border-emerald-50">
            <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Transmission Success</h2>
          <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">Your reorder packet is live on the regional grid.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="h-14 rounded-xl px-10 border-slate-200 text-emerald-600 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-emerald-50 transition-all">Return to Dashboard</Button>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-30" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-40 animate-in fade-in duration-700 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">SKU Provision</h1>
          <p className="text-slate-500 font-bold flex items-center gap-2 text-[10px] uppercase tracking-[0.3em]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Node: {store?.name || 'Aether'}
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Query SKU Signature..." 
              className="pl-12 h-14 bg-slate-50 border-none rounded-xl focus:ring-emerald-600 font-bold text-slate-900" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button className="h-14 w-14 md:w-auto md:px-8 rounded-xl bg-slate-900 text-white shadow-lg relative border-none hover:bg-slate-800 transition-all">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-black h-6 w-6 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                    {cartItemCount}
                  </span>
                )}
                <span className="hidden md:inline ml-3 font-black uppercase tracking-widest text-[10px]">Curated Packet</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="rounded-l-[3rem] border-none p-0 bg-white max-w-[500px] shadow-[0_0_100px_rgba(0,0,0,0.1)] flex flex-col h-full overflow-hidden">
              <SheetHeader className="p-12 pb-6 space-y-0 text-left">
                <div className="flex items-center gap-6">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                    <ShoppingBasket className="h-7 w-7" />
                  </div>
                  <div className="flex flex-col">
                    <SheetTitle className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Current</SheetTitle>
                    <SheetTitle className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Orders</SheetTitle>
                  </div>
                </div>
                <SheetDescription className="sr-only">
                  Review and commit your branch reorder packet.
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto px-10 py-6 space-y-6 custom-scrollbar">
                {cartItemCount === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20 italic">
                    <Package className="h-24 w-24 text-slate-300" />
                    <p className="font-black uppercase tracking-[0.5em] text-xs">Registry Empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.values(cart).map((item) => (
                      <div key={item.id} className="relative p-6 bg-[#f8fafc] rounded-[2rem] border border-transparent hover:border-emerald-100 transition-all group overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-4">
                            <h4 className="font-black text-slate-900 text-sm uppercase italic truncate leading-none mb-2">{item.name}</h4>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] block mb-4">({item.sku})</span>
                            <span className="text-lg font-black text-emerald-600 italic font-mono">₹{(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                          
                          <div className="flex flex-col items-end gap-6">
                            <div className="flex items-center bg-white rounded-full border border-slate-100 p-1.5 shadow-sm h-11">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)} 
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-10 text-center font-black text-sm text-slate-900">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)} 
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-rose-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" 
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-10 space-y-8 mt-4">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Deployment Telemetry</Label>
                        
                        <div className="grid gap-4">
                          <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                             <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="h-14 rounded-2xl bg-white border-none font-black text-[11px] uppercase tracking-widest text-slate-900 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    {paymentMethod === 'cash' ? <Banknote className="h-4 w-4 text-emerald-600" /> : <CreditCard className="h-4 w-4 text-emerald-600" />}
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                  <SelectItem value="cash" className="font-black uppercase text-[10px] tracking-widest">Cash Settlement</SelectItem>
                                  <SelectItem value="after_delivery" className="font-black uppercase text-[10px] tracking-widest">Regional Credit</SelectItem>
                                </SelectContent>
                              </Select>
                          </div>

                          <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                            <div className="relative">
                              <MapPin className="absolute left-4 top-4 h-4 w-4 text-emerald-600/40" />
                              <Textarea 
                                value={deliveryAddress} 
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                className="min-h-[100px] rounded-2xl bg-white border-none font-bold text-xs p-4 pl-12 shadow-sm placeholder:text-slate-300"
                                placeholder="Final destination node coordinate..."
                              />
                            </div>
                          </div>

                          <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600/40" />
                              <Input 
                                value={phoneNumber} 
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="h-14 rounded-2xl bg-white border-none font-black text-xs p-4 pl-12 shadow-sm placeholder:text-slate-300"
                                placeholder="Identity Comms Signal..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <SheetFooter className="p-12 pt-6 bg-white border-t border-slate-50">
                <div className="w-full space-y-10">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Total Valuation</span>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Protocol Active
                      </p>
                    </div>
                    <span className="text-5xl font-black text-slate-900 tracking-tighter font-mono italic">₹{cartTotal.toFixed(0)}</span>
                  </div>
                  
                  <Button 
                    className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-[2rem] shadow-[0_20px_50px_rgba(5,150,105,0.2)] uppercase tracking-[0.4em] text-[13px] border-none transition-all hover:scale-[1.02] active:scale-[0.98]" 
                    disabled={cartItemCount === 0 || isSubmitting}
                    onClick={handleSubmitOrder}
                  >
                    {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                      <div className="flex items-center gap-4">
                        Commit Packet <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-72 shrink-0 space-y-6">
          <Card className="border border-slate-200/60 shadow-sm overflow-hidden bg-white rounded-2xl">
            <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.3em] text-emerald-600">
                <Filter className="h-3.5 w-3.5" /> Sector Clusters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-4 text-[10px] transition-all hover:bg-slate-50 text-left border-l-4 font-black uppercase tracking-widest",
                      selectedCategory === cat.id ? "border-emerald-600 bg-emerald-50/30 text-emerald-600" : "border-transparent text-slate-400"
                    )}
                  >
                    <cat.icon className={cn("h-4 w-4", selectedCategory === cat.id ? "text-emerald-600" : "opacity-30")} />
                    {cat.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 space-y-3">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Network Insight</h4>
            <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">"SKU identity packets are synchronized globally across the regional grid."</p>
          </div>
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-20" />
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">Syncing Catalog Registry...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const validImages = (product.imageUrls || []).filter((u: string) => !!u);
                const primaryImage = validImages[0] || product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`;
                
                const mrp = product.mrp || product.price || 0;
                const price = product.price || 0;
                const savings = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

                return (
                  <Card key={product.id} className="group overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-500 flex flex-col bg-white rounded-[2rem] relative">
                    <div className="relative h-48 w-full bg-slate-50 overflow-hidden">
                      {validImages.length > 1 ? (
                        <Carousel className="w-full h-full">
                          <CarouselContent className="h-full">
                            {validImages.map((url: string, idx: number) => (
                              <CarouselItem key={idx} className="h-full relative">
                                <Image src={url} alt={`${product.name} angle ${idx+1}`} fill className="object-cover" data-ai-hint="product angle" />
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="left-2 h-7 w-7 bg-white/80 border-none hover:bg-white text-emerald-600" />
                          <CarouselNext className="right-2 h-7 w-7 bg-white/80 border-none hover:bg-white text-emerald-600" />
                        </Carousel>
                      ) : (
                        <Image 
                          src={primaryImage}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          data-ai-hint="product photo"
                        />
                      )}
                      
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        <Badge className="bg-white/95 text-emerald-600 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm">
                          {product.category}
                        </Badge>
                        {savings > 0 && (
                          <Badge className="bg-emerald-600 text-white border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
                            <TrendingDown className="h-2.5 w-2.5" /> {savings}% SAVING
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-6 flex-1 space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-black text-sm text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors italic uppercase tracking-tight">{product.name}</h3>
                        <p className="text-[9px] text-slate-400 font-mono font-bold tracking-widest uppercase">{product.sku}</p>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-slate-300 font-bold line-through">₹{mrp.toFixed(0)}</span>
                           <span className="text-2xl font-black text-slate-900 tracking-tighter font-mono italic">₹{price.toFixed(0)}</span>
                        </div>
                        <p className="text-[8px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-1 italic">
                          Boutique Rate Active
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                      <Button 
                        className="w-full h-12 bg-slate-50 text-slate-900 hover:bg-emerald-600 hover:text-white font-black rounded-xl shadow-none transition-all text-[10px] uppercase tracking-widest border border-slate-100" 
                        onClick={() => addToCart(product)} 
                        disabled={!product.stockQuantity || product.stockQuantity <= 0}
                      >
                        {!product.stockQuantity || product.stockQuantity <= 0 ? "Depleted" : "Add to cart 🛒"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-none">
              <Package className="h-16 w-16 text-slate-100 mx-auto mb-6" />
              <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Identity Conflict</h3>
              <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">No SKUs matching your cluster query.</p>
            </div>
          )}
        </main>
      </div>

      {cartItemCount > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 md:hidden animate-in slide-in-from-bottom-10 duration-500">
           <Button 
            className="h-16 px-8 rounded-full bg-slate-900 text-white shadow-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-4 border-none"
            onClick={() => setIsCartOpen(true)}
           >
            <ShoppingCart className="h-5 w-5" />
            <span className="bg-emerald-600 px-3 py-1 rounded-lg">₹{cartTotal.toFixed(0)}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
