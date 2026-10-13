# Papelería Karen — sistema de interfaz

## Contexto

Tienda web de papelería para clientes de escuela, oficina y manualidades, desarrollada con React 19 y CSS. El flujo principal es explorar → revisar un producto → añadir al carrito → registrar un pedido para recoger y pagar en tienda.

## Identidad visual

- Primario: `#234f43`; interacción: `#183b31`.
- Texto: `#263c34`; texto secundario: `#5e695f`.
- Fondo: `#faf9f6`; superficie de bienvenida: `#f1eadc`; acento: `#b56043`.
- Tipografía de interfaz: DM Sans con fallback del sistema.
- Titulares editoriales: DM Serif Display con fallback Georgia.
- Los titulares pueden reacomodarse naturalmente: `text-wrap: balance` es una mejora progresiva, no una garantía de saltos de línea concretos.

## Legibilidad y controles

- Texto base e inputs: 16 px. Texto secundario del catálogo: 14 px en escritorio. Metadatos: 11–13 px, con contraste suficiente.
- Los nombres de productos no se truncan. Valores inesperadamente largos pueden dividirse con `overflow-wrap: anywhere`.
- Controles principales: mínimo 44 × 44 CSS px por comodidad táctil. Esta es una decisión de usabilidad, no una equivalencia con las unidades nativas de iOS/Android ni una afirmación de certificación WCAG.
- Formularios con etiquetas visibles; búsqueda y filtros conservan el foco mientras se escribe.
- Foco visible, estados seleccionados programáticos y textos descriptivos junto a las acciones.
- Transiciones de 160–220 ms; `prefers-reduced-motion` las desactiva.

## Catálogo y compra

- Categorías visibles en varias filas; no requieren desplazamiento horizontal para descubrir opciones.
- Filtros activos identificables y removibles individualmente, con limpieza conjunta.
- Conteo de resultados con contexto y una región de estado atómica.
- Nombre del producto como control de acceso a la ficha, con precio, descripción, existencias y condiciones de recogida.
- Acción de compra con texto «Agregar», indicador de cantidad seleccionada y bloqueo al alcanzar las existencias disponibles.
- Aviso de agregado con acceso al carrito; su temporizador se pausa cuando se interactúa con él.
- En móvil, tarjetas compactas de dos columnas; la descripción completa está disponible en la ficha. A 360 px o menos, una sola columna.
- Bienvenida compacta en móvil para acercar el catálogo al inicio de la página.

## Accesibilidad de interacción

- Diálogos nativos con nombres únicos, cierre por Escape y devolución del foco al control que los abrió.
- Menú móvil cerrable con Escape o clic exterior; Escape devuelve el foco al botón de menú.
- Errores de acceso anunciados y enfocados después de una respuesta fallida.
- Iconos decorativos ocultos para tecnología asistiva; controles con nombre accesible.
- Mensajes y estados comprensibles sin depender exclusivamente del color.

## Criterios de revisión

- Legibilidad: texto base e inputs de tamaño suficiente y contraste medido.
- Etiquetas y filtros: categorías visibles, valores completos y mensajes contextualizados.
- Interacción táctil: controles cómodos para pantallas pequeñas.
- Navegación: HTML semántico, diálogos nativos y conservación del foco durante búsquedas.

La revisión automática se complementa con comprobación de teclado, tamaños de pantalla, texto largo y movimiento reducido.
