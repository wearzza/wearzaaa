<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep a checked-in public Supabase configuration fallback in `src/lib/publicConfig.ts` because deployments may omit ignored `.env` files.
- Reuse `PasswordField` for every password input so visibility behavior stays accessible and consistent.
- Keep reporting calculations and SVG/CSS chart UI in `AnalyticsOverview` so the admin panel stays focused on navigation and management views.
- Define analytics colors as semantic global CSS tokens and expose them through Tailwind so charts and controls stay visually consistent.
- Use the cropped transparent Wearza mark for the white splash screen so the image does not show a white square or nested red tile.
- Store data lives in Lovable Cloud; the app client must use env URL and publishable key only as a matching pair, falling back to publicConfig, so it never mixes keys from two backends.
- Keep commission, cancellation eligibility and order transitions in `src/lib/commerce.ts`, mirrored by database validation triggers, so UI and saved rules agree.
- Reuse `SellerAnalytics` for individual seller reporting in admin and seller views; use paginated fetching so high-volume stores are not silently truncated.
- Guest order tracking uses device-held random capability tokens with SHA-256 hashes, never a phone-only global order listing; customer cancellation must validate the token and current status atomically.
- Keep seller policy content versioned in one shared source used by signup and the seller policy view; new registrations record self-delivery and refund-policy acceptance.
- Use shared Button and native Dialog controls for new commerce interactions so keyboard focus and styling stay consistent.
