import React, { useState, useEffect } from 'react';
import '../../Estilos/GestionUsuarios.css';

const GestionUsuarios = ({ onBack }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(null);

  useEffect(() => {
    const usuariosGuardados = JSON.parse(localStorage.getItem("usuarios")) || [];
    const usuarioLoggeado = JSON.parse(localStorage.getItem("usuarioActual"));
    
    setUsuarios(usuariosGuardados);
    setUsuarioActual(usuarioLoggeado);
  }, []);

  const eliminarUsuario = (username) => {
    if (username === usuarioActual?.username) {
      alert("❌ No puedes eliminar tu propio usuario");
      return;
    }

    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"?`)) {
      const usuariosActualizados = usuarios.filter(u => u.username !== username);
      setUsuarios(usuariosActualizados);
      localStorage.setItem("usuarios", JSON.stringify(usuariosActualizados));
      
    
      localStorage.removeItem(`carrito_${username}`);
      localStorage.removeItem(`tarjetas_${username}`);
      
      alert(`✅ Usuario "${username}" eliminado correctamente`);
    }
  };

  const cambiarTipoUsuario = (username, nuevoTipo) => {
    if (username === usuarioActual?.username) {
      alert("❌ No puedes cambiar tu propio tipo de usuario");
      return;
    }

    const usuariosActualizados = usuarios.map(u => 
      u.username === username ? { ...u, tipo: nuevoTipo } : u
    );
    
    setUsuarios(usuariosActualizados);
    localStorage.setItem("usuarios", JSON.stringify(usuariosActualizados));
    
    alert(`✅ Usuario "${username}" ahora es ${nuevoTipo}`);
  };

  const crearUsuarioAdmin = () => {
    const username = prompt("Ingresa el nombre de usuario para el nuevo admin:");
    if (!username) return;

    const password = prompt("Ingresa la contraseña:");
    if (!password) return;

    const usuarioExistente = usuarios.find(u => u.username === username);
    if (usuarioExistente) {
      alert("❌ El usuario ya existe");
      return;
    }

    const nuevoUsuario = {
      username,
      password,
      tipo: "admin"
    };

    const usuariosActualizados = [...usuarios, nuevoUsuario];
    setUsuarios(usuariosActualizados);
    localStorage.setItem("usuarios", JSON.stringify(usuariosActualizados));
    
    alert(`✅ Nuevo admin "${username}" creado correctamente`);
  };

  const usuariosCompradores = usuarios.filter(u => u.tipo === "comprador");
  const usuariosAdmins = usuarios.filter(u => u.tipo === "admin");

  return (
    <div className="gestion-usuarios-container">

      <header className="gestion-usuarios-header">
        <h2>👥 Gestión de Usuarios</h2>
        <p>Administra los usuarios del sistema</p>
      </header>


      <div className="resumen-usuarios">
        <div className="resumen-item">
          <h3>Total Usuarios</h3>
          <p className="resumen-total">{usuarios.length}</p>
        </div>
        <div className="resumen-item">
          <h3>Compradores</h3>
          <p className="resumen-compradores">{usuariosCompradores.length}</p>
        </div>
        <div className="resumen-item">
          <h3>Administradores</h3>
          <p className="resumen-admins">{usuariosAdmins.length}</p>
        </div>
      </div>

  
      <div className="crear-admin-container">
        <button 
          onClick={crearUsuarioAdmin}
          className="btn-crear-admin"
        >
          👑 Crear Nuevo Administrador
        </button>
      </div>

      <div className="usuarios-listas-container">

        <div className="lista-administradores">
          <h3>👑 Administradores ({usuariosAdmins.length})</h3>
          {usuariosAdmins.length === 0 ? (
            <div className="lista-vacia">
              No hay administradores en el sistema
            </div>
          ) : (
            <div className="usuarios-grid">
              {usuariosAdmins.map((usuario, index) => (
                <div key={index} className="usuario-card admin-card">
                  <div className="usuario-header">
                    <div className="usuario-info">
                      <strong>👤 {usuario.username}</strong>
                      <br />
                      <span className="badge-admin">
                        ADMINISTRADOR
                      </span>
                    </div>
                    {usuario.username !== usuarioActual?.username && (
                      <button 
                        onClick={() => eliminarUsuario(usuario.username)}
                        className="btn-eliminar"
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </div>
                  {usuario.username !== usuarioActual?.username && (
                    <div className="usuario-acciones">
                      <button 
                        onClick={() => cambiarTipoUsuario(usuario.username, 'comprador')}
                        className="btn-convertir-comprador"
                      >
                        🔄 Convertir a Comprador
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lista-compradores">
          <h3>🛒 Compradores ({usuariosCompradores.length})</h3>
          {usuariosCompradores.length === 0 ? (
            <div className="lista-vacia">
              No hay compradores en el sistema
            </div>
          ) : (
            <div className="usuarios-grid">
              {usuariosCompradores.map((usuario, index) => (
                <div key={index} className="usuario-card comprador-card">
                  <div className="usuario-header">
                    <div className="usuario-info">
                      <strong>👤 {usuario.username}</strong>
                      <br />
                      <span className="badge-comprador">
                        COMPRADOR
                      </span>
                    </div>
                    <button 
                      onClick={() => eliminarUsuario(usuario.username)}
                      className="btn-eliminar"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                  <div className="usuario-acciones">
                    <button 
                      onClick={() => cambiarTipoUsuario(usuario.username, 'admin')}
                      className="btn-convertir-admin"
                    >
                      👑 Convertir a Administrador
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="volver-container">
        <button 
          onClick={onBack}
          className="btn-volver"
        >
          ↩️ Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default GestionUsuarios;
