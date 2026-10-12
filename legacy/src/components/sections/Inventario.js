import React, { useState, useEffect } from 'react';
import '../../Estilos/Inventario.css';

const Inventario = () => {
  const [inventario, setInventario] = useState([]);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState('');

  
  useEffect(() => {
    const cargarInventario = () => {
      try {
        const inventarioGuardado = localStorage.getItem("inventario");
        console.log('Datos crudos de localStorage:', inventarioGuardado); // 🔍 DEBUG
        
        if (inventarioGuardado) {
          const inventarioParseado = JSON.parse(inventarioGuardado);
          console.log('Inventario parseado:', inventarioParseado); // 🔍 DEBUG
          setInventario(inventarioParseado);
        } else {
          setInventario([]);
        }
      } catch (error) {
        console.error('Error cargando inventario:', error);
        setInventario([]);
      }
    };

    cargarInventario();
  }, []);

  const guardarInventario = (nuevoInventario) => {
    try {
      console.log('Guardando:', nuevoInventario); 
      localStorage.setItem("inventario", JSON.stringify(nuevoInventario));
      setInventario(nuevoInventario); 
     
      const verificado = localStorage.getItem("inventario");
      console.log('Verificado después de guardar:', verificado);
    } catch (error) {
      console.error('Error guardando inventario:', error);
      alert('Error al guardar el inventario');
    }
  };

  const agregarProducto = () => {
    const nombreTrim = nombre.trim();
    const precioNum = parseFloat(precio);
    const cantidadNum = parseInt(cantidad);

    if (!nombreTrim || isNaN(precioNum) || isNaN(cantidadNum)) {
      alert("Por favor completa todos los campos correctamente.");
      return;
    }

    if (precioNum < 0 || cantidadNum < 0) {
      alert("El precio y la cantidad deben ser números positivos.");
      return;
    }

    const nuevoProducto = {
      nombre: nombreTrim,
      precio: precioNum,
      cantidad: cantidadNum,
      id: Date.now() 
    };

    const inventarioActual = [...inventario];
    const existenteIndex = inventarioActual.findIndex(p => p.nombre.toLowerCase() === nombreTrim.toLowerCase());
    
    if (existenteIndex !== -1) {
      
      inventarioActual[existenteIndex].cantidad += cantidadNum;
      inventarioActual[existenteIndex].precio = precioNum;
    } else {
    
      inventarioActual.push(nuevoProducto);
    }

    guardarInventario(inventarioActual);

   
    setNombre('');
    setPrecio('');
    setCantidad('');

    alert(`✅ Producto "${nombreTrim}" agregado al inventario`);
  };

  const editarProducto = (index) => {
    const producto = inventario[index];
  
    const nuevoPrecio = prompt(
      `Editar "${producto.nombre}":\n\nPrecio unitario actual: $${producto.precio}\nCantidad actual: ${producto.cantidad} unidades\n\nNuevo precio:`, 
      producto.precio
    );
    
    if (nuevoPrecio === null) return;
    
    const nuevaCantidad = prompt(
      `Editar "${producto.nombre}":\n\nNueva cantidad:`,
      producto.cantidad
    );
    
    if (nuevaCantidad === null) return;
    
   
    const precioNum = parseFloat(nuevoPrecio);
    const cantidadNum = parseInt(nuevaCantidad);
    
    if (isNaN(precioNum) || precioNum < 0) {
      alert("Precio no válido. Debe ser un número positivo.");
      return;
    }
    
    if (isNaN(cantidadNum) || cantidadNum < 0) {
      alert("Cantidad no válida. Debe ser un número positivo.");
      return;
    }


    const inventarioActual = [...inventario];
    inventarioActual[index].precio = precioNum;
    inventarioActual[index].cantidad = cantidadNum;
    
    guardarInventario(inventarioActual);
    
    alert(`✅ "${producto.nombre}" actualizado:\n• Precio: $${precioNum.toFixed(2)}\n• Cantidad: ${cantidadNum} unidades`);
  };

  
  const editarPrecioProducto = (index) => {
    const producto = inventario[index];
    const nuevoPrecio = prompt(
      `Nuevo precio para "${producto.nombre}" (precio actual: $${producto.precio}):`,
      producto.precio
    );
    
    if (nuevoPrecio === null) return;
    
    const precioNum = parseFloat(nuevoPrecio);
    if (isNaN(precioNum) || precioNum < 0) {
      alert("Precio no válido. Debe ser un número positivo.");
      return;
    }

    const inventarioActual = [...inventario];
    inventarioActual[index].precio = precioNum;
    guardarInventario(inventarioActual);
    
    alert(`✅ Precio de "${producto.nombre}" actualizado a $${precioNum.toFixed(2)}`);
  };

  const editarCantidadProducto = (index) => {
    const producto = inventario[index];
    const nuevaCantidad = prompt(
      `Nueva cantidad para "${producto.nombre}" (cantidad actual: ${producto.cantidad}):`,
      producto.cantidad
    );
    
    if (nuevaCantidad === null) return;
    
    const cantidadNum = parseInt(nuevaCantidad);
    if (isNaN(cantidadNum) || cantidadNum < 0) {
      alert("Cantidad no válida. Debe ser un número positivo.");
      return;
    }

    const inventarioActual = [...inventario];
    inventarioActual[index].cantidad = cantidadNum;
    guardarInventario(inventarioActual);
    
    alert(`✅ Cantidad de "${producto.nombre}" actualizada a ${cantidadNum} unidades`);
  };

  const eliminarProducto = (index) => {
    const producto = inventario[index];
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${producto.nombre}" del inventario?`)) {
      const inventarioActual = inventario.filter((_, i) => i !== index);
      guardarInventario(inventarioActual);
      alert(`✅ Producto "${producto.nombre}" eliminado del inventario`);
    }
  };

  const reiniciarInventario = () => {
    if (window.confirm("¿Estás seguro de que quieres reiniciar todo el inventario? Se perderán todos los datos.")) {
      localStorage.removeItem("inventario");
      setInventario([]);
      alert("✅ Inventario reiniciado");
    }
  };

  const totalValorInventario = inventario.reduce((sum, prod) => sum + (prod.precio * prod.cantidad), 0);
  const totalProductos = inventario.reduce((sum, prod) => sum + prod.cantidad, 0);

  return (
    <>
      <h2>Inventario de Productos</h2>
      
      <div className="inventario-resumen">
        <div className="resumen-item">
          <h4>Total Productos</h4>
          <p className="resumen-total">{inventario.length}</p>
        </div>
        <div className="resumen-item">
          <h4>Unidades Totales</h4>
          <p className="resumen-unidades">{totalProductos}</p>
        </div>
        <div className="resumen-item">
          <h4>Valor Total</h4>
          <p className="resumen-valor">${totalValorInventario.toFixed(2)}</p>
        </div>
      </div>
      <div className="formulario-inventario">
        <h3>Agregar Nuevo Producto</h3>
        <div className="formulario-campos">
          <input 
            type="text" 
            placeholder="Nombre del producto"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="campo-nombre"
          />
          <input 
            type="number" 
            placeholder="Precio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="campo-precio"
          />
          <input 
            type="number" 
            placeholder="Cantidad"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="campo-cantidad"
          />
          <button 
            onClick={agregarProducto}
            className="btn-agregar"
          >
            ➕ Agregar
          </button>
        </div>
      </div>

      <table className="tabla-inventario">
        <thead>
          <tr className="tabla-header">
            <th>Nombre</th>
            <th>Precio Unitario</th>
            <th>Cantidad</th>
            <th>Valor Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {inventario.length === 0 ? (
            <tr>
              <td colSpan="5" className="tabla-vacia">
                No hay productos en el inventario
              </td>
            </tr>
          ) : (
            inventario.map((prod, i) => (
              <tr key={i} className="fila-producto">
                <td className="celda-nombre">{prod.nombre}</td>
                <td className="celda-precio">
                  ${(prod.precio ?? 0).toFixed(2)}
    
                </td>
                <td className="celda-cantidad">
                  <span className={`badge-cantidad ${prod.cantidad <= 5 ? 'bajo-stock' : 'stock-normal'}`}>
                    {prod.cantidad} unidades
                  </span>
 
                </td>
                <td className="celda-valor-total">
                  ${(((prod.precio ?? 0) * prod.cantidad) || 0).toFixed(2)}
                </td>
                <td className="celda-acciones">
                  <button 
                    onClick={() => editarProducto(i)}
                    className="btn-editar"
                    title="Editar precio y cantidad"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => eliminarProducto(i)}
                    className="btn-eliminar"
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {inventario.length > 0 && (
        <div className="reiniciar-container">
          <button 
            onClick={reiniciarInventario}
            className="btn-reiniciar"
          >
            🔄 Reiniciar Inventario
          </button>
        </div>
      )}
    </>
  );
};

export default Inventario;
