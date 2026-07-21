/*
# Wearza: Advanced Seller Verification System

## Changes to `sellers` table
This migration upgrades the seller onboarding system with structured location,
legal documents, citizenship verification, and dual terms agreement.

### New Columns
1. **Structured Location** (replaces simple `shop_location` text):
   - `province` text — Nepal province name
   - `district` text — district within province
   - `municipality` text — municipality within district
   - `ward_number` integer — ward number
   - `map_url` text — Google Maps location link
   - (old `shop_location` kept for backward compat, populated from structured fields)

2. **Legal Documents**:
   - `shop_registration_url` text — Shop Registration Certificate image (required)
   - `pan_vat_url` text — PAN or VAT Certificate image (required)
   - `business_license_url` text — Business License image (optional)

3. **Citizenship Verification**:
   - `citizenship_front_url` text — Citizenship front image (required)
   - `citizenship_back_url` text — Citizenship back image (required)

4. **Dual Terms Agreement**:
   - `terms_business_agreed` boolean — Business agreement checkbox (required)
   - `terms_legal_agreed` boolean — Legal & identity agreement checkbox (required)
   - (old `terms_agreed` kept, derived from both)

### Notes
- All new columns are nullable so existing rows aren't affected.
- The frontend enforces required fields during signup.
- Admin can view all uploaded documents in the seller management panel.
*/

-- Structured location
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS municipality text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS ward_number integer;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS map_url text;

-- Legal documents
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS shop_registration_url text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS pan_vat_url text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS business_license_url text;

-- Citizenship verification
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS citizenship_front_url text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS citizenship_back_url text;

-- Dual terms
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS terms_business_agreed boolean NOT NULL DEFAULT false;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS terms_legal_agreed boolean NOT NULL DEFAULT false;
