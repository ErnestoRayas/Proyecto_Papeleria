import React, { useState, useEffect } from 'react';
import { obtenerVentas, obtenerVentasPorCliente, obtenerTotalVentas, obtenerVentasDelDia } from '../../utils/ventasUtils';
import { obtenerClientes } from '../../utils/clientesUtils';
import '../../Estilos/RegistroVentas.css';

const RegistroVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = () => {
    setVentas(obtenerVentas());
    setClientes(obtenerClientes());
  };

  const filtrarVentas = () => {
    let ventasFiltradas = obtenerVentas();

    if (filtroCliente) {
      ventasFiltradas = obtenerVentasPorCliente(filtroCliente);
    }

    if (fechaInicio) {
      ventasFiltradas = ventasFiltradas.filter(venta => 
        new Date(venta.fecha) >= new Date(fechaInicio)
      );
    }

    if (fechaFin) {
      ventasFiltradas = ventasFiltradas.filter(venta => 
        new Date(venta.fecha) <= new Date(fechaFin + 'T23:59:59')
      );
    }

    setVentas(ventasFiltradas);
  };

  const limpiarFiltros = () => {
    setFiltroCliente('');
    setFechaInicio('');
    setFechaFin('');
    cargarDatos();
  };

  const formatearFecha = (fechaISO) => {
    return new Date(fechaISO).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ventasDelDia = obtenerVentasDelDia();
  const totalGeneral = obtenerTotalVentas();
  const totalFiltrado = ventas.reduce((sum, venta) => sum + venta.total, 0);

  return (
    <>
      <h2 className="ventas-titulo">Registro de Ventas</h2>

      <div className="estadisticas-ventas">
        <div className="estadistica-card total-general">
          <h3>💰 Total General</h3>
          <p className="estadistica-valor">${totalGeneral.toFixed(2)}</p>
        </div>

        <div className="estadistica-card ventas-hoy">
          <h3>📅 Ventas Hoy</h3>
          <p className="estadistica-valor">{ventasDelDia.length}</p>
          <p className="estadistica-subvalor">${ventasDelDia.reduce((sum, v) => sum + v.total, 0).toFixed(2)}</p>
        </div>

        <div className="estadistica-card total-clientes">
          <h3>👥 Total Clientes</h3>
          <p className="estadistica-valor">{clientes.length}</p>
        </div>
      </div>


      <div className="filtros-ventas">
        <h3>🔍 Filtros</h3>
        <div className="filtros-container">
          <div className="filtro-grupo">
            <label>Cliente:</label>
            <select 
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="filtro-select"
            >
              <option value="">Todos los clientes</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.nombre}>
                  {cliente.nombre} ({cliente.email})
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Desde:</label>
            <input 
              type="date" 
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="filtro-input"
            />
          </div>

          <div className="filtro-grupo">
            <label>Hasta:</label>
            <input 
              type="date" 
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="filtro-input"
            />
          </div>

          <button 
            onClick={filtrarVentas}
            className="btn-filtrar"
          >
            🔍 Aplicar Filtros
          </button>

          <button 
            onClick={limpiarFiltros}
            className="btn-limpiar"
          >
            🗑️ Limpiar
          </button>
        </div>

        {ventas.length > 0 && (
          <div className="total-filtrado">
            📈 Total filtrado: ${totalFiltrado.toFixed(2)} ({ventas.length} ventas)
          </div>
        )}
      </div>


<div className="historial-ventas">
  <h3>📋 Historial de Ventas</h3>
  
  {ventas.length === 0 ? (
    <div className="sin-ventas">
      <p>No hay ventas registradas</p>
    </div>
  ) : (
    <div className="lista-ventas-horizontal">
      {ventas.map((venta) => (
        <div 
          key={venta.id}
          className="venta-card-horizontal"
        >
          <div className="venta-header-horizontal">
            <div className="venta-id-horizontal">
              <strong>🆔 Venta #{venta.id.slice(-6)}</strong>
            </div>
            <div className="venta-fecha-horizontal">
              <small>📅 {formatearFecha(venta.fecha)}</small>
            </div>
          </div>

          <div className="venta-cliente-horizontal">
            <div className="cliente-info">
              <strong>👤 {venta.cliente}</strong>
              <br />
              <small>📧 {venta.clienteEmail}</small>
            </div>
          </div>

          <div className="venta-productos-horizontal">
            <strong>🛍️ Productos ({venta.items})</strong>
            <div className="productos-lista-horizontal">
              {venta.productos.map((producto, index) => (
                <div key={index} className="producto-item-horizontal">
                  <span className="producto-nombre">{producto.nombre}</span>
                  <span className="producto-detalle">
                    x{producto.cantidad} - ${producto.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="venta-total-horizontal">
            <div className="total-monto-horizontal">
              ${venta.total.toFixed(2)}
            </div>
            <div className="total-items-horizontal">
              {venta.items} productos
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
    </>
  );
};

export default RegistroVentas;
