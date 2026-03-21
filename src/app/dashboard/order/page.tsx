"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Package, ShoppingBag, CheckCircle, Loader2 } from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/use-memo-firebase";
import { toast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    category: searchParams.get("category") || "",
    item: searchParams.get("item") || "",
    quantity: "1",
    priority: "normal",
    notes: ""
  });

  // Fetch all available products for selection
  const inventoryQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "inventory"), orderBy("name"));
  }, [db]);

  const { data: products, loading: inventoryLoading } = useCollection(inventoryQuery);

  // Filter products based on selected category if any
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!formData.category) return products;
    return products.filter(p => p.category.toLowerCase() === formData.category.toLowerCase());
  }, [products, formData.category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formData.item) {
      toast({
        title: "Missing Item",
        description: "Please select an item from the catalog.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Find the product to get the price
    const selectedProduct = products?.find(p => p.name === formData.item);
    const pricePerUnit = selectedProduct?.mrp || 0;
    const qty = parseInt(formData.quantity) || 1;

    const orderData = {
      category: formData.category || selectedProduct?.category || "Uncategorized",
      items: formData.item,
      quantity: qty,
      total: pricePerUnit * qty,
      priority: formData.priority,
      notes: formData.notes,
      status: "pending",
      storeName: "Downtown Brooklyn", // Simulated user
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, "orders"), orderData)
      .then(() => {
        setSubmitted(true);
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
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: "Could not submit your order request.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in zoom-in duration-300">
        <CheckCircle className="h-20 w-20 text-green-500" />
        <h2 className="text-3xl font-bold text-primary">Order Submitted!</h2>
        <p className="text-muted-foreground max-w-md">
          Your retail stock request has been received and is being processed. 
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold text-primary">New Stock Order</h1>
        <p className="text-muted-foreground font-body">Request inventory items from the warehouse catalog.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            Order Details
          </CardTitle>
          <CardDescription>Select items from our global catalog to restock your store.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Catalog Category</Label>
                <Select 
                  value={formData.category}
                  onValueChange={(val) => setFormData({...formData, category: val, item: ""})}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="apparel">Apparel</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                    <SelectItem value="office">Office Supplies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item">Available Product</Label>
                <Select 
                  value={formData.item}
                  disabled={inventoryLoading || filteredProducts.length === 0}
                  onValueChange={(val) => setFormData({...formData, item: val})}
                >
                  <SelectTrigger id="item">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={inventoryLoading ? "Loading..." : "Select Item"} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.name}>
                        {product.name} (${product.mrp?.toFixed(2)})
                      </SelectItem>
                    ))}
                    {filteredProducts.length === 0 && !inventoryLoading && (
                      <div className="p-2 text-xs text-center text-muted-foreground">No items in this category</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  min="1" 
                  placeholder="Quantity" 
                  required 
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority}
                  onValueChange={(val) => setFormData({...formData, priority: val})}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High (Urgent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Any special instructions or delivery details..." 
                className="min-h-[100px]" 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 bg-accent text-accent-foreground font-bold hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Place Stock Order
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
