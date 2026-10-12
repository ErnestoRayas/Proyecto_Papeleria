import React from 'react';
import './AdBanner.css';

const AdBanner = ({ size = 'banner', content, image, link }) => {
  const handleClick = () => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  return (
    <div 
      className={`ad-banner ad-${size}`} 
      onClick={handleClick}
      style={{ cursor: link ? 'pointer' : 'default' }}
    >
      {image ? (
        <>
          <img src={image} alt="Anuncio" className="ad-image" />
          <div className="ad-overlay">
            <div className="ad-content">
              <span className="ad-text">{content || 'Espacio Publicitario'}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="ad-content-only">
          <span className="ad-text">{content || 'Espacio Publicitario'}</span>
        </div>
      )}
      <span className="ad-label">Publicidad</span>
    </div>
  );
};

export default AdBanner;
