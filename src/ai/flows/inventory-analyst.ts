'use server';
/**
 * @fileOverview AI Inventory Analyst Flow
 * 
 * Analyzes current stock levels and order patterns to provide 
 * strategic recommendations to the administrator.
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
  summary: z.string().describe("A concise summary of the current inventory health."),
  recommendations: z.array(z.string()).describe("List of actionable steps for the administrator."),
  riskLevel: z.enum(["low", "medium", "high"]).describe("The overall stock risk level."),
});

export type InventoryAnalysisInput = z.infer<typeof InventoryAnalysisInputSchema>;
export type InventoryAnalysisOutput = z.infer<typeof InventoryAnalysisOutputSchema>;

const prompt = ai.definePrompt({
  name: 'inventoryAnalystPrompt',
  input: { schema: InventoryAnalysisInputSchema },
  output: { schema: InventoryAnalysisOutputSchema },
  prompt: `You are an expert supply chain analyst for a retail network.
    
    Review the following inventory and order data:
    
    PRODUCTS:
    {{#each products}}
    - {{{name}}} (Category: {{{category}}}, Stock: {{{currentStock}}}, Price: ₹{{{mrp}}})
    {{/each}}
    
    RECENT ORDERS:
    {{#each recentOrders}}
    - Items: {{{items}}}, Status: {{{status}}}, Value: ₹{{{total}}}
    {{/each}}
    
    Based on this data, provide:
    1. A summary of stock health.
    2. Specific recommendations for reordering (prioritize items with low stock or high demand).
    3. An overall risk level assessment.
    
    Be professional, concise, and data-driven.`,
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
    if (!output) throw new Error("Analysis failed to generate output");
    return output;
  }
);
