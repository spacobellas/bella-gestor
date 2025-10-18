"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useData } from "@/lib/data-context"
import type { Client } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface ClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  mode: "create" | "edit" | "view"
}

export function ClientModal({ open, onOpenChange, client, mode }: ClientModalProps) {
  const { createClient, updateClient, loading } = useData()
  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    birthDate: "",
    status: "active",
    notes: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
    anamnesis: {
      allergies: "",
      medications: "",
      skinType: "",
      concerns: "",
      previousTreatments: "",
    },
  })

  useEffect(() => {
    if (client && (mode === "edit" || mode === "view")) {
      setFormData(client)
    } else if (mode === "create") {
      setFormData({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        birthDate: "",
        status: "active",
        notes: "",
        address: {
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
          zipCode: "",
        },
        anamnesis: {
          allergies: "",
          medications: "",
          skinType: "",
          concerns: "",
          previousTreatments: "",
        },
      })
    }
  }, [client, mode, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === "create") {
      await createClient(formData as Omit<Client, "id" | "registrationDate" | "lastVisit" | "totalSpent">)
    } else if (mode === "edit" && client) {
      await updateClient(client.id, formData)
    }

    onOpenChange(false)
  }

  const isReadOnly = mode === "view"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Novo Cliente" : mode === "edit" ? "Editar Cliente" : "Detalhes do Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
              <TabsTrigger value="anamnesis">Anamnese</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf || ""}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate || ""}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  disabled={isReadOnly}
                />
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={formData.address?.street || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: { ...formData.address!, street: e.target.value } })
                    }
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.address?.number || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: { ...formData.address!, number: e.target.value } })
                    }
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.address?.complement || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: { ...formData.address!, complement: e.target.value } })
                    }
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.address?.neighborhood || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: { ...formData.address!, neighborhood: e.target.value } })
                    }
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.address?.city || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: { ...formData.address!, city: e.target.value } })
                    }
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.address?.state || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: { ...formData.address!, state: e.target.value } })
                    }
                    disabled={isReadOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={formData.address?.zipCode || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: { ...formData.address!, zipCode: e.target.value } })
                    }
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="anamnesis" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="allergies">Alergias</Label>
                <Textarea
                  id="allergies"
                  value={formData.anamnesis?.allergies || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, anamnesis: { ...formData.anamnesis!, allergies: e.target.value } })
                  }
                  rows={3}
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medications">Medicamentos em Uso</Label>
                <Textarea
                  id="medications"
                  value={formData.anamnesis?.medications || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, anamnesis: { ...formData.anamnesis!, medications: e.target.value } })
                  }
                  rows={3}
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skinType">Tipo de Pele</Label>
                <Input
                  id="skinType"
                  value={formData.anamnesis?.skinType || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, anamnesis: { ...formData.anamnesis!, skinType: e.target.value } })
                  }
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="concerns">Preocupações / Objetivos</Label>
                <Textarea
                  id="concerns"
                  value={formData.anamnesis?.concerns || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, anamnesis: { ...formData.anamnesis!, concerns: e.target.value } })
                  }
                  rows={3}
                  disabled={isReadOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousTreatments">Tratamentos Anteriores</Label>
                <Textarea
                  id="previousTreatments"
                  value={formData.anamnesis?.previousTreatments || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      anamnesis: { ...formData.anamnesis!, previousTreatments: e.target.value },
                    })
                  }
                  rows={3}
                  disabled={isReadOnly}
                />
              </div>
            </TabsContent>
          </Tabs>

          {!isReadOnly && (
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Criar Cliente" : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
