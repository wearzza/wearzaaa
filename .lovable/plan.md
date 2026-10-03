# Wearza upgrade: ban/reject fix, categories, search, shop links, public shop pages, new look

## Important blocker
Your store data lives in your own external database, which is not connected to this project. Ban/reject fails because that database refuses the change. Categories and shop links also need database changes. Two options:
- Connect your database in Project Settings > Connectors so changes can be applied directly, or
- I provide one SQL file you paste once into your database's SQL editor.

## What gets built

1. **Ban / Reject fix**
   - Database script allowing status changes, plus clear success/failure messages in admin.
   - Banned/rejected shops disappear from the store and are signed out of seller tools.

2. **Categories**
   - New categories list in the database (seeded with Men, Women, Kids, Streetwear, Old Money, Budget Deals).
   - Admin: add, rename, hide, delete categories (with icon/emoji).
   - Sellers: create their own category while adding a product (admin can remove it later).
   - Homepage, filters and product forms read categories from the list instead of a fixed set.

3. **Smarter search**
   - Searches name, description, category, shop name and sizes; tolerant of typos and word order ("red shirt men").
   - Live suggestions dropdown (products, categories, shops), recent searches, and a results page with filters (price, rating, category, sort).

4. **Short shop link**
   - Each shop gets a short handle after signup, e.g. `wearza.lovable.app/s/rahulstore`.
   - Seller dashboard shows the link with Copy and Share buttons for Instagram/TikTok bio.

5. **Public shop page (for customers)**
   - Opened from the link or any product/shop card: banner, logo, verified badge, location, socials, rating, product count, joined date, categories tabs, all products, reviews.

6. **Whole-site UI upgrade**
   - Cleaner marketplace look (Daraz/Meesho style): sticky header with big search, category strip, refined product cards, consistent colors via design tokens, better mobile layout across customer, seller and admin.

## Technical details
- SQL: `categories` table (id, slug, label, icon, created_by_seller, is_active, sort_order) with grants + RLS; `sellers.shop_slug` unique column with backfill; status-update policy fix.
- Short links via `?shop=slug` / `/s/slug` handled in App routing (SPA fallback).
- Search: client-side scoring over tokens with fuzzy matching; no new dependencies.
