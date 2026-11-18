/**
 * VoiceProposal - استودیو B2.st
 * کامپوننت رندرینگ اسناد رسمی PDF با @react-pdf/renderer
 * طراحی اختصاصی Glassmorphism و دارک تم مدرن B2.st با پشتیبانی کامل از RTL و فونت وزیرمتن
 */
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { Proposal } from '../../lib/validations/proposal';
import { registerPersianFonts, VAZIRMATN_FONT_FAMILY } from '../../../config/fonts.config';

// اطمینان از ثبت فونت فارسی
registerPersianFonts();

// فرمت‌کننده ارقام به ۳ رقم ۳ رقم
export const formatNumberPersian = (num: number): string => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

// نگاشت نماد ارز
export const getCurrencyLabel = (currency: string): string => {
  switch (currency) {
    case 'TOMAN':
      return 'تومان';
    case 'IRR':
      return 'ریال';
    case 'USD':
      return 'دلار';
    case 'USDT':
      return 'تتر';
    default:
      return 'تومان';
  }
};

const styles = StyleSheet.create({
  page: {
    fontFamily: VAZIRMATN_FONT_FAMILY,
    backgroundColor: '#090D16',
    color: '#F3F4F6',
    padding: 32,
    direction: 'rtl',
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#6D28D9',
    paddingBottom: 16,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#A78BFA',
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  metaBlock: {
    alignItems: 'flex-start',
  },
  metaText: {
    fontSize: 9,
    color: '#D1D5DB',
    marginBottom: 2,
  },
  partiesWrapper: {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  partyCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
  },
  partyCardHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#C4B5FD',
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#4C1D95',
    paddingBottom: 4,
  },
  partyCardRow: {
    fontSize: 9,
    color: '#E5E7EB',
    marginBottom: 3,
  },
  projectSection: {
    backgroundColor: '#131B2E',
    borderWidth: 1,
    borderColor: '#4338CA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: '#D1D5DB',
  },
  // جدول مالی
  table: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row-reverse',
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#E5E7EB',
    textAlign: 'center',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row-reverse',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#374151',
    backgroundColor: '#0F172A',
  },
  tableCell: {
    fontSize: 8.5,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  cellIndex: { width: '8%' },
  cellDesc: { width: '42%', textAlign: 'right', paddingRight: 4 },
  cellQty: { width: '12%' },
  cellPrice: { width: '18%' },
  cellTotal: { width: '20%' },

  // جمع‌بندی مالی
  totalsContainer: {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  totalsBox: {
    width: '45%',
    backgroundColor: '#1E1B4B',
    borderWidth: 1,
    borderColor: '#6D28D9',
    borderRadius: 8,
    padding: 10,
  },
  totalRow: {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 8.5,
    color: '#C7D2FE',
  },
  totalValue: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  finalTotalRow: {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#8B5CF6',
    paddingTop: 6,
    marginTop: 4,
  },
  finalTotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#A78BFA',
  },
  finalTotalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#34D399',
  },

  // مایل‌استون‌ها
  milestoneSection: {
    marginBottom: 20,
  },
  milestoneCard: {
    backgroundColor: '#111827',
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  milestoneHeader: {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#E0E7FF',
  },
  milestoneMeta: {
    fontSize: 8.5,
    color: '#A5B4FC',
  },
  milestoneDeliverable: {
    fontSize: 8,
    color: '#9CA3AF',
    marginRight: 6,
  },

  // بندهای حقوقی
  legalSection: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 10,
    marginBottom: 16,
  },
  legalClauseText: {
    fontSize: 7.5,
    color: '#94A3B8',
    lineHeight: 1.5,
    marginBottom: 4,
  },

  footer: {
    marginTop: 'auto',
    borderTopWidth: 0.5,
    borderTopColor: '#374151',
    paddingTop: 8,
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7.5,
    color: '#6B7280',
  },
});

export interface ProposalDocumentProps {
  proposal: Proposal;
}

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({ proposal }) => {
  const currencyTitle = getCurrencyLabel(proposal.currency);

  return (
    <Document title={`پیش‌فاکتور ${proposal.proposalNumber} - ${proposal.title}`}>
      <Page size="A4" style={styles.page}>
        {/* سربرگ پیش‌فاکتور */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.brandTitle}>وویس‌پروپوزال | VoiceProposal</Text>
            <Text style={styles.brandSubtitle}>پیش‌فاکتور رسمی و شرح خدمات فریلنسری - استودیو B2.st</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaText}>شماره سند: {proposal.proposalNumber}</Text>
            <Text style={styles.metaText}>تاریخ صدور: {proposal.issueDate}</Text>
            <Text style={styles.metaText}>مدت اعتبار: {proposal.validityDays} روز کاری</Text>
          </View>
        </View>

        {/* مشخصات طرفین */}
        <View style={styles.partiesWrapper}>
          {/* مجری / فریلنسر */}
          <View style={styles.partyCard}>
            <Text style={styles.partyCardHeader}>مشخصات مجری (فریلنسر)</Text>
            <Text style={styles.partyCardRow}>نام: {proposal.freelancer.name}</Text>
            <Text style={styles.partyCardRow}>شرکت / برند: {proposal.freelancer.company || 'فریلنسر مستقل'}</Text>
            {proposal.freelancer.phone && (
              <Text style={styles.partyCardRow}>تماس: {proposal.freelancer.phone}</Text>
            )}
            {proposal.freelancer.email && (
              <Text style={styles.partyCardRow}>ایمیل: {proposal.freelancer.email}</Text>
            )}
          </View>

          {/* کارفرما */}
          <View style={styles.partyCard}>
            <Text style={styles.partyCardHeader}>مشخصات کارفرما (مشتری)</Text>
            <Text style={styles.partyCardRow}>نام: {proposal.client.name}</Text>
            <Text style={styles.partyCardRow}>سازمان: {proposal.client.company || 'شخص حقیقی'}</Text>
            {proposal.client.phone && (
              <Text style={styles.partyCardRow}>تماس: {proposal.client.phone}</Text>
            )}
            {proposal.client.email && (
              <Text style={styles.partyCardRow}>ایمیل: {proposal.client.email}</Text>
            )}
          </View>
        </View>

        {/* عنوان و خلاصه دامنه کار */}
        <View style={styles.projectSection}>
          <Text style={styles.sectionHeading}>پروژه: {proposal.title}</Text>
          <Text style={styles.summaryText}>{proposal.summary}</Text>
        </View>

        {/* جدول ریز اقلام مالی */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.cellIndex]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.cellDesc]}>شرح خدمات / نیازمندی</Text>
            <Text style={[styles.tableHeaderCell, styles.cellQty]}>تعداد/واحد</Text>
            <Text style={[styles.tableHeaderCell, styles.cellPrice]}>فی ({currencyTitle})</Text>
            <Text style={[styles.tableHeaderCell, styles.cellTotal]}>مبلغ کل ({currencyTitle})</Text>
          </View>

          {proposal.items.map((item, index) => (
            <View key={item.id || index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.cellIndex]}>{index + 1}</Text>
              <Text style={[styles.tableCell, styles.cellDesc]}>{item.title}</Text>
              <Text style={[styles.tableCell, styles.cellQty]}>
                {item.quantity} {item.unit}
              </Text>
              <Text style={[styles.tableCell, styles.cellPrice]}>{formatNumberPersian(item.unitPrice)}</Text>
              <Text style={[styles.tableCell, styles.cellTotal]}>{formatNumberPersian(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        {/* جمع کل و مبالغ */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>جمع کل اقلام:</Text>
              <Text style={styles.totalValue}>
                {formatNumberPersian(proposal.subtotalAmount)} {currencyTitle}
              </Text>
            </View>
            {proposal.totalDiscount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>تخفیف ویژه:</Text>
                <Text style={styles.totalValue}>
                  {formatNumberPersian(proposal.totalDiscount)} {currencyTitle}
                </Text>
              </View>
            )}
            {proposal.taxAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>مالیات بر ارزش افزوده:</Text>
                <Text style={styles.totalValue}>
                  {formatNumberPersian(proposal.taxAmount)} {currencyTitle}
                </Text>
              </View>
            )}
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>مبلغ قابل پرداخت نهایی:</Text>
              <Text style={styles.finalTotalValue}>
                {formatNumberPersian(proposal.finalTotalAmount)} {currencyTitle}
              </Text>
            </View>
          </View>
        </View>

        {/* فازبندی پرداخت و تحویل (Milestones) */}
        {proposal.milestones && proposal.milestones.length > 0 && (
          <View style={styles.milestoneSection}>
            <Text style={styles.sectionHeading}>فازبندی پرداخت و نقاط عطف پروژه</Text>
            {proposal.milestones.map((m, idx) => (
              <View key={m.id || idx} style={styles.milestoneCard}>
                <View style={styles.milestoneHeader}>
                  <Text style={styles.milestoneTitle}>
                    فاز {idx + 1}: {m.title} ({m.percentage}٪)
                  </Text>
                  <Text style={styles.milestoneMeta}>
                    {formatNumberPersian(m.amount)} {currencyTitle} | زمان تحویل: {m.durationDays} روز
                  </Text>
                </View>
                <Text style={styles.milestoneDeliverable}>
                  اقلام تحویلی: {m.deliverables.join(' • ')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* شرایط حقوقی و فورس‌ماژور */}
        {proposal.legalClauses && (
          <View style={styles.legalSection}>
            <Text style={styles.sectionHeading}>بندهای حقوقی و تعهدات اجرایی</Text>
            <Text style={styles.legalClauseText}>
              • محرمانگی (NDA): {proposal.legalClauses.confidentiality}
            </Text>
            <Text style={styles.legalClauseText}>
              • مالکیت معنوی: {proposal.legalClauses.ipRights}
            </Text>
            <Text style={styles.legalClauseText}>
              • شرایط فورس‌ماژور: {proposal.legalClauses.forceMajeure}
            </Text>
            <Text style={styles.legalClauseText}>
              • حل اختلاف: {proposal.legalClauses.disputeResolution}
            </Text>
          </View>
        )}

        {/* فوتر سند */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>تولید شده توسط سرویس ابری VoiceProposal - استودیو فناوری B2.st</Text>
          <Text style={styles.footerText}>سند دیجیتال معتبر بدون نیاز به مهر فیزیکی</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProposalDocument;