import React, { useState } from 'react';

const TIPOS = [
  { value: 'establishment', label: 'Todos los negocios' },
  { value: 'restaurant', label: 'Restaurantes' },
  { value: 'store', label: 'Tiendas' },
  { value: 'beauty_salon', label: 'Peluquerías / Estética' },
  { value: 'gym', label: 'Gimnasios' },
  { value: 'dentist', label: 'Dentistas' },
  { value: 'lawyer', label: 'Abogados' },
  { value: 'real_estate_agency', label: 'Inmobiliarias' },
  { value: 'car_repair', label: 'Talleres mecánicos' },
  { value: 'lodging', label: 'Alojamientos' },
];

const inputStyle = {
  width: '100%', height: 44, background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '0 14px', color: 'var(--text)', fontSize: 14,
  outline: 'none', transition: 'border-color 0.15s',
};

const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block' };

export default function ConfigStep({ config, setConfig, onNext }) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const set = (k, v) => setConfig(prev => ({ ...prev, [k]: v }));
  const canContinue = config.apiKey && config.lat && config.lng;

  const getGeo = () => {
    setGeoLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => { set('lat', pos.coords.latitude.toFixed(6)); set('lng', pos.coords.longitude.toFixed(6)); setGeoLoading(false); },
      () => setGeoLoading(false)
    );
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'inline-block', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
          Paso 1 de 4
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>
          Configurá tu<br /><span style={{ color: 'var(--accent)' }}>búsqueda</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.6 }}>
          Ingresá tu API Key de Google Maps y la zona donde querés buscar negocios sin sitio web.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {/* API Key */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <label style={labelStyle}>Google Maps API Key</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={e => set('apiKey', e.target.value)}
              placeholder="AIzaSy..."
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={() => setShowKey(!showKey)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 16 }}>
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
            Necesitás Places API habilitada. <a href="https://developers.google.com/maps/documentation/places/web-service/get-api-key" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Cómo obtenerla →</a>
          </p>
        </div>

        {/* Ubicación */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Ubicación</label>
            <button onClick={getGeo} disabled={geoLoading} style={{ height: 32, padding: '0 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {geoLoading ? <Spinner size={12} /> : '📍'} {geoLoading ? 'Detectando...' : 'Usar mi ubicación'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ ...labelStyle, fontSize: 10 }}>Latitud</label>
              <input type="text" value={config.lat} onChange={e => set('lat', e.target.value)} placeholder="-34.603700" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: 10 }}>Longitud</label>
              <input type="text" value={config.lng} onChange={e => set('lng', e.target.value)} placeholder="-58.381600" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
            O buscá en <a href="https://maps.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Google Maps</a>, hacé clic derecho y copiá las coordenadas.
          </p>
        </div>

        {/* Radio y Tipo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <label style={labelStyle}>Radio de búsqueda</label>
            <select value={config.radius} onChange={e => set('radius', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="500">500 metros</option>
              <option value="1000">1 kilómetro</option>
              <option value="2000">2 kilómetros</option>
              <option value="5000">5 kilómetros</option>
              <option value="10000">10 kilómetros</option>
            </select>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <label style={labelStyle}>Tipo de negocio</label>
            <select value={config.type} onChange={e => set('type', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onNext} disabled={!canContinue} style={{
          height: 48, padding: '0 32px', background: canContinue ? 'var(--accent)' : 'var(--bg3)',
          color: canContinue ? '#0a0a0a' : 'var(--text3)', border: 'none', borderRadius: 'var(--radius)',
          fontSize: 14, fontWeight: 700, cursor: canContinue ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s', letterSpacing: '-0.01em'
        }}>
          Buscar negocios →
        </button>
      </div>
    </div>
  );
}

function Spinner({ size = 16 }) {
  return <div style={{ width: size, height: size, border: `2px solid var(--border)`, borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />;
}
