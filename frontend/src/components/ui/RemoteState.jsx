import React from 'react';

export default function RemoteState({ error, loading, retry }) {
  if (loading) return <div className="panel loading-state" role="status">Cargando información…</div>;
  if (error) return <div className="empty-state panel"><p role="alert">{error}</p><button className="button secondary" onClick={retry}>Reintentar</button></div>;
  return null;
}
