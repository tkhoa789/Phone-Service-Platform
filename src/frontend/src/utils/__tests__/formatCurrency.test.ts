import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../formatCurrency';

describe('formatCurrency utility', () => {
  it('formats positive integers as Vietnamese Dong', () => {
    const formatted = formatCurrency(500000);
    // Handles Vietnamese Dong symbol and non-breaking spaces
    expect(formatted.replace(/\s/g, ' ')).toMatch(/500\.000\s?₫/);
  });

  it('formats zero correctly', () => {
    const formatted = formatCurrency(0);
    expect(formatted.replace(/\s/g, ' ')).toMatch(/0\s?₫/);
  });

  it('safely handles null and undefined by defaulting to 0', () => {
    const fromNull = formatCurrency(null);
    const fromUndefined = formatCurrency(undefined);
    expect(fromNull.replace(/\s/g, ' ')).toMatch(/0\s?₫/);
    expect(fromUndefined.replace(/\s/g, ' ')).toMatch(/0\s?₫/);
  });

  it('formats large transaction values without scientific notation', () => {
    const formatted = formatCurrency(49900000);
    expect(formatted.replace(/\s/g, ' ')).toMatch(/49\.900\.000\s?₫/);
  });
});
