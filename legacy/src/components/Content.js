import React from 'react';
import Articulos from './sections/Articulos';
import Carrito from './sections/Carrito';
import Inventario from './sections/Inventario';
import Contacto from './sections/Contacto';
import Dashboard from './sections/Dashboard';
import Tarjetas from './sections/Tarjetas';
import ArticulosTemporada from './sections/ArticulosTemporada';
import Favoritos from './sections/Favoritos';
import RegistroVentas from './sections/RegistroVentas'; 

const Content = ({ currentSection, onChangeSection, onUpdateCarrito }) => {
  const renderSection = () => {
    switch (currentSection) {
      case 'articulos':
        return <Articulos onUpdateCarrito={onUpdateCarrito} />;
      case 'carrito':
        return <Carrito onUpdateCarrito={onUpdateCarrito} />;
      case 'favoritos':
        return <Favoritos onUpdateFavoritos={onUpdateCarrito} />;
      case 'registro-ventas':
        return <RegistroVentas />;
      case 'inventario':
        return <Inventario />;
      case 'contacto':
        return <Contacto />;
      case 'dashboard':
        return <Dashboard />;
      case 'tarjetas':
        return <Tarjetas />;
      case 'tarjeta':
        return <ArticulosTemporada />;
      default:
        return <ArticulosTemporada onChangeSection={onChangeSection} />;
    }
  };


  return (
    <main id="content">
      {renderSection()}
    </main>
  );
};

export default Content;
