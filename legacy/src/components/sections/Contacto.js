import React, { useState } from 'react';
import '../../Estilos/Contacto.css';

const Contacto = () => {
  const [currentView, setCurrentView] = useState('inicio');

  const renderContent = () => {
    switch (currentView) {
      case 'mapa':
        return <Mapa />;
      case 'calendario':
        return <Calendario />;
      default:
        return (
          <p className="contacto-inicio-texto">
            Selecciona una opción para ver más información.
          </p>
        );
    }
  };

  return (
    <>
      <h2 className="contacto-titulo">📞 Contáctanos</h2>
      
      <div className="contacto-botones-container">

        <button 
          onClick={() => setCurrentView('mapa')}
          className="contacto-boton"
        >
          📍 Mapa
        </button>
        <button 
          onClick={() => setCurrentView('calendario')}
          className="contacto-boton"
        >
          📅 Calendario
        </button>
      </div>

      <div className="contacto-contenido">
        {renderContent()}
      </div>

      <div className="whatsapp-container">
        <a 
          href="https://wa.me/5530770406?text=Hola!!,%20quiero%20informes%20de%20los%20artículos%20en%20venta%20de%20la%20Papelería%20Karen,%20por%20favor." 
          target="_blank" 
          rel="noopener noreferrer"
          className="whatsapp-link"
        >
          💬 WhatsApp
        </a>
      </div>


      <ul>
        <li><a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li>
        <li><a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
        <li><a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">Twitter/X</a></li>
      </ul>

        <footer>
        <small>&copy; Arenas Olvera Jorge Eduardo, Molotla colin Angel Kaleb, Rayas Batalla Ernesto Adrian, Rodriguez Catro Alfredo, Sanchez Toriz Victor Eduardo</small>
        <address>Contacto: <a href="mailto:papeleriakaren@gmail.com">papeleriakaren@gmail.com</a></address>
      </footer>
    </>
  );
};


const Mapa = () => (
  <>
    <h3>📍 Nuestra ubicación</h3>
    <iframe 
      src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d235.40263068601297!2d-99.00212212944773!3d19.263131699999995!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85ce1cb0002b3e5b%3A0x984495b2c6cdc485!2sPapeleria%20%22Karen%22!5e0!3m2!1ses-419!2smx!4v1762048531067!5m2!1ses-419!2smx"
      width="600" 
      height="450" 
      className="mapa-iframe"
      allowFullScreen 
      loading="lazy" 
      referrerPolicy="no-referrer-when-downgrade"
      title="Ubicación Papelería Karen"
    >
    </iframe>
  </>
);

const Calendario = () => (
  <>
    <h3>📅 Calendario Papelería Karen</h3>
    <iframe 
      src="https://calendar.google.com/calendar/embed?src=d64c0cf7334f7b8601c50f453e22f66a7d8e7c9678961dc960036f6430736f92%40group.calendar.google.com&ctz=America%2FMexico_City" 
      className="calendario-iframe"
      width="600" 
      height="600" 
      frameBorder="0" 
      scrolling="no"
      title="Calendario Papelería Karen"
    >
    </iframe>
  </>
);

export default Contacto;
