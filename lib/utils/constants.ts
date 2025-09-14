/**
 * Application constants and configuration
 */

// Order status constants
export const ORDER_STATUS = {
  PENDING: "pending",
  PENDING_VERIFICATION: "pending-verification",
  COMPLETED: "completed",
  EXPIRED: "expired",
  FAILED: "failed",
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: "admin",
  MERCHANT: "merchant",
  VIEWER: "viewer",
} as const;

// Audit actions
export const AUDIT_ACTIONS = {
  ORDER_CREATED: "order_created",
  ORDER_STATUS_UPDATED: "order_status_updated",
  UTR_SUBMITTED: "utr_submitted",
  USER_CREATED: "user_created",
  USER_DELETED: "user_deleted",
  USER_ROLE_UPDATED: "user_role_updated",
  SETTINGS_UPDATED: "settings_updated",
  LOGIN_ATTEMPT: "login_attempt",
  LOGOUT: "logout",
} as const;

// Entity types for audit logs
export const ENTITY_TYPES = {
  ORDER: "order",
  USER: "user",
  SETTINGS: "settings",
  AUTH: "auth",
} as const;

// UPI app identifiers
export const UPI_APP_IDS = {
  GPAY: "gpay",
  PHONEPE: "phonepe",
  PAYTM: "paytm",
  BHIM: "bhim",
} as const;

// Default system settings
export const DEFAULT_SETTINGS = {
  TIMER_DURATION: 9, // minutes
  ENABLED_UPI_APPS: {
    gpay: true,
    phonepe: true,
    paytm: true,
    bhim: true,
  },
} as const;

// Validation limits
export const LIMITS = {
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 100000,
  MIN_TIMER_DURATION: 1,
  MAX_TIMER_DURATION: 60,
  MAX_MERCHANT_NAME_LENGTH: 100,
  MAX_NAME_LENGTH: 50,
  UTR_LENGTH: 12,
  ORDER_ID_PREFIX: "UPI",
} as const;

// API endpoints
export const API_ENDPOINTS = {
  ORDERS: "/api/orders",
  ORDER_DETAILS: (orderId: string) => `/api/orders/${orderId}`,
  SUBMIT_UTR: (orderId: string) => `/api/orders/${orderId}/utr`,
  ADMIN_USERS: "/api/admin/users",
  ADMIN_STATS: "/api/admin/stats",
  ADMIN_SETTINGS: "/api/admin/settings",
} as const;

// Page routes
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  ADMIN: "/admin",
  PAYMENT: (orderId: string) => `/pay/${orderId}`,
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
} as const;

// Protected routes that require authentication
export const PROTECTED_ROUTES = [
  "/dashboard",
  "/admin",
  "/api/orders",
  "/api/admin",
] as const;

// Admin-only routes
export const ADMIN_ROUTES = ["/admin", "/api/admin"] as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Insufficient permissions",
  ORDER_NOT_FOUND: "Order not found",
  ORDER_EXPIRED: "Order has expired",
  INVALID_UTR: "Invalid UTR format",
  INVALID_UPI_ID: "Invalid UPI ID format",
  INVALID_AMOUNT: "Invalid amount",
  USER_NOT_FOUND: "User not found",
  SETTINGS_UPDATE_FAILED: "Failed to update settings",
  DATABASE_ERROR: "Database operation failed",
  VALIDATION_ERROR: "Validation failed",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  ORDER_CREATED: "Payment link created successfully",
  UTR_SUBMITTED: "UTR submitted successfully",
  ORDER_STATUS_UPDATED: "Order status updated successfully",
  USER_CREATED: "User created successfully",
  USER_DELETED: "User deleted successfully",
  SETTINGS_UPDATED: "Settings updated successfully",
} as const;

// Time constants (in milliseconds)
export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  ADMIN_DEFAULT_LIMIT: 50,
} as const;

// Cache durations (in seconds)
export const CACHE_DURATION = {
  SETTINGS: 300, // 5 minutes
  USER_STATS: 600, // 10 minutes
  ORDER_STATS: 300, // 5 minutes
} as const;

// Regular expressions
export const REGEX = {
  UPI_ID: /^[\w.-]+@[\w.-]+$/,
  UTR: /^[A-Za-z0-9]{12}$/,
  ORDER_ID: /^UPI\d+[A-Z0-9]{5}$/,
  MERCHANT_NAME: /^[a-zA-Z0-9\s.-]+$/,
  NAME: /^[a-zA-Z\s]+$/,
  IP_ADDRESS:
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Environment variables
export const ENV_VARS = {
  MONGODB_URI: "MONGODB_URI",
  CLERK_SECRET_KEY: "CLERK_SECRET_KEY",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
} as const;

// Feature flags (for future use)
export const FEATURES = {
  QR_CODE_GENERATION: true,
  AUTO_ORDER_CLEANUP: true,
  AUDIT_LOG_RETENTION: true,
  RATE_LIMITING: true,
} as const;
