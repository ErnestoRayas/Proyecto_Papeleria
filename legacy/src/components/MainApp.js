import React, { useState, useEffect } from 'react';
import Header from './Header';
import Content from './Content';
import GestionUsuarios from './sections/GestionUsuarios';
import { actualizarContadorCarrito } from '../utils/carritoUtils';
import Notificaciones from './Notificaciones';
import AdBanner from './AdBanner';


const MainApp = ({ onLogout }) => {
  const [currentSection, setCurrentSection] = useState('inicio');
  const [carritoCount, setCarritoCount] = useState(0);
  const [usuarioActual, setUsuarioActual] = useState(null);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    setUsuarioActual(usuario);
    actualizarContadorCarrito(setCarritoCount);

    if (!localStorage.getItem("anuncios")) {
      const anunciosIniciales = [
        { 
          id: 1, 
          texto: "🔥 Oferta Especial: 50% de descuento", 
          tipo: "sidebar",
          image: "https://i.blogs.es/01565d/calidad-aire-smartmockups/500_333.webp"
        },
        { 
          id: 2, 
          texto: "🚚 Envío gratis en compras > $300", 
          tipo: "square",
          image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        },
        { 
          id: 3, 
          texto: "⭐ Nuevos productos en stock", 
          tipo: "banner",
          image: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
        },
        { 
          id: 4, 
          texto: "📱 App móvil disponible", 
          tipo: "square",
          image: "https://i.blogs.es/01565d/calidad-aire-smartmockups/500_333.webp"
        }
      ];
      localStorage.setItem("anuncios", JSON.stringify(anunciosIniciales));
    }
  }, []);

  const handleUpdateCarrito = () => {
    actualizarContadorCarrito(setCarritoCount);
  };

  const handleChangeSection = (section) => {
    setCurrentSection(section);
  };

  const getAnuncios = () => {
    return JSON.parse(localStorage.getItem("anuncios")) || [];
  };

  const anuncios = getAnuncios();

  if (currentSection === 'gestion-usuarios') {
    return <GestionUsuarios onBack={() => setCurrentSection('inicio')} />;
  }

  return (
    <div className="main-app-with-ads">
      <Notificaciones />
      
      <Header 
        usuarioActual={usuarioActual}
        carritoCount={carritoCount}
        onLogout={onLogout}
        onChangeSection={handleChangeSection}
      />
      
      <div className="app-layout">

        <aside className="left-sidebar-ads">
          <AdBanner 
            size="sidebar" 
            content="Ofertas Unicas"
            image="https://cazaofertas.com.mx/wp-content/uploads/2021/08/chedraui-regreso-a-clases.jpeg"
          />
          <AdBanner 
            size="square" 
            content="Nueva App !!"
            image="https://i.blogs.es/01565d/calidad-aire-smartmockups/500_333.webp"
          />
          <AdBanner 
            size="square" 
            content="💳 Aceptamos todas las tarjetas"
            image="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          />
        </aside>

        <main className="main-content-with-ads">
          <Content 
            currentSection={currentSection}
            onChangeSection={handleChangeSection}
            onUpdateCarrito={handleUpdateCarrito}
          />


          <AdBanner 
            size="banner" 
            content="🎉 ¡Clientes satisfechos! ⭐⭐⭐⭐⭐"
            image="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
          />
        </main>

        <aside className="right-sidebar-ads">
          <AdBanner 
            size="sidebar" 
            content="Atencion al usuario ⭐⭐⭐⭐⭐"
            image="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          />
          <AdBanner 
            size="square" 
            content="🛡️ Compra 100% segura"
            image="https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          />
            <AdBanner 
            size="square" 
            content="Hecho con esfuerzo"
            image="https://i.postimg.cc/CLQgw6j5/Captura-de-pantalla-2025-11-09-122833.png"
          />
        </aside>
      </div>
    </div>
  );
};

export default MainApp;
