"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useData } from "@/lib/data-context"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarIcon,
  Clock,
  MoreVertical,
  CreditCard,
  Edit,
  Trash2,
} from "lucide-react"
import { AppointmentModal } from "@/components/modals/appointment-modal"
import { CheckoutModal } from "@/components/modals/checkout-modal"
import type { Appointment } from "@/lib/types"

type ViewMode = "day" | "week" | "month"

export default function AgendaPage() {
  const { appointments, clients, deleteAppointment, updateAppointment } = useData()
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1)
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1)
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get week dates
  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return appointments.filter((apt) => apt.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  // Format date header
  const formatDateHeader = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } else if (viewMode === "week") {
      const weekDates = getWeekDates(currentDate)
      const start = weekDates[0].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
      const end = weekDates[6].toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
      return `${start} - ${end}`
    } else {
      return currentDate.toLocaleDateString("pt-BR", { year: "numeric", month: "long" })
    }
  }

  const handleDragStart = (appointment: Appointment) => {
    setDraggedAppointment(appointment)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetDate: Date) => {
    if (draggedAppointment) {
      const newDateStr = targetDate.toISOString().split("T")[0]
      await updateAppointment(draggedAppointment.id, {
        ...draggedAppointment,
        date: newDateStr,
      })
      setDraggedAppointment(null)
    }
  }

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setAppointmentModalOpen(true)
  }

  const handleDelete = async (appointmentId: string) => {
    if (confirm("Tem certeza que deseja excluir este agendamento?")) {
      await deleteAppointment(appointmentId)
    }
  }

  const handleCheckout = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setCheckoutModalOpen(true)
  }

  const handleCheckoutSuccess = async () => {
    if (selectedAppointment) {
      await updateAppointment(selectedAppointment.id, {
        ...selectedAppointment,
        status: "completed",
      })
    }
  }

  const hasPayment = (appointment: Appointment) => {
    return appointment.status === "completed"
  }

  const weekDates = viewMode === "week" ? getWeekDates(currentDate) : []
  const todayAppointments = viewMode === "day" ? getAppointmentsForDate(currentDate) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus agendamentos</p>
        </div>
        <Button
          className="sm:w-auto"
          onClick={() => {
            setSelectedAppointment(null)
            setAppointmentModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Controls */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-4 text-lg font-semibold text-foreground capitalize">{formatDateHeader()}</span>
            </div>
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Day View */}
      {viewMode === "day" && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Agendamentos do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    draggable
                    onDragStart={() => handleDragStart(appointment)}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-move"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary/10 rounded-lg">
                        <Clock className="h-5 w-5 text-primary mb-1" />
                        <span className="text-xs font-medium text-primary">{appointment.startTime}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{appointment.clientName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.service}</p>
                        {appointment.professional && (
                          <p className="text-xs text-muted-foreground mt-1">{appointment.professional}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasPayment(appointment) && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Pago
                        </Badge>
                      )}
                      <Badge
                        variant={
                          appointment.status === "confirmed"
                            ? "default"
                            : appointment.status === "completed"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {appointment.status === "scheduled"
                          ? "Agendado"
                          : appointment.status === "confirmed"
                            ? "Confirmado"
                            : appointment.status === "completed"
                              ? "Concluído"
                              : "Cancelado"}
                      </Badge>
                      <span className="font-medium text-green-600">
                        R$ {appointment.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(appointment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {!hasPayment(appointment) && (
                            <DropdownMenuItem onClick={() => handleCheckout(appointment)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Checkout
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(appointment.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const dayAppointments = getAppointmentsForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()

            return (
              <Card
                key={index}
                className={`border-border shadow-sm ${isToday ? "ring-2 ring-primary" : ""}`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(date)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-center">
                    <div className="text-xs text-muted-foreground uppercase">
                      {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                    </div>
                    <div className={`text-2xl font-bold mt-1 ${isToday ? "text-primary" : "text-foreground"}`}>
                      {date.getDate()}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayAppointments.length > 0 ? (
                    dayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        draggable
                        onDragStart={() => handleDragStart(appointment)}
                        className="p-2 bg-primary/10 border border-primary/20 rounded text-xs cursor-move hover:bg-primary/20 transition-colors relative group"
                      >
                        <p className="font-medium text-foreground truncate">{appointment.startTime}</p>
                        <p className="text-muted-foreground truncate">{appointment.clientName}</p>
                        <p className="text-muted-foreground truncate">{appointment.service}</p>
                        {hasPayment(appointment) && (
                          <div className="absolute top-1 right-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          </div>
                        )}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(appointment)}>
                                <Edit className="mr-2 h-3 w-3" />
                                Editar
                              </DropdownMenuItem>
                              {!hasPayment(appointment) && (
                                <DropdownMenuItem onClick={() => handleCheckout(appointment)}>
                                  <CreditCard className="mr-2 h-3 w-3" />
                                  Checkout
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDelete(appointment.id)} className="text-red-600">
                                <Trash2 className="mr-2 h-3 w-3" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Sem agendamentos</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Month View */}
      {viewMode === "month" && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Todos os Agendamentos do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments
                .filter((apt) => {
                  const aptDate = new Date(apt.date)
                  return (
                    aptDate.getMonth() === currentDate.getMonth() && aptDate.getFullYear() === currentDate.getFullYear()
                  )
                })
                .sort((a, b) => {
                  const dateCompare = a.date.localeCompare(b.date)
                  if (dateCompare !== 0) return dateCompare
                  return a.startTime.localeCompare(b.startTime)
                })
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary/10 rounded-lg">
                        <span className="text-xs font-medium text-primary">
                          {new Date(appointment.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </span>
                        <span className="text-xs font-medium text-primary mt-1">{appointment.startTime}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{appointment.clientName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.service}</p>
                        {appointment.professional && (
                          <p className="text-xs text-muted-foreground mt-1">{appointment.professional}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasPayment(appointment) && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Pago
                        </Badge>
                      )}
                      <Badge
                        variant={
                          appointment.status === "confirmed"
                            ? "default"
                            : appointment.status === "completed"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {appointment.status === "scheduled"
                          ? "Agendado"
                          : appointment.status === "confirmed"
                            ? "Confirmado"
                            : appointment.status === "completed"
                              ? "Concluído"
                              : "Cancelado"}
                      </Badge>
                      <span className="font-medium text-green-600">
                        R$ {appointment.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(appointment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {!hasPayment(appointment) && (
                            <DropdownMenuItem onClick={() => handleCheckout(appointment)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Checkout
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(appointment.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AppointmentModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
        appointment={selectedAppointment}
      />

      {selectedAppointment && (
        <CheckoutModal
          open={checkoutModalOpen}
          onOpenChange={setCheckoutModalOpen}
          appointment={selectedAppointment}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  )
}
