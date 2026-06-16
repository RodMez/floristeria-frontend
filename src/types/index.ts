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
  sedeNombre: string;
  precio: number;
  stock: number;
  disponible: boolean;
}

export interface InventarioUpdateRequest {
  precio: number;
  stock: number;
  disponible: boolean;
}

export interface ProductoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  categorias: { id: number; nombre: string }[];
}

export interface ProductoRequest {
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

// Tipos de Dirección para Checkout
export interface DireccionResponse {
  id: number;
  alias: string;
  direccion: string;
  ciudad: string;
  detalles: string | null;
}

export interface DireccionRequest {
  alias: string;
  direccion: string;
  ciudad: string;
  detalles?: string;
}

// Respuesta al crear un pedido desde Checkout
export interface CrearPedidoResponse {
  pedidoId: number;
  total: number;
}
