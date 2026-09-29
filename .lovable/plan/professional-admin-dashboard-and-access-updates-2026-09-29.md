# Professional admin dashboard and access updates

## What will change
- Change the admin email to `infowearzza@gmail.com` while keeping the requested password.
- Add an accessible show/hide control to every password field: admin login, seller login, seller registration, and seller password settings.
- Ask for confirmation before both admin and seller logout actions.
- Redesign the admin overview into a dense, professional operations dashboard with compact key metrics, order and revenue trends, order-status distribution, seller-status distribution, category/product insights, and recent-order activity.
- Make loading, empty, and data-error states clear so the dashboard remains usable when some store data cannot load.
- Fix the white screen at startup by restoring the store connection configuration and adding a visible fallback instead of allowing missing configuration to crash the entire site.

## Verification
- Confirm the customer homepage renders on desktop and mobile.
- Confirm the new admin credentials work and the previous email no longer works.
- Confirm every password visibility control works.
- Confirm canceling logout keeps the user signed in and confirming logout exits.
- Confirm the admin overview charts render with real store data and remain stable with empty data.

## Technical details
- Reuse the current React/Vite structure and existing data source.
- Use responsive SVG/CSS charts to avoid adding a fragile chart dependency.
- Keep the public store connection available to production builds while guarding startup against missing values.
- Keep the requested admin credential behavior unchanged apart from the new email; securing admin access server-side is outside this visual/behavior update.
