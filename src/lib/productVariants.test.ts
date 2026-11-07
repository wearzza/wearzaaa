import { describe, expect, test } from 'bun:test';
import { cartKey, deliveryLabel, itemPrice, sizeLabel, validateVariants, variantSummary, type ProductVariant } from './productVariants';
import type { Product } from './supabase';

const options: ProductVariant[] = [
  { id: 'small-black', size: 'S', color: 'Black', price: 500, stock: 3 },
  { id: 'large-black', size: 'L', color: 'Black', price: 650, stock: 2, width: 52, length: 70 },
  { id: 'large-red', size: 'L', color: 'Red', price: 700, stock: 0 },
];
const product = { id: 'shirt', real_price: 500, stock: 5, variants: options } as Product;
describe('Seller listing options', () => {
  test('clothes and shoes use different size units', () => {
    expect(validateVariants(options, 'clothing', 'letter')).toBe('');
    expect(validateVariants([{ ...options[0], size: '42' }], 'shoes', 'EU')).toBe('');
    expect(validateVariants(options, 'shoes', 'letter')).not.toBe('');
    expect(validateVariants(options, 'clothing', 'EU')).not.toBe('');
    expect(sizeLabel('42', 'EU')).toBe('EU 42');
    expect(sizeLabel('32', 'waist_in')).toBe('32 in waist');
  });
  test('width and length are optional per size but positive when entered', () => {
    expect(validateVariants([options[0]], 'clothing', 'letter')).toBe('');
    expect(validateVariants([options[1]], 'clothing', 'letter')).toBe('');
    expect(validateVariants([{ ...options[1], width: -1 }], 'clothing', 'letter')).not.toBe('');
    expect(validateVariants([{ ...options[1], length: 0 }], 'clothing', 'letter')).not.toBe('');
  });
  test('each size and color can have a different selling price', () => {
    expect(itemPrice({ product, variantId: 'small-black' })).toBe(500);
    expect(itemPrice({ product, variantId: 'large-black' })).toBe(650);
    expect(itemPrice({ product, variantId: 'large-red' })).toBe(700);
    expect(variantSummary(options, 999, 999)).toEqual({ price: 500, stock: 5 });
  });
  test('cart identity distinguishes both size and color of the same listing', () => {
    expect(cartKey({ product, variantId: 'large-black' })).not.toBe(cartKey({ product, variantId: 'large-red' }));
    expect(cartKey({ product, variantId: 'small-black' })).not.toBe(cartKey({ product, variantId: 'large-black' }));
  });
  test('free delivery supports one, some or all items without declaring paid items free', () => {
    expect(deliveryLabel([{ free_delivery: true }])).toBe('Free delivery');
    expect(deliveryLabel([{ free_delivery: true }, { free_delivery: true }])).toBe('Free delivery');
    expect(deliveryLabel([{ free_delivery: true }, { free_delivery: false }])).not.toBe('Free delivery');
    expect(deliveryLabel([{ free_delivery: false }])).not.toBe('Free delivery');
  });
  test('duplicate options, invalid price and fractional stock cannot be published', () => {
    expect(validateVariants([options[0], { ...options[0], id: 'another' }], 'clothing', 'letter')).not.toBe('');
    expect(validateVariants([{ ...options[0], price: 0 }], 'clothing', 'letter')).not.toBe('');
    expect(validateVariants([{ ...options[0], stock: 1.5 }], 'clothing', 'letter')).not.toBe('');
  });
});