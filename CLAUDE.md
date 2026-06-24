@AGENTS.md
# AbuzarStore Project Context

## Tech Stack
- Next.js 16 (App Router)
- Supabase (PostgreSQL + Auth + Storage)
- CSS Variables (no Tailwind classes used in inline styles)

## Color Palette
- --bg-primary: #1C1C1A
- --bg-surface: #2A2A28
- --bg-surface2: #333331
- --accent: #D4A373
- --accent-hover: #C4936A
- --text-primary: #FEFAE0
- --text-muted: #FAEDCD
- --text-faint: #B8B4A0
- --badge-green: #CCD5AE
- --badge-green-text: #2D3D1A
- --border: rgba(212, 163, 115, 0.15)

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
- lib/supabaseClient.js — Supabase config

## Database Tables
- products (id, name, description, category, price, discount, image_url, stock_status, created_at)
- users (id, email, role, created_at)
- orders (id, user_id, products, total, status, created_at)

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

## Business Context
- Pakistani clothing store
- Sells: T-Shirts, Shalwar Kameez, Kurta, Shorts, Trousers
- Vision: Best quality at minimal/honest prices
- Target: Pakistani customers
- Admin can: add/edit/delete products, toggle stock status, apply discounts

## Rules
- Always use CSS variables for colors
- Mobile first design
- No page reload for cart operations
- Max 2 clicks for any action