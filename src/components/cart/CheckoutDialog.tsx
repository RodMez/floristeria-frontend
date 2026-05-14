"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/store/useCartStore";
import { Sede, PedidoRequest } from "@/types";

interface CheckoutDialogProps {
  cartItems: CartItem[];
  sedeActual: Sede;
  total: number;
  clearCart: () => void;
}

export default function CheckoutDialog({
  cartItems,
  sedeActual,
  total,
  clearCart,
}: CheckoutDialogProps) {
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [notasEntrega, setNotasEntrega] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (!clienteNombre.trim() || !clienteTelefono.trim()) {
      alert("Por favor, completa tu nombre y teléfono");
      return;
    }

    setIsLoading(true);

    try {
      const pedido: PedidoRequest = {
        sedeId: sedeActual.id,
        clienteNombre: clienteNombre.trim(),
        clienteTelefono: clienteTelefono.trim(),
        notasEntrega: notasEntrega.trim() || undefined,
        detalles: cartItems.map((item) => ({
          productoId: Number(item.id),
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          notaPersonalizacion: item.notaPersonalizacion,
        })),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pedido),
      });

      if (!response.ok) {
        throw new Error("Error al procesar el pedido");
      }

     // Generar mensaje para WhatsApp (Sin espacios en blanco no deseados)
      const lineasMensaje = [
        "*[ Pedido - Floristería ]*",
        "",
        "*Cliente*",
        `- Nombre: ${clienteNombre}`,
        `- Teléfono: ${clienteTelefono}`,
        notasEntrega ? `- Entrega: ${notasEntrega}` : null,
        "",
        "*Productos*",
        ...cartItems.map(item => {
          let lineaProd = `- ${item.cantidad}x ${item.nombre}: $${(item.precio * item.cantidad).toLocaleString('es-CO')}`;
          if (item.notaPersonalizacion) {
            lineaProd += `\n  - Nota: _${item.notaPersonalizacion}_`;
          }
          return lineaProd;
        }),
        "",
        "--------------------------------",
        `*TOTAL: $${total.toLocaleString('es-CO')}*`,
        "--------------------------------",
        "_¡Gracias por tu pedido!_"
      ];

      // Filtramos los nulls (por si no hay notas de entrega) y unimos con saltos de línea
      const mensaje = lineasMensaje.filter(linea => linea !== null).join('\n');


      // Abrir WhatsApp en nueva pestaña
      window.open(
        `https://wa.me/${sedeActual.telefonoWhatsapp}?text=${encodeURIComponent(mensaje)}`,
        "_blank"
      );

      // Vaciar carrito
      clearCart();

      // Cerrar modal
      setOpen(false);
      setClienteNombre("");
      setClienteTelefono("");
      setNotasEntrega("");
    } catch {
      alert("Hubo un error al procesar tu pedido. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2">
        Realizar Pedido
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Finalizar Pedido</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              placeholder="Tu nombre"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              placeholder="Tu teléfono"
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notas">Notas de entrega (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Dirección, referencias, etc."
              value={notasEntrega}
              onChange={(e) => setNotasEntrega(e.target.value)}
              disabled={isLoading}
              className="min-h-[80px]"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Procesando..." : "Confirmar Pedido"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}