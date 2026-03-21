
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
  ChevronRight, 
  Filter, 
  Info,
  AlertCircle
} from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/use-memo-firebase";
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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [orderNotes, setOrderNotes] = useState("");

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
    setOrderDialogOpen(true);
  };

  const handleSubmitOrder = () => {
    if (!db || !selectedProduct) return;

    setIsSubmitting(true);
    const qty = parseInt(orderQuantity) || 1;
    const orderData = {
      items: selectedProduct.name,
      productId: selectedProduct.id,
      quantity: qty,
      total: (selectedProduct.price || 0) * qty,
      notes: orderNotes,
      status: "pending",
      storeName: "Retailer Outlet", 
      createdAt: serverTimestamp()
    };

    addDocumentNonBlocking(collection(db, "orders"), orderData);
    
    setOrderDialogOpen(false);
    setSubmitted(true);
    toast({ title: "Order Placed", description: `Request for ${qty} x ${selectedProduct.name} queued.` });
    
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in zoom-in duration-300">
        <div className="bg-green-100 p-6 rounded-full"><CheckCircle className="h-20 w-20 text-green-500" /></div>
        <h2 className="text-3xl font-bold text-primary">Order Confirmed!</h2>
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
                    {product.stockQuantity < 10 ? (
                      <p className="text-[10px] text-red-500 font-bold uppercase flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Low Stock: {product.stockQuantity}</p>
                    ) : (
                      <p className="text-[10px] text-green-600 font-bold uppercase">Available: {product.stockQuantity}</p>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 border-t bg-muted/5">
                    <Button className="w-full bg-accent text-accent-foreground font-bold" onClick={() => handleOpenOrderDialog(product)} disabled={product.stockQuantity <= 0}>
                      {product.stockQuantity <= 0 ? "Out of Stock" : "Request Reorder"}
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
        <DialogContent>
          <DialogHeader><DialogTitle className="font-bold">Stock Reorder Request</DialogTitle></DialogHeader>
          {selectedProduct && (
            <div className="space-y-6 py-4">
              <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="relative h-20 w-20 rounded bg-white shadow-sm shrink-0 border">
                   <Image src={`https://picsum.photos/seed/${selectedProduct.id}/200`} alt={selectedProduct.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{selectedProduct.name}</h4>
                  <p className="text-lg font-bold text-primary">${(selectedProduct.price || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-bold text-xs">Quantity</Label>
                  <Input id="quantity" type="number" min="1" value={orderQuantity} onChange={(e) => setOrderQuantity(e.target.value)} className="col-span-3 text-center font-bold" />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right font-bold text-xs mt-3">Notes</Label>
                  <Textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} className="col-span-3 min-h-[100px]" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitOrder} className="bg-accent text-accent-foreground font-bold px-10" disabled={isSubmitting}>Confirm Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
