import connectDB from "../connection";
import SystemSettings, {
  ISystemSettings,
  SystemSettingsSchema,
} from "../models/settings";
import AuditLog from "../models/audit-log";
import { z } from "zod";

// Connect to database before operations
const ensureConnection = async () => {
  await connectDB();
};

// Get current system settings
export const getSystemSettings = async (): Promise<ISystemSettings> => {
  await ensureConnection();
  return await SystemSettings.getSettings();
};

// Update system settings with validation and audit logging
export const updateSystemSettings = async (
  updates: Partial<z.infer<typeof SystemSettingsSchema>>,
  updatedBy: string,
  options: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<ISystemSettings> => {
  await ensureConnection();

  // Get current settings for comparison
  const currentSettings = await SystemSettings.getSettings();
  const oldValues = {
    timerDuration: currentSettings.timerDuration,
    staticUpiId: currentSettings.staticUpiId,
    enabledUpiApps: { ...currentSettings.enabledUpiApps },
  };

  // Validate updates
  const validatedUpdates = SystemSettingsSchema.partial().parse(updates);

  // Update settings
  const updatedSettings = await SystemSettings.updateSettings(
    validatedUpdates as Partial<ISystemSettings>,
    updatedBy
  );

  // Prepare audit details
  const auditDetails: Record<string, any> = {};

  if (
    validatedUpdates.timerDuration !== undefined &&
    validatedUpdates.timerDuration !== oldValues.timerDuration
  ) {
    auditDetails.timerDuration = {
      old: oldValues.timerDuration,
      new: validatedUpdates.timerDuration,
    };
  }

  if (
    validatedUpdates.staticUpiId !== undefined &&
    validatedUpdates.staticUpiId !== oldValues.staticUpiId
  ) {
    auditDetails.staticUpiId = {
      old: oldValues.staticUpiId,
      new: validatedUpdates.staticUpiId,
    };
  }

  if (validatedUpdates.enabledUpiApps) {
    const upiAppChanges: Record<string, any> = {};
    Object.keys(validatedUpdates.enabledUpiApps).forEach((app) => {
      const oldValue =
        oldValues.enabledUpiApps[app as keyof typeof oldValues.enabledUpiApps];
      const newValue =
        validatedUpdates.enabledUpiApps![
          app as keyof typeof validatedUpdates.enabledUpiApps
        ];

      if (oldValue !== newValue) {
        upiAppChanges[app] = {
          old: oldValue,
          new: newValue,
        };
      }
    });

    if (Object.keys(upiAppChanges).length > 0) {
      auditDetails.enabledUpiApps = upiAppChanges;
    }
  }

  // Log audit event if there were actual changes
  if (Object.keys(auditDetails).length > 0) {
    await AuditLog.logAction("settings_updated", "settings", updatedBy, {
      entityId: (updatedSettings._id as any).toString(),
      details: auditDetails,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });
  }

  return updatedSettings;
};

// Update timer duration specifically
export const updateTimerDuration = async (
  timerDuration: number,
  updatedBy: string,
  options: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<ISystemSettings> => {
  return await updateSystemSettings({ timerDuration }, updatedBy, options);
};

// Update static UPI ID
export const updateStaticUpiId = async (
  staticUpiId: string | undefined,
  updatedBy: string,
  options: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<ISystemSettings> => {
  return await updateSystemSettings({ staticUpiId }, updatedBy, options);
};

// Update UPI app toggles
export const updateUpiApps = async (
  enabledUpiApps: Partial<ISystemSettings["enabledUpiApps"]>,
  updatedBy: string,
  options: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<ISystemSettings> => {
  const currentSettings = await getSystemSettings();

  const updatedApps = {
    ...currentSettings.enabledUpiApps,
    ...enabledUpiApps,
  };

  return await updateSystemSettings(
    { enabledUpiApps: updatedApps },
    updatedBy,
    options
  );
};

// Toggle specific UPI app
export const toggleUpiApp = async (
  app: keyof ISystemSettings["enabledUpiApps"],
  enabled: boolean,
  updatedBy: string,
  options: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<ISystemSettings> => {
  return await updateUpiApps({ [app]: enabled }, updatedBy, options);
};

// Get settings history (from audit logs)
export const getSettingsHistory = async (
  limit: number = 50
): Promise<any[]> => {
  await ensureConnection();

  return await AuditLog.getRecentActivity(limit, {
    entityType: "settings",
    action: "settings_updated",
  });
};

// Reset settings to defaults
export const resetSettingsToDefaults = async (
  updatedBy: string,
  options: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<ISystemSettings> => {
  const defaultSettings = {
    timerDuration: 9,
    staticUpiId: undefined,
    enabledUpiApps: {
      gpay: true,
      phonepe: true,
      paytm: true,
      bhim: true,
    },
  };

  return await updateSystemSettings(defaultSettings, updatedBy, options);
};

// Validate UPI ID format
export const validateUpiId = (upiId: string): boolean => {
  return /^[\w.-]+@[\w.-]+$/.test(upiId);
};

// Get enabled UPI apps list
export const getEnabledUpiApps = async (): Promise<string[]> => {
  const settings = await getSystemSettings();
  return settings.getEnabledApps();
};

// Check if specific UPI app is enabled
export const isUpiAppEnabled = async (app: string): Promise<boolean> => {
  const settings = await getSystemSettings();
  return settings.isUpiAppEnabled(app);
};

// Get timer duration in milliseconds
export const getTimerDurationMs = async (): Promise<number> => {
  const settings = await getSystemSettings();
  return settings.getTimerDurationMs();
};
