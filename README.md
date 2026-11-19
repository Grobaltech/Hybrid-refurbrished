# Hybrid Refurbrished

A refreshed Hybrid Shop application built with Vue 3, Tailwind CSS, TypeScript and Supabase.

## Structure
- `apps/web` — Vue 3 single-page application.
- `supabase/migrations` — database schema and access-control policies.
- `supabase/functions` — secure privileged account operations (Supabase Edge Functions).

## Setup
1. Copy `.env.example` to `.env` and set the Supabase project URL and anon key.
2. Install dependencies with `npm install`.
3. Run the web app with `npm run dev`.
4. Apply the SQL migrations to the intended Supabase project.
5. Deploy the `admin-users` Edge Function and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as Supabase function secrets.

Never place the Supabase service-role key in frontend environment variables or commit it to this public repository.

## Staff accounts
The Users & Access screen is restricted to administrators. Account creation, disabling/enabling, role changes and password resets are performed by the `admin-users` Edge Function after it verifies the caller's Supabase JWT and administrator role. Staff members can change their own password from Account settings.
