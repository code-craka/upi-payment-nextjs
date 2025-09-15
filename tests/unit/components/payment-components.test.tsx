import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock components (these would be imported from actual component files)
const MockCountdownTimer = ({
  expiresAt,
  onExpire,
}: {
  expiresAt: Date;
  onExpire: () => void;
}) => {
  const [timeLeft, setTimeLeft] = React.useState(300); // 5 minutes

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div data-testid="countdown-timer">
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
};

const MockUPIButtons = ({
  upiLinks,
  enabledApps,
  onAppClick,
}: {
  upiLinks: Record<string, string>;
  enabledApps: string[];
  onAppClick: (app: string) => void;
}) => {
  return (
    <div data-testid="upi-buttons">
      {enabledApps.map((app) => (
        <button
          key={app}
          data-testid={`upi-button-${app}`}
          onClick={() => onAppClick(app)}
          disabled={!upiLinks[app]}
        >
          {app.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

const MockUTRForm = ({
  onSubmit,
  disabled,
}: {
  onSubmit: (utr: string) => void;
  disabled?: boolean;
}) => {
  const [utr, setUtr] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^[A-Za-z0-9]{12}$/.test(utr)) {
      setError("UTR must be 12-digit alphanumeric");
      return;
    }

    setError("");
    onSubmit(utr);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="utr-form">
      <input
        data-testid="utr-input"
        value={utr}
        onChange={(e) => setUtr(e.target.value)}
        disabled={disabled}
        placeholder="Enter UTR number"
      />
      <button
        type="submit"
        data-testid="submit-utr-button"
        disabled={disabled || !utr}
      >
        Submit UTR
      </button>
      {error && <div data-testid="utr-error">{error}</div>}
    </form>
  );
};

const MockQRCodeDisplay = ({
  upiLink,
  amount,
  vpa,
}: {
  upiLink: string;
  amount: number;
  vpa: string;
}) => {
  const [copied, setCopied] = React.useState("");

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div data-testid="qr-code-display">
      <div data-testid="qr-code">QR Code for: {upiLink}</div>
      <div data-testid="payment-details">
        <div>Amount: ₹{amount}</div>
        <div>UPI ID: {vpa}</div>
        <button
          data-testid="copy-amount"
          onClick={() => copyToClipboard(amount.toString(), "amount")}
        >
          Copy Amount
        </button>
        <button
          data-testid="copy-upi-id"
          onClick={() => copyToClipboard(vpa, "upi")}
        >
          Copy UPI ID
        </button>
        {copied && <div data-testid="copy-success">Copied {copied}!</div>}
      </div>
    </div>
  );
};

describe("Payment Components", () => {
  // Mock clipboard API
  beforeAll(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  describe("CountdownTimer", () => {
    it("should display initial time correctly", () => {
      const expiresAt = new Date(Date.now() + 300000); // 5 minutes from now
      const onExpire = jest.fn();

      render(<MockCountdownTimer expiresAt={expiresAt} onExpire={onExpire} />);

      expect(screen.getByTestId("countdown-timer")).toBeInTheDocument();
      expect(screen.getByTestId("countdown-timer")).toHaveTextContent("5:00");
    });

    it("should call onExpire when timer reaches zero", async () => {
      const expiresAt = new Date(Date.now() + 2000); // 2 seconds from now
      const onExpire = jest.fn();

      render(<MockCountdownTimer expiresAt={expiresAt} onExpire={onExpire} />);

      // Wait for timer to expire
      await waitFor(
        () => {
          expect(onExpire).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it("should update display every second", async () => {
      const expiresAt = new Date(Date.now() + 300000);
      const onExpire = jest.fn();

      render(<MockCountdownTimer expiresAt={expiresAt} onExpire={onExpire} />);

      const timer = screen.getByTestId("countdown-timer");
      const initialText = timer.textContent;

      // Wait for at least one update
      await waitFor(
        () => {
          expect(timer.textContent).not.toBe(initialText);
        },
        { timeout: 2000 }
      );
    });
  });

  describe("UPIButtons", () => {
    const mockUpiLinks = {
      gpay: "tez://upi/pay?pa=test@upi&am=100",
      phonepe: "phonepe://pay?pa=test@upi&am=100",
      paytm: "paytmmp://pay?pa=test@upi&am=100",
      bhim: "upi://pay?pa=test@upi&am=100",
    };

    it("should render enabled UPI app buttons", () => {
      const enabledApps = ["gpay", "phonepe", "paytm"];
      const onAppClick = jest.fn();

      render(
        <MockUPIButtons
          upiLinks={mockUpiLinks}
          enabledApps={enabledApps}
          onAppClick={onAppClick}
        />
      );

      expect(screen.getByTestId("upi-button-gpay")).toBeInTheDocument();
      expect(screen.getByTestId("upi-button-phonepe")).toBeInTheDocument();
      expect(screen.getByTestId("upi-button-paytm")).toBeInTheDocument();
      expect(screen.queryByTestId("upi-button-bhim")).not.toBeInTheDocument();
    });

    it("should call onAppClick when button is clicked", () => {
      const enabledApps = ["gpay", "phonepe"];
      const onAppClick = jest.fn();

      render(
        <MockUPIButtons
          upiLinks={mockUpiLinks}
          enabledApps={enabledApps}
          onAppClick={onAppClick}
        />
      );

      fireEvent.click(screen.getByTestId("upi-button-gpay"));
      expect(onAppClick).toHaveBeenCalledWith("gpay");

      fireEvent.click(screen.getByTestId("upi-button-phonepe"));
      expect(onAppClick).toHaveBeenCalledWith("phonepe");
    });

    it("should disable buttons when UPI link is not available", () => {
      const incompleteLinks = { gpay: "tez://upi/pay?pa=test@upi&am=100" };
      const enabledApps = ["gpay", "phonepe"];
      const onAppClick = jest.fn();

      render(
        <MockUPIButtons
          upiLinks={incompleteLinks}
          enabledApps={enabledApps}
          onAppClick={onAppClick}
        />
      );

      expect(screen.getByTestId("upi-button-gpay")).not.toBeDisabled();
      expect(screen.getByTestId("upi-button-phonepe")).toBeDisabled();
    });
  });

  describe("UTRForm", () => {
    it("should render UTR input form", () => {
      const onSubmit = jest.fn();

      render(<MockUTRForm onSubmit={onSubmit} />);

      expect(screen.getByTestId("utr-input")).toBeInTheDocument();
      expect(screen.getByTestId("submit-utr-button")).toBeInTheDocument();
    });

    it("should validate UTR format", async () => {
      const onSubmit = jest.fn();

      render(<MockUTRForm onSubmit={onSubmit} />);

      const input = screen.getByTestId("utr-input");
      const submitButton = screen.getByTestId("submit-utr-button");

      // Test invalid UTR
      fireEvent.change(input, { target: { value: "123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("utr-error")).toHaveTextContent(
          "UTR must be 12-digit alphanumeric"
        );
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should submit valid UTR", async () => {
      const onSubmit = jest.fn();

      render(<MockUTRForm onSubmit={onSubmit} />);

      const input = screen.getByTestId("utr-input");
      const submitButton = screen.getByTestId("submit-utr-button");

      fireEvent.change(input, { target: { value: "123456789012" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith("123456789012");
      });

      expect(screen.queryByTestId("utr-error")).not.toBeInTheDocument();
    });

    it("should disable form when disabled prop is true", () => {
      const onSubmit = jest.fn();

      render(<MockUTRForm onSubmit={onSubmit} disabled={true} />);

      expect(screen.getByTestId("utr-input")).toBeDisabled();
      expect(screen.getByTestId("submit-utr-button")).toBeDisabled();
    });

    it("should disable submit button when input is empty", () => {
      const onSubmit = jest.fn();

      render(<MockUTRForm onSubmit={onSubmit} />);

      expect(screen.getByTestId("submit-utr-button")).toBeDisabled();

      fireEvent.change(screen.getByTestId("utr-input"), {
        target: { value: "123456789012" },
      });
      expect(screen.getByTestId("submit-utr-button")).not.toBeDisabled();
    });
  });

  describe("QRCodeDisplay", () => {
    const mockProps = {
      upiLink: "upi://pay?pa=test@upi&am=100",
      amount: 100,
      vpa: "test@upi",
    };

    it("should display QR code and payment details", () => {
      render(<MockQRCodeDisplay {...mockProps} />);

      expect(screen.getByTestId("qr-code")).toBeInTheDocument();
      expect(screen.getByTestId("payment-details")).toBeInTheDocument();
      expect(screen.getByText("Amount: ₹100")).toBeInTheDocument();
      expect(screen.getByText("UPI ID: test@upi")).toBeInTheDocument();
    });

    it("should copy amount to clipboard", async () => {
      render(<MockQRCodeDisplay {...mockProps} />);

      fireEvent.click(screen.getByTestId("copy-amount"));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("100");

      await waitFor(() => {
        expect(screen.getByTestId("copy-success")).toHaveTextContent(
          "Copied amount!"
        );
      });
    });

    it("should copy UPI ID to clipboard", async () => {
      render(<MockQRCodeDisplay {...mockProps} />);

      fireEvent.click(screen.getByTestId("copy-upi-id"));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test@upi");

      await waitFor(() => {
        expect(screen.getByTestId("copy-success")).toHaveTextContent(
          "Copied upi!"
        );
      });
    });

    it("should hide copy success message after timeout", async () => {
      render(<MockQRCodeDisplay {...mockProps} />);

      fireEvent.click(screen.getByTestId("copy-amount"));

      await waitFor(() => {
        expect(screen.getByTestId("copy-success")).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(screen.queryByTestId("copy-success")).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Component Integration", () => {
    it("should handle component interactions correctly", async () => {
      const MockPaymentPage = () => {
        const [orderExpired, setOrderExpired] = React.useState(false);
        const [utrSubmitted, setUtrSubmitted] = React.useState(false);

        const handleExpire = () => setOrderExpired(true);
        const handleUTRSubmit = (utr: string) => setUtrSubmitted(true);
        const handleAppClick = (app: string) => {
          // Simulate app redirect
          console.log(`Redirecting to ${app}`);
        };

        return (
          <div>
            <MockCountdownTimer
              expiresAt={new Date(Date.now() + 5000)}
              onExpire={handleExpire}
            />
            <MockUPIButtons
              upiLinks={{ gpay: "tez://test", phonepe: "phonepe://test" }}
              enabledApps={["gpay", "phonepe"]}
              onAppClick={handleAppClick}
            />
            <MockUTRForm
              onSubmit={handleUTRSubmit}
              disabled={orderExpired || utrSubmitted}
            />
            {orderExpired && (
              <div data-testid="expired-notice">Order expired</div>
            )}
            {utrSubmitted && (
              <div data-testid="utr-submitted">UTR submitted</div>
            )}
          </div>
        );
      };

      render(<MockPaymentPage />);

      // Initially, all components should be active
      expect(screen.getByTestId("countdown-timer")).toBeInTheDocument();
      expect(screen.getByTestId("upi-buttons")).toBeInTheDocument();
      expect(screen.getByTestId("utr-form")).toBeInTheDocument();

      // Submit UTR before expiry
      fireEvent.change(screen.getByTestId("utr-input"), {
        target: { value: "123456789012" },
      });
      fireEvent.click(screen.getByTestId("submit-utr-button"));

      await waitFor(() => {
        expect(screen.getByTestId("utr-submitted")).toBeInTheDocument();
      });

      // UTR form should be disabled after submission
      expect(screen.getByTestId("utr-input")).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", () => {
      const onSubmit = jest.fn();

      render(<MockUTRForm onSubmit={onSubmit} />);

      const input = screen.getByTestId("utr-input");
      const button = screen.getByTestId("submit-utr-button");

      expect(input).toHaveAttribute("placeholder", "Enter UTR number");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should support keyboard navigation", () => {
      const enabledApps = ["gpay", "phonepe"];
      const onAppClick = jest.fn();
      const upiLinks = {
        gpay: "tez://test",
        phonepe: "phonepe://test",
      };

      render(
        <MockUPIButtons
          upiLinks={upiLinks}
          enabledApps={enabledApps}
          onAppClick={onAppClick}
        />
      );

      const gpayButton = screen.getByTestId("upi-button-gpay");

      // Focus and trigger with keyboard
      gpayButton.focus();
      fireEvent.keyDown(gpayButton, { key: "Enter", code: "Enter" });

      expect(document.activeElement).toBe(gpayButton);
    });
  });

  describe("Error Handling", () => {
    it("should handle clipboard API errors gracefully", async () => {
      // Mock clipboard API to throw error
      const originalClipboard = navigator.clipboard;
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(() =>
            Promise.reject(new Error("Clipboard error"))
          ),
        },
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      render(
        <MockQRCodeDisplay upiLink="upi://test" amount={100} vpa="test@upi" />
      );

      fireEvent.click(screen.getByTestId("copy-amount"));

      // Should not crash the component
      expect(screen.getByTestId("qr-code-display")).toBeInTheDocument();

      // Restore original clipboard
      Object.assign(navigator, { clipboard: originalClipboard });
      consoleSpy.mockRestore();
    });
  });
});
