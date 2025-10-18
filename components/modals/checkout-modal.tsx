"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Copy, Check, Share2 } from "lucide-react"
import type { Appointment, Sale } from "@/lib/types"
import { generateInfinitePayLink } from "@/services/api"
import QRCode from "qrcode"

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment
  onSuccess: () => void
}

export function CheckoutModal({ open, onOpenChange, appointment, onSuccess }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [sale, setSale] = useState<Sale | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const subtotal = appointment.price
  const discountAmount = (subtotal * discount) / 100
  const total = subtotal - discountAmount

  const handleGeneratePayment = async () => {
    setLoading(true)
    try {
      // Generate payment link
      const newSale = await generateInfinitePayLink({
        appointmentId: appointment.id,
        amount: total,
        discount: discountAmount,
      })

      setSale(newSale)

      // Generate QR Code
      const qrCode = await QRCode.toDataURL(newSale.paymentLink, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
      setQrCodeUrl(qrCode)
    } catch (error) {
      console.error("Error generating payment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (sale) {
      navigator.clipboard.writeText(sale.paymentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareWhatsApp = () => {
    if (sale) {
      const message = encodeURIComponent(
        `Olá! Aqui está o link para pagamento do seu agendamento:\n\n${sale.paymentLink}\n\nValor: R$ ${total.toFixed(2)}`,
      )
      window.open(`https://wa.me/?text=${message}`, "_blank")
    }
  }

  const handleClose = () => {
    if (sale) {
      onSuccess()
    }
    onOpenChange(false)
    // Reset state
    setTimeout(() => {
      setDiscount(0)
      setSale(null)
      setQrCodeUrl("")
      setCopied(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout - Pagamento</DialogTitle>
        </DialogHeader>

        {!sale ? (
          <div className="space-y-6">
            {/* Appointment Details */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{appointment.clientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-medium">{appointment.service}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">
                  {new Date(appointment.date).toLocaleDateString("pt-BR")} às {appointment.startTime}
                </span>
              </div>
            </div>

            <Separator />

            {/* Discount Input */}
            <div className="space-y-2">
              <Label htmlFor="discount">Desconto (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                placeholder="0"
              />
            </div>

            <Separator />

            {/* Price Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto ({discount}%):</span>
                  <span>- R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Generate Button */}
            <Button onClick={handleGeneratePayment} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando link...
                </>
              ) : (
                "Gerar Link de Pagamento"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium">Link de pagamento gerado!</p>
              <Badge variant="outline" className="text-xs">
                Status: {sale.status === "pending" ? "Aguardando Pagamento" : "Pago"}
              </Badge>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border-2 border-border">
                  <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}

            {/* Payment Link */}
            <div className="space-y-2">
              <Label>Link de Pagamento</Label>
              <div className="flex gap-2">
                <Input value={sale.paymentLink} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button onClick={handleShareWhatsApp} variant="outline" className="w-full bg-transparent">
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar no WhatsApp
              </Button>
              <Button onClick={handleClose} className="w-full">
                Concluir
              </Button>
            </div>

            {/* Payment Info */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Valor: R$ {sale.amount.toFixed(2)}</p>
              {sale.discount > 0 && <p>Desconto aplicado: R$ {sale.discount.toFixed(2)}</p>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
