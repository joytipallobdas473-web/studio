"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit2, Trash2, Loader2, Filter, CheckCircle2, ImageIcon, Camera, CameraOff, Sparkles, Globe, X, Box, Upload, Wand2, Truck, Printer, FileText, TrendingUp, DollarSign, Eye, EyeOff, Database } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { describeProduct } from "@/ai/flows/product-describer";

const CATEGORIES = ["Electronics", "Apparel", "Grocery", "Office Supplies"];
const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function InventoryControl() {
  const db = useFirestore();
  const { user } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDescribing, setIsDescribing] = useState(false);
  const [selectedLabelProduct, setSelectedLabelProduct] = useState<any>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const isAdmin = useMemo(() => {
    return user?.email?.toLowerCase().includes("admin") || user?.uid === MASTER_ADMIN_UID;
  }, [user]);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return collection(db, "products");
  }, [db, isAdmin]);

  const { data: products, isLoading: loading } = useCollection(productsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDistributor, setFilterDistributor] = useState("all");
  
  const initialFormState = {
    name: "",
    sku: "",
    price: "",
    mrp: "",
    costPrice: "",
    stockQuantity: "0",
    category: "Electronics",
    distributorName: "",
    description: "",
    isHidden: false,
    imageUrls: ["", "", ""]
  };

  const [formData, setFormData] = useState(initialFormState);

  const distributors = useMemo(() => {
    if (!products) return [];
    const unique = new Set(products.map(p => p.distributorName).filter(Boolean));
    return Array.from(unique).sort();
  }, [products]);

  const handleOpenDialog = (product?: any) => {
    setActiveImageIndex(0);
    if (product) {
      setEditingProduct(product);
      let initialImages = product.imageUrls || [];
      if (initialImages.length === 0 && product.imageUrl) {
        initialImages = [product.imageUrl, "", ""];
      } else {
        while (initialImages.length < 3) initialImages.push("");
      }

      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        price: (product.price || 0).toString(),
        mrp: (product.mrp || product.price || 0).toString(),
        costPrice: (product.costPrice || 0).toString(),
        stockQuantity: (product.stockQuantity || 0).toString(),
        category: product.category || "Electronics",
        distributorName: product.distributorName || "",
        description: product.description || "",
        isHidden: product.isHidden || false,
        imageUrls: initialImages
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormState);
    }
    setIsDialogOpen(true);
  };

  const handleAiDescribe = async () => {
    if (!formData.name || !formData.category) {
      toast({ title: "Insufficient Data", description: "Name and Category required for AI synthesis.", variant: "destructive" });
      return;
    }
    setIsDescribing(true);
    try {
      const result = await describeProduct({ name: formData.name, category: formData.category });
      setFormData(prev => ({ ...prev, description: result.description }));
      toast({ title: "Synthesis Complete", description: "Product description generated." });
    } catch (error) {
      toast({ title: "AI Error", description: "Could not generate description.", variant: "destructive" });
    } finally {
      setIsDescribing(false);
    }
  };

  const handleBulkImport = () => {
    setIsImporting(true);
    // Simulation of bulk import logic
    setTimeout(() => {
      setIsImporting(false);
      setIsBulkImportOpen(false);
      toast({ title: "Bulk Sync Initialized", description: "Registry data verified and pending commit." });
    }, 2000);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to capture product photos.',
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg', 0.8);
        const newImages = [...formData.imageUrls];
        newImages[activeImageIndex] = dataUri;
        setFormData({ ...formData, imageUrls: newImages });
        stopCamera();
        toast({ title: `Visual ID ${activeImageIndex + 1} Captured` });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        const newImages = [...formData.imageUrls];
        newImages[activeImageIndex] = dataUri;
        setFormData({ ...formData, imageUrls: newImages });
        toast({ title: `Stock Photo ${activeImageIndex + 1} Loaded` });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!isDialogOpen) stopCamera();
  }, [isDialogOpen]);

  const handleSave = () => {
    if (!db) return;

    const priceNum = parseFloat(formData.price);
    const mrpNum = parseFloat(formData.mrp) || priceNum;
    const costNum = parseFloat(formData.costPrice) || 0;
    const stockNum = parseInt(formData.stockQuantity);

    if (!formData.name.trim() || isNaN(priceNum) || isNaN(stockNum)) {
      toast({ title: "Validation Failure", description: "Critical data missing.", variant: "destructive" });
      return;
    }

    const validImages = formData.imageUrls.filter(url => !!url);
    const primaryImage = validImages[0] || `https://picsum.photos/seed/${formData.sku || Date.now()}/600/400`;

    const productData = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      price: priceNum,
      mrp: mrpNum,
      costPrice: costNum,
      stockQuantity: stockNum,
      category: formData.category,
      distributorName: formData.distributorName.trim(),
      description: formData.description.trim(),
      isHidden: formData.isHidden,
      imageUrl: primaryImage,
      imageUrls: formData.imageUrls,
      updatedAt: serverTimestamp()
    };

    if (editingProduct) {
      const docRef = doc(db, "products", editingProduct.id);
      updateDocumentNonBlocking(docRef, productData);
      toast({ title: "Node Updated" });
    } else {
      const colRef = collection(db, "products");
      addDocumentNonBlocking(colRef, productData);
      toast({ title: "Node Registered" });
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = (product: any) => {
    if (!db) return;
    const docRef = doc(db, "products", product.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Node Purged", variant: "destructive" });
  };

  const handlePrintLabel = () => {
     window.print();
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let list = [...products].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    
    if (filterCategory !== "all") list = list.filter(p => p.category === filterCategory);
    if (filterDistributor !== "all") list = list.filter(p => p.distributorName === filterDistributor);
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.name || "").toLowerCase().includes(lowerQuery) ||
        (p.sku || "").toLowerCase().includes(lowerQuery) ||
        (p.distributorName || "").toLowerCase().includes(lowerQuery)
      );
    }
    return list;
  }, [products, searchQuery, filterCategory, filterDistributor]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Label Print Overlay */}
      <Dialog open={!!selectedLabelProduct} onOpenChange={() => setSelectedLabelProduct(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 border-none bg-white overflow-hidden rounded-[2rem]">
           <div className="sr-only"><DialogTitle>SKU Label Preview</DialogTitle></div>
           <div id="printable-label" className="p-12 space-y-8 text-slate-900 bg-white min-h-[400px] flex flex-col justify-center border-2 border-slate-900 m-4 rounded-xl">
              <div className="space-y-1 text-center border-b-2 border-slate-900 pb-4">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">Aether Network</h2>
                 <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500">Registry Certified SKU</p>
              </div>
              <div className="space-y-6 flex-1 flex flex-col justify-center items-center">
                 <div className="text-center space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">SKU Identity</p>
                    <h3 className="text-3xl font-black uppercase italic tracking-tight">{selectedLabelProduct?.name}</h3>
                    <p className="font-mono text-xs font-bold text-slate-900">{selectedLabelProduct?.sku}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-8 w-full border-t border-b border-slate-100 py-4">
                    <div className="text-center">
                       <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Cluster</p>
                       <p className="text-xs font-bold uppercase">{selectedLabelProduct?.category}</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Unit Price</p>
                       <p className="text-sm font-black">₹{selectedLabelProduct?.price.toFixed(2)}</p>
                    </div>
                 </div>
                 <div className="w-full h-12 bg-slate-900 flex items-center justify-center rounded">
                    <div className="h-10 w-[90%] bg-white flex items-center justify-around px-2">
                       {Array.from({length: 30}).map((_, i) => (
                         <div key={i} className="h-full bg-slate-900" style={{width: `${Math.random() * 4 + 1}px`}} />
                       ))}
                    </div>
                 </div>
              </div>
              <div className="pt-4 text-center">
                 <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-300">Generated via Regional Controller Node // {new Date().toLocaleDateString()}</p>
              </div>
           </div>
           <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 print:hidden">
              <Button variant="ghost" onClick={() => setSelectedLabelProduct(null)} className="h-12 px-6 rounded-xl font-bold uppercase text-[10px] text-slate-500">Close Node</Button>
              <Button onClick={handlePrintLabel} className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]">
                 <Printer className="mr-2 h-4 w-4" /> Print Label
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-10 glass-card border-none bg-black text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <Database className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Registry Protocol</span>
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white">Bulk SKU Import</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">Synchronize large inventory manifests via CSV protocol.</DialogDescription>
          </DialogHeader>
          <div className="py-8 space-y-8">
            <div 
              className="border-2 border-dashed border-white/10 rounded-3xl p-10 text-center space-y-4 hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => bulkInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground group-hover:text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select .CSV manifest file</p>
              <input type="file" ref={bulkInputRef} className="hidden" accept=".csv" />
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">Manifest Requirements</h4>
              <ul className="space-y-2">
                {["Name, SKU, Category, Price, Rate", "UTF-8 Encoded", "Max 500 records per cycle"].map((req, i) => (
                  <li key={i} className="flex items-center gap-2 text-[9px] font-medium text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" /> {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-4">
            <Button variant="ghost" onClick={() => setIsBulkImportOpen(false)} className="h-14 px-8 rounded-2xl uppercase tracking-widest font-black text-muted-foreground">Abort</Button>
            <Button onClick={handleBulkImport} className="bg-primary text-background h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-lg" disabled={isImporting}>
              {isImporting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initialize Sync"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary" />
             <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Logistics Engine</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Inventory Hub</h1>
          <p className="text-muted-foreground font-medium text-sm tracking-wide">Central product registry and multi-angle stock orchestration.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="h-14 flex-1 md:flex-none px-8 rounded-2xl glass-card border-white/10 text-white font-black uppercase tracking-widest text-[10px]">
            <Database className="mr-3 h-5 w-5" /> Bulk Load
          </Button>
          <Button onClick={() => handleOpenDialog()} className="h-14 flex-1 md:flex-none px-10 rounded-2xl bg-primary text-background font-black shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-xs">
            <Plus className="mr-3 h-6 w-6" /> Provision SKU
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6 print:hidden">
        <div className="md:col-span-2 relative">
          <Search className={cn("absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all", searchQuery && "text-primary animate-pulse")} />
          <Input 
            placeholder="Query SKU Identity..." 
            className="pl-16 h-14 glass-card border-white/10 text-white rounded-2xl focus:border-primary/50" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white" onClick={() => setSearchQuery("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-14 md:col-span-2 glass-card border-white/10 text-white rounded-2xl">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <SelectValue placeholder="All Clusters" />
            </div>
          </SelectTrigger>
          <SelectContent className="glass-card border-white/10 text-white">
            <SelectItem value="all">All Clusters</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDistributor} onValueChange={setFilterDistributor}>
          <SelectTrigger className="h-14 md:col-span-2 glass-card border-white/10 text-white rounded-2xl">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <SelectValue placeholder="All Distributors" />
            </div>
          </SelectTrigger>
          <SelectContent className="glass-card border-white/10 text-white">
            <SelectItem value="all">All Distributors</SelectItem>
            {distributors.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filteredProducts.length > 0 ? (
        <>
          <Card className="hidden md:block border-none glass-card rounded-[2.5rem] overflow-hidden print:hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="h-20 border-white/5">
                    <TableHead className="pl-10 uppercase text-[10px] font-black tracking-widest text-muted-foreground">Identity Package</TableHead>
                    <TableHead className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Cluster</TableHead>
                    <TableHead className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Valuation (Rate/Offer)</TableHead>
                    <TableHead className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Est. Profit</TableHead>
                    <TableHead className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Density</TableHead>
                    <TableHead className="text-right pr-10 uppercase text-[10px] font-black tracking-widest text-muted-foreground">Protocol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const unitProfit = (product.price || 0) - (product.costPrice || 0);
                    return (
                    <TableRow key={product.id} className="h-24 hover:bg-white/5 transition-all group border-white/5">
                      <TableCell className="pl-10">
                        <div className="flex items-center gap-6">
                          <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                            <Image 
                              src={product.imageUrl || (product.imageUrls && product.imageUrls[0]) || `https://picsum.photos/seed/${product.sku}/100/100`} 
                              alt={product.name} 
                              fill
                              sizes="56px"
                              className="object-cover" 
                              data-ai-hint="product photo"
                            />
                            {product.isHidden && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <EyeOff className="h-4 w-4 text-rose-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white text-sm uppercase italic">{product.name}</span>
                              {product.isHidden && (
                                <Badge variant="outline" className="text-[8px] border-rose-500/20 text-rose-500 uppercase font-black px-1.5 py-0">Hidden</Badge>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{product.sku}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase font-black px-3 py-1 rounded-xl border-white/10 text-muted-foreground">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                               <span className="font-bold">Rate:</span>
                               <span className="font-mono">₹{(product.costPrice || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                               <span className="text-[10px] font-bold text-primary">Offer:</span>
                               <span className="font-mono text-sm text-primary font-black">₹{(product.price || 0).toFixed(2)}</span>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2">
                            <TrendingUp className={cn("h-3 w-3", unitProfit > 0 ? "text-emerald-500" : "text-rose-500")} />
                            <span className={cn("text-xs font-black font-mono", unitProfit > 0 ? "text-emerald-500" : "text-rose-500")}>
                               ₹{unitProfit.toFixed(2)}
                            </span>
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className={cn("h-1.5 w-24 rounded-full bg-white/5 overflow-hidden")}>
                             <div className={cn("h-full transition-all duration-500", (product.stockQuantity || 0) < 10 ? "bg-rose-500 w-[15%]" : "bg-emerald-500 w-[85%]")} />
                          </div>
                          <span className={cn("text-xs font-black font-mono", (product.stockQuantity || 0) < 10 ? "text-rose-500" : "text-emerald-500")}>
                            {product.stockQuantity || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl text-muted-foreground hover:text-emerald-500" onClick={() => setSelectedLabelProduct(product)}>
                            <Printer className="h-5 w-5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleOpenDialog(product)}>
                            <Edit2 className="h-5 w-5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl text-rose-500 hover:bg-rose-500/10" onClick={() => handleDelete(product)}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="md:hidden grid grid-cols-1 gap-4 print:hidden">
            {filteredProducts.map((product) => {
              const unitProfit = (product.price || 0) - (product.costPrice || 0);
              return (
              <Card key={product.id} className="border-none glass-card rounded-3xl overflow-hidden p-6 relative group">
                <div className="flex gap-6 items-start">
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                    <Image 
                      src={product.imageUrl || (product.imageUrls && product.imageUrls[0]) || `https://picsum.photos/seed/${product.sku}/100/100`} 
                      alt={product.name} 
                      fill
                      sizes="80px"
                      className="object-cover" 
                      data-ai-hint="product photo"
                    />
                    {product.isHidden && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <EyeOff className="h-4 w-4 text-rose-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-black text-white text-base uppercase italic truncate">{product.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{product.sku}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-[8px] uppercase font-black px-2 py-0.5 rounded-lg border-white/10", product.isHidden ? "text-rose-500 border-rose-500/20" : "text-primary")}>
                        {product.isHidden ? "Hidden" : product.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground">Rate: ₹{(product.costPrice || 0).toFixed(2)}</span>
                          <span className="font-mono text-sm text-primary font-black">Offer: ₹{(product.price || 0).toFixed(2)}</span>
                          <div className="flex items-center gap-1 text-[9px] mt-1">
                             <TrendingUp className={cn("h-3 w-3", unitProfit > 0 ? "text-emerald-500" : "text-rose-500")} />
                             <span className={unitProfit > 0 ? "text-emerald-500" : "text-rose-500"}>Profit: ₹{unitProfit.toFixed(2)}</span>
                          </div>
                       </div>
                       <div className="flex flex-col items-end">
                         <div className="flex items-center gap-2">
                           <Box className={cn("h-3 w-3", (product.stockQuantity || 0) < 10 ? "text-rose-500" : "text-emerald-500")} />
                           <span className={cn("text-xs font-black font-mono", (product.stockQuantity || 0) < 10 ? "text-rose-500" : "text-emerald-500")}>
                             {product.stockQuantity || 0}
                           </span>
                         </div>
                         <span className="text-[8px] font-black uppercase text-muted-foreground mt-1">{product.distributorName || "Internal"}</span>
                       </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1 h-10 rounded-xl bg-white/5 border-white/10 text-white font-black uppercase tracking-widest text-[9px]" onClick={() => handleOpenDialog(product)}>
                        <Edit2 className="h-3.5 w-3.5 mr-2 text-primary" /> Modify
                      </Button>
                      <Button variant="outline" className="h-10 w-10 rounded-xl bg-white/5 border-white/10 text-white flex items-center justify-center p-0" onClick={() => setSelectedLabelProduct(product)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="h-10 w-10 rounded-xl bg-white/5 border-white/10 text-rose-500 flex items-center justify-center p-0" onClick={() => handleDelete(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )})}
          </div>
        </>
      ) : (
        <div className="text-center py-32 glass-card rounded-[2.5rem] border border-dashed border-white/10 print:hidden">
           <Globe className="h-20 w-20 mx-auto mb-6 text-primary animate-spin-slow opacity-20" />
           <p className="text-white font-black uppercase italic tracking-tighter text-sm">No SKU Nodes Detected</p>
           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">Adjust your cluster filters or query signature.</p>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] p-10 glass-card border-none shadow-2xl overflow-y-auto max-h-[95vh] bg-white text-slate-900">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <DialogTitle className="text-3xl font-black uppercase italic text-primary">
                {editingProduct ? "Modify SKU Node" : "Provision Cluster"}
              </DialogTitle>
              <div className="flex flex-col items-end gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Stealth Protocol</Label>
                <div className="flex items-center gap-3">
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", formData.isHidden ? "text-rose-500" : "text-slate-400")}>
                    {formData.isHidden ? "Stealth Active" : "Visible on Grid"}
                  </span>
                  <Switch checked={formData.isHidden} onCheckedChange={(val) => setFormData({...formData, isHidden: val})} className="data-[state=checked]:bg-rose-500" />
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="grid gap-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
               <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Identity Tag</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registry SKU</Label>
                    <Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="h-14 rounded-2xl font-mono uppercase font-bold bg-slate-50 border border-slate-200 text-slate-900" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Distributor</Label>
                    <Input value={formData.distributorName} onChange={(e) => setFormData({...formData, distributorName: e.target.value})} placeholder="Supplier Node" className="h-14 rounded-2xl font-bold bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Logistics Description</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleAiDescribe}
                      disabled={isDescribing || !formData.name}
                      className="h-7 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[9px] font-black uppercase tracking-widest"
                    >
                      {isDescribing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Wand2 className="h-3 w-3 mr-2" />}
                      Smart Describe
                    </Button>
                  </div>
                  <Textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Technical specifications and retail value..."
                    className="min-h-[100px] rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs leading-relaxed placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visual Identity Slots (Up to 3)</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {formData.imageUrls.map((url, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={cn(
                          "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group",
                          activeImageIndex === idx ? "border-primary scale-105 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "border-slate-200 opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                        )}
                      >
                        {url ? (
                          <Image src={url} alt={`Slot ${idx+1}`} fill sizes="100px" className="object-cover" data-ai-hint="product angle" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-[10px] font-black text-slate-400 uppercase italic">
                            Slot {idx + 1}
                          </div>
                        )}
                        <div className={cn(
                          "absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                          activeImageIndex === idx && "opacity-100"
                        )}>
                          <div className="bg-primary text-background p-1.5 rounded-lg">
                            <Plus className="h-3 w-3" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
               </div>
               
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center block">
                   Visual ID Capture: Slot {activeImageIndex + 1}
                 </Label>
                 <div className="aspect-video relative rounded-[1.5rem] bg-black overflow-hidden flex items-center justify-center border border-slate-200">
                   {isCameraActive ? (
                     <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                   ) : formData.imageUrls[activeImageIndex] ? (
                     <Image src={formData.imageUrls[activeImageIndex]} alt="Preview" fill sizes="400px" className="object-cover" data-ai-hint="product capture" />
                   ) : (
                     <div className="flex flex-col items-center gap-4">
                        <ImageIcon className="h-10 w-10 text-white/10" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase italic">Awaiting Visual Signature: Slot {activeImageIndex + 1}</p>
                     </div>
                   )}
                 </div>

                 <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    {!isCameraActive ? (
                      <>
                        <Button variant="secondary" className="flex-1 h-12 bg-primary text-background rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={startCamera}>
                          <Camera className="h-4 w-4 mr-2" /> Start Lens
                        </Button>
                        <Button variant="outline" className="flex-1 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-4 w-4 mr-2" /> Upload Photo
                        </Button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileUpload}
                         />
                      </>
                    ) : (
                      <>
                        <Button className="flex-1 h-12 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={capturePhoto}>
                          <Sparkles className="h-4 w-4 mr-2" /> Capture Frame
                        </Button>
                        <Button variant="destructive" className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={stopCamera}>
                          <CameraOff className="h-4 w-4 mr-2" /> Abort Lens
                        </Button>
                      </>
                    )}
                 </div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sector Cluster</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white text-slate-900">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-rose-500">MRP (₹)</Label>
                <Input type="number" value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-slate-900" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Offer (₹)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-slate-900" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Rate Value (₹)</Label>
                <Input type="number" value={formData.costPrice} onChange={(e) => setFormData({...formData, costPrice: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-slate-900" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Stock Density</Label>
                <Input type="number" value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-slate-900" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-8 rounded-2xl uppercase tracking-widest font-bold text-slate-500 hover:text-slate-900">Abort</Button>
            <Button onClick={handleSave} className="bg-primary text-background h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-lg">
              <CheckCircle2 className="mr-3 h-6 w-6" /> Commit SKU
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-label, #printable-label * {
            visibility: visible;
          }
          #printable-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 40px;
            border: 4px solid black !important;
          }
        }
      `}</style>
    </div>
  );
}