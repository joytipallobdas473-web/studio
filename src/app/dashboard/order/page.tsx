"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Package, 
  ShoppingBag, 
  CheckCircle, 
  Loader2, 
  Search, 
  Filter, 
  Info,
  Phone
} from "lucide-react";
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, serverTimestamp, query, orderBy, doc } from "firebase/firestore";
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

export default function NewOrderPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [phoneNumber, setPhoneNumber] = useState("");

  const storeRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "stores", user.uid);
  }, [db, user]);

  const { data: store } = useDoc(storeRef);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "products"), orderBy("name"));
  }, [db]);

  const { data: products, isLoading: loading } = useCollection(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const name = (p.name || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const pCat = p.category || "";
      
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || sku.includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || pCat === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleOpenOrderDialog = (product: any) => {
    setSelectedProduct(product);
    setOrderQuantity("1");
    setPhoneNumber(store?.phoneNumber || "");
    setOrderDialogOpen(true);
  };

  const handleSubmitOrder = () => {
    if (!db || !selectedProduct || !user) {
      toast({ title: "Transmission Error", description: "Identity sync required.", variant: "destructive" });
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      toast({ title: "Validation Error", description: "Valid contact phone is required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const qty = parseInt(orderQuantity) || 1;
    const orderData = {
      items: selectedProduct.name,
      productId: selectedProduct.id,
      userId: user.uid,
      quantity: qty,
      total: (selectedProduct.price || 0) * qty,
      phoneNumber: phoneNumber.trim(),
      status: "pending",
      storeName: store?.name || "Retailer Node", 
      location: store?.location || "North East",
      createdAt: serverTimestamp()
    };

    // Save order and redirect
    addDocumentNonBlocking(collection(db, "orders"), orderData)
      .then(() => {
        setSubmitted(true);
        toast({ title: "Order Sent", description: `Request for ${selectedProduct.name} saved.` });
        setTimeout(() => router.push("/dashboard"), 1500);
      })
      .catch((err) => {
        setIsSubmitting(false);
        toast({ title: "Protocol Refused", description: "Could not sync order telemetry.", variant: "destructive" });
      });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in zoom-in duration-300">
        <div className="bg-emerald-100 p-8 rounded-full shadow-lg"><CheckCircle className="h-20 w-20 text-emerald-500" /></div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-primary">Order Transmitted</h2>
          <p className="text-muted-foreground font-medium">Logistics node has successfully registered your reorder request.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="h-12 rounded-xl px-8 border-slate-200">Return to Portal</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Stock Catalog</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Info className="h-3.5 w-3.5" /> Select inventory for {store?.name || 'your node'}.
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search regional items..." 
            className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary text-base" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-72 shrink-0 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
            <CardHeader className="bg-slate-50/50 py-5">
              <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-[0.3em] text-primary/60">
                <Filter className="h-3.5 w-3.5" /> Sectors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between px-6 py-4 text-sm transition-all hover:bg-slate-50 text-left border-l-4",
                      selectedCategory === cat.id ? "border-primary bg-primary/5 font-bold text-primary" : "border-transparent text-slate-500"
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
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Syncing Catalog...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all flex flex-col bg-white rounded-[2rem]">
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <Image 
                      src={`https://picsum.photos/seed/${product.id}/600/400`}
                      alt={product.name}
                      fill
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
                      <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-primary transition-colors italic uppercase">{product.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono font-bold tracking-widest">SKU: {product.sku}</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-primary tracking-tighter">${(product.price || 0).toFixed(2)}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button 
                      className="w-full h-12 bg-accent text-primary hover:bg-primary hover:text-white font-black rounded-xl shadow-sm transition-all text-xs uppercase tracking-widest" 
                      onClick={() => handleOpenOrderDialog(product)} 
                      disabled={!product.stockQuantity || product.stockQuantity <= 0}
                    >
                      {!product.stockQuantity || product.stockQuantity <= 0 ? "Out of Stock" : "Request Stock"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
              <Package className="h-20 w-20 text-slate-100 mx-auto mb-6" />
              <h3 className="font-bold text-slate-900">No items detected in this sector</h3>
              <p className="text-sm text-slate-500 mt-2">Try adjusting your filters.</p>
            </div>
          )}
        </main>
      </div>

      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none p-0 overflow-hidden bg-white max-w-[550px] shadow-2xl animate-in zoom-in-95 duration-300">
          <DialogHeader className="p-10 pb-0">
            <DialogTitle className="text-2xl font-black text-primary uppercase italic tracking-tighter">Finalize Reorder</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="p-10 space-y-8">
              <div className="flex gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 items-center">
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-slate-900 text-lg uppercase italic">{selectedProduct.name}</h4>
                  <p className="text-xl font-black text-primary">${(selectedProduct.price || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contact Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-50" />
                    <Input 
                      placeholder="Enter mobile number..." 
                      className="h-16 pl-14 rounded-2xl bg-slate-50 border-none focus:ring-primary font-bold text-slate-900" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Qty</Label>
                     <Input 
                       type="number" 
                       min="1" 
                       value={orderQuantity} 
                       onChange={(e) => setOrderQuantity(e.target.value)} 
                       className="h-16 text-center font-black rounded-2xl bg-slate-50 border-none text-lg" 
                     />
                   </div>
                   <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Total</Label>
                     <div className="h-16 flex items-center justify-center bg-primary text-white font-black rounded-2xl text-xl">
                        ${(parseFloat(orderQuantity || "0") * (selectedProduct.price || 0)).toFixed(2)}
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="p-10 pt-0 flex gap-4">
            <Button variant="ghost" onClick={() => setOrderDialogOpen(false)} className="flex-1 h-14 rounded-2xl">Abort</Button>
            <Button onClick={handleSubmitOrder} className="flex-[2] bg-accent text-primary hover:bg-primary hover:text-white h-14 rounded-2xl font-black uppercase tracking-widest" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Transmit Reorder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}