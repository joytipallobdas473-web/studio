"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
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
  Sparkles
} from "lucide-react";
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, query, doc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { addDocumentNonBlocking } from "@/firebase";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", name: "Master Collection", icon: LayoutGrid },
  { id: "Electronics", name: "High-Tech Nodes", icon: Cpu },
  { id: "Apparel", name: "Silk & Apparel", icon: Shirt },
  { id: "Grocery", name: "Boutique Pantry", icon: Apple },
  { id: "Office Supplies", name: "Executive Suite", icon: Briefcase },
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
  }, [db, user]);

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

  const cartTotal = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

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
      storeName: store?.name || "Boutique Node", 
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
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-10 animate-in zoom-in duration-500">
        <div className="bg-primary/10 p-12 rounded-[3.5rem] shadow-2xl relative">
          <CheckCircle className="h-24 w-24 text-primary" />
          <div className="absolute top-0 right-0 p-4 bg-white rounded-full shadow-lg -translate-y-1/2 translate-x-1/2">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Transmission Success</h2>
          <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">Your reorder packet is live on the regional grid.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="h-16 rounded-[2rem] px-12 border-primary/20 text-primary font-black uppercase tracking-[0.4em] text-[10px] hover:bg-primary/5 transition-all">Return to Dashboard</Button>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-30" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-40 animate-in fade-in duration-700 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 bg-white p-10 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(15,50,45,0.1)] border border-primary/5">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Silk Catalog</h1>
          <p className="text-slate-500 font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.4em]">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(15,50,45,0.4)]" />
            Stocking: {store?.name || 'Aether Node'}
          </p>
        </div>
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Query SKU Signature..." 
              className="pl-16 h-16 bg-secondary/30 border-none rounded-[2rem] focus:ring-primary text-base font-bold text-slate-900 placeholder:text-slate-400" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="h-16 w-16 md:w-auto md:px-10 rounded-[2rem] bg-accent text-white shadow-2xl relative border-none hover:scale-[1.02] transition-all">
                <ShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-3 -right-3 bg-primary text-white text-[11px] font-black h-8 w-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                    {cartItemCount}
                  </span>
                )}
                <span className="hidden md:inline ml-4 font-black uppercase tracking-[0.3em] text-[10px]">Registry</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="rounded-l-[3.5rem] border-none p-0 bg-white max-w-[550px] shadow-2xl flex flex-col h-full overflow-hidden">
              <SheetHeader className="p-12 pb-6">
                <SheetTitle className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-5">
                  <ShoppingBag className="h-8 w-8 text-primary" /> Curated Packet
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto px-12 py-6 space-y-10 custom-scrollbar">
                {cartItemCount === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 italic">
                    <Sparkles className="h-20 w-20 text-slate-300" />
                    <p className="font-black uppercase tracking-[0.5em] text-[11px]">Identity Registry Empty</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.values(cart).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-6 bg-secondary/20 rounded-[2.5rem] border border-secondary group hover:border-primary/30 transition-all">
                        <div className="flex-1 min-w-0 pr-6">
                          <h4 className="font-black text-slate-900 text-[12px] uppercase italic truncate leading-none">{item.name}</h4>
                          <div className="flex items-center gap-3 mt-2">
                             <span className="text-[10px] text-slate-300 font-bold line-through">₹{(item.mrp * item.quantity).toFixed(0)}</span>
                             <span className="text-[12px] font-mono font-black text-primary">₹{(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-white rounded-2xl border border-secondary overflow-hidden h-11 shadow-sm">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-3 hover:bg-secondary transition-colors text-slate-400">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-10 text-center font-black text-sm text-primary">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-3 hover:bg-secondary transition-colors text-slate-400">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-11 w-11 text-rose-500 hover:bg-rose-50 rounded-2xl" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-12 space-y-10 border-t border-secondary">
                      <div className="space-y-4">
                        <Label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2">Payment Handshake</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="h-16 rounded-[1.5rem] bg-secondary/30 border-none font-black text-[11px] uppercase tracking-widest">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl">
                            <SelectItem value="cash" className="font-black uppercase text-[10px] tracking-widest"><Banknote className="h-4 w-4 mr-3" /> Settlement On Delivery</SelectItem>
                            <SelectItem value="after_delivery" className="font-black uppercase text-[10px] tracking-widest"><CreditCard className="h-4 w-4 mr-3" /> Boutique Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2">Destination Node</Label>
                        <Textarea 
                          value={deliveryAddress} 
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="min-h-[120px] rounded-[1.5rem] bg-secondary/30 border-none font-bold text-sm p-6"
                          placeholder="Delivery Coordinate"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2">Contact Signal</Label>
                        <Input 
                          value={phoneNumber} 
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="h-16 rounded-[1.5rem] bg-secondary/30 border-none font-black text-sm p-6"
                          placeholder="Identity Phone"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <SheetFooter className="p-12 bg-secondary/20 border-t border-secondary">
                <div className="w-full space-y-8">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">Total Valuation</span>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Savings Applied</p>
                    </div>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter font-mono italic">₹{cartTotal.toFixed(0)}</span>
                  </div>
                  <Button 
                    className="w-full h-18 bg-primary text-white hover:bg-primary/90 font-black rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(15,50,45,0.4)] uppercase tracking-[0.4em] text-[12px] border-none" 
                    disabled={cartItemCount === 0 || isSubmitting}
                    onClick={handleSubmitOrder}
                  >
                    {isSubmitting ? <Loader2 className="h-7 w-7 animate-spin" /> : (
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

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="w-full lg:w-80 shrink-0 space-y-8">
          <Card className="border-none shadow-[0_20px_50px_-15px_rgba(15,50,45,0.06)] overflow-hidden bg-white rounded-[3rem]">
            <CardHeader className="bg-secondary/30 py-6 px-8">
              <CardTitle className="text-[11px] font-black flex items-center gap-3 uppercase tracking-[0.5em] text-primary">
                <Filter className="h-4 w-4" /> Collection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between px-8 py-5 text-[11px] transition-all hover:bg-secondary/20 text-left border-l-[6px] font-black uppercase tracking-[0.2em]",
                      selectedCategory === cat.id ? "border-primary bg-primary/5 text-primary" : "border-transparent text-slate-400"
                    )}
                  >
                    <span className="flex items-center gap-4"><cat.icon className={cn("h-4.5 w-4.5", selectedCategory === cat.id ? "text-primary" : "opacity-30")} />{cat.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Regional Tip</h4>
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">"Multi-angle visual slots allow you to verify stock identity before commitment."</p>
          </div>
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <Loader2 className="h-14 w-14 animate-spin text-primary opacity-20" />
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-300">Syncing Boutique Grid...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const validImages = (product.imageUrls || []).filter((u: string) => !!u);
                const primaryImage = validImages[0] || product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`;
                
                const mrp = product.mrp || product.price || 0;
                const price = product.price || 0;
                const savings = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

                return (
                  <Card key={product.id} className="group overflow-hidden border-none shadow-[0_20px_50px_-20px_rgba(15,50,45,0.08)] hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-700 flex flex-col bg-white rounded-[3.5rem] relative">
                    <div className="relative h-56 w-full bg-secondary/10 overflow-hidden flex items-center justify-center">
                      {validImages.length > 1 ? (
                        <Carousel className="w-full h-full">
                          <CarouselContent className="h-full">
                            {validImages.map((url: string, idx: number) => (
                              <CarouselItem key={idx} className="h-full">
                                <img src={url} alt={`${product.name} angle ${idx+1}`} className="w-full h-full object-cover" />
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="left-4 h-9 w-9 bg-white/40 border-none hover:bg-white text-primary backdrop-blur-sm" />
                          <CarouselNext className="right-4 h-9 w-9 bg-white/40 border-none hover:bg-white text-primary backdrop-blur-sm" />
                        </Carousel>
                      ) : (
                        <img 
                          src={primaryImage}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                      )}
                      
                      <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
                        <Badge className="bg-white/95 backdrop-blur-md text-primary border-none text-[9px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-2xl shadow-lg">
                          {product.category}
                        </Badge>
                        {savings > 0 && (
                          <Badge className="bg-primary text-white border-none text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-2xl flex items-center gap-2 shadow-xl">
                            <TrendingDown className="h-3 w-3" /> {savings}% OFF
                          </Badge>
                        )}
                      </div>
                      
                      {validImages.length > 1 && (
                        <div className="absolute bottom-6 right-6 bg-accent/20 backdrop-blur-md p-2 rounded-xl z-10 border border-white/10">
                          <Layers className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-8 flex-1 space-y-5">
                      <div className="space-y-2">
                        <h3 className="font-black text-lg text-slate-900 leading-tight group-hover:text-primary transition-colors italic uppercase tracking-tighter">{product.name}</h3>
                        <p className="text-[10px] text-slate-400 font-mono font-bold tracking-[0.3em] uppercase">PKT_SIG: {product.sku}</p>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                           <span className="text-sm text-slate-300 font-bold line-through decoration-primary/20">₹{mrp.toFixed(0)}</span>
                           <span className="text-4xl font-black text-slate-900 tracking-tighter font-mono italic">₹{price.toFixed(0)}</span>
                        </div>
                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-2 italic">
                          Regional Pricing Applied
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-8 pt-0">
                      <Button 
                        className="w-full h-16 bg-secondary text-slate-900 hover:bg-primary hover:text-white font-black rounded-[1.5rem] shadow-sm transition-all text-[11px] uppercase tracking-[0.4em] border-none" 
                        onClick={() => addToCart(product)} 
                        disabled={!product.stockQuantity || product.stockQuantity <= 0}
                      >
                        {!product.stockQuantity || product.stockQuantity <= 0 ? "Node Depleted" : "Curation Entry"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-secondary shadow-inner">
              <Package className="h-24 w-24 text-secondary mx-auto mb-8 animate-pulse" />
              <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-xl">Identity Mismatch</h3>
              <p className="text-[11px] text-slate-400 mt-3 uppercase font-bold tracking-[0.5em]">No SKUs matching your query protocol.</p>
            </div>
          )}
        </main>
      </div>

      {cartItemCount > 0 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 md:hidden animate-in slide-in-from-bottom-20 duration-700">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="h-20 px-10 rounded-full bg-accent text-white shadow-[0_30px_80px_rgba(15,50,45,0.4)] font-black uppercase tracking-[0.4em] text-[11px] flex items-center gap-6 border-none">
                <ShoppingCart className="h-6 w-6" />
                <span className="bg-white/10 px-4 py-2 rounded-full">₹{cartTotal.toFixed(0)}</span>
              </Button>
            </SheetTrigger>
          </Sheet>
        </div>
      )}
    </div>
  );
}
