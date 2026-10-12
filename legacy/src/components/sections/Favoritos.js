import React, { useState, useEffect } from 'react';
import { obtenerFavoritos, eliminarDeFavoritos } from '../../utils/favoritosUtils';
import { obtenerCarrito, guardarCarrito, obtenerInventario, guardarInventario } from '../../utils/carritoUtils';
import { notificacionExito, notificacionError, notificacionCarrito, notificacionInfo } from '../../utils/notificacionesUtils';
import '../../Estilos/Favoritos.css';

const Favoritos = ({ onUpdateFavoritos }) => {
  const [favoritos, setFavoritos] = useState([]);
  const [inventario, setInventario] = useState([]);

  useEffect(() => {
    const sincronizarDatos = () => {
      const favoritosActual = obtenerFavoritos();
      const inventarioActual = obtenerInventario();
      
      const favoritosActualizados = favoritosActual.map(favorito => {
        const productoInventario = inventarioActual.find(prod => prod.nombre === favorito.nombre);
        if (productoInventario && productoInventario.precio !== favorito.price) {
          return {
            ...favorito,
            price: productoInventario.precio 
          };
        }
        return favorito;
      });
      

      if (JSON.stringify(favoritosActualizados) !== JSON.stringify(favoritosActual)) {
        localStorage.setItem('favoritos', JSON.stringify(favoritosActualizados));
      }
      
      setFavoritos(favoritosActualizados);
      setInventario(inventarioActual);
    };

    sincronizarDatos();


    window.addEventListener('storage', sincronizarDatos);
    window.addEventListener('favoritosActualizados', sincronizarDatos);
    

    const interval = setInterval(sincronizarDatos, 1000);
    
    return () => {
      window.removeEventListener('storage', sincronizarDatos);
      window.removeEventListener('favoritosActualizados', sincronizarDatos);
      clearInterval(interval);
    };
  }, []);

  const eliminarFavorito = (nombreProducto) => {
    eliminarDeFavoritos(nombreProducto);
    setFavoritos(obtenerFavoritos());
    onUpdateFavoritos?.();
    window.dispatchEvent(new Event('favoritosActualizados'));
    notificacionExito('Favorito Eliminado', `${nombreProducto} eliminado de favoritos`);
  };

  const agregarAlCarrito = (producto) => {
    const carrito = obtenerCarrito();
    const inventarioActual = obtenerInventario();
  
    const productoInventario = inventarioActual.find(prod => prod.nombre === producto.nombre);
    if (!productoInventario || productoInventario.cantidad < 1) {
      notificacionError('Sin Stock', `No hay stock disponible de ${producto.nombre}`);
      return;
    }

    const itemExistente = carrito.find(item => item.name === producto.nombre);
    
    if (itemExistente) {
      if (productoInventario.cantidad > itemExistente.qty) {
        itemExistente.qty += 1;
      } else {
        notificacionError(
          'Stock Insuficiente', 
          `Solo hay ${productoInventario.cantidad} unidades disponibles de ${producto.nombre}`
        );
        return;
      }
    } else {
      carrito.push({
        name: producto.nombre,
        qty: 1,
        price: producto.price, 
        img: producto.img
      });
    }


    const inventarioActualizado = inventarioActual.map(prod => 
      prod.nombre === producto.nombre 
        ? { ...prod, cantidad: prod.cantidad - 1 }
        : prod
    );

    guardarInventario(inventarioActualizado);
    guardarCarrito(carrito);
    setInventario(inventarioActualizado);
    
    window.dispatchEvent(new Event('storage'));
    onUpdateFavoritos?.();
    
    notificacionCarrito(
      'Producto Agregado', 
      `${producto.nombre} agregado al carrito\nPrecio: $${producto.price}\nStock restante: ${productoInventario.cantidad - 1}`
    );
  };

  const vaciarFavoritos = () => {
    localStorage.setItem('favoritos', JSON.stringify([]));
    setFavoritos([]);
    onUpdateFavoritos?.();
    window.dispatchEvent(new Event('favoritosActualizados'));
    notificacionInfo('Lista Vacía', 'Todos los favoritos han sido eliminados');
  };

  if (favoritos.length === 0) {
    return (
      <>
        <h2>Favoritos</h2>
        <div className="favoritos-vacio">
          <h3>Tu lista de favoritos está vacía</h3>
          <p>Agrega productos a favoritos para verlos aquí</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="favoritos-header">
        <h2>Favoritos ({favoritos.length})</h2>
      </div>

      <div className="favoritos-container">
        {favoritos.map((item, index) => {
          const productoInventario = inventario.find(prod => prod.nombre === item.nombre);
          const stockDisponible = productoInventario ? productoInventario.cantidad : 0;
          const sinStock = stockDisponible <= 0;

          return (
            <div 
              key={index}
              className={`favorito-card ${sinStock ? 'sin-stock' : ''}`}
            >
              <img 
                src={item.img} 
                alt={item.nombre} 
                className="favorito-imagen"
              />
              
              <h3 className="favorito-nombre">
                {item.nombre}
              </h3>
              
              <p className="favorito-precio">
                ${item.price} 
              </p>
              
              <div className={`favorito-stock ${sinStock ? 'sin-stock' : stockDisponible <= 5 ? 'bajo-stock' : 'en-stock'}`}>
                {sinStock ? '❌ SIN STOCK' : 
                 stockDisponible <= 5 ? `⚠️ Últimas ${stockDisponible}` : 
                 `📦 Stock: ${stockDisponible}`}
              </div>

              <div className="favorito-acciones">
                <button 
                  onClick={() => agregarAlCarrito(item)}
                  disabled={sinStock}
                  className={`btn-agregar-carrito ${sinStock ? 'deshabilitado' : ''}`}
                >
                  {sinStock ? '❌ Agotado' : '🛒 Carrito'}
                </button>
                
                <button 
                  onClick={() => eliminarFavorito(item.nombre)}
                  className="btn-eliminar-favorito"
                  title="Eliminar de favoritos"
                >
                  ❌
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="vaciar-container">
        <button 
          onClick={vaciarFavoritos}
          className="btn-vaciar-favoritos"
        >
          🗑️ Vaciar Lista
        </button>
      </div>
    </>
  );
};

export default Favoritos;
