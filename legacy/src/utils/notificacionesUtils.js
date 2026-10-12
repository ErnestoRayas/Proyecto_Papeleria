
export const TIPOS_NOTIFICACION = {
  EXITO: 'exito',
  ERROR: 'error',
  ADVERTENCIA: 'advertencia',
  INFO: 'info',
  FAVORITO: 'favorito',
  CARRITO: 'carrito'
};

export const estilosNotificacion = {
  [TIPOS_NOTIFICACION.EXITO]: {
    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
    icono: '✅',
    borderColor: '#2E7D32'
  },
  [TIPOS_NOTIFICACION.ERROR]: {
    background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
    icono: '❌',
    borderColor: '#c62828'
  },
  [TIPOS_NOTIFICACION.ADVERTENCIA]: {
    background: 'linear-gradient(135deg, #ffa726, #fb8c00)',
    icono: '⚠️',
    borderColor: '#ef6c00'
  },
  [TIPOS_NOTIFICACION.INFO]: {
    background: 'linear-gradient(135deg, #29b6f6, #0288d1)',
    icono: 'ℹ️',
    borderColor: '#0277bd'
  },
  [TIPOS_NOTIFICACION.FAVORITO]: {
    background: 'linear-gradient(135deg, #e91e63, #c2185b)',
    icono: '❤️',
    borderColor: '#ad1457'
  },
  [TIPOS_NOTIFICACION.CARRITO]: {
    background: 'linear-gradient(135deg, #ff9800, #f57c00)',
    icono: '🛒',
    borderColor: '#e65100'
  }
};

const cerrarNotificacion = (id) => {
  const notificacion = document.getElementById(id);
  if (notificacion) {
    const elemento = notificacion.querySelector('div');
    elemento.style.transform = 'translateX(400px)';
    elemento.style.opacity = '0';
    
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
      }
    }, 500);
  }
};

export const mostrarNotificacion = (titulo, mensaje, tipo = TIPOS_NOTIFICACION.INFO, duracion = 4000) => {
  const container = document.getElementById('notificaciones-container');
  if (!container) {
    console.warn('Contenedor de notificaciones no encontrado');
    return;
  }

  const estilos = estilosNotificacion[tipo] || estilosNotificacion[TIPOS_NOTIFICACION.INFO];
  const id = 'notificacion-' + Date.now();

  const notificacion = document.createElement('div');
  notificacion.id = id;
  notificacion.innerHTML = `
    <div style="
      background: ${estilos.background};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      border-left: 4px solid ${estilos.borderColor};
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 280px;
      max-width: 350px;
      transform: translateX(400px);
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
    ">
      <div style="
        font-size: 24px;
        animation: bounce 0.6s ease;
      ">${estilos.icono}</div>
      <div style="flex: 1;">
        <div style="
          font-weight: bold;
          font-size: 15px;
          margin-bottom: 4px;
          font-family: 'Comic Sans MS', cursive;
        ">${titulo}</div>
        <div style="
          font-size: 13px;
          opacity: 0.9;
          font-family: 'Comic Sans MS', cursive;
          white-space: pre-line;
        ">${mensaje}</div>
      </div>
      <button style="
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.3s;
      ">×</button>
      <div style="
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255,255,255,0.8);
        width: 100%;
        transform: scaleX(1);
        transform-origin: left;
        animation: progreso ${duracion}ms linear;
      "></div>
    </div>
  `;

  const closeButton = notificacion.querySelector('button');
  closeButton.addEventListener('click', () => cerrarNotificacion(id));

  if (!document.getElementById('notificaciones-estilos')) {
    const estilosCSS = document.createElement('style');
    estilosCSS.id = 'notificaciones-estilos';
    estilosCSS.innerHTML = `
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-5px); }
        60% { transform: translateY(-3px); }
      }
      @keyframes progreso {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
      }
    `;
    document.head.appendChild(estilosCSS);
  }

  container.appendChild(notificacion);

  setTimeout(() => {
    const elementoNotificacion = notificacion.querySelector('div');
    if (elementoNotificacion) {
      elementoNotificacion.style.transform = 'translateX(0)';
      elementoNotificacion.style.opacity = '1';
    }
  }, 100);

  setTimeout(() => {
    cerrarNotificacion(id);
  }, duracion);

  return id;
};

export const notificacionExito = (titulo, mensaje, duracion = 4000) => {
  return mostrarNotificacion(titulo, mensaje, TIPOS_NOTIFICACION.EXITO, duracion);
};

export const notificacionError = (titulo, mensaje, duracion = 4000) => {
  return mostrarNotificacion(titulo, mensaje, TIPOS_NOTIFICACION.ERROR, duracion);
};

export const notificacionAdvertencia = (titulo, mensaje, duracion = 4000) => {
  return mostrarNotificacion(titulo, mensaje, TIPOS_NOTIFICACION.ADVERTENCIA, duracion);
};

export const notificacionInfo = (titulo, mensaje, duracion = 4000) => {
  return mostrarNotificacion(titulo, mensaje, TIPOS_NOTIFICACION.INFO, duracion);
};

export const notificacionFavorito = (titulo, mensaje, duracion = 3000) => {
  return mostrarNotificacion(titulo, mensaje, TIPOS_NOTIFICACION.FAVORITO, duracion);
};

export const notificacionCarrito = (titulo, mensaje, duracion = 3000) => {
  return mostrarNotificacion(titulo, mensaje, TIPOS_NOTIFICACION.CARRITO, duracion);
};
