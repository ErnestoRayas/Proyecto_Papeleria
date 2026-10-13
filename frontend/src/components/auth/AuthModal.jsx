import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../../store/ShopContext';
import { api } from '../../services/api';
import Modal from '../ui/Modal';

export default function AuthModal() {
  const { authView, setAuthView, login, notify } = useShop();
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [visible, setVisible] = useState(false);
  const register = authView === 'register', reset = authView === 'reset';
  const errorMessage = useRef(null);
  useEffect(() => { if (error) errorMessage.current?.focus(); }, [error]);
  const submit = async event => {
    event.preventDefault(); setError(''); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (reset) {
        await api('/auth/reset-password', { method: 'POST', body: data });
        notify('Contraseña actualizada. Inicia sesión con tu nueva contraseña.'); setAuthView('login');
      } else await login(register ? 'register' : 'login', data);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const changeView = view => { setError(''); setAuthView(view); };
  return <Modal title={register ? 'Crea tu cuenta' : reset ? 'Recupera tu acceso' : 'Qué gusto verte'} onClose={() => { if (!busy) setAuthView(null); }}>
    <p className="muted">{reset ? 'Solicita un código al administrador de la tienda, quien verificará tu identidad. El código vence en 30 minutos.' : register ? 'Guarda tus favoritos y prepara tu próximo pedido.' : 'Inicia sesión para confirmar tu pedido y consultar tus compras.'}</p>
    <form className="stack-form" onSubmit={submit} key={authView}>
      {reset ? <label>Código de recuperación<input name="token" required minLength={64} maxLength={64} autoComplete="off" /></label> : <label>Usuario<input name="username" required minLength={3} maxLength={40} autoComplete="username" /></label>}
      {register && <label>Correo electrónico<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>}
      <div className="password-group"><label htmlFor="auth-password">{reset ? 'Nueva contraseña' : 'Contraseña'}</label><div className="password-field"><input id="auth-password" name="password" type={visible ? 'text' : 'password'} required minLength={register || reset ? 10 : 1} maxLength={128} autoComplete={register || reset ? 'new-password' : 'current-password'} /><button type="button" className="text-button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{visible ? 'Ocultar' : 'Mostrar'}</button></div></div>
      {(register || reset) && <small className="muted">Usa al menos 10 caracteres.</small>}
      {error && <p ref={errorMessage} tabIndex={-1} className="form-error" role="alert">{error}</p>}
      <button className="button primary full" disabled={busy}>{busy ? 'Un momento…' : register ? 'Crear cuenta' : reset ? 'Actualizar contraseña' : 'Iniciar sesión'}</button>
    </form>
    <div className="auth-links"><button className="text-button" disabled={busy} onClick={() => changeView(register || reset ? 'login' : 'register')}>{register || reset ? 'Ya tengo una cuenta' : 'Crear una cuenta'}</button>{!reset && <button className="text-button" disabled={busy} onClick={() => changeView('reset')}>Olvidé mi contraseña</button>}</div>
  </Modal>;
}
