import React, { useState, useEffect, useRef } from 'react';

export default function BuscarNegocios({ config, api, onBack, onNext }) {
  const [estado, setEstado] = useState('idle'); // idle | buscando | done | error
  const [logs, setLogs] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [stats, setStats] = useState({ analizados: 0, sinWeb: 0 });
  const [errMsg, setErrMsg] = useState('');
  const logsRef = useRef(null);
  const esFiltrado = useRef(false);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const iniciar = () => {
    setEstado('buscando');
    setLogs([]);
    setNegocios([]);
    setStats({ analizados: 0, sinWeb: 0 });
    esFiltrado.current = false;

    const params = new URLSearchParams({ apiKey: config.apiKey, lat: config.lat, lng: config.lng, radius: config.radius, type: config.type });
    const es = new EventSource(`${api}/api/buscar-negocios?${params}`);

    es.addEventListener('status', e => {
      const d = JSON.parse(e.data);
      setLogs(prev => [...prev, { type: 'info', msg: d.msg }]);
    });

    es.addEventListener('progreso', e => {
      const d = JSON.parse(e.data);
      setStats(prev => ({ analizados: d.total, sinWeb: d.tieneWeb ? prev.sinWeb : prev.sinWeb + 1 }));
      setLogs(prev => [...prev, { type: d.tieneWeb ? 'skip' : 'hit', msg: `${d.nombre} — ${d.tieneWeb ? 'tiene web' : 'SIN WEB ✓'}` }]);
    });

    es.addEventListener('negocio', e => {
      const d = JSON.parse(e.data);
      setNegocios(prev => [...prev, d]);
    });

    es.addEventListener('done', e => {
      const d = JSON.parse(e.data);
      setEstado('done');
      setStats({ analizados: d.total, sinWeb: d.sinWeb });
      es.close();
    });

    es.addEventListener('error', e => {
      try {
        const d = JSON.parse(e.data);
        setErrMsg(d.msg);
        setEstado('error');
      } catch {
        if (estado !== 'done') setEstado('done');
      }
      es.close();
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 36 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Volver
        </button>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Buscando <span style={{ color: 'var(--accent)' }}>negocios</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Radio: {parseInt(config.radius) >= 1000 ? config.radius/1000+'km' : config.radius+'m'} · {config.lat}, {config.lng}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Analizados', value: stats.analizados, color: 'var(--text)' },
          { label: 'Sin sitio web', value: stats.sinWeb, color: 'var(--accent)' },
          { label: 'Con sitio web', value: stats.analizados - stats.sinWeb, color: 'var(--text2)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Log terminal */}
      <div ref={logsRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, height: 260, overflowY: 'auto', marginBottom: 24, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        {logs.length === 0 && estado === 'idle' && (
          <p style={{ color: 'var(--text3)' }}>Presioná "Iniciar búsqueda" para comenzar...</p>
        )}
        {logs.map((l, i) => (
          <div key={i} style={{ padding: '2px 0', color: l.type === 'hit' ? 'var(--accent)' : l.type === 'skip' ? 'var(--text3)' : 'var(--text2)', animation: 'slideIn 0.2s ease' }}>
            <span style={{ color: 'var(--text3)', marginRight: 8 }}>{'>'}</span>{l.msg}
          </div>
        ))}
        {estado === 'buscando' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Spinner size={10} /><span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>procesando...</span>
          </div>
        )}
      </div>

      {errMsg && (
        <div style={{ background: '#1a0a0a', border: '1px solid #3a1a1a', borderRadius: 'var(--radius)', padding: 16, marginBottom: 24, color: 'var(--red)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
          Error: {errMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
          {estado === 'done' && negocios.length > 0 && `${negocios.length} negocios listos para buscar emails`}
          {estado === 'done' && negocios.length === 0 && 'No se encontraron negocios sin web en esta zona.'}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {estado === 'idle' && (
            <button onClick={iniciar} style={btnPrimary}>Iniciar búsqueda →</button>
          )}
          {estado === 'buscando' && (
            <button disabled style={{ ...btnPrimary, opacity: 0.5, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spinner size={14} /> Buscando...
            </button>
          )}
          {(estado === 'done' || estado === 'error') && (
            <>
              <button onClick={iniciar} style={btnSecondary}>Reintentar</button>
              {negocios.length > 0 && (
                <button onClick={() => onNext(negocios)} style={btnPrimary}>Buscar emails ({negocios.length}) →</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const btnPrimary = { height: 44, padding: '0 24px', background: 'var(--accent)', color: '#0a0a0a', border: 'none', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const btnSecondary = { height: 44, padding: '0 24px', background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, cursor: 'pointer' };

function Spinner({ size = 16 }) {
  return <div style={{ width: size, height: size, border: `2px solid var(--border)`, borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />;
}
