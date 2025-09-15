"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Swal from "sweetalert2";

interface SystemSettings {
  timerDuration: number;
  staticUpiId: string;
  enabledUpiApps: {
    gpay: boolean;
    phonepe: boolean;
    paytm: boolean;
    bhim: boolean;
  };
  updatedBy: string;
  updatedAt: string;
}

interface SettingsHistory {
  _id: string;
  action: string;
  userId: string;
  userName?: string;
  details: any;
  timestamp: string;
  ipAddress?: string;
}

export function SettingsManagement() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [history, setHistory] = useState<SettingsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState({
    timerDuration: 9,
    staticUpiId: "",
    enabledUpiApps: {
      gpay: true,
      phonepe: true,
      paytm: true,
      bhim: true,
    },
  });

  // Fetch current settings
  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const result = await response.json();

      if (result.success) {
        setSettings(result.data);
        setFormData({
          timerDuration: result.data.timerDuration,
          staticUpiId: result.data.staticUpiId,
          enabledUpiApps: result.data.enabledUpiApps,
        });
      } else {
        throw new Error(result.error || "Failed to fetch settings");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load system settings",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch settings history
  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/admin/settings/history");
      const result = await response.json();

      if (result.success) {
        setHistory(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch history");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load settings history",
        icon: "error",
      });
    }
  };

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSettings(result.data);
        Swal.fire({
          title: "Success",
          text: "Settings updated successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh history if it's being shown
        if (showHistory) {
          fetchHistory();
        }
      } else {
        throw new Error(result.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update settings",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    const result = await Swal.fire({
      title: "Reset to Defaults?",
      text: "This will reset all settings to their default values. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, reset settings",
    });

    if (result.isConfirmed) {
      setSaving(true);
      try {
        const response = await fetch("/api/admin/settings/reset", {
          method: "POST",
        });

        const result = await response.json();

        if (result.success) {
          setSettings(result.data);
          setFormData({
            timerDuration: result.data.timerDuration,
            staticUpiId: result.data.staticUpiId,
            enabledUpiApps: result.data.enabledUpiApps,
          });

          Swal.fire({
            title: "Reset Complete",
            text: "Settings have been reset to defaults",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });

          // Refresh history if it's being shown
          if (showHistory) {
            fetchHistory();
          }
        } else {
          throw new Error(result.error || "Failed to reset settings");
        }
      } catch (error) {
        console.error("Error resetting settings:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to reset settings",
          icon: "error",
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Handle UPI app toggle
  const handleUpiAppToggle = (app: keyof typeof formData.enabledUpiApps) => {
    setFormData((prev) => ({
      ...prev,
      enabledUpiApps: {
        ...prev.enabledUpiApps,
        [app]: !prev.enabledUpiApps[app],
      },
    }));
  };

  // Handle timer duration change
  const handleTimerChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 60) {
      setFormData((prev) => ({
        ...prev,
        timerDuration: numValue,
      }));
    }
  };

  // Handle static UPI ID change
  const handleUpiIdChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      staticUpiId: value,
    }));
  };

  // Validate UPI ID format
  const isValidUpiId = (upiId: string): boolean => {
    if (!upiId) return true; // Empty is valid (optional)
    return /^[\w.-]+@[\w.-]+$/.test(upiId);
  };

  // Check if form has changes
  const hasChanges = () => {
    if (!settings) return false;

    return (
      formData.timerDuration !== settings.timerDuration ||
      formData.staticUpiId !== settings.staticUpiId ||
      JSON.stringify(formData.enabledUpiApps) !==
        JSON.stringify(settings.enabledUpiApps)
    );
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure payment system behavior and UPI app integrations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) fetchHistory();
            }}
          >
            {showHistory ? "Hide History" : "View History"}
          </Button>
          <Button variant="outline" onClick={resetToDefaults} disabled={saving}>
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          {/* Timer Duration */}
          <div>
            <Label
              htmlFor="timerDuration"
              className="text-sm font-medium text-gray-700"
            >
              Payment Timer Duration (minutes)
            </Label>
            <div className="mt-1">
              <Input
                id="timerDuration"
                type="number"
                min="1"
                max="60"
                value={formData.timerDuration}
                onChange={(e) => handleTimerChange(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500 mt-1">
                How long customers have to complete payment (1-60 minutes)
              </p>
            </div>
          </div>

          {/* Static UPI ID */}
          <div>
            <Label
              htmlFor="staticUpiId"
              className="text-sm font-medium text-gray-700"
            >
              Static UPI ID (Optional)
            </Label>
            <div className="mt-1">
              <Input
                id="staticUpiId"
                type="text"
                placeholder="merchant@upi"
                value={formData.staticUpiId}
                onChange={(e) => handleUpiIdChange(e.target.value)}
                className={`max-w-md ${
                  formData.staticUpiId && !isValidUpiId(formData.staticUpiId)
                    ? "border-red-500"
                    : ""
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                When set, all payment links will use this UPI ID instead of
                individual merchant UPI IDs
              </p>
              {formData.staticUpiId && !isValidUpiId(formData.staticUpiId) && (
                <p className="text-xs text-red-500 mt-1">
                  Invalid UPI ID format. Use format: username@provider
                </p>
              )}
            </div>
          </div>

          {/* UPI App Toggles */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Enabled UPI Apps
            </Label>
            <div className="mt-2 grid grid-cols-2 gap-4 max-w-md">
              {Object.entries(formData.enabledUpiApps).map(([app, enabled]) => (
                <div key={app} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={app}
                    checked={enabled}
                    onChange={() =>
                      handleUpiAppToggle(
                        app as keyof typeof formData.enabledUpiApps
                      )
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label
                    htmlFor={app}
                    className="text-sm text-gray-700 capitalize"
                  >
                    {app === "gpay"
                      ? "Google Pay"
                      : app === "phonepe"
                        ? "PhonePe"
                        : app === "paytm"
                          ? "Paytm"
                          : "BHIM"}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Customers will only see buttons for enabled UPI apps
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={saveSettings}
              disabled={
                saving ||
                !hasChanges() ||
                (formData.staticUpiId && !isValidUpiId(formData.staticUpiId))
              }
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>

      {/* Current Settings Info */}
      {settings && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Current Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Timer Duration:</span>
              <span className="ml-2 font-medium">
                {settings.timerDuration} minutes
              </span>
            </div>
            <div>
              <span className="text-gray-500">Static UPI ID:</span>
              <span className="ml-2 font-medium">
                {settings.staticUpiId || "Not set"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <span className="ml-2 font-medium">
                {new Date(settings.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-gray-500">Enabled Apps:</span>
            <div className="ml-2 inline-flex space-x-1">
              {Object.entries(settings.enabledUpiApps)
                .filter(([_, enabled]) => enabled)
                .map(([app]) => (
                  <Badge key={app} variant="secondary" className="text-xs">
                    {app === "gpay"
                      ? "GPay"
                      : app === "phonepe"
                        ? "PhonePe"
                        : app === "paytm"
                          ? "Paytm"
                          : "BHIM"}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings History */}
      {showHistory && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Settings Change History
          </h3>
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No settings changes recorded
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry._id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Settings Updated
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {entry.userName || entry.userId}
                    </Badge>
                  </div>
                  {entry.details && (
                    <div className="mt-2 text-xs text-gray-600">
                      <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
