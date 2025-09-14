# Project Structure

## Next.js App Router Organization

```
app/
├── globals.css                 # Global styles and TailwindCSS imports
├── layout.tsx                  # Root layout with Clerk provider
├── page.tsx                    # Landing/dashboard page
├── middleware.ts               # Clerk authentication middleware
├── admin/
│   ├── page.tsx               # Admin dashboard (role-protected)
│   ├── users/page.tsx         # User management interface
│   └── settings/page.tsx      # System configuration
├── dashboard/
│   └── page.tsx               # Merchant dashboard
├── pay/
│   └── [orderId]/page.tsx     # Dynamic payment page
└── api/
    ├── orders/
    │   ├── route.ts           # POST /api/orders - create order
    │   └── [orderId]/
    │       ├── route.ts       # GET /api/orders/:id - order details
    │       └── utr/route.ts   # POST /api/orders/:id/utr - submit UTR
    └── admin/
        ├── users/route.ts     # User management endpoints
        └── stats/route.ts     # Analytics and statistics
```

## Component Organization

```
components/
├── ui/                        # ShadCN UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── table.tsx
│   └── ...
├── payment/
│   ├── countdown-timer.tsx    # Payment expiry countdown
│   ├── upi-buttons.tsx       # UPI app redirect buttons
│   └── utr-form.tsx          # UTR submission form
├── admin/
│   ├── order-table.tsx       # Orders management table
│   ├── user-form.tsx         # User creation/editing
│   └── settings-form.tsx     # System configuration
└── dashboard/
    ├── order-stats.tsx       # Order statistics display
    └── link-generator.tsx    # Payment link creation form
```

## Data Layer Structure

```
lib/
├── db/
│   ├── connection.ts          # MongoDB connection setup
│   ├── models/
│   │   ├── order.ts          # Order schema and model
│   │   ├── settings.ts       # System settings schema
│   │   └── audit-log.ts      # Audit logging schema
│   └── queries/
│       ├── orders.ts         # Order-related database queries
│       ├── users.ts          # User management queries
│       └── analytics.ts      # Statistics and reporting queries
├── auth/
│   ├── clerk-config.ts       # Clerk configuration
│   └── permissions.ts        # Role-based access control
├── utils/
│   ├── upi-links.ts          # UPI deep link generation
│   ├── validation.ts         # Input validation schemas
│   └── constants.ts          # Application constants
└── types/
    ├── order.ts              # Order-related TypeScript types
    ├── user.ts               # User and role types
    └── api.ts                # API request/response types
```

## Configuration Files

```
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # TailwindCSS configuration
├── next.config.js            # Next.js configuration
├── .env.local                # Environment variables (local)
├── .env.example              # Environment variables template
├── jest.config.js            # Jest testing configuration
└── playwright.config.ts      # Playwright E2E testing config
```

## Key Conventions

### File Naming
- **Pages**: kebab-case for routes (`/admin/user-management`)
- **Components**: PascalCase files (`OrderTable.tsx`)
- **Utilities**: camelCase files (`upiLinks.ts`)
- **API Routes**: RESTful naming (`/api/orders/[orderId]/utr`)

### Component Patterns
- **Server Components**: Default for data fetching and static content
- **Client Components**: Use `"use client"` directive for interactivity
- **Shared Components**: Place in `/components` with clear categorization
- **Page-Specific Components**: Co-locate with pages when not reusable

### API Route Structure
- **HTTP Methods**: Use appropriate verbs (GET, POST, PUT, DELETE)
- **Response Format**: Consistent JSON structure with error handling
- **Authentication**: Middleware-based protection for all routes
- **Validation**: Zod schemas for request/response validation

### Database Conventions
- **Collections**: Plural names (`orders`, `auditLogs`, `systemSettings`)
- **Fields**: camelCase naming (`createdAt`, `orderId`, `merchantName`)
- **Indexes**: Performance-critical fields (`orderId`, `createdBy`, `expiresAt`)
- **Relationships**: Reference by Clerk user ID for user associations