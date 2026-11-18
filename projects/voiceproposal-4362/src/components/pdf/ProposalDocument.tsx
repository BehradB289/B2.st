import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ProposalData } from "@/types/proposal";

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/inter-ui/3.19.3/Inter-Regular.woff",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/inter-ui/3.19.3/Inter-Bold.woff",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: "#0B0F19",
    color: "#E2E8F0",
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.4,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    paddingBottom: 16,
  },
  titleGroup: {
    maxWidth: "60%",
  },
  brandTag: {
    color: "#8B5CF6",
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: "bold",
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  proposalSubtitle: {
    fontSize: 9,
    color: "#94A3B8",
  },
  metaGroup: {
    alignItems: "flex-end",
  },
  badgePill: {
    backgroundColor: "#1E1B4B",
    borderWidth: 1,
    borderColor: "#4338CA",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  badgeText: {
    color: "#C7D2FE",
    fontSize: 8,
    fontWeight: "bold",
  },
  metaText: {
    fontSize: 8,
    color: "#94A3B8",
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#F8FAFC",
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#334155",
    paddingBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  twoColumn: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  columnCard: {
    width: "48%",
    backgroundColor: "#111827",
    borderColor: "#1F2937",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
  },
  columnLabel: {
    color: "#64748B",
    fontSize: 7.5,
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: "bold",
  },
  partyName: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  partySubtext: {
    color: "#94A3B8",
    fontSize: 8.5,
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: "#0F172A",
    borderColor: "#1E293B",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  summaryText: {
    color: "#CBD5E1",
    fontSize: 8.5,
    lineHeight: 1.5,
  },
  table: {
    width: "100%",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#182234",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#1F2937",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#0F172A",
  },
  colDescription: {
    width: "55%",
    paddingRight: 8,
  },
  colQty: {
    width: "15%",
    textAlign: "center",
  },
  colUnitPrice: {
    width: "15%",
    textAlign: "right",
  },
  colTotal: {
    width: "15%",
    textAlign: "right",
  },
  headerCellText: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  cellText: {
    fontSize: 8,
    color: "#E2E8F0",
  },
  phaseCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  phaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  phaseTitle: {
    color: "#F8FAFC",
    fontWeight: "bold",
    fontSize: 9,
  },
  phaseBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 0.5,
    borderColor: "#10B981",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  phaseBadgeText: {
    color: "#10B981",
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  deliverableItem: {
    fontSize: 7.5,
    color: "#94A3B8",
    marginLeft: 6,
    marginVertical: 1,
  },
  totalsContainer: {
    alignSelf: "flex-end",
    width: "45%",
    marginTop: 8,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 6,
    padding: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  totalLabel: {
    fontSize: 8,
    color: "#94A3B8",
  },
  totalValue: {
    fontSize: 8,
    color: "#F1F5F9",
    fontWeight: "bold",
  },
  grandTotalLabel: {
    fontSize: 9,
    color: "#A78BFA",
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  clauseBox: {
    backgroundColor: "#0B1120",
    borderLeftWidth: 2,
    borderLeftColor: "#6366F1",
    padding: 6,
    marginBottom: 4,
  },
  clauseText: {
    fontSize: 7.5,
    color: "#94A3B8",
    lineHeight: 1.3,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#1E293B",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: "#64748B",
  },
});

interface ProposalDocumentProps {
  data: ProposalData;
}

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({ data }) => {
  const formatCurrency = (val: number) => {
    return `${data.pricing.currency} ${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Document
      title={`Proposal_${data.proposalNumber}_${data.client.company}`}
      author={data.provider.name}
      subject={data.title}
      creator="VoiceProposal AI - B2.st Engine"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.titleGroup}>
            <Text style={styles.brandTag}>VoiceProposal AI • B2.st</Text>
            <Text style={styles.documentTitle}>{data.title}</Text>
            <Text style={styles.proposalSubtitle}>Ref: {data.proposalNumber}</Text>
          </View>
          <View style={styles.metaGroup}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>CLIENT PREVIEW</Text>
            </View>
            <Text style={styles.metaText}>Issued: {data.issueDate}</Text>
            <Text style={styles.metaText}>Valid Until: {data.validUntil}</Text>
          </View>
        </View>

        {/* Counterparties */}
        <View style={styles.twoColumn}>
          <View style={styles.columnCard}>
            <Text style={styles.columnLabel}>Prepared For</Text>
            <Text style={styles.partyName}>{data.client.name}</Text>
            <Text style={styles.partySubtext}>{data.client.company}</Text>
            <Text style={styles.partySubtext}>{data.client.email}</Text>
          </View>
          <View style={styles.columnCard}>
            <Text style={styles.columnLabel}>Service Provider</Text>
            <Text style={styles.partyName}>{data.provider.name}</Text>
            <Text style={styles.partySubtext}>{data.provider.title}</Text>
            <Text style={styles.partySubtext}>{data.provider.email}</Text>
          </View>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary & Scope</Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>{data.summary}</Text>
          </View>
        </View>

        {/* Milestones / Phases */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Phases & Milestones</Text>
          {data.phases.map((phase, idx) => (
            <View key={phase.id || idx} style={styles.phaseCard}>
              <View style={styles.phaseHeader}>
                <Text style={styles.phaseTitle}>
                  Phase {idx + 1}: {phase.title} ({phase.duration})
                </Text>
                <View style={styles.phaseBadge}>
                  <Text style={styles.phaseBadgeText}>{phase.status}</Text>
                </View>
              </View>
              {phase.deliverables.map((del, dIdx) => (
                <Text key={dIdx} style={styles.deliverableItem}>
                  • {del}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Line Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Breakdown & Deliverables</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.colDescription}>
                <Text style={styles.headerCellText}>Description</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={styles.headerCellText}>Qty / Units</Text>
              </View>
              <View style={styles.colUnitPrice}>
                <Text style={styles.headerCellText}>Unit Rate</Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={styles.headerCellText}>Total</Text>
              </View>
            </View>
            {data.lineItems.map((item, index) => (
              <View key={item.id || index} style={styles.tableRow}>
                <View style={styles.colDescription}>
                  <Text style={styles.cellText}>{item.description}</Text>
                </View>
                <View style={styles.colQty}>
                  <Text style={[styles.cellText, { textAlign: "center" }]}>
                    {item.quantity}
                  </Text>
                </View>
                <View style={styles.colUnitPrice}>
                  <Text style={[styles.cellText, { textAlign: "right" }]}>
                    {formatCurrency(item.unitPrice)}
                  </Text>
                </View>
                <View style={styles.colTotal}>
                  <Text style={[styles.cellText, { textAlign: "right", fontWeight: "bold" }]}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.pricing.subtotal)}</Text>
            </View>
            {data.pricing.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: "#34D399" }]}>
                  -{formatCurrency(data.pricing.discountAmount)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({data.pricing.taxRate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.pricing.taxAmount)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(data.pricing.total)}</Text>
            </View>
          </View>
        </View>

        {/* Legal & Force Majeure */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Terms & Legal Safeguards</Text>
          {data.legalTerms.map((term, i) => (
            <View key={i} style={styles.clauseBox}>
              <Text style={styles.clauseText}>§ {term}</Text>
            </View>
          ))}
          <View style={[styles.clauseBox, { borderLeftColor: "#EF4444", marginTop: 4 }]}>
            <Text style={[styles.clauseText, { color: "#FCA5A5" }]}>
              FORCE MAJEURE: {data.forceMajeure}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated securely via VoiceProposal Zero-Server Engine • Cryptographic Verification B2.st
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};