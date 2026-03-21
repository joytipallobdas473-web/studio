
"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { collection, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/use-memo-firebase";
import { toast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
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
  const searchParams = useSearchParams();
  const db = useFirestore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [orderNotes, setOrderNotes] = useState("");

  const inventoryQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "inventory"), orderBy("name"));
  }, [db]);

  const { data: products, loading } = useCollection(inventoryQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const name = (p.name || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const productCategory = (p.category || "");
      
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || sku.includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || productCategory === selectedCategory;
      
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
      category: selectedProduct.category,
      items: selectedProduct.name,
      productId: selectedProduct.id,
      quantity: qty,
      total: (selectedProduct.mrp || 0) * qty,
      priority: "normal",
      notes: orderNotes,
      status: "pending",
      storeName: "Retailer Outlet", 
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, "orders"), orderData)
      .then(() => {
        setOrderDialogOpen(false);
        setSubmitted(true);
        toast({
          title: "Order Placed Successfully",
          description: `Your request for ${qty} x ${selectedProduct.name} has been queued.`,
        });
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      })
      .catch(async () => {
        setIsSubmitting(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'orders',
          operation: 'create',
          requestResourceData: orderData
        }));
      });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in zoom-in duration-300">
        <div className="bg-green-100 p-6 rounded-full">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-primary">Order Confirmed!</h2>
        <p className="text-muted-foreground max-w-md font-medium">
          Your restock request for <strong>{selectedProduct?.name}</strong> is being processed.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="mt-4">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-3xl font-bold text-primary">Warehouse Inventory</h1>
          <p className="text-muted-foreground font-medium">Browse and request stock for your outlet.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search items by name, SKU..." 
            className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 shrink-0 space-y-4">
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
                      selectedCategory === cat.id 
                        ? "border-primary bg-primary/5 font-bold text-primary" 
                        : "border-transparent text-muted-foreground"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <cat.icon className="h-4 w-4" />
                      {cat.name}
                    </span>
                    {selectedCategory === cat.id && <ChevronRight className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/10 border-accent/20 text-accent-foreground p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
              <p className="text-xs leading-relaxed font-medium">
                Warehouse restock is processed every 24 hours. Track status in your dashboard.
              </p>
            </div>
          </Card>
        </div>

        <div className="flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-bold tracking-widest uppercase">Syncing Catalog...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 flex flex-col bg-white">
                  <div className="relative h-44 w-full bg-muted">
                    <Image 
                      src={`https://picsum.photos/seed/${product.id}/600/400`}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <Badge className="absolute top-3 left-3 bg-primary/90 text-white border-none text-[10px] font-bold tracking-wider uppercase">
                      {product.category}
                    </Badge>
                  </div>
                  <CardContent className="p-5 flex-1 space-y-3">
                    <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-muted-foreground font-code bg-muted px-2 py-0.5 rounded">SKU: {product.sku}</p>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-2xl font-bold text-primary">${(product.mrp || 0).toFixed(2)}</span>
                    </div>
                    <div className="pt-2">
                      {(product.currentStock || 0) < 10 ? (
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Low Stock: {product.currentStock}
                        </p>
                      ) : (
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Available: {product.currentStock}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 border-t bg-muted/5">
                    <Button 
                      className="w-full bg-accent text-accent-foreground font-bold hover:bg-accent/90 shadow-sm"
                      onClick={() => handleOpenOrderDialog(product)}
                      disabled={product.currentStock <= 0}
                    >
                      {product.currentStock <= 0 ? "Out of Stock" : "Request Reorder"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed shadow-inner">
              <div className="bg-muted p-8 rounded-full mb-6">
                <Package className="h-12 w-12 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold text-primary">No Matching Items</h3>
              <p className="text-muted-foreground max-w-xs text-center mt-2 font-medium">
                No items matching your current filters.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 font-bold"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Stock Reorder Request</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6 py-4">
              <div className="flex gap-4 p-4 bg-muted/30 rounded-lg border border-primary/10">
                <div className="relative h-20 w-20 rounded-md overflow-hidden bg-white shadow-sm shrink-0 border">
                   <Image 
                    src={`https://picsum.photos/seed/${selectedProduct.id}/200`}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-primary text-sm leading-tight">{selectedProduct.name}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{selectedProduct.category} • SKU: {selectedProduct.sku}</p>
                  <p className="text-lg font-bold text-primary pt-1">${(selectedProduct.mrp || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right font-bold text-xs uppercase">Quantity</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min="1" 
                    max={selectedProduct.currentStock}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                    className="col-span-3 h-11 text-center font-bold text-lg"
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="notes" className="text-right font-bold text-xs uppercase mt-3">Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Instructions..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="col-span-3 min-h-[100px] bg-white"
                  />
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center bg-muted/10 p-4 rounded-lg">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Est. Total:</span>
                <span className="text-2xl font-bold text-primary">
                  ${((selectedProduct.mrp || 0) * (parseInt(orderQuantity) || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setOrderDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitOrder} 
              className="bg-accent text-accent-foreground font-bold px-10 shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Confirm Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
