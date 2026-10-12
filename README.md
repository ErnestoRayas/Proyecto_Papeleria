# Papelería Karen

Proyecto universitario modernizado con **React 19 + Vite**, una interfaz adaptable y una **API Express + SQLite**. El catálogo se puede explorar sin cuenta; los pedidos requieren una sesión y se preparan para **recoger y pagar en tienda**.

## Qué incluye

- Diseño editorial en verde, crema y terracota; navegación móvil, foco visible, formularios etiquetados, diálogos nativos y mensajes de estado accesibles.
- Catálogo con búsqueda tolerante a acentos, categorías, disponibilidad, orden por precio y carga progresiva.
- Imágenes locales WebP: los 16 recursos del catálogo pesan aproximadamente **548 KB en conjunto**.
- Carrito y favoritos separados por cuenta. La selección del visitante se conserva al registrarse o iniciar sesión.
- Checkout con datos del cliente, comprobante e historial de pedidos. Los reintentos de la misma solicitud no duplican el pedido.
- Administración: alta, edición y retiro de productos; inventario, pedidos, indicadores y consulta de usuarios.
- Editor de tarjetas personalizadas con descarga PNG.
- Contraseñas con `scrypt` y salt, sesiones persistentes con cookies HttpOnly, roles verificados en la API y recuperación con códigos de un solo uso.
- Transacciones SQLite: precio y total se calculan en el servidor; el stock se descuenta **al confirmar el pedido**, nunca al añadir al carrito.

### Revisión con UI UX Pro Max

La interfaz incorpora una segunda revisión centrada en legibilidad y facilidad de compra:

- Texto base e inputs de 16 px, botones del catálogo de al menos 44 × 44 CSS px y acciones de compra con texto visible.
- Ficha de producto con imagen, descripción, precio, existencias y acceso al carrito.
- Categorías distribuidas en varias filas y filtros activos removibles individualmente.
- Cantidades seleccionadas visibles y bloqueo de agregado al alcanzar las existencias.
- Bienvenida compacta en móvil, avisos con acción «Ver carrito» y temporizador pausado durante su interacción.
- Conservación del foco al buscar desde otra sección, cierre del menú con Escape y navegación de teclado contenida en los diálogos.

Las decisiones y las recomendaciones consultadas están en [`design-system/papeleria-karen/MASTER.md`](design-system/papeleria-karen/MASTER.md).

## Ejecutar localmente

Necesitas **Node.js 22.13 o superior**; se recomienda Node.js 24 LTS.

```bash
git clone https://github.com/ErnestoRayas/REACT.git
cd REACT
npm ci
```

Abre dos terminales en el directorio del proyecto:

```bash
# Terminal 1: API y base de datos
npm run server
```

```bash
# Terminal 2: frontend
npm start
```

Visita **http://localhost:3000**. Vite redirige `/api` a `http://localhost:3001`. La base de datos se crea automáticamente en `server/data/papeleria.sqlite`, con los 16 productos iniciales. Sus precios y cantidades son datos de ejemplo y pueden editarse en el inventario.

Las cuentas de clientes se crean desde **Mi cuenta → Crear una cuenta**. No existen contraseñas de administrador predefinidas.

### Crear un administrador

En PowerShell, define una contraseña propia de entre 10 y 128 caracteres:

```powershell
$env:ADMIN_PASSWORD = 'reemplaza-con-tu-contraseña'
npm run admin:create -- Ernesto ernesto@example.com
Remove-Item Env:ADMIN_PASSWORD
```

En macOS/Linux:

```bash
ADMIN_PASSWORD='reemplaza-con-tu-contraseña' npm run admin:create -- Ernesto ernesto@example.com
```

Después inicia sesión con el usuario creado. Verás **Panel**, **Inventario**, **Usuarios** y los pedidos de todos los clientes. Las cuentas registradas en la interfaz siempre reciben el rol de cliente.

### Recuperar una contraseña

La recuperación necesita un código emitido por el operador del servidor tras comprobar la identidad del titular:

```bash
npm run password:token -- Ernesto
```

Entrega el código al titular por un canal privado. En **Mi cuenta → Olvidé mi contraseña**, introduce el código y una contraseña nueva. El código vence en **30 minutos**, solo se puede usar una vez y el cambio revoca las sesiones anteriores. No hay un servicio de envío de correo configurado.

## Configuración

Puedes crear `.env` usando `.env.example` como referencia:

| Variable | Valor predeterminado | Uso |
| --- | --- | --- |
| `PORT` | `3001` | Puerto de la API y del servidor web compilado |
| `APP_ORIGIN` | `http://localhost:3000` | Origen exacto autorizado para las escrituras |
| `DB_PATH` | `server/data/papeleria.sqlite` | Ruta persistente de la base de datos |
| `NODE_ENV` | desarrollo | Usa `production` en el despliegue HTTPS |
| `VITE_API_URL` | `/api` | Prefijo de API del frontend; se aplica al compilar |

El frontend y la API trabajan bajo **el mismo origen**. En desarrollo lo resuelve el proxy de Vite; en producción Express sirve tanto `build/` como `/api`. No se habilita CORS para sesiones entre dominios.

## Compilar y desplegar

```bash
npm run build
npm run server
```

Después de compilar, el servidor también sirve el frontend en **http://localhost:3001**. Para probar cuentas y pedidos desde esa dirección, configura `APP_ORIGIN=http://localhost:3001` en `.env`.

Para el despliegue completo, usa un servicio Node.js con disco persistente:

1. Ejecuta `npm ci` y `npm run build`.
2. Configura `NODE_ENV=production`, `APP_ORIGIN=https://tu-dominio.com` y `DB_PATH` dentro del volumen persistente.
3. Inicia con `npm run server`, bajo HTTPS.
4. Crea la cuenta administrativa con la herramienta CLI apuntando a esa misma base de datos.

SQLite es apropiado para una instancia de servidor con volumen persistente. Un despliegue horizontal requiere una base de datos compartida y adaptar la capa de persistencia.

### Vista previa en Vercel

`vercel.json` configura la compilación Vite y el directorio `build`. Un despliegue solamente estático muestra el catálogo de ejemplo, el editor de tarjetas, el carrito y los favoritos. La interfaz identifica este estado como **Vista de muestra** y deshabilita la confirmación de pedidos. Para operar con cuentas y pedidos se necesita el servidor persistente y una ruta `/api` en el mismo origen; SQLite local no se utiliza como almacenamiento persistente en funciones serverless.

## Verificaciones

```bash
npm test
npm run test:api
npm run build
npm audit
```

Las pruebas cubren navegación del catálogo, filtros, carrito, favoritos, acceso, checkout, vista sin API y permisos; en la API cubren autenticación, sesiones, recuperación, validaciones, inventario, idempotencia y compras simultáneas de la última unidad. Las pruebas del backend usan bases SQLite en memoria.

La revisión UI/UX también se comprobó en Chrome a 320, 375, 768, 1024 y 1440 px: reflujo sin desbordamiento horizontal, teclado, foco, movimiento reducido, filtros largos y ajustes de espaciado de texto. La revisión automática de accesibilidad no detectó infracciones en las vistas comprobadas de catálogo, ficha de producto, menú móvil, carrito y acceso; se complementó con pruebas de interacción.

## Estructura

```text
src/
  main.jsx                   # Punto de entrada Vite
  App.jsx                    # Navegación y composición de la interfaz
  App.css                    # Sistema visual y variantes responsive
  components/shop/           # Catálogo, cuenta, carrito, pedidos y administración
  store/ShopContext.jsx      # Estado compartido y persistencia local del carrito
  services/api.js            # Cliente HTTP y manejo de errores
  data/products.json         # Catálogo inicial y procedencia de las imágenes
server/
  app.cjs                    # Rutas, permisos, validación y transacciones
  database.cjs               # Esquema SQLite e inicialización
  security.cjs               # Contraseñas y tokens
  manage.cjs                 # Administración de cuentas y recuperación
  index.cjs                  # Arranque del servidor
  app.test.cjs               # Pruebas de integración
public/products/             # Imágenes optimizadas
legacy/                      # Prototipo académico original, fuera del bundle
```

### Datos de la versión anterior

El código académico se conserva en `legacy/`. Sus claves antiguas de `localStorage` no se utilizan ni se borran. Las cuentas, contraseñas, existencias y ventas antiguas no se importan automáticamente a SQLite: las cuentas se crean de nuevo y el catálogo se configura desde el inventario. Los carritos nuevos utilizan claves `pk:v1:*` y no almacenan contraseñas ni tokens de sesión.

## Información institucional

| Campo | Información |
| --- | --- |
| Institución | Tecnológico Nacional de México · Campus Tláhuac |
| Carrera | Ingeniería en Sistemas Computacionales |
| Materia | Desarrollo FrontEnd |
| Docente | Padilla Juarez Jacqueline |
| Alumnos | Arenas Olvera Jorge Eduardo; Molotla Colin Aangel Kaleb; Rayas Batalla Ernesto Adrian; Rodriguez Castro Alfredo; Sanchez Toriz Victor Eduardo |
| Grupo | 7S1 |
| Semestre | 8 Semestre |
| Periodo | Agosto–Diciembre |
