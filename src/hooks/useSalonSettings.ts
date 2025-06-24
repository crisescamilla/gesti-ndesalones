"use client"

import { useState, useEffect } from "react"
import type { SalonSettings } from "../types"
import { getSalonSettings, subscribeSalonSettingsChanges } from "../utils/salonSettings"

// Custom hook for real-time salon settings
export const useSalonSettings = () => {
  const [settings, setSettings] = useState<SalonSettings>(getSalonSettings())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Subscribe to settings changes
    const unsubscribe = subscribeSalonSettingsChanges((newSettings) => {
      setSettings(newSettings)
    })

    // Cleanup subscription on unmount
    return unsubscribe
  }, [])

  const refreshSettings = () => {
    setLoading(true)
    try {
      const currentSettings = getSalonSettings()
      setSettings(currentSettings)
    } finally {
      setLoading(false)
    }
  }

  return {
    settings,
    salonName: settings.salonName,
    salonMotto: settings.salonMotto,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    whatsapp: settings.whatsapp,
    instagram: settings.instagram,
    facebook: settings.facebook,
    website: settings.website,
    hours: settings.hours,
    loading,
    refreshSettings,
  }
}

// Hook specifically for salon name with real-time updates
export const useSalonName = (): string => {
  const [salonName, setSalonName] = useState<string>(getSalonSettings().salonName)

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setSalonName(settings.salonName)
    })

    return unsubscribe
  }, [])

  return salonName
}

// Hook specifically for salon motto with real-time updates
export const useSalonMotto = (): string => {
  const [salonMotto, setSalonMotto] = useState<string>(getSalonSettings().salonMotto)

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setSalonMotto(settings.salonMotto)
    })

    return unsubscribe
  }, [])

  return salonMotto
}

// Hook for salon address with real-time updates
export const useSalonAddress = (): string => {
  const [address, setAddress] = useState<string>(getSalonSettings().address || "")

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setAddress(settings.address || "")
    })

    return unsubscribe
  }, [])

  return address
}

// Hook for salon phone with real-time updates
export const useSalonPhone = (): string => {
  const [phone, setPhone] = useState<string>(getSalonSettings().phone || "")

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setPhone(settings.phone || "")
    })

    return unsubscribe
  }, [])

  return phone
}

// Hook for salon email with real-time updates
export const useSalonEmail = (): string => {
  const [email, setEmail] = useState<string>(getSalonSettings().email || "")

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setEmail(settings.email || "")
    })

    return unsubscribe
  }, [])

  return email
}

// Hook for salon WhatsApp with real-time updates
export const useSalonWhatsApp = (): string => {
  const [whatsapp, setWhatsApp] = useState<string>(getSalonSettings().whatsapp || "")

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setWhatsApp(settings.whatsapp || "")
    })

    return unsubscribe
  }, [])

  return whatsapp
}

// Hook for salon Instagram with real-time updates
export const useSalonInstagram = (): string => {
  const [instagram, setInstagram] = useState<string>(getSalonSettings().instagram || "")

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setInstagram(settings.instagram || "")
    })

    return unsubscribe
  }, [])

  return instagram
}

// Hook for salon Facebook with real-time updates
export const useSalonFacebook = (): string => {
  const [facebook, setFacebook] = useState<string>(getSalonSettings().facebook || "")

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setFacebook(settings.facebook || "")
    })

    return unsubscribe
  }, [])

  return facebook
}

// Hook for salon website with real-time updates
export const useSalonWebsite = (): string => {
  const [website, setWebsite] = useState<string>(getSalonSettings().website || "")

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setWebsite(settings.website || "")
    })

    return unsubscribe
  }, [])

  return website
}

// Hook for salon hours with real-time updates
export const useSalonHours = () => {
  const [hours, setHours] = useState(getSalonSettings().hours || {})

  useEffect(() => {
    const unsubscribe = subscribeSalonSettingsChanges((settings) => {
      setHours(settings.hours || {})
    })

    return unsubscribe
  }, [])

  return hours
}
