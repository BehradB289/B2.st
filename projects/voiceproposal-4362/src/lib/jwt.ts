import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { ExportTokenClaims } from '@/types/export';

const EXPORT_SECRET_KEY = new TextEncoder().encode(
  process.env.EXPORT_TOKEN_SECRET || 'voiceproposal-b2st-enterprise-super-symmetric-secret-key-2025'
);

const ALGORITHM = 'HS256';

/**
 * Signs and packages export entitlement claims into a tamper-proof edge-compatible JWT.
 */
export async function signExportToken(payload: Omit<ExportTokenClaims, 'iat' | 'exp'>): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 2; // Token expires after 2 hours for security

  return new SignJWT({ ...payload } as unknown as JWTPayload)
    .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setIssuer('https://voiceproposal.b2.st')
    .setAudience('voiceproposal-client-renderer')
    .sign(EXPORT_SECRET_KEY);
}

/**
 * Verifies and decodes the export token inside edge runtime or client context before rendering PDF.
 */
export async function verifyExportToken(token: string): Promise<ExportTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, EXPORT_SECRET_KEY, {
      issuer: 'https://voiceproposal.b2.st',
      audience: 'voiceproposal-client-renderer',
    });

    return payload as unknown as ExportTokenClaims;
  } catch (error) {
    console.error('[ExportToken] Verification failure:', error);
    return null;
  }
}