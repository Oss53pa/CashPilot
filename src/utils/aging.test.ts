import { describe, it, expect } from 'vitest';
import { getAgingBucket, getAgingLabel, AgingBucket } from './aging';

describe('getAgingBucket', () => {
  const refDate = new Date('2025-06-15T00:00:00.000Z');

  it('returns not_due when due date is in the future', () => {
    expect(getAgingBucket('2025-07-01', refDate)).toBe('not_due');
  });

  it('returns not_due when due date is tomorrow', () => {
    expect(getAgingBucket('2025-06-16', refDate)).toBe('not_due');
  });

  it('returns 1_30 when due date is today (0 days overdue)', () => {
    expect(getAgingBucket('2025-06-15', refDate)).toBe('1_30');
  });

  it('returns 1_30 for 1 day overdue', () => {
    expect(getAgingBucket('2025-06-14', refDate)).toBe('1_30');
  });

  it('returns 1_30 for 30 days overdue', () => {
    expect(getAgingBucket('2025-05-16', refDate)).toBe('1_30');
  });

  it('returns 31_60 for 31 days overdue', () => {
    expect(getAgingBucket('2025-05-15', refDate)).toBe('31_60');
  });

  it('returns 31_60 for 60 days overdue', () => {
    expect(getAgingBucket('2025-04-16', refDate)).toBe('31_60');
  });

  it('returns 61_90 for 61 days overdue', () => {
    expect(getAgingBucket('2025-04-15', refDate)).toBe('61_90');
  });

  it('returns 61_90 for 90 days overdue', () => {
    expect(getAgingBucket('2025-03-17', refDate)).toBe('61_90');
  });

  it('returns over_90 for 91 days overdue', () => {
    expect(getAgingBucket('2025-03-16', refDate)).toBe('over_90');
  });

  it('returns over_90 for very old invoices', () => {
    expect(getAgingBucket('2024-01-01', refDate)).toBe('over_90');
  });

  it('uses current date as default refDate', () => {
    // Due date far in the future should always be not_due
    expect(getAgingBucket('2099-12-31')).toBe('not_due');
  });

  it('handles year boundary correctly', () => {
    const janRef = new Date('2025-01-15T00:00:00.000Z');
    expect(getAgingBucket('2024-12-01', janRef)).toBe('31_60');
  });

  it('returns 1_30 at exactly the boundary (30 days)', () => {
    // 30 days before 2025-06-15 is 2025-05-16
    expect(getAgingBucket('2025-05-16', refDate)).toBe('1_30');
  });

  it('returns 31_60 at exactly the boundary (60 days)', () => {
    // 60 days before 2025-06-15 is 2025-04-16
    expect(getAgingBucket('2025-04-16', refDate)).toBe('31_60');
  });

  it('returns 61_90 at exactly the boundary (90 days)', () => {
    // 90 days before 2025-06-15 is 2025-03-17
    expect(getAgingBucket('2025-03-17', refDate)).toBe('61_90');
  });
});

describe('getAgingLabel', () => {
  it('returns correct label for not_due', () => {
    expect(getAgingLabel('not_due')).toBe('Non échu');
  });

  it('returns correct label for 1_30', () => {
    expect(getAgingLabel('1_30')).toBe('1-30 jours');
  });

  it('returns correct label for 31_60', () => {
    expect(getAgingLabel('31_60')).toBe('31-60 jours');
  });

  it('returns correct label for 61_90', () => {
    expect(getAgingLabel('61_90')).toBe('61-90 jours');
  });

  it('returns correct label for over_90', () => {
    expect(getAgingLabel('over_90')).toBe('> 90 jours');
  });

  it('covers all bucket types', () => {
    const allBuckets: AgingBucket[] = ['not_due', '1_30', '31_60', '61_90', 'over_90'];
    allBuckets.forEach(bucket => {
      expect(getAgingLabel(bucket)).toBeTruthy();
    });
  });
});
