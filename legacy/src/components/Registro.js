import React, { useState } from 'react';

const Registro = ({ onBackToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (registrarUsuario(username, password)) {
      onBackToLogin();
    }
  };

  const registrarUsuario = (username, password) => {
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    const existe = usuarios.some(u => u.username === username);
    
    if (existe) {
      alert("El usuario ya existe");
      return false;
    }

    const nuevo = { username, password, tipo: "comprador" };
    usuarios.push(nuevo);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    alert(`Usuario ${username} creado correctamente`);
    return true;
  };

  return (
    <div className="login-container">
      <h2>Registrar Usuario</h2>
      <form id="registro-form" onSubmit={handleSubmit}>
        <label htmlFor="nuevoUsername">Usuario:</label>
        <input 
          type="text" 
          id="nuevoUsername" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required 
        />
        
        <label htmlFor="nuevoPassword">Contraseña:</label>
        <input 
          type="password" 
          id="nuevoPassword" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
        />
        
        <button type="submit">Crear</button>
      </form>
      <p></p>
      <button onClick={onBackToLogin}>Volver al login</button>
    </div>
  );
};

export default Registro;
