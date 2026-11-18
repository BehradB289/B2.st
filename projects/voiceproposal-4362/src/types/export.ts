export type ExportTier = 'free' | 'pay_per_export' | 'pro_subscription';

export interface ExportTokenClaims {
  sub: string; // userId or anonymous fingerprint
  proposalId: string;
  tier: ExportTier;
  watermarkDisabled: boolean;
  customLogoAllowed: boolean;
  customLogoUrl?: string | null;
  iat: number;
  exp: number;
}

export interface ExportTokenRequest {
  proposalId: string;
  fingerprint: string;
  customLogoUrl?: string | null;
  removeWatermarkRequested?: boolean;
  transactionId?: string | null;
}

export interface ExportTokenResponse {
  success: boolean;
  token?: string;
  claims?: ExportTokenClaims;
  quotaRemaining?: number;
  requiresPayment?: boolean;
  pricing?: {
    amount: number;
    currency: string;
    description: string;
  };
  error?: string;
}

export interface ProposalItem {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ProposalMilestone {
  step: number;
  phaseName: string;
  deliverables: string[];
  durationDays: number;
  paymentPercentage: number;
}

export interface ProposalLegalTerms {
  forceMajeureClause: string;
  ipTransferConditions: string;
  paymentSchedule: string;
  terminationTerms: string;
}

export interface StructuredProposalData {
  id: string;
  projectTitle: string;
  freelancer: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    nationalIdOrRegNo?: string;
    logoUrl?: string;
  };
  client: {
    fullName: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  currency: string;
  items: ProposalItem[];
  milestones: ProposalMilestone[];
  terms: ProposalLegalTerms;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  issueDate: string;
  validUntilDate: string;
}