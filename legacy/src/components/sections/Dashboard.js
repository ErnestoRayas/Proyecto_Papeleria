import React, { useState, useEffect, useCallback } from 'react';
import { obtenerCarrito, obtenerEstadisticasDashboard } from '../../utils/carritoUtils';
import '../../Estilos/Dashboard.css';

const Dashboard = () => {
  const [showProveedores, setShowProveedores] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    clientesNuevos: 0,
    articulosStock: 0,
    ventasMensuales: 0
  });

  const dibujarGraficaBarras = useCallback((ctx, datos, color, titulo) => {
    const anchoBarra = 25;
    const separacion = 20;
    const maxAltura = 150;
    const maxValor = Math.max(...datos) || 1;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
 
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(titulo, ctx.canvas.width / 2, 15);

    datos.forEach((dato, i) => {
      const x = 40 + i * (anchoBarra + separacion);
      const h = (dato / maxValor) * maxAltura;
      ctx.fillStyle = color;
      ctx.fillRect(x, ctx.canvas.height - h - 30, anchoBarra, h);
      

      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(dato, x + anchoBarra / 2, ctx.canvas.height - h - 35);
    });
  }, []);

  const dibujarGraficaLineal = useCallback((ctx, datos, color, titulo) => {
    const maxAltura = 150;
    const maxValor = Math.max(...datos) || 1;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    

    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(titulo, ctx.canvas.width / 2, 15);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    datos.forEach((dato, i) => {
      const x = 40 + i * 40;
      const y = ctx.canvas.height - (dato / maxValor) * maxAltura - 40;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
 
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.stroke();
  }, []);

  const crearGraficasDashboard = useCallback(() => {
    setTimeout(() => {
      const datosClientes = [dashboardData.clientesNuevos, dashboardData.clientesNuevos + 2, dashboardData.clientesNuevos + 1];
      const datosArticulos = [dashboardData.articulosStock - 2, dashboardData.articulosStock - 1, dashboardData.articulosStock];
      const datosVentas = [dashboardData.ventasMensuales - 50, dashboardData.ventasMensuales - 25, dashboardData.ventasMensuales];

      const ctxClientes = document.getElementById("graficaClientes")?.getContext('2d');
      const ctxArticulos = document.getElementById("graficaArticulos")?.getContext('2d');
      const ctxVentas = document.getElementById("graficaVentas")?.getContext('2d');
      
      if (ctxClientes) dibujarGraficaLineal(ctxClientes, datosClientes, "#42a5f5", "Clientes");
      if (ctxArticulos) dibujarGraficaBarras(ctxArticulos, datosArticulos, "#ffb74d", "Artículos");
      if (ctxVentas) dibujarGraficaLineal(ctxVentas, datosVentas, "#66bb6a", "Ventas");
    }, 100);
  }, [dashboardData, dibujarGraficaBarras, dibujarGraficaLineal]);

  const actualizarDashboard = useCallback(() => {
    const estadisticas = obtenerEstadisticasDashboard();
    setDashboardData(estadisticas);
  }, []);

  useEffect(() => {
    actualizarDashboard();
    crearGraficasDashboard();
    
    const handleStorageChange = () => {
      actualizarDashboard();
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(actualizarDashboard, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [actualizarDashboard, crearGraficasDashboard]);

  if (showProveedores) {
    return <GestorProveedores onBack={() => setShowProveedores(false)} />;
  }

  return (
    <>
      <h2>Dashboard</h2>

      <div className="dashboard-actualizar">
        <button 
          onClick={actualizarDashboard}
          className="btn-actualizar"
        >
          🔄 Actualizar Dashboard
        </button>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>👥 Clientes Registrados</h3>
          <p className="card-number clientes">{dashboardData.clientesNuevos}</p>
          <canvas id="graficaClientes" width="180" height="180" className="card-canvas"></canvas>
        </div>

        <div className="dashboard-card">
          <h3>🛒 Artículos en Carritos</h3>
          <p className="card-number articulos">{dashboardData.articulosStock}</p>
          <p className="card-subtitle">Total en todos los carritos</p>
          <canvas id="graficaArticulos" width="150" height="180" className="card-canvas"></canvas>
        </div>

        <div className="dashboard-card">
          <h3>💰 Ventas Totales</h3>
          <p className="card-number ventas">${dashboardData.ventasMensuales}</p>
          <p className="card-subtitle">Valor total en carritos</p>
          <canvas id="graficaVentas" width="280" height="180" className="card-canvas"></canvas>
        </div>
      </div>

      <div className="dashboard-info">
        <h4>Información del Dashboard</h4>
        <div className="info-items">
          <div className="info-item">
            <strong>Carrito Actual:</strong> 
            <span className="info-valor carrito">
              {obtenerCarrito().reduce((sum, item) => sum + (item.qty || 0), 0)} artículos
            </span>
          </div>
          <div className="info-item">
            <strong>Usuarios Totales:</strong> 
            <span className="info-valor usuarios">
              {JSON.parse(localStorage.getItem("usuarios") || "[]").length}
            </span>
          </div>
          <div className="info-item">
            <strong>Inventario:</strong> 
            <span className="info-valor inventario">
              {JSON.parse(localStorage.getItem("inventario") || "[]").length} productos
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-proveedores">
        <button 
          onClick={() => setShowProveedores(true)}
          className="btn-proveedores"
        >
          👥 Ver Gestor de Proveedores
        </button>
      </div>
    </>
  );
};

const GestorProveedores = ({ onBack }) => {
  const [proveedores, setProveedores] = useState(JSON.parse(localStorage.getItem("proveedores")) || []);
  const [nombreProveedor, setNombreProveedor] = useState('');
  const [marcaProveedor, setMarcaProveedor] = useState('');
  const [ticketProveedor, setTicketProveedor] = useState(null);

  const productos = {
    "Proveedor Plumas": [
      { nombre: "PlumasBic", precio: 13, unidad: 20 },
      { nombre: "PlumasGel", precio: 12, unidad: 30 },
      { nombre: "Plumas Normas", precio: 17, unidad: 20 },
      { nombre: "Plumas PaperMate", precio: 17, unidad: 10 }
    ],
    "Proveedor Lápices": [
      { nombre: "LápizMaped", precio: 4, unidad: 30 },
      { nombre: "Lápiz Bic", precio: 5, unidad: 30 },
      { nombre: "LápizMap", precio: 7, unidad: 12 },
      { nombre: "Lápiz Premium", precio: 17, unidad: 12 }
    ],
    "Proveedor Colores": [
      { nombre: "ColoresPrismas", precio: 4, unidad: 12 },
      { nombre: "ColoresVidel", precio: 5, unidad: 30 },
      { nombre: "ColoresNorma", precio: 7, unidad: 12 },
      { nombre: "Colores", precio: 17, unidad: 14 }
    ],
    "Proveedor Lápices Adhesivos": [
      { nombre: "Prit Dixon", precio: 4, unidad: 11 },
      { nombre: "LapizPritt", precio: 5, unidad: 14 },
      { nombre: "PritBuy", precio: 7, unidad: 15 },
      { nombre: "Pritt", precio: 17, unidad: 16 }
    ],
        "Proveedor Engrapadoras": [
      { nombre: "Engrapadoras", precio: 4, unidad: 11 },
      { nombre: "Mini Engrapadora", precio: 5, unidad: 14 },
      { nombre: "Engrapadora grande", precio: 7, unidad: 15 },
      { nombre: "Engrapadorass", precio: 17, unidad: 16 }
    ],
  };

  const agregarProveedor = (e) => {
    e.preventDefault();
    if (nombreProveedor && marcaProveedor) {
      const nuevoProveedor = { nombre: nombreProveedor, marca: marcaProveedor };
      const nuevosProveedores = [...proveedores, nuevoProveedor];
      setProveedores(nuevosProveedores);
      localStorage.setItem("proveedores", JSON.stringify(nuevosProveedores));
      setNombreProveedor('');
      setMarcaProveedor('');
    } else {
      alert("Por favor completa todos los campos");
    }
  };

  const eliminarProveedor = (index) => {
    const nuevosProveedores = proveedores.filter((_, i) => i !== index);
    setProveedores(nuevosProveedores);
    localStorage.setItem("proveedores", JSON.stringify(nuevosProveedores));
    setTicketProveedor(null);
  };

  const verTicket = (proveedor) => {
    setTicketProveedor(proveedor);
  };

  return (
    <>
      <h2>Gestor de Proveedores de Marcas</h2>
      <div className="gestor-proveedores">
        <form onSubmit={agregarProveedor} className="form-proveedor">
          <label htmlFor="nombreProveedor">Nombre del proveedor:</label>
          <input 
            type="text" 
            id="nombreProveedor" 
            value={nombreProveedor}
            onChange={(e) => setNombreProveedor(e.target.value)}
            required 
          />
          
          <label htmlFor="marcaProveedor">Marca asociada:</label>
          <input 
            type="text" 
            id="marcaProveedor" 
            value={marcaProveedor}
            onChange={(e) => setMarcaProveedor(e.target.value)}
            required 
          />
          
          <button type="submit">Agregar Proveedor</button>
        </form>

        <h3>Lista de Proveedores</h3>
        <ul className="lista-proveedores">
          {proveedores.map((proveedor, index) => (
            <li key={index} className="proveedor-item">
              {proveedor.nombre} — Marca: {proveedor.marca}
              <button 
                onClick={() => eliminarProveedor(index)}
                className="btn-eliminar"
              >
                Eliminar
              </button>
              <button 
                onClick={() => verTicket(proveedor)}
                className="btn-ticket"
              >
                Ver Ticket
              </button>
            </li>
          ))}
        </ul>

        <h3>Ticket del proveedor seleccionado</h3>
        <div className="ticket-proveedor">
          {ticketProveedor ? (
            <>
              <h4>Ticket de {ticketProveedor.nombre}</h4>
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {(productos[ticketProveedor.nombre] || []).map((prod, idx) => (
                    <tr key={idx}>
                      <td>{prod.nombre}</td>
                      <td>${prod.precio}</td>
                      <td>{prod.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="ticket-total">
                Total: ${(productos[ticketProveedor.nombre] || []).reduce((acc, prod) => acc + prod.precio, 0)}
              </p>
            </>
          ) : (
            <p>Selecciona un proveedor para ver su ticket</p>
          )}
        </div>

        <button onClick={onBack} className="btn-volver">Volver al Dashboard</button>
      </div>
    </>
  );
};

export default Dashboard;
