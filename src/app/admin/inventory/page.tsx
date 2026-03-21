"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2, Loader2, Package, AlertCircle, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";

const CATEGORIES = ["Electronics", "Apparel", "Grocery", "Office Supplies"];

export default function InventoryControl() {
  const db = useFirestore();
  
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "products");
  }, [db]);

  const { data: products, isLoading: loading } = useCollection(productsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const initialFormState = {
    name: "",
    sku: "",
    price: "",
    stockQuantity: "0",
    category: "Electronics",
    description: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        price: (product.price || 0).toString(),
        stockQuantity: (product.stockQuantity || 0).toString(),
        category: product.category || "Electronics",
        description: product.description || ""
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormState);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!db) return;

    const priceNum = parseFloat(formData.price);
    const stockNum = parseInt(formData.stockQuantity);

    if (!formData.name.trim() || isNaN(priceNum) || isNaN(stockNum)) {
      toast({
        title: "Validation Error",
        description: "Name, Price, and Stock are required and must be valid numbers.",
        variant: "destructive"
      });
      return;
    }

    const productData = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      price: priceNum,
      stockQuantity: stockNum,
      category: formData.category,
      description: formData.description.trim(),
      updatedAt: serverTimestamp()
    };

    if (editingProduct) {
      const docRef = doc(db, "products", editingProduct.id);
      updateDocumentNonBlocking(docRef, productData);
      toast({ title: "Updated Successfully", description: `${productData.name} updated.` });
    } else {
      const colRef = collection(db, "products");
      addDocumentNonBlocking(colRef, productData);
      toast({ title: "Saved Successfully", description: `${productData.name} added to catalog.` });
    }
    
    setIsDialogOpen(false);
    setFormData(initialFormState);
  };

  const handleDelete = (id: string, name: string) => {
    if (!db) return;
    const docRef = doc(db, "products", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Item Deleted", description: `${name} removed.`, variant: "destructive" });
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const sorted = [...products].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const lowerQuery = searchQuery.toLowerCase();
    if (!lowerQuery) return sorted;
    return sorted.filter(p => 
      (p.name || "").toLowerCase().includes(lowerQuery) ||
      (p.sku || "").toLowerCase().includes(lowerQuery) ||
      (p.category || "").toLowerCase().includes(lowerQuery)
    );
  }, [products, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Global Stock Management</h1>
          <p className="text-muted-foreground text-sm">Add and update products across the retail network.</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-accent text-accent-foreground font-bold hover:bg-accent/90 w-full md:w-auto shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Product
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search catalog..." 
          className="pl-9 h-11 bg-white" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price ($)</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/20">
                    <TableCell className="font-bold text-primary">{product.name}</TableCell>
                    <TableCell className="text-xs font-code opacity-70">{product.sku}</TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold bg-secondary px-2 py-1 rounded-full uppercase tracking-wider">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold">${(product.price || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(product.stockQuantity || 0) < 10 && <AlertCircle className="h-3 w-3 text-red-500" />}
                        <span className={(product.stockQuantity || 0) < 10 ? "text-red-500 font-bold" : "font-medium"}>
                          {product.stockQuantity || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleOpenDialog(product)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-500 h-8 w-8" onClick={() => handleDelete(product.id, product.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-4 opacity-20" />
                    No items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              {editingProduct ? "Update Product" : "Register New Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase">Product Name</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-xs font-bold uppercase">SKU</Label>
                <Input 
                  id="sku" 
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold uppercase">Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs font-bold uppercase">Unit Price ($)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-xs font-bold uppercase">Stock Quantity</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-primary font-bold shadow-lg">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {editingProduct ? "Apply Changes" : "Confirm Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}