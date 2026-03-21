"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2, Loader2, Filter, Boxes, CheckCircle2, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
      toast({ title: "Validation Protocol Failure", description: "Critical data missing.", variant: "destructive" });
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
      toast({ title: "Node Updated", description: "SKU configuration applied." });
    } else {
      const colRef = collection(db, "products");
      addDocumentNonBlocking(colRef, productData);
      toast({ title: "Node Registered", description: "New SKU added to cluster." });
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
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary" />
             <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Logistics Engine</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Inventory Engine</h1>
          <p className="text-slate-500 font-medium text-sm tracking-wide">Central product registry and real-time stock orchestration.</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="h-16 px-10 rounded-2xl bg-primary text-white font-black shadow-[0_15px_30px_rgba(var(--primary),0.3)] hover:scale-105 transition-all uppercase tracking-widest"
        >
          <Plus className="mr-3 h-6 w-6" /> Provision New SKU
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <Input 
            placeholder="Query SKU Identity or Payload Name..." 
            className="pl-16 h-16 bg-slate-950/50 border-white/5 text-white placeholder:text-slate-600 rounded-[1.5rem] focus:ring-primary text-base font-medium" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-16 bg-slate-950/50 border-white/5 text-white rounded-[1.5rem] px-6">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-slate-500" />
              <SelectValue placeholder="All Clusters" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <SelectItem value="all" className="font-bold uppercase tracking-widest text-[10px]">All Clusters</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-bold uppercase tracking-widest text-[10px]">{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-white/5 bg-slate-950/30 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="hover:bg-transparent border-white/5 h-20">
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em] pl-10">Identity Package</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Data Cluster</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Unit Value</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">Node Density</TableHead>
                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em] text-right pr-10">Protocol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="border-white/5 hover:bg-white/[0.03] transition-all group h-24">
                    <TableCell className="pl-10">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-white text-sm uppercase tracking-tight italic">{product.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           <div className="h-1 w-1 rounded-full bg-slate-800" />
                           {product.sku}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-black/40 border-white/5 text-slate-400 text-[9px] uppercase font-black tracking-widest rounded-xl px-3 py-1">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-primary font-black">
                      ${(product.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-2 w-24 rounded-full overflow-hidden bg-slate-900 border border-white/5",
                          (product.stockQuantity || 0) < 10 ? "border-rose-500/20" : ""
                        )}>
                           <div className={cn(
                             "h-full transition-all duration-1000",
                             (product.stockQuantity || 0) < 10 ? "bg-rose-500 w-[15%] shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-emerald-500 w-[85%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                           )} />
                        </div>
                        <span className={cn(
                          "text-xs font-black font-mono",
                          (product.stockQuantity || 0) < 10 ? "text-rose-500" : "text-emerald-500"
                        )}>
                          {product.stockQuantity || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white" onClick={() => handleOpenDialog(product)}>
                          <Edit2 className="h-5 w-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl hover:bg-rose-500/10 text-rose-500" onClick={() => {
                          const docRef = doc(db!, "products", product.id);
                          deleteDocumentNonBlocking(docRef);
                          toast({ title: "Node Deprovisioned", variant: "destructive" });
                        }}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-40 text-slate-600">
                    <Boxes className="h-20 w-20 mx-auto mb-6 opacity-5 animate-pulse" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs italic">Awaiting data cluster provision...</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-950 border-white/10 text-white rounded-[2.5rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">
              {editingProduct ? "Modify SKU Node" : "Provision Cluster"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-8 py-10">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 pl-1">Identity Tag</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-black/40 border-white/5 h-14 rounded-2xl focus:ring-primary text-base"
                placeholder="Item designation..."
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 pl-1">Registry SKU</Label>
                <Input 
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="bg-black/40 border-white/5 h-14 rounded-2xl font-mono uppercase text-primary font-bold"
                  placeholder="SKU-XXXX-YY"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 pl-1">Node Sector</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="bg-black/40 border-white/5 h-14 rounded-2xl px-5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-white/10 text-white rounded-2xl">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="font-bold uppercase tracking-widest text-[10px]">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 pl-1">Unit Valuation ($)</Label>
                <Input 
                  type="number" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="bg-black/40 border-white/5 h-14 rounded-2xl font-mono text-emerald-500 font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 pl-1">Initial Density</Label>
                <Input 
                  type="number" 
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
                  className="bg-black/40 border-white/5 h-14 rounded-2xl font-mono text-blue-500 font-bold"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-8 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest">Abort</Button>
            <Button onClick={handleSave} className="bg-primary h-14 px-10 rounded-2xl text-white font-black shadow-2xl uppercase tracking-widest hover:scale-105 transition-all">
              <CheckCircle2 className="mr-3 h-6 w-6" />
              {editingProduct ? "Apply Protocol" : "Initialize Node"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
