// Phone number validation utilities
export interface PhoneValidationResult {
  isValid: boolean
  error?: string
  formatted?: string
}

// Patrones para validar números de teléfono
export const PHONE_PATTERNS = {
  // EE.UU./Canadá: (123) 456-7890, 123-456-7890, 1234567890, +1 123-456-7890
  US: /^(\+?1[-.\s]?)?(\(?[0-9]{3}\)?)[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,

  // México: +52 123 456 7890, 123 456 7890
  MX: /^(\+?52[-.\s]?)?([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,

  // Internacional: +XX XXXXXXXXXX
  INTERNATIONAL: /^\+?[1-9]\d{1,14}$/
}

// Formatear número como (123) 456-7890 o +1 (123) 456-7890
export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, "")

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  return phone
}

// Validar número de teléfono completo
export const validatePhoneNumber = (phone: string): PhoneValidationResult => {
  if (!phone || phone.trim() === "") {
    return {
      isValid: false,
      error: "El número de teléfono es requerido",
    }
  }

  const digitsOnly = phone.replace(/\D/g, "")

  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      error: `El número debe tener al menos 10 dígitos. Actual: ${digitsOnly.length} dígitos`,
    }
  }

  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      error: "El número de teléfono es demasiado largo (máximo 15 dígitos)",
    }
  }

  const trimmedPhone = phone.trim()

  if (PHONE_PATTERNS.US.test(trimmedPhone)) {
    return {
      isValid: true,
      formatted: formatPhoneNumber(digitsOnly),
    }
  }

  if (PHONE_PATTERNS.MX.test(trimmedPhone)) {
    return {
      isValid: true,
      formatted: formatPhoneNumber(digitsOnly),
    }
  }

  if (PHONE_PATTERNS.INTERNATIONAL.test(trimmedPhone)) {
    return {
      isValid: true,
      formatted: trimmedPhone,
    }
  }

  // Si tiene suficientes dígitos, se acepta aunque no coincida con el patrón
  if (digitsOnly.length >= 10) {
    return {
      isValid: true,
      formatted: formatPhoneNumber(digitsOnly),
    }
  }

  return {
    isValid: false,
    error: "Formato de teléfono inválido. Ejemplos válidos: (123) 456-7890, 123-456-7890, 1234567890",
  }
}

// Limpiar número para guardar/enviar (deja solo dígitos, permite + al inicio)
export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/(?!^\+)\D/g, "")
}

// Formateo en tiempo real mientras el usuario escribe
export const formatPhoneInput = (value: string): string => {
  const digits = value.replace(/\D/g, "")
  const limitedDigits = digits.slice(0, 10)

  if (limitedDigits.length >= 6) {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`
  } else if (limitedDigits.length >= 3) {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`
  } else {
    return limitedDigits
  }
}

// Validación del lado del servidor (para formularios)
export const validatePhoneServerSide = (
  phone: string
): { isValid: boolean; error?: string; sanitized?: string } => {
  console.log("🔍 Validación servidor:", phone)

  const validation = validatePhoneNumber(phone)

  if (!validation.isValid) {
    console.error("❌ Falló validación:", validation.error)
    return {
      isValid: false,
      error: validation.error,
    }
  }

  const sanitized = sanitizePhoneNumber(phone)

  console.log("✅ Validación correcta:", {
    original: phone,
    sanitized,
    formatted: validation.formatted,
  })

  return {
    isValid: true,
    sanitized: sanitized,
  }
}
