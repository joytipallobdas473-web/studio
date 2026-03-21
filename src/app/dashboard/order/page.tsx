
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Package, ShoppingBag, CheckCircle, Loader2 } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export default function NewOrderPage() {
  const router = useRouter();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    item: "",
    quantity: "",
    priority: "normal",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "orders"), {
        category: formData.category,
        items: formData.item, // Simplified for MVP
        quantity: parseInt(formData.quantity),
        total: Math.floor(Math.random() * 500) + 100, // Dummy price for demo
        priority: formData.priority,
        notes: formData.notes,
        status: "pending",
        storeName: "Downtown Brooklyn", // Hardcoded for simulated user
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "Could not submit your order request.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <p className="text-muted-foreground font-body">Request inventory items from the warehouse.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-accent" />
            Order Details
          </CardTitle>
          <CardDescription>Fill out the form below to submit your request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  required 
                  onValueChange={(val) => setFormData({...formData, category: val})}
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
                <Label htmlFor="item">Specific Item</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="item" 
                    placeholder="e.g. Wireless Keyboard" 
                    className="pl-9" 
                    required 
                    value={formData.item}
                    onChange={(e) => setFormData({...formData, item: e.target.value})}
                  />
                </div>
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
                  defaultValue="normal"
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
                Submit Order
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
