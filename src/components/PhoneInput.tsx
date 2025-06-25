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
  useTheme()

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

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Phone className={`h-5 w-5 transition-colors ${
            inputState === 'success' ? 'text-green-500' : 
            inputState === 'error' ? 'text-red-500' : 
            'text-gray-400'
          }`} />
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
            focus:outline-none focus:ring-0 bg-white
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${inputState === 'success' ? 'border-green-500 text-gray-900' : ''}
            ${inputState === 'error' ? 'border-red-500 text-gray-900' : ''}
            ${inputState === 'default' ? 'border-gray-300 text-gray-900 focus:border-blue-500' : ''}
          `}
          autoComplete="tel"
          inputMode="numeric"
        />

        {/* Status Icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {hasBeenTouched && (
            <>
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Format Hint */}
      {showFormatHint && !hasBeenTouched && (
        <div className="flex items-center text-sm space-x-2 px-3 py-2 rounded-lg bg-blue-50 text-gray-600">
          <Info className="h-4 w-4 text-blue-500" />
          <span>Formatos aceptados: (123) 456-7890, 123-456-7890, +52 123 456 7890</span>
        </div>
      )}

      {/* Validation Message */}
      {hasBeenTouched && !validation.isValid && validation.error && (
        <div className="flex items-center text-sm space-x-2 px-3 py-2 rounded-lg bg-red-50 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{validation.error}</span>
        </div>
      )}

      {/* Success Message */}
      {hasBeenTouched && validation.isValid && value && (
        <div className="flex items-center text-sm space-x-2 px-3 py-2 rounded-lg bg-green-50 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Número válido {validation.formatted && `(${validation.formatted})`}</span>
        </div>
      )}

      {/* Character Count */}
      {(isFocused || hasBeenTouched) && (
        <div className="text-xs text-right text-gray-500">
          {value.replace(/\D/g, "").length} / 10+ dígitos
        </div>
      )}
    </div>
  )
}

export default PhoneInput
