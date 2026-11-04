import { describe, expect, test } from 'bun:test';
import { hiddenListingUpdate, listingActiveOnSave } from './productListing';

describe('Admin product moderation', () => {
  test('cancel or reject hides the listing without deleting product or order data', () => {
    expect(hiddenListingUpdate().is_active).toBe(false);
    expect(Object.keys(hiddenListingUpdate()).sort()).toEqual(['is_active', 'updated_at']);
  });
  test('seller edits do not republish a hidden listing', () => {
    expect(listingActiveOnSave({ is_active: false })).toBe(false);
    expect(listingActiveOnSave({ is_active: true })).toBe(true);
  });
});