// Prototipo académico original. No se importa en la aplicación actual.
import React, { useState } from 'react';

const Login = ({ onLoginSuccess, onShowRegistro, onShowRecuperar }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuarioEncontrado = usuariosGuardados.find(u => u.username === username && u.password === password);

    if (usuarioEncontrado) {
      localStorage.setItem("loggedIn", username);
      localStorage.setItem("usuarioActual", JSON.stringify(usuarioEncontrado));

      if (!localStorage.getItem(`carrito_${username}`)) {
        localStorage.setItem(`carrito_${username}`, JSON.stringify([]));
      }
      
      onLoginSuccess();
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      <form id="login-form" onSubmit={handleSubmit}>
        <label htmlFor="username">Usuario:</label>
        <input 
          type="text" 
          id="username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required 
        />
        
        <label htmlFor="password">Contraseña:</label>
        <input 
          type="password" 
          id="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
        />
        
        <button type="submit">Ingresar</button>
      </form>

      <p>¿No tienes cuenta? <button onClick={onShowRegistro}>Regístrate</button></p>
      <p>¿Olvidaste tu contraseña? <button onClick={onShowRecuperar}>Restablecer</button></p>
    </div>
  );
};

export default Login;
