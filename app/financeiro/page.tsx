"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import type { Sale, Payment } from "@/types";
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
import { zonedNowForInput } from "@/lib/utils";
import {
  formatBrazilianPhone,
  formatCEP,
  formatPhoneForInfinitePay,
  unformatCEP,
} from "@/lib/utils";
import * as XLSX from "xlsx";

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Filter,
  RefreshCw,
  MoreHorizontal,
  Link as LinkIcon,
  CreditCard,
  CheckCircle2,
  XCircle,
  Receipt,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
} from "lucide-react";

// Form types
type LinkForm = {
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressNeighborhood?: string;
  addressComplement?: string;
};

type PaymentForm = {
  amount: number;
  paymentMethod?: string;
  externalTransactionId?: string;
  paidAt?: string;
  professionalId?: string;
};

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
    payments,
    clients,
    services,
    serviceVariants: variants,
    professionals,
    isLoading: loading,
    refreshData: refreshAll,
    createSale,
    createPayment,
    updateSaleStatus,
    cancelPayment,
    appOptions,
  } = useData();

  const paymentMethods = useMemo(
    () =>
      (appOptions || []).filter(
        (o) => o.optionType === "payment_method" && o.isActive,
      ),
    [appOptions],
  );

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | SaleStatus>("");
  const [dateRange, setDateRange] = useState<DateRange>({});

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sections (sales | payments)
  const [activeTab, setActiveTab] = useState<"sales" | "payments">("sales");

  // Selections
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Modals
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [saleDetailsOpen, setSaleDetailsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<null | {
    sale: Sale;
    type: "paid" | "cancel";
  }>(null);
  const [confirmPaymentCancelOpen, setConfirmPaymentCancelOpen] =
    useState<Payment | null>(null);

  const [posCheckoutSale, setPosCheckoutSale] = useState<Sale | null>(null);

  // Forms
  const [linkForm, setLinkForm] = useState<LinkForm>({ amount: 0 });
  const [payForm, setPayForm] = useState<PaymentForm>({
    amount: 0,
    paidAt: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function paidAmount(s: Sale) {
    return (s.payments || [])
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((acc, p) => acc + Number(p.amount), 0);
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
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [sales, search, statusFilter, dateRange]);

  const pagedSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, page, pageSize]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <PageHeader title="Financeiro" description="Controle de vendas, pagamentos e fluxo de caixa." />

      <Tabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "sales" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Recentes</CardTitle>
              <Button size="sm" onClick={() => refreshAll()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente, ID ou serviço..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as SaleStatus)}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos Status</SelectItem>
                    <SelectItem value={SaleStatus.PENDING}>Pendente</SelectItem>
                    <SelectItem value={SaleStatus.PAID}>Pago</SelectItem>
                    <SelectItem value={SaleStatus.CANCELLED}>Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <ul className="divide-y">
                  {pagedSales.map((s) => {
                    const paid = paidAmount(s);
                    const due = Number(s.totalAmount) - paid;
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4 mr-2" /> Ações
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => setPosCheckoutSale(s)} disabled={due <= 0 || s.status === SaleStatus.CANCELLED}>
                                  <CreditCard className="h-4 w-4 mr-2" /> Checkout Rápido (POS)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedSale(s); setChoiceOpen(true); }}>
                                  <LinkIcon className="h-4 w-4 mr-2" /> Gerar link de pagamento
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedSale(s); setConfirmOpen({ sale: s, type: 'cancel' }); }} disabled={s.status === SaleStatus.CANCELLED}>
                                  <XCircle className="h-4 w-4 mr-2" /> Cancelar Venda
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
            </CardContent>
          </Card>
        </div>
      )}

      {posCheckoutSale && (
        <CheckoutModal
          isOpen={!!posCheckoutSale}
          onClose={() => setPosCheckoutSale(null)}
          saleId={Number(posCheckoutSale.id)}
          clientName={posCheckoutSale.clientName || "Cliente"}
          totalAmount={Number(posCheckoutSale.totalAmount)}
          alreadyPaidAmount={paidAmount(posCheckoutSale)}
          onSuccess={(isFullyPaid) => {
            refreshAll();
            if (isFullyPaid) setPosCheckoutSale(null);
          }}
        />
      )}
    </div>
  );
}

function Tabs({ active, onChange }: { active: string; onChange: (v: any) => void }) {
  return (
    <div className="flex border-b">
      <button onClick={() => onChange("sales")} className={`px-4 py-2 text-sm font-medium border-b-2 transition ${active === "sales" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
        Vendas
      </button>
      <button onClick={() => onChange("payments")} className={`px-4 py-2 text-sm font-medium border-b-2 transition ${active === "payments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
        Pagamentos
      </button>
    </div>
  );
}
