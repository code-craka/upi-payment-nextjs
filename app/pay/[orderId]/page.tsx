import { notFound } from "next/navigation";
import { Metadata } from "next";
import connectDB from "@/lib/db/connection";
import Order from "@/lib/db/models/order";
import SystemSettings from "@/lib/db/models/settings";
import { generateAllUpiLinks } from "@/lib/utils/upi-links";
import PaymentPageClient from "@/components/payment/payment-page-client";
import { PaymentErrorBoundary } from "@/components/error/error-boundary";

interface PaymentPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PaymentPageProps): Promise<Metadata> {
  await connectDB();
  const { orderId } = await params;
  const order = await Order.findByOrderId(orderId);

  if (!order) {
    return {
      title: "Payment Not Found",
    };
  }

  return {
    title: `Pay ₹${order.amount} to ${order.merchantName}`,
    description: `Complete your payment of ₹${order.amount} to ${order.merchantName} using UPI`,
  };
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { orderId } = await params;

  try {
    // Connect to database
    await connectDB();

    // Find order by orderId
    const order = await Order.findByOrderId(orderId);
    if (!order) {
      notFound();
    }

    // Check if order has expired and update status if needed
    if (order.isExpired() && order.status === "pending") {
      order.status = "expired";
      await order.save();
    }

    // Get system settings for UPI app configuration
    const settings = await SystemSettings.getSettings();
    const enabledApps = settings.getEnabledApps();

    // Generate fresh UPI links (in case settings changed)
    const upiLinks = generateAllUpiLinks(
      {
        vpa: order.vpa,
        amount: order.amount,
        merchantName: order.merchantName,
        orderId: order.orderId,
        note: `Payment to ${order.merchantName}`,
      },
      enabledApps
    );

    // Calculate time remaining (in seconds)
    const now = new Date();
    const timeRemaining = Math.max(
      0,
      Math.floor((order.expiresAt.getTime() - now.getTime()) / 1000)
    );

    // Prepare order data for client component
    const orderData = {
      orderId: order.orderId,
      amount: order.amount,
      merchantName: order.merchantName,
      vpa: order.vpa,
      status: order.status,
      utr: order.utr,
      createdAt: order.createdAt.toISOString(),
      expiresAt: order.expiresAt.toISOString(),
      canSubmitUTR: order.canSubmitUTR(),
      utrSubmittedAt: order.metadata?.utrSubmittedAt?.toISOString(),
    };

    const settingsData = {
      timerDuration: settings.timerDuration,
      enabledUpiApps: settings.enabledUpiApps,
      staticUpiId: settings.staticUpiId,
    };

    return (
      <PaymentErrorBoundary>
        <PaymentPageClient
          order={orderData}
          settings={settingsData}
          upiLinks={upiLinks}
          enabledApps={enabledApps}
          initialTimeRemaining={timeRemaining}
        />
      </PaymentErrorBoundary>
    );
  } catch (error) {
    console.error("Error loading payment page:", error);
    notFound();
  }
}
