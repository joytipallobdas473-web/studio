
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/use-memo-firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2, Loader2, Package } from "lucide-react";
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
    return query(collection(db, "inventory"), orderBy("name"));
  }, [db]);

  const { data: products, loading } = useCollection(productsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    mrp: "",
    currentStock: "",
    category: "Electronics"
  });

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        mrp: product.mrp.toString(),
        currentStock: product.currentStock.toString(),
        category: product.category || "Electronics"
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: "", sku: "", mrp: "", currentStock: "", category: "Electronics" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!db) return;
    if (!formData.name || !formData.sku || !formData.mrp || !formData.currentStock) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const productData = {
      name: formData.name,
      sku: formData.sku,
      mrp: parseFloat(formData.mrp),
      currentStock: parseInt(formData.currentStock),
      category: formData.category,
      updatedAt: serverTimestamp()
    };

    if (editingProduct) {
      const docRef = doc(db, "inventory", editingProduct.id);
      updateDoc(docRef, productData)
        .then(() => {
          toast({ title: "Product Updated", description: `${formData.name} updated successfully.` });
          setIsDialogOpen(false);
        })
        .catch(async () => {
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
          toast({ title: "Product Added", description: `${formData.name} added to global inventory.` });
          setIsDialogOpen(false);
        })
        .catch(async () => {
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
        toast({ title: "Item Removed", description: `${name} deleted from stock.`, variant: "destructive" });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete'
        }));
      });
  };

  const filteredProducts = useMemo(() => {
    return products?.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Stock & MRP Management</h1>
          <p className="text-muted-foreground text-sm">Add global stock and manage pricing controls.</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-accent text-accent-foreground font-bold hover:bg-accent/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search stocks by name, category or SKU..." 
          className="pl-9" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>MRP ($)</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.length ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-xs font-code">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="font-bold">${product.mrp.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={product.currentStock < 10 ? "text-red-500 font-bold" : ""}>
                        {product.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="hover:text-primary"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No matching stock items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Stock Item" : "Add Global Stock Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-xs">Name</Label>
              <Input 
                id="name" 
                className="col-span-3" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right text-xs">SKU</Label>
              <Input 
                id="sku" 
                className="col-span-3" 
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right text-xs">Category</Label>
              <div className="col-span-3">
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({...formData, category: val})}
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mrp" className="text-right text-xs">MRP ($)</Label>
              <Input 
                id="mrp" 
                type="number" 
                className="col-span-3" 
                value={formData.mrp}
                onChange={(e) => setFormData({...formData, mrp: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right text-xs">Stock</Label>
              <Input 
                id="stock" 
                type="number" 
                className="col-span-3" 
                value={formData.currentStock}
                onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">
              {editingProduct ? "Update Item" : "Save Stock Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
