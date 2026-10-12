import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { obtenerCarrito, guardarCarrito } from '../../utils/carritoUtils';
import { agregarAFavoritos, eliminarDeFavoritos, estaEnFavoritos } from '../../utils/favoritosUtils';
import { notificacionCarrito, notificacionFavorito, notificacionError } from '../../utils/notificacionesUtils';
import '../../Estilos/Articulos.css';

const Articulos = ({ onUpdateCarrito }) => {
  const [articulos, setArticulos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [indiceInicio, setIndiceInicio] = useState(0);
  const [favoritos, setFavoritos] = useState({});
  const [imagenesActuales, setImagenesActuales] = useState({});
  
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [soloEnStock, setSoloEnStock] = useState(false);
  const [soloFavoritos, setSoloFavoritos] = useState(false);

  const articulosContainerRef = useRef(null);
  const ARTICULOS_POR_FILA = 4;

  const imagenesExtra = {
    "Colores": [
      "https://i.postimg.cc/QMYctmWy/Colores.png",
      "https://i.postimg.cc/1X3pRP63/Colores-Primas.png",
      "https://i.postimg.cc/fWqd7Gm3/Colores-Videl.png"
    ],
    "Cuadernos": [
      "https://i.postimg.cc/Df4GgC62/Cuaderno-Jean-Book.png",
      "https://i.postimg.cc/k4b5xHmp/Cuaderno-Scribe.png",
      "https://i.postimg.cc/nztyPSmT/Cuaderno-Estrella.png"
    ],
    "Lápices Adhesivos": [
      "https://i.postimg.cc/ncs3qYjz/Pegamento-Dixon.png",
      "https://i.postimg.cc/yYSTD1tF/Lapiz-Pritt-removebg-preview.png",
      "https://i.postimg.cc/G34fj16d/Prit-Buy.png"
    ],
    "Lápices": [
      "https://i.postimg.cc/YCPGYYFr/01280115-removebg-preview.png",
      "https://i.postimg.cc/J0hMpdwQ/Lapiz-Mape.png",
      "https://i.postimg.cc/90S5JmYt/Lapices-Bic.png"
    ],
    "Plumas": [
      "https://i.postimg.cc/fbMF7SQH/Plumas-Paper.png",
      "https://i.postimg.cc/MTn8Rf1L/Plumas-Bic.png",
      "https://i.postimg.cc/qRh9gVTV/Plumas-Gel.png"
    ],
    "Engrapadoras": [
      "https://i.postimg.cc/447VqLSW/Engrapadora-removebg-preview.png",
      "https://i.postimg.cc/Mpb4qzdB/Engrapadora-Mini.png",
      "https://i.postimg.cc/QMfyK0LG/Engrapadora-Tipo-Pistola.png"
    ],
    "Hojas de carpeta": [
      "https://i.postimg.cc/wjtCmdfx/Hojas-de-carpeta.png",
      "https://i.postimg.cc/ZKjpSg6K/Hojas-Kiel.png",
      "https://i.postimg.cc/kgpSVb13/Hojas-Mate.png"
    ],
    "Plastilina": [
      "https://i.postimg.cc/3wTtxMPQ/Plastilina.png",
      "https://i.postimg.cc/KvVcBD2J/Plastilina-Vinci.png",
      "https://i.postimg.cc/xdG0rrb3/Plastilina-Pelikan.png"
    ],
    "Pegamento blanco": [
      "https://i.postimg.cc/JzWNbNK0/Pegamento-Blanco.png",
      "https://i.postimg.cc/7LQyrxZT/pegamento-Bully.png",
      "https://i.postimg.cc/9M65zJTy/Pegamento-Dixon.png"
    ],
    "Pincel": [
      "https://i.postimg.cc/5tvCJSb1/Pincel.png",
      "https://i.postimg.cc/XqdtZRYK/best-artist-paint-brushes-2-removebg-preview.png",
      "https://i.postimg.cc/ZKP1Jzgx/pinceles-removebg-preview.png"
    ],
    "Esferas Navideñas": [
      "https://i.postimg.cc/JzVYmPW1/214620-d.jpg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVfyqJFv_xuHMWawB2hyLYqdcsVtt7DMnHcQ&s",
      "https://http2.mlstatic.com/D_NQ_NP_769807-MLU74023754004_012024-O.webp"
    ],
    "Luces LED": [
      "https://i.postimg.cc/d0H4YgpH/Imagen-Lucez.jpg",
      "https://m.media-amazon.com/images/I/91A3owIWeyL._AC_UF894,1000_QL80_.jpg",
      "https://lamercedimportadora.mx/wp-content/uploads/2024/09/L564016-04.jpg"
    ],
    "Arbol de Navidad": [
      "https://i.postimg.cc/s2tv0QhT/813arlp-Ns-SL.jpg",
      "https://houzerstore.com.mx/cdn/shop/files/MKZ-ARBM3-190V.jpg?v=1750438853",
      "https://www.costco.com.mx/medias/sys_master/products/h56/hd9/360893566124062.jpg"
    ],
    "Corona Navidad": [
      "https://i.postimg.cc/kMygWhT5/71Nf-URFBXAL-AC_Uf894-1000-QL80.jpg",
      "https://i.etsystatic.com/13909799/r/il/d618b1/5561736651/il_570xN.5561736651_f4t9.jpg",
      "https://waldos.com.mx/cdn/shop/files/100092988COMBI_1.jpg?v=1699039359&width=1214"
    ],
    "Bolsa Navideña": [
      "https://i.postimg.cc/59LBr4Y6/descarga-removebg-preview.png",
      "https://waldos.com.mx/cdn/shop/files/100092411BSANTA--_2.jpg?v=1697211578",
      "https://img.kwcdn.com/product/fancy/3521b422-37c5-401b-9b7c-60df58d8d479.jpg?imageMogr2/auto-orient%7CimageView2/2/w/800/q/70/format/webp"
    ],
    "Papel Navideño": [
      "https://i.postimg.cc/LXf1GDsQ/papel-navideno-beumont-couche-70x100cm-9438hr-sku-349031.jpg",
      "https://m.media-amazon.com/images/I/71VAmcVcXdL.jpg",
      "https://media.istockphoto.com/id/1430709087/es/vector/fondo-rojo-de-garabatos-navide%C3%B1os-adecuado-para-el-dise%C3%B1o-de-envases-papel-tapiz-o-como.jpg?s=612x612&w=0&k=20&c=CZetA8hSFHSf1I0GOxYqq6owSFgiKtTTt446JQIKFgQ="
    ]
  };

  const intervaloGlobalRef = useRef(null);

  const sincronizarConInventario = (articulosData) => {
    const inventarioExistente = JSON.parse(localStorage.getItem("inventario")) || [];
    
    if (inventarioExistente.length === 0) {
      const inventarioInicial = articulosData.map(articulo => ({
        nombre: articulo.nombre,
        precio: articulo.price,
        cantidad: 10
      }));
      localStorage.setItem("inventario", JSON.stringify(inventarioInicial));
      setInventario(inventarioInicial);
      setArticulos(articulosData);
    } else {
      const articulosSincronizados = articulosData.map(articulo => {
        const productoInventario = inventarioExistente.find(item => 
          item.nombre === articulo.nombre
        );
        
        if (productoInventario) {
          return {
            ...articulo,
            price: productoInventario.precio 
          };
        }
        
        return articulo;
      });
      
      setInventario(inventarioExistente);
      setArticulos(articulosSincronizados);
      localStorage.setItem("articulos", JSON.stringify(articulosSincronizados));
    }

    const imagenesIniciales = {};
    articulosData.forEach(articulo => {
      imagenesIniciales[articulo.nombre] = 0;
    });
    setImagenesActuales(imagenesIniciales);

    const favoritosEstado = {};
    articulosData.forEach(articulo => {
      favoritosEstado[articulo.nombre] = estaEnFavoritos(articulo.nombre);
    });
    setFavoritos(favoritosEstado);
  };

  useEffect(() => {
    const articulosData = [
      { nombre: "Colores", price: 95, img: "https://i.postimg.cc/QMYctmWy/Colores.png", desc: "Pigmentos vivos, punta resistente y trazos uniformes.", categoria: "material-artistico" },
      { nombre: "Cuadernos", price: 28, img: "https://i.postimg.cc/Df4GgC62/Cuaderno-Jean-Book.png", desc: "Pasta dura, diseño moderno y hojas cuadriculadas.", categoria: "cuadernos" },
      { nombre: "Lápices Adhesivos", price: 18, img: "https://i.postimg.cc/ncs3qYjz/Pegamento-Dixon.png", desc: "Ideal para pegar papel, cartón y fotos sin ensuciar.", categoria: "adhesivos" },
      { nombre: "Lápices", price: 5, img: "https://i.postimg.cc/YCPGYYFr/01280115-removebg-preview.png", desc: "Punta resistente y madera ecológica para trazos suaves.", categoria: "escritura" },
      { nombre: "Plumas", price: 10, img: "https://i.postimg.cc/fbMF7SQH/Plumas-Paper.png", desc: "Escritura fluida, colores intensos y gran durabilidad.", categoria: "escritura" },
      { nombre: "Engrapadoras", price: 25, img: "https://i.postimg.cc/447VqLSW/Engrapadora-removebg-preview.png", desc: "Diseño ergonómico para un engrape fácil.", categoria: "oficina" },
      { nombre: "Hojas de carpeta", price: 50, img: "https://i.postimg.cc/wjtCmdfx/Hojas-de-carpeta.png", desc: "Papel de alta calidad para archivar documentos.", categoria: "papel" },
      { nombre: "Plastilina", price: 18, img: "https://i.postimg.cc/3wTtxMPQ/Plastilina.png", desc: "Colores vibrantes y textura suave.", categoria: "material-artistico" },
      { nombre: "Pegamento blanco", price: 25, img: "https://i.postimg.cc/JzWNbNK0/Pegamento-Blanco.png", desc: "Adhesivo fuerte y de secado rápido.", categoria: "adhesivos" },
      { nombre: "Pincel", price: 15, img: "https://i.postimg.cc/5tvCJSb1/Pincel.png", desc: "El mejor material de pinceles.", categoria: "escritura" },
      { nombre: "Esferas Navideñas", price: 50, img: "https://i.postimg.cc/JzVYmPW1/214620-d.jpg", desc: "Esferas unicas para sus casas.", categoria: "material-artistico" },
      { nombre: "Luces LED", price: 110, img: "https://i.postimg.cc/d0H4YgpH/Imagen-Lucez.jpg", desc: "Luces LED que iluminan y se modifican mediante la App.", categoria: "material-artistico" },
      { nombre: "Arbol de Navidad", price: 800, img: "https://i.postimg.cc/s2tv0QhT/813arlp-Ns-SL.jpg", desc: "El mejor arbol sitentico para tu casa.", categoria: "material-artistico" },
      { nombre: "Corona Navidad", price: 120, img: "https://i.postimg.cc/kMygWhT5/71Nf-URFBXAL-AC_UF894-1000-QL80.jpg", desc: "Corona Navideña grande, pequeño a un buen precio.", categoria: "material-artistico" },
      { nombre: "Bolsa Navideña", price: 20, img: "https://i.postimg.cc/59LBr4Y6/descarga-removebg-preview.png", desc: "Bolsa navideña diferentes tamaños.", categoria: "papel" },
      { nombre: "Papel Navideño", price: 15, img: "https://i.postimg.cc/LXf1GDsQ/papel-navideno-beumont-couche-70x100cm-9438hr-sku-349031.jpg", desc: "Papel navideño de diferentes figuras.", categoria: "papel" }
    ];
     
    sincronizarConInventario(articulosData);
  }, []);


  useEffect(() => {
    console.log('🎠 INICIANDO CARRUSEL GLOBAL');
    
 
    if (intervaloGlobalRef.current) {
      clearInterval(intervaloGlobalRef.current);
    }

    intervaloGlobalRef.current = setInterval(() => {
      setImagenesActuales(prev => {
        const nuevoEstado = { ...prev };
 
        Object.keys(imagenesExtra).forEach(nombreArticulo => {
          const imagenes = imagenesExtra[nombreArticulo];
          if (imagenes && imagenes.length > 1) {
            const indiceActual = nuevoEstado[nombreArticulo] || 0;
            const siguienteIndice = (indiceActual + 1) % imagenes.length;
            nuevoEstado[nombreArticulo] = siguienteIndice;
          }
        });
        
        return nuevoEstado;
      });
    }, 3000); 

    
    return () => {
      if (intervaloGlobalRef.current) {
        clearInterval(intervaloGlobalRef.current);
      }
    };
  }, []); 

  const cambiarImagenManual = (nombreArticulo, direccion) => {
    const imagenes = imagenesExtra[nombreArticulo];
    if (!imagenes || imagenes.length <= 1) return;

    setImagenesActuales(prev => {
      const nuevoEstado = { ...prev };
      const indiceActual = nuevoEstado[nombreArticulo] || 0;
      let nuevoIndice;
      
      if (direccion === 'siguiente') {
        nuevoIndice = (indiceActual + 1) % imagenes.length;
      } else {
        nuevoIndice = (indiceActual - 1 + imagenes.length) % imagenes.length;
      }
      
      nuevoEstado[nombreArticulo] = nuevoIndice;
      return nuevoEstado;
    });
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const inventarioActualizado = JSON.parse(localStorage.getItem("inventario")) || [];
      setInventario(inventarioActualizado);
      
      const articulosActuales = JSON.parse(localStorage.getItem("articulos")) || [];
      const articulosActualizados = articulosActuales.map(articulo => {
        const productoInventario = inventarioActualizado.find(item => 
          item.nombre === articulo.nombre
        );
        
        if (productoInventario) {
          return {
            ...articulo,
            price: productoInventario.precio 
          };
        }
        
        return articulo;
      });
      
      setArticulos(articulosActualizados);
      localStorage.setItem("articulos", JSON.stringify(articulosActualizados));
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const obtenerCantidadDisponible = useCallback((nombreArticulo) => {
    const producto = inventario.find(item => item.nombre === nombreArticulo);
    return producto ? producto.cantidad : 0;
  }, [inventario]);

  const articulosFiltrados = useMemo(() => {
    let filtrados = articulos.filter(articulo => {
      const coincideBusqueda = 
        articulo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        articulo.desc.toLowerCase().includes(busqueda.toLowerCase());
      
      const coincideCategoria = 
        categoria === 'todos' || articulo.categoria === categoria;
      
      const enStock = obtenerCantidadDisponible(articulo.nombre) > 0;
      const coincideStock = !soloEnStock || enStock;
      
      const esFavorito = favoritos[articulo.nombre];
      const coincideFavoritos = !soloFavoritos || esFavorito;

      return coincideBusqueda && coincideCategoria && coincideStock && coincideFavoritos;
    });

    return filtrados;
  }, [articulos, busqueda, categoria, soloEnStock, soloFavoritos, favoritos, obtenerCantidadDisponible]);

  const toggleFavorito = (articulo) => {
    if (favoritos[articulo.nombre]) {
      eliminarDeFavoritos(articulo.nombre);
      setFavoritos(prev => ({
        ...prev,
        [articulo.nombre]: false
      }));
      notificacionFavorito('Favorito Eliminado', `${articulo.nombre} eliminado de favoritos`);
    } else {
      const agregado = agregarAFavoritos(articulo);
      if (agregado) {
        setFavoritos(prev => ({
          ...prev,
          [articulo.nombre]: true
        }));
        notificacionFavorito('¡Agregado a Favoritos!', `${articulo.nombre} agregado a tus favoritos`);
      }
    }
  };

  const agregarAlCarrito = (articulo) => {
    const cantidadDisponible = obtenerCantidadDisponible(articulo.nombre);
    
    if (cantidadDisponible <= 0) {
      notificacionError('Producto Agotado', `No hay stock disponible de ${articulo.nombre}`);
      return;
    }

    const productoInventario = inventario.find(item => item.nombre === articulo.nombre);
    const precioActual = productoInventario ? productoInventario.precio : articulo.price;

    const inventarioActualizado = inventario.map(item => {
      if (item.nombre === articulo.nombre) {
        return {
          ...item,
          cantidad: item.cantidad - 1
        };
      }
      return item;
    });

    localStorage.setItem("inventario", JSON.stringify(inventarioActualizado));
    setInventario(inventarioActualizado);

    let carrito = obtenerCarrito();
    const index = carrito.findIndex(i => i.name === articulo.nombre);
    
    if (index >= 0) {
      carrito[index].qty += 1;
      carrito[index].price = precioActual; 
    } else {
      carrito.push({ 
        name: articulo.nombre, 
        qty: 1, 
        price: precioActual, 
        img: articulo.img 
      });
    }

    guardarCarrito(carrito);
    notificacionCarrito(
      'Producto Agregado', 
      `${articulo.nombre} agregado al carrito\nPrecio: $${precioActual}\nStock restante: ${cantidadDisponible - 1}`
    );
    onUpdateCarrito();
    window.dispatchEvent(new Event('storage'));
  };

  const siguiente = () => {
    if (indiceInicio + ARTICULOS_POR_FILA < articulosFiltrados.length) {
      setIndiceInicio(indiceInicio + 1);
    }
  };

  const anterior = () => {
    if (indiceInicio > 0) {
      setIndiceInicio(indiceInicio - 1);
    }
  };

  const articulosVisibles = articulosFiltrados.slice(indiceInicio, indiceInicio + ARTICULOS_POR_FILA);

  const categorias = useMemo(() => {
    const cats = articulos.map(a => a.categoria);
    return ['todos', ...new Set(cats)];
  }, [articulos]);

  return (
    <>
      <h2 className="articulos-title">Artículos</h2>
      <p className="articulos-description">
        Se muestran imágenes de los <strong>artículos en venta</strong> y <em>su costo actual</em>, de la <abbr title="Papelería Karen">PapeKaren</abbr>
      </p>

      <div className="filtros-container">
        <div className="filtros-content">
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="category-select"
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'todos' ? 'Todas' : 
                 cat === 'material-artistico' ? 'Arte' :
                 cat === 'escritura' ? 'Escritura' :
                 cat === 'oficina' ? 'Oficina' :
                 cat === 'adhesivos' ? 'Adhesivos' :
                 cat === 'papel' ? 'Papel' :
                 cat === 'cuadernos' ? 'Cuadernos' : cat}
              </option>
            ))}
          </select>

          <div className="checkboxes-container">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={soloEnStock}
                onChange={(e) => setSoloEnStock(e.target.checked)}
                className="checkbox-input"
              />
              📦 En stock
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={soloFavoritos}
                onChange={(e) => setSoloFavoritos(e.target.checked)}
                className="checkbox-input"
              />
              ⭐ Favoritos
            </label>
          </div>

          <button
            onClick={() => {
              setBusqueda('');
              setCategoria('todos');
              setSoloEnStock(false);
              setSoloFavoritos(false);
            }}
            className="clear-filters-btn"
          >Limpiar
          </button>

          <div className="product-count">
            {articulosFiltrados.length} productos
          </div>
        </div>
      </div>

      <div className="navigation-container">
        <button 
          onClick={anterior}
          disabled={indiceInicio === 0}
          className={`nav-btn prev-btn ${indiceInicio === 0 ? 'disabled' : ''}`}
        >
          ◀
        </button>

        <div className="nav-info">
          Mostrando {indiceInicio + 1}-{Math.min(indiceInicio + ARTICULOS_POR_FILA, articulosFiltrados.length)} de {articulosFiltrados.length} artículos
        </div>

        <button 
          onClick={siguiente}
          disabled={indiceInicio + ARTICULOS_POR_FILA >= articulosFiltrados.length}
          className={`nav-btn next-btn ${indiceInicio + ARTICULOS_POR_FILA >= articulosFiltrados.length ? 'disabled' : ''}`}
        >
          ▶
        </button>
      </div>

      {articulosFiltrados.length === 0 && (
        <div className="no-products">
          <h3>No se encontraron productos</h3>
          <p>Intenta con otros términos de búsqueda o ajusta los filtros</p>
        </div>
      )}

      {articulosFiltrados.length > 0 && (
        <div 
          ref={articulosContainerRef}
          className="articulos-grid"
        >
          {articulosVisibles.map((articulo, index) => {
            const cantidadDisponible = obtenerCantidadDisponible(articulo.nombre);
            const sinStock = cantidadDisponible <= 0;
            const esFavorito = favoritos[articulo.nombre];
            const imagenes = imagenesExtra[articulo.nombre] || [articulo.img];
            const indiceImagen = imagenesActuales[articulo.nombre] || 0;
            const imagenActual = imagenes[indiceImagen];
            const tieneCarrusel = imagenes.length > 1;

            return (
              <div 
                key={index} 
                className={`articulo-card ${sinStock ? 'out-of-stock' : ''} ${esFavorito ? 'favorite' : ''}`}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorito(articulo);
                  }}
                  className="favorite-btn"
                  title={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  {esFavorito ? '⭐' : '☆'}
                </button>

                <div className="articulo-image-container">
                  <img 
                    src={imagenActual} 
                    alt={articulo.nombre} 
                    className="articulo-image"
                  />
                  {tieneCarrusel && (
                    <>
                      <div className="carousel-indicators">
                        {imagenes.map((_, imgIndex) => (
                          <div
                            key={imgIndex}
                            className={`carousel-dot ${imgIndex === indiceImagen ? 'active' : ''}`}
                          />
                        ))}
                      </div>
              
                      <div className="carousel-controls">
                        <button 
                          className="carousel-btn prev-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            cambiarImagenManual(articulo.nombre, 'anterior');
                          }}
                        >
                          ‹
                        </button>
                        <button 
                          className="carousel-btn next-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            cambiarImagenManual(articulo.nombre, 'siguiente');
                          }}
                        >
                          ›
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="articulo-info">
                  <h3 className="articulo-name">
                    {articulo.nombre}
                  </h3>
                  
                  <p className="articulo-price">
                    ${articulo.price}
                  </p>

                  <p className="articulo-description">
                    {articulo.desc}
                  </p>

                  <div className={`stock-info ${sinStock ? 'out-of-stock' : cantidadDisponible <= 5 ? 'low-stock' : 'in-stock'}`}>
                    {sinStock ? '❌ AGOTADO' : 
                     cantidadDisponible <= 5 ? `⚠️ Últimas ${cantidadDisponible}` : 
                     `📦 Stock: ${cantidadDisponible}`}
                  </div>

                  <div className="articulo-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        agregarAlCarrito(articulo);
                      }}
                      disabled={sinStock}
                      className={`cart-btn ${sinStock ? 'disabled' : ''}`}
                    >
                      {sinStock ? '❌ Agotado' : '🛒 Carrito'}
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorito(articulo);
                      }}
                      className={`favorite-action-btn ${esFavorito ? 'active' : ''}`}
                    >
                      {esFavorito ? '⭐' : '☆'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {articulosFiltrados.length > 0 && (
        <div className="pagination-dots">
          {Array.from({ length: Math.ceil(articulosFiltrados.length / ARTICULOS_POR_FILA) }, (_, i) => (
            <button
              key={i}
              onClick={() => setIndiceInicio(i * ARTICULOS_POR_FILA)}
              className={`pagination-dot ${indiceInicio === i * ARTICULOS_POR_FILA ? 'active' : ''}`}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default Articulos;
