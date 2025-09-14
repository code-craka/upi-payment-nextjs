import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

// Zod validation schemas
export const OrderStatus = z.enum([
  "pending",
  "pending-verification",
  "completed",
  "expired",
  "failed",
]);

export const CreateOrderSchema = z.object({
  amount: z.number().min(1).max(100000),
  merchantName: z.string().min(1).max(100),
  vpa: z.string().regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID format"),
  createdBy: z.string().min(1),
});

export const SubmitUTRSchema = z.object({
  utr: z
    .string()
    .regex(/^[A-Za-z0-9]{12}$/, "UTR must be 12-digit alphanumeric"),
});

// TypeScript interfaces
export interface IOrder extends Document {
  orderId: string;
  amount: number;
  merchantName: string;
  vpa: string;
  status:
    | "pending"
    | "pending-verification"
    | "completed"
    | "expired"
    | "failed";
  utr?: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  paymentPageUrl: string;
  upiDeepLink: string;
  metadata: {
    customerIP?: string;
    userAgent?: string;
    referrer?: string;
    utrSubmittedAt?: Date;
    utrSubmissionIP?: string;
    utrSubmissionUserAgent?: string;
    utrRemovedAt?: Date;
    utrRemovedReason?: string;
    expiredAt?: Date;
    expiredBy?: string;
    adminNotes?: string;
    lastUpdatedBy?: string;
    lastUpdatedAt?: Date;
  };
  // Instance methods
  isExpired(): boolean;
  canSubmitUTR(): boolean;
  canUpdateStatus(): boolean;
}

// Static methods interface
export interface IOrderModel extends Model<IOrder> {
  findByOrderId(orderId: string): Promise<IOrder | null>;
  findByCreatedBy(createdBy: string, status?: string): Promise<IOrder[]>;
  findExpiredOrders(): Promise<IOrder[]>;
}

// Mongoose schema
const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
    },
    merchantName: {
      type: String,
      required: true,
      maxlength: 100,
    },
    vpa: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^[\w.-]+@[\w.-]+$/.test(v),
        message: "Invalid UPI ID format",
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "pending-verification",
        "completed",
        "expired",
        "failed",
      ],
      default: "pending",
      index: true,
    },
    utr: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^[A-Za-z0-9]{12}$/.test(v);
        },
        message: "UTR must be 12-digit alphanumeric",
      },
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    paymentPageUrl: {
      type: String,
      required: true,
    },
    upiDeepLink: {
      type: String,
      required: true,
    },
    metadata: {
      customerIP: String,
      userAgent: String,
      referrer: String,
      utrSubmittedAt: Date,
      utrSubmissionIP: String,
      utrSubmissionUserAgent: String,
      utrRemovedAt: Date,
      utrRemovedReason: String,
      expiredAt: Date,
      expiredBy: String,
      adminNotes: String,
      lastUpdatedBy: String,
      lastUpdatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
OrderSchema.index({ orderId: 1 }, { unique: true });
OrderSchema.index({ createdBy: 1 });
OrderSchema.index({ expiresAt: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

// Compound indexes for common queries
OrderSchema.index({ createdBy: 1, status: 1 });
OrderSchema.index({ createdBy: 1, createdAt: -1 });

// Instance methods
OrderSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

OrderSchema.methods.canSubmitUTR = function (): boolean {
  return this.status === "pending" && !this.isExpired();
};

OrderSchema.methods.canUpdateStatus = function (): boolean {
  return this.status === "pending-verification";
};

// Static methods
OrderSchema.statics.findByOrderId = function (orderId: string) {
  return this.findOne({ orderId });
};

OrderSchema.statics.findByCreatedBy = function (
  createdBy: string,
  status?: string
) {
  const query: any = { createdBy };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

OrderSchema.statics.findExpiredOrders = function () {
  return this.find({
    status: "pending",
    expiresAt: { $lt: new Date() },
  });
};

// Pre-save middleware to set expiration
OrderSchema.pre("save", function (next) {
  if (this.isNew && !this.expiresAt) {
    // Default 9 minutes expiration if not set
    this.expiresAt = new Date(Date.now() + 9 * 60 * 1000);
  }
  next();
});

// Create and export the model
const Order = (mongoose.models.Order ||
  mongoose.model<IOrder, IOrderModel>("Order", OrderSchema)) as IOrderModel;

export default Order;
