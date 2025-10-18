"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useData } from "@/lib/data-context"
import { ServiceModal } from "@/components/modals/service-modal"
import type { Service } from "@/lib/types"

export default function ConfiguracoesPage() {
  const { services, deleteService } = useData()
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setServiceModalOpen(true)
  }

  const handleDelete = async (serviceId: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      await deleteService(serviceId)
    }
  }

  const handleNewService = () => {
    setSelectedService(null)
    setServiceModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-2">Gerencie os serviços oferecidos</p>
        </div>
        <Button onClick={handleNewService} className="sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Services List */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Serviços Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length > 0 ? (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{service.name}</p>
                    {service.description && <p className="text-sm text-muted-foreground mt-1">{service.description}</p>}
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Duração: {service.duration} min</span>
                      <span className="font-medium text-green-600">
                        R$ {service.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(service)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(service.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum serviço cadastrado</p>
              <Button onClick={handleNewService} variant="outline" className="mt-4 bg-transparent">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Serviço
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Modal */}
      <ServiceModal open={serviceModalOpen} onOpenChange={setServiceModalOpen} service={selectedService} />
    </div>
  )
}
