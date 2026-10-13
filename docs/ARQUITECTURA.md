# Arquitectura de Papelería Karen

## Límites del proyecto

- `frontend/`: React, estilos, imágenes públicas y pruebas de interfaz.
- `backend/`: servidor Express, negocio, persistencia SQLite, CLI y pruebas de API.
- `shared/`: únicamente datos públicos comunes, actualmente el catálogo de ejemplo.
- `docs/` y `design-system/`: documentación técnica y visual.
- `legacy/`: referencia académica, fuera de la ejecución y de las pruebas actuales.

Existe un único `package.json` y lockfile en la raíz. Los comandos npm coordinan los dos lados y cargan `.env` desde la raíz. No se requieren instalaciones duplicadas ni workspaces para este tamaño de proyecto.

## Frontend

`src/App.jsx` compone la navegación. Las pantallas viven en `src/pages/`. Los componentes compartidos están bajo `src/components/`, agrupados en `ui`, `auth` y `products`.

- `hooks/useRemote.js`: carga de datos usada por pedidos y administración.
- `store/ShopContext.jsx`: sesión, catálogo, carrito y favoritos.
- `services/api.js`: transporte HTTP y tratamiento de respuestas de error.
- `utils/checkoutAttempt.js`: persistencia del intento de compra por cuenta en la pestaña.
- `styles/App.css`: estilos globales y responsive.

Las páginas usan los componentes compartidos, no importan componentes desde otra página. El frontend accede al backend exclusivamente por HTTP; no importa SQL, secretos ni archivos de `backend/`.

Vite usa `frontend/` como raíz, `frontend/public/` para archivos públicos y `frontend/dist/` para la compilación. Las pruebas se encuentran en `frontend/tests/`.

## Backend

El recorrido de una petición es:

```text
Petición HTTP
  → middleware de origen, límites y sesión
  → routes/ (método, URL, permisos y respuesta HTTP)
  → services/ (validaciones y reglas de negocio)
  → repositories/ (SQL parametrizado)
  → database/connection.cjs (SQLite)
```

`src/app.cjs` es el punto de composición: recibe una conexión, crea repositorios y servicios e instala las rutas. Los servicios no reciben `req` ni `res`. Los repositorios no deciden estados HTTP. Esto permite probar la API con una conexión SQLite en memoria.

### Responsabilidades

| Área | Servicio | Repositorios | Ruta |
| --- | --- | --- | --- |
| Registro, login y recuperación | `services/auth.cjs` | `users.cjs`, `sessions.cjs` | `routes/auth.cjs` |
| Catálogo e inventario | `services/products.cjs` | `products.cjs` | `routes/products.cjs` |
| Checkout e historial | `services/orders.cjs` | `orders.cjs`, `products.cjs` | `routes/orders.cjs` |
| Consulta de usuarios | Proyección pública directa | `users.cjs` | `routes/users.cjs` |

La consulta de usuarios es sencilla y no necesita una capa de servicio vacía. Las operaciones de CLI utilizan los mismos repositorios.

### Invariantes conservadas

- Una edición requiere la versión de producto que leyó el cliente; ventas y ediciones incrementan esa versión.
- La creación del pedido, las líneas y el descuento de existencias forman una única transacción síncrona.
- Un reintento de pedido con la misma clave y usuario devuelve el pedido registrado.
- La derivación asíncrona de contraseñas ocurre antes de abrir transacciones SQLite.
- Permisos, cookies, mensajes, códigos HTTP y rutas `/api/*` mantienen el contrato anterior.

La refactorización separa responsabilidades; los hallazgos pendientes de la revisión técnica siguen registrados en `REVISION_BACKEND_FRONTEND.md`.

## Equivalencias con la estructura anterior

| Ubicación anterior | Ubicación actual |
| --- | --- |
| `src/App.jsx` | `frontend/src/App.jsx` |
| `src/App.css` | `frontend/src/styles/App.css` |
| `src/components/shop/` | `frontend/src/pages/` y `frontend/src/components/` |
| `src/store/`, `src/services/`, `src/utils/` | Mismas carpetas bajo `frontend/src/` |
| `src/data/products.json` | `shared/data/products.json` |
| `src/App.test.jsx`, `src/setupTests.js` | `frontend/tests/` |
| `public/` | `frontend/public/` |
| `vite.config.mjs` | `frontend/vite.config.mjs` |
| `build/` | `frontend/dist/` |
| `server/app.cjs` | `backend/src/app.cjs`, `routes/`, `services/`, `repositories/`, `middleware/` |
| `server/database.cjs` | `backend/src/database/connection.cjs` |
| `server/security.cjs` | `backend/src/utils/security.cjs` |
| `server/index.cjs` | `backend/src/index.cjs` |
| `server/manage.cjs` | `backend/scripts/manage.cjs` |
| `server/*.test.cjs` | `backend/tests/` |
| `server/data/` | `backend/data/` |

## Operación

Desde la raíz: `npm start` inicia Vite y `npm run server` inicia Express. `npm run build` compila el frontend y Express sirve `frontend/dist/` cuando existe.

SQLite se ubica por defecto en `backend/data/papeleria.sqlite`. Una ruta configurada mediante `DB_PATH` tiene prioridad. La carpeta de datos, las dependencias, `.env` y las compilaciones se excluyen de Git. En Vercel se mantiene la raíz del repositorio y se publica `frontend/dist/`.
