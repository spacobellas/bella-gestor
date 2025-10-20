"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/lib/data-context"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  PiggyBank,
  Calendar,
  Download,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Sale, Payment, PaymentStatus } from "@/lib/types"

interface MetricCardProps {
  title: string
  value: string
  change?: number
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
  description?: string
}

function MetricCard({ title, value, change, icon, trend = "neutral", description }: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {trend === "up" && (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 font-medium">+{change.toFixed(1)}%</span>
                  </>
                )}
                {trend === "down" && (
                  <>
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                    <span className="text-red-500 font-medium">{change.toFixed(1)}%</span>
                  </>
                )}
                {trend === "neutral" && (
                  <span className="text-muted-foreground font-medium">{change.toFixed(1)}%</span>
                )}
                <span className="text-muted-foreground">vs. mês anterior</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="rounded-full bg-primary/10 p-3">
          {icon}
        </div>
      </div>
    </Card>
  )
}

const ITEMS_PER_PAGE = 20

export default function FinanceiroPage() {
  const { sales, payments, isLoading, error, refreshData } = useData()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("30")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    refreshData()
  }, [])

  const filteredData = useMemo(() => {
    const now = new Date()
    const periodDays = parseInt(periodFilter)
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    let filtered = [...payments]

    if (periodFilter !== "all") {
      filtered = filtered.filter(p => new Date(p.createdAt) >= startDate)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(p => p.paymentMethod === paymentMethodFilter)
    }

    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.id.toLowerCase().includes(query) ||
        p.saleId.toLowerCase().includes(query) ||
        (p.externalTransactionId && p.externalTransactionId.toLowerCase().includes(query))
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [payments, statusFilter, periodFilter, paymentMethodFilter, searchTerm])

  const metrics = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const currentMonthPayments = payments.filter(p => {
      const date = new Date(p.createdAt)
      return date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear && 
             p.status === "paid"
    })

    const lastMonthPayments = payments.filter(p => {
      const date = new Date(p.createdAt)
      return date.getMonth() === lastMonth && 
             date.getFullYear() === lastMonthYear && 
             p.status === "paid"
    })

    const currentRevenue = currentMonthPayments.reduce((acc, p) => acc + p.amount, 0)
    const lastRevenue = lastMonthPayments.reduce((acc, p) => acc + p.amount, 0)
    const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0
    const revenueTrend: "up" | "down" | "neutral" = revenueChange > 0 ? "up" : revenueChange < 0 ? "down" : "neutral"

    const pending = payments.filter(p => p.status === "pending")
    const pendingAmount = pending.reduce((acc, p) => acc + p.amount, 0)

    const failed = payments.filter(p => p.status === "failed")
    const failedAmount = failed.reduce((acc, p) => acc + p.amount, 0)

    const paymentsByMethod = payments
      .filter(p => p.status === "paid" && p.paymentMethod)
      .reduce((acc, p) => {
        const method = p.paymentMethod || "Não especificado"
        acc[method] = (acc[method] || 0) + p.amount
        return acc
      }, {} as Record<string, number>)

    return {
      currentRevenue,
      revenueChange,
      revenueTrend,
      transactionsCount: currentMonthPayments.length,
      pendingAmount,
      pendingCount: pending.length,
      failedAmount,
      failedCount: failed.length,
      paymentsByMethod
    }
  }, [payments])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const handleExport = () => {
    const exportData = filteredData.map(payment => ({
      "ID Transação": payment.id,
      "ID Venda": payment.saleId,
      "Valor": formatCurrency(payment.amount),
      "Método de Pagamento": payment.paymentMethod || "—",
      "Status": getStatusLabel(payment.status),
      "ID Externa": payment.externalTransactionId || "—",
      "Data de Criação": formatDateTime(payment.createdAt),
      "Data de Pagamento": payment.paidAt ? formatDateTime(payment.paidAt) : "—"
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financeiro")
    XLSX.writeFile(workbook, `financeiro_${new Date().toISOString().split('T')[0]}.xlsx`)

    toast({
      title: "Exportação concluída",
      description: `${filteredData.length} transação(ões) exportada(s) com sucesso.`,
    })
  }

  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      paid: { label: "Pago", variant: "default" as const, icon: CheckCircle },
      pending: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      failed: { label: "Falhou", variant: "destructive" as const, icon: XCircle },
      refunded: { label: "Reembolsado", variant: "outline" as const, icon: RefreshCcw }
    }
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getStatusLabel = (status: PaymentStatus) => {
    const labels = {
      paid: "Pago",
      pending: "Pendente",
      failed: "Falhou",
      refunded: "Reembolsado"
    }
    return labels[status]
  }

  if (isLoading && payments.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  if (error && payments.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-semibold">Erro ao carregar dados</h2>
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
            <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-base text-muted-foreground mt-1">
              Acompanhe receitas, pagamentos e transações
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" size="default">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Receita do Mês"
            value={formatCurrency(metrics.currentRevenue)}
            change={metrics.revenueChange}
            trend={metrics.revenueTrend}
            icon={<DollarSign className="h-5 w-5 text-primary" />}
            description={`${metrics.transactionsCount} transações concluídas`}
          />
          <MetricCard
            title="Pagamentos Pendentes"
            value={formatCurrency(metrics.pendingAmount)}
            icon={<Clock className="h-5 w-5 text-yellow-600" />}
            description={`${metrics.pendingCount} pagamento(s) aguardando`}
          />
          <MetricCard
            title="Pagamentos Falhados"
            value={formatCurrency(metrics.failedAmount)}
            icon={<XCircle className="h-5 w-5 text-red-600" />}
            description={`${metrics.failedCount} tentativa(s) sem sucesso`}
          />
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(
              metrics.transactionsCount > 0 
                ? metrics.currentRevenue / metrics.transactionsCount 
                : 0
            )}
            icon={<Receipt className="h-5 w-5 text-primary" />}
            description="Valor médio por transação"
          />
        </div>

        {Object.keys(metrics.paymentsByMethod).length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Receita por Método de Pagamento</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(metrics.paymentsByMethod)
                .sort(([, a], [, b]) => b - a)
                .map(([method, amount]) => {
                  const percentage = (amount / metrics.currentRevenue) * 100
                  return (
                    <div key={method} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          {method.toLowerCase().includes("pix") ? (
                            <Wallet className="h-4 w-4 text-primary" />
                          ) : method.toLowerCase().includes("card") || method.toLowerCase().includes("cartão") ? (
                            <CreditCard className="h-4 w-4 text-primary" />
                          ) : (
                            <PiggyBank className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{method}</p>
                          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% do total</p>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(amount)}</p>
                    </div>
                  )
                })}
            </div>
          </Card>
        )}

        <Card className="p-4 md:p-6">
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:w-auto">
              <TabsTrigger value="transactions">Todas as Transações</TabsTrigger>
              <TabsTrigger value="pending">Pendentes ({metrics.pendingCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por ID ou transação..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="pl-10 h-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value)
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="w-full sm:w-[180px] h-10">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                      <SelectItem value="refunded">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Select value={periodFilter} onValueChange={(value) => {
                    setPeriodFilter(value)
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="w-full sm:w-[160px] h-10">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                      <SelectItem value="all">Todo o período</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentMethodFilter} onValueChange={(value) => {
                    setPaymentMethodFilter(value)
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="w-full sm:w-[160px] h-10">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os métodos</SelectItem>
                      {Array.from(new Set(payments.map(p => p.paymentMethod).filter(Boolean))).map(method => (
                        <SelectItem key={method} value={method!}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredData.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                  <span>
                    {filteredData.length === payments.length 
                      ? `${payments.length} ${payments.length === 1 ? 'transação' : 'transações'} no total`
                      : `${filteredData.length} de ${payments.length} ${payments.length === 1 ? 'transação' : 'transações'}`
                    }
                  </span>
                </div>
              )}

              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="min-w-[100px] font-semibold">ID</TableHead>
                        <TableHead className="min-w-[120px] font-semibold">Valor</TableHead>
                        <TableHead className="min-w-[150px] font-semibold">Método</TableHead>
                        <TableHead className="min-w-[120px] font-semibold">Status</TableHead>
                        <TableHead className="min-w-[150px] font-semibold">Data</TableHead>
                        <TableHead className="min-w-[150px] font-semibold">ID Externa</TableHead>
                        <TableHead className="w-[80px] font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <AlertCircle className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">
                                {searchTerm || statusFilter !== "all" || periodFilter !== "30" || paymentMethodFilter !== "all"
                                  ? "Nenhuma transação encontrada com os filtros aplicados"
                                  : "Nenhuma transação registrada ainda"}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((payment) => (
                          <TableRow key={payment.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-sm">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    {payment.id.substring(0, 8)}...
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{payment.id}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {payment.paymentMethod?.toLowerCase().includes("pix") ? (
                                  <Wallet className="h-4 w-4 text-muted-foreground" />
                                ) : payment.paymentMethod?.toLowerCase().includes("card") || 
                                   payment.paymentMethod?.toLowerCase().includes("cartão") ? (
                                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <PiggyBank className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span>{payment.paymentMethod || "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(payment.status)}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex flex-col gap-1">
                                <span>{formatDate(payment.createdAt)}</span>
                                {payment.paidAt && payment.status === "paid" && (
                                  <span className="text-xs text-muted-foreground">
                                    Pago em {formatDate(payment.paidAt)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {payment.externalTransactionId ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      {payment.externalTransactionId.substring(0, 12)}...
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{payment.externalTransactionId}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                "—"
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
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Detalhes
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
                    Página {currentPage} de {totalPages} ({filteredData.length} {filteredData.length === 1 ? 'transação' : 'transações'})
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
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="min-w-[100px] font-semibold">ID</TableHead>
                        <TableHead className="min-w-[120px] font-semibold">Valor</TableHead>
                        <TableHead className="min-w-[150px] font-semibold">Método</TableHead>
                        <TableHead className="min-w-[150px] font-semibold">Criado em</TableHead>
                        <TableHead className="min-w-[150px] font-semibold">Link de Pagamento</TableHead>
                        <TableHead className="w-[80px] font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.filter(p => p.status === "pending").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <CheckCircle className="h-8 w-8 text-green-500" />
                              <p className="text-muted-foreground">
                                Nenhum pagamento pendente no momento
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments
                          .filter(p => p.status === "pending")
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((payment) => (
                            <TableRow key={payment.id} className="hover:bg-muted/50">
                              <TableCell className="font-mono text-sm">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                      {payment.id.substring(0, 8)}...
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{payment.id}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(payment.amount)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                  <span>{payment.paymentMethod || "Aguardando"}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDateTime(payment.createdAt)}
                              </TableCell>
                              <TableCell>
                                {payment.paymentLinkUrl ? (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0"
                                    onClick={() => window.open(payment.paymentLinkUrl, '_blank')}
                                  >
                                    Abrir link
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
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
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver Detalhes
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
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </TooltipProvider>
  )
}
