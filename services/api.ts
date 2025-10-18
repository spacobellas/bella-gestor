import type { Client, Appointment, Service, Sale } from "@/lib/types"
import { AppointmentStatus, SaleStatus } from "@/lib/types"

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// In-memory storage (simulating database)
let clientsStore: Client[] = []
let appointmentsStore: Appointment[] = []
let servicesStore: Service[] = []
let salesStore: Sale[] = []

// Initialize stores
export function initializeStores(clients: Client[], appointments: Appointment[], services: Service[]) {
  clientsStore = [...clients]
  appointmentsStore = [...appointments]
  servicesStore = [...services]
  salesStore = []
}

// Client API
export async function getClients(): Promise<Client[]> {
  await delay(300)
  return [...clientsStore]
}

export async function getClientById(id: string): Promise<Client | null> {
  await delay(200)
  return clientsStore.find((c) => c.id === id) || null
}

export async function createClient(client: Omit<Client, "id">): Promise<Client> {
  await delay(400)
  const newClient: Client = {
    ...client,
    id: Date.now().toString(),
  }
  clientsStore.push(newClient)
  return newClient
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  await delay(400)
  const index = clientsStore.findIndex((c) => c.id === id)
  if (index === -1) return null

  clientsStore[index] = { ...clientsStore[index], ...updates }
  return clientsStore[index]
}

export async function deleteClient(id: string): Promise<boolean> {
  await delay(300)
  const initialLength = clientsStore.length
  clientsStore = clientsStore.filter((c) => c.id !== id)
  return clientsStore.length < initialLength
}

export async function searchClients(query: string): Promise<Client[]> {
  await delay(200)
  const lowerQuery = query.toLowerCase()
  return clientsStore.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(query),
  )
}

// Appointment API
export async function getAppointments(): Promise<Appointment[]> {
  await delay(300)
  return [...appointmentsStore]
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  await delay(200)
  return appointmentsStore.find((a) => a.id === id) || null
}

export async function getAppointmentsByClient(clientId: string): Promise<Appointment[]> {
  await delay(200)
  return appointmentsStore.filter((a) => a.clientId === clientId)
}

export async function getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
  await delay(300)
  return appointmentsStore.filter((a) => a.date >= startDate && a.date <= endDate)
}

export async function createAppointment(appointment: Omit<Appointment, "id">): Promise<Appointment> {
  await delay(400)
  const newAppointment: Appointment = {
    ...appointment,
    id: Date.now().toString(),
  }
  appointmentsStore.push(newAppointment)
  return newAppointment
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
  await delay(400)
  const index = appointmentsStore.findIndex((a) => a.id === id)
  if (index === -1) return null

  appointmentsStore[index] = { ...appointmentsStore[index], ...updates }
  return appointmentsStore[index]
}

export async function deleteAppointment(id: string): Promise<boolean> {
  await delay(300)
  const initialLength = appointmentsStore.length
  appointmentsStore = appointmentsStore.filter((a) => a.id !== id)
  return appointmentsStore.length < initialLength
}

// Service API
export async function getServices(): Promise<Service[]> {
  await delay(300)
  return [...servicesStore]
}

export async function getActiveServices(): Promise<Service[]> {
  await delay(300)
  return servicesStore.filter((s) => s.active)
}

export async function getServiceById(id: string): Promise<Service | null> {
  await delay(200)
  return servicesStore.find((s) => s.id === id) || null
}

export async function createService(service: Omit<Service, "id">): Promise<Service> {
  await delay(400)
  const newService: Service = {
    ...service,
    id: Date.now().toString(),
  }
  servicesStore.push(newService)
  return newService
}

export async function updateService(id: string, updates: Partial<Service>): Promise<Service | null> {
  await delay(400)
  const index = servicesStore.findIndex((s) => s.id === id)
  if (index === -1) return null

  servicesStore[index] = { ...servicesStore[index], ...updates }
  return servicesStore[index]
}

export async function deleteService(id: string): Promise<boolean> {
  await delay(300)
  const initialLength = servicesStore.length
  servicesStore = servicesStore.filter((s) => s.id !== id)
  return servicesStore.length < initialLength
}

// Sale API
export async function getSales(): Promise<Sale[]> {
  await delay(300)
  return [...salesStore]
}

export async function getSaleById(id: string): Promise<Sale | null> {
  await delay(200)
  return salesStore.find((s) => s.id === id) || null
}

export async function getSaleByAppointmentId(appointmentId: string): Promise<Sale | null> {
  await delay(200)
  return salesStore.find((s) => s.appointmentId === appointmentId) || null
}

export async function createSale(sale: Omit<Sale, "id" | "createdAt">): Promise<Sale> {
  await delay(400)
  const newSale: Sale = {
    ...sale,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  salesStore.push(newSale)
  return newSale
}

export async function updateSaleStatus(id: string, status: SaleStatus, paidAt?: string): Promise<Sale | null> {
  await delay(400)
  const index = salesStore.findIndex((s) => s.id === id)
  if (index === -1) return null

  salesStore[index] = {
    ...salesStore[index],
    status,
    ...(paidAt && { paidAt }),
  }

  // Update appointment status if sale is paid
  if (status === SaleStatus.PAID && salesStore[index].appointmentId) {
    await updateAppointment(salesStore[index].appointmentId, { status: AppointmentStatus.COMPLETED })
  }

  return salesStore[index]
}

// InfinitePay Integration (Mock)
export async function generateInfinitePayLink(saleData: {
  amount: number
  clientName: string
  clientEmail?: string
  description: string
}): Promise<{ link: string; qrCode: string }> {
  await delay(500)

  // Simulate InfinitePay API response
  const mockLink = `https://pay.infinitepay.io/mock-${Date.now()}`
  const mockQrCode = `00020126580014br.gov.bcb.pix0136${Date.now()}520400005303986540${saleData.amount.toFixed(2)}5802BR5913${saleData.clientName}6009SAO PAULO62070503***6304`

  return {
    link: mockLink,
    qrCode: mockQrCode,
  }
}
