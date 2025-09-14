# Technology Stack

## Core Framework & Runtime

- **Next.js 15**: App Router architecture with React 19
- **TypeScript**: Full type safety throughout the application
- **Node.js**: Server-side runtime environment

## Frontend Technologies

- **React 19**: Component library with Server Components
- **TailwindCSS v4**: Utility-first CSS framework
- **ShadCN UI**: Pre-built component library
- **SweetAlert2**: User notifications and confirmations

## Backend & Database

- **MongoDB Atlas**: Primary database with Mongoose ODM
- **Clerk**: Authentication and user management service
- **Next.js API Routes**: RESTful API endpoints

## Package Management

- **pnpm**: Primary package manager for this project
- **IMPORTANT**: Always use `pnpm` commands, never `npm` or `yarn`
- **Installation**: Use `pnpm install` or `pnpm add <package>`
- **Scripts**: All package.json scripts should be run with `pnpm run <script>` or `pnpm <script>`

## Development Tools

- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Unit testing framework
- **Playwright**: End-to-end testing

## Common Commands

### Development

```bash
pnpm dev             # Start development server
pnpm build           # Build for production
pnpm start           # Start production server
pnpm lint            # Run ESLint
pnpm type-check      # TypeScript compilation check
```

### Testing

```bash
pnpm test            # Run unit tests
pnpm test:watch      # Run tests in watch mode
pnpm test:e2e        # Run end-to-end tests
pnpm test:coverage   # Generate test coverage report
```

### Database

```bash
pnpm db:seed         # Seed database with initial data
pnpm db:migrate      # Run database migrations
pnpm db:reset        # Reset database (development only)
```

## Architecture Patterns

- **Server Components**: Default for data fetching and static content
- **Client Components**: Interactive UI elements and state management
- **API Routes**: RESTful endpoints following REST conventions
- **Middleware**: Authentication and role-based access control
- **Error Boundaries**: Graceful error handling in React components

## Package Management Rules

**CRITICAL**: This project uses `pnpm` exclusively. When executing any tasks:

- ✅ **DO**: Use `pnpm install`, `pnpm add`, `pnpm dev`, `pnpm build`, etc.
- ❌ **DON'T**: Use `npm install`, `npm run`, `yarn add`, or any other package manager
- **Installation**: `pnpm add <package>` for dependencies, `pnpm add -D <package>` for dev dependencies
- **Scripts**: All package.json scripts must be executed with `pnpm <script-name>`
- **Lock File**: Only `pnpm-lock.yaml` should be committed, never `package-lock.json` or `yarn.lock`

## Environment Configuration

Required environment variables:

- `MONGODB_URI`: MongoDB connection string
- `CLERK_SECRET_KEY`: Clerk authentication secret
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk public key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: Clerk sign-in URL
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: Clerk sign-up URL
