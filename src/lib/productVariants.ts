import type { Product, OrderItem } from './supabase';

export type ProductType = 'clothing' | 'shoes' | 'other';
export type SizeSystem = 'letter' | 'international' | 'waist_in' | 'age' | 'one_size' | 'EU' | 'UK' | 'US' | 'cm' | 'custom';
export interface ProductVariant { id: string; size: string; color: string; price: number; stock: number; width?: number | null; length?: number | null }
export const SIZE_SYSTEMS: Record<ProductType, { value: SizeSystem; label: string; sizes: string[] }[]> = {
  clothing: [
    { value: 'letter', label: 'Letter sizes (XS–3XL)', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
    { value: 'international', label: 'Numeric clothing sizes', sizes: ['32', '34', '36', '38', '40', '42', '44', '46'] },
    { value: 'waist_in', label: 'Waist size (inches)', sizes: ['26', '28', '30', '32', '34', '36', '38', '40'] },
    { value: 'age', label: 'Kids age (years)', sizes: ['1–2', '3–4', '5–6', '7–8', '9–10', '11–12'] },
    { value: 'one_size', label: 'One size', sizes: ['One size'] },
  ],
  shoes: [
    { value: 'EU', label: 'EU shoe size', sizes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] },
    { value: 'UK', label: 'UK shoe size', sizes: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
    { value: 'US', label: 'US shoe size', sizes: ['5', '6', '7', '8', '9', '10', '11', '12', '13'] },
    { value: 'cm', label: 'Foot length (cm)', sizes: ['23', '23.5', '24', '24.5', '25', '25.5', '26', '26.5', '27', '28'] },
  ],
  other: [{ value: 'one_size', label: 'One size', sizes: ['One size'] }, { value: 'custom', label: 'Custom size', sizes: [] }],
};
export function sizeLabel(size: string, system?: string) {
  if (['EU', 'UK', 'US'].includes(system || '')) return `${system} ${size}`;
  if (system === 'waist_in') return `${size} in waist`;
  if (system === 'age') return `${size} years`;
  if (system === 'cm') return `${size} cm`;
  return size;
}
export function validateVariants(variants: ProductVariant[], type: ProductType, system: SizeSystem) {
  if (!SIZE_SYSTEMS[type].some(s => s.value === system)) return 'Choose a size unit suitable for this product.';
  if (variants.length > 200) return 'Use no more than 200 size and color options.';
  const seen = new Set<string>(), ids = new Set<string>();
  for (const v of variants) {
    if (!v.id || ids.has(v.id)) return 'Each option must have a unique ID.';
    ids.add(v.id);
    if (!v.size.trim() || !v.color.trim()) return 'Add a size and color for every option.';
    const key = `${v.size.trim().toLowerCase()}|${v.color.trim().toLowerCase()}`;
    if (seen.has(key)) return 'Each size and color combination must be unique.';
    seen.add(key);
    if (!Number.isFinite(v.price) || v.price <= 0) return 'Every option needs a price greater than zero.';
    if (!Number.isInteger(v.stock) || v.stock < 0) return 'Stock must be a whole number, zero or more.';
    if ([v.width, v.length].some(n => n != null && (!Number.isFinite(n) || n <= 0))) return 'Optional width and length must be greater than zero.';
  }
  return '';
}
export function variantSummary(variants: ProductVariant[], basePrice: number, baseStock: number) {
  return { price: variants.length ? Math.min(...variants.map(v => v.price)) : basePrice, stock: variants.length ? variants.reduce((s, v) => s + v.stock, 0) : baseStock };
}
export function selectionFor(product: Product, variantId?: string) { return product.variants?.find(v => v.id === variantId); }
export function itemPrice(item: { product: Product; variantId?: string }) { return selectionFor(item.product, item.variantId)?.price ?? item.product.real_price; }
export function itemStock(item: { product: Product; variantId?: string }) { return selectionFor(item.product, item.variantId)?.stock ?? item.product.stock; }
export function cartKey(item: { product: Product; selectedSize?: string; variantId?: string }) { return JSON.stringify([item.product.id, item.variantId || '', item.variantId ? '' : item.selectedSize || '']); }
export function orderOptionText(i: OrderItem) { return [i.selected_size && sizeLabel(i.selected_size, i.selected_size_system), i.selected_color, i.selected_width && `Width ${i.selected_width} ${i.measurement_unit}`, i.selected_length && `Length ${i.selected_length} ${i.measurement_unit}`].filter(Boolean).join(' · '); }
export function deliveryLabel(items: { free_delivery?: boolean }[]) {
  const count = items.filter(i => i.free_delivery).length;
  return items.length && count === items.length ? 'Free delivery' : count > 0 ? 'Free on marked items; other fees confirmed by seller' : 'Fee confirmed by seller';
}