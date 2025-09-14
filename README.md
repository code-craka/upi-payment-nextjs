# UPI Payment System

A self-hosted Next.js application that enables merchants to create UPI payment links, manage orders, and verify transactions through manual UTR submission. The system provides a complete payment workflow from link generation to transaction verification.

## 🚀 Features

- **Payment Link Generation**: Create UPI payment links via API or dashboard
- **Multi-UPI App Support**: Integration with GPay, PhonePe, Paytm, and BHIM
- **Manual Verification**: UTR-based transaction verification workflow
- **Role-Based Access**: Admin, Merchant, and Viewer roles with appropriate permissions
- **Order Management**: Complete order lifecycle tracking and status management
- **System Configuration**: Configurable timer duration, UPI apps, and static UPI ID mode

## 🛠️ Tech Stack

### Core Framework & Runtime

- **Next.js 15**: App Router architecture with React 18
- **TypeScript**: Full type safety throughout the application
- **Node.js**: Server-side runtime environment

### Frontend Technologies

- **React 18**: Component library with Server Components
- **TailwindCSS v4**: Utility-first CSS framework
- **ShadCN UI**: Pre-built component library
- **SweetAlert2**: User notifications and confirmations

### Backend & Database

- **MongoDB Atlas**: Primary database with Mongoose ODM
- **Clerk**: Authentication and user management service
- **Next.js API Routes**: RESTful API endpoints

### Development Tools

- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Unit testing framework
- **Playwright**: End-to-end testing

## 📋 Prerequisites

- Node.js 22.0.0 or higher
- MongoDB Atlas account or local MongoDB instance
- Clerk account for authentication

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/code-craka/upi-payment-nextjs.git
cd upi-payment-nextjs
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template and configure your variables:

```bash
cp .env.example .env.local
```

Update `.env.local` with your actual values:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/upi-payment-system?retryWrites=true&w=majority

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
├── app/                        # Next.js App Router
│   ├── globals.css            # Global styles and TailwindCSS imports
│   ├── layout.tsx             # Root layout with Clerk provider
│   ├── page.tsx               # Landing/dashboard page
│   ├── middleware.ts          # Clerk authentication middleware
│   ├── dashboard/             # Merchant dashboard
│   ├── admin/                 # Admin interface (role-protected)
│   ├── pay/                   # Dynamic payment pages
│   └── api/                   # API routes
├── components/                 # React components
│   ├── ui/                    # ShadCN UI components
│   ├── payment/               # Payment-related components
│   ├── admin/                 # Admin interface components
│   └── dashboard/             # Dashboard components
├── lib/                       # Utility libraries
│   ├── db/                    # Database connection and models
│   ├── auth/                  # Authentication utilities
│   ├── utils/                 # Helper functions
│   └── types/                 # TypeScript type definitions
└── .kiro/                     # Kiro IDE specifications and steering
```

## 🔧 Available Scripts

### Development

```bash
npm run dev             # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript compilation check
```

### Testing

```bash
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:e2e        # Run end-to-end tests
npm run test:coverage   # Generate test coverage report
```

## 🏗️ Architecture

### Authentication Flow

- Clerk handles user authentication and session management
- Middleware protects routes based on authentication status
- Role-based access control for admin features

### Payment Workflow

1. Merchant creates payment link via dashboard or API
2. Customer receives link and selects UPI app
3. Customer completes payment in UPI app
4. Customer submits UTR (Unique Transaction Reference)
5. Admin/Merchant verifies transaction manually
6. Order status updated to completed/failed

### Database Schema

- **Orders**: Payment requests with status tracking
- **Users**: Clerk-managed user profiles with roles
- **Settings**: System configuration and preferences
- **Audit Logs**: Transaction and system activity logs

## 🔐 Environment Variables

| Variable                            | Description                 | Required |
| ----------------------------------- | --------------------------- | -------- |
| `MONGODB_URI`                       | MongoDB connection string   | ✅       |
| `CLERK_SECRET_KEY`                  | Clerk authentication secret | ✅       |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key            | ✅       |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`     | Sign-in page URL            | ✅       |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`     | Sign-up page URL            | ✅       |
| `NEXT_PUBLIC_APP_URL`               | Application base URL        | ✅       |

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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write tests for new features

### Component Patterns

- Use Server Components by default
- Add `"use client"` directive only when needed
- Co-locate components with their pages when not reusable
- Use ShadCN UI components for consistent styling

### API Design

- Follow RESTful conventions
- Use appropriate HTTP methods
- Implement proper error handling
- Validate requests with Zod schemas

## 🐛 Troubleshooting

### Common Issues

**Build Errors**

- Ensure all environment variables are set
- Check TypeScript compilation with `npm run type-check`
- Verify dependencies are installed correctly

**Authentication Issues**

- Verify Clerk keys are correct
- Check middleware configuration
- Ensure sign-in/sign-up URLs match Clerk dashboard

**Database Connection**

- Verify MongoDB URI format
- Check network connectivity
- Ensure database user has proper permissions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Clerk](https://clerk.com/) for authentication services
- [ShadCN UI](https://ui.shadcn.com/) for beautiful components
- [TailwindCSS](https://tailwindcss.com/) for utility-first styling
- [MongoDB](https://mongodb.com/) for database services

## 📞 Support

For support, email support@yourcompany.com or join our Slack channel.

---

**Built with ❤️ using Next.js 15 and TypeScript**
