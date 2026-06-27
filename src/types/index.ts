export interface Sede {
  id: number;
  nombre: string;
  ciudad: string;
  telefonoWhatsapp: string;
  instagramUrl?: string;
  facebookUrl?: string;
  email?: string;
}

export interface ProductoCatalogo {
  productoId: number;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  categorias: { id: number; nombre: string }[];
  // Compatibilidad con backend legacy
  categoriasNombres?: string[];
  categoriaNombre?: string;
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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  rol: string;
  sedeId: number | null;
}

// Cliente Auth Types
export interface ClienteAuthResponse {
  token: string;
  clienteId: number;
  nombre: string;
  email: string;
  rol: 'CLIENTE';
}

export interface RegisterClienteRequest {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
}

export interface InventarioResponse {
  id: number;
  productoNombre: string;
  productoSku: string;
  productoImagenUrl?: string;
  sedeNombre: string;
  precio: number;
  precioFinal: number;
  descuentoPorcentaje: number;
  stock: number;
  disponible: boolean;
}

export interface InventarioUpdateRequest {
  precio: number;
  descuentoPorcentaje: number;
  stock: number;
  disponible: boolean;
}

export interface ProductoResponse {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  categorias: { id: number; nombre: string }[];
}

export interface ProductoRequest {
  sku: string;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  categoriaIds: number[];
}

export interface CategoriaResponse {
  id: number;
  nombre: string;
}

export interface CategoriaRequest {
  nombre: string;
}

export interface UsuarioAdminResponse {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  sedeId: number | null;
  sedeNombre: string | null;
}

export interface UsuarioAdminRequest {
  email: string;
  nombre: string;
  password?: string;
  rol: string;
  sedeId: number | null;
}

export interface PedidoResponse {
  id: number;
  clienteNombre: string;
  clienteTelefono: string;
  total: number;
  estado: string;
  creadoEn: string;
}

export interface DireccionEntregaDTO {
  alias: string;
  direccion: string;
  ciudad: string;
  detalles: string;
}

export interface DetallePedidoAdminDTO {
  productoNombre: string;
  productoSku: string;
  cantidad: number;
  precioUnitario: number;
  notaPersonalizacion: string;
}

export interface PedidoAdminResponse {
  id: number;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  sedeNombre: string;
  metodoPago: string;
  referenciaPago: string;
  direccionEntrega: DireccionEntregaDTO;
  detalles: DetallePedidoAdminDTO[];
  total: number;
  costoEnvio: number;
  zonaDomicilioNombre: string;
  estado: string;
  transaccionId: string;
  creadoEn: string;
}

// Constantes de estados de pedido
export const ORDER_STATUSES = [
  "PENDIENTE_PAGO",
  "PAGADO",
 "EN_PREPARACION",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  EN_PREPARACION: "En preparación",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDIENTE_PAGO: "secondary",
  PAGADO: "default",
  EN_PREPARACION: "secondary",
  EN_CAMINO: "outline",
  ENTREGADO: "default",
  CANCELADO: "destructive",
};

// Tipos de Dirección para Checkout
export interface DireccionResponse {
  id: number;
  alias: string;
  direccion: string;
  ciudad: string;
  detalles: string | null;
  zonaDomicilioId: number;
  zonaDomicilioNombre: string;
}

export interface DireccionRequest {
  alias: string;
  direccion: string;
  ciudad: string;
  detalles?: string;
  zonaDomicilioId: number;
}

// Respuesta al crear un pedido desde Checkout
export interface CrearPedidoResponse {
  pedidoId: number;
  total: number;
  referenciaWompi: string;
  montoEnCentavos: number;
  firmaIntegridad: string;
  publicKeyWompi: string;
}

// Detalle de producto en el historial del cliente
export interface DetallePedidoHistorialDTO {
  productoNombre: string;
  productoSku: string;
  cantidad: number;
  precioUnitario: number;
  notaPersonalizacion: string;
}

// Historial de pedidos del cliente (enriquecido)
export interface PedidoHistorial {
  id: number;
  total: number;
  costoEnvio: number;
  zonaDomicilioNombre: string;
  estado: string;
  creadoEn: string;
  referenciaPago: string;
  sedeNombre: string;
  metodoPago: string;
  direccionEntrega: DireccionEntregaDTO;
  detalles: DetallePedidoHistorialDTO[];
}

export interface ActualizarPerfilRequest {
  nombre: string;
  telefono: string;
}

export interface ZonaDomicilioResponse {
  id: number;
  sedeId: number;
  localidad: string;
  barrio: string;
  precio: number;
}

export interface ZonaDomicilioRequest {
  sedeId: number;
  localidad: string;
  barrio?: string;
  precio: number;
}
