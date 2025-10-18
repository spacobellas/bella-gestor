export enum AppRole {
  ADMIN = "admin",
  PROFESSIONAL = "professional",
  RECEPTIONIST = "receptionist",
}

export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum SaleStatus {
  PENDING = "pending",
  PAID = "paid",
  CANCELLED = "cancelled",
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  cpf?: string
  birthDate?: string
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  registrationDate: string
  lastVisit?: string
  totalSpent: number
  status: "active" | "inactive"
  notes?: string
  anamnesis?: {
    allergies?: string
    medications?: string
    skinType?: string
    concerns?: string
    previousTreatments?: string
  }
}

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  serviceIds: string[] // Changed to array for multi-select
  date: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  professional?: string
  totalPrice: number // Renamed from price to totalPrice
  notes?: string
  saleId?: string // Added link to sale
}

export interface Service {
  id: string
  name: string
  duration: number // in minutes
  price: number
  category: string
  description?: string
  active: boolean // Added active status
}

export interface Sale {
  id: string
  appointmentId: string
  clientId: string
  clientName: string
  amount: number
  discount: number
  finalAmount: number
  status: SaleStatus
  paymentMethod?: string
  infinitePayLink?: string
  qrCodeData?: string
  createdAt: string
  paidAt?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: AppRole
}
