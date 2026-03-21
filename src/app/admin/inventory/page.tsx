
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function InventoryControl() {
  const [products, setProducts] = useState([
    { id: "1", name: "Logitech MX Master 3", category: "Electronics", sku: "LOG-MX3-001", mrp: 99.00, stock: 45 },
    { id: "2", name: "Dell 27 Monitor", category: "Electronics", sku: "DELL-P27-99", mrp: 289.50, stock: 12 },
    { id: "3", name: "Steelcase Leap V2", category: "Furniture", sku: "STL-LP-V2", mrp: 850.00, stock: 4 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Inventory & MRP Control</h1>
          <p className="text-muted-foreground text-sm">Add stock and manage pricing globally.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground font-bold">
              <Plus className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Global Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-xs">Name</Label>
                <Input id="name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sku" className="text-right text-xs">SKU</Label>
                <Input id="sku" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mrp" className="text-right text-xs">MRP ($)</Label>
                <Input id="mrp" type="number" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right text-xs">Stock</Label>
                <Input id="stock" type="number" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search inventory by name, category or SKU..." className="pl-9" />
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
                <TableHead>Global Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
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
                      <Button size="icon" variant="ghost"><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
