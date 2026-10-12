
export const obtenerCarrito = () => {
  const username = localStorage.getItem("loggedIn");
  return JSON.parse(localStorage.getItem(`carrito_${username}`)) || [];
};

export const guardarCarrito = (carrito) => {
  const username = localStorage.getItem("loggedIn");
  localStorage.setItem(`carrito_${username}`, JSON.stringify(carrito));
};

export const actualizarContadorCarrito = (setCarritoCount) => {
  const carrito = obtenerCarrito();
  const totalItems = carrito.reduce((sum, item) => sum + (item.qty || 0), 0);
  if (setCarritoCount) {
    setCarritoCount(totalItems);
  }
  return totalItems;
};

export const obtenerInventario = () => {
  return JSON.parse(localStorage.getItem("inventario")) || [];
};

export const guardarInventario = (inventario) => {
  localStorage.setItem("inventario", JSON.stringify(inventario));
};

export const obtenerTodosLosCarritos = () => {
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  let todosLosCarritos = [];
  
  usuarios.forEach(usuario => {
    const carritoUsuario = JSON.parse(localStorage.getItem(`carrito_${usuario.username}`)) || [];
    todosLosCarritos = todosLosCarritos.concat(carritoUsuario);
  });
  
  return todosLosCarritos;
};


export const obtenerEstadisticasDashboard = () => {
  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  const clientesCompradores = usuarios.filter(u => u.tipo === "comprador").length;
  
  const todosLosCarritos = obtenerTodosLosCarritos();
  const articulosTotales = todosLosCarritos.reduce((sum, item) => sum + (item.qty || 0), 0);
  const ventasTotales = todosLosCarritos.reduce((sum, item) => sum + (item.price * (item.qty || 0)), 0);
  
  return {
    clientesNuevos: clientesCompradores,
    articulosStock: articulosTotales,
    ventasMensuales: ventasTotales
  };
};
