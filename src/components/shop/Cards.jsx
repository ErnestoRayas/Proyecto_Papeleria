import React, { useState } from 'react';
import { useShop } from '../../store/ShopContext';
import Icon from './Icon';

export default function Cards() {
  const { notify } = useShop();
  const [text, setText] = useState('Las mejores ideas\nempiezan contigo.'), [background, setBackground] = useState('#efe4ce'), [color, setColor] = useState('#234f43'), [font, setFont] = useState('Georgia'), [size, setSize] = useState(32);
  const download = () => {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background; ctx.fillRect(0, 0, 1200, 800);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(45, 45, 1110, 710);
    ctx.fillStyle = color; ctx.font = `${size * 2.5}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = text.split('\n');
    lines.forEach((line, i) => ctx.fillText(line, 600, 400 + (i - (lines.length - 1) / 2) * size * 3.3, 1040));
    canvas.toBlob(blob => {
      if (!blob) { notify('No pudimos crear tu tarjeta.', 'error'); return; }
      const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'tarjeta-papeleria-karen.png'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Tu tarjeta está lista para descargar.');
    }, 'image/png');
  };
  return <section><div className="section-heading"><div><span className="eyebrow">Un detalle que dice mucho</span><h1>Tarjetas con tu toque</h1></div></div><div className="cards-layout"><div className="panel"><h2>Hazla tuya</h2><div className="stack-form"><label>Tu mensaje<textarea maxLength={240} rows="4" value={text} onChange={event => setText(event.target.value)} /></label><div className="form-columns"><label>Color de fondo<input type="color" value={background} onChange={event => setBackground(event.target.value)} /></label><label>Color del texto<input type="color" value={color} onChange={event => setColor(event.target.value)} /></label></div><label>Tipografía<select value={font} onChange={event => setFont(event.target.value)}><option value="Georgia">Clásica</option><option value="Arial">Moderna</option><option value="Courier New">Máquina de escribir</option></select></label><label>Tamaño del texto: {size}<input type="range" min="16" max="48" value={size} onChange={event => setSize(Number(event.target.value))} /></label><button className="button primary full" onClick={download} disabled={!text.trim()}>Descargar PNG <Icon name="arrow" size={18} /></button><small className="muted">Diseño digital gratuito. La tarjeta se descarga en tu dispositivo.</small></div></div><div className="card-preview-wrap"><span className="eyebrow">Vista previa</span><div className="card-preview" style={{ background, color, fontFamily: font }}><div style={{ fontSize: `clamp(16px, ${size / 12}vw, ${size}px)` }}>{text}</div></div><p className="muted small">Tip: usa saltos de línea para dar espacio a tu mensaje.</p></div></div></section>;
}
