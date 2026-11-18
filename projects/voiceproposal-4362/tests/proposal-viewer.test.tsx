import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProposalViewer } from "@/components/ProposalViewer";
import type { ProposalData } from "@/types/proposal";

const mockProposal: ProposalData = {
  id: "prop_123",
  proposalNumber: "VP-2025-001",
  title: "Cloud Migration & AI Integration",
  summary: "Comprehensive architecture modernization and Groq Whisper implementation.",
  issueDate: "2025-03-01",
  validUntil: "2025-03-31",
  client: {
    name: "Sarah Jenkins",
    company: "Apex Global Dynamics",
    email: "sarah@apex.io",
  },
  provider: {
    name: "Alex Vance",
    title: "Senior Fullstack Architect",
    email: "alex@b2.st",
  },
  phases: [
    {
      id: "ph_1",
      title: "Audio Streaming Ingestion Engine",
      duration: "10 Days",
      deliverables: ["WebM Chunk Streamer", "Server Action RPC"],
      amount: 4500,
      status: "approved",
    },
    {
      id: "ph_2",
      title: "Groq Llama-3 Structured Zod Extraction",
      duration: "8 Days",
      deliverables: ["Dynamic Zod Validator", "Supabase Cache Layer"],
      amount: 3800,
      status: "in_progress",
    },
  ],
  lineItems: [
    {
      id: "li_1",
      description: "Architecture & Serverless Infrastructure Setup",
      quantity: 1,
      unitPrice: 4500,
      total: 4500,
    },
    {
      id: "li_2",
      description: "AI Prompt Optimization & Schema Hardening",
      quantity: 1,
      unitPrice: 3800,
      total: 3800,
    },
  ],
  pricing: {
    subtotal: 8300,
    taxRate: 0,
    taxAmount: 0,
    discountAmount: 0,
    total: 8300,
    currency: "USD",
    paymentTerms: "50% upfront, 50% upon final acceptance test passing.",
  },
  legalTerms: [
    "Work begins upon initial escrow release.",
    "Source code IP transitions completely to client upon full settlement.",
  ],
  forceMajeure: "Neither party liable for acts of God, global API downtimes, or telecommunications blockades.",
};

describe("ProposalViewer Component", () => {
  it("renders proposal title, client metadata, and provider correctly", () => {
    render(<ProposalViewer proposal={mockProposal} />);

    expect(screen.getByText("Cloud Migration & AI Integration")).toBeInTheDocument();
    expect(screen.getByText("VP-2025-001")).toBeInTheDocument();
    expect(screen.getByText("Apex Global Dynamics")).toBeInTheDocument();
    expect(screen.getByText("Alex Vance")).toBeInTheDocument();
  });

  it("renders milestone phases with correct statuses", () => {
    render(<ProposalViewer proposal={mockProposal} />);

    expect(screen.getByText("Audio Streaming Ingestion Engine")).toBeInTheDocument();
    expect(screen.getByText("APPROVED")).toBeInTheDocument();
    expect(screen.getByText("IN_PROGRESS")).toBeInTheDocument();
    expect(screen.getByText("WebM Chunk Streamer")).toBeInTheDocument();
  });

  it("displays line items and grand total properly formatted", () => {
    render(<ProposalViewer proposal={mockProposal} />);

    expect(screen.getByText("Architecture & Serverless Infrastructure Setup")).toBeInTheDocument();
    const grandTotals = screen.getAllByText("$8,300.00");
    expect(grandTotals.length).toBeGreaterThan(0);
  });

  it("renders legal terms and force majeure text", () => {
    render(<ProposalViewer proposal={mockProposal} />);

    expect(screen.getByText(/Work begins upon initial escrow release/i)).toBeInTheDocument();
    expect(screen.getByText(/Neither party liable for acts of God/i)).toBeInTheDocument();
  });
});