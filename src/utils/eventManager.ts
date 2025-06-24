// ✅ Actualizar eventManager para incluir eventos de servicios y productos
export enum AppEvents {
  STAFF_UPDATED = "staff_updated",
  APPOINTMENT_UPDATED = "appointment_updated",
  STAFF_DELETED = "staff_deleted",
  STAFF_ACTIVATED = "staff_activated",
  STAFF_DEACTIVATED = "staff_deactivated",
  APPOINTMENT_CREATED = "appointment_created",
  APPOINTMENT_DELETED = "appointment_deleted",
  CLIENT_CREATED = "client_created",
  CLIENT_UPDATED = "client_updated",
  CLIENT_DELETED = "client_deleted",
  // ✅ Eventos de servicios y productos
  SERVICE_CREATED = "service_created",
  SERVICE_UPDATED = "service_updated",
  SERVICE_DELETED = "service_deleted",
  PRODUCT_CREATED = "product_created",
  PRODUCT_UPDATED = "product_updated",
  PRODUCT_DELETED = "product_deleted",
  BULK_PRICE_UPDATE = "bulk_price_update",
}

type EventCallback = (data: any) => void

class EventManager {
  private listeners: Map<string, EventCallback[]> = new Map()

  subscribe(event: AppEvents | string, callback: EventCallback): void {
    const eventKey = typeof event === "string" ? event : event.toString()
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, [])
    }
    this.listeners.get(eventKey)!.push(callback)
    console.log(`✅ Subscribed to event: ${eventKey}`)
  }

  unsubscribe(event: AppEvents | string, callback: EventCallback): void {
    const eventKey = typeof event === "string" ? event : event.toString()
    const callbacks = this.listeners.get(eventKey)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
        console.log(`❌ Unsubscribed from event: ${eventKey}`)
      }
    }
  }

  emit(event: AppEvents | string, data: any): void {
    const eventKey = typeof event === "string" ? event : event.toString()
    const callbacks = this.listeners.get(eventKey)
    console.log(`📡 Emitting event: ${eventKey}, listeners: ${callbacks?.length || 0}`, data)

    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ Error in event callback for ${eventKey}:`, error)
        }
      })
    } else {
      console.warn(`⚠️ No listeners for event: ${eventKey}`)
    }
  }

  // Método para debugging
  getListenerCount(event: AppEvents | string): number {
    const eventKey = typeof event === "string" ? event : event.toString()
    return this.listeners.get(eventKey)?.length || 0
  }

  // Método para limpiar todos los listeners
  clearAllListeners(): void {
    this.listeners.clear()
  }

  // ✅ Método para listar todos los eventos activos
  getActiveEvents(): string[] {
    return Array.from(this.listeners.keys()).filter((event) => this.listeners.get(event)!.length > 0)
  }

  // ✅ Método para debugging - mostrar todos los listeners
  debugListeners(): void {
    console.log("🔍 Event Manager Debug:")
    console.log("Active events:", this.getActiveEvents())
    this.listeners.forEach((callbacks, event) => {
      console.log(`  ${event}: ${callbacks.length} listeners`)
    })
  }
}

// ✅ Crear instancia singleton
const eventManager = new EventManager()

// ✅ Exportar tanto la instancia como las funciones helper
export { eventManager }

export const subscribeToEvent = (event: AppEvents | string, callback: EventCallback) => {
  eventManager.subscribe(event, callback)
}

export const unsubscribeFromEvent = (event: AppEvents | string, callback: EventCallback) => {
  eventManager.unsubscribe(event, callback)
}

export const emitEvent = (event: AppEvents | string, data: any) => {
  eventManager.emit(event, data)
}

// ✅ Funciones adicionales para debugging
export const getEventListenerCount = (event: AppEvents | string): number => {
  return eventManager.getListenerCount(event)
}

export const clearAllEventListeners = (): void => {
  eventManager.clearAllListeners()
}

export const getActiveEvents = (): string[] => {
  return eventManager.getActiveEvents()
}

export const debugEventManager = (): void => {
  eventManager.debugListeners()
}
