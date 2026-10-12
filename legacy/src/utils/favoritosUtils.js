
export const obtenerFavoritos = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('favoritos')) || [];
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    return [];
  }
};

export const guardarFavoritos = (favoritos) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    window.dispatchEvent(new Event('favoritosActualizados'));
  } catch (error) {
    console.error('Error al guardar favoritos:', error);
  }
};

export const agregarAFavoritos = (producto) => {
  const favoritos = obtenerFavoritos();
  
  const existe = favoritos.some(item => item.nombre === producto.nombre);
  
  if (!existe) {
    favoritos.push({
      ...producto,
      fechaAgregado: new Date().toISOString()
    });
    guardarFavoritos(favoritos);
    return true;
  }
  return false;
};

export const eliminarDeFavoritos = (nombreProducto) => {
  const favoritos = obtenerFavoritos();
  const nuevosFavoritos = favoritos.filter(item => item.nombre !== nombreProducto);
  guardarFavoritos(nuevosFavoritos);
  return nuevosFavoritos;
};

export const estaEnFavoritos = (nombreProducto) => {
  const favoritos = obtenerFavoritos();
  return favoritos.some(item => item.nombre === nombreProducto);
};
