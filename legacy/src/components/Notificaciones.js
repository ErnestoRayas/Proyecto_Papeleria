
import React from 'react';

const Notificaciones = () => {
  return (
    <div id="notificaciones-container" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '350px'
    }}>
    </div>
  );
};

export default Notificaciones;
