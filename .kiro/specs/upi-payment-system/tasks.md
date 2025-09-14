# Implementation Plan

- [x] 1. Set up project foundation and core infrastructure

  - Initialize Next.js 15 project with App Router and TypeScript configuration
  - Configure TailwindCSS v4 and install ShadCN UI components
  - Set up MongoDB connection with Mongoose ODM
  - Configure environment variables for development and production
  - _Requirements: 8.1, 8.2_

- [ ] 2. Implement authentication and authorization system

  - Install and configure Clerk authentication provider
  - Create middleware for role-based access control (Admin, Merchant, Viewer roles)
  - Implement protected route patterns for /admin and /dashboard paths
  - Set up user role management in Clerk public metadata
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 3. Create core data models and database schemas

  - Define MongoDB schemas for Orders, SystemSettings, and AuditLogs collections
  - Implement Order model with status tracking and expiration logic
  - Create SystemSettings model with configurable timer duration and UPI app toggles
  - Build AuditLogs model for tracking link generation and user actions
  - Add database indexes for performance optimization (orderId, createdBy, expiresAt)
  - _Requirements: 8.1, 8.2, 8.5_

- [ ] 4. Build order creation and management API endpoints

  - Implement POST /api/orders endpoint for creating payment links
  - Create GET /api/orders/:orderId endpoint for fetching order details
  - Build POST /api/orders/:orderId/utr endpoint for UTR submission
  - Add order validation with amount limits and UPI ID format checking
  - Implement order expiration logic based on configurable timer duration
  - _Requirements: 6.1, 6.2, 6.3, 1.1, 1.4, 1.5_

- [ ] 5. Develop payment page with UPI app integration

  - Create dynamic payment page at /pay/[orderId] with order details display
  - Implement UPI deep link generation for GPay, PhonePe, Paytm, and BHIM
  - Build countdown timer component that respects SystemSettings.timerDuration
  - Add copy-to-clipboard functionality for UPI ID and amount
  - Implement UPI app detection and App Store fallback logic
  - Create manual UPI payment option with QR code and copy functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.4_

- [ ] 6. Implement UTR submission and verification workflow

  - Build UTR input form with 12-digit alphanumeric validation
  - Create UTR submission handler that updates order status to pending-verification
  - Implement success confirmation UI after UTR submission
  - Add order status tracking and display for customers
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Create admin dashboard and user management system

  - Build admin dashboard at /admin with authentication and role verification
  - Implement user management interface for creating, updating, and deleting users
  - Create role assignment functionality (Admin, Merchant, Viewer)
  - Build orders overview table with filtering by status (pending, completed, expired)
  - Add per-user analytics showing link generation statistics and success rates
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 8. Develop system configuration and settings management

  - Create admin settings page for configuring timer duration (default 9 minutes)
  - Implement static UPI ID configuration for manual UPI mode
  - Build UPI app enable/disable toggles (GPay, PhonePe, Paytm, BHIM)
  - Add settings validation and real-time application to new payment links
  - Implement audit logging for all settings changes
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Build merchant dashboard and link management

  - Create merchant dashboard at /dashboard for authenticated merchants
  - Implement payment link generation form with amount and merchant name inputs
  - Build merchant's order history view showing only their created links
  - Add order status tracking and UTR verification display for merchants
  - Implement link sharing functionality with copy-to-clipboard
  - _Requirements: 1.1, 1.3, 5.4_

- [ ] 10. Implement comprehensive error handling and validation

  - Create centralized error handling middleware for API routes
  - Build client-side error boundaries for payment and dashboard pages
  - Implement input validation for all forms (order creation, UTR submission, user management)
  - Add network error handling with retry mechanisms for UPI app redirects
  - Create user-friendly error messages and fallback UI states
  - _Requirements: 8.3, 8.4_

- [ ] 11. Add audit logging and analytics system

  - Implement audit logging for all order creation events per merchant
  - Create audit logs for UTR submissions and order status changes
  - Build audit logging for user management actions (create, delete, role changes)
  - Add audit logging for system settings modifications
  - Implement analytics aggregation for admin dashboard statistics
  - _Requirements: 4.5, 7.5, 8.5_

- [ ] 12. Implement responsive UI and mobile optimization

  - Ensure payment pages are mobile-optimized for UPI app interactions
  - Create responsive admin dashboard that works on tablets and mobile devices
  - Implement touch-friendly UPI app buttons with proper sizing
  - Add mobile-specific UX improvements for copy-to-clipboard functionality
  - Test and optimize countdown timer display on various screen sizes
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 13. Add comprehensive testing suite

  - Write unit tests for all API endpoints with various input scenarios
  - Create integration tests for authentication flow and role-based access
  - Implement end-to-end tests for complete payment workflow (creation to UTR submission)
  - Add tests for admin operations (user management, order verification, settings)
  - Create performance tests for database queries and API response times
  - _Requirements: All requirements validation_

- [ ] 14. Implement security measures and compliance features

  - Add rate limiting to API endpoints to prevent abuse
  - Implement CSRF protection for all form submissions
  - Create data encryption for sensitive information (UTR numbers)
  - Add input sanitization to prevent XSS attacks
  - Implement proper session management and logout functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 15. Set up monitoring and production deployment
  - Configure error tracking and performance monitoring
  - Set up database backup and recovery procedures
  - Implement health check endpoints for system monitoring
  - Create deployment scripts and environment configuration
  - Add logging for system performance and user activity tracking
  - _Requirements: 8.1, 8.2, 8.5_
