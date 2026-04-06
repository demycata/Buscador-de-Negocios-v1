import React, { useState, useRef, useEffect } from 'react';

export default function BuscarEmails({ negocios, api, onBack, onNext, onSkip }) {
  const [estado, setEstado] = useState('idle');
  const [resultados, setResultados] = useState([]);
  const [progreso, setProgreso] = useState({ actual: 0, total: negocios.length, conEmail: 0 });
  const [logs, setLogs] = useState([]);
  const logsRef = useRef(null);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const iniciar = async () => {
    setEstado('buscando');
    setResultados([]);
    setProgreso({ actual: 0, total: negocios.length, conEmail: 0 });
    setLogs([]);

    const res = await fetch(`${api}/api/buscar-emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ negocios })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processLine = (line) => {
      if (!line.trim()) return;
      if (line.startsWith('event: ')) return;
      if (line.startsWith('data: ')) {
        try {
          const d = JSON.parse(line.slice(6));
          if (d.idx !== undefined) {
            setProgreso(prev => ({ actual: d.idx + 1, total: d.total, conEmail: d.emails ? prev.conEmail + 1 : prev.conEmail }));
            setResultados(prev => [...prev, d]);
            setLogs(prev => [...prev, { type: d.emails ? 'hit' : 'miss', msg: `${d.nombre} → ${d.emails || 'sin email'}` }]);
          } else if (d.msg) {
            setLogs(prev => [...prev, { type: 'info', msg: d.msg }]);
          } else if (d.resultados) {
            setEstado('done');
          }
        } catch {}
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) { setEstado('done'); break; }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      lines.forEach(processLine);
    }
  };

  const pct = progreso.total ? Math.round(progreso.actual / progreso.total * 100) : 0;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 36 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 16 }}>
          ← Volver
        </button>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Buscar <span style={{ color: 'var(--accent)' }}>emails</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>{negocios.length} negocios sin web · Búsqueda automática en Google, Facebook e Instagram</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Procesados', value: `${progreso.actual}/${progreso.total}`, color: 'var(--text)' },
          { label: 'Con email', value: progreso.conEmail, color: 'var(--accent)' },
          { label: 'Sin email', value: progreso.actual - progreso.conEmail, color: 'var(--text2)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {estado !== 'idle' && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text2)' }}>
            <span>Progreso</span><span>{pct}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* Log */}
      <div ref={logsRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, height: 240, overflowY: 'auto', marginBottom: 24, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        {logs.length === 0 && estado === 'idle' && (
          <p style={{ color: 'var(--text3)' }}>Presioná "Iniciar búsqueda de emails" para comenzar. Este proceso puede tardar varios minutos.</p>
        )}
        {logs.map((l, i) => (
          <div key={i} style={{ padding: '2px 0', color: l.type === 'hit' ? 'var(--accent)' : l.type === 'miss' ? 'var(--text3)' : 'var(--text2)', animation: 'slideIn 0.15s ease' }}>
            <span style={{ color: 'var(--text3)', marginRight: 8 }}>{'>'}</span>{l.msg}
          </div>
        ))}
        {estado === 'buscando' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Spinner size={10} /><span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>buscando...</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onSkip} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
          Omitir este paso
        </button>
        <div style={{ display: 'flex', gap: 12 }}>
          {estado === 'idle' && (
            <button onClick={iniciar} style={btnPrimary}>Iniciar búsqueda de emails →</button>
          )}
          {estado === 'buscando' && (
            <button disabled style={{ ...btnPrimary, opacity: 0.5, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spinner size={14} /> Buscando... ({pct}%)
            </button>
          )}
          {estado === 'done' && (
            <>
              <button onClick={iniciar} style={btnSecondary}>Reintentar</button>
              <button onClick={() => onNext(resultados)} style={btnPrimary}>Ver resultados →</button>
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
