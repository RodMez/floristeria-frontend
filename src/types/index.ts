export interface Sede {
  id: number;
  nombre: string;
  ciudad: string;
  telefonoWhatsapp: string;
}

export interface ProductoCatalogo {
  productoId: number;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  categoriaNombre: string;
  precio: number;
  stock: number;
  disponible: boolean;
}

export interface DetallePedidoRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  notaPersonalizacion?: string;
}

export interface PedidoRequest {
  sedeId: number;
  clienteNombre: string;
  clienteTelefono: string;
  notasEntrega?: string;
  detalles: DetallePedidoRequest[];
}
