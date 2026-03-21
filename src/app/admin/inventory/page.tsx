"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/use-memo-firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2, Loader2, Package, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const CATEGORIES = ["Electronics", "Apparel", "Grocery", "Office Supplies"];

export default function InventoryControl() {
  const db = useFirestore();
  
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    // Simple collection reference to ensure standard behavior
    return collection(db, "inventory");
  }, [db]);

  const { data: products, loading } = useCollection(productsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const initialFormState = {
    name: "",
    sku: "",
    mrp: "",
    currentStock: "0",
    category: "Electronics"
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        mrp: (product.mrp || 0).toString(),
        currentStock: (product.currentStock || 0).toString(),
        category: product.category || "Electronics"
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormState);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!db) {
      toast({ title: "Error", description: "Database connection lost. Please refresh.", variant: "destructive" });
      return;
    }

    const mrp = parseFloat(formData.mrp);
    const stock = parseInt(formData.currentStock);

    if (!formData.name.trim() || !formData.sku.trim() || isNaN(mrp) || isNaN(stock)) {
      toast({
        title: "Validation Error",
        description: "Please ensure all fields are filled correctly. Price and Stock must be valid numbers.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    const productData = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      mrp: mrp,
      currentStock: stock,
      category: formData.category,
      updatedAt: serverTimestamp()
    };

    if (editingProduct) {
      const docRef = doc(db, "inventory", editingProduct.id);
      updateDoc(docRef, productData)
        .then(() => {
          toast({ 
            title: "Updated Successfully", 
            description: `${productData.name} has been updated.`,
          });
          setIsSaving(false);
          setIsDialogOpen(false);
        })
        .catch(async (err) => {
          console.error("Stock update error:", err);
          setIsSaving(false);
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: productData
          }));
        });
    } else {
      const colRef = collection(db, "inventory");
      addDoc(colRef, productData)
        .then(() => {
          toast({ 
            title: "Saved Successfully", 
            description: `${productData.name} has been added to the catalog.`,
          });
          setIsSaving(false);
          setIsDialogOpen(false);
          setFormData(initialFormState);
        })
        .catch(async (err) => {
          console.error("Stock save error:", err);
          setIsSaving(false);
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: colRef.path,
            operation: 'create',
            requestResourceData: productData
          }));
        });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!db) return;
    const docRef = doc(db, "inventory", id);
    deleteDoc(docRef)
      .then(() => {
        toast({ 
          title: "Item Deleted", 
          description: `${name} removed from inventory.`, 
          variant: "destructive" 
        });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete'
        }));
      });
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    // Sort products locally to avoid complex composite index requirements
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
          <p className="text-muted-foreground text-sm">Add and update inventory items across the network.</p>
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
          placeholder="Search by name, SKU or category..." 
          className="pl-9 h-11 bg-white" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
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
                <TableHead>Warehouse Stock</TableHead>
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
                    <TableCell className="font-bold">${(product.mrp || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(product.currentStock || 0) < 10 && <AlertCircle className="h-3 w-3 text-red-500" />}
                        <span className={(product.currentStock || 0) < 10 ? "text-red-500 font-bold" : "font-medium"}>
                          {product.currentStock || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="hover:text-primary h-8 w-8"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-600 h-8 w-8"
                          onClick={() => handleDelete(product.id, product.name)}
                        >
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
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!isSaving) setIsDialogOpen(open);
      }}>
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
                placeholder="e.g. Ultra HD Monitor 27\"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={isSaving}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-xs font-bold uppercase">SKU Code</Label>
                <Input 
                  id="sku" 
                  placeholder="WH-INV-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold uppercase">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({...formData, category: val})}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
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
                <Label htmlFor="mrp" className="text-xs font-bold uppercase">Unit Price ($)</Label>
                <Input 
                  id="mrp" 
                  type="number" 
                  step="0.01"
                  value={formData.mrp}
                  onChange={(e) => setFormData({...formData, mrp: e.target.value})}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-xs font-bold uppercase">Warehouse Stock</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  value={formData.currentStock}
                  onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              className="bg-primary font-bold shadow-lg" 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {editingProduct ? "Apply Changes" : "Confirm Entry"}
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
