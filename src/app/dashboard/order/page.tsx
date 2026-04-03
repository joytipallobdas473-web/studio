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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ArrowRight
} from "lucide-react";
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, query, doc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { addDocumentNonBlocking } from "@/firebase";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", name: "All Categories", icon: ShoppingBag },
  { id: "Electronics", name: "Electronics", icon: Package },
  { id: "Apparel", name: "Apparel", icon: Package },
  { id: "Grocery", name: "Grocery", icon: Package },
  { id: "Office Supplies", name: "Office Supplies", icon: Package },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
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
          sku: product.sku,
          quantity: 1
        }
      };
    });
    toast({ title: "Item Added", description: `${product.name} is in your cart.` });
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
      toast({ title: "Transmission Error", description: "Cart is empty or identity sync failed.", variant: "destructive" });
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 8) {
      toast({ title: "Validation Error", description: "Valid contact phone is required.", variant: "destructive" });
      return;
    }

    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      toast({ title: "Validation Error", description: "Full delivery address is required.", variant: "destructive" });
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
      storeName: store?.name || "Retailer Node", 
      location: store?.location || "North East",
      createdAt: serverTimestamp()
    };

    addDocumentNonBlocking(collection(db, "orders"), orderData)
      .then(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        setCart({});
        toast({ title: "Bulk Order Transmitted", description: "Logistics node has registered your reorder packet." });
        setTimeout(() => router.push("/dashboard"), 2000);
      })
      .catch(() => {
        setIsSubmitting(false);
        toast({ title: "Protocol Refused", description: "Could not sync order telemetry.", variant: "destructive" });
      });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in duration-300">
        <div className="bg-emerald-100 p-8 rounded-full shadow-lg"><CheckCircle className="h-20 w-20 text-emerald-500" /></div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-primary tracking-tighter uppercase italic">Packet Registered</h2>
          <p className="text-slate-500 font-medium">Consolidated logistics request successfully transmitted.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="h-14 rounded-2xl px-10 border-slate-200 font-black uppercase tracking-widest text-[10px]">Return to Portal</Button>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-primary tracking-tight italic uppercase">Stock Catalog</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Provision items for {store?.name || 'your node'}.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search SKU..." 
              className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary text-base font-medium" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="h-14 w-14 md:w-auto md:px-6 rounded-2xl bg-primary text-white shadow-lg relative">
                <ShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-primary text-[10px] font-black h-6 w-6 rounded-full border-4 border-white flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
                <span className="hidden md:inline ml-3 font-black uppercase tracking-widest text-[10px]">View Cart</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="rounded-l-[2.5rem] border-none p-0 bg-white max-w-[500px] shadow-2xl flex flex-col h-full overflow-hidden">
              <SheetHeader className="p-8 pb-4">
                <SheetTitle className="text-2xl font-black text-primary uppercase italic tracking-tighter flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6" /> Reorder Cart
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6">
                {cartItemCount === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <ShoppingBag className="h-16 w-16" />
                    <p className="font-black uppercase tracking-widest text-xs italic">Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.values(cart).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-black text-slate-900 text-[11px] uppercase italic truncate">{item.name}</h4>
                          <p className="text-[10px] font-mono font-bold text-primary">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-white rounded-xl border border-slate-200 overflow-hidden h-9">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-2 hover:bg-slate-50 transition-colors">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-2 hover:bg-slate-50 transition-colors">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-xl" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-8 space-y-6 border-t border-slate-100">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Protocol</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash" className="font-black uppercase text-[10px]"><Banknote className="h-3 w-3 mr-2" /> Cash</SelectItem>
                            <SelectItem value="after_delivery" className="font-black uppercase text-[10px]"><CreditCard className="h-3 w-3 mr-2" /> After Delivery</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Destination Coordinate</Label>
                        <Textarea 
                          value={deliveryAddress} 
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="min-h-[100px] rounded-2xl bg-slate-50 border-none font-bold text-sm"
                          placeholder="Delivery Address"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contact Node</Label>
                        <Input 
                          value={phoneNumber} 
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                          placeholder="Phone Number"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <SheetFooter className="p-8 bg-slate-50/50 border-t border-slate-100">
                <div className="w-full space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Net Valuation</span>
                    <span className="text-3xl font-black text-primary tracking-tighter font-mono">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <Button 
                    className="w-full h-16 bg-primary text-white hover:bg-primary/90 font-black rounded-2xl shadow-xl uppercase tracking-widest text-[11px]" 
                    disabled={cartItemCount === 0 || isSubmitting}
                    onClick={handleSubmitOrder}
                  >
                    {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                      <div className="flex items-center gap-3">
                        Transmit Packet <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-72 shrink-0 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
            <CardHeader className="bg-slate-50/50 py-5">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.3em] text-primary/60">
                <Filter className="h-3.5 w-3.5" /> Sector Grid
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between px-6 py-4 text-sm transition-all hover:bg-slate-50 text-left border-l-4 font-black uppercase tracking-widest text-[10px]",
                      selectedCategory === cat.id ? "border-primary bg-primary/5 text-primary" : "border-transparent text-slate-500"
                    )}
                  >
                    <span className="flex items-center gap-3"><cat.icon className="h-4 w-4 opacity-50" />{cat.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Catalog...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all flex flex-col bg-white rounded-[2rem]">
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <Image 
                      src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`}
                      alt={product.name}
                      fill
                      unoptimized
                      data-ai-hint="retail product"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 backdrop-blur-md text-primary border-none text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-black text-base text-slate-900 leading-tight group-hover:text-primary transition-colors italic uppercase">{product.name}</h3>
                      <p className="text-[9px] text-slate-400 font-mono font-bold tracking-widest uppercase">SKU: {product.sku}</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-primary tracking-tighter font-mono">₹{(product.price || 0).toFixed(2)}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button 
                      className="w-full h-14 bg-accent text-primary hover:bg-primary hover:text-white font-black rounded-2xl shadow-sm transition-all text-[10px] uppercase tracking-widest" 
                      onClick={() => addToCart(product)} 
                      disabled={!product.stockQuantity || product.stockQuantity <= 0}
                    >
                      {!product.stockQuantity || product.stockQuantity <= 0 ? "Node Depleted" : "Add to Cart"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
              <Package className="h-20 w-20 text-slate-100 mx-auto mb-6 opacity-20" />
              <h3 className="font-black text-slate-900 uppercase italic tracking-tighter">No items detected</h3>
              <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">Adjust filters to reveal inventory payload.</p>
            </div>
          )}
        </main>
      </div>

      {cartItemCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 md:hidden animate-in slide-in-from-bottom-10 duration-500">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="h-16 px-8 rounded-full bg-primary text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] font-black uppercase tracking-widest text-[10px] flex items-center gap-4">
                <ShoppingCart className="h-5 w-5" />
                <span>Review Cart ({cartItemCount})</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">₹{cartTotal.toFixed(2)}</span>
              </Button>
            </SheetTrigger>
          </Sheet>
        </div>
      )}
    </div>
  );
}
