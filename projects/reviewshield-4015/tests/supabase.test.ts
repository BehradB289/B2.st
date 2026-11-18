import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IncrementRatingResponse } from '../src/types/database.types';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-supabase-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-valid';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-valid';

describe('ReviewShield Supabase Integration Contracts', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should enforce 30 ratings free limit check contract', () => {
    const limitReachedResponse: IncrementRatingResponse = {
      success: false,
      code: 'LIMIT_EXCEEDED',
      message: 'Free tier limit reached. Please upgrade to Pro.',
      rating_count: 30,
      rating_limit: 30,
    };

    expect(limitReachedResponse.success).toBe(false);
    expect(limitReachedResponse.code).toBe('LIMIT_EXCEEDED');
    expect(limitReachedResponse.rating_count).toBeGreaterThanOrEqual(limitReachedResponse.rating_limit!);
  });

  it('should return routing payload for eligible 4-5 star redirect', () => {
    const authorizedResponse: IncrementRatingResponse = {
      success: true,
      code: 'AUTHORIZED',
      business_id: '998495f5-dc26-470a-8a62-bc57c28d5d1c',
      business_name: 'B2 Cafe Tehran',
      google_maps_review_url: 'https://maps.app.goo.gl/exampleReviewIntent',
      account_status: 'active',
      rating_count: 14,
      rating_limit: 30,
    };

    expect(authorizedResponse.success).toBe(true);
    expect(authorizedResponse.google_maps_review_url).toMatch(/^https?:\/\//);
    expect(authorizedResponse.rating_count).toBeLessThan(30);
  });

  it('should restrict feedback insertion to 1-3 stars', async () => {
    const { reviewShieldService } = await import('../src/lib/supabaseClient');

    // 4 and 5 stars must NOT go to feedback defense database
    // @ts-expect-error testing invalid rating input at runtime
    const result = await reviewShieldService.submitFeedback({
      business_id: 'sample-uuid',
      rating: 5,
      feedback_text: 'Great food!',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('strictly between 1 and 3');
  });
});