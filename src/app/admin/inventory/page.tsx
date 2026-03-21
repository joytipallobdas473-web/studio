
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export default function InventoryControl() {
  const [products, setProducts] = useState([
    { id: "1", name: "Logitech MX Master 3", category: "Electronics", sku: "LOG-MX3-001", mrp: 99.00, stock: 45 },
    { id: "2", name: "Dell 27 Monitor", category: "Electronics", sku: "DELL-P27-99", mrp: 289.50, stock: 12 },
    { id: "3", name: "Steelcase Leap V2", category: "Furniture", sku: "STL-LP-V2", mrp: 850.00, stock: 4 },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    mrp: "",
    stock: "",
    category: "Electronics"
  });

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        mrp: product.mrp.toString(),
        stock: product.stock.toString(),
        category: product.category
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: "", sku: "", mrp: "", stock: "", category: "Electronics" });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.sku || !formData.mrp || !formData.stock) {
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
      stock: parseInt(formData.stock),
      category: formData.category
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
      toast({
        title: "Product Updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      const newProduct = {
        id: Math.random().toString(36).substr(2, 9),
        ...productData
      };
      setProducts(prev => [newProduct, ...prev]);
      toast({
        title: "Product Added",
        description: `${formData.name} has been added to the global inventory.`,
      });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Item Removed",
      description: `${name} has been deleted from stock.`,
      variant: "destructive"
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-xs font-code">{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="font-bold">${product.mrp.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={product.stock < 10 ? "text-red-500 font-bold" : ""}>
                        {product.stock}
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
              <Input 
                id="category" 
                className="col-span-3" 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
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
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
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
