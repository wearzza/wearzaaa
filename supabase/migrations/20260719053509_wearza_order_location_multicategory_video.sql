/*
# Wearza: Structured Order Location, Multi-Category Products, Video Uploads

## 1. Structured Order Location
Adds province/district/municipality/ward/map_url columns to `orders` table so customer
orders capture the same structured location as seller signup. The old `customer_location`
and `customer_address` text columns are kept and populated from the structured fields
for backward compatibility with existing code.

## 2. Multi-Category Products
Adds a `categories` text[] array column to `products` so a product can belong to one OR
multiple categories (e.g. Men + Streetwear + Old Money). The old single `category` text
column is kept for backward compatibility; new writes populate both.

## 3. Product Video Upload
Adds a `video_data` text column to `products` to store base64-encoded uploaded video
files (mp4 etc.) directly from the seller's device. The old `video_url` text column is
kept for optional external links.

## Security
- No RLS changes (existing policies cover new columns automatically).
- No destructive operations.
*/

-- ===== ORDERS: structured location =====
ALTER TABLE orders ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS municipality text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ward_number integer;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS map_url text;

-- ===== PRODUCTS: multi-category + video upload =====
ALTER TABLE products ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_data text;

-- Backfill categories array from single category for existing rows
UPDATE products SET categories = ARRAY[category] WHERE category IS NOT NULL AND (categories IS NULL OR array_length(categories, 1) IS NULL);
