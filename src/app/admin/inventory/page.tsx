
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2, Loader2, Filter, Boxes, CheckCircle2, ImageIcon, Camera, CameraOff, Sparkles } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CATEGORIES = ["Electronics", "Apparel", "Grocery", "Office Supplies"];

export default function InventoryControl() {
  const db = useFirestore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
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

  useEffect(() => {
    if (!isDialogOpen) stopCamera();
  }, [isDialogOpen]);

  const handleSave = () => {
    if (!db) return;

    const priceNum = parseFloat(formData.price);
    const stockNum = parseInt(formData.stockQuantity);

    if (!formData.name.trim() || isNaN(priceNum) || isNaN(stockNum)) {
      toast({ title: "Validation Failure", description: "Critical data missing.", variant: "destructive" });
      return;
    }

    const productData = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      price: priceNum,
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
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Inventory Hub</h1>
          <p className="text-slate-500 font-medium text-sm tracking-wide">Central product registry and stock orchestration.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="h-14 px-10 rounded-2xl bg-primary text-white font-black shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-xs">
          <Plus className="mr-3 h-6 w-6" /> Provision SKU
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Query SKU Identity..." 
            className="pl-16 h-14 bg-white border-slate-200 text-slate-900 rounded-2xl" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-14 bg-white border-slate-200 text-slate-900 rounded-2xl">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-slate-400" />
              <SelectValue placeholder="All Clusters" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clusters</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="hidden md:block border-none bg-white rounded-[2.5rem] overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="h-20 border-slate-100">
                <TableHead className="pl-10 uppercase text-[10px] font-black tracking-widest">Identity Package</TableHead>
                <TableHead className="uppercase text-[10px] font-black tracking-widest">Cluster</TableHead>
                <TableHead className="uppercase text-[10px] font-black tracking-widest">Valuation</TableHead>
                <TableHead className="uppercase text-[10px] font-black tracking-widest">Density</TableHead>
                <TableHead className="text-right pr-10 uppercase text-[10px] font-black tracking-widest">Protocol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="h-24 hover:bg-slate-50 transition-all group border-slate-50">
                  <TableCell className="pl-10">
                    <div className="flex items-center gap-6">
                      <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                        <Image src={product.imageUrl || `https://picsum.photos/seed/${product.sku}/100/100`} alt={product.name} fill className="object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-sm uppercase italic">{product.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{product.sku}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] uppercase font-black px-3 py-1 rounded-xl">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-primary font-black">${(product.price || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className={cn("h-2 w-24 rounded-full bg-slate-100 overflow-hidden")}>
                         <div className={cn("h-full", (product.stockQuantity || 0) < 10 ? "bg-rose-500 w-[15%]" : "bg-emerald-500 w-[85%]")} />
                      </div>
                      <span className={cn("text-xs font-black font-mono", (product.stockQuantity || 0) < 10 ? "text-rose-500" : "text-emerald-500")}>
                        {product.stockQuantity || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                      <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl" onClick={() => handleOpenDialog(product)}>
                        <Edit2 className="h-5 w-5 text-slate-400 hover:text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-11 w-11 rounded-2xl" onClick={() => {
                        const docRef = doc(db!, "products", product.id);
                        deleteDocumentNonBlocking(docRef);
                        toast({ title: "Node Purged", variant: "destructive" });
                      }}>
                        <Trash2 className="h-5 w-5 text-rose-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] p-10 bg-white border-none shadow-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic text-primary">
              {editingProduct ? "Modify SKU Node" : "Provision Cluster"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Tag</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry SKU</Label>
                  <Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="h-14 rounded-2xl font-mono uppercase font-bold bg-slate-50 border-none" />
                </div>
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center block">Visual ID Capture</Label>
                 <div className="aspect-video relative rounded-[1.5rem] bg-slate-900 overflow-hidden flex items-center justify-center group">
                   {isCameraActive ? (
                     <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                   ) : formData.imageUrl ? (
                     <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                   ) : (
                     <ImageIcon className="h-10 w-10 text-white/20" />
                   )}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     {!isCameraActive ? (
                       <Button size="sm" className="bg-primary rounded-xl" onClick={startCamera}>
                         <Camera className="h-4 w-4 mr-2" /> Start Lens
                       </Button>
                     ) : (
                       <>
                        <Button size="sm" className="bg-emerald-500 rounded-xl" onClick={capturePhoto}>
                          <Sparkles className="h-4 w-4 mr-2" /> Capture
                        </Button>
                        <Button size="sm" variant="destructive" className="rounded-xl" onClick={stopCamera}>
                          <CameraOff className="h-4 w-4 mr-2" /> Abort
                        </Button>
                       </>
                     )}
                   </div>
                 </div>
                 {hasCameraPermission === false && (
                    <Alert variant="destructive" className="mt-4 rounded-2xl">
                        <AlertTitle className="text-xs font-black uppercase">Camera Required</AlertTitle>
                        <AlertDescription className="text-[10px]">Enable browser permissions for live capture.</AlertDescription>
                    </Alert>
                 )}
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sector</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Val ($)</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-mono" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Density</Label>
                <Input type="number" value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-mono" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 px-8 rounded-2xl uppercase tracking-widest font-bold">Abort</Button>
            <Button onClick={handleSave} className="bg-primary h-14 px-10 rounded-2xl text-white font-black uppercase tracking-widest">
              <CheckCircle2 className="mr-3 h-6 w-6" /> Commit SKU
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
