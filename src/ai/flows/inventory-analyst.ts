
'use server';
/**
 * @fileOverview AI Inventory Analyst Flow v3.0
 * 
 * Provides deep strategic logistics intelligence.
 * Analyzes stock density, regional order traffic, and cluster valuation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProductSchema = z.object({
  name: z.string(),
  currentStock: z.number(),
  category: z.string(),
  mrp: z.number().describe("The Maximum Retail Price."),
  offerPrice: z.number().describe("The actual price retailers pay."),
});

const OrderSchema = z.object({
  items: z.string(),
  status: z.string(),
  total: z.number(),
});

const InventoryAnalysisInputSchema = z.object({
  products: z.array(ProductSchema),
  recentOrders: z.array(OrderSchema),
});

const InventoryAnalysisOutputSchema = z.object({
  summary: z.string().describe("A professional executive summary of grid health."),
  recommendations: z.array(z.string()).describe("Actionable logistics steps."),
  riskLevel: z.enum(["low", "medium", "high"]).describe("Overall network risk level."),
  damageAlerts: z.array(z.string()).optional().describe("SKUs flagged for high damage rates."),
  clusterScores: z.array(z.object({
    category: z.string(),
    score: z.number().describe("Logistics efficiency score 1-100."),
    insight: z.string().describe("Why this category is performing well or poorly.")
  })).optional().describe("A break down of category performance."),
});

export type InventoryAnalysisInput = z.infer<typeof InventoryAnalysisInputSchema>;
export type InventoryAnalysisOutput = z.infer<typeof InventoryAnalysisOutputSchema>;

const prompt = ai.definePrompt({
  name: 'inventoryAnalystPrompt',
  input: { schema: InventoryAnalysisInputSchema },
  output: { schema: InventoryAnalysisOutputSchema },
  prompt: `You are the Lead Logistics Strategist for the Aether Grid Infrastructure.
    
    Current Grid Telemetry:
    
    PRODUCTS (SKU Catalog):
    {{#each products}}
    - {{{name}}} [{{{category}}}] | Stock: {{{currentStock}}} | MRP: ₹{{{mrp}}} | Offer: ₹{{{offerPrice}}}
    {{/each}}
    
    RECENT TRAFFIC (Orders & Returns):
    {{#each recentOrders}}
    - Manifest: {{{items}}} | Protocol: {{{status}}} | Valuation: ₹{{{total}}}
    {{/each}}
    
    Analytical Requirements:
    1. Performance Audit: Which product clusters are seeing the most velocity?
    2. Vulnerability Check: Flag nodes/SKUs with high damage reports or critically low stock (<10).
    3. Valuation Analysis: Identify SKUs where the price gap (MRP vs Offer) is significant, as these are likely demand drivers.
    4. Provide actionable, high-density recommendations for regional optimization.
    5. Score each product category based on stock availability vs demand velocity.
    
    Style: Professional, analytical, and data-centric. Use technical terminology like 'Velocity', 'Density', and 'Cluster'.`,
});

export async function analyzeInventory(input: InventoryAnalysisInput): Promise<InventoryAnalysisOutput> {
  const result = await inventoryAnalystFlow(input);
  return result;
}

const inventoryAnalystFlow = ai.defineFlow(
  {
    name: 'inventoryAnalystFlow',
    inputSchema: InventoryAnalysisInputSchema,
    outputSchema: InventoryAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error("Synthesis failed: Neural link timeout.");
    return output;
  }
);
