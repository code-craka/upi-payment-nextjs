import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

export default function PaymentNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Not Found
            </h1>
            <p className="text-gray-600">
              The payment link you&apos;re looking for doesn&apos;t exist or may
              have been removed.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                Possible reasons:
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• The payment link is invalid or expired</li>
                <li>• The order ID was typed incorrectly</li>
                <li>• The payment has already been processed</li>
                <li>• The link has been deactivated by the merchant</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Homepage
                </Link>
              </Button>

              <p className="text-sm text-gray-500">
                If you believe this is an error, please contact the merchant who
                sent you this payment link.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
