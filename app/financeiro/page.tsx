"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import type { Sale } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { PaymentStatus, SaleStatus } from "@/types";
import { useData } from "@/lib/data-context";
import { PageHeader } from "@/components/layout/page-header";
import { CheckoutModal } from "@/components/modals/checkout-modal";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  formatBrazilianPhone,
} from "@/lib/utils";

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";

// icons
import {
  Search,
  RefreshCw,
  MoreHorizontal,
  CreditCard,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Plus,
} from "lucide-react";

type DateRange = {
  start?: string; // yyyy-MM-dd
  end?: string; // yyyy-MM-dd
};

function currency(n: number) {
  return `R$ ${Number(n || 0).toFixed(2)}`;
}

function withinRange(iso: string, range: DateRange) {
  if (!range.start && !range.end) return true;
  const d = new Date(iso).getTime();
  if (range.start && d < new Date(range.start + "T00:00:00").getTime())
    return false;
  if (range.end && d > new Date(range.end + "T23:59:59").getTime())
    return false;
  return true;
}

export default function FinanceiroPage() {
  const { toast } = useToast();
  const {
    sales,
    clients,
    serviceVariants: variants,
    professionals,
    refreshData: refreshAll,
    createSale,
    updateSaleStatus,
  } = useData();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | SaleStatus>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Sections (sales | payments) - Restored tab logic from main
  const [activeTab, setActiveTab] = useState<"sales" | "payments">("sales");

  // Selections
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [posCheckoutSale, setPosCheckoutSale] = useState<Sale | null>(null);

  // Modals
  const [saleDetailsOpen, setSaleDetailsOpen] = useState(false);
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [newSaleLoading, setNewSaleLoading] = useState(false);
  const [newSaleError, setNewSaleError] = useState<string | null>(null);

  // New sale form
  type NewSaleItemForm = {
    rowId: string;
    serviceVariantId: string;
    professionalId: string;
    quantity: number;
    unitPrice: number;
  };
  type NewSaleForm = {
    clientId: string;
    items: NewSaleItemForm[];
    notes?: string;
  };
  const [newSaleForm, setNewSaleForm] = useState<NewSaleForm>({
    clientId: "",
    items: [],
  });

  function addItemRow() {
    setNewSaleForm((f) => ({
      ...f,
      items: [
        ...f.items,
        {
          rowId: crypto.randomUUID(),
          serviceVariantId: "",
          professionalId: "",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    }));
  }

  function removeItemRow(idx: number) {
    setNewSaleForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx),
    }));
  }

  function onChangeItem(idx: number, patch: Partial<NewSaleItemForm>) {
    setNewSaleForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  }

  function paidAmount(sale?: Sale | null) {
    if (!sale) return 0;
    return (sale.payments || [])
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }

  function balance(sale?: Sale | null) {
    if (!sale) return 0;
    return Math.max(0, Number(sale.totalAmount) - paidAmount(sale));
  }

  async function submitNewSale() {
    setNewSaleLoading(true);
    setNewSaleError(null);
    try {
      if (!newSaleForm.clientId || newSaleForm.items.length === 0) {
        throw new Error("Selecione o cliente e adicione pelo menos 1 item");
      }
      const created = await createSale({
        clientId: newSaleForm.clientId,
        items: newSaleForm.items.map((it) => ({
          serviceVariantId: it.serviceVariantId,
          professionalId: it.professionalId,
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || 0),
        })),
        notes: newSaleForm.notes || undefined,
        status: SaleStatus.PENDING,
      });
      if (!created) throw new Error("Falha ao criar venda");

      setNewSaleOpen(false);
      setNewSaleForm({ clientId: "", items: [] });
      toast({ title: "Sucesso", description: "Venda criada com sucesso." });
      refreshAll();
    } catch (e) {
      setNewSaleError(e instanceof Error ? e.message : "Não foi possível criar a venda");
    } finally {
      setNewSaleLoading(false);
    }
  }

  const filteredSales = useMemo(() => {
    let list = (sales || []).filter((s) => withinRange(s.created_at, dateRange));
    if (statusFilter) list = list.filter((s) => s.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.clientName?.toLowerCase().includes(q) ||
          String(s.id).includes(q) ||
          (s.items || []).some((it) => it.serviceVariantName?.toLowerCase().includes(q)),
      );
    }
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [sales, search, statusFilter, dateRange]);

  const pagedSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, page, pageSize]);

  const totalPages = Math.ceil(filteredSales.length / pageSize);

  const handleExport = () => {
    const headers = ["ID", "Data", "Cliente", "Total", "Pago", "Saldo", "Status"];
    const rows = filteredSales.map(s => [
      s.id,
      new Date(s.created_at).toLocaleDateString("pt-BR"),
      s.clientName,
      Number(s.totalAmount).toFixed(2),
      paidAmount(s).toFixed(2),
      balance(s).toFixed(2),
      s.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Financeiro" description="Controle de vendas e fluxo de caixa." />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" /> Exportar</Button>
          <Button onClick={() => setNewSaleOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova Venda</Button>
        </div>
      </div>

      {/* Tabs Restored from Main */}
      <div className="flex items-center border-b mb-4">
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "sales"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Vendas
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "payments"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pagamentos (Logs)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtros</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refreshAll()}><RefreshCw className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por cliente, ID ou serviço..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v as SaleStatus)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value={SaleStatus.PENDING}>Pendente</SelectItem>
                  <SelectItem value={SaleStatus.PAID}>Pago</SelectItem>
                  <SelectItem value={SaleStatus.CANCELLED}>Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({...p, start: e.target.value}))} />
                <Input type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({...p, end: e.target.value}))} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeTab === "sales" ? (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <ul className="divide-y">
                {pagedSales.map((s) => {
                  const paid = paidAmount(s);
                  const due = balance(s);
                  return (
                    <li key={s.id} className="p-4 hover:bg-muted/30 transition">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">#{s.id}</span>
                            <Badge variant={s.status === "paid" ? "default" : s.status === "cancelled" ? "destructive" : "outline"}>
                              {s.status.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">{s.clientName}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(s.created_at).toLocaleString("pt-BR")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total: {currency(Number(s.totalAmount))} • Pago: {currency(paid)} • Saldo: {currency(due)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setSelectedSale(s); setSaleDetailsOpen(true); }}>
                            <Eye className="h-4 w-4 mr-2" /> Detalhes
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setPosCheckoutSale(s)} disabled={due <= 0 || s.status === SaleStatus.CANCELLED}>
                            <CreditCard className="h-4 w-4 mr-2" /> Dar Baixa
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setPosCheckoutSale(s); }}>
                                Dar Baixa / Registrar Pagamento
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => updateSaleStatus(s.id, SaleStatus.CANCELLED)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Cancelar Venda
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">Página {page} de {totalPages || 1}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Use a aba &quot;Vendas&quot; para visualizar e gerenciar transações. 
            A visualização detalhada de logs de pagamentos individuais será restaurada em breve.
          </CardContent>
        </Card>
      )}

      {/* Sale Details Modal */}
      <Dialog open={saleDetailsOpen} onOpenChange={setSaleDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da venda</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-md">
                    <div className="text-xs text-muted-foreground">CLIENTE</div>
                    <div className="font-medium">{selectedSale.clientName}</div>
                  </div>
                   <div className="p-3 border rounded-md">
                    <div className="text-xs text-muted-foreground">STATUS</div>
                    <div className="font-medium capitalize">{selectedSale.status}</div>
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="font-semibold text-sm">ITENS</div>
                  <div className="border rounded-md divide-y">
                    {(selectedSale.items || []).map((it, idx) => (
                      <div key={idx} className="p-2 flex justify-between text-sm">
                        <span>{it.serviceName} - {it.serviceVariantName} (x{it.quantity})</span>
                        <span className="font-medium">{currency(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="font-semibold text-sm">PAGAMENTOS</div>
                  <div className="border rounded-md divide-y">
                    {(selectedSale.payments || []).map((p, idx) => (
                      <div key={idx} className="p-2 flex justify-between text-sm">
                        <span>{new Date(p.created_at).toLocaleDateString("pt-BR")} - {p.paymentMethod || "N/A"}</span>
                        <span className="font-medium">{currency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setSaleDetailsOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Sale Modal */}
      <Dialog open={newSaleOpen} onOpenChange={setNewSaleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Combobox
                placeholder="Cliente"
                items={(clients || []).map((c) => ({ 
                  value: c.id, 
                  label: c.phone ? `${c.name} - ${formatBrazilianPhone(c.phone)}` : c.name 
                }))}
                value={newSaleForm.clientId}
                onChange={(v) => setNewSaleForm((f) => ({ ...f, clientId: v }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label>Itens</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow}><Plus className="h-4 w-4 mr-2" /> Adicionar Item</Button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {newSaleForm.items.map((it, idx) => (
                <div key={it.rowId} className="p-3 border rounded-lg bg-muted/30 space-y-2 relative">
                  <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive" onClick={() => removeItemRow(idx)}><Trash2 className="h-3 w-3" /></Button>
                  <div className="space-y-1">
                    <Label className="text-[10px]">SERVIÇO/TIPO</Label>
                    <Combobox
                      placeholder="Serviço/tipo"
                      items={(variants || []).map((v) => ({ value: v.id, label: `${v.variantName} (R$ ${Number(v.price).toFixed(2)})` }))}
                      value={it.serviceVariantId}
                      onChange={(v) => {
                        const matched = variants.find((vv) => vv.id === v);
                        onChangeItem(idx, { serviceVariantId: v, unitPrice: matched ? Number(matched.price) : 0 });
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">PROFISSIONAL</Label>
                      <Combobox
                        placeholder="Profissional"
                        items={(professionals || []).map((p) => ({ value: p.id, label: p.name }))}
                        value={it.professionalId}
                        onChange={(v) => onChangeItem(idx, { professionalId: v })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">QTD.</Label>
                      <Input type="number" min="1" value={it.quantity} onChange={(e) => onChangeItem(idx, { quantity: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {newSaleError && <Alert variant="destructive"><AlertDescription>{newSaleError}</AlertDescription></Alert>}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
             <div className="text-left flex-1">
                <div className="text-xs text-muted-foreground uppercase">Total</div>
                <div className="text-lg font-bold">{currency(newSaleForm.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0))}</div>
             </div>
             <Button variant="outline" onClick={() => setNewSaleOpen(false)}>Cancelar</Button>
             <Button onClick={submitNewSale} disabled={newSaleLoading}>{newSaleLoading ? "Salvando..." : "Salvar Venda"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {posCheckoutSale && (
        <CheckoutModal
          isOpen={!!posCheckoutSale}
          onClose={() => setPosCheckoutSale(null)}
          saleId={Number(posCheckoutSale.id)}
          clientName={posCheckoutSale.clientName || "Cliente"}
          totalAmount={Number(posCheckoutSale.totalAmount)}
          alreadyPaidAmount={paidAmount(posCheckoutSale)}
          onSuccess={() => { refreshAll(); }}
        />
      )}
    </div>
  );
}
