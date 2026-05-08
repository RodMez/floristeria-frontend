## Arquitectura Frontend (Next.js)

El Frontend está diseñado para maximizar el SEO público, minimizar los costos de servidor y ofrecer una experiencia de administración en tiempo real.

### 1 Estrategia de Renderizado (App Router)
- **Server-Side Rendering (SSR):** Utilizado en la Vitrina Pública (`/[sede]/catalogo`). Next.js hace el fetching directamente al Backend en el servidor de Vercel, entregando HTML pre-renderizado para un SEO perfecto y carga instantánea.
- **Client-Side Rendering (CSR):** Utilizado estrictamente para interactividad (Botones de carrito, modales) y para los Paneles de Administración (`/admin`), donde el SEO no es relevante pero la reactividad y la seguridad (JWT) son críticas.

### 2 Manejo de Estado y Fetching
- **Estado Global (Zustand):** Se utiliza Zustand para el Carrito de Compras y la Autenticación. Es más ligero y rápido que Context API, evitando re-renderizados innecesarios.
- **Fetching Público:** `fetch` nativo de Next.js en Server Components.
- **Fetching Privado (Admin):** `SWR` (State-While-Revalidate) para las tablas de inventario y pedidos. Permite mutaciones optimistas y actualización en tiempo real sin recargar la página.

### 3 Sistema de UI
- **Tailwind CSS:** Para el estilado base y diseño responsivo (Mobile-first).
- **shadcn/ui:** Colección de componentes headless integrados directamente en el código fuente. Se utiliza para construir rápidamente modales, tablas, formularios y menús accesibles en el panel de administración sin reinventar la rueda.

### Hoja de Ruta de Desarrollo (Roadmap)

*   **[ ] Fase 9: Frontend - Slice 1 (Setup & Core UI).** Inicializar Next.js, Tailwind, shadcn/ui, Zustand y Layout principal.
*   **[ ] Fase 9: Frontend - Slice 2 (Vitrina Pública).** Selector de Sede, fetching SSR de productos y catálogo.
*   **[ ] Fase 9: Frontend - Slice 3 (Carrito & Checkout).** Lógica Zustand, Drawer del carrito y enlace a WhatsApp.
*   **[ ] Fase 9: Frontend - Slice 4 (Auth & Seguridad).** Login, JWT en cookies, Middleware y Layout Admin.
*   **[ ] Fase 9: Frontend - Slice 5 (Admin Sede).** Tabla de inventario local (SWR), mutaciones de precio/stock y vista de pedidos.
*   **[ ] Fase 9: Frontend - Slice 6 (Superadmin).** Formulario maestro de productos, subida a ImageKit y gestión de usuarios/sedes.
