import { z } from "zod";

/**
 * Common validation schemas and utilities
 */

// UPI ID validation
export const UpiIdSchema = z
  .string()
  .regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID format")
  .min(1, "UPI ID is required");

// Amount validation
export const AmountSchema = z
  .number()
  .min(1, "Amount must be at least ₹1")
  .max(100000, "Amount cannot exceed ₹1,00,000");

// UTR validation
export const UTRSchema = z
  .string()
  .regex(/^[A-Za-z0-9]{12}$/, "UTR must be 12-digit alphanumeric");

// Order ID validation
export const OrderIdSchema = z
  .string()
  .regex(/^UPI\d+[A-Z0-9]{5}$/, "Invalid order ID format");

// Merchant name validation
export const MerchantNameSchema = z
  .string()
  .min(1, "Merchant name is required")
  .max(100, "Merchant name cannot exceed 100 characters")
  .regex(/^[a-zA-Z0-9\s.-]+$/, "Merchant name contains invalid characters");

// Timer duration validation (in minutes)
export const TimerDurationSchema = z
  .number()
  .min(1, "Timer duration must be at least 1 minute")
  .max(60, "Timer duration cannot exceed 60 minutes");

// Clerk user ID validation
export const ClerkUserIdSchema = z.string().min(1, "User ID is required");

// Role validation
export const RoleSchema = z.enum(["admin", "merchant", "viewer"]);

// Email validation
export const EmailSchema = z.string().email("Invalid email format");

// Name validation
export const NameSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name cannot exceed 50 characters")
  .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces");

// IP Address validation
export const IPAddressSchema = z
  .string()
  .regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    "Invalid IP address format"
  )
  .optional();

// User Agent validation
export const UserAgentSchema = z
  .string()
  .max(500, "User agent string too long")
  .optional();

/**
 * Validation utility functions
 */

// Validate UPI ID format
export const isValidUpiId = (upiId: string): boolean => {
  try {
    UpiIdSchema.parse(upiId);
    return true;
  } catch {
    return false;
  }
};

// Validate amount
export const isValidAmount = (amount: number): boolean => {
  try {
    AmountSchema.parse(amount);
    return true;
  } catch {
    return false;
  }
};

// Validate UTR
export const isValidUTR = (utr: string): boolean => {
  try {
    UTRSchema.parse(utr);
    return true;
  } catch {
    return false;
  }
};

// Validate order ID
export const isValidOrderId = (orderId: string): boolean => {
  try {
    OrderIdSchema.parse(orderId);
    return true;
  } catch {
    return false;
  }
};

// Validate merchant name
export const isValidMerchantName = (name: string): boolean => {
  try {
    MerchantNameSchema.parse(name);
    return true;
  } catch {
    return false;
  }
};

// Validate role
export const isValidRole = (
  role: string
): role is "admin" | "merchant" | "viewer" => {
  try {
    RoleSchema.parse(role);
    return true;
  } catch {
    return false;
  }
};

// Sanitize merchant name (remove special characters)
export const sanitizeMerchantName = (name: string): string => {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s.-]/g, "") // Remove invalid characters
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .substring(0, 100); // Limit length
};

// Sanitize UPI ID (basic cleanup)
export const sanitizeUpiId = (upiId: string): string => {
  return upiId.trim().toLowerCase().replace(/\s/g, ""); // Remove spaces
};

// Generate order ID
export const generateOrderId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `UPI${timestamp}${random}`;
};

// API Response validation schemas
export const CreateOrderResponseSchema = z.object({
  orderId: z.string(),
  paymentPageUrl: z.string().url(),
  upiLinks: z.record(z.string()),
  expiresAt: z.date(),
  amount: z.number(),
  merchantName: z.string(),
  vpa: z.string(),
});

export const OrderDetailsResponseSchema = z.object({
  order: z.object({
    orderId: z.string(),
    amount: z.number(),
    merchantName: z.string(),
    vpa: z.string(),
    status: z.enum([
      "pending",
      "pending-verification",
      "completed",
      "expired",
      "failed",
    ]),
    utr: z.string().optional(),
    createdAt: z.date(),
    expiresAt: z.date(),
    paymentPageUrl: z.string(),
  }),
  timeRemaining: z.number(),
  upiLinks: z.record(z.string()),
  enabledApps: z.array(z.string()),
  canSubmitUTR: z.boolean(),
});

export const UTRSubmissionResponseSchema = z.object({
  orderId: z.string(),
  utr: z.string(),
  status: z.string(),
  submittedAt: z.date(),
});

// Validate and sanitize form data
export const validateOrderCreation = (data: {
  amount: unknown;
  merchantName: unknown;
  vpa: unknown;
  createdBy: unknown;
}) => {
  return z
    .object({
      amount: AmountSchema,
      merchantName: MerchantNameSchema,
      vpa: UpiIdSchema,
      createdBy: ClerkUserIdSchema,
    })
    .parse(data);
};

// Validate UTR submission
export const validateUTRSubmission = (data: { utr: unknown }) => {
  return z
    .object({
      utr: UTRSchema,
    })
    .parse(data);
};

// Validate user creation
export const validateUserCreation = (data: {
  email: unknown;
  firstName: unknown;
  lastName: unknown;
  role: unknown;
}) => {
  return z
    .object({
      email: EmailSchema,
      firstName: NameSchema,
      lastName: NameSchema,
      role: RoleSchema,
    })
    .parse(data);
};

// Validate system settings update
export const validateSystemSettings = (data: {
  timerDuration?: unknown;
  staticUpiId?: unknown;
  enabledUpiApps?: unknown;
}) => {
  return z
    .object({
      timerDuration: TimerDurationSchema.optional(),
      staticUpiId: UpiIdSchema.optional(),
      enabledUpiApps: z
        .object({
          gpay: z.boolean().optional(),
          phonepe: z.boolean().optional(),
          paytm: z.boolean().optional(),
          bhim: z.boolean().optional(),
        })
        .optional(),
    })
    .parse(data);
};

// Error formatting for validation errors
export const formatValidationError = (error: z.ZodError): string => {
  return error.errors
    .map((err) => `${err.path.join(".")}: ${err.message}`)
    .join(", ");
};

// Check if error is a validation error
export const isValidationError = (error: unknown): error is z.ZodError => {
  return error instanceof z.ZodError;
};
