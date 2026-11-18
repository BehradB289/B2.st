import { z } from "zod";

export const LineItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const MilestonePhaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  duration: z.string().min(1),
  deliverables: z.array(z.string().min(1)),
  amount: z.number().nonnegative(),
  status: z.enum(["pending", "in_progress", "completed", "approved"]).default("pending"),
});

export const PricingBreakdownSchema = z.object({
  subtotal: z.number().nonnegative(),
  taxRate: z.number().min(0).max(100).default(0),
  taxAmount: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  currency: z.enum(["USD", "EUR", "IRR", "TOMAN"]).default("USD"),
  paymentTerms: z.string().min(1),
});

export const ProposalDataSchema = z.object({
  id: z.string().min(1),
  proposalNumber: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  issueDate: z.string().min(1),
  validUntil: z.string().min(1),
  client: z.object({
    name: z.string().min(1),
    company: z.string().min(1),
    email: z.string().email(),
  }),
  provider: z.object({
    name: z.string().min(1),
    title: z.string().min(1),
    company: z.string().optional(),
    email: z.string().email(),
  }),
  phases: z.array(MilestonePhaseSchema).min(1),
  lineItems: z.array(LineItemSchema).min(1),
  pricing: PricingBreakdownSchema,
  legalTerms: z.array(z.string().min(1)),
  forceMajeure: z.string().min(1),
});

export type LineItem = z.infer<typeof LineItemSchema>;
export type MilestonePhase = z.infer<typeof MilestonePhaseSchema>;
export type PricingBreakdown = z.infer<typeof PricingBreakdownSchema>;
export type ProposalData = z.infer<typeof ProposalDataSchema>;