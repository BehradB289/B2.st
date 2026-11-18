/**
 * WhiteAudit - SEO & DOM Extraction Engine
 * Studio: B2.st
 * Description: High-speed Cheerio-based parser for metadata, headings hierarchy, and accessibility audits.
 */

import * as cheerio from 'cheerio';
import axios from 'axios';
import {
  SeoAuditResult,
  HeadingItem,
  MissingAltImage,
  AuditStatus,
} from '@/types/audit';

const USER_AGENT = 'WhiteAuditBot/1.0 (+https://whiteaudit.b2.st; SEO & Security Inspector)';
const DEFAULT_TIMEOUT_MS = 12000;
const MAX_HTML_SIZE_BYTES = 5 * 1024 * 1024; // 5MB guardrail

export interface CrawlerFetchOptions {
  timeoutMs?: number;
  customHeaders?: Record<string, string>;
}

/**
 * Normalizes input URL and ensures valid HTTP/HTTPS protocol
 */
export function normalizeUrl(inputUrl: string): string {
  let cleaned = inputUrl.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }
  const parsed = new URL(cleaned);
  return parsed.toString();
}

/**
 * Evaluates Title tag length and quality
 */
function evaluateTitle(titleText: string | null): { length: number; status: AuditStatus; message: string } {
  if (!titleText || titleText.trim().length === 0) {
    return {
      length: 0,
      status: 'fail',
      message: 'تگ Title در صفحه یافت نشد یا خالی است.',
    };
  }

  const length = titleText.trim().length;
  if (length < 30) {
    return {
      length,
      status: 'warn',
      message: 'طول تگ Title کمتر از ۳۰ کاراکتر است (کوتاه‌تر از حد استاندارد).',
    };
  }

  if (length > 60) {
    return {
      length,
      status: 'warn',
      message: 'طول تگ Title بیش از ۶۰ کاراکتر است و ممکن است در نتایج گوگل کوتاه (Truncate) شود.',
    };
  }

  return {
    length,
    status: 'pass',
    message: 'طول تگ Title کاملاً بهینه و استاندارد است (بین ۳۰ تا ۶۰ کاراکتر).',
  };
}

/**
 * Evaluates Meta Description tag length and quality
 */
function evaluateDescription(descText: string | null): { length: number; status: AuditStatus; message: string } {
  if (!descText || descText.trim().length === 0) {
    return {
      length: 0,
      status: 'fail',
      message: 'تگ توضیحات متا (Meta Description) در صفحه وجود ندارد.',
    };
  }

  const length = descText.trim().length;
  if (length < 70) {
    return {
      length,
      status: 'warn',
      message: 'توضیحات متا کمتر از ۷۰ کاراکتر است و شانس کلیک (CTR) را کاهش می‌دهد.',
    };
  }

  if (length > 160) {
    return {
      length,
      status: 'warn',
      message: 'توضیحات متا بیش از ۱۶۰ کاراکتر است و در صفحه نتایج موتورهای جستجو بریده خواهد شد.',
    };
  }

  return {
    length,
    status: 'pass',
    message: 'طول توضیحات متا استاندارد و بین ۷۰ تا ۱۶۰ کاراکتر است.',
  };
}

/**
 * Parses and audits heading tags (H1-H6) ensuring hierarchical integrity
 */
function auditHeadings($: cheerio.CheerioAPI): {
  distribution: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', number>;
  items: HeadingItem[];
  issues: string[];
  status: AuditStatus;
  score: number;
} {
  const distribution: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', number> = {
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0,
  };

  const items: HeadingItem[] = [];
  const issues: string[] = [];

  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tagName = el.tagName.toLowerCase() as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const level = parseInt(tagName.replace('h', ''), 10);

    distribution[tagName]++;
    items.push({
      tag: tagName,
      text: text.slice(0, 150),
      level,
    });
  });

  // H1 checks
  if (distribution.h1 === 0) {
    issues.push('هیچ تگ H1 در سند DOM یافت نشد.');
  } else if (distribution.h1 > 1) {
    issues.push(`تعداد ${distribution.h1} تگ H1 یافت شد. استفاده از بیش از یک H1 توصیه نمی‌شود.`);
  }

  // Hierarchy skipping checks (e.g. H1 followed immediately by H3)
  for (let i = 0; i < items.length - 1; i++) {
    const currentLevel = items[i].level;
    const nextLevel = items[i + 1].level;

    if (nextLevel > currentLevel + 1) {
      issues.push(`سلسله‌مراتب عناوین شکسته شده است: جهش غیرمجاز از H${currentLevel} به H${nextLevel}.`);
      break;
    }
  }

  let score = 100;
  if (distribution.h1 === 0) score -= 45;
  else if (distribution.h1 > 1) score -= 20;

  if (distribution.h2 === 0) score -= 20;
  if (issues.some((issue) => issue.includes('جهش غیرمجاز'))) score -= 15;

  score = Math.max(0, Math.min(100, score));

  let status: AuditStatus = 'pass';
  if (score < 50) status = 'fail';
  else if (score < 85) status = 'warn';

  return {
    distribution,
    items: items.slice(0, 80),
    issues,
    status,
    score,
  };
}

/**
 * Audits all <img> elements for missing or empty alt tags
 */
function auditImages($: cheerio.CheerioAPI): {
  total: number;
  withAlt: number;
  missingAltCount: number;
  missingSamples: MissingAltImage[];
  ratio: number;
  status: AuditStatus;
  score: number;
} {
  const missingSamples: MissingAltImage[] = [];
  let total = 0;
  let withAlt = 0;

  $('img').each((_, el) => {
    total++;
    const element = $(el);
    const alt = element.attr('alt');
    const src = element.attr('src') || element.attr('data-src') || '[فاقد آدرس src]';

    if (typeof alt === 'string' && alt.trim().length > 0) {
      withAlt++;
    } else {
      if (missingSamples.length < 25) {
        missingSamples.push({
          src: src.slice(0, 200),
          id: element.attr('id') || null,
          className: element.attr('class') || null,
          snippet: cheerio.html(element).slice(0, 250),
        });
      }
    }
  });

  const missingAltCount = total - withAlt;
  const ratio = total === 0 ? 1 : Number((withAlt / total).toFixed(2));
  const score = total === 0 ? 100 : Math.round(ratio * 100);

  let status: AuditStatus = 'pass';
  if (total > 0) {
    if (ratio < 0.6) status = 'fail';
    else if (ratio < 0.95) status = 'warn';
  }

  return {
    total,
    withAlt,
    missingAltCount,
    missingSamples,
    ratio,
    status,
    score,
  };
}

/**
 * Audits Anchor tags (internal, external, nofollow, empty)
 */
function auditLinks($: cheerio.CheerioAPI, baseUrl: string): {
  total: number;
  internal: number;
  external: number;
  nofollow: number;
  emptyHrefs: number;
} {
  let baseHostname = '';
  try {
    baseHostname = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    baseHostname = '';
  }

  let total = 0;
  let internal = 0;
  let external = 0;
  let nofollow = 0;
  let emptyHrefs = 0;

  $('a').each((_, el) => {
    total++;
    const link = $(el);
    const href = link.attr('href');
    const rel = (link.attr('rel') || '').toLowerCase();

    if (rel.includes('nofollow')) {
      nofollow++;
    }

    if (!href || href.trim() === '' || href.trim().startsWith('#') || href.startsWith('javascript:')) {
      emptyHrefs++;
      return;
    }

    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname.toLowerCase() === baseHostname) {
        internal++;
      } else {
        external++;
      }
    } catch {
      // In case of non-standard protocol like tel: or mailto:
      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        external++;
      } else {
        emptyHrefs++;
      }
    }
  });

  return {
    total,
    internal,
    external,
    nofollow,
    emptyHrefs,
  };
}

/**
 * Calculates global SEO health score (0 to 100)
 */
function calculateGlobalSeoScore(params: {
  titleStatus: AuditStatus;
  descStatus: AuditStatus;
  canonicalStatus: AuditStatus;
  robotsStatus: AuditStatus;
  headingsScore: number;
  imagesScore: number;
  openGraphStatus: AuditStatus;
}): number {
  let score = 0;

  // Title: 20 points
  if (params.titleStatus === 'pass') score += 20;
  else if (params.titleStatus === 'warn') score += 12;

  // Description: 15 points
  if (params.descStatus === 'pass') score += 15;
  else if (params.descStatus === 'warn') score += 8;

  // Canonical: 10 points
  if (params.canonicalStatus === 'pass') score += 10;
  else if (params.canonicalStatus === 'warn') score += 5;

  // Robots: 10 points
  if (params.robotsStatus === 'pass') score += 10;
  else if (params.robotsStatus === 'warn') score += 5;

  // Headings: 20 points
  score += Math.round((params.headingsScore / 100) * 20);

  // Images: 15 points
  score += Math.round((params.imagesScore / 100) * 15);

  // Open Graph: 10 points
  if (params.openGraphStatus === 'pass') score += 10;
  else if (params.openGraphStatus === 'warn') score += 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Main DOM crawler function: Parses raw HTML or fetches target URL and runs full SEO audit
 */
export async function crawlDom(
  rawTargetUrl: string,
  rawHtmlInput?: string,
  options: CrawlerFetchOptions = {}
): Promise<SeoAuditResult> {
  const targetUrl = normalizeUrl(rawTargetUrl);
  let html = rawHtmlInput;
  let htmlBytes = html ? Buffer.byteLength(html, 'utf-8') : 0;

  if (!html) {
    const response = await axios.get<string>(targetUrl, {
      timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxContentLength: MAX_HTML_SIZE_BYTES,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fa,en-US,en;q=0.9',
        ...(options.customHeaders || {}),
      },
      responseType: 'text',
      validateStatus: () => true, // capture standard 4xx/5xx responses gracefully
    });

    html = typeof response.data === 'string' ? response.data : '';
    htmlBytes = Buffer.byteLength(html, 'utf-8');
  }

  const $ = cheerio.load(html);

  // 1. Title Audit
  const rawTitle = $('title').first().text().trim() || null;
  const titleEval = evaluateTitle(rawTitle);

  // 2. Meta Description Audit
  const rawDescription =
    $('meta[name="description" i]').attr('content')?.trim() ||
    $('meta[property="og:description" i]').attr('content')?.trim() ||
    null;
  const descEval = evaluateDescription(rawDescription);

  // 3. Canonical Tag Audit
  const canonicalHref = $('link[rel="canonical" i]').attr('href')?.trim() || null;
  let canonicalStatus: AuditStatus = 'pass';
  let isSelfReferential = false;
  let isValidCanonical = false;

  if (!canonicalHref) {
    canonicalStatus = 'warn';
  } else {
    try {
      const canonicalResolved = new URL(canonicalHref, targetUrl).toString();
      isValidCanonical = true;
      isSelfReferential = canonicalResolved.toLowerCase() === targetUrl.toLowerCase();
      canonicalStatus = 'pass';
    } catch {
      canonicalStatus = 'fail';
      isValidCanonical = false;
    }
  }

  // 4. Robots Directives Audit
  const robotsMeta = $('meta[name="robots" i]').attr('content')?.toLowerCase() || null;
  const directives = robotsMeta ? robotsMeta.split(',').map((d) => d.trim()) : [];
  const isIndexable = !directives.includes('noindex');
  const isFollowable = !directives.includes('nofollow');
  const robotsStatus: AuditStatus = !isIndexable ? 'warn' : 'pass';

  // 5. OpenGraph Tags Audit
  const ogTitle = $('meta[property="og:title" i]').attr('content') || null;
  const ogDesc = $('meta[property="og:description" i]').attr('content') || null;
  const ogImage = $('meta[property="og:image" i]').attr('content') || null;
  const ogUrl = $('meta[property="og:url" i]').attr('content') || null;
  const ogType = $('meta[property="og:type" i]').attr('content') || null;
  const ogSiteName = $('meta[property="og:site_name" i]').attr('content') || null;

  const hasRequiredOg = Boolean(ogTitle && ogImage);
  const openGraphStatus: AuditStatus = hasRequiredOg ? 'pass' : ogTitle || ogImage ? 'warn' : 'fail';

  // 6. Headings Audit
  const headings = auditHeadings($);

  // 7. Images & Alt Audit
  const images = auditImages($);

  // 8. Links Audit
  const links = auditLinks($, targetUrl);

  // 9. Document Metrics
  const langAttribute = $('html').attr('lang') || null;
  const charset =
    $('meta[charset]').attr('charset') ||
    $('meta[http-equiv="Content-Type" i]').attr('content') ||
    null;
  const viewport = $('meta[name="viewport" i]').attr('content') || null;
  const domElementCount = $('*').length;

  const globalScore = calculateGlobalSeoScore({
    titleStatus: titleEval.status,
    descStatus: descEval.status,
    canonicalStatus,
    robotsStatus,
    headingsScore: headings.score,
    imagesScore: images.score,
    openGraphStatus,
  });

  return {
    url: targetUrl,
    score: globalScore,
    timestamp: new Date().toISOString(),
    title: {
      value: rawTitle,
      length: titleEval.length,
      status: titleEval.status,
      message: titleEval.message,
    },
    description: {
      value: rawDescription,
      length: descEval.length,
      status: descEval.status,
      message: descEval.message,
    },
    canonical: {
      url: canonicalHref,
      isSelfReferential,
      isValid: isValidCanonical,
      status: canonicalStatus,
    },
    robots: {
      raw: robotsMeta,
      isIndexable,
      isFollowable,
      directives,
      status: robotsStatus,
    },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      image: ogImage,
      url: ogUrl,
      type: ogType,
      siteName: ogSiteName,
      hasRequiredTags: hasRequiredOg,
      status: openGraphStatus,
    },
    headings,
    images,
    links,
    metrics: {
      totalHtmlBytes,
      domElementCount,
      langAttribute,
      charset,
      viewport,
    },
  };
}