"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const CreateOrderSchema = z.object({
  amount: z
    .number()
    .min(1, "Amount must be at least ₹1")
    .max(100000, "Amount cannot exceed ₹1,00,000"),
  merchantName: z
    .string()
    .min(1, "Merchant name is required")
    .max(100, "Merchant name too long"),
  vpa: z
    .string()
    .regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID format")
    .optional(),
});

interface PaymentLinkFormProps {
  onSuccess?: (orderData: any) => void;
}

export function PaymentLinkForm({ onSuccess }: PaymentLinkFormProps) {
  const [formData, setFormData] = useState({
    amount: "",
    merchantName: "",
    vpa: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = CreateOrderSchema.parse({
        amount: parseFloat(formData.amount),
        merchantName: formData.merchantName.trim(),
        vpa: formData.vpa.trim() || undefined,
      });

      // Create order via API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment link");
      }

      const orderData = await response.json();

      // Reset form
      setFormData({
        amount: "",
        merchantName: "",
        vpa: "",
      });

      // Call success callback or refresh page
      if (onSuccess) {
        onSuccess(orderData.data);
      } else {
        router.refresh();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({
          general: error instanceof Error ? error.message : "An error occurred",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Create Payment Link
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Generate a new UPI payment link for your customers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div>
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="1"
            max="100000"
            value={formData.amount}
            onChange={(e) => handleInputChange("amount", e.target.value)}
            placeholder="Enter amount"
            className={errors.amount ? "border-red-300" : ""}
            disabled={isLoading}
          />
          {errors.amount && (
            <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
          )}
        </div>

        <div>
          <Label htmlFor="merchantName">Merchant Name</Label>
          <Input
            id="merchantName"
            type="text"
            value={formData.merchantName}
            onChange={(e) => handleInputChange("merchantName", e.target.value)}
            placeholder="Enter merchant name"
            className={errors.merchantName ? "border-red-300" : ""}
            disabled={isLoading}
          />
          {errors.merchantName && (
            <p className="text-sm text-red-600 mt-1">{errors.merchantName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="vpa">UPI ID (Optional)</Label>
          <Input
            id="vpa"
            type="text"
            value={formData.vpa}
            onChange={(e) => handleInputChange("vpa", e.target.value)}
            placeholder="merchant@upi (leave empty to use system default)"
            className={errors.vpa ? "border-red-300" : ""}
            disabled={isLoading}
          />
          {errors.vpa && (
            <p className="text-sm text-red-600 mt-1">{errors.vpa}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            If left empty, the system will use the configured default UPI ID
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              "Create Payment Link"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
