/**
 * UPI Deep Link Generation Utilities
 * Handles creation of UPI payment links for different apps
 */

export interface UpiLinkParams {
  vpa: string; // UPI ID
  amount: number;
  merchantName: string;
  orderId?: string;
  note?: string;
}

export interface UpiAppConfig {
  name: string;
  scheme: string;
  packageId: string;
  playStoreUrl: string;
  appStoreUrl: string;
}

// UPI app configurations
export const UPI_APPS: Record<string, UpiAppConfig> = {
  gpay: {
    name: "Google Pay",
    scheme: "tez://upi/pay",
    packageId: "com.google.android.apps.nbu.paisa.user",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user",
    appStoreUrl: "https://apps.apple.com/app/google-pay/id1193357041",
  },
  phonepe: {
    name: "PhonePe",
    scheme: "phonepe://pay",
    packageId: "com.phonepe.app",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.phonepe.app",
    appStoreUrl: "https://apps.apple.com/app/phonepe/id1170055821",
  },
  paytm: {
    name: "Paytm",
    scheme: "paytmmp://pay",
    packageId: "net.one97.paytm",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=net.one97.paytm",
    appStoreUrl: "https://apps.apple.com/app/paytm/id473941634",
  },
  bhim: {
    name: "BHIM",
    scheme: "bhim://pay",
    packageId: "in.org.npci.upiapp",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=in.org.npci.upiapp",
    appStoreUrl: "https://apps.apple.com/app/bhim/id1200315258",
  },
};

/**
 * Generate standard UPI payment link
 */
export const generateUpiLink = (params: UpiLinkParams): string => {
  const { vpa, amount, merchantName, orderId, note } = params;

  const upiParams = new URLSearchParams({
    pa: vpa,
    am: amount.toString(),
    tn: note || `Payment to ${merchantName}`,
    ...(orderId && { tr: orderId }),
  });

  return `upi://pay?${upiParams.toString()}`;
};

/**
 * Generate app-specific UPI deep link
 */
export const generateAppSpecificLink = (
  app: keyof typeof UPI_APPS,
  params: UpiLinkParams
): string => {
  const appConfig = UPI_APPS[app];
  if (!appConfig) {
    throw new Error(`Unsupported UPI app: ${app}`);
  }

  const { vpa, amount, merchantName, orderId, note } = params;

  // For most apps, we can use the standard UPI scheme
  // Some apps might need specific parameter formatting
  switch (app) {
    case "gpay":
      return generateGPayLink(params);
    case "phonepe":
      return generatePhonePeLink(params);
    case "paytm":
      return generatePaytmLink(params);
    case "bhim":
      return generateBhimLink(params);
    default:
      return generateUpiLink(params);
  }
};

/**
 * Generate Google Pay specific link
 */
const generateGPayLink = (params: UpiLinkParams): string => {
  const { vpa, amount, merchantName, orderId, note } = params;

  const gPayParams = new URLSearchParams({
    pa: vpa,
    am: amount.toString(),
    tn: note || `Payment to ${merchantName}`,
    ...(orderId && { tr: orderId }),
  });

  return `tez://upi/pay?${gPayParams.toString()}`;
};

/**
 * Generate PhonePe specific link
 */
const generatePhonePeLink = (params: UpiLinkParams): string => {
  const { vpa, amount, merchantName, orderId, note } = params;

  const phonePeParams = new URLSearchParams({
    pa: vpa,
    am: amount.toString(),
    tn: note || `Payment to ${merchantName}`,
    ...(orderId && { tr: orderId }),
  });

  return `phonepe://pay?${phonePeParams.toString()}`;
};

/**
 * Generate Paytm specific link
 */
const generatePaytmLink = (params: UpiLinkParams): string => {
  const { vpa, amount, merchantName, orderId, note } = params;

  const paytmParams = new URLSearchParams({
    pa: vpa,
    am: amount.toString(),
    tn: note || `Payment to ${merchantName}`,
    ...(orderId && { tr: orderId }),
  });

  return `paytmmp://pay?${paytmParams.toString()}`;
};

/**
 * Generate BHIM specific link
 */
const generateBhimLink = (params: UpiLinkParams): string => {
  // BHIM uses standard UPI scheme
  return generateUpiLink(params);
};

/**
 * Get app store URL for a specific UPI app
 */
export const getAppStoreUrl = (
  app: keyof typeof UPI_APPS,
  platform: "android" | "ios" = "android"
): string => {
  const appConfig = UPI_APPS[app];
  if (!appConfig) {
    throw new Error(`Unsupported UPI app: ${app}`);
  }

  return platform === "ios" ? appConfig.appStoreUrl : appConfig.playStoreUrl;
};

/**
 * Generate QR code data for UPI payment
 */
export const generateQRCodeData = (params: UpiLinkParams): string => {
  return generateUpiLink(params);
};

/**
 * Validate UPI ID format
 */
export const validateUpiId = (upiId: string): boolean => {
  // UPI ID format: username@bank
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upiId);
};

/**
 * Extract UPI ID from a UPI link
 */
export const extractUpiIdFromLink = (upiLink: string): string | null => {
  try {
    const url = new URL(upiLink);
    return url.searchParams.get("pa");
  } catch {
    return null;
  }
};

/**
 * Extract amount from a UPI link
 */
export const extractAmountFromLink = (upiLink: string): number | null => {
  try {
    const url = new URL(upiLink);
    const amount = url.searchParams.get("am");
    return amount ? parseFloat(amount) : null;
  } catch {
    return null;
  }
};

/**
 * Check if device supports UPI apps
 */
export const getDeviceUpiSupport = (): {
  supportsUpi: boolean;
  supportedApps: string[];
} => {
  // This would be used on the client side
  // For server-side, we assume all apps are supported
  if (typeof window === "undefined") {
    return {
      supportsUpi: true,
      supportedApps: Object.keys(UPI_APPS),
    };
  }

  // Client-side detection would go here
  // For now, assume all apps are supported
  return {
    supportsUpi: true,
    supportedApps: Object.keys(UPI_APPS),
  };
};

/**
 * Generate all UPI links for an order
 */
export const generateAllUpiLinks = (
  params: UpiLinkParams,
  enabledApps: string[] = Object.keys(UPI_APPS)
): Record<string, string> => {
  const links: Record<string, string> = {};

  // Standard UPI link
  links.standard = generateUpiLink(params);

  // App-specific links
  enabledApps.forEach((app) => {
    if (app in UPI_APPS) {
      try {
        links[app] = generateAppSpecificLink(
          app as keyof typeof UPI_APPS,
          params
        );
      } catch (error) {
        console.warn(`Failed to generate ${app} link:`, error);
        // Fallback to standard UPI link
        links[app] = generateUpiLink(params);
      }
    }
  });

  return links;
};
