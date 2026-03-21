
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Package, 
  ShoppingBag, 
  CheckCircle, 
  Loader2, 
  Search, 
  Filter, 
  Info,
  AlertCircle,
  Phone
} from "lucide-react";
import { useFirestore, useCollection, useUser, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, query, orderBy } from "firebase/firestore";
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
  const [orderNotes, setOrderNotes] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

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
    setOrderNotes("");
    setPhoneNumber("");
    setOrderDialogOpen(true);
  };

  const handleSubmitOrder = () => {
    if (!db || !selectedProduct || !user) {
      toast({ title: "Auth Required", description: "You must be signed in to place an order.", variant: "destructive" });
      return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      toast({ title: "Verification Required", description: "Please provide a valid phone number for order confirmation.", variant: "destructive" });
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
      notes: orderNotes,
      phoneNumber: phoneNumber.trim(),
      status: "pending",
      storeName: "Retailer Outlet", 
      createdAt: serverTimestamp()
    };

    addDocumentNonBlocking(collection(db, "orders"), orderData)
      .then(() => {
        setSubmitted(true);
        toast({ title: "Order Placed", description: `Request for ${qty} x ${selectedProduct.name} queued.` });
        setTimeout(() => router.push("/dashboard"), 2000);
      })
      .catch(() => {
        setIsSubmitting(false);
      });
    
    setOrderDialogOpen(false);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in zoom-in duration-300">
        <div className="bg-green-100 p-6 rounded-full"><CheckCircle className="h-20 w-20 text-green-500" /></div>
        <h2 className="text-3xl font-bold text-primary">Order Confirmed!</h2>
        <p className="text-muted-foreground">Logistics node has registered your request.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-3xl font-bold text-primary">Stock Catalog</h1>
          <p className="text-muted-foreground">Browse and request inventory items for your store.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search items..." 
            className="pl-10 h-11 bg-muted/30 border-none" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 shrink-0 space-y-4">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 py-4">
              <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-primary/70">
                <Filter className="h-3 w-3" /> Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 text-sm transition-all hover:bg-muted/50 text-left border-l-4",
                      selectedCategory === cat.id ? "border-primary bg-primary/5 font-bold text-primary" : "border-transparent text-muted-foreground"
                    )}
                  >
                    <span className="flex items-center gap-3"><cat.icon className="h-4 w-4" />{cat.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="bg-accent/10 border-accent/20 text-accent-foreground p-4 rounded-lg flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-xs font-medium">Restocks processed every 24 hours.</p>
          </div>
        </aside>

        <main className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all flex flex-col bg-white">
                  <div className="relative h-44 w-full bg-muted">
                    <Image 
                      src={`https://picsum.photos/seed/${product.id}/600/400`}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <Badge className="absolute top-3 left-3 bg-primary/90 text-white border-none text-[10px] font-bold uppercase">
                      {product.category}
                    </Badge>
                  </div>
                  <CardContent className="p-5 flex-1 space-y-2">
                    <h3 className="font-bold text-base leading-tight">{product.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-code bg-muted px-2 py-0.5 rounded w-fit">SKU: {product.sku}</p>
                    <p className="text-2xl font-bold text-primary">${(product.price || 0).toFixed(2)}</p>
                    {(product.stockQuantity || 0) < 10 ? (
                      <p className="text-[10px] text-red-500 font-bold uppercase flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Low Stock: {product.stockQuantity || 0}</p>
                    ) : (
                      <p className="text-[10px] text-green-600 font-bold uppercase">Available: {product.stockQuantity || 0}</p>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 border-t bg-muted/5">
                    <Button className="w-full bg-accent text-accent-foreground font-bold" onClick={() => handleOpenOrderDialog(product)} disabled={!product.stockQuantity || product.stockQuantity <= 0}>
                      {!product.stockQuantity || product.stockQuantity <= 0 ? "Out of Stock" : "Request Reorder"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed">
              <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="font-bold">No items found</h3>
              <Button variant="outline" className="mt-4" onClick={() => setSelectedCategory("all")}>Reset Filters</Button>
            </div>
          )}
        </main>
      </div>

      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-0 overflow-hidden bg-white max-w-[500px]">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-bold text-primary">Finalize Reorder</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="p-8 space-y-6">
              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="relative h-20 w-20 rounded-xl bg-white shadow-sm shrink-0 border overflow-hidden">
                   <Image src={`https://picsum.photos/seed/${selectedProduct.id}/200`} alt={selectedProduct.name} fill className="object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="font-bold text-slate-900 leading-tight">{selectedProduct.name}</h4>
                  <p className="text-lg font-black text-primary">${(selectedProduct.price || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Confirmation Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input 
                      placeholder="Enter mobile number..." 
                      className="h-14 pl-12 rounded-xl bg-slate-50 border-slate-100 focus:ring-primary font-bold" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic px-1">Required for logistics verification.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Quantity</Label>
                     <Input 
                       type="number" 
                       min="1" 
                       value={orderQuantity} 
                       onChange={(e) => setOrderQuantity(e.target.value)} 
                       className="h-14 text-center font-bold rounded-xl bg-slate-50 border-slate-100" 
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Total Cost</Label>
                     <div className="h-14 flex items-center justify-center bg-primary/5 text-primary font-black rounded-xl border border-primary/10">
                        ${(parseFloat(orderQuantity || "0") * (selectedProduct.price || 0)).toFixed(2)}
                     </div>
                   </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Order Notes (Optional)</Label>
                  <Textarea 
                    value={orderNotes} 
                    onChange={(e) => setOrderNotes(e.target.value)} 
                    className="min-h-[100px] rounded-xl bg-slate-50 border-slate-100" 
                    placeholder="Specific delivery instructions..."
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button variant="ghost" onClick={() => setOrderDialogOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
            <Button onClick={handleSubmitOrder} className="flex-[2] bg-accent text-primary hover:bg-primary hover:text-white h-12 rounded-xl font-black shadow-lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
