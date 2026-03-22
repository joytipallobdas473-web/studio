
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2, Loader2, Filter, Boxes, CheckCircle2 } from "lucide-react";
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
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary" />
             <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Logistics Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Inventory Hub</h1>
          <p className="text-slate-500 font-medium text-sm tracking-wide">Central product registry and stock orchestration.</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="w-full md:w-auto h-14 md:h-16 px-10 rounded-2xl bg-primary text-white font-black shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-xs"
        >
          <Plus className="mr-3 h-6 w-6" /> Provision SKU
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Query SKU Identity or Payload Name..." 
            className="pl-16 h-14 md:h-16 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl md:rounded-[1.5rem] focus:ring-primary text-sm md:text-base font-medium" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-14 md:h-16 bg-white border-slate-200 text-slate-900 rounded-2xl md:rounded-[1.5rem] px-6">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-slate-400" />
              <SelectValue placeholder="All Clusters" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-2xl">
            <SelectItem value="all" className="font-bold uppercase tracking-widest text-[10px]">All Clusters</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-bold uppercase tracking-widest text-[10px]">{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block border-none bg-white rounded-[2.5rem] overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 h-20">
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
                  <TableRow key={product.id} className="border-slate-50 hover:bg-slate-50/50 transition-all group h-24">
                    <TableCell className="pl-10">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-slate-900 text-sm uppercase tracking-tight italic">{product.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <div className="h-1 w-1 rounded-full bg-slate-200" />
                           {product.sku}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50 border-slate-100 text-slate-500 text-[9px] uppercase font-black tracking-widest rounded-xl px-3 py-1">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-primary font-black">
                      ${(product.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-2 w-24 rounded-full overflow-hidden bg-slate-100",
                          (product.stockQuantity || 0) < 10 ? "bg-rose-100" : ""
                        )}>
                           <div className={cn(
                             "h-full transition-all duration-1000",
                             (product.stockQuantity || 0) < 10 ? "bg-rose-500 w-[15%]" : "bg-emerald-500 w-[85%]"
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
                        <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-primary" onClick={() => handleOpenDialog(product)}>
                          <Edit2 className="h-5 w-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl hover:bg-rose-50 text-rose-500" onClick={() => {
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
                  <TableCell colSpan={5} className="text-center py-40 text-slate-400">
                    <Boxes className="h-20 w-20 mx-auto mb-6 opacity-5 animate-pulse" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs italic">Awaiting data cluster provision...</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Grid View */}
      <div className="md:hidden space-y-4">
        {filteredProducts.length ? (
          filteredProducts.map((product) => (
            <Card key={product.id} className="border-none bg-white rounded-3xl shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-base uppercase italic tracking-tight leading-none">{product.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{product.sku}</p>
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-100 px-3 py-1 rounded-xl">
                  {product.category}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Density</p>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full", (product.stockQuantity || 0) < 10 ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
                    <span className={cn("text-sm font-black font-mono", (product.stockQuantity || 0) < 10 ? "text-rose-500" : "text-emerald-500")}>
                      {product.stockQuantity || 0}
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valuation</p>
                  <p className="text-sm font-black text-primary font-mono">${(product.price || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 h-12 rounded-2xl bg-slate-50 text-slate-600 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-100" onClick={() => handleOpenDialog(product)}>
                   <Edit2 className="h-4 w-4 mr-2" /> Protocol
                </Button>
                <Button className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100" onClick={() => {
                  const docRef = doc(db!, "products", product.id);
                  deleteDocumentNonBlocking(docRef);
                  toast({ title: "Node Deprovisioned", variant: "destructive" });
                }}>
                   <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl text-slate-400 italic font-black uppercase text-[10px] tracking-widest">
            Cluster empty...
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] bg-white border-none text-slate-900 rounded-[2.5rem] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-primary">
              {editingProduct ? "Modify SKU Node" : "Provision Cluster"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 md:gap-8 py-6 md:py-10">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">Identity Tag</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-50 border-none h-14 rounded-2xl focus:ring-primary text-base font-medium"
                placeholder="Item designation..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">Registry SKU</Label>
                <Input 
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="bg-slate-50 border-none h-14 rounded-2xl font-mono uppercase text-primary font-bold"
                  placeholder="SKU-XXXX-YY"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">Node Sector</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="bg-slate-50 border-none h-14 rounded-2xl px-5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-100 text-slate-900 rounded-2xl">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="font-bold uppercase tracking-widest text-[10px]">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">Unit Val ($)</Label>
                <Input 
                  type="number" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="bg-slate-50 border-none h-14 rounded-2xl font-mono text-emerald-600 font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">Density</Label>
                <Input 
                  type="number" 
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
                  className="bg-slate-50 border-none h-14 rounded-2xl font-mono text-blue-600 font-bold"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col md:flex-row gap-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="w-full md:w-auto h-14 px-8 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 font-bold uppercase tracking-widest">Abort</Button>
            <Button onClick={handleSave} className="w-full md:w-auto bg-primary h-14 px-10 rounded-2xl text-white font-black shadow-lg uppercase tracking-widest hover:scale-105 transition-all">
              <CheckCircle2 className="mr-3 h-6 w-6" />
              {editingProduct ? "Apply Protocol" : "Initialize Node"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
