import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import type { StructuredProposalData } from '@/types/export';
import { WatermarkLayer } from './WatermarkLayer';

// Register standard fonts
Font.register({
  family: 'Vazirmatn',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Bold.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Vazirmatn',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: 9,
    lineHeight: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#6D28D9',
    paddingBottom: 16,
    marginBottom: 18,
  },
  logoContainer: {
    width: 90,
    height: 45,
    justifyContent: 'center',
  },
  logo: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  defaultLogoBadge: {
    backgroundColor: '#090D16',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultLogoBadgeText: {
    color: '#A855F7',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  headerMeta: {
    textAlign: 'right',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1B4B',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 8.5,
    color: '#64748B',
  },
  partiesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 12,
    marginBottom: 18,
  },
  partyCard: {
    width: '48%',
    textAlign: 'right',
  },
  partyTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#6D28D9',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 2,
  },
  table: {
    width: '100%',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 8.5,
    color: '#334155',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  cellIndex: { width: '8%', textAlign: 'center' },
  cellDesc: { width: '47%', textAlign: 'right', paddingRight: 4 },
  cellHours: { width: '15%', textAlign: 'center' },
  cellUnitPrice: { width: '15%', textAlign: 'center' },
  cellTotal: { width: '15%', textAlign: 'center', fontWeight: 'bold' },
  summaryBox: {
    flexDirection: 'column',
    alignSelf: 'flex-start',
    width: '45%',
    backgroundColor: '#FAF5FF',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#C084FC',
    paddingTop: 4,
    marginTop: 4,
  },
  legalSection: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#6D28D9',
    padding: 10,
    borderRadius: 4,
    marginBottom: 14,
  },
  legalTitle: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#1E1B4B',
    marginBottom: 3,
    textAlign: 'right',
  },
  legalText: {
    fontSize: 8,
    color: '#475569',
    textAlign: 'right',
    lineHeight: 1.4,
  },
});

interface ProposalPDFDocumentProps {
  data: StructuredProposalData;
  watermarkEnabled: boolean;
  customLogoUrl?: string | null;
}

export const ProposalPDFDocument: React.FC<ProposalPDFDocumentProps> = ({
  data,
  watermarkEnabled,
  customLogoUrl,
}) => {
  return (
    <Document title={`پیش‌فاکتور - ${data.projectTitle}`} author="VoiceProposal Studio (B2.st)">
      <Page size="A4" style={styles.page}>
        {/* Render watermark overlay if not upgraded */}
        {watermarkEnabled && <WatermarkLayer proposalId={data.id} />}

        {/* Top Header & Branding */}
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            {customLogoUrl ? (
              <Image style={styles.logo} src={customLogoUrl} />
            ) : (
              <View style={styles.defaultLogoBadge}>
                <Text style={styles.defaultLogoBadgeText}>B2.st / VoiceProposal</Text>
              </View>
            )}
          </View>

          <View style={styles.headerMeta}>
            <Text style={styles.titleText}>{data.projectTitle}</Text>
            <Text style={styles.metaText}>شماره سند: VP-{data.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.metaText}>تاریخ صدور: {data.issueDate}</Text>
            <Text style={styles.metaText}>مهلت اعتبار: {data.validUntilDate}</Text>
          </View>
        </View>

        {/* Parties Information */}
        <View style={styles.partiesGrid}>
          <View style={styles.partyCard}>
            <Text style={styles.partyTitle}>مشخصات مجری / فریلنسر</Text>
            <Text>{data.freelancer.fullName} ({data.freelancer.title})</Text>
            <Text style={styles.metaText}>ایمیل: {data.freelancer.email}</Text>
            <Text style={styles.metaText}>تلفن همراه: {data.freelancer.phone}</Text>
          </View>

          <View style={styles.partyCard}>
            <Text style={styles.partyTitle}>مشخصات کارفرما</Text>
            <Text>{data.client.fullName} {data.client.companyName ? `- ${data.client.companyName}` : ''}</Text>
            {data.client.email && <Text style={styles.metaText}>ایمیل: {data.client.email}</Text>}
            {data.client.phone && <Text style={styles.metaText}>تماس: {data.client.phone}</Text>}
          </View>
        </View>

        {/* Financial Deliverables Breakdown */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.cellIndex]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.cellDesc]}>شرح خدمات و دلیوربل</Text>
            <Text style={[styles.tableHeaderCell, styles.cellHours]}>برآورد زمان</Text>
            <Text style={[styles.tableHeaderCell, styles.cellUnitPrice]}>نرخ واحد ({data.currency})</Text>
            <Text style={[styles.tableHeaderCell, styles.cellTotal]}>مبلغ کل ({data.currency})</Text>
          </View>

          {data.items.map((item, idx) => (
            <View style={styles.tableRow} key={item.id || idx}>
              <Text style={styles.cellIndex}>{idx + 1}</Text>
              <Text style={styles.cellDesc}>{item.title} - {item.description}</Text>
              <Text style={styles.cellHours}>{item.estimatedHours} ساعت</Text>
              <Text style={styles.cellUnitPrice}>{item.unitPrice.toLocaleString()}</Text>
              <Text style={styles.cellTotal}>{item.totalPrice.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Totals Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.metaText}>جمع جزء:</Text>
            <Text>{data.subtotal.toLocaleString()} {data.currency}</Text>
          </View>
          {data.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.metaText}>تخفیف توافقی:</Text>
              <Text style={{ color: '#DC2626' }}>- {data.discount.toLocaleString()} {data.currency}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={{ fontWeight: 'bold', color: '#6D28D9' }}>مبلغ کل نهایی:</Text>
            <Text style={{ fontWeight: 'bold', color: '#6D28D9' }}>
              {data.grandTotal.toLocaleString()} {data.currency}
            </Text>
          </View>
        </View>

        {/* Legal Clauses and Force Majeure */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>بند حقوقی، شرایط پرداخت و فورس‌ماژور</Text>
          <Text style={styles.legalText}>{data.terms.paymentSchedule}</Text>
          <Text style={styles.legalText}>{data.terms.forceMajeureClause}</Text>
          <Text style={styles.legalText}>{data.terms.ipTransferConditions}</Text>
        </View>
      </Page>
    </Document>
  );
};