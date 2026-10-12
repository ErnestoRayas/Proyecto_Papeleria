import React, { useState } from 'react';

const Recuperar = ({ onBackToLogin }) => {
  const [usuario, setUsuario] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    let usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];
    const index = usuariosGuardados.findIndex(u => u.username === usuario.trim());

    if (index !== -1) {
      usuariosGuardados[index].password = nuevaPassword.trim();
      localStorage.setItem("usuarios", JSON.stringify(usuariosGuardados));
      alert("Contraseña actualizada correctamente");
      onBackToLogin();
    } else {
      alert("Usuario no encontrado");
    }
  };

  return (
    <div className="login-container">
      <h2>Restablecer Contraseña</h2>
      <form id="recuperar-form" onSubmit={handleSubmit}>
        <label htmlFor="usuarioRecuperar">Usuario:</label>
        <input 
          type="text" 
          id="usuarioRecuperar" 
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required 
        />

        <label htmlFor="nuevaPassword">Nueva Contraseña:</label>
        <input 
          type="password" 
          id="nuevaPassword" 
          value={nuevaPassword}
          onChange={(e) => setNuevaPassword(e.target.value)}
          required 
        />

        <button type="submit">Actualizar Contraseña</button>
      </form>
      <p></p>
      <button onClick={onBackToLogin}>Volver al login</button>
    </div>
  );
};

export default Recuperar;
