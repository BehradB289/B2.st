/**
 * WhiteAudit - Type Definitions for SEO & Security Audit Engine
 * Studio: B2.st
 * Architecture: Stateless Serverless Architecture for Next.js 14
 */

export type AuditStatus = 'pass' | 'warn' | 'fail' | 'info';

export type SecurityGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface MetaTagAudit {
  value: string | null;
  length: number;
  status: AuditStatus;
  message: string;
}

export interface OpenGraphAudit {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string | null;
  type: string | null;
  siteName: string | null;
  hasRequiredTags: boolean;
  status: AuditStatus;
}

export interface RobotsAudit {
  raw: string | null;
  isIndexable: boolean;
  isFollowable: boolean;
  directives: string[];
  status: AuditStatus;
}

export interface CanonicalAudit {
  url: string | null;
  isSelfReferential: boolean;
  isValid: boolean;
  status: AuditStatus;
}

export interface HeadingItem {
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  text: string;
  level: number;
}

export interface HeadingsAudit {
  distribution: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', number>;
  items: HeadingItem[];
  issues: string[];
  status: AuditStatus;
  score: number;
}

export interface MissingAltImage {
  src: string;
  id: string | null;
  className: string | null;
  snippet: string;
}

export interface ImagesAudit {
  total: number;
  withAlt: number;
  missingAltCount: number;
  missingSamples: MissingAltImage[];
  ratio: number;
  status: AuditStatus;
  score: number;
}

export interface LinksAudit {
  total: number;
  internal: number;
  external: number;
  nofollow: number;
  emptyHrefs: number;
}

export interface SeoAuditResult {
  url: string;
  score: number;
  timestamp: string;
  title: MetaTagAudit;
  description: MetaTagAudit;
  canonical: CanonicalAudit;
  robots: RobotsAudit;
  openGraph: OpenGraphAudit;
  headings: HeadingsAudit;
  images: ImagesAudit;
  links: LinksAudit;
  metrics: {
    totalHtmlBytes: number;
    domElementCount: number;
    langAttribute: string | null;
    charset: string | null;
    viewport: string | null;
  };
}

export interface SslIssuerInfo {
  organization?: string;
  commonName?: string;
  country?: string;
}

export interface SslCertificateAudit {
  valid: boolean;
  authorized: boolean;
  authorizationError: string | null;
  protocol: string | null;
  issuer: SslIssuerInfo;
  subject: {
    commonName?: string;
    organization?: string;
  };
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number | null;
  subjectAltNames: string[];
  fingerprint256?: string;
  status: AuditStatus;
  score: number;
}

export interface SecurityHeaderDetail {
  name: string;
  present: boolean;
  value: string | null;
  status: AuditStatus;
  score: number;
  importance: 'critical' | 'high' | 'medium' | 'low';
  parsed?: Record<string, unknown>;
  recommendation?: string;
}

export interface HstsAuditDetail extends SecurityHeaderDetail {
  parsed?: {
    maxAge: number | null;
    includeSubDomains: boolean;
    preload: boolean;
  };
}

export interface CspAuditDetail extends SecurityHeaderDetail {
  parsed?: {
    directivesCount: number;
    hasDefaultSrc: boolean;
    hasScriptSrc: boolean;
    hasUnsafeInline: boolean;
    hasUnsafeEval: boolean;
  };
}

export interface CompressionAudit {
  enabled: boolean;
  algorithm: 'br' | 'gzip' | 'deflate' | 'identity' | 'unknown' | 'none';
  headerValue: string | null;
  status: AuditStatus;
}

export interface SecurityAuditResult {
  url: string;
  hostname: string;
  score: number;
  grade: SecurityGrade;
  timestamp: string;
  ssl: SslCertificateAudit;
  headers: {
    hsts: HstsAuditDetail;
    csp: CspAuditDetail;
    xFrameOptions: SecurityHeaderDetail;
    xContentTypeOptions: SecurityHeaderDetail;
    referrerPolicy: SecurityHeaderDetail;
    permissionsPolicy: SecurityHeaderDetail;
    serverInfo: {
      exposedServer: string | null;
      exposedPoweredBy: string | null;
    };
  };
  compression: CompressionAudit;
  redirectsToHttps: boolean;
}