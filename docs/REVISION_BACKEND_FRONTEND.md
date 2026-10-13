# Revisión de backend y rendimiento frontend — Papelería Karen

Fecha: 12 de octubre de 2026. Base revisada: commit `94fec41`.

**Nota de estructura:** las referencias de código de esta revisión corresponden al árbol anterior a la separación en `frontend/` y `backend/`. Consulta [ARQUITECTURA.md](ARQUITECTURA.md) para localizar las responsabilidades actuales. Las líneas citadas son históricas.

## Resumen

Se encontraron **9 hallazgos: 2 de prioridad alta, 5 media y 2 baja**. Los dos de mayor prioridad afectan la consistencia del inventario y los reintentos de pedidos.

**Actualización de implementación:** B01 y F01 ya están corregidos localmente. Se añadió una migración de versiones de producto y guardado condicional; el checkout conserva la clave y el payload pendiente por cuenta en la misma pestaña. La verificación actual comprende **17 pruebas frontend y 12 de API/migración aprobadas**. En Chrome se comprobó que dos respuestas perdidas, dos recargas y tres envíos de la misma compra producen un solo pedido, y que una edición anterior a una venta no restaura el stock. Los demás hallazgos conservan el estado pendiente.

La revisión abarca tres áreas:

- Backend Node.js: middleware, errores, organización del servidor y acceso a datos.
- Diseño de API: contratos HTTP, concurrencia, idempotencia, paginación y consultas.
- Rendimiento React: carga de datos, renderizado, almacenamiento síncrono y entrega del bundle.

La revisión incluye análisis del código, **12 pruebas frontend y 8 de API aprobadas**, reproducciones HTTP con SQLite en memoria y comprobaciones con Chrome/Playwright. Los hallazgos se contrastaron con escenarios adicionales a la suite existente.

## Hallazgos

### B01 — Alta: una edición antigua del inventario puede deshacer una venta

**Código:** [server/app.cjs:161–165](../server/app.cjs#L161-L165), [Admin.jsx:11–21](../src/components/shop/Admin.jsx#L11-L21).

El editor envía el precio y las existencias completas que leyó al abrirse. El `PUT` sobrescribe ambos campos sin comprobar que el producto conserve esa versión.

**Reproducción confirmada:**

1. El administrador lee un producto con 20 unidades.
2. Un cliente confirma un pedido; las existencias bajan a 19.
3. El administrador guarda un cambio de precio desde el editor que seguía abierto.
4. El servidor responde `200` y vuelve a dejar **20 unidades**.

**Impacto:** se repone artificialmente una unidad vendida; varios editores o ventas intercaladas pueden provocar ajustes incorrectos y sobreventa posterior.

**Recomendación:** incorporar control de concurrencia con `version` o `ETag`/`If-Match` y una actualización condicional que devuelva `409`/`412` cuando la versión cambie. Separar las modificaciones de precio/descripción de los ajustes de stock evita que una edición de metadatos reescriba existencias ajenas.

**Regresión necesaria:** abrir una edición, confirmar una venta y comprobar que guardar la edición antigua no restaura las unidades vendidas.

### F01 — Alta: una respuesta perdida seguida de una recarga duplica el pedido

**Código:** [Cart.jsx:10](../src/components/shop/Cart.jsx#L10), [Cart.jsx:19–36](../src/components/shop/Cart.jsx#L19-L36), [server/app.cjs:125–126](../server/app.cjs#L125-L126).

La API deduplica las solicitudes que reutilizan `requestKey`, pero el frontend guarda esa clave únicamente en un `useRef`. La clave desaparece cuando el componente se vuelve a montar o se recarga la página.

**Reproducción confirmada en navegador:** el servidor registra el pedido, se interrumpe la respuesta antes de llegar al cliente, se recarga el carrito y se confirma de nuevo. Se generan **dos claves distintas y dos pedidos para una compra pretendida**.

**Impacto:** pedidos y descuentos de inventario duplicados, aunque el cliente haya visto un error de conexión en el primer intento.

**Recomendación:** persistir la clave y el payload de un intento pendiente, asociados a la cuenta y al intento lógico de compra; recuperarlos tras una recarga y resolver el resultado antes de iniciar otro intento. Limpiar el intento al obtener una respuesta definitiva. Revisar también el caso de navegar fuera del carrito y volver.

**Regresión necesaria:** simular pérdida de respuesta después del commit del servidor, recargar y reintentar; debe seguir existiendo un solo pedido.

### B02 — Media: una misma clave de idempotencia acepta contenidos diferentes

**Código:** [server/app.cjs:125–126](../server/app.cjs#L125-L126).

Si ya existe un pedido con la clave, se devuelve sin comparar su contenido con la nueva solicitud.

**Reproducción confirmada:** primera solicitud con una unidad → `201`; segunda solicitud con la misma clave y dos unidades → `200`, devolviendo el pedido original de una unidad.

**Impacto:** el consumidor recibe una respuesta de éxito para un contenido distinto del solicitado y el contrato de reintentos queda ambiguo.

**Recomendación:** almacenar una huella de un payload normalizado y responder con un conflicto identificable si la misma clave se reutiliza con otro contenido. Mantener la devolución del pedido original cuando se trate de un reintento idéntico.

### B03 — Media: consultar la sesión consume el límite de intentos de acceso

**Código:** [server/app.cjs:37–38](../server/app.cjs#L37-L38), [server/app.cjs:65](../server/app.cjs#L65).

El límite de 40 solicitudes cada 15 minutos se aplica a todas las rutas `/api/auth`, incluyendo `GET /auth/me` y el cierre de sesión.

**Reproducción confirmada:** la consulta número 41 a `/auth/me` desde una IP devuelve `429`, mientras `/products` sigue devolviendo `200`.

**Impacto:** recargas normales, varias pestañas o varios clientes bajo la misma conexión consumen el cupo pensado para operaciones de autenticación. También puede bloquearse el logout.

**Recomendación:** limitar explícitamente login, registro y recuperación, y definir un límite apropiado para las consultas de sesión. Comprobar la identificación de clientes en la configuración real del proxy de despliegue.

**Cobertura actual:** las pruebas de API crean normalmente la aplicación con `limits: false` en [app.test.cjs:10](../server/app.test.cjs#L10); se necesita una prueba con el limitador real activo.

### F02 — Media: un fallo de sesión sustituye un catálogo válido por datos de muestra

**Código:** [ShopContext.jsx:58–68](../src/store/ShopContext.jsx#L58-L68).

La carga inicial agrupa catálogo y sesión con `Promise.all`. El rechazo de cualquiera lleva al mismo fallback y descarta un catálogo que pudo haberse obtenido correctamente.

**Reproducción confirmada:** `/products` entrega el producto a **$199.00**, `/auth/me` devuelve `429`, y la interfaz muestra el catálogo de muestra con **$95.00**, además del aviso de muestra y el bloqueo de confirmación.

**Impacto:** una incidencia de sesión se transforma en una indisponibilidad de compra y en la presentación de precios de ejemplo, aunque la API de productos esté funcionando.

**Recomendación:** mantener las peticiones paralelas, pero resolver sus resultados independientemente, por ejemplo con `Promise.allSettled`. Usar el fallback únicamente cuando falle el catálogo; tratar una sesión no disponible como un estado de acceso separado y conservar los precios reales.

### B04 — Media: el historial descarga todo y ejecuta una consulta por pedido

**Código:** [server/app.cjs:57–60](../server/app.cjs#L57-L60), [server/app.cjs:107–109](../server/app.cjs#L107-L109), [Orders.jsx:30–32](../src/components/shop/Orders.jsx#L30-L32), [Admin.jsx:37–41](../src/components/shop/Admin.jsx#L37-L41).

La ruta devuelve el historial completo y `orderView` prepara y ejecuta una consulta de líneas por cada pedido. Cada visita al panel vuelve a cargar estos datos para calcular los indicadores en el cliente.

**Medición con datos sintéticos:** 104 pedidos devueltos → **106 consultas SELECT**, incluyendo la consulta de sesión; respuesta JSON de **21,469 bytes**. Enviar `?limit=5` no limita el resultado porque la API no implementa paginación.

El plan de consulta para el historial de un usuario sí usa el índice generado por `UNIQUE(user_id, request_key)`, pero necesita una estructura temporal para ordenar por fecha. No se trata de una ausencia total de índices.

**Impacto:** el trabajo y el tamaño de respuesta crecen con el historial; SQLite síncrono ejecuta ese trabajo en el hilo principal del servidor.

**Recomendación:** implementar paginación con límites validados, cargar las líneas de la página en una consulta agrupada y añadir un índice apropiado para filtro/orden temporal. Obtener los indicadores globales del panel mediante agregaciones SQL en un endpoint de resumen; una suma de la página actual no representa el total histórico.

### F03 — Media: el servidor Express entrega el bundle sin compresión ni caché duradera

**Código:** [server/app.cjs:174–177](../server/app.cjs#L174-L177).

**Medición del servidor Express local sirviendo `build/`:**

| Dato | Resultado |
| --- | ---: |
| JavaScript inicial sin comprimir | 229,191 bytes |
| Tamaño equivalente calculado con gzip | 72,629 bytes |
| Cabecera `Content-Encoding` | Ausente |
| Cabecera `Cache-Control` | `public, max-age=0` |

La reducción potencial de transferencia con gzip en esta medición es de aproximadamente **68 %**. `max-age=0` permite revalidación con ETag; no equivale a ausencia absoluta de caché.

**Recomendación:** comprobar o activar gzip/Brotli en Express o en el proxy/CDN, y configurar caché larga con `immutable` para `/assets/` con hash. Mantener una política distinta para `index.html` y conservar `no-store` para sesión y respuestas privadas de API.

Esta medición corresponde al servidor Express local; un despliegue estático en Vercel u otro CDN puede tener una política de compresión diferente.

### F04 — Baja: los avisos vuelven a renderizar todo el catálogo

**Código:** [ShopContext.jsx:36–49](../src/store/ShopContext.jsx#L36-L49), [ShopContext.jsx:109](../src/store/ShopContext.jsx#L109), [Catalog.jsx:22–25](../src/components/shop/Catalog.jsx#L22-L25), [ShopContext.jsx:6](../src/store/ShopContext.jsx#L6).

Catálogo, carrito, sesión y avisos comparten un único contexto cuyo objeto se crea de nuevo en cada render del provider. Pausar el temporizador de un aviso cambia ese contexto aunque los productos no hayan cambiado.

**Observación instrumentada en navegador:** pasar el puntero sobre el aviso vuelve a renderizar las **8 tarjetas visibles**. En desarrollo con `React.StrictMode` se observaron **16 llamadas a ProductCard y 16 nuevas instancias de Intl.NumberFormat**. El duplicado de llamadas es una comprobación de desarrollo de React y no representa un número medido en producción.

**Recomendación:** separar el estado de avisos del estado de compra/catálogo, estabilizar callbacks y valores de los providers correspondientes, y reutilizar una instancia de `Intl.NumberFormat`. Evaluar memoización en componentes costosos después de aislar sus dependencias.

Con 16 productos y 8 tarjetas visibles, la prioridad es baja. No se midió un problema de INP ni se establece una latencia de usuario a partir de este contador de renders.

### F05 — Baja: la restauración de sesión deja lecturas síncronas repetidas de storage

**Código:** [ShopContext.jsx:19–25](../src/store/ShopContext.jsx#L19-L25), [ShopContext.jsx:32](../src/store/ShopContext.jsx#L32).

Cuando la sesión inicial cambia la clave de visitante a cuenta, el estado `record` puede conservar la clave anterior hasta que se modifica esa lista. Mientras tanto, `readList` se ejecuta durante los renders para recuperar el valor de la nueva clave.

**Observación instrumentada:** tras restaurar una sesión y agregar al carrito, pausar un aviso provocó **2 lecturas síncronas adicionales** de storage en desarrollo, asociadas a la lista de favoritos todavía no modificada.

**Recomendación:** sincronizar el registro en memoria al cambiar la clave, evitando guardar el estado de la cuenta anterior durante la transición; conservar el listener `storage` y las protecciones de lectura/escritura existentes.

## Aspectos que ya están bien resueltos

- Consultas SQL con parámetros y control de roles en el servidor.
- Transacciones de pedidos y protección de la última unidad frente a dos compras simultáneas.
- Total calculado en centavos y comprobación de precios en el servidor.
- Hash de contraseñas con salt, cookies HttpOnly, expiración y revocación de sesiones.
- Código de recuperación de un solo uso.
- Inyección de la base de datos en `createApp`, útil para pruebas aisladas.
- Carga paralela inicial, aunque necesita manejo independiente de errores.
- Secciones de carrito, pedidos, tarjetas y administración cargadas con `React.lazy`.
- Imágenes locales WebP, carga diferida y dimensiones explícitas.
- Carrito y favoritos con claves versionadas y datos mínimos en almacenamiento local.
- La configuración actual no incorpora bibliotecas de animación o UI pesadas en el bundle inicial.

## Orden recomendado de trabajo

1. Corregir **B01** y **F01**, con pruebas de regresión de concurrencia y pérdida de respuesta.
2. Aclarar el contrato de reintentos **B02** y separar el limitador y la carga de sesión **B03/F02**.
3. Implementar paginación, consultas agrupadas e indicadores agregados **B04**.
4. Ajustar la entrega de assets **F03** en el entorno real de despliegue.
5. Separar el contexto y estabilizar almacenamiento/formateadores **F04/F05**, volviendo a medir los renders.
6. Documentar el contrato final en OpenAPI, con códigos de error estables, límites y conflictos de versión/idempotencia. Las rutas ya usan nombres de recursos; no hace falta cambiar el stack para aplicar estas mejoras.

## Método y alcance de las mediciones

- Suite existente: `npm test` → 12 aprobadas; `npm run test:api` → 8 aprobadas.
- Reproducciones HTTP y de checkout contra dos instancias temporales con SQLite `:memory:`.
- Pruebas de pérdida de respuesta mediante interceptación de red en Chrome/Playwright.
- Medición de renders en el frontend de desarrollo mediante instrumentación de respuestas JavaScript en un contexto de navegador aislado. Las peticiones de catálogo y sesión de esa medición se sustituyeron por fixtures.
- Medición de compresión y caché sobre el build existente de la versión revisada.
- Se documentan conteos y tamaños observados; no se ejecutó una prueba de carga sostenida ni una medición de Core Web Vitals del sitio público.

Este documento conserva la revisión original sobre `94fec41`. B01 y F01 cuentan con las correcciones y verificaciones descritas en la actualización inicial; los otros siete hallazgos siguen pendientes de implementación.
