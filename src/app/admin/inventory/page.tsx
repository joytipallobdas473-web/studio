"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2, Loader2, Package, AlertCircle, CheckCircle2, Filter, Boxes, MoreVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { Badge } from "@/components/ui/badge";

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
  const [filterCategory, setFilterCategory] = useState("all");
  
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
        description: "Name, Price, and Stock are required.",
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
      toast({ title: "Updated", description: "Product SKU synchronized." });
    } else {
      const colRef = collection(db, "products");
      addDocumentNonBlocking(colRef, productData);
      toast({ title: "Registered", description: "Item added to core catalog." });
    }
    
    setIsDialogOpen(false);
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let list = [...products].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    
    if (filterCategory !== "all") {
      list = list.filter(p => p.category === filterCategory);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.name || "").toLowerCase().includes(lowerQuery) ||
        (p.sku || "").toLowerCase().includes(lowerQuery)
      );
    }
    return list;
  }, [products, searchQuery, filterCategory]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-white">INVENTORY ENGINE</h1>
          <p className="text-slate-500 font-medium text-sm">Central product registry and stock synchronization.</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-primary h-12 px-6 rounded-xl font-bold shadow-xl hover:shadow-primary/20 transition-all"
        >
          <Plus className="mr-2 h-5 w-5" /> Provision New SKU
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Query SKU or Name..." 
            className="pl-12 h-14 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-600 rounded-2xl" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-14 bg-slate-900/50 border-slate-800 text-white rounded-2xl">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <SelectValue placeholder="All Clusters" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white">
            <SelectItem value="all">All Clusters</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-slate-800 bg-slate-900/30 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest pl-8 h-14">Identity</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-14">Cluster</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-14">Unit Value</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest h-14">Payload Status</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest text-right pr-8 h-14">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="border-slate-800/50 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="pl-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{product.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{product.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-950 border-slate-800 text-slate-400 text-[9px] uppercase font-bold tracking-wider rounded-lg px-2">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-white font-bold">
                      ${(product.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-2 w-16 rounded-full overflow-hidden bg-slate-800",
                          (product.stockQuantity || 0) < 10 ? "border-rose-500/20" : ""
                        )}>
                           <div className={cn(
                             "h-full transition-all duration-500",
                             (product.stockQuantity || 0) < 10 ? "bg-rose-500 w-[20%]" : "bg-emerald-500 w-[80%]"
                           )} />
                        </div>
                        <span className={cn(
                          "text-xs font-bold font-mono",
                          (product.stockQuantity || 0) < 10 ? "text-rose-500" : "text-slate-400"
                        )}>
                          {product.stockQuantity || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white" onClick={() => handleOpenDialog(product)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-rose-500/10 text-rose-500" onClick={() => {
                          const docRef = doc(db!, "products", product.id);
                          deleteDocumentNonBlocking(docRef);
                          toast({ title: "Deprovisioned", variant: "destructive" });
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32 text-slate-600">
                    <Boxes className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p className="font-medium italic">No data clusters found.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800 text-white rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight uppercase">
              {editingProduct ? "Modify Cluster" : "Provision Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Node Name</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-900 border-slate-800 h-12 rounded-xl focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Registry SKU</Label>
                <Input 
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="bg-slate-900 border-slate-800 h-12 rounded-xl font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Data Cluster</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="bg-slate-900 border-slate-800 h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Base Cost ($)</Label>
                <Input 
                  type="number" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="bg-slate-900 border-slate-800 h-12 rounded-xl font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Initial Stock</Label>
                <Input 
                  type="number" 
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
                  className="bg-slate-900 border-slate-800 h-12 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-500 hover:text-white hover:bg-slate-900">Cancel</Button>
            <Button onClick={handleSave} className="bg-primary font-bold rounded-xl px-8 h-12 shadow-lg hover:shadow-primary/20">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {editingProduct ? "Apply Delta" : "Deploy SKU"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
