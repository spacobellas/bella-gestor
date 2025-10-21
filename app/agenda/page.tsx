'use client'

import { useState, useEffect } from 'react'
import { getActiveClients } from '@/services/api'
import { getActiveServices } from '@/services/api'
import { listCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/services/googleCalendarAppsScript'
import { Client, Service } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, User, Trash2, CalendarX, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type ViewMode = 'day' | 'week' | 'month'

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  htmlLink?: string
  attendees?: Array<{ email: string }>
}

interface AppointmentFormData {
  clientId: string
  serviceId: string
  startTime: string
  endTime: string
  notes: string
}

interface FormContentProps {
  formData: AppointmentFormData
  setFormData: React.Dispatch<React.SetStateAction<AppointmentFormData>>
  clients: Client[]
  services: Service[]
}

function FormContent({ formData, setFormData, clients, services }: FormContentProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client">Cliente *</Label>
        <Select
          value={formData.clientId}
          onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
        >
          <SelectTrigger id="client">
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} - {client.phone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service">Serviço *</Label>
        <Select
          value={formData.serviceId}
          onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}
        >
          <SelectTrigger id="service">
            <SelectValue placeholder="Selecione um serviço" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Início *</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">Término *</Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          placeholder="Observações..."
        />
      </div>
    </div>
  )
}

export default function AgendaPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<CalendarEvent[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarEvent | null>(null)
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [formData, setFormData] = useState<AppointmentFormData>({
    clientId: '',
    serviceId: '',
    startTime: '',
    endTime: '',
    notes: '',
  })

  useEffect(() => {
    loadClientsAndServices()
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadAppointments()
  }, [currentDate, viewMode])

  async function loadClientsAndServices() {
    try {
      const [clientsData, servicesData] = await Promise.all([
        getActiveClients(),
        getActiveServices()
      ])
      setClients(clientsData)
      setServices(servicesData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  function getDateRange(): { start: Date; end: Date } {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    switch (viewMode) {
      case 'day':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'week':
        const day = start.getDay()
        const diff = start.getDate() - day
        start.setDate(diff)
        start.setHours(0, 0, 0, 0)
        end.setDate(diff + 6)
        end.setHours(23, 59, 59, 999)
        break
      case 'month':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(end.getMonth() + 1)
        end.setDate(0)
        end.setHours(23, 59, 59, 999)
        break
    }

    return { start, end }
  }

  function getDisplayDates(): Date[] {
    const dates: Date[] = []
    const { start, end } = getDateRange()

    switch (viewMode) {
      case 'day':
        dates.push(new Date(currentDate))
        break
      case 'week':
        for (let i = 0; i < 7; i++) {
          const date = new Date(start)
          date.setDate(start.getDate() + i)
          dates.push(date)
        }
        break
      case 'month':
        const firstDay = start.getDay()
        const startDate = new Date(start)
        startDate.setDate(startDate.getDate() - firstDay)
        
        for (let i = 0; i < 35; i++) {
          const date = new Date(startDate)
          date.setDate(startDate.getDate() + i)
          dates.push(date)
        }
        break
    }

    return dates
  }

  function formatDateRange(): string {
    const { start, end } = getDateRange()

    switch (viewMode) {
      case 'day':
        return start.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })
      case 'week':
        return `${start.getDate()} - ${end.getDate()} de ${end.toLocaleDateString('pt-BR', { 
          month: 'long',
          year: 'numeric' 
        })}`
      case 'month':
        return start.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        })
    }
  }

  function getDayName(date: Date): string {
    return date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  async function loadAppointments() {
    setLoading(true)
    try {
      const { start, end } = getDateRange()
      const result = await listCalendarEvents(start.toISOString(), end.toISOString())
      
      if (result.success && result.events) {
        setAppointments(result.events)
      } else {
        console.error('Erro ao carregar eventos:', result.error)
        setAppointments([])
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  function handlePrevious() {
    const newDate = new Date(currentDate)
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1)
        break
      case 'week':
        newDate.setDate(newDate.getDate() - 7)
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1)
        break
    }
    setCurrentDate(newDate)
  }

  function handleNext() {
    const newDate = new Date(currentDate)
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1)
        break
      case 'week':
        newDate.setDate(newDate.getDate() + 7)
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1)
        break
    }
    setCurrentDate(newDate)
  }

  function handleToday() {
    setCurrentDate(new Date())
  }

  function openNewAppointmentModal() {
    setSelectedAppointment(null)
    setFormData({
      clientId: '',
      serviceId: '',
      startTime: '',
      endTime: '',
      notes: '',
    })
    setShowModal(true)
  }

  function openEditAppointmentModal(appointment: CalendarEvent) {
    setSelectedAppointment(appointment)
    
    const startTime = new Date(appointment.start.dateTime)
    const endTime = new Date(appointment.end.dateTime)
    
    const descriptionParts = appointment.description?.split('\n') || []
    const clientInfo = descriptionParts.find(p => p.startsWith('Cliente:'))?.replace('Cliente: ', '') || ''
    const serviceInfo = descriptionParts.find(p => p.startsWith('Serviço:'))?.replace('Serviço: ', '') || ''
    const notes = descriptionParts.find(p => p.startsWith('Observações:'))?.replace('Observações: ', '') || ''
    
    const client = clients.find(c => c.name === clientInfo)
    const service = services.find(s => s.name === serviceInfo)
    
    setFormData({
      clientId: client?.id || '',
      serviceId: service?.id || '',
      startTime: `${startTime.getFullYear()}-${String(startTime.getMonth() + 1).padStart(2, '0')}-${String(startTime.getDate()).padStart(2, '0')}T${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`,
      endTime: `${endTime.getFullYear()}-${String(endTime.getMonth() + 1).padStart(2, '0')}-${String(endTime.getDate()).padStart(2, '0')}T${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`,
      notes,
    })
    setShowModal(true)
  }

  async function handleSaveAppointment() {
    if (!formData.clientId || !formData.serviceId || !formData.startTime || !formData.endTime) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    
    try {
      const client = clients.find(c => c.id === formData.clientId)
      const service = services.find(s => s.id === formData.serviceId)
      
      if (!client || !service) {
        alert('Cliente ou serviço não encontrado')
        return
      }

      const startTime = new Date(formData.startTime).toISOString()
      const endTime = new Date(formData.endTime).toISOString()

      const eventData = {
        summary: `${client.name} - ${service.name}`,
        description: `Cliente: ${client.name}\nTelefone: ${client.phone}\nServiço: ${service.name}\nObservações: ${formData.notes}`,
        location: 'Spaço Bellas',
        startTime: startTime,
        endTime: endTime,
        attendees: client.email ? [{ email: client.email }] : []
      }

      if (selectedAppointment) {
        const result = await updateCalendarEvent(selectedAppointment.id, eventData)
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao atualizar evento')
        }
      } else {
        const result = await createCalendarEvent(eventData)
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar evento')
        }
      }

      setShowModal(false)
      await loadAppointments()
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
      alert('Erro ao salvar agendamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAppointment(appointment: CalendarEvent) {
    if (!confirm('Deseja realmente excluir este agendamento?')) return

    setLoading(true)
    
    try {
      const result = await deleteCalendarEvent(appointment.id)
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar evento')
      }

      setShowModal(false)
      await loadAppointments()
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error)
      alert('Erro ao excluir agendamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function getAppointmentsForDay(date: Date): CalendarEvent[] {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start.dateTime)
      return aptDate >= dayStart && aptDate <= dayEnd
    })
  }

  function getViewModeLabel(mode: ViewMode): string {
    const labels = {
      day: 'Dia',
      week: 'Semana',
      month: 'Mês',
    }
    return labels[mode]
  }

  function isToday(date: Date): boolean {
    const today = new Date()
    return formatDate(date) === formatDate(today)
  }

  function isCurrentMonth(date: Date): boolean {
    return date.getMonth() === currentDate.getMonth()
  }

  const displayDates = getDisplayDates()

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie seus agendamentos</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={loadAppointments} 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            className="gap-2 flex-1 sm:flex-initial"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button 
            onClick={openNewAppointmentModal} 
            size={isMobile ? "sm" : "default"}
            className="gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4" />
            <span className="sm:inline">Novo</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 px-4 md:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 md:gap-2">
                <Button 
                  onClick={handlePrevious} 
                  variant="outline" 
                  size={isMobile ? "sm" : "icon"}
                  disabled={loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button 
                  onClick={handleToday} 
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  disabled={loading}
                >
                  Hoje
                </Button>

                <Button 
                  onClick={handleNext} 
                  variant="outline" 
                  size={isMobile ? "sm" : "icon"}
                  disabled={loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size={isMobile ? "sm" : "default"}>
                    {getViewModeLabel(viewMode)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setViewMode('day')}>
                    Dia
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('week')}>
                    Semana
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('month')}>
                    Mês
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <CardTitle className="text-base md:text-lg text-center capitalize">
              {formatDateRange()}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {viewMode === 'month' ? (
            <>
              <div className="grid grid-cols-7 border-t">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                  <div
                    key={index}
                    className="p-1 md:p-2 text-center border-r last:border-r-0 bg-muted/50"
                  >
                    <div className="text-[10px] md:text-xs font-medium text-muted-foreground">{day}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {displayDates.map((date, index) => {
                  const dayAppointments = getAppointmentsForDay(date)
                  const isCurrentMonthDay = isCurrentMonth(date)
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[60px] md:min-h-[100px] p-1 md:p-2 border-r border-t last:border-r-0 ${
                        !isCurrentMonthDay ? 'bg-muted/30' : ''
                      }`}
                    >
                      <div className={`text-[10px] md:text-sm font-medium mb-1 ${
                        isToday(date) 
                          ? 'text-primary font-bold' 
                          : !isCurrentMonthDay
                          ? 'text-muted-foreground'
                          : ''
                      }`}>
                        {date.getDate()}
                      </div>
                      {dayAppointments.length > 0 ? (
                        <div className="space-y-0.5 md:space-y-1">
                          {dayAppointments.slice(0, 2).map((appointment) => (
                            <div
                              key={appointment.id}
                              className="text-[8px] md:text-xs p-0.5 md:p-1 bg-primary/10 rounded cursor-pointer hover:bg-primary/20"
                              onClick={() => openEditAppointmentModal(appointment)}
                            >
                              <div className="font-medium truncate">
                                {new Date(appointment.start.dateTime).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              <div className="truncate hidden md:block">{appointment.summary}</div>
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-[8px] md:text-xs text-muted-foreground">
                              +{dayAppointments.length - 2}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="overflow-x-auto">
              <div className={`grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} border-t min-w-[600px] md:min-w-0`}>
                {displayDates.map((date, index) => (
                  <div
                    key={index}
                    className="border-r last:border-r-0"
                  >
                    <div className="p-2 md:p-4 text-center border-b">
                      {viewMode === 'week' && (
                        <div className="text-[10px] md:text-xs font-medium text-muted-foreground mb-1">
                          {getDayName(date)}
                        </div>
                      )}
                      <div className={`text-lg md:text-2xl font-bold ${
                        isToday(date) ? 'text-primary' : ''
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>

                    <div className="p-2 md:p-3 bg-muted/30 min-h-[300px] md:min-h-[400px]">
                      {getAppointmentsForDay(date).length === 0 ? (
                        <Alert className="border-dashed">
                          <CalendarX className="h-3 w-3 md:h-4 md:w-4" />
                          <AlertTitle className="text-xs md:text-sm">Sem agendamentos</AlertTitle>
                          <AlertDescription className="text-[10px] md:text-xs">
                            Nenhum agendamento
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-2">
                          {getAppointmentsForDay(date).map((appointment) => (
                            <Card
                              key={appointment.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => openEditAppointmentModal(appointment)}
                            >
                              <CardContent className="p-2 md:p-3 space-y-1 md:space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {new Date(appointment.start.dateTime).toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                  <Calendar className="h-3 w-3 text-primary" />
                                </div>
                                
                                <div className="flex items-center gap-1 md:gap-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <p className="font-semibold text-xs md:text-sm truncate">
                                    {appointment.summary}
                                  </p>
                                </div>

                                {appointment.description && (
                                  <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                                    {appointment.description}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isMobile ? (
        <Sheet open={showModal} onOpenChange={setShowModal}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </SheetTitle>
              <SheetDescription>
                {selectedAppointment ? 'Atualize as informações' : 'Crie um novo agendamento'}
              </SheetDescription>
            </SheetHeader>

            <div className="py-4">
              <FormContent 
                formData={formData}
                setFormData={setFormData}
                clients={clients}
                services={services}
              />
            </div>

            <SheetFooter className="flex-col sm:flex-row gap-2">
              {selectedAppointment && (
                <Button
                  onClick={() => handleDeleteAppointment(selectedAppointment)}
                  disabled={loading}
                  variant="destructive"
                  className="w-full gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              )}

              <div className="flex gap-2 w-full">
                <Button 
                  onClick={() => setShowModal(false)} 
                  disabled={loading} 
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveAppointment} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </DialogTitle>
              <DialogDescription>
                {selectedAppointment ? 'Atualize as informações do agendamento' : 'Crie um novo agendamento no Google Calendar'}
              </DialogDescription>
            </DialogHeader>

            <FormContent 
              formData={formData}
              setFormData={setFormData}
              clients={clients}
              services={services}
            />

            <DialogFooter className="flex items-center justify-between gap-2 flex-col-reverse sm:flex-row">
              <div>
                {selectedAppointment && (
                  <Button
                    onClick={() => handleDeleteAppointment(selectedAppointment)}
                    disabled={loading}
                    variant="destructive"
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => setShowModal(false)} 
                  disabled={loading} 
                  variant="outline"
                  className="flex-1 sm:flex-initial"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveAppointment} 
                  disabled={loading}
                  className="flex-1 sm:flex-initial"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
