# Real Estate MVP Plan

This plan breaks the MVP into small, testable steps so we can implement features one by one.

## Current Status
- Home page UI (dark theme, hero, filters, listing cards).
- Property detail page UI (gallery, details, highlights, inquiry form layout).
- Onboarding role choice page (buyer vs agent).
- Supabase schema drafted and applied (per SQL editor).

## Goals (MVP)
1) Public marketplace
   - Home page shows approved listings
   - Filters: city, price range, property type
   - Property detail page with images and inquiry form
2) Authentication
   - Email-based auth
   - Roles stored in DB (public/agent/admin)
3) Agent dashboard
   - View “My Listings”
   - Create listing (title, description, price, city, type)
   - New listings start pending
4) Admin dashboard
   - Review pending listings
   - Approve/reject with feedback

## Step-by-step Implementation

### Phase 0 — Project Setup (quick checks)
- [ ] Confirm `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Add Supabase server client (for server components and secure actions).
- [ ] Ensure database migrations are in repo (Supabase CLI, optional).

### Phase 1 — Public Marketplace (read-only)
- [ ] Replace mock data with Supabase read for approved listings.
- [ ] Implement filters (city, price range, property type).
- [ ] Wire property cards to `/properties/[id]`.
- [ ] Property detail page uses real data + images from Supabase storage.
- [ ] Inquiry form saves to DB (approved listings only).

### Phase 2 — Authentication + Roles
- [ ] Email sign-up / sign-in UI.
- [ ] Create profile row on sign-up.
- [ ] Onboarding choice updates role to `agent` and collects phone.
- [ ] Restrict pages by role (guard agent/admin views).

### Phase 3 — Agent Dashboard
- [ ] “My Listings” page (agent-only).
- [ ] Create listing form (simple fields).
- [ ] Upload images to Supabase storage.
- [ ] Agent can edit/delete pending or rejected listings.

### Phase 4 — Admin Dashboard
- [ ] Pending listings queue.
- [ ] Approve or reject with feedback.
- [ ] Admin sees all inquiries (read-only).

### Phase 5 — Polish + QA
- [ ] Empty states and loading states.
- [ ] Basic form validation.
- [ ] Responsive fixes.
- [ ] Minimal error handling and toast feedback.

## Non-goals (MVP)
- Payments
- Complex map integration
- Advanced search or AI recommendations
- Multiple admin roles/teams

## Notes
- Keep logic minimal; avoid abstractions.
- Do not expose service keys to the client.
- All public pages must only show approved listings.
