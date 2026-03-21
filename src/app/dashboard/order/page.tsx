
"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  Star,
  Info
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
  { id: "electronics", name: "Electronics", icon: Package },
  { id: "apparel", name: "Apparel", icon: Package },
  { id: "grocery", name: "Grocery", icon: Package },
  { id: "office", name: "Office Supplies", icon: Package },
];

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Order Dialog State
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [orderNotes, setOrderNotes] = useState("");

  // Fetch inventory
  const inventoryQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "inventory"), orderBy("name"));
  }, [db]);

  const { data: products, loading } = useCollection(inventoryQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();
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
      storeName: "Downtown Brooklyn", // Simulated context
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, "orders"), orderData)
      .then(() => {
        setOrderDialogOpen(false);
        setSubmitted(true);
        toast({
          title: "Order Placed",
          description: `Successfully requested ${qty} unit(s) of ${selectedProduct.name}.`,
        });
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'orders',
          operation: 'create',
          requestResourceData: orderData
        }));
        setIsSubmitting(false);
      });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in zoom-in duration-300">
        <div className="bg-green-100 p-6 rounded-full">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-primary">Request Successful!</h2>
        <p className="text-muted-foreground max-w-md">
          Your restock request for <strong>{selectedProduct?.name}</strong> has been sent to the central warehouse.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-3xl font-bold text-primary">Warehouse Catalog</h1>
          <p className="text-muted-foreground">Select premium stock items to restock your store inventory.</p>
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
        {/* Sidebar Filter - Flipkart Style */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/50 text-left border-l-4",
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
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                Orders placed before 2 PM are typically processed on the same business day.
              </p>
            </div>
          </Card>
        </div>

        {/* Product Grid */}
        <div className="flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Fetching global catalog...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 flex flex-col">
                  <div className="relative h-48 w-full bg-muted">
                    <Image 
                      src={`https://picsum.photos/seed/${product.id}/600/400`}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      data-ai-hint="product items"
                    />
                    <Badge className="absolute top-3 right-3 bg-white/90 text-primary hover:bg-white">
                      {product.category}
                    </Badge>
                  </div>
                  <CardContent className="p-5 flex-1 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center text-xs font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                        <Star className="h-3 w-3 fill-current mr-0.5" /> 4.5
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-code">SKU: {product.sku}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">${product.mrp.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground line-through">${(product.mrp * 1.2).toFixed(2)}</span>
                    </div>
                    <div className="pt-2">
                      {product.currentStock < 10 ? (
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Only {product.currentStock} units left at warehouse</p>
                      ) : (
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">In Stock at Warehouse</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 border-t bg-muted/10">
                    <Button 
                      className="w-full bg-accent text-accent-foreground font-bold hover:bg-accent/90 shadow-sm"
                      onClick={() => handleOpenOrderDialog(product)}
                    >
                      Request Stock
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed">
              <div className="bg-muted p-6 rounded-full mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">No items found</h3>
              <p className="text-muted-foreground max-w-xs text-center mt-2">
                We couldn't find any products matching your search criteria. Try a different category or search term.
              </p>
              <Button 
                variant="link" 
                className="mt-4 text-accent"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Stock Reorder Request</DialogTitle>
            <DialogDescription>
              Specify the quantity for <strong>{selectedProduct?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6 py-4">
              <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="relative h-20 w-20 rounded-md overflow-hidden bg-white shadow-sm shrink-0">
                   <Image 
                    src={`https://picsum.photos/seed/${selectedProduct.id}/200`}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-primary">{selectedProduct.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedProduct.category} • SKU: {selectedProduct.sku}</p>
                  <p className="text-sm font-bold">${selectedProduct.mrp.toFixed(2)} / unit</p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right font-bold text-xs uppercase tracking-wider">Quantity</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  min="1" 
                  max={selectedProduct.currentStock}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="col-span-3 h-11"
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right font-bold text-xs uppercase tracking-wider mt-3">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Special instructions or delivery location..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="col-span-3 min-h-[100px]"
                />
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Total Request Value:</span>
                <span className="text-2xl font-bold text-primary">
                  ${(selectedProduct.mrp * (parseInt(orderQuantity) || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOrderDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitOrder} 
              className="bg-accent text-accent-foreground font-bold px-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : "Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
