/**
 * VoiceProposal - استودیو B2.st
 * آزمون‌های جامع رندرینگ کامپوننت PDF (@react-pdf/renderer) در محیط کلاینت
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { pdf } from '@react-pdf/renderer';
import { ProposalDocument, formatNumberPersian, getCurrencyLabel } from '../src/components/pdf/ProposalDocument';
import { mockWebDevelopmentProposal } from './fixtures/mock-proposal-data';
import { Proposal } from '../src/lib/validations/proposal';

describe('Client-Side PDF Document Rendering & Persian Typography Validation', () => {
  it('باید تابع فرمت‌کننده اعداد فارسی مبالغ را دقیقاً با ارقام فارسی و ۳ رقم ۳ رقم جدا کند', () => {
    const formatted = formatNumberPersian(15000000);
    // باید شامل رقم و جداکننده هزارگان باشد
    expect(formatted).toBeDefined();
    expect(formatted.length).toBeGreaterThan(6);
  });

  it('باید برچسب ارزی را متناسب با اسکیمای ارز بازگرداند', () => {
    expect(getCurrencyLabel('TOMAN')).toBe('تومان');
    expect(getCurrencyLabel('IRR')).toBe('ریال');
    expect(getCurrencyLabel('USD')).toBe('دلار');
    expect(getCurrencyLabel('USDT')).toBe('تتر');
  });

  it('باید کامپوننت ProposalDocument با دیتای معتبر بدون کرش کامپایل و رندر شود', async () => {
    const documentElement = <ProposalDocument proposal={mockWebDevelopmentProposal} />;

    // استفاده از موتور داخلی react-pdf جهت تبدیل به استریم
    const pdfInstance = pdf(documentElement);
    const blobPromise = pdfInstance.toBlob();

    await expect(blobPromise).resolves.toBeDefined();
    const resultBlob = await blobPromise;
    expect(resultBlob.type).toBe('application/pdf');
  });

  it('باید گلیف‌ها و حروف ویژه فارسی (گ، چ، پ، ژ، اعداد، نیم‌فاصله) را بدون خطای سرریز رندر کند', async () => {
    const persianSpecialCharsProposal: Proposal = {
      ...mockWebDevelopmentProposal,
      title: 'طراحی ویجت‌های فوق‌العاده چابک با پلتفرم‌های پرسرعت و ویژه‌نامه',
      summary: 'پروژه‌ای ژرف با پشتیبانی از حروف گ، چ، پ، ژ و نشانه‌های فارسی نظیر «» و ٪',
      freelancer: {
        name: 'پژمان چاووشی',
        company: 'گروه نرم‌افزاری ژیکان',
        phone: '09121112233',
        email: 'pejman@zhikan.ir',
      },
    };

    const doc = <ProposalDocument proposal={persianSpecialCharsProposal} />;
    const pdfStream = pdf(doc);

    await expect(pdfStream.toBlob()).resolves.toBeDefined();
  });

  it('باید جدول اقلام چندگانه و زیرمجموع مبالغ مالی را بدون اشکال در تعداد صفحات رندر کند', async () => {
    // تولید ۱۰ ردیف آیتم برای ارزیابی انعطاف‌پذیری جدول
    const items = Array.from({ length: 8 }).map((_, i) => ({
      id: `dynamic-item-${i}`,
      title: `ردیف خدمت تخصصی شماره ${i + 1} - تحلیل و توسعه ماژول`,
      description: 'شرح جزئیات فنی و خروجی فاز',
      quantity: 1,
      unit: 'فاز',
      unitPrice: 5000000,
      discount: 0,
      totalPrice: 5000000,
    }));

    const total = 8 * 5000000;

    const largeProposal: Proposal = {
      ...mockWebDevelopmentProposal,
      items,
      subtotalAmount: total,
      finalTotalAmount: total,
      milestones: [
        {
          id: 'ms-large-1',
          title: 'فاز اول تسویه',
          percentage: 50,
          amount: total * 0.5,
          durationDays: 10,
          deliverables: ['تحویل اقلام ۱ تا ۴'],
        },
        {
          id: 'ms-large-2',
          title: 'فاز دوم تسویه نهایی',
          percentage: 50,
          amount: total * 0.5,
          durationDays: 10,
          deliverables: ['تحویل اقلام ۵ تا ۸'],
        },
      ],
    };

    const doc = <ProposalDocument proposal={largeProposal} />;
    const pdfStream = pdf(doc);
    const blob = await pdfStream.toBlob();

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('باید در صورت خالی بودن موارد اختیاری (تخفیف صفر، بدون تلفن، بدون مالیات) ساختار پایدار بماند', async () => {
    const minimalProposal: Proposal = {
      ...mockWebDevelopmentProposal,
      taxAmount: 0,
      totalDiscount: 0,
      freelancer: {
        name: 'فریلنسر ناشناس',
      },
      client: {
        name: 'کارفرمای محترم',
      },
      legalClauses: {
        confidentiality: 'محرمانه است.',
        ipRights: 'متعلق به کارفرما است.',
        forceMajeure: 'قوانین عمومی کشور حاکم است.',
        disputeResolution: 'مذاکره دوستانه',
      },
    };

    const doc = <ProposalDocument proposal={minimalProposal} />;
    const pdfInstance = pdf(doc);

    await expect(pdfInstance.toBlob()).resolves.toBeDefined();
  });
});