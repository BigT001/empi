# 🎭 EMPI Costumes & Event Rental Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.0.10-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.io-4.8.2-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)

---

## 📌 Executive Summary

**EMPI Costumes & Event Rental Management Platform** is a full-stack, enterprise-grade e-commerce, equipment rental, and back-office Enterprise Resource Planning (ERP) application. Built specifically for high-end costume hire, bespoke garment tailoring, and event logistics, EMPI integrates real-time storefront booking, dynamic caution fee tracking, automated professional PDF invoicing, real-time internal communications (Mail Room), logistics management, daily expense logging, automated VAT compliance, and staff payroll management into a single unified platform.

---

## 🌟 Core Business Features

### 🛒 Storefront & Rental Booking Engine
* **Interactive Catalogue & Shop**: Browse costumes, equipment, showcase magazines, and specialty collections with fast filtering and search.
* **Custom Costume Commissions**: Interactive submission portal for clients to request bespoke costume designs with reference image uploads and dynamic quotes.
* **Smart Cart & Pricing Engine**: Real-time calculation of rental durations, dynamic caution (security) fees, promotional discounts, and regional delivery charges (`lib/discountCalculator.ts`, `lib/priceCalculations.ts`).
* **Multi-Gateway Checkout**: Supports **Flutterwave**, **Stripe**, and direct **Bank Transfer** with payment notification verification (`lib/paymentNotifications.ts`).

### 📦 Unified Order Management (`UnifiedOrder`)
* **Single Source of Truth**: Unified schema powering regular retail sales, costume rentals, and custom commissions (`lib/models/UnifiedOrder.ts`).
* **Full Order Lifecycle**: Transitions across `Pending` $\rightarrow$ `Confirmed` $\rightarrow$ `In Logistics` $\rightarrow$ `Delivered` $\rightarrow$ `Returned` $\rightarrow$ `Completed` / `Cancelled`.
* **Caution Fee Lifecycle**: Automated tracking and refund workflow for rental deposits (`lib/models/CautionFeeTransaction.ts`).

### 🏢 Back-Office ERP & Admin Operations
* **Role-Based Access Control (RBAC)**: Fine-grained administrative access tiers: *Super Admin*, *Admin*, *Sub-Admin*, *Logistics*, *Mail Room*, and *Finance* (`lib/permissions.ts`).
* **Offline Counter Orders & Expenses**: Specially optimized forms for counter/phone sales (`app/admin/offline-order-form.tsx`) and quick manual expense logging (`app/admin/offline-expense-form.tsx`).
* **Cloudinary Media Manager**: Integrated file upload, media viewing, and asset diagnostics (`app/admin/cloudinary-viewer`).

### 🚚 Logistics & Fleet Dispatch
* **Dispatch Operations**: Driver assignment, route scheduling, delivery location verification via Google Maps API integration (`@react-google-maps/api`).
* **Delivery Confirmation**: QR/Link-based delivery confirmation portal for clients and dispatchers (`app/confirm-delivery`).

### 💬 Real-Time Mail Room & Support Desk
* **Live Communications**: Socket.IO-powered real-time ticketing and messaging system for admin staff and client queries (`lib/models/MailRoomTicket.ts`, `lib/socket.ts`).
* **Push & Browser Notifications**: Web push notification engine (`lib/browserNotifications.ts`, `lib/notificationService.ts`).

### 📊 Financial Management, VAT & Payroll Suite
* **Daily Expenses & Ledger**: Expense logging categorized by operational heads with receipts attachments (`lib/models/DailyExpense.ts`).
* **Automated VAT Tracker**: Tracks value-added tax liabilities, calculates thresholds, triggers deadline alerts, and archives statutory returns (`lib/models/VATHistory.ts`, `app/admin/vat-tab.tsx`).
* **Payroll Engine**: Built-in staff directory, salary structure configuration, and payroll run execution (`lib/models/PayrollStaff.ts`, `lib/models/PayrollRun.ts`).

### 📄 Professional PDF Invoice Engine
* **Dynamic Generation**: High-fidelity PDF invoice generator supporting both client-side (`html2canvas`, `html2pdf.js`) and server-rendered HTML-to-PDF invoice downloads (`lib/invoiceGenerator.ts`, `lib/professionalInvoice.ts`).
* **Transactional Emailing**: Automated sending of PDF receipts and order updates via **Resend** with dynamic Handlebars HTML templates (`lib/email.ts`).

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.0.10** | App Router, React Server Components (RSC), Server Actions & API Routes |
| **UI Library** | **React 19.2.0** | Concurrent rendering features, server component architecture |
| **Language** | **TypeScript 5.x** | End-to-end type safety across schemas, API payloads, and component props |
| **Styling** | **Tailwind CSS v4** | Utility-first responsive design, modern dark/light aesthetic |
| **Animation** | **Framer Motion** | Micro-interactions, smooth page transitions, modal motion |
| **Smooth Scroll**| **Lenis 1.3.17** | Inertial smooth scrolling for high-end visual experience |
| **Database** | **MongoDB 7.0 / Mongoose 8.20** | NoSQL Document Store with Mongoose schemas and strict validation |
| **Auth** | **NextAuth.js v4 & Custom RBAC** | Cookie-based session validation, HTTP-only secure tokens, Bcryptjs |
| **Real-time** | **Socket.IO 4.8.2** | WebSockets for live chat, notification dispatch, and Mail Room updates |
| **Media Storage**| **Cloudinary** | Image transformation, optimization, and CDN delivery (`next-cloudinary`) |
| **Email** | **Resend API** | Transactional emails with Handlebars dynamic HTML templates |
| **Payments** | **Flutterwave & Stripe** | Multi-channel online payment verification & webhooks |
| **Maps & Geo** | **Google Maps API** | Address autocomplete and delivery location visualization |
| **PDF Generation**| **html2pdf.js / html2canvas** | Vector-accurate client and server invoice generation |
| **State & Fetch**| **Zustand & React Query v5** | Client-side store management and server-state caching |

---

## 📁 Project Architecture & Directory Structure

```
empi/
├── app/                        # Next.js App Router root
│   ├── (storefront)/           # Public e-commerce & rental routes
│   │   ├── about/              # About EMPI
│   │   ├── cart/               # Shopping cart & caution fee summary
│   │   ├── checkout/           # Multi-step checkout portal
│   │   ├── costume-show-shop/  # Showcase shop & rental gallery
│   │   ├── custom-costumes/    # Custom garment order request page
│   │   ├── product/[id]/       # Product detail page
│   │   ├── shop/               # Full catalog with category filters
│   │   └── our-story/          # Brand story page
│   ├── admin/                  # Protected Back-Office Operations Portal
│   │   ├── dashboard/          # Analytics overview & quick stats
│   │   ├── custom-orders/      # Bespoke costume request management
│   │   ├── finance/            # Financial reporting & income ledger
│   │   ├── invoices/           # Invoice management & PDF downloader
│   │   ├── logistics/          # Dispatch, driver & delivery management
│   │   ├── mail-room/          # Live ticketing & Socket.IO message room
│   │   ├── payroll/            # Staff salary & payroll run management
│   │   ├── products/           # Inventory & product catalog manager
│   │   ├── settings/           # System settings, VAT configuration, admins
│   │   ├── offline-order-form.tsx  # Counter order entry widget
│   │   ├── offline-expense-form.tsx# Fast expense entry widget
│   │   └── vat-tab.tsx         # VAT Compliance & deadline dashboard
│   ├── api/                    # Serverless API Routes (Route Handlers)
│   │   ├── admin/              # Admin management & auth endpoints
│   │   ├── custom-orders/      # Custom order creation & status update
│   │   ├── delivery/           # Delivery assignment & status updates
│   │   ├── expenses/           # Daily expense tracking endpoints
│   │   ├── invoices/           # Invoice creation & PDF streaming
│   │   ├── notifications/      # System notifications API
│   │   ├── orders/             # Unified order processing & state updates
│   │   ├── products/           # Catalog CRUD & stock availability
│   │   ├── socket/             # Socket.IO handshake handler
│   │   ├── vat-settings/       # VAT rates & return submission
│   │   ├── verify-payment/     # Payment confirmation callback
│   │   └── webhooks/           # Stripe & Resend Webhook receivers
│   ├── confirm-delivery/       # Public delivery verification link
│   ├── globals.css             # Tailwind v4 globals & custom utilities
│   └── layout.tsx              # Root app layout & provider wrapping
├── components/                 # Reusable UI & Business components
│   ├── admin/                  # Admin-specific tables, modals, sidebars
│   ├── storefront/             # Header, Footer, Product Cards, Cart Drawer
│   └── ui/                     # Radix UI primitives (Dialog, Tooltip, Slot)
├── lib/                        # Core Application Logic & Services
│   ├── models/                 # Mongoose Database Models (23 Models)
│   │   ├── Admin.ts            # Admin user schema & permissions
│   │   ├── CautionFeeTransaction.ts # Rental deposit refund records
│   │   ├── CustomOrder.ts      # Bespoke garment request schema
│   │   ├── DailyExpense.ts     # Operational daily expenses
│   │   ├── Invoice.ts          # Invoice storage schema
│   │   ├── MailRoomTicket.ts   # Support & internal chat ticket
│   │   ├── Order.ts            # Legacy order schema
│   │   ├── Product.ts          # Costume & rental item schema
│   │   ├── UnifiedOrder.ts     # Master Order Schema (Sales/Rental/Custom)
│   │   └── VATHistory.ts       # VAT record archiving
│   ├── email.ts                # Resend client & Handlebars email builder
│   ├── discountCalculator.ts   # Rental discount logic
│   ├── invoiceGenerator.ts     # PDF invoice generation engine
│   ├── mongodb.ts              # MongoDB Atlas connection manager (cached)
│   ├── notificationService.ts  # Multi-channel notification pipeline
│   ├── permissions.ts          # Role-Based Access Control matrix
│   ├── priceCalculations.ts    # Duration & caution fee pricing rules
│   └── socket.ts               # Socket.IO client singleton setup
├── scripts/                    # Database seeding, maintenance & migrations
│   ├── init-admin.js           # Seeds primary Super Admin account
│   ├── migrate-to-unified-orders.ts # Data migration script to Unified Orders
│   └── seed-nigerian-states.ts # Regional logistics data initializer
├── middleware.ts               # Next.js Route Guard Middleware (Admin Cookie Check)
├── repair-data-consistency.js  # Autonomous Data Repair Utility
├── weekly-data-validation.js   # Automated Data Health & Audit Suite
└── next.config.ts              # Turbopack & Image Domain Configuration
```

---

## 🗄️ Database Models Overview

The platform uses **Mongoose** over MongoDB Atlas. Key database models include:

1. **`UnifiedOrder`**: Combines traditional merchandise sales, costume rental bookings (with start/end dates & duration calculations), and custom garment orders into a single normalized structure.
2. **`Product`**: Stores costume item details, purchase prices, rental daily rates, caution fee deposits, category tags, sizes, and Cloudinary image galleries.
3. **`CautionFeeTransaction`**: Tracks security deposit holds and refunds for costume rentals, preventing revenue leakage.
4. **`CustomOrder`**: Stores client custom design requests, measurement specs, inspiration images, status stages, and generated custom quotes.
5. **`Invoice`**: Tracks generated PDF invoices, payment status (`Paid`, `Pending`, `Partially Paid`), items, client metadata, and download links.
6. **`Expense` / `DailyExpense`**: Real-time financial ledger tracking daily operating expenditures with category tagging.
7. **`VATHistory`**: Statutory record archiving value-added tax generated per transaction and tracking remittance filings.
8. **`PayrollRun` & `PayrollStaff`**: Employee management, base salary configurations, monthly allowance additions, deductions, and payment processing logs.
9. **`MailRoomTicket` & `MailRoomMessage`**: Internal admin ticketing system with real-time Socket.IO message dispatching.

---

## 🔑 Environment Variables Configuration

Create a `.env` file in the root directory based on the following template:

```env
# -----------------------------------------------------------------------------
# DATABASE
# -----------------------------------------------------------------------------
MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/empi?retryWrites=true&w=majority"

# -----------------------------------------------------------------------------
# AUTHENTICATION & SECURITY
# -----------------------------------------------------------------------------
NEXTAUTH_SECRET="your-super-secret-nextauth-key-32-chars-min"
ADMIN_RESET_SECRET="empi_admin_reset_2024_safe_key"
RESET_CONFIRMATION_TOKEN="i_understand_this_will_delete_all_data_confirm_reset"
ALLOW_PRODUCTION_RESET="false"

# -----------------------------------------------------------------------------
# DOMAIN & REAL-TIME SOCKET.IO
# -----------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL="https://empicostumes.com"
NEXT_PUBLIC_SOCKET_URL="https://empicostumes.com"
NEXT_PUBLIC_API_URL="https://empicostumes.com/api"

# -----------------------------------------------------------------------------
# CLOUDINARY MEDIA STORAGE
# -----------------------------------------------------------------------------
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

# -----------------------------------------------------------------------------
# EMAIL (RESEND)
# -----------------------------------------------------------------------------
RESEND_API_KEY="re_123456789_your_resend_api_key"
NEXT_PUBLIC_RESEND_API_KEY="re_123456789_your_resend_api_key"
RESEND_WEBHOOK_SECRET="whsec_your_webhook_secret"
STORE_EMAIL="empicostumes@gmail.com"
STORE_PHONE="+234 808 577 9180"

# -----------------------------------------------------------------------------
# PAYMENT GATEWAYS (FLUTTERWAVE & STRIPE)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY="FLWPUBK-xxxxxxxxxxxxxxxx-X"
FLUTTERWAVE_SECRET_KEY="FLWSECK-xxxxxxxxxxxxxxxx-X"
FLUTTERWAVE_ENCRYPTION_KEY="xxxxxxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxx"

# -----------------------------------------------------------------------------
# GOOGLE MAPS
# -----------------------------------------------------------------------------
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyXXXXXXXXXXXXXXXX"
```

---

## ⚡ Getting Started & Local Development

### 1. Prerequisites
Ensure you have the following tools installed on your local development machine:
* **Node.js**: `v20.x` or higher
* **Package Manager**: `pnpm` (recommended) or `npm`
* **MongoDB**: A running MongoDB instance locally or a MongoDB Atlas Cluster URL.

### 2. Installation
Clone the repository and install project dependencies:

```bash
git clone https://github.com/your-org/empi.git
cd empi

# Install dependencies using pnpm
pnpm install
```

### 3. Initialize Admin & Seed Data
Run the seeding script to create the initial **Super Admin** credentials in your MongoDB instance:

```bash
# Seeds the primary admin account
npm run seed
```

### 4. Run Development Server
Launch the Next.js development server:

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the storefront.  
Navigate to [http://localhost:3000/admin/login](http://localhost:3000/admin/login) to access the Admin ERP portal.

---

## 📜 Maintenance & Data Integrity Commands

EMPI includes custom diagnostic and data maintenance scripts:

| Command | Script File | Description |
| :--- | :--- | :--- |
| `npm run seed` | `scripts/init-admin.js` | Initializes default super admin credentials into the DB |
| `npm run validate` | `weekly-data-validation.js` | Audits data integrity across orders, products, caution fees & invoices |
| `npm run repair` | `repair-data-consistency.js` | Runs dry-run diagnostic report for broken order/product references |
| `npm run repair:fix` | `repair-data-consistency.js --fix` | Automatically repairs data inconsistencies in MongoDB collections |
| `node check-admins.js` | `check-admins.js` | Verifies administrative user accounts and active sessions |

---

## 🔌 API Endpoints Summary

| Endpoint | Method | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/api/products` | `GET`, `POST`, `PUT`, `DELETE` | Public / Admin | Fetch catalog items, create or update costume inventory |
| `/api/orders` | `GET`, `POST`, `PUT` | Client / Admin | Create unified orders, query status, update fulfillment stage |
| `/api/custom-orders` | `GET`, `POST`, `PATCH` | Client / Admin | Submit bespoke costume requests, issue quotes, update progress |
| `/api/invoices` | `GET`, `POST` | Admin | Generate and retrieve professional PDF invoices |
| `/api/expenses` | `GET`, `POST`, `DELETE` | Finance Admin | Log daily expenditures and output income vs expense reports |
| `/api/vat-settings` | `GET`, `POST` | Finance Admin | Retrieve VAT rates, log tax filings, update statutory parameters |
| `/api/delivery` | `GET`, `POST`, `PATCH` | Logistics Admin | Assign delivery drivers, update dispatch status, log delivery proof |
| `/api/messages` | `GET`, `POST` | Admin | Fetch and append Mail Room ticket messages |
| `/api/webhooks/resend` | `POST` | Public (Signed) | Webhook receiver for email delivery logs |
| `/api/verify-payment` | `POST` | Public | Verify payment status from Flutterwave / Stripe callback |

---

## 🔒 Security & RBAC Enforcement

* **Middleware Protection**: `middleware.ts` guards all `/admin/*` routes by enforcing valid, HTTP-only admin session cookies.
* **Granular Role System**: Features strict access control matrices (`lib/permissions.ts`):
  * **Super Admin**: Unrestricted system controls, user role management, data reset options.
  * **Finance**: Access restricted to `/admin/finance`, `/admin/invoices`, `/admin/payroll`, and VAT configuration.
  * **Logistics**: Access restricted to `/admin/logistics` and dispatch status updates.
  * **Mail Room**: Access restricted to internal customer communication ticketing.
* **Password Encryption**: Built-in Bcrypt salted hashing for all user and admin passwords.

---

## 🚀 Build & Production Deployment

To generate an optimized production build:

```bash
# Run production build
pnpm build

# Start production server
pnpm start
```

### Deploying on Vercel
EMPI is configured for seamless deployment on **Vercel**:
1. Connect your repository to Vercel.
2. Configure all environment variables in the Vercel project settings.
3. Ensure serverless function timeouts and Cloudinary remote image domains are permitted (`next.config.ts`).

---

## 📄 License & Maintainers

Developed & Maintained by **EMPI Engineering Team**. All rights reserved.
