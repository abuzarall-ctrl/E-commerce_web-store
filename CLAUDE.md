@AGENTS.md
# AbuzarStore Project Context

## Tech Stack
- Next.js 16 (App Router)
- Supabase (PostgreSQL + Auth + Storage)
- CSS Variables (no Tailwind classes used in inline styles)

## Color Palette
- --bg-primary: #122523
- --bg-surface: #17312F
- --bg-surface2: #21413E
- --accent: #7FD1BF
- --accent-hover: #A2E1D3
- --text-primary: #F5F2E9
- --text-muted: #D8E6DF
- --text-faint: #A9BFBA
- --badge-green: #245B52
- --badge-green-text: #E6F8F1
- --border: rgba(184, 231, 218, 0.16)
- Light theme overrides live under [data-theme="light"] in app/globals.css.

## Project Structure
- app/page.js — Home page
- app/shop/page.js — Shop page
- app/product/[id]/page.js — Product detail page
- app/admin/page.js — Admin panel
- app/auth/login/page.js — Login
- app/auth/signup/page.js — Signup
- app/components/Navbar.js — Navbar
- app/components/Footer.js — Footer
- app/components/ProductCard.js — Product card
- app/components/CartSync.js — Per-user cart persistence (user_metadata.cart)
- lib/supabaseClient.js — Supabase config
- lib/categories.js — Shared category constants
- lib/productCsv.js — CSV/TSV bulk import parser
- lib/orderPayload.js — Order JSONB payload builder/reader

## Database Tables
- products (id, name, description, category, price, discount, image_url, stock_status, created_at)
- users (id, email, role, created_at)
- orders (id, user_id, products, total, status, created_at)
  - `products` stores `{ version: 2, items, delivery, notes, payment }`; legacy array payloads are still read by lib/orderPayload.js

## Completed Phases
- Phase 1: Planning done
- Phase 2: Project setup done
- Phase 3: Database created in Supabase
- Phase 4: Auth system done (login, signup, role-based admin)
- Phase 5: Frontend in progress
  - Home page done
  - Shop page done
  - Admin panel done
  - Product detail page done
  - Cart drawer done
  - Checkout page done
  - Order history page done (/orders)
  - Admin login at /admin/login; access requires `app_metadata.role === 'admin'`
  - Checkout stores delivery + payment details inside the order JSONB payload
  - Admin CSV/TSV bulk import with downloadable template and live preview
  - Admin dashboard snapshot cards and product search
  - Theme toggle with persisted preference and no hydration mismatch

## Business Context
- Everyday crockery store
- Sells: Plastic Crockery, Glassware, Melamine
- Vision: Practical, durable tableware at honest prices
- Target: Pakistani customers
- Admin can: add/edit/delete products, bulk import CSV/TSV, toggle stock status, apply discounts, manage orders

## Rules
- Always use CSS variables for colors
- Mobile first design
- No page reload for cart operations
- Max 2 clicks for any action