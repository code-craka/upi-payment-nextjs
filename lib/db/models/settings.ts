import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

// Zod validation schemas
export const UpiAppsSchema = z.object({
  gpay: z.boolean().default(true),
  phonepe: z.boolean().default(true),
  paytm: z.boolean().default(true),
  bhim: z.boolean().default(true),
});

export const SystemSettingsSchema = z.object({
  timerDuration: z.number().min(1).max(60).default(9), // 1-60 minutes
  staticUpiId: z
    .string()
    .regex(/^[\w.-]+@[\w.-]+$/)
    .optional(),
  enabledUpiApps: UpiAppsSchema,
  updatedBy: z.string().min(1),
});

// TypeScript interfaces
export interface IUpiApps {
  gpay: boolean;
  phonepe: boolean;
  paytm: boolean;
  bhim: boolean;
}

export interface ISystemSettings extends Document {
  timerDuration: number;
  staticUpiId?: string;
  enabledUpiApps: IUpiApps;
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
  // Instance methods
  getEnabledApps(): string[];
  isUpiAppEnabled(app: string): boolean;
  getTimerDurationMs(): number;
}

// Static methods interface
export interface ISystemSettingsModel extends Model<ISystemSettings> {
  getSettings(): Promise<ISystemSettings>;
  updateSettings(
    updates: Partial<ISystemSettings>,
    updatedBy: string
  ): Promise<ISystemSettings>;
}

// Mongoose schema
const UpiAppsSchema_Mongoose = new Schema<IUpiApps>(
  {
    gpay: {
      type: Boolean,
      default: true,
    },
    phonepe: {
      type: Boolean,
      default: true,
    },
    paytm: {
      type: Boolean,
      default: true,
    },
    bhim: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const SystemSettingsSchema_Mongoose = new Schema<ISystemSettings>(
  {
    timerDuration: {
      type: Number,
      required: true,
      min: 1,
      max: 60,
      default: 9,
    },
    staticUpiId: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^[\w.-]+@[\w.-]+$/.test(v);
        },
        message: "Invalid UPI ID format",
      },
    },
    enabledUpiApps: {
      type: UpiAppsSchema_Mongoose,
      default: () => ({
        gpay: true,
        phonepe: true,
        paytm: true,
        bhim: true,
      }),
    },
    updatedBy: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SystemSettingsSchema_Mongoose.index({ updatedAt: -1 });

// Instance methods
SystemSettingsSchema_Mongoose.methods.getEnabledApps = function (): string[] {
  const apps: string[] = [];
  if (this.enabledUpiApps.gpay) apps.push("gpay");
  if (this.enabledUpiApps.phonepe) apps.push("phonepe");
  if (this.enabledUpiApps.paytm) apps.push("paytm");
  if (this.enabledUpiApps.bhim) apps.push("bhim");
  return apps;
};

SystemSettingsSchema_Mongoose.methods.isUpiAppEnabled = function (
  app: string
): boolean {
  return this.enabledUpiApps[app as keyof IUpiApps] || false;
};

SystemSettingsSchema_Mongoose.methods.getTimerDurationMs = function (): number {
  return this.timerDuration * 60 * 1000;
};

// Static methods
SystemSettingsSchema_Mongoose.statics.getSettings = async function () {
  let settings = await this.findOne().sort({ updatedAt: -1 });

  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({
      timerDuration: 9,
      enabledUpiApps: {
        gpay: true,
        phonepe: true,
        paytm: true,
        bhim: true,
      },
      updatedBy: "system",
    });
  }

  return settings;
};

SystemSettingsSchema_Mongoose.statics.updateSettings = async function (
  updates: Partial<ISystemSettings>,
  updatedBy: string
) {
  const settings = await (this as any).getSettings();

  Object.assign(settings, updates, {
    updatedBy,
    updatedAt: new Date(),
  });

  return await settings.save();
};

// Pre-save middleware
SystemSettingsSchema_Mongoose.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create and export the model
const SystemSettings = (mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettings, ISystemSettingsModel>(
    "SystemSettings",
    SystemSettingsSchema_Mongoose
  )) as ISystemSettingsModel;

export default SystemSettings;
