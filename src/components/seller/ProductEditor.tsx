import { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { supabase, type Product, type Seller, type ProductCategory } from '../../lib/supabase';
import { useCategories, refreshCategories, slugify } from '../../lib/catalog';
import { listingActiveOnSave } from '../../lib/productListing';
import { SIZE_SYSTEMS, sizeLabel, validateVariants, variantSummary, type ProductType, type ProductVariant, type SizeSystem } from '../../lib/productVariants';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';

const field = 'w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-primary';
export default function ProductEditor({ seller, product, onClose, onSaved }: { seller: Seller; product: Product | null; onClose: () => void; onSaved: () => void }) {
  const cats = useCategories();
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [categories, setCategories] = useState<string[]>(product?.categories?.length ? product.categories : product ? [product.category] : []);
  const [type, setType] = useState<ProductType>(product?.product_type || 'clothing');
  const [system, setSystem] = useState<SizeSystem>(product?.size_system || 'letter');
  const [unit, setUnit] = useState<'cm' | 'in'>(product?.measurement_unit || 'cm');
  const [price, setPrice] = useState(String(product?.real_price || ''));
  const [cutPrice, setCutPrice] = useState(String(product?.cut_price || ''));
  const [stock, setStock] = useState(String(product?.stock ?? 1));
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [sizes, setSizes] = useState<string[]>([...new Set(product?.variants?.map(v => v.size) || [])]);
  const [colors, setColors] = useState([...new Set(product?.variants?.map(v => v.color) || [])].join(', '));
  const [customSize, setCustomSize] = useState('');
  const [free, setFree] = useState(product?.free_delivery || false);
  const [images, setImages] = useState<string[]>(product?.image_urls || []);
  const [video, setVideo] = useState(product?.video_data || '');
  const [videoUrl, setVideoUrl] = useState(product?.video_url || '');
  const [newCat, setNewCat] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const allSizes = [...new Set([...(SIZE_SYSTEMS[type].find(s => s.value === system)?.sizes || []), ...sizes])];
  const summary = variantSummary(variants, Number(price), Number(stock));
  function changeType(next: ProductType) {
    if (variants.length && !window.confirm('Changing the product type clears the current size and color options. Continue?')) return;
    setType(next); setSystem(SIZE_SYSTEMS[next][0].value); setVariants([]); setSizes([]);
  }
  function changeSystem(next: SizeSystem) {
    if (variants.length && !window.confirm('Changing the size unit clears the current options. Continue?')) return;
    setSystem(next); setVariants([]); setSizes([]);
  }
  function generate() {
    setError('');
    const colorList = [...new Set(colors.split(',').map(c => c.trim()).filter(Boolean))];
    if (!sizes.length || !colorList.length) { setError('Choose at least one size and enter at least one color.'); return; }
    if (sizes.length * colorList.length > 200) { setError('Use no more than 200 size and color options.'); return; }
    if (!(Number(price) > 0) || !Number.isInteger(Number(stock)) || Number(stock) < 0) { setError('Enter a positive default price and a whole-number stock first.'); return; }
    setVariants(sizes.flatMap(size => colorList.map(color => {
      const old = variants.find(v => v.size === size && v.color.toLowerCase() === color.toLowerCase());
      const measurements = variants.find(v => v.size === size);
      return old || { id: crypto.randomUUID(), size, color, price: Number(price), stock: Number(stock), width: measurements?.width, length: measurements?.length };
    })));
  }
  function patchVariant(id: string, patch: Partial<ProductVariant>) { setVariants(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v)); }
  function measurement(size: string, key: 'width' | 'length', value: string) {
    setVariants(prev => prev.map(v => v.size === size ? { ...v, [key]: value === '' ? null : Number(value) } : v));
  }
  async function upload(files: FileList | null, isVideo = false) {
    if (!files?.length) return;
    setUploading(true); setError('');
    try {
      const results = await Promise.all(Array.from(files).map(file => new Promise<string>((resolve, reject) => {
        if (file.size > (isVideo ? 15 : 5) * 1024 * 1024) { reject(new Error(isVideo ? 'Video must be under 15 MB.' : 'Each image must be under 5 MB.')); return; }
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('The file could not be read.')); reader.readAsDataURL(file);
      })));
      if (isVideo) setVideo(results[0]); else setImages(prev => [...prev, ...results]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.'); }
    finally { setUploading(false); }
  }
  async function addCategory() {
    const label = newCat.trim(), slug = slugify(label);
    if (!slug) return;
    setError('');
    if (!cats.some(c => c.slug === slug)) {
      const { error: e } = await supabase.from('categories').insert({ slug, label, icon: '🏷️', sort_order: cats.length + 1, is_active: true, created_by_seller: seller.id });
      if (e) { setError('Could not add this category. Please try again.'); return; }
      await refreshCategories();
    }
    setCategories(prev => [...new Set([...prev, slug])]); setNewCat('');
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (busy || uploading) return; setError('');
    const validation = validateVariants(variants, type, system);
    if (validation) { setError(validation); return; }
    if (!name.trim() || !categories.length || !images.length) { setError('Add a name, category and at least one product photo.'); return; }
    if (!Number.isFinite(summary.price) || summary.price <= 0 || !Number.isInteger(summary.stock) || summary.stock < 0) { setError('Enter a positive price and a whole-number stock.'); return; }
    if (cutPrice && (!Number.isFinite(Number(cutPrice)) || Number(cutPrice) <= Math.max(summary.price, ...variants.map(v => v.price)))) { setError('The original price must be higher than all selling prices.'); return; }
    setBusy(true);
    const payload = { seller_id: seller.id, name: name.trim(), description: description.trim() || null, category: categories[0] as ProductCategory, categories, real_price: summary.price, cut_price: cutPrice ? Number(cutPrice) : null, stock: summary.stock, image_urls: images, video_data: video || null, video_url: videoUrl || null, is_active: listingActiveOnSave(product), product_type: type, size_system: system, measurement_unit: unit, variants: variants.map(v => ({ ...v, size: v.size.trim(), color: v.color.trim() })), free_delivery: free, updated_at: new Date().toISOString() };
    try {
      const result = product ? await supabase.from('products').update(payload).eq('id', product.id).eq('seller_id', seller.id).select('id').single() : await supabase.from('products').insert(payload).select('id').single();
      if (result.error || !result.data) throw new Error(result.error?.message || 'The listing was not saved.');
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save the product.'); }
    finally { setBusy(false); }
  }
  return <Dialog title={product ? 'Edit product' : 'Add product'} onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={save} className="space-y-5">
      <section className="space-y-3"><h3 className="font-bold text-sm">Product details</h3>
        <label className="block text-sm space-y-1"><span>Product name</span><input required maxLength={160} value={name} onChange={e => setName(e.target.value)} className={field} /></label>
        <label className="block text-sm space-y-1"><span>Description</span><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={field} /></label>
        <label className="block text-sm space-y-1"><span>Product type</span><select value={type} onChange={e => changeType(e.target.value as ProductType)} className={field}><option value="clothing">Clothing</option><option value="shoes">Shoes</option><option value="other">Other</option></select></label>
        <fieldset><legend className="text-sm mb-2">Categories</legend><div className="flex flex-wrap gap-3">{[...cats, ...categories.filter(c => !cats.some(x => x.slug === c)).map(c => ({ slug: c, label: c.replace(/_/g, ' ') }))].map(c => <label key={c.slug} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={categories.includes(c.slug)} onChange={e => setCategories(prev => e.target.checked ? [...prev, c.slug] : prev.filter(x => x !== c.slug))} className="accent-primary" />{c.label}</label>)}</div></fieldset>
        <div className="flex gap-2"><input aria-label="New category" placeholder="New category" maxLength={40} value={newCat} onChange={e => setNewCat(e.target.value)} className={field} /><Button variant="outline" disabled={!newCat.trim()} onClick={addCategory}><Plus size={14} />Add</Button></div>
      </section>
      <section className="border-t border-border pt-4 space-y-3"><h3 className="font-bold text-sm">Pricing & inventory</h3><div className="grid grid-cols-2 gap-3"><label className="block text-xs space-y-1"><span>{variants.length ? 'Default option price (Rs.)' : 'Selling price (Rs.)'}</span><input aria-label="Selling price" type="number" step="0.01" min="0.01" required value={price} onChange={e => setPrice(e.target.value)} className={field} /></label><label className="block text-xs space-y-1"><span>Original price (optional)</span><input aria-label="Original price" type="number" step="0.01" min="0" value={cutPrice} onChange={e => setCutPrice(e.target.value)} className={field} /></label></div><label className="block text-xs space-y-1"><span>{variants.length ? 'Default stock per option' : 'Stock / default stock per option'}</span><input aria-label="Stock" type="number" min="0" step="1" required value={stock} onChange={e => setStock(e.target.value)} className={field} /></label></section>
      <section className="border-t border-border pt-4 space-y-3"><h3 className="font-bold text-sm">Sizes & colors</h3>
        <label className="block text-xs space-y-1"><span>Size unit</span><select aria-label="Size unit" value={system} onChange={e => changeSystem(e.target.value as SizeSystem)} className={field}>{SIZE_SYSTEMS[type].map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
        <fieldset><legend className="text-xs mb-2">Available sizes</legend><div className="flex flex-wrap gap-2">{allSizes.map(s => <Button key={s} variant={sizes.includes(s) ? 'primary' : 'outline'} aria-pressed={sizes.includes(s)} onClick={() => setSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} className="min-w-10 h-9 text-xs">{s}</Button>)}</div></fieldset>
        <div className="flex gap-2"><input aria-label="Custom size" placeholder="Custom size, e.g. 42.5" value={customSize} maxLength={30} onChange={e => setCustomSize(e.target.value)} className={field} /><Button variant="outline" disabled={!customSize.trim()} onClick={() => { setSizes(prev => [...new Set([...prev, customSize.trim()])]); setCustomSize(''); }} aria-label="Add custom size"><Plus size={16} /></Button></div>
        <label className="block text-xs space-y-1"><span>Colors (comma separated)</span><input aria-label="Colors" value={colors} onChange={e => setColors(e.target.value)} placeholder="Black, White, Red" maxLength={500} className={field} /></label>
        <Button variant="outline" onClick={generate} className="w-full"><Plus size={14} />{variants.length ? 'Update size & color options' : 'Create size & color options'}</Button>
        {variants.length > 0 && <>
          <div className="flex items-center justify-between gap-2 text-xs"><strong>{variants.length} options · {summary.stock} total stock</strong><Button variant="ghost" onClick={() => { if (window.confirm('Remove all size and color options?')) setVariants([]); }} className="text-destructive text-xs">Clear options</Button></div>
          <div className="space-y-2">{variants.map(v => <div key={v.id} className="border-b border-border pb-3"><div className="flex items-center justify-between gap-2 mb-2"><p className="text-sm font-semibold break-words">{sizeLabel(v.size, system)} · {v.color}</p><Button variant="ghost" aria-label={`Remove ${v.size} ${v.color}`} onClick={() => setVariants(prev => prev.filter(x => x.id !== v.id))} className="h-8 w-8 p-0 shrink-0 text-destructive"><Trash2 size={14} /></Button></div><div className="grid grid-cols-2 gap-3"><label className="text-xs space-y-1"><span>Price (Rs.)</span><input aria-label={`Price ${v.size} ${v.color}`} type="number" step="0.01" min="0.01" required value={Number.isNaN(v.price) ? '' : v.price || ''} onChange={e => patchVariant(v.id, { price: Number(e.target.value) })} className={field} /></label><label className="text-xs space-y-1"><span>Stock</span><input aria-label={`Stock ${v.size} ${v.color}`} type="number" min="0" step="1" required value={Number.isNaN(v.stock) ? '' : v.stock} onChange={e => patchVariant(v.id, { stock: e.target.value === '' ? NaN : Number(e.target.value) })} className={field} /></label></div></div>)}</div>
          <h4 className="font-semibold text-sm pt-2">Size measurements (optional)</h4>
          <label className="block text-xs space-y-1"><span>Measurement unit</span><select aria-label="Measurement unit" value={unit} onChange={e => setUnit(e.target.value as 'cm' | 'in')} className={field}><option value="cm">Centimeters (cm)</option><option value="in">Inches (in)</option></select></label>
          {[...new Set(variants.map(v => v.size))].map(size => { const v = variants.find(x => x.size === size); return <fieldset key={size}><legend className="font-semibold text-xs mb-2">{sizeLabel(size, system)}</legend><div className="grid grid-cols-2 gap-3"><label className="text-xs space-y-1"><span>Width ({unit})</span><input aria-label={`Width ${size}`} type="number" step="0.01" min="0.01" value={v?.width ?? ''} onChange={e => measurement(size, 'width', e.target.value)} className={field} /></label><label className="text-xs space-y-1"><span>Length ({unit})</span><input aria-label={`Length ${size}`} type="number" step="0.01" min="0.01" value={v?.length ?? ''} onChange={e => measurement(size, 'length', e.target.value)} className={field} /></label></div></fieldset>; })}
        </>}
      </section>
      <section className="border-t border-border pt-4"><h3 className="font-bold text-sm mb-3">Delivery</h3><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={free} onChange={e => setFree(e.target.checked)} className="accent-primary w-4 h-4" /><span>Free delivery for this product</span></label></section>
      <section className="border-t border-border pt-4 space-y-3"><h3 className="font-bold text-sm">Photos & video</h3><label className="flex items-center gap-2 cursor-pointer border border-dashed border-border p-3 rounded-md text-sm"><Upload size={16} />Product photos<input aria-label="Product photos" type="file" accept="image/*" multiple onChange={e => upload(e.target.files)} className="hidden" /></label>
        <div className="flex flex-wrap gap-2">{images.map((url, i) => <div key={i} className="relative"><img src={url} alt={`Product photo ${i + 1}`} className="w-20 h-20 object-cover rounded-md border border-border" /><Button variant="danger" aria-label={`Remove photo ${i + 1}`} onClick={() => setImages(prev => prev.filter((_, index) => index !== i))} className="absolute top-0 right-0 h-6 w-6 p-0"><Trash2 size={12} /></Button></div>)}</div>
        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border p-3 rounded-md text-sm"><Upload size={16} />Product video (up to 15 MB)<input aria-label="Product video" type="file" accept="video/*" onChange={e => upload(e.target.files, true)} className="hidden" /></label>{video && <><video src={video} controls className="w-full max-h-40 rounded-md" /><Button variant="ghost" onClick={() => setVideo('')}>Remove video</Button></>}
        <label className="block text-xs space-y-1"><span>Video URL (optional)</span><input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className={field} /></label>
      </section>
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <div className="sticky bottom-0 bg-card border-t border-border pt-3 flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy || uploading}>{busy ? 'Saving…' : uploading ? 'Reading files…' : product ? 'Save changes' : 'Publish product'}</Button></div>
    </form>
  </Dialog>;
}