import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateUUID } from '../uuid';

describe('Safe UUID Generation (RFC 4122 v4)', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    // Restore global crypto
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  });

  it('Case 1 (Secure Context): Uses native crypto.randomUUID when available', () => {
    const mockUUID = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    const mockRandomUUID = vi.fn().mockReturnValue(mockUUID);

    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: mockRandomUUID,
      },
      writable: true,
      configurable: true,
    });

    const result = generateUUID();
    expect(mockRandomUUID).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockUUID);
  });

  it('Case 2 (Non-Secure Context LAN HTTP): Falls back to bit-shifting polyfill when crypto.randomUUID is unavailable', () => {
    // Simulate non-secure LAN HTTP environment (no crypto.randomUUID)
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = generateUUID();
    expect(typeof result).toBe('string');
    expect(result.length).toBe(36);
    // Format: 8-4-4-4-12
    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('Case 3 (RFC 4122 v4 Compliance): 1,000 generated UUIDs strictly conform to version 4 format', () => {
    // Test 1,000 iterations for statistical confidence
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const generated = new Set<string>();

    for (let i = 0; i < 1000; i++) {
      const id = generateUUID();
      expect(id).toMatch(uuidRegex);
      generated.add(id);
    }

    // High entropy check: No duplicates in 1,000 samples
    expect(generated.size).toBe(1000);
  });
});
