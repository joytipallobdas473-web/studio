'use server';
/**
 * @fileOverview AI Product Describer Flow
 * 
 * Generates professional, high-density retail descriptions for SKUs 
 * based on name and category.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DescriptionInputSchema = z.object({
  name: z.string(),
  category: z.string(),
});
export type DescriptionInput = z.infer<typeof DescriptionInputSchema>;

const DescriptionOutputSchema = z.object({
  description: z.string().describe("A professional, concise product description suitable for a retail catalog."),
});
export type DescriptionOutput = z.infer<typeof DescriptionOutputSchema>;

const prompt = ai.definePrompt({
  name: 'productDescriberPrompt',
  input: { schema: DescriptionInputSchema },
  output: { schema: DescriptionOutputSchema },
  prompt: `You are a professional retail copywriter for the Aether Logistics Network.
    
    Write a concise, high-density product description for the following SKU:
    NAME: {{{name}}}
    CATEGORY: {{{category}}}
    
    Style: Professional, technical, and benefit-oriented. Avoid fluff. Focus on specifications and retail value.
    Length: 2-3 sentences max.`,
});

export async function describeProduct(input: DescriptionInput): Promise<DescriptionOutput> {
  const { output } = await prompt(input);
  if (!output) throw new Error("Synthesis failed.");
  return output;
}
