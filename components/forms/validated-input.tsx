"use client";

import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  validationRules?: ValidationRule[];
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  showValidIcon?: boolean;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export function ValidatedInput({
  label,
  validationRules = [],
  validateOnBlur = true,
  validateOnChange = false,
  showValidIcon = true,
  onValidationChange,
  className,
  ...props
}: ValidatedInputProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [touched, setTouched] = useState(false);

  const validate = useCallback(
    (value: string) => {
      const newErrors: string[] = [];

      for (const rule of validationRules) {
        if (!rule.validate(value)) {
          newErrors.push(rule.message);
        }
      }

      const valid = newErrors.length === 0;
      setErrors(newErrors);
      setIsValid(valid);

      if (onValidationChange) {
        onValidationChange(valid, newErrors);
      }

      return valid;
    },
    [validationRules, onValidationChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (validateOnChange && touched) {
      validate(value);
    }

    if (props.onChange) {
      props.onChange(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);

    if (validateOnBlur) {
      validate(e.target.value);
    }

    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const showErrors = touched && errors.length > 0;
  const showSuccess = touched && isValid === true && showValidIcon;

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className="text-sm font-medium">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          {...props}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            className,
            showErrors &&
              "border-red-500 focus:border-red-500 focus:ring-red-500",
            showSuccess &&
              "border-green-500 focus:border-green-500 focus:ring-green-500"
          )}
        />

        {showSuccess && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
        )}

        {showErrors && (
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
        )}
      </div>

      {showErrors && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p
              key={index}
              className="text-sm text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Pre-configured validation rules
 */
export const ValidationRules = {
  required: (message = "This field is required"): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message,
  }),

  email: (message = "Please enter a valid email address"): ValidationRule => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  upiId: (
    message = "Please enter a valid UPI ID (e.g., user@paytm)"
  ): ValidationRule => ({
    validate: (value) => /^[\w.-]+@[\w.-]+$/.test(value),
    message,
  }),

  amount: (min = 1, max = 100000, message?: string): ValidationRule => ({
    validate: (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num >= min && num <= max;
    },
    message:
      message || `Amount must be between ₹${min} and ₹${max.toLocaleString()}`,
  }),

  utr: (message = "UTR must be 12-digit alphanumeric"): ValidationRule => ({
    validate: (value) => /^[A-Za-z0-9]{12}$/.test(value),
    message,
  }),

  merchantName: (
    message = "Merchant name can only contain letters, numbers, spaces, dots, and hyphens"
  ): ValidationRule => ({
    validate: (value) =>
      /^[a-zA-Z0-9\s.-]+$/.test(value) && value.length <= 100,
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),

  numeric: (message = "Please enter a valid number"): ValidationRule => ({
    validate: (value) =>
      !isNaN(parseFloat(value)) && isFinite(parseFloat(value)),
    message,
  }),

  alphanumeric: (
    message = "Only letters and numbers are allowed"
  ): ValidationRule => ({
    validate: (value) => /^[a-zA-Z0-9]+$/.test(value),
    message,
  }),

  noSpaces: (message = "Spaces are not allowed"): ValidationRule => ({
    validate: (value) => !/\s/.test(value),
    message,
  }),
};

/**
 * Form validation hook
 */
export function useFormValidation() {
  const [fieldValidations, setFieldValidations] = useState<
    Record<string, { isValid: boolean; errors: string[] }>
  >({});

  const updateFieldValidation = useCallback(
    (fieldName: string, isValid: boolean, errors: string[]) => {
      setFieldValidations((prev) => ({
        ...prev,
        [fieldName]: { isValid, errors },
      }));
    },
    []
  );

  const isFormValid = Object.values(fieldValidations).every(
    (field) => field.isValid
  );
  const formErrors = Object.entries(fieldValidations)
    .filter(([_, field]) => !field.isValid)
    .reduce(
      (acc, [fieldName, field]) => {
        acc[fieldName] = field.errors;
        return acc;
      },
      {} as Record<string, string[]>
    );

  const getAllErrors = () => {
    return Object.values(fieldValidations)
      .flatMap((field) => field.errors)
      .filter(Boolean);
  };

  return {
    fieldValidations,
    updateFieldValidation,
    isFormValid,
    formErrors,
    getAllErrors,
  };
}
