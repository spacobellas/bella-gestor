"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Client, Appointment, Service, Sale } from "./types"
import { mockClients, mockAppointments, mockServices } from "./mock-data"
import * as api from "@/services/api"

interface DataContextType {
  // Data
  clients: Client[]
  appointments: Appointment[]
  services: Service[]
  sales: Sale[]

  // Loading states
  isLoading: boolean
  error: string | null

  // Client operations
  addClient: (client: Omit<Client, "id">) => Promise<Client | null>
  updateClient: (id: string, client: Partial<Client>) => Promise<Client | null>
  deleteClient: (id: string) => Promise<boolean>
  searchClients: (query: string) => Promise<Client[]>

  // Appointment operations
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<Appointment | null>
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<Appointment | null>
  deleteAppointment: (id: string) => Promise<boolean>

  // Service operations
  addService: (service: Omit<Service, "id">) => Promise<Service | null>
  updateService: (id: string, service: Partial<Service>) => Promise<Service | null>
  deleteService: (id: string) => Promise<boolean>

  // Sale operations
  createSale: (sale: Omit<Sale, "id" | "createdAt">) => Promise<Sale | null>
  updateSaleStatus: (id: string, status: Sale["status"], paidAt?: string) => Promise<Sale | null>
  getSaleByAppointmentId: (appointmentId: string) => Sale | undefined

  // Refresh data
  refreshData: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize API stores and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true)
        api.initializeStores(mockClients, mockAppointments, mockServices)
        await refreshData()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  const refreshData = async () => {
    try {
      const [clientsData, appointmentsData, servicesData, salesData] = await Promise.all([
        api.getClients(),
        api.getAppointments(),
        api.getServices(),
        api.getSales(),
      ])

      setClients(clientsData)
      setAppointments(appointmentsData)
      setServices(servicesData)
      setSales(salesData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh data")
      throw err
    }
  }

  // Client operations
  const addClient = async (client: Omit<Client, "id">) => {
    try {
      const newClient = await api.createClient(client)
      await refreshData()
      return newClient
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add client")
      return null
    }
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const updated = await api.updateClient(id, updates)
      await refreshData()
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update client")
      return null
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const success = await api.deleteClient(id)
      if (success) await refreshData()
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete client")
      return false
    }
  }

  const searchClients = async (query: string) => {
    try {
      return await api.searchClients(query)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search clients")
      return []
    }
  }

  // Appointment operations
  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    try {
      const newAppointment = await api.createAppointment(appointment)
      await refreshData()
      return newAppointment
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add appointment")
      return null
    }
  }

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const updated = await api.updateAppointment(id, updates)
      await refreshData()
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update appointment")
      return null
    }
  }

  const deleteAppointment = async (id: string) => {
    try {
      const success = await api.deleteAppointment(id)
      if (success) await refreshData()
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete appointment")
      return false
    }
  }

  // Service operations
  const addService = async (service: Omit<Service, "id">) => {
    try {
      const newService = await api.createService(service)
      await refreshData()
      return newService
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add service")
      return null
    }
  }

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      const updated = await api.updateService(id, updates)
      await refreshData()
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service")
      return null
    }
  }

  const deleteService = async (id: string) => {
    try {
      const success = await api.deleteService(id)
      if (success) await refreshData()
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service")
      return false
    }
  }

  // Sale operations
  const createSale = async (sale: Omit<Sale, "id" | "createdAt">) => {
    try {
      const newSale = await api.createSale(sale)
      await refreshData()
      return newSale
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sale")
      return null
    }
  }

  const updateSaleStatus = async (id: string, status: Sale["status"], paidAt?: string) => {
    try {
      const updated = await api.updateSaleStatus(id, status, paidAt)
      await refreshData()
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update sale status")
      return null
    }
  }

  const getSaleByAppointmentId = (appointmentId: string) => {
    return sales.find((s) => s.appointmentId === appointmentId)
  }

  return (
    <DataContext.Provider
      value={{
        clients,
        appointments,
        services,
        sales,
        isLoading,
        error,
        addClient,
        updateClient,
        deleteClient,
        searchClients,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        addService,
        updateService,
        deleteService,
        createSale,
        updateSaleStatus,
        getSaleByAppointmentId,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
