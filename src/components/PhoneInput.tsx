"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Phone, AlertCircle, CheckCircle, Info } from "lucide-react"
import { validatePhoneNumber, formatPhoneInput, type PhoneValidationResult } from "../utils/phoneValidation"
import { useTheme } from "../hooks/useTheme"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onValidation?: (isValid: boolean, error?: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  showFormatHint?: boolean
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onValidation,
  placeholder = "Número de teléfono",
  required = false,
  disabled = false,
  className = "",
  showFormatHint = true,
}) => {
  const [validation, setValidation] = useState<PhoneValidationResult>({ isValid: true })
  const [isFocused, setIsFocused] = useState(false)
  const [hasBeenTouched, setHasBeenTouched] = useState(false)
  const { colors } = useTheme()

  // Validate phone number whenever value changes
  useEffect(() => {
    if (value || hasBeenTouched) {
      const result = validatePhoneNumber(value)
      setValidation(result)
      onValidation?.(result.isValid, result.error)
    }
  }, [value, hasBeenTouched, onValidation])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow only digits, spaces, parentheses, hyphens, and plus sign
    const sanitized = inputValue.replace(/[^\d\s\-$$$$+]/g, "")

    // Format the input as user types (for better UX)
    const formatted = formatPhoneInput(sanitized)

    onChange(formatted)
    setHasBeenTouched(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    setHasBeenTouched(true)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  // Determine input state for styling
  const getInputState = () => {
    if (!hasBeenTouched && !value) return "default"
    if (validation.isValid) return "success"
    if (!validation.isValid) return "error"
    return "default"
  }

  const inputState = getInputState()

  // Safe color access with fallbacks
  const safeColors = {
    background: colors?.background || "#f8fafc",
    surface: colors?.surface || "#ffffff",
    border: colors?.border || "#e5e7eb",
    text: colors?.text || "#1f2937",
    textSecondary: colors?.textSecondary || "#6b7280",
    primary: colors?.primary || "#0ea5e9",
    success: colors?.success || "#10b981",
    error: colors?.error || "#ef4444",
    warning: colors?.warning || "#f59e0b",
  }

  const getBorderColor = () => {
    switch (inputState) {
      case "success":
        return safeColors.success
      case "error":
        return safeColors.error
      case "default":
        return isFocused ? safeColors.primary : safeColors.border
      default:
        return safeColors.border
    }
  }

  const getIconColor = () => {
    switch (inputState) {
      case "success":
        return safeColors.success
      case "error":
        return safeColors.error
      default:
        return safeColors.textSecondary
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Phone className="h-5 w-5 transition-colors" style={{ color: getIconColor() }} />
        </div>

        <input
          type="tel"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-3 rounded-xl border-2 transition-all duration-200
            focus:outline-none focus:ring-0
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          style={{
            backgroundColor: safeColors.surface,
            borderColor: getBorderColor(),
            color: safeColors.text,
          }}
          autoComplete="tel"
          inputMode="numeric"
        />

        {/* Status Icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {hasBeenTouched && (
            <>
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5" style={{ color: safeColors.success }} />
              ) : (
                <AlertCircle className="h-5 w-5" style={{ color: safeColors.error }} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Format Hint */}
      {showFormatHint && !hasBeenTouched && (
        <div
          className="flex items-center text-sm space-x-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: `${safeColors.primary}0d`,
            color: safeColors.textSecondary,
          }}
        >
          <Info className="h-4 w-4" style={{ color: safeColors.primary }} />
          <span>Formatos aceptados: (123) 456-7890, 123-456-7890, +52 123 456 7890</span>
        </div>
      )}

      {/* Validation Message */}
      {hasBeenTouched && !validation.isValid && validation.error && (
        <div
          className="flex items-center text-sm space-x-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: `${safeColors.error}0d`,
            color: safeColors.error,
          }}
        >
          <AlertCircle className="h-4 w-4" />
          <span>{validation.error}</span>
        </div>
      )}

      {/* Success Message */}
      {hasBeenTouched && validation.isValid && value && (
        <div
          className="flex items-center text-sm space-x-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: `${safeColors.success}0d`,
            color: safeColors.success,
          }}
        >
          <CheckCircle className="h-4 w-4" />
          <span>Número válido {validation.formatted && `(${validation.formatted})`}</span>
        </div>
      )}

      {/* Character Count */}
      {(isFocused || hasBeenTouched) && (
        <div className="text-xs text-right" style={{ color: safeColors.textSecondary }}>
          {value.replace(/\D/g, "").length} / 10+ dígitos
        </div>
      )}
    </div>
  )
}

export default PhoneInput
