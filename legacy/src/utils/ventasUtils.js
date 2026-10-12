
export const obtenerVentas = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('ventas')) || [];
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    return [];
  }
};

export const guardarVentas = (ventas) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('ventas', JSON.stringify(ventas));
  } catch (error) {
    console.error('Error al guardar ventas:', error);
  }
};

export const registrarVenta = (venta) => {
  const ventas = obtenerVentas();
  const nuevaVenta = {
    id: Date.now().toString(),
    fecha: new Date().toISOString(),
    ...venta
  };
  
  ventas.unshift(nuevaVenta); 
  guardarVentas(ventas);
  return nuevaVenta;
};

export const obtenerVentasPorCliente = (cliente) => {
  const ventas = obtenerVentas();
  return ventas.filter(venta => venta.cliente === cliente);
};

export const obtenerTotalVentas = () => {
  const ventas = obtenerVentas();
  return ventas.reduce((total, venta) => total + venta.total, 0);
};

export const obtenerVentasDelDia = () => {
  const ventas = obtenerVentas();
  const hoy = new Date().toDateString();
  return ventas.filter(venta => new Date(venta.fecha).toDateString() === hoy);
};
