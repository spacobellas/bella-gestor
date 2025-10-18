"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/lib/data-context"
import type { Appointment, AppointmentStatus } from "@/lib/types"
import { Loader2, Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Appointment | null
  mode: "create" | "edit"
  defaultDate?: string
  defaultTime?: string
}

export function AppointmentModal({
  open,
  onOpenChange,
  appointment,
  mode,
  defaultDate,
  defaultTime,
}: AppointmentModalProps) {
  const { clients, services, createAppointment, updateAppointment, loading } = useData()
  const [clientSearchOpen, setClientSearchOpen] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [formData, setFormData] = useState<Partial<Appointment>>({
    clientId: "",
    clientName: "",
    date: defaultDate || new Date().toISOString().split("T")[0],
    startTime: defaultTime || "09:00",
    endTime: "",
    services: [],
    status: "scheduled",
    notes: "",
    professional: "",
  })

  useEffect(() => {
    if (appointment && mode === "edit") {
      setFormData(appointment)
      setSelectedServices(appointment.services || [])
    } else if (mode === "create") {
      setFormData({
        clientId: "",
        clientName: "",
        date: defaultDate || new Date().toISOString().split("T")[0],
        startTime: defaultTime || "09:00",
        endTime: "",
        services: [],
        status: "scheduled",
        notes: "",
        professional: "",
      })
      setSelectedServices([])
    }
  }, [appointment, mode, open, defaultDate, defaultTime])

  // Calculate total duration and price from selected services
  useEffect(() => {
    if (selectedServices.length > 0) {
      const totalDuration = selectedServices.reduce((sum, serviceId) => {
        const service = services.find((s) => s.id === serviceId)
        return sum + (service?.duration || 0)
      }, 0)

      const totalPrice = selectedServices.reduce((sum, serviceId) => {
        const service = services.find((s) => s.id === serviceId)
        return sum + (service?.price || 0)
      }, 0)

      // Calculate end time
      if (formData.startTime) {
        const [hours, minutes] = formData.startTime.split(":").map(Number)
        const startMinutes = hours * 60 + minutes
        const endMinutes = startMinutes + totalDuration
        const endHours = Math.floor(endMinutes / 60)
        const endMins = endMinutes % 60
        const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`

        setFormData((prev) => ({
          ...prev,
          endTime,
          duration: totalDuration,
          price: totalPrice,
          services: selectedServices,
        }))
      }
    }
  }, [selectedServices, formData.startTime, services])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === "create") {
      await createAppointment(formData as Omit<Appointment, "id">)
    } else if (mode === "edit" && appointment) {
      await updateAppointment(appointment.id, formData)
    }

    onOpenChange(false)
  }

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (client) {
      setFormData({ ...formData, clientId: client.id, clientName: client.name })
    }
    setClientSearchOpen(false)
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const selectedClient = clients.find((c) => c.id === formData.clientId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Novo Agendamento" : "Editar Agendamento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Client Selection with Autocomplete */}
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientSearchOpen}
                    className="w-full justify-between bg-transparent"
                  >
                    {selectedClient ? selectedClient.name : "Selecione um cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={client.name}
                            onSelect={() => handleClientSelect(client.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.clientId === client.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{client.name}</span>
                              <span className="text-xs text-muted-foreground">{client.phone}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Date and Time */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Horário Início *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Horário Fim</Label>
                <Input id="endTime" type="time" value={formData.endTime} disabled />
              </div>
            </div>

            {/* Services Multi-select */}
            <div className="space-y-2">
              <Label>Serviços *</Label>
              <div className="border border-input rounded-md p-3 space-y-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`service-${service.id}`}
                        checked={selectedServices.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`service-${service.id}`} className="text-sm cursor-pointer">
                        {service.name}
                      </label>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{service.duration} min</span>
                      <span className="font-medium text-foreground">
                        R$ {service.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {selectedServices.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedServices.map((serviceId) => {
                    const service = services.find((s) => s.id === serviceId)
                    return (
                      <Badge key={serviceId} variant="secondary">
                        {service?.name}
                        <button
                          type="button"
                          onClick={() => toggleService(serviceId)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            {selectedServices.length > 0 && (
              <div className="bg-muted p-3 rounded-md space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duração Total:</span>
                  <span className="font-medium">{formData.duration} minutos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="font-medium text-green-600">
                    R$ {(formData.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Professional and Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="professional">Profissional</Label>
                <Input
                  id="professional"
                  value={formData.professional || ""}
                  onChange={(e) => setFormData({ ...formData, professional: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: AppointmentStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.clientId || selectedServices.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Criar Agendamento" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
