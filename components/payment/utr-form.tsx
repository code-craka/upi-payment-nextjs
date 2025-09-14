"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface UtrFormProps {
  orderId: string;
}

export default function UtrForm({ orderId }: UtrFormProps) {
  const [utr, setUtr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validateUtr = (value: string): boolean => {
    // UTR should be 12-digit alphanumeric
    const utrRegex = /^[A-Za-z0-9]{12}$/;
    return utrRegex.test(value);
  };

  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length <= 12) {
      setUtr(value);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUtr(utr)) {
      setError("UTR must be exactly 12 alphanumeric characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/utr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ utr }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit UTR");
      }

      setSuccess(true);

      // Refresh the page after a short delay to show the updated status
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("UTR submission error:", error);
      setError(error instanceof Error ? error.message : "Failed to submit UTR");
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
      <div className="space-y-2">
        <Label htmlFor="utr" className="text-sm font-medium">
          UTR Number (Transaction Reference)
        </Label>
        <Input
          id="utr"
          type="text"
          value={utr}
          onChange={handleUtrChange}
          placeholder="Enter 12-digit UTR number"
          className={`text-center text-lg font-mono tracking-wider ${
            utr && !validateUtr(utr)
              ? "border-red-300 focus:border-red-500"
              : ""
          }`}
          disabled={isSubmitting}
          maxLength={12}
        />
        <div className="text-xs text-gray-500 text-center">
          {utr.length}/12 characters
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!validateUtr(utr) || isSubmitting}
        className="w-full h-12 text-base font-medium"
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
