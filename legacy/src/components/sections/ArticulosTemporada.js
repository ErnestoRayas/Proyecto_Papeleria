import React from 'react';
import '../../Estilos/ArticulosTemporada.css';

const ArticulosTemporada = () => {
  const productosNavidad = [
    { 
      nombre: "Esferas Navideñas", 
      precio: "$45", 
      descripcion: "Set de 12 esferas brillantes",
      imagen: "https://i.postimg.cc/JzVYmPW1/214620-d.jpg",
      stock: "Disponible"
    },
    { 
      nombre: "Luces LED Navideñas", 
      precio: "$120", 
      descripcion: "Tira de luces multicolor 5m",
      imagen: "https://i.postimg.cc/d0H4YgpH/Imagen-Lucez.jpg",
      stock: "Disponible"
    },
    { 
      nombre: "Árbol de Navidad", 
      precio: "$650", 
      descripcion: "Árbol artificial 1.80m",
      imagen: "https://i.postimg.cc/s2tv0QhT/813arlp-Ns-SL.jpg",
      stock: "Últimas unidades"
    },
    { 
      nombre: "Corona Navideña", 
      precio: "$85", 
      descripcion: "Corona para puerta con adornos",
      imagen: "https://i.postimg.cc/kMygWhT5/71Nf-URFBXAL-AC-UF894-1000-QL80.jpg",
      stock: "Disponible"
    },
    { 
      nombre: "Bolsa Navideña", 
      precio: "$35", 
      descripcion: "Pack de 4 calcetines para regalos",
      imagen: "https://i.postimg.cc/59LBr4Y6/descarga-removebg-preview.png",
      stock: "Disponible"
    },
    { 
      nombre: "Villancicos CD", 
      precio: "$60", 
      descripcion: "Colección de villancicos clásicos",
      imagen: "https://i.postimg.cc/RFMjmGK0/D-NQ-NP-855813-MLM89486942505-082025-O.webp",
      stock: "Disponible"
    },
    { 
      nombre: "Papel Navideño", 
      precio: "$60", 
      descripcion: "Papel Navideño 4 en paquetes",
      imagen: "https://i.postimg.cc/LXf1GDsQ/papel-navideno-beumont-couche-70x100cm-9438hr-sku-349031.jpg",
      stock: "Disponible"
    }
  ];

  const filas = [];
  for (let i = 0; i < productosNavidad.length; i += 4) {
    filas.push(productosNavidad.slice(i, i + 4));
  }

  const getStockClass = (stock) => {
    if (stock === 'Disponible') {
      return {
        background: '#e8f5e8',
        color: '#2e7d32',
        border: '1px solid #c8e6c9'
      };
    } else if (stock === 'Últimas unidades') {
      return {
        background: '#fff3cd',
        color: '#856404',
        border: '1px solid #ffeaa7'
      };
    } else {
      return {
        background: '#ffebee',
        color: '#c62828',
        border: '1px solid #ffcdd2'
      };
    }
  };

  return (
    <>
      <h2 className="articulos-temporada-titulo">
        🎄 Artículos de Temporada - Navidad 🎄
      </h2>
      
      <div className="articulos-temporada-contenedor">
        {filas.map((fila, filaIndex) => (
          <div key={filaIndex} className="articulos-temporada-fila">
            {fila.map((producto, index) => {
              const stockStyle = getStockClass(producto.stock);
              return (
                <div key={index} className="articulos-temporada-producto">
                  <img 
                    src={producto.imagen} 
                    alt={producto.nombre}
                    className="articulos-temporada-imagen"
                  />
                  <h3 className="articulos-temporada-nombre">
                    {producto.nombre}
                  </h3>
                  <p className="articulos-temporada-descripcion">
                    {producto.descripcion}
                  </p>
                  <div className="articulos-temporada-info">
                    <span className="articulos-temporada-precio">
                      {producto.precio}
                    </span>
                    <span 
                      className="articulos-temporada-stock"
                      style={stockStyle}
                    >
                      {producto.stock}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

    

      <div className="articulos-temporada-oferta">
        <h3 className="articulos-temporada-oferta-titulo">🎁 ¡Oferta Especial de Navidad! 🎁</h3>
        <p className="articulos-temporada-oferta-texto">
          Compra 3 artículos y obtén un 20% de descuento + envío gratis
        </p>
      </div>

      
    </>
  );
};

export default ArticulosTemporada;
