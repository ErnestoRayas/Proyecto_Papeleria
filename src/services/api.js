const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method, credentials: 'same-origin', signal,
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'PapeleriaKaren' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No pudimos conectar con la tienda. Revisa tu conexión e inténtalo de nuevo.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const error = new Error(data?.message || 'El servidor no está disponible. Inténtalo de nuevo.');
    error.status = response.status;
    throw error;
  }
  return data;
}
