
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2, Loader2, Filter, CheckCircle2, ImageIcon, Camera, CameraOff, Sparkles, Globe, X, Box, Upload, TrendingDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Electronics", "Apparel", "Grocery", "Office Supplies"];
const MASTER_ADMIN_UID = "j96izCkggNcL002AHiJjzGb18Bf2";

export default function InventoryControl() {
  const db = useFirestore();
  const { user } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
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
  
  const initialFormState = {
    name: "",
    sku: "",
    price: "",
    mrp: "",
    stockQuantity: "0",
    category: "Electronics",
    description: "",
    imageUrl: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        price: (product.price || 0).toString(),
        mrp: (product.mrp || product.price || 0).toString(),
        stockQuantity: (product.stockQuantity || 0).toString(),
        category: product.category || "Electronics",
        description: product.description || "",
        imageUrl: product.imageUrl || ""
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormState);
    }
    setIsDialogOpen(true);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { exact: "environment" } } 
      });
      setHasCameraPermission(true);
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        setIsCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
        }, 100);
      } catch (fallbackError) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to capture product photos.',
        });
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
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
        const dataUri = canvas.toDataURL('image/jpeg');
        setFormData({ ...formData, imageUrl: dataUri });
        stopCamera();
        toast({ title: "Visual ID Captured" });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
        toast({ title: "Stock Photo Loaded" });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (!isDialogOpen) stopCamera();
  }, [isDialogOpen]);

  const handleSave = () => {
    if (!db) return;

    const priceNum = parseFloat(formData.price);
    const mrpNum = parseFloat(formData.mrp) || priceNum;
    const stockNum = parseInt(formData.stockQuantity);

    if (!formData.name.trim() || isNaN(priceNum) || isNaN(stockNum)) {
      toast({ title: "Validation Failure", description: "Critical data missing.", variant: "destructive" });
      return;
    }

    const productData = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      price: priceNum,
      mrp: mrpNum,
      stockQuantity: stockNum,
      category: formData.category,
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim() || `https://picsum.photos/seed/${formData.sku || Date.now()}/600/400`,
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

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let list = [...products].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    
    if (filterCategory !== "all") list = list.filter(p => p.category === filterCategory);
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary" />
             <span className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">Logistics Engine</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Inventory Hub</h1>
          <p className="text-muted-foreground font-medium text-sm tracking-wide">Central product registry and stock orchestration.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="h-14 w-full md:w-auto px-10 rounded-2xl bg-primary text-background font-black shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-xs">
          <Plus className="mr-3 h-6 w-6" /> Provision SKU
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className="md:col-span-3 relative">
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
          <SelectTrigger className="h-14 glass-card border-white/10 text-white rounded-2xl">
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
      </div>

      {filteredProducts.length > 0 ? (
        <>
          <Card className="hidden md:block border-none glass-card rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="h-20 border-white/5">
                    <TableHead className="pl-10 uppercase text-[10px] font-black tracking-widest text-muted-foreground">Identity Package</TableHead>
                    <TableHead className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Cluster</TableHead>
                    <TableHead className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Valuation (MRP/Offer)</TableHead>
                    <TableHead className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Density</TableHead>
                    <TableHead className="text-right pr-10 uppercase text-[10px] font-black tracking-widest text-muted-foreground">Protocol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="h-24 hover:bg-white/5 transition-all group border-white/5">
                      <TableCell className="pl-10">
                        <div className="flex items-center gap-6">
                          <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                            <img 
                              src={product.imageUrl || `https://picsum.photos/seed/${product.sku}/100/100`} 
                              alt={product.name} 
                              className="h-full w-full object-cover" 
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-white text-sm uppercase italic">{product.name}</span>
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
                            <span className="text-[10px] text-muted-foreground line-through decoration-rose-500/50">₹{(product.mrp || product.price || 0).toFixed(2)}</span>
                            <span className="font-mono text-sm text-primary font-black">₹{(product.price || 0).toFixed(2)}</span>
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
                          <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleOpenDialog(product)}>
                            <Edit2 className="h-5 w-5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl text-rose-500 hover:bg-rose-500/10" onClick={() => handleDelete(product)}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="border-none glass-card rounded-3xl overflow-hidden p-6 relative group">
                <div className="flex gap-6 items-start">
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                    <img 
                      src={product.imageUrl || `https://picsum.photos/seed/${product.sku}/100/100`} 
                      alt={product.name} 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-black text-white text-base uppercase italic truncate">{product.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{product.sku}</span>
                      </div>
                      <Badge variant="outline" className="text-[8px] uppercase font-black px-2 py-0.5 rounded-lg border-white/10 text-primary">
                        {product.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground line-through decoration-rose-500/30">₹{(product.mrp || product.price || 0).toFixed(2)}</span>
                          <span className="font-mono text-sm text-primary font-black">₹{(product.price || 0).toFixed(2)}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <Box className={cn("h-3 w-3", (product.stockQuantity || 0) < 10 ? "text-rose-500" : "text-emerald-500")} />
                         <span className={cn("text-xs font-black font-mono", (product.stockQuantity || 0) < 10 ? "text-rose-500" : "text-emerald-500")}>
                           {product.stockQuantity || 0}
                         </span>
                       </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="flex-1 h-10 rounded-xl bg-white/5 border-white/10 text-white font-black uppercase tracking-widest text-[9px]" onClick={() => handleOpenDialog(product)}>
                        <Edit2 className="h-3.5 w-3.5 mr-2 text-primary" /> Modify
                      </Button>
                      <Button variant="outline" className="h-10 w-10 rounded-xl bg-white/5 border-white/10 text-rose-500 flex items-center justify-center p-0" onClick={() => handleDelete(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-32 glass-card rounded-[2.5rem] border border-dashed border-white/10">
           <Globe className="h-20 w-20 mx-auto mb-6 text-primary animate-spin-slow opacity-20" />
           <p className="text-white font-black uppercase italic tracking-tighter text-sm">No SKU Nodes Detected</p>
           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">Adjust your cluster filters or query signature.</p>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] p-10 glass-card border-none shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic text-primary">
              {editingProduct ? "Modify SKU Node" : "Provision Cluster"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity Tag</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-white/5 border-none text-white font-bold" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registry SKU</Label>
                  <Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="h-14 rounded-2xl font-mono uppercase font-bold bg-white/5 border-none text-white" />
                </div>
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center block">Visual ID Capture</Label>
                 <div className="aspect-video relative rounded-[1.5rem] bg-black overflow-hidden flex items-center justify-center border border-white/10">
                   {isCameraActive ? (
                     <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                   ) : formData.imageUrl ? (
                     <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                     <div className="flex flex-col items-center gap-4">
                        <ImageIcon className="h-10 w-10 text-white/10" />
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Awaiting Visual Signature</p>
                     </div>
                   )}
                 </div>

                 <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    {!isCameraActive ? (
                      <>
                        <Button variant="secondary" className="flex-1 h-12 bg-primary text-background rounded-xl font-black uppercase text-[10px]" onClick={startCamera}>
                          <Camera className="h-4 w-4 mr-2" /> Start Lens
                        </Button>
                        <Button variant="outline" className="flex-1 h-12 bg-white/5 border-white/10 text-white rounded-xl font-black uppercase text-[10px]" onClick={triggerFileUpload}>
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
                        <Button className="flex-1 h-12 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px]" onClick={capturePhoto}>
                          <Sparkles className="h-4 w-4 mr-2" /> Capture Frame
                        </Button>
                        <Button variant="destructive" className="flex-1 h-12 rounded-xl font-black uppercase text-[10px]" onClick={stopCamera}>
                          <CameraOff className="h-4 w-4 mr-2" /> Abort Lens
                        </Button>
                      </>
                    )}
                 </div>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sector</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-none text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-card text-white">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-rose-400">MRP (₹)</Label>
                <Input type="number" value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: e.target.value})} className="h-14 rounded-2xl bg-white/5 border-none font-mono text-white" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-emerald-400">Offer (₹)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="h-14 rounded-2xl bg-white/5 border-none font-mono text-white" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Density</Label>
                <Input type="number" value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} className="h-14 rounded-2xl bg-white/5 border-none font-mono text-white" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-8 rounded-2xl uppercase tracking-widest font-bold text-muted-foreground hover:text-white">Abort</Button>
            <Button onClick={handleSave} className="bg-primary text-background h-14 px-10 rounded-2xl font-black uppercase tracking-widest">
              <CheckCircle2 className="mr-3 h-6 w-6" /> Commit SKU
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
