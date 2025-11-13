# EMPI Costumes - Development Plan & MVP Roadmap

## Project Vision
Build a full-featured ecommerce platform where EMPI can upload and sell costume products with integrated checkout, order management, and invoice generation.

---

## Development Strategy

### Approach: Iterative MVP-First Development

**Why this approach?**
- Launch a working product quickly (4-6 weeks)
- Get real user feedback early
- Add features incrementally based on actual needs
- Reduce initial development complexity
- Easier to maintain and deploy

**Development Philosophy:**
- Start simple, add complexity only when needed
- Test each feature before moving to the next
- Deploy early and often
- Use TypeScript to catch errors early

---

## Project Timeline Overview

| Phase | Duration | Focus | Deliverable |
|-------|----------|-------|-------------|
| **Phase 1: Setup** | 3-5 days | Project infrastructure | Basic Next.js app with auth |
| **Phase 2: MVP Core** | 2 weeks | Product & cart basics | Working product page + cart |
| **Phase 3: Checkout & Orders** | 1 week | Payment integration | Stripe integration + order storage |
| **Phase 4: Invoice & Emails** | 1 week | Invoice generation | PDF invoices + email confirmation |
| **Phase 5: Seller Dashboard** | 1 week | Admin features | Product management UI |
| **Phase 6: Polish & Deploy** | 3-5 days | Testing & optimization | Go live! |

**Total: 4-6 weeks to MVP launch**

---

## PHASE 1: Setup & Foundation (3-5 Days)

### Goals
- [ ] Initialize Next.js project with TypeScript
- [ ] Setup database (Supabase PostgreSQL)
- [ ] Configure authentication (NextAuth.js)
- [ ] Setup styling (Tailwind + shadcn/ui)
- [ ] Environment variables and deployment prep

### Step-by-Step Tasks

#### 1.1 Create Next.js Project
```bash
npx create-next-app@latest empi-costumes --typescript --tailwind --app
cd empi-costumes
```

**What to select:**
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- App Router: Yes
- Src directory: Yes

#### 1.2 Install Core Dependencies
```bash
npm install @auth/core @auth/nextjs
npm install @prisma/client
npm install -D prisma
npm install next-auth
npm install zod react-hook-form
npm install @tanstack/react-query
npm install zustand
npm install clsx tailwind-merge
```

#### 1.3 Setup shadcn/ui
```bash
npx shadcn-ui@latest init
# Select: Slate (default theme)
```

#### 1.4 Add shadcn Components (for MVP)
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add table
npx shadcn-ui@latest add select
npx shadcn-ui@latest add image
```

#### 1.5 Setup Prisma & PostgreSQL
```bash
npx prisma init
```

**Create `.env.local`:**
```
DATABASE_URL="postgresql://user:password@host:port/empi_costumes"
NEXTAUTH_SECRET="generate-a-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

**Get PostgreSQL URL from Supabase** (create account at supabase.com):
1. Create new project
2. Copy connection string to `.env.local`

#### 1.6 Create Initial Prisma Schema
**File: `prisma/schema.prisma`**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String     @id @default(cuid())
  name          String?
  email         String?    @unique
  emailVerified DateTime?
  password      String?
  image         String?
  role          Role       @default(CUSTOMER)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  accounts  Account[]
  sessions  Session[]
  orders    Order[]
  products  Product[]    @relation("SellerProducts")

  @@map("users")
}

model Account {
  id                 String  @id @default(cuid())
  userId             String  @map("user_id")
  type               String
  provider           String
  providerAccountId  String  @map("provider_account_id")
  refresh_token      String?  @db.Text
  access_token       String?  @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String   @db.Text
  price       Float
  quantity    Int      @default(0)
  image       String   // URL from Cloudinary
  category    String   @default("costume")
  sellerId    String   @map("seller_id")
  seller      User     @relation("SellerProducts", fields: [sellerId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orderItems  OrderItem[]

  @@map("products")
}

model Order {
  id            String   @id @default(cuid())
  orderNumber   String   @unique @default(cuid())
  
  customerId    String   @map("customer_id")
  customer      User     @relation(fields: [customerId], references: [id])
  
  items         OrderItem[]
  
  subtotal      Float
  tax           Float
  shippingCost  Float
  total         Float
  
  status        OrderStatus @default(PENDING)
  paymentStatus PaymentStatus @default(UNPAID)
  
  shippingAddress String  @db.Text
  email          String
  phone          String?
  
  invoicePath    String?  // Path to stored invoice PDF
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("orders")
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String  @map("order_id")
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productId String  @map("product_id")
  product   Product @relation(fields: [productId], references: [id])
  
  quantity  Int
  price     Float   // Price at time of purchase
  
  @@map("order_items")
}

enum Role {
  ADMIN
  SELLER
  CUSTOMER
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  UNPAID
  PAID
  FAILED
  REFUNDED
}
```

#### 1.7 Run Database Migrations
```bash
npx prisma migrate dev --name init
```

#### 1.8 Setup NextAuth.js
**File: `app/api/auth/[...nextauth]/route.ts`**
```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

#### 1.9 Create Auth Pages
Create login/signup pages in `app/auth/` directory

#### 1.10 Setup Environment Variables
**`.env.local`:**
```
DATABASE_URL=your_supabase_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-random-secret
GITHUB_ID=your_github_oauth_id
GITHUB_SECRET=your_github_oauth_secret
```

### Deliverable: Running App
- ✅ Next.js project with TypeScript
- ✅ Database connected and migrated
- ✅ Authentication working (login/signup)
- ✅ Styled with Tailwind + shadcn/ui

---

## PHASE 2: MVP Core Features (2 Weeks)

### Goals
- [ ] Product listing page
- [ ] Product detail page
- [ ] Shopping cart (client-side state)
- [ ] Basic seller dashboard
- [ ] Product upload (image + details)

### Step-by-Step Tasks

#### 2.1 Create Product Management API
**File: `app/api/products/route.ts`**
- GET: List all products (with pagination)
- POST: Create new product (seller only)

**File: `app/api/products/[id]/route.ts`**
- GET: Get single product
- PUT: Update product (seller only)
- DELETE: Delete product (seller only)

#### 2.2 Build Product Listing Page
**File: `app/products/page.tsx`**
- Display all products in grid
- Search and filter functionality
- Pagination
- "Add to Cart" button

#### 2.3 Build Product Detail Page
**File: `app/products/[id]/page.tsx`**
- Large product image
- Product name, price, description
- Quantity selector
- Add to cart button
- Related products (optional for MVP)

#### 2.4 Setup Shopping Cart (Zustand)
**File: `lib/store/cartStore.ts`**
```typescript
import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => {
    // Logic to add or update item
  },
  removeItem: (id) => {
    // Logic to remove
  },
  updateQuantity: (id, quantity) => {
    // Logic to update quantity
  },
  clear: () => set({ items: [] }),
  total: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
```

#### 2.5 Build Cart Page
**File: `app/cart/page.tsx`**
- Display cart items
- Update quantities
- Remove items
- Show subtotal
- "Proceed to Checkout" button

#### 2.6 Seller Dashboard - Product Management
**File: `app/dashboard/products/page.tsx`**
- Table of seller's products
- Edit product button
- Delete product button
- Add new product button

**File: `app/dashboard/products/new/page.tsx`**
- Form to add/edit product
- Product name, description, price, quantity
- Image upload

#### 2.7 Setup File Upload (Cloudinary)
**Create account and get API credentials**
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**File: `app/api/upload/route.ts`**
- Handle image upload to Cloudinary

### Deliverable: Functional MVP Core
- ✅ View products
- ✅ Add to cart
- ✅ Cart management
- ✅ Seller can add/edit/delete products
- ✅ Image uploads working

---

## PHASE 3: Checkout & Orders (1 Week)

### Goals
- [ ] Stripe integration
- [ ] Checkout page with payment
- [ ] Order creation and storage
- [ ] Order confirmation page

### Step-by-Step Tasks

#### 3.1 Setup Stripe
```bash
npm install stripe @stripe/react-js
```

**`.env.local`:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_SECRET_KEY=your_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

#### 3.2 Create Checkout Page
**File: `app/checkout/page.tsx`**
- Customer details form (email, shipping address)
- Stripe card element
- Order summary
- Submit payment button

#### 3.3 Create Payment API
**File: `app/api/checkout/route.ts`**
```typescript
// POST: Create Stripe payment intent
// Return client secret
```

**File: `app/api/checkout/confirm/route.ts`**
```typescript
// POST: Verify payment and create order
// Save order to database
// Clear cart
// Return order ID
```

#### 3.4 Create Order Confirmation Page
**File: `app/order-confirmation/[orderId]/page.tsx`**
- Order number
- Items ordered
- Total paid
- Shipping address
- "Download Invoice" button
- "Continue Shopping" button

#### 3.5 Create Order Management API
**File: `app/api/orders/route.ts`**
- GET: List user's orders
- POST: Create order (already done in checkout)

**File: `app/api/orders/[id]/route.ts`**
- GET: Get order details

#### 3.6 Seller Dashboard - Orders
**File: `app/dashboard/orders/page.tsx`**
- Table of seller's orders
- Order status
- Customer info
- Total amount

### Deliverable: Complete Purchase Flow
- ✅ Customers can checkout
- ✅ Payment processing with Stripe
- ✅ Orders saved to database
- ✅ Order confirmation page
- ✅ Seller can see orders

---

## PHASE 4: Invoice & Email (1 Week)

### Goals
- [ ] Invoice generation (PDF)
- [ ] Email invoices to customers
- [ ] Download invoice from order page
- [ ] Store invoices in database

### Step-by-Step Tasks

#### 4.1 Setup Invoice Dependencies
```bash
npm install puppeteer handlebars nodemailer
npm install -D @types/nodemailer
```

#### 4.2 Setup Email Service (Resend)
```bash
npm install resend
```

**`.env.local`:**
```
RESEND_API_KEY=your_resend_api_key
```

#### 4.3 Create Invoice Template
**File: `lib/templates/invoice.html`**
```html
<html>
  <head>
    <style>
      /* Professional invoice styling */
    </style>
  </head>
  <body>
    <div class="invoice">
      <h1>INVOICE</h1>
      <div class="header">
        <div>
          <p><strong>EMPI Costumes</strong></p>
          <p>Invoice #: {{invoiceNumber}}</p>
          <p>Date: {{invoiceDate}}</p>
        </div>
        <div>
          <h3>Bill To</h3>
          <p>{{customerName}}</p>
          <p>{{customerEmail}}</p>
          <p>{{shippingAddress}}</p>
        </div>
      </div>
      
      <table class="items">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>{{this.name}}</td>
            <td>{{this.quantity}}</td>
            <td>${{this.price}}</td>
            <td>${{multiply this.quantity this.price}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
      
      <div class="totals">
        <p>Subtotal: ${{subtotal}}</p>
        <p>Tax: ${{tax}}</p>
        <p>Shipping: ${{shipping}}</p>
        <h2>Total: ${{total}}</h2>
      </div>
      
      <p class="footer">Thank you for your purchase!</p>
    </div>
  </body>
</html>
```

#### 4.4 Create Invoice Generation API
**File: `app/api/invoices/generate/route.ts`**
```typescript
// POST: Generate PDF invoice
// Input: orderId
// Output: PDF file path or buffer

import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// 1. Get order from database
// 2. Compile template with order data
// 3. Generate HTML
// 4. Use Puppeteer to convert to PDF
// 5. Save to storage or return buffer
// 6. Update order with invoice path
```

#### 4.5 Create Invoice Download API
**File: `app/api/invoices/[orderId]/download/route.ts`**
- GET: Download invoice PDF
- Check authorization (order belongs to user)
- Return PDF file

#### 4.6 Create Email Service
**File: `lib/services/email.ts`**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation(
  email: string,
  orderNumber: string,
  invoicePdf: Buffer
) {
  // Send order confirmation email with invoice attachment
}
```

#### 4.7 Update Checkout Flow
Modify checkout confirm API to:
- Generate invoice
- Send email with invoice
- Update order with invoice path

#### 4.8 Add Invoice Download to Order Page
**Update: `app/order-confirmation/[orderId]/page.tsx`**
- Add "Download Invoice" button
- Button triggers download from API

### Deliverable: Complete Invoice System
- ✅ Invoices automatically generated on checkout
- ✅ Invoices emailed to customers
- ✅ Customers can download invoices
- ✅ Invoices stored with orders

---

## PHASE 5: Seller Dashboard Polish (1 Week)

### Goals
- [ ] Complete dashboard with analytics
- [ ] Order management features
- [ ] Sales tracking
- [ ] Settings page

### Step-by-Step Tasks

#### 5.1 Dashboard Home Page
**File: `app/dashboard/page.tsx`**
```
- Total Sales (this month)
- Total Orders
- Total Products
- Recent Orders (table)
- Sales Chart (optional)
```

#### 5.2 Order Management
**File: `app/dashboard/orders/page.tsx` (enhance)**
- Filter by status (pending, processing, shipped, etc.)
- Change order status
- View order details
- Send custom email to customer

#### 5.3 Product Analytics
**File: `app/dashboard/analytics/page.tsx`**
- Best selling products
- Product views
- Revenue per product

#### 5.4 Settings Page
**File: `app/dashboard/settings/page.tsx`**
- Update store name
- Update profile
- Email settings

#### 5.5 Customer Dashboard
**File: `app/account/orders/page.tsx`**
- View customer's orders
- Download invoices
- Track shipments
- Reorder functionality

### Deliverable: Full-Featured Dashboard
- ✅ Analytics and insights
- ✅ Order management
- ✅ Settings configuration
- ✅ Customer account page

---

## PHASE 6: Testing & Deployment (3-5 Days)

### Goals
- [ ] Test entire application
- [ ] Fix bugs
- [ ] Optimize performance
- [ ] Deploy to production

### Step-by-Step Tasks

#### 6.1 Create Test Cases
```
Auth:
- [ ] Signup/Login works
- [ ] Password reset works
- [ ] Role-based access works

Products:
- [ ] Can add product
- [ ] Can edit product
- [ ] Can delete product
- [ ] Images upload correctly

Cart:
- [ ] Add to cart works
- [ ] Update quantity works
- [ ] Remove from cart works

Checkout:
- [ ] Checkout flow complete
- [ ] Payment processes
- [ ] Order created in DB

Invoices:
- [ ] Invoice generated
- [ ] Email sent
- [ ] Can download invoice
```

#### 6.2 Setup Deployment
1. Deploy to Vercel
2. Setup Supabase database (production)
3. Configure environment variables
4. Setup custom domain (if needed)

#### 6.3 Performance Optimization
- [ ] Image optimization
- [ ] Database query optimization
- [ ] API response caching
- [ ] Bundle size analysis

#### 6.4 Security Audit
- [ ] Check for SQL injection
- [ ] Validate all inputs
- [ ] HTTPS enabled
- [ ] Secure headers set
- [ ] Rate limiting on APIs

### Deliverable: Production-Ready App
- ✅ Tested and bug-free
- ✅ Deployed to Vercel
- ✅ Database in production
- ✅ All features working

---

## MVPs Feature Checklist

### ✅ MVP Phase 1: Initial Launch
**Core Features:**
- [ ] User authentication (email/password + OAuth)
- [ ] Product listing and search
- [ ] Product details page
- [ ] Shopping cart
- [ ] Checkout with Stripe payment
- [ ] Order creation and storage
- [ ] Invoice generation and email
- [ ] Seller dashboard (basic product management)
- [ ] Email confirmations

**Technology:**
- [ ] Next.js with TypeScript
- [ ] Tailwind CSS + shadcn/ui
- [ ] PostgreSQL (Supabase)
- [ ] NextAuth.js
- [ ] Stripe
- [ ] Puppeteer for PDF
- [ ] Resend for emails

**Performance:**
- [ ] Page load < 3 seconds
- [ ] API response < 500ms
- [ ] Mobile responsive

---

## Development Best Practices

### Code Organization
```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── products/          # Product pages
│   ├── cart/              # Cart pages
│   ├── checkout/          # Checkout pages
│   ├── dashboard/         # Admin dashboard
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── common/           # Common components
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # Auth utilities
│   ├── services/         # Business logic
│   ├── store/            # Zustand stores
│   └── templates/        # Invoice templates
├── types/                # TypeScript types
├── styles/              # Global styles
└── public/              # Static assets
```

### Git Workflow
```bash
# Feature branch
git checkout -b feature/product-listing
git commit -m "feat: add product listing page"
git push origin feature/product-listing

# Main branch (production)
git checkout main
git merge feature/product-listing
git push origin main
```

### Environment Variables Template
```
# Database
DATABASE_URL=

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Payment
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# File Upload
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# OAuth (optional)
GITHUB_ID=
GITHUB_SECRET=
```

### Testing Checklist Before Launch
- [ ] All auth flows work
- [ ] Products load correctly
- [ ] Cart persists data
- [ ] Checkout completes successfully
- [ ] Stripe test charges work
- [ ] Invoices generate correctly
- [ ] Emails send successfully
- [ ] Mobile responsive on all pages
- [ ] No console errors
- [ ] Database queries optimized
- [ ] Images load fast
- [ ] Forms validate properly

---

## Post-Launch Enhancements (Not MVP)

### Phase 7: Advanced Features
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] User profile customization
- [ ] Multiple payment methods (PayPal, etc.)
- [ ] Product recommendations
- [ ] Marketing email campaigns
- [ ] Analytics dashboard
- [ ] Inventory alerts
- [ ] Bulk product import
- [ ] Multiple currency support

### Phase 8: Optimization
- [ ] Caching strategy
- [ ] CDN integration
- [ ] Database indexing
- [ ] API rate limiting
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring
- [ ] A/B testing framework

### Phase 9: Scale
- [ ] Microservices architecture
- [ ] Message queues (Bull)
- [ ] Redis caching
- [ ] Load balancing
- [ ] Database replication
- [ ] Advanced security features

---

## Success Metrics

### Launch Metrics
- [ ] Zero critical bugs
- [ ] All features working as designed
- [ ] Page load time < 3 seconds
- [ ] Mobile usability score > 90
- [ ] Stripe integration verified

### Post-Launch Metrics
- [ ] Transaction success rate > 95%
- [ ] Customer satisfaction score
- [ ] Return visitor percentage
- [ ] Average order value
- [ ] Repeat purchase rate
- [ ] Support ticket volume

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Payment integration delays | Medium | High | Start early, use test mode first |
| Database performance | Low | High | Use indexes, monitor queries |
| File upload issues | Low | Medium | Test with various file sizes |
| Invoice generation fails | Low | Medium | Have fallback template |
| Email delivery fails | Low | Medium | Use reputable email service (Resend) |
| Scope creep | High | High | Stick to MVP, document feature requests |

---

## Summary

### Week 1: Setup + Core Products
- Initialize Next.js, database, auth
- Build product listing and details
- Implement shopping cart

### Week 2: Checkout + Orders
- Stripe integration
- Checkout flow
- Order management

### Week 3: Invoices + Dashboard
- Invoice generation and emails
- Basic seller dashboard
- Customer account page

### Week 4: Testing + Launch
- Comprehensive testing
- Deploy to Vercel
- Monitor and iterate

**Ready to start building?** Begin with Phase 1 Setup.
