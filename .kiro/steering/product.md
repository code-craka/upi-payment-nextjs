# Product Overview

## UPI Payment Link Generator & Order Management System

A self-hosted Next.js application that enables merchants to create UPI payment links, manage orders, and verify transactions through manual UTR submission. The system provides a complete payment workflow from link generation to transaction verification.

### Core Features

- **Payment Link Generation**: Create UPI payment links via API or dashboard
- **Multi-UPI App Support**: Integration with GPay, PhonePe, Paytm, and BHIM
- **Manual Verification**: UTR-based transaction verification workflow  
- **Role-Based Access**: Admin, Merchant, and Viewer roles with appropriate permissions
- **Order Management**: Complete order lifecycle tracking and status management
- **System Configuration**: Configurable timer duration, UPI apps, and static UPI ID mode

### Target Users

- **Merchants**: Create and manage payment links, track orders
- **Customers**: Make payments through preferred UPI apps
- **Admins**: Oversee system operations, manage users, verify transactions

### Key Business Logic

- 9-minute default payment window with configurable timer
- Manual UTR submission for transaction verification
- Order status progression: pending → pending-verification → completed/failed
- Static UPI ID mode for simplified merchant setup