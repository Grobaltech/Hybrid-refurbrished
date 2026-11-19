# Hybrid Refurbrished

A refreshed Hybrid Shop application built with Vue 3, Tailwind CSS, TypeScript and Supabase.

## Structure
- `apps/web` — Vue 3 single-page application.
- `supabase/migrations` — database schema and access-control policies.
- `supabase/functions/admin-users` — secure privileged staff-account operations.

## Setup
1. Copy `.env.example` to `.env` and set the Supabase project URL and anon key.
2. Run `npm install`, then `npm run dev`.
3. Apply `supabase/migrations/0001_staff_access.sql` to the Supabase project.
4. Deploy the `admin-users` Edge Function and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as Supabase function secrets.

Never expose the service-role key in frontend variables or commit it to this public repository.

## Staff accounts
The Users & Access screen is administrator-only. Account creation, enabling/disabling, role changes, individual capabilities, page overrides and administrator password resets are performed by the `admin-users` Edge Function. The function verifies the caller's Supabase access token and administrator profile before executing privileged operations. Staff can change their own password from My Account.

Staff creation requires a unique username and email address. The email is the Supabase sign-in identity; the username is the in-app staff identifier.
