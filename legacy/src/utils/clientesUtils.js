
export const obtenerClientes = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('clientes')) || [];
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return [];
  }
};

export const guardarClientes = (clientes) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('clientes', JSON.stringify(clientes));
  } catch (error) {
    console.error('Error al guardar clientes:', error);
  }
};

export const agregarCliente = (cliente) => {
  const clientes = obtenerClientes();
  

  const existe = clientes.some(c => c.email === cliente.email);
  
  if (!existe) {
    const nuevoCliente = {
      id: Date.now().toString(),
      fechaRegistro: new Date().toISOString(),
      ...cliente
    };
    
    clientes.push(nuevoCliente);
    guardarClientes(clientes);
    return nuevoCliente;
  }
  return null;
};

export const buscarClientePorEmail = (email) => {
  const clientes = obtenerClientes();
  return clientes.find(cliente => cliente.email === email);
};
