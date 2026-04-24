"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { 
  ShoppingBag, 
  CheckCircle, 
  Loader2, 
  Search, 
  Filter, 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  LayoutGrid,
  Cpu,
  Shirt,
  Apple,
  Briefcase,
  Sparkles,
  ArrowLeft,
  Info,
  Zap,
  Bookmark,
  ArrowUpRight,
  TrendingUp,
  Activity
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
  costPrice: number;
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
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({});
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "products"));
  }, [db]);

  const { data: products, isLoading: loading } = useCollection(productsQuery);

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user?.uid]);

  const { data: store } = useDoc(storeRef);

  useEffect(() => {
    setIsClient(true);
    if (store) {
      setPhoneNumber(store.phoneNumber || "");
      setDeliveryAddress(store.location || "");
    }
  }, [store]);

  // Handle Cloned Manifests from local storage
  useEffect(() => {
    if (!loading && products && products.length > 0) {
      const cloned = localStorage.getItem("aether_clone_payload");
      if (cloned) {
        try {
          const { items } = JSON.parse(cloned);
          const parts = items.split(", ");
          const newCart: Record<string, CartItem> = {};
          
          parts.forEach((p: string) => {
            const match = p.match(/(.+) \(x(\d+)\)/);
            if (match) {
              const name = match[1];
              const qty = parseInt(match[2]);
              const product = products.find(prod => prod.name === name);
              if (product) {
                newCart[product.id] = {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  mrp: product.mrp || product.price,
                  costPrice: product.costPrice || 0,
                  sku: product.sku,
                  quantity: qty
                };
              }
            }
          });
          
          if (Object.keys(newCart).length > 0) {
            setCart(newCart);
            setIsCartOpen(true);
            toast({ title: "Manifest Synchronized", description: "Cloned items provisioned in cart." });
          }
        } catch (e) {
          console.error("Cloning protocol failure", e);
        } finally {
          localStorage.removeItem("aether_clone_payload");
        }
      }
    }
  }, [loading, products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let list = [...products]
      .filter(p => !p.isHidden)
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    
    const queryStr = searchQuery.toLowerCase();
    return list.filter(p => {
      const name = (p.name || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const matchesSearch = name.includes(queryStr) || sku.includes(queryStr);
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const getLocalQty = (id: string) => localQuantities[id] || 0;

  const updateLocalQty = (id: string, val: number) => {
    setLocalQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, val)
    }));
  };

  const addToCart = (product: any, quantity: number) => {
    const qtyToApply = quantity <= 0 ? 1 : quantity;
    setCart(prev => {
      const existing = prev[product.id];
      if (existing) {
        return {
          ...prev,
          [product.id]: { ...existing, quantity: existing.quantity + qtyToApply }
        };
      }
      return {
        ...prev,
        [product.id]: {
          id: product.id,
          name: product.name,
          price: product.price,
          mrp: product.mrp || product.price,
          costPrice: product.costPrice || 0,
          sku: product.sku,
          quantity: qtyToApply
        }
      };
    });
    toast({ title: "Item Curated", description: `${product.name} (x${qtyToApply}) added to reorder.` });
    setLocalQuantities(prev => ({ ...prev, [product.id]: 0 }));
  };

  const updateCartQuantity = (id: string, newQty: number) => {
    setCart(prev => {
      const item = prev[id];
      if (!item) return prev;
      return { ...prev, [id]: { ...item, quantity: Math.max(1, newQty) } };
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
    toast({ title: "Item Purged", variant: "destructive" });
  };

  const { cartTotal, cartCostTotal, cartMrpTotal, cartDiscount, cartItemCount } = useMemo(() => {
    const items = Object.values(cart);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const costTotal = items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const mrpTotal = items.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      cartTotal: total,
      cartCostTotal: costTotal,
      cartMrpTotal: mrpTotal,
      cartDiscount: mrpTotal - total,
      cartItemCount: count
    };
  }, [cart]);

  const deliveryFee = cartItemCount > 0 ? 7 : 0;

  const handleSubmitOrder = () => {
    if (!db || !user || cartItemCount === 0) return;
    if (!phoneNumber || !deliveryAddress) {
      toast({ title: "Validation Error", description: "Node contact and destination required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const itemSummary = Object.values(cart).map(i => `${i.name} (x${i.quantity})`).join(", ");
    const totalRevenue = cartTotal + deliveryFee;
    const totalProfit = cartTotal - cartCostTotal;

    const orderData = {
      items: itemSummary,
      userId: user.uid,
      quantity: cartItemCount,
      total: totalRevenue,
      profit: totalProfit,
      phoneNumber: phoneNumber.trim(),
      deliveryAddress: deliveryAddress.trim(),
      paymentMethod: paymentMethod,
      email: store?.email || user.email || "N/A",
      status: "pending",
      storeName: store?.name || "Branch Node", 
      createdAt: serverTimestamp()
    };

    addDocumentNonBlocking(collection(db, "orders"), orderData)
      .then(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        setCart({});
        toast({ title: "Payload Transmitted" });
        setTimeout(() => router.push("/dashboard"), 2000);
      });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-8 animate-in zoom-in duration-500">
        <div className="bg-emerald-50 p-10 rounded-full shadow-lg border border-emerald-100">
          <CheckCircle className="h-20 w-20 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 uppercase italic">Transmission Success</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px]">Your packet is live on the regional grid.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="h-14 rounded-xl px-10 border-slate-200 text-emerald-600 font-black uppercase text-[10px]">Return to Dashboard</Button>
      </div>
    );
  }

  if (!isClient) return null;

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
              <Button className="h-14 w-14 md:w-auto md:px-8 rounded-xl bg-slate-900 text-white shadow-lg relative border-none">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-black h-6 w-6 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                    {cartItemCount}
                  </span>
                )}
                <span className="hidden md:inline ml-3 font-black uppercase tracking-widest text-[10px]">Curated Packet</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[500px] border-none p-0 bg-[#f1f3f6] flex flex-col h-full overflow-hidden shadow-2xl">
              <div className="bg-white px-6 py-4 flex items-center gap-4 border-b border-slate-200">
                <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)} className="text-slate-900 h-10 w-10">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <SheetHeader className="space-y-0 text-left">
                  <SheetTitle className="text-xl font-medium text-slate-800">My Cart</SheetTitle>
                  <SheetDescription className="sr-only">Provision Reorder Payload</SheetDescription>
                </SheetHeader>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#f1f3f6]">
                {cartItemCount === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30 italic">
                    <ShoppingBag className="h-24 w-24 text-slate-300 mb-6" />
                    <p className="font-black uppercase tracking-[0.5em] text-xs">Reorder Packet Empty</p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    {Object.values(cart).map((item) => {
                      const productData = products?.find(p => p.id === item.id);
                      const img = (productData?.imageUrls || []).filter(u => !!u)[0] || productData?.imageUrl || `https://picsum.photos/seed/${item.id}/200`;
                      return (
                        <Card key={item.id} className="border-none rounded-none bg-white p-6 relative">
                          <div className="flex gap-6">
                            <div className="flex flex-col items-center gap-3">
                               <div className="relative h-20 w-20 rounded bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                                 <Image src={img} alt={item.name} fill sizes="80px" className="object-cover" />
                               </div>
                               <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 h-9">
                                  <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-slate-400 hover:text-emerald-600 transition-all"><Minus className="h-3.5 w-3.5" /></button>
                                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)} className="w-8 bg-transparent border-none outline-none text-xs font-black text-slate-900 text-center" />
                                  <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-slate-400 hover:text-emerald-600 transition-all"><Plus className="h-3.5 w-3.5" /></button>
                               </div>
                            </div>
                            <div className="flex-1 space-y-2 min-w-0">
                               <h3 className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">{item.name}</h3>
                               <p className="text-[11px] text-slate-400 font-medium tracking-wide">SKU: {item.sku}</p>
                               <div className="flex items-center gap-3 mt-4">
                                  <span className="text-slate-900 text-base font-black">₹{item.price}</span>
                                  <span className="text-slate-400 text-xs line-through">₹{item.mrp}</span>
                               </div>
                            </div>
                          </div>
                          <Separator className="my-6 bg-slate-100" />
                          <div className="flex justify-around">
                             <button onClick={() => removeFromCart(item.id)} className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-rose-600"><Trash2 className="h-4 w-4" /> Remove</button>
                             <button className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-blue-600"><Bookmark className="h-4 w-4" /> Save Later</button>
                          </div>
                        </Card>
                      );
                    })}
                    <Card className="border-none rounded-none bg-white p-6 mt-4">
                       <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 pb-3">Price Details</h4>
                       <div className="space-y-5">
                          <div className="flex justify-between items-center text-sm text-slate-700"><span>MRP ({cartItemCount} items)</span><span>₹{cartMrpTotal}</span></div>
                          <div className="flex justify-between items-center text-sm text-slate-700"><span>Logistics Fees</span><span>₹{deliveryFee}</span></div>
                          <div className="flex justify-between items-center text-sm text-emerald-600 font-medium"><span>Consolidated Discounts</span><span>- ₹{cartDiscount}</span></div>
                          <Separator className="bg-slate-100" />
                          <div className="flex justify-between items-center pt-2 text-base font-black text-slate-900"><span>Total Payable</span><span>₹{cartTotal + deliveryFee}</span></div>
                       </div>
                    </Card>
                  </div>
                )}
              </div>

              <div className="bg-white border-t border-slate-200 p-4">
                <Button 
                  className="w-full h-14 bg-[#ffc200] hover:bg-[#ffb000] text-slate-900 font-black rounded-sm shadow-none uppercase tracking-widest text-sm" 
                  disabled={cartItemCount === 0 || isSubmitting}
                  onClick={handleSubmitOrder}
                >
                  {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Place order"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-72 shrink-0 space-y-6">
          <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white rounded-2xl">
            <CardHeader className="bg-slate-50 py-4 px-6 border-b border-slate-100"><CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.3em] text-emerald-600"><Filter className="h-3.5 w-3.5" /> Sector Clusters</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={cn("flex items-center gap-3 px-6 py-4 text-[10px] transition-all hover:bg-slate-50 text-left border-l-4 font-black uppercase tracking-widest", selectedCategory === cat.id ? "border-emerald-600 bg-emerald-50 text-emerald-600" : "border-transparent text-slate-400")}>
                    <cat.icon className={cn("h-4 w-4", selectedCategory === cat.id ? "text-emerald-600" : "opacity-30")} /> {cat.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-slate-900 text-white rounded-[2rem] p-8 space-y-4">
             <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Network Pulse</span>
             </div>
             <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic">
               High velocity nodes detected in <span className="text-emerald-400">Electronics</span>. Orchestrate your packet density accordingly.
             </p>
          </Card>
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4"><Loader2 className="h-10 w-10 animate-spin text-emerald-600 opacity-20" /><p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">Syncing Registry...</p></div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const validImages = (product.imageUrls || []).filter((u: string) => !!u);
                const primaryImage = validImages[0] || product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`;
                const localQty = getLocalQty(product.id);
                const mrp = product.mrp || product.price || 0;
                const price = product.price || 0;
                const marginAmount = mrp - price;
                const marginPercent = mrp > 0 ? ((marginAmount / mrp) * 100).toFixed(1) : 0;
                const isHighDemand = Math.random() > 0.7; // Simulation logic

                return (
                  <Card key={product.id} className="group overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-500 flex flex-col bg-white rounded-3xl relative">
                    {isHighDemand && (
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-emerald-500 text-white px-3 py-1 rounded-full shadow-lg animate-pulse-emerald">
                         <TrendingUp className="h-3 w-3" />
                         <span className="text-[8px] font-black uppercase tracking-widest">High Velocity</span>
                      </div>
                    )}
                    <div className="relative h-52 w-full bg-white p-4">
                      <div className="relative h-full w-full rounded-2xl overflow-hidden bg-slate-50">
                        {validImages.length > 1 ? (
                          <Carousel className="w-full h-full">
                            <CarouselContent className="h-full">{validImages.map((url: string, idx: number) => (<CarouselItem key={idx} className="h-full relative"><Image src={url} alt={product.name} fill sizes="400px" className="object-contain p-2" /></CarouselItem>))}</CarouselContent>
                            <CarouselPrevious className="left-2 h-7 w-7 bg-white/80 border-none hover:bg-white text-emerald-600" />
                            <CarouselNext className="right-2 h-7 w-7 bg-white/80 border-none hover:bg-white text-emerald-600" />
                          </Carousel>
                        ) : (
                          <Image src={primaryImage} alt={product.name} fill sizes="400px" className="object-contain p-2 group-hover:scale-105 transition-transform duration-700" />
                        )}
                      </div>
                      <div className="absolute bottom-2 right-4 z-20">
                          <button onClick={() => addToCart(product, localQty || 1)} className="bg-[#eefcf4] border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm hover:bg-emerald-100 transition-all active:scale-95 group/btn">
                            <Plus className="h-4 w-4 text-slate-800 group-hover/btn:rotate-90 transition-transform" /><span className="font-black text-slate-800 uppercase tracking-tighter text-xs">Add</span>
                          </button>
                      </div>
                    </div>
                    <CardContent className="px-6 pb-6 pt-2 flex-1 flex flex-col space-y-4">
                      <div className="inline-flex items-center gap-2 bg-[#001da4] text-white px-4 py-1.5 rounded-full shadow-inner relative w-fit"><span className="text-[10px] font-black relative z-10 whitespace-nowrap uppercase tracking-tight">₹{marginAmount.toFixed(2)} ({marginPercent}%) Margin</span></div>
                      <div className="space-y-1"><h3 className="font-bold text-sm text-slate-900 leading-tight line-clamp-2 uppercase tracking-tight">{product.name}</h3><p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest">{product.sku}</p></div>
                      <div className="flex items-center w-full rounded-2xl overflow-hidden border border-[#b8f3d0] h-14 mt-auto">
                         <div className="bg-[#ccf5d6] h-full flex items-center px-4 min-w-[50%] border-r border-[#b8f3d0]"><span className="text-xl font-black text-slate-900 tracking-tighter italic">₹{price.toFixed(0)}</span></div>
                         <div className="bg-white h-full flex-1 flex items-center justify-center px-4 gap-2"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MRP</span><span className="text-xs font-bold text-slate-300 line-through">₹{mrp.toFixed(0)}</span></div>
                      </div>
                      <div className="flex items-center justify-between w-full bg-slate-50 rounded-xl p-1 border border-slate-100">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-3">Batch Qty</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateLocalQty(product.id, localQty - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-slate-400 hover:text-emerald-600 transition-all"><Minus className="h-3.5 w-3.5" /></button>
                          <input type="number" value={localQty} onChange={(e) => updateLocalQty(product.id, parseInt(e.target.value) || 0)} className="w-10 bg-transparent border-none outline-none text-xs font-black text-slate-900 text-center" />
                          <button onClick={() => updateLocalQty(product.id, localQty + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-slate-400 hover:text-emerald-600 transition-all"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-none"><Package className="h-16 w-16 text-slate-100 mx-auto mb-6" /><h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Identity Conflict</h3><p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">No SKUs matching your cluster query.</p></div>
          )}
        </main>
      </div>
    </div>
  );
}