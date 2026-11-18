# VoiceProposal Client-Side PDF Engine Architecture

## 1. Overview
VoiceProposal implements a **Zero-Server Cost PDF Generation Architecture**. Rather than deploying heavy headless Chromium instances (Puppeteer/Playwright) on serverless functions with memory penalties and cold-start latencies, PDF documents are compiled directly inside the user's browser via `@react-pdf/renderer` dynamically imported upon user demand.

## 2. Core Components
- `src/types/proposal.ts`: Zod schema defining the contract payload (phases, items, pricing, force majeure).
- `src/components/ProposalViewer.tsx`: Interactive preview screen using Dark Glassmorphism (`#090D16`, `#6D28D9`), Emerald status badges (`#10B981`), and responsive pricing tables.
- `src/components/pdf/ProposalDocument.tsx`: Pure React-PDF compilation model with dynamic pagination, corporate grade styling, and print formatting.
- `src/components/pdf/DownloadPdfButton.tsx`: Acrylic neon-styled trigger equipped with an edge-sheen light reflex and client-side lifecycle management (`idle` -> `rendering` -> `ready` -> `error`).

## 3. Operational Flow
```
[User Clicks Download]
        ↓
[Dynamic Import @react-pdf/renderer + ProposalDocument]
        ↓
[pdf(doc).toBlob() computed in Web Worker / Client Memory]
        ↓
[URL.createObjectURL(blob) created]
        ↓
[Browser Download Triggered without Server Overhead]
        ↓
[Memory Released via revokeObjectURL]
```

## 4. Design Guidelines
- **Canvas Base**: `#090D16` (Obsidian Deep)
- **Primary Ambient**: `#6D28D9` (Neon Violet)
- **Status Badges**: `#10B981` (Emerald Glass)
- **Edge Sheen**: Slanted high-specular linear gradient sweep.