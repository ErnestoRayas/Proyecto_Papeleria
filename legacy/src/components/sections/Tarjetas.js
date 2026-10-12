import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../../Estilos/Tarjetas.css';

const Tarjetas = () => {
  const [vistaActual, setVistaActual] = useState('configurar');
  const [texto, setTexto] = useState('Tu texto aquí');
  const [colorTexto, setColorTexto] = useState('#ff0000');
  const [fontSize, setFontSize] = useState(24);
  const [tipoLetra, setTipoLetra] = useState('Arial');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [tarjetas, setTarjetas] = useState([]);
  
  const canvasRef = useRef(null);

  const actualizarPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = colorTexto;
    ctx.font = `${fontSize}px ${tipoLetra}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, canvas.width / 2, canvas.height / 2);
  }, [texto, colorTexto, fontSize, tipoLetra, bgColor]);

  useEffect(() => {
    if (vistaActual === 'mis-tarjetas') {
      mostrarTarjetasGuardadas();
    }
  }, [vistaActual]);

  useEffect(() => {
    actualizarPreview();
  }, [actualizarPreview]);

  const mostrarTarjetasGuardadas = () => {
    const usuario = localStorage.getItem("loggedIn");
    const tarjetasGuardadas = JSON.parse(localStorage.getItem(`tarjetas_${usuario}`)) || [];
    setTarjetas(tarjetasGuardadas);
  };

  const exportarTarjeta = () => {
    const username = localStorage.getItem("loggedIn");
    if (!username) {
      alert("Debes iniciar sesión para guardar la tarjeta");
      return;
    }

    const dataURL = canvasRef.current.toDataURL("image/png");
    const tarjetasGuardadas = JSON.parse(localStorage.getItem(`tarjetas_${username}`)) || [];
    tarjetasGuardadas.push(dataURL);
    localStorage.setItem(`tarjetas_${username}`, JSON.stringify(tarjetasGuardadas));
    alert("Tarjeta guardada exitosamente!");
    setVistaActual('mis-tarjetas');
  };

  const descargarTarjeta = (dataURL) => {
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = `tarjeta.png`;
    a.click();
  };

  const eliminarTarjeta = (dataURL) => {
    if (window.confirm("¿Deseas eliminar esta tarjeta?")) {
      const usuario = localStorage.getItem("loggedIn");
      let tarjetasActualizadas = tarjetas.filter(t => t !== dataURL);
      localStorage.setItem(`tarjetas_${usuario}`, JSON.stringify(tarjetasActualizadas));
      setTarjetas(tarjetasActualizadas);
    }
  };

  return (
    <section id="tarjetas-seccion" className="tarjetas-seccion">
        <h2 className="tarjetas-titulo">Tarjetas Personalizadas</h2>

      <div className="tarjetas-navegacion">
        <button 
          onClick={() => setVistaActual('configurar')}
          className={`tarjetas-boton ${vistaActual === 'configurar' ? 'tarjetas-boton-configurar' : 'tarjetas-boton-inactivo'}`}
        >
          Crear Tarjeta
        </button>
        <button 
          onClick={() => setVistaActual('mis-tarjetas')}
          className={`tarjetas-boton ${vistaActual === 'mis-tarjetas' ? 'tarjetas-boton-mis-tarjetas' : 'tarjetas-boton-inactivo'}`}
        >
          Mis Tarjetas ({tarjetas.length})
        </button>
      </div>


      {vistaActual === 'configurar' && (
        <div id="tarjeta-configurator" className="tarjetas-configurator">
          <div className="tarjetas-contenedor-principal">

            <div className="tarjetas-panel-controles">
              <h3 className="tarjetas-panel-titulo">Personalizar Tarjeta</h3>
              
              <div className="tarjetas-control-grupo">
                <label htmlFor="txtTarjeta" className="tarjetas-label">Texto:</label>
                <input 
                  type="text" 
                  id="txtTarjeta" 
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  className="tarjetas-input-texto"
                />
              </div>

              <div className="tarjetas-control-grupo">
                <label htmlFor="colorTexto" className="tarjetas-label">Color del texto:</label>
                <input 
                  type="color" 
                  id="colorTexto" 
                  value={colorTexto}
                  onChange={(e) => setColorTexto(e.target.value)}
                  className="tarjetas-input-color"
                />
              </div>

              <div className="tarjetas-control-grupo">
                <label htmlFor="fontSize" className="tarjetas-label">Tamaño de fuente:</label>
                <input 
                  type="range" 
                  id="fontSize" 
                  min="10" 
                  max="100" 
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="tarjetas-input-range"
                />
                <span>{fontSize}px</span>
              </div>

              <div className="tarjetas-control-grupo">
                <label htmlFor="tipoLetra" className="tarjetas-label">Tipo de letra:</label>
                <select 
                  id="tipoLetra" 
                  value={tipoLetra}
                  onChange={(e) => setTipoLetra(e.target.value)}
                  className="tarjetas-select"
                >
                  <option value="Arial">Arial</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                </select>
              </div>

              <div className="tarjetas-control-grupo">
                <label htmlFor="bgColor" className="tarjetas-label">Color de fondo:</label>
                <input 
                  type="color" 
                  id="bgColor" 
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="tarjetas-input-color"
                />
              </div>

              <button 
                onClick={exportarTarjeta}
                className="tarjetas-boton-guardar"
              >
                💾 Guardar Tarjeta
              </button>
            </div>
            <div className="tarjetas-vista-previa">
              <h3 className="tarjetas-vista-previa-titulo">Vista Previa</h3>
              <canvas 
                ref={canvasRef}
                id="canvasTarjeta" 
                width="400" 
                height="250" 
                className="tarjetas-canvas"
              ></canvas>
              <p className="tarjetas-info-canvas">
                Tamaño: 400x250 px
              </p>
            </div>
          </div>
        </div>
      )}

      {vistaActual === 'mis-tarjetas' && (
        <div id="mis-tarjetas" className="tarjetas-mis-tarjetas">
          {tarjetas.length === 0 ? (
            <div className="tarjetas-sin-tarjetas">
              <h3 className="tarjetas-sin-tarjetas-titulo">No tienes tarjetas guardadas</h3>
              <p className="tarjetas-sin-tarjetas-texto">Crea tu primera tarjeta personalizada</p>
              <button 
                onClick={() => setVistaActual('configurar')}
                className="tarjetas-boton-crear"
              >
                Crear Tarjeta
              </button>
            </div>
          ) : (
            <>
              <h3 className="tarjetas-lista-titulo">
                Mis Tarjetas Guardadas ({tarjetas.length})
              </h3>
              <div className="tarjetas-contenedor-lista">
                {tarjetas.map((dataURL, index) => (
                  <div 
                    key={index}
                    className="tarjetas-tarjeta-item"
                  >
                    <img 
                      src={dataURL}
                      alt={`Tarjeta ${index + 1}`}
                      className="tarjetas-imagen"
                    />
                    <div className="tarjetas-contenedor-botones">
                      <button 
                        onClick={() => descargarTarjeta(dataURL)}
                        className="tarjetas-boton-descargar"
                      >
                        📥 Descargar
                      </button>
                      <button 
                        onClick={() => eliminarTarjeta(dataURL)}
                        className="tarjetas-boton-eliminar"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default Tarjetas;
