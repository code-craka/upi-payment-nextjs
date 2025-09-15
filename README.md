# UPI Payment System

A self-hosted Next.js application that enables merchants to create UPI payment links, manage orders, and verify transactions through manual UTR submission. The system provides a complete payment workflow from link generation to transaction verification.

## 🚀 Features

### Core Payment Features

- **Payment Link Generation**: Create UPI payment links via API or dashboard
- **Multi-UPI App Support**: Integration with GPay, PhonePe, Paytm, and BHIM
- **Manual Verification**: UTR-based transaction verification workflow
- **Order Management**: Complete order lifecycle tracking and status management
- **Configurable Timer**: 9-minute default payment window with configurable duration

### User Management & Security

- **Role-Based Access**: Admin, Merchant, and Viewer roles with appropriate permissions
- **Clerk Authentication**: Secure authentication and user management
- **Protected Routes**: Middleware-based route protection
- **Audit Logging**: Complete audit trail for all operations

### System Configuration

- **Static UPI ID Mode**: Simplified merchant setup option
- **UPI App Toggles**: Enable/disable specific UPI applications
- **Timer Configuration**: Configurable payment expiration settings
- **Real-time Updates**: Live status updates and notifications

## 🛠 Technology Stack

### Core Framework & Runtime

- **Next.js 15**: App Router architecture with React 19
- **TypeScript**: Full type safety throughout the application
- **Node.js**: Server-side runtime environment

### Frontend Technologies

- **React 19**: Component library with Server Components
- **TailwindCSS v4**: Utility-first CSS framework
- **ShadCN UI**: Pre-built component library
- **Lucide React**: Icon library

### Backend & Database

- **MongoDB Atlas**: Primary database with Mongoose ODM
- **Clerk**: Authentication and user management service
- **Next.js API Routes**: RESTful API endpoints

### Package Management

- **pnpm**: Primary package manager (IMPORTANT: Always use pnpm, never npm or yarn)

## 📋 Prerequisites

- Node.js 18+
- pnpm (install with: `npm install -g pnpm`)
- MongoDB Atlas account or local MongoDB instance
- Clerk account for authentication

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd upi-payment-nextjs
pnpm install
```

### 2. Environment Setup

Create `.env.local` file:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 3. Database Setup

```bash
# Run database migrations (if any)
pnpm run db:migrate

# Seed initial data (optional)
pnpm run db:seed
```

### 4. Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── orders/               # Order management endpoints
│   │   └── admin/                # Admin-only endpoints
│   ├── pay/[orderId]/            # Dynamic payment pages
│   ├── dashboard/                # Merchant dashboard
│   ├── admin/                    # Admin dashboard
│   └── middleware.ts             # Authentication middleware
├── components/                   # React components
│   ├── ui/                       # ShadCN UI components
│   ├── payment/                  # Payment-related components
│   ├── admin/                    # Admin interface components
│   └── auth/                     # Authentication components
├── lib/                          # Utility libraries
│   ├── db/                       # Database models and queries
│   ├── auth/                     # Authentication utilities
│   ├── utils/                    # Helper functions
│   └── types/                    # TypeScript type definitions
└── .kiro/                        # Kiro AI specifications
    └── specs/upi-payment-system/ # Feature specifications
```

## 🔧 Available Scripts

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

## 🔐 Authentication & Roles

### User Roles

- **Admin**: Full system access, user management, order verification
- **Merchant**: Create payment links, view own orders, manage settings
- **Viewer**: Read-only access to assigned data

### Role Assignment

Roles are managed through Clerk's public metadata. Admins can assign roles through the admin dashboard.

## 💳 Payment Workflow

### 1. Order Creation

- Merchant creates payment link with amount and details
- System generates unique order ID and UPI deep links
- Payment page becomes accessible at `/pay/[orderId]`

### 2. Customer Payment

- Customer accesses payment link
- Chooses UPI app (GPay, PhonePe, Paytm, BHIM) or manual UPI
- Completes payment in their preferred UPI app
- Timer counts down from configured duration (default: 9 minutes)

### 3. UTR Submission

- Customer submits 12-digit UTR (Unique Transaction Reference)
- System validates UTR format and uniqueness
- Order status updates to "pending-verification"
- Customer sees confirmation and tracking information

### 4. Verification (Manual)

- Admin reviews submitted UTRs
- Verifies payment in bank/UPI app
- Updates order status to "completed" or "failed"
- Customer and merchant receive status updates

## 🔧 Configuration

### System Settings

Access admin dashboard to configure:

- **Timer Duration**: Payment expiration time (default: 9 minutes)
- **UPI Apps**: Enable/disable specific UPI applications
- **Static UPI ID**: Use single UPI ID for all transactions
- **Notification Settings**: Email/SMS notification preferences

### Environment Variables

| Variable                            | Description                 | Required |
| ----------------------------------- | --------------------------- | -------- |
| `MONGODB_URI`                       | MongoDB connection string   | Yes      |
| `CLERK_SECRET_KEY`                  | Clerk authentication secret | Yes      |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key            | Yes      |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`     | Sign-in page URL            | Yes      |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`     | Sign-up page URL            | Yes      |

## 📊 API Documentation

### Order Management

- `POST /api/orders` - Create new payment order
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/utr` - Submit UTR for verification
- `PUT /api/orders/:id/status` - Update order status (admin only)

### User Management (Admin)

- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user details
- `DELETE /api/admin/users/:id` - Delete user

### System Settings

- `GET /api/admin/settings` - Get system configuration
- `PUT /api/admin/settings` - Update system settings

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker

```bash
# Build Docker image
docker build -t upi-payment-system .

# Run container
docker run -p 3000:3000 --env-file .env.local upi-payment-system
```

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🔍 Monitoring & Logging

### Built-in Monitoring

- Order creation and completion tracking
- UTR submission audit logs
- User activity logging
- System performance metrics

### Error Handling

- Comprehensive error boundaries
- API error standardization
- User-friendly error messages
- Automatic retry mechanisms

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Standards

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use pnpm for package management

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

- **Build Errors**: Ensure you're using pnpm, not npm or yarn
- **Database Connection**: Verify MongoDB URI and network access
- **Authentication Issues**: Check Clerk configuration and environment variables
- **TypeScript Errors**: Run `pnpm type-check` to verify all types are correct

### Getting Help

- Check the [Issues](../../issues) page for known problems
- Create new issue with detailed description and steps to reproduce
- Include relevant logs and environment information

## 🎯 Roadmap

### ✅ Completed Features (v0.6.0)

- [x] Core payment link generation with API endpoints
- [x] UPI app integration (GPay, PhonePe, Paytm, BHIM)
- [x] UTR submission and verification workflow
- [x] Role-based authentication system (Admin, Merchant, Viewer)
- [x] Order status tracking and management
- [x] System configuration and settings
- [x] **Admin dashboard and user management**
- [x] **Merchant dashboard and analytics**
- [x] **Full TypeScript implementation**
- [x] **Enhanced security** (CSRF, rate limiting, sanitization)
- [x] **Comprehensive audit logging**
- [x] **Session management**
- [x] **Mobile-responsive design**
- [x] **Error handling and validation**

### 🚧 Upcoming Features

- [ ] Automated payment verification via bank APIs
- [ ] Email/SMS notifications
- [ ] Advanced reporting and analytics
- [ ] Webhook integrations
- [ ] Mobile app for merchants
- [ ] Payment gateway integrations

---

## 📋 Version History

### v0.6.0 (Current) - TypeScript & Security Enhancement
- ✅ Full TypeScript implementation with complete type safety
- ✅ Enhanced security features (CSRF protection, rate limiting, input sanitization)
- ✅ Complete admin and merchant dashboards
- ✅ Comprehensive error handling and audit logging
- ✅ Mobile-responsive UI improvements
- ✅ Session management and security enhancements
- ✅ Fixed all TypeScript compilation errors

### v0.5.0 - Core Implementation
- ✅ Basic payment link generation
- ✅ UPI app integrations
- ✅ UTR submission workflow
- ✅ Role-based authentication setup

---

## 🔄 Development Status

**Last Updated**: December 2024  
**Version**: 0.6.0  
**Status**: ✅ Production Ready  
**TypeScript**: ✅ Fully Implemented (0 errors)  
**Security**: ✅ Enhanced  
**Tests**: ✅ Configured  

**Built with ❤️ using Next.js 15, TypeScript, React 19, and modern web technologies**
