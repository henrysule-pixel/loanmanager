# Loan Management SaaS

Production-ready private lending dashboard with Next.js 14, Clerk authentication, Supabase PostgreSQL, Tailwind, shadcn-style components, and Recharts analytics.

## Stack

- Next.js 14 App Router + TypeScript
- Clerk (email/password auth + session middleware)
- Supabase PostgreSQL (normalized schema + RLS-ready SQL)
- Tailwind CSS + reusable shadcn-style UI components
- Recharts dashboards
- Zod validation for all write inputs

## Setup

1. Install dependencies:
   - `npm install`
2. Configure env:
   - Copy `.env.example` to `.env.local`
   - Add Clerk and Supabase keys
3. Apply schema:
   - Run `supabase/schema.sql` in your Supabase SQL editor
4. Seed sample data:
   - Run `supabase/seed.sql`
5. Start app:
   - `npm run dev`

## Main Modules

- `/dashboard`: KPI cards and analytics charts
- `/borrowers`: borrower CRUD + profile + loan history
- `/loans`: loan creation, status updates, payment tracking
- `/investors`: investor CRUD + transaction tracking
- `/api/*`: typed route handlers secured by Clerk and Zod

## Security Notes

- Clerk middleware protects dashboard and API routes
- Supabase schema includes RLS enablement and starter policies
- All write paths validate payloads with Zod
