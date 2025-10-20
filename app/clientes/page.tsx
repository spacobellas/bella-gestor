"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useData } from "@/lib/data-context"
import { ClientModal } from "@/components/modals/client-modal"
import type { Client } from "@/lib/types"
import { Search, Plus, Mail, Phone, MoreVertical, Edit, Eye, Loader2, AlertCircle, Archive, Download, X, Calendar, MapPin, Clock, Bell, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

const ITEMS_PER_PAGE = 50

export default function ClientesPage() {
  const router = useRouter()
  const { clients, deactivateClient, updateClient, isLoading, error, refreshData } = useData()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [clientToDeactivate, setClientToDeactivate] = useState<string | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    refreshData()
  }, [])

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      client.phone.includes(searchTerm)
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const isAllSelected = paginatedClients.length > 0 && paginatedClients.every(client => selectedIds.has(client.id))

  const handleSelectAll = () => {
    if (isAllSelected) {
      const newSelected = new Set(selectedIds)
      paginatedClients.forEach(c => newSelected.delete(c.id))
      setSelectedIds(newSelected)
    } else {
      const newSelected = new Set(selectedIds)
      paginatedClients.forEach(c => newSelected.add(c.id))
      setSelectedIds(newSelected)
    }
    setLastSelectedIndex(null)
  }

  const handleSelectOne = (clientId: string, index: number, event: React.MouseEvent) => {
    const newSelected = new Set(selectedIds)
    if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      for (let i = start; i <= end; i++) {
        newSelected.add(paginatedClients[i].id)
      }
    } else {
      if (newSelected.has(clientId)) {
        newSelected.delete(clientId)
      } else {
        newSelected.add(clientId)
      }
    }
    setSelectedIds(newSelected)
    setLastSelectedIndex(index)
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
    setLastSelectedIndex(null)
  }

  const handleBulkExport = () => {
    const selectedClients = clients.filter(c => selectedIds.has(c.id))
    const exportData = selectedClients.map(client => ({
      Nome: client.name,
      Email: client.email || "—",
      Telefone: client.phone,
      "Data de Nascimento": client.birthDate ? formatDate(client.birthDate) : "—",
      "Data de Cadastro": client.registrationDate ? formatDate(client.registrationDate) : "—",
      "Total Gasto": formatCurrency(client.totalSpent),
      "Local do Serviço": client.serviceLocation || "—",
      "Horário Preferido": client.preferredSchedule || "—",
      "Fonte de Indicação": client.referralSource || "—",
      "Consentimento Marketing": client.marketingConsent ? "Sim" : "Não",
      "Status": client.isClient ? "Comprou" : "Não comprou",
      Observações: client.notes || ""
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes")
    XLSX.writeFile(workbook, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`)

    toast({
      title: "Exportação concluída",
      description: `${selectedIds.size} cliente(s) exportado(s) com sucesso.`,
    })
    handleClearSelection()
  }

  const handleBulkDeactivate = async () => {
    setIsDeactivating(true)
    try {
      const promises = Array.from(selectedIds).map(id => deactivateClient(id))
      await Promise.all(promises)
      toast({
        title: "Clientes desativados",
        description: `${selectedIds.size} cliente(s) desativado(s) com sucesso.`,
      })
      handleClearSelection()
      setBulkActionDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erro ao desativar",
        description: "Ocorreu um erro ao desativar os clientes.",
        variant: "destructive",
      })
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleCreate = () => {
    setSelectedClient(null)
    setModalMode("create")
    setModalOpen(true)
  }

  const handleView = (client: Client) => {
    setSelectedClient(client)
    setModalMode("view")
    setModalOpen(true)
  }

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setModalMode("edit")
    setModalOpen(true)
  }

  const handleDeactivateClick = (clientId: string) => {
    setClientToDeactivate(clientId)
    setDeactivateDialogOpen(true)
  }

  const handleDeactivateConfirm = async () => {
    if (!clientToDeactivate) return
    setIsDeactivating(true)
    try {
      const success = await deactivateClient(clientToDeactivate)
      if (success) {
        toast({
          title: "Cliente desativado",
          description: "O cliente foi desativado e não aparecerá mais na lista.",
        })
        setDeactivateDialogOpen(false)
        setClientToDeactivate(null)
      } else {
        toast({
          title: "Erro ao desativar",
          description: "Não foi possível desativar o cliente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao desativar",
        description: "Ocorreu um erro ao desativar o cliente.",
        variant: "destructive",
      })
    } finally {
      setIsDeactivating(false)
    }
  }

  const truncateText = (text: string | undefined | null, maxLength: number = 30) => {
    if (!text) return "—"
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  if (isLoading && clients.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  if (error && clients.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-semibold">Erro ao carregar clientes</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => refreshData()} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes Ativos</h1>
            <p className="text-base text-muted-foreground mt-1">
              Gerencie sua base de clientes ativos
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => router.push('/clientes/inativos')} variant="outline" size="default" className="w-full sm:w-auto">
              <Archive className="mr-2 h-4 w-4" />
              Ver Inativos
            </Button>
            <Button onClick={handleCreate} size="default" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        <Card className="p-4 md:p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 h-10"
              />
            </div>

            {selectedIds.size > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {selectedIds.size} selecionado(s)
                  </Badge>
                  <Button onClick={handleClearSelection} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={handleBulkExport} variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar XLSX
                  </Button>
                  <Button onClick={() => setBulkActionDialogOpen(true)} variant="ghost" size="sm" className="flex-1 sm:flex-none text-destructive hover:text-destructive">
                    <Archive className="mr-2 h-4 w-4" />
                    Desativar
                  </Button>
                </div>
              </div>
            )}

            {selectedIds.size === 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {filteredClients.length === clients.length 
                      ? `${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'} no total`
                      : `${filteredClients.length} de ${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'}`
                    }
                  </span>
                </div>
              </div>
            )}

            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Selecionar todos"
                          className="h-5 w-5"
                        />
                      </TableHead>
                      <TableHead className="min-w-[200px] font-semibold">Nome</TableHead>
                      <TableHead className="min-w-[200px] font-semibold">Contato</TableHead>
                      <TableHead className="min-w-[120px] font-semibold">Nascimento</TableHead>
                      <TableHead className="min-w-[120px] font-semibold">Cadastro</TableHead>
                      <TableHead className="min-w-[120px] font-semibold">Total Gasto</TableHead>
                      <TableHead className="min-w-[150px] font-semibold">Local</TableHead>
                      <TableHead className="min-w-[120px] font-semibold">Horário</TableHead>
                      <TableHead className="min-w-[150px] font-semibold">Indicação</TableHead>
                      <TableHead className="min-w-[120px] font-semibold">Status</TableHead>
                      <TableHead className="min-w-[200px] font-semibold">Observações</TableHead>
                      <TableHead className="w-[100px] font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {searchTerm
                                ? "Nenhum cliente encontrado com esse critério de busca"
                                : "Nenhum cliente cadastrado ainda"}
                            </p>
                            {!searchTerm && (
                              <Button onClick={handleCreate} variant="outline" size="sm" className="mt-2">
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar primeiro cliente
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedClients.map((client, index) => (
                        <TableRow key={client.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(client.id)}
                              onCheckedChange={(e) => handleSelectOne(client.id, index, e as any)}
                              onClick={(e) => handleSelectOne(client.id, index, e)}
                              aria-label={`Selecionar ${client.name}`}
                              className="h-5 w-5"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{client.name}</span>
                              {client.marketingConsent && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Bell className="h-4 w-4 text-primary" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Consentimento de marketing</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {client.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{client.email}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span>{client.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.birthDate ? formatDate(client.birthDate) : "—"}
                          </TableCell>
                          <TableCell>
                            {client.registrationDate ? formatDate(client.registrationDate) : "—"}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(client.totalSpent)}
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{truncateText(client.serviceLocation, 20)}</span>
                                </div>
                              </TooltipTrigger>
                              {client.serviceLocation && client.serviceLocation.length > 20 && (
                                <TooltipContent>
                                  <p>{client.serviceLocation}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{truncateText(client.preferredSchedule, 15)}</span>
                                </div>
                              </TooltipTrigger>
                              {client.preferredSchedule && client.preferredSchedule.length > 15 && (
                                <TooltipContent>
                                  <p>{client.preferredSchedule}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {truncateText(client.referralSource, 20)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={client.isClient ? "default" : "secondary"}>
                              {client.isClient ? "Comprou" : "Não comprou"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {client.notes ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="truncate max-w-[200px] cursor-help">{client.notes}</p>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>{client.notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Abrir menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => handleView(client)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(client)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeactivateClick(client.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Desativar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} ({filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'})
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <ClientModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          mode={modalMode}
          client={selectedClient}
        />

        <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar cliente</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desativar este cliente? Ele não será excluído permanentemente e
                poderá ser reativado a qualquer momento na seção &quot;Clientes Inativos&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeactivateConfirm}
                disabled={isDeactivating}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desativando...
                  </>
                ) : (
                  "Desativar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar {selectedIds.size} cliente(s)</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desativar os {selectedIds.size} clientes selecionados? Eles não serão excluídos permanentemente e
                poderão ser reativados a qualquer momento na seção &quot;Clientes Inativos&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDeactivate}
                disabled={isDeactivating}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desativando...
                  </>
                ) : (
                  "Desativar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
