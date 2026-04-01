'use server';
/**
 * @fileOverview AI Inventory Analyst Flow v2.0
 * 
 * Analyzes stock levels, order patterns, and damage incidents to provide 
 * strategic logistics recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProductSchema = z.object({
  name: z.string(),
  currentStock: z.number(),
  category: z.string(),
  mrp: z.number(),
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
  summary: z.string().describe("A concise summary of current inventory and logistics health."),
  recommendations: z.array(z.string()).describe("Actionable steps for the admin, focusing on reordering and risk mitigation."),
  riskLevel: z.enum(["low", "medium", "high"]).describe("Overall network risk assessment."),
  damageAlerts: z.array(z.string()).optional().describe("Specific SKUs or clusters flagged for high damage rates."),
});

export type InventoryAnalysisInput = z.infer<typeof InventoryAnalysisInputSchema>;
export type InventoryAnalysisOutput = z.infer<typeof InventoryAnalysisOutputSchema>;

const prompt = ai.definePrompt({
  name: 'inventoryAnalystPrompt',
  input: { schema: InventoryAnalysisInputSchema },
  output: { schema: InventoryAnalysisOutputSchema },
  prompt: `You are a Lead Supply Chain Strategist for a high-density retail network.
    
    Review the following network telemetry:
    
    PRODUCTS (SKU Catalog):
    {{#each products}}
    - {{{name}}} | Cluster: {{{category}}} | Density: {{{currentStock}}} | Unit Val: ₹{{{mrp}}}
    {{/each}}
    
    TRAFFIC LOGS (Recent Orders & Damage Reports):
    {{#each recentOrders}}
    - Payload: {{{items}}} | Protocol Status: {{{status}}} | Val: ₹{{{total}}}
    {{/each}}
    
    Strategic Requirements:
    1. Identify SKUs with critical density (stock < 10).
    2. Flag "Damage Hotspots" - items frequently appearing in "return_pending" or "DAMAGE REPORT" logs.
    3. Assess if high-value clusters (Electronics) are sufficiently stocked for current traffic.
    
    Provide professional, concise, data-driven intelligence.`,
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
