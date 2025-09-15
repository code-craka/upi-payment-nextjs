"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  ValidatedInput,
  ValidationRules,
  useFormValidation,
} from "@/components/forms/validated-input";
import { apiClient } from "@/lib/utils/network-handler";
import { ErrorDisplay, useToast } from "@/components/error/error-messages";

interface UtrFormProps {
  orderId: string;
}

export default function UtrForm({ orderId }: UtrFormProps) {
  const [utr, setUtr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const { updateFieldValidation, isFormValid } = useFormValidation();

  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length <= 12) {
      setUtr(value);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      showToast({
        type: "error",
        title: "Invalid UTR",
        message: "Please enter a valid 12-digit UTR number",
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data = await apiClient.post(
        `/orders/${orderId}/utr`,
        { utr },
        {
          retryOptions: {
            maxRetries: 2,
            baseDelay: 1000,
          },
        }
      );

      setSuccess(true);
      showToast({
        type: "success",
        title: "UTR Submitted Successfully",
        message: "Your payment is now under verification",
      });

      // Refresh the page after a short delay to show the updated status
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("UTR submission error:", error);
      setError(error);
      showToast({
        type: "error",
        title: "Submission Failed",
        message: error.message || "Failed to submit UTR. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="font-medium mb-2">✅ UTR submitted successfully!</div>
          <div className="text-sm mb-3">
            Your payment is now under verification. You will be notified once
            it&apos;s confirmed.
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-xs text-gray-600 mb-1">Submitted UTR:</div>
            <div className="font-mono text-sm font-medium text-gray-900">
              {utr}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Submitted at: {new Date().toLocaleString("en-IN")}
            </div>
          </div>
          <div className="text-xs text-blue-600 mt-2">
            💡 Keep this UTR number for your records
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ValidatedInput
        id="utr"
        label="UTR Number (Transaction Reference)"
        type="text"
        value={utr}
        onChange={handleUtrChange}
        placeholder="Enter 12-digit UTR number"
        className="text-center text-base sm:text-lg font-mono tracking-wider min-h-[44px]"
        disabled={isSubmitting}
        maxLength={12}
        validationRules={[
          ValidationRules.required("UTR number is required"),
          ValidationRules.utr(),
        ]}
        validateOnChange={true}
        onValidationChange={(isValid, errors) =>
          updateFieldValidation("utr", isValid, errors)
        }
      />

      <div className="text-xs text-gray-500 text-center">
        {utr.length}/12 characters
      </div>

      {error && (
        <ErrorDisplay
          error={error}
          onRetry={() =>
            handleSubmit({ preventDefault: () => {} } as React.FormEvent)
          }
          compact={true}
        />
      )}

      <Button
        type="submit"
        disabled={!isFormValid || isSubmitting}
        className="w-full h-12 sm:h-14 text-base font-medium touch-manipulation"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting UTR...
          </div>
        ) : (
          "Submit UTR"
        )}
      </Button>

      {/* UTR Help */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Where to find UTR?</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Check your UPI app&apos;s transaction history</p>
          <p>
            • Look for &quot;Transaction ID&quot; or &quot;UTR&quot; in payment
            details
          </p>
          <p>• It&apos;s a 12-digit alphanumeric code (e.g., 123456789012)</p>
          <p>• You may also receive it via SMS from your bank</p>
        </div>
      </div>

      {/* Example UTR format */}
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 text-center">
          <div className="font-medium mb-1">UTR Format Example:</div>
          <div className="font-mono text-sm bg-white px-2 py-1 rounded border inline-block">
            123ABC789XYZ
          </div>
        </div>
      </div>
    </form>
  );
}
