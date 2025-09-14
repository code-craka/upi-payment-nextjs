# Requirements Document

## Introduction

This document outlines the requirements for a self-hosted UPI payment link generator and order management system built with Next.js App Router, TypeScript, TailwindCSS v4, ShadCN UI, and MongoDB. The system enables merchants to create UPI payment links, redirect customers to UPI apps, collect UTR numbers for manual verification, and manage orders through an admin dashboard with Clerk authentication.

## Requirements

### Requirement 1: Payment Link Generation

**User Story:** As a merchant, I want to generate UPI payment links via API or dashboard, so that I can share payment links with customers for easy transactions.

#### Acceptance Criteria

1. WHEN a merchant creates a payment link THEN the system SHALL generate a unique order ID and payment page URL
2. WHEN a payment link is created THEN the system SHALL include amount, merchant name, and UPI ID
3. WHEN a merchant accesses the dashboard THEN the system SHALL provide a form to create payment links manually
4. WHEN an API request is made to create an order THEN the system SHALL return order ID, payment page URL, and UPI deep link
5. IF manual UPI ID mode is enabled THEN the system SHALL use the admin-configured static UPI ID for all links

### Requirement 2: Customer Payment Experience

**User Story:** As a customer, I want to easily pay through my preferred UPI app or manually, so that I can complete transactions quickly and conveniently.

#### Acceptance Criteria

1. WHEN a customer opens a payment page THEN the system SHALL display amount, merchant name, and UPI ID with copy buttons
2. WHEN a customer clicks a UPI app button THEN the system SHALL attempt to open the specific app (GPay, PhonePe, Paytm, BHIM)
3. IF a UPI app is not installed THEN the system SHALL redirect to the appropriate app store
4. WHEN a payment page loads THEN the system SHALL start a 9-minute countdown timer
5. WHEN the timer expires THEN the system SHALL mark the order as expired and disable payment options
6. WHEN a customer completes payment THEN the system SHALL provide a UTR input field for submission

### Requirement 3: UTR Submission and Verification

**User Story:** As a customer, I want to submit my UTR number after payment, so that the merchant can verify my transaction.

#### Acceptance Criteria

1. WHEN a customer submits a UTR THEN the system SHALL update the order status to "pending-verification"
2. WHEN a UTR is submitted THEN the system SHALL validate the UTR format (12-digit alphanumeric)
3. WHEN a UTR submission is successful THEN the system SHALL display a confirmation message
4. WHEN an admin reviews orders THEN the system SHALL display submitted UTRs for verification
5. WHEN an admin verifies a UTR THEN the system SHALL allow updating order status to "completed" or "failed"

### Requirement 4: Admin Dashboard and User Management

**User Story:** As an admin, I want to manage users and oversee all orders, so that I can control access and monitor system usage.

#### Acceptance Criteria

1. WHEN an admin accesses /admin THEN the system SHALL require Clerk authentication and admin role verification
2. WHEN an admin manages users THEN the system SHALL allow creating, updating, and deleting user accounts
3. WHEN an admin assigns roles THEN the system SHALL support Admin, Merchant, and Viewer role types
4. WHEN an admin views orders THEN the system SHALL display all orders with filtering options (pending, completed, expired)
5. WHEN an admin reviews analytics THEN the system SHALL show per-user link generation statistics
6. WHEN an admin configures settings THEN the system SHALL allow updating timer duration, static UPI ID, and enabled UPI apps

### Requirement 5: Authentication and Authorization

**User Story:** As a system user, I want secure authentication and role-based access, so that my data is protected and I can only access appropriate features.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL authenticate via Clerk
2. WHEN a user accesses protected routes THEN the system SHALL verify authentication status
3. WHEN a merchant accesses features THEN the system SHALL only show their own generated links and orders
4. WHEN an admin accesses features THEN the system SHALL provide full system access
5. WHEN a viewer accesses features THEN the system SHALL provide read-only access to assigned data

### Requirement 6: API Endpoints and Integration

**User Story:** As a developer, I want well-defined API endpoints, so that I can integrate the payment system with external applications.

#### Acceptance Criteria

1. WHEN POST /api/orders is called THEN the system SHALL create a new order and return order details
2. WHEN GET /api/orders/:orderId is called THEN the system SHALL return specific order information
3. WHEN POST /api/orders/:orderId/utr is called THEN the system SHALL accept UTR submission
4. WHEN POST /api/admin/users is called with admin auth THEN the system SHALL create a new user
5. WHEN DELETE /api/admin/users/:id is called with admin auth THEN the system SHALL remove the specified user
6. WHEN GET /api/admin/stats is called with admin auth THEN the system SHALL return usage analytics

### Requirement 7: System Configuration and Settings

**User Story:** As an admin, I want to configure system settings, so that I can customize the payment experience and business rules.

#### Acceptance Criteria

1. WHEN an admin configures timer settings THEN the system SHALL allow setting payment expiry time (default 9 minutes)
2. WHEN an admin enables manual UPI mode THEN the system SHALL use a static UPI ID for all payment links
3. WHEN an admin configures UPI apps THEN the system SHALL allow enabling/disabling specific payment apps
4. WHEN settings are updated THEN the system SHALL apply changes to new payment links immediately
5. WHEN system settings are modified THEN the system SHALL log changes for audit purposes

### Requirement 8: Data Management and Security

**User Story:** As a system administrator, I want secure data handling and compliance, so that sensitive information is protected and regulations are met.

#### Acceptance Criteria

1. WHEN orders are created THEN the system SHALL store data securely in MongoDB
2. WHEN orders expire THEN the system SHALL automatically update status after the configured time limit
3. WHEN admin actions occur THEN the system SHALL log activities for audit trails
4. WHEN sensitive data is handled THEN the system SHALL comply with GDPR and PCI-DSS requirements
5. WHEN users are deleted THEN the system SHALL handle data retention according to compliance policies