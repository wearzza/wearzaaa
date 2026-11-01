import { expect, test } from 'bun:test';
import { shopUrl } from './shopLinks';

test('shop links use the short published address rather than a long preview hostname', () => {
  expect(shopUrl({ id: 'c9b8bfb0-92f5-47b6-9bc6-06c7c0510de8', shop_slug: 'bold' })).toBe('https://wearza.lovable.app/s/bold');
});