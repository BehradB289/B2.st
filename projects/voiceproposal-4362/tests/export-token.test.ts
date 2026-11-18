import { describe, it, expect } from 'vitest';
import { signExportToken, verifyExportToken } from '../src/lib/jwt';
import type { ExportTier } from '../src/types/export';

describe('VoiceProposal Export Token Security Suite', () => {
  const mockPayload = {
    sub: 'user_test_uuid_b2st',
    proposalId: 'prop_987654321',
    tier: 'pay_per_export' as ExportTier,
    watermarkDisabled: true,
    customLogoAllowed: true,
    customLogoUrl: 'https://b2.st/assets/logo.png',
  };

  it('should sign and accurately verify export token claims', async () => {
    const token = await signExportToken(mockPayload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = await verifyExportToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.proposalId).toBe(mockPayload.proposalId);
    expect(verified?.watermarkDisabled).toBe(true);
    expect(verified?.customLogoAllowed).toBe(true);
  });

  it('should reject tampered JWT signatures', async () => {
    const token = await signExportToken(mockPayload);
    const tamperedToken = token.slice(0, -6) + 'abcdef';

    const result = await verifyExportToken(tamperedToken);
    expect(result).toBeNull();
  });

  it('should enforce watermark presence on free tier payload', async () => {
    const freePayload = {
      sub: 'fingerprint_anon_123',
      proposalId: 'prop_free_001',
      tier: 'free' as ExportTier,
      watermarkDisabled: false,
      customLogoAllowed: false,
    };

    const token = await signExportToken(freePayload);
    const verified = await verifyExportToken(token);
    expect(verified?.watermarkDisabled).toBe(false);
    expect(verified?.customLogoAllowed).toBe(false);
  });
});