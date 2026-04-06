import React, { useState, useMemo } from 'react';

export default function Resultados({ leads, api, onReset }) {
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [exportando, setExportando] = useState(false);

  const filtrados = useMemo(() => {
    let data = leads;
    if (filtro === 'con_email') data = data.filter(l => l.emails);
    if (filtro === 'sin_email') data = data.filter(l => !l.emails);
    if (busqueda) {
      const q = busqueda.toLowerCase();
      data = data.filter(l => l.nombre?.toLowerCase().includes(q) || l.direccion?.toLowerCase().includes(q) || l.emails?.toLowerCase().includes(q));
    }
    return data;
  }, [leads, filtro, busqueda]);

  const conEmail = leads.filter(l => l.emails).length;

  const exportar = async () => {
    setExportando(true);
    try {
      const res = await fetch(`${api}/api/export-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocios: filtrados, campos: ['nombre','direccion','telefono','rating','emails','fuente','tipos','maps_url'] })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'leadhunter_resultados.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch(e) { alert('Error exportando: ' + e.message); }
    setExportando(false);
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
            <span style={{ color: 'var(--accent)' }}>{leads.length}</span> leads encontrados
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>{conEmail} con email · {leads.length - conEmail} sin email</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportar} disabled={exportando} style={{ height: 40, padding: '0 20px', background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {exportando ? <><Spinner size={12} /> Exportando...</> : '↓ Exportar CSV'}
          </button>
          <button onClick={onReset} style={{ height: 40, padding: '0 20px', background: 'var(--accent)', color: '#0a0a0a', border: 'none', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Nueva búsqueda
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total leads', value: leads.length },
          { label: 'Con email', value: conEmail, accent: true },
          { label: 'Con teléfono', value: leads.filter(l => l.telefono).length },
          { label: 'Tasa de email', value: leads.length ? Math.round(conEmail / leads.length * 100) + '%' : '0%' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: `1px solid ${s.accent ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.accent ? 'var(--accent)' : 'var(--text)', letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, dirección o email..." style={{ flex: 1, minWidth: 200, height: 36, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
        {['todos', 'con_email', 'sin_email'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ height: 36, padding: '0 14px', background: filtro === f ? 'var(--accent)' : 'var(--bg2)', color: filtro === f ? '#0a0a0a' : 'var(--text2)', border: `1px solid ${filtro === f ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: filtro === f ? 600 : 400, transition: 'all 0.15s' }}>
            {{ todos: 'Todos', con_email: 'Con email', sin_email: 'Sin email' }[f]}
          </button>
        ))}
        <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>{filtrados.length} resultados</span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Negocio', 'Dirección', 'Teléfono', 'Email', 'Rating', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>No hay resultados con este filtro</td></tr>
              )}
              {filtrados.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.nombre}</div>
                    {l.tipos && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{l.tipos}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.direccion || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {l.telefono ? <a href={`tel:${l.telefono}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>{l.telefono}</a> : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {l.emails
                      ? <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {l.emails.split(', ').map((e, j) => (
                            <a key={j} href={`mailto:${e}`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>{e}</a>
                          ))}
                        </div>
                      : <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4 }}>sin email</span>
                    }
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {l.rating ? <span style={{ fontSize: 12, color: 'var(--amber)' }}>★ {l.rating}</span> : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {l.maps_url && <a href={l.maps_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Maps →</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Spinner({ size = 16 }) {
  return <div style={{ width: size, height: size, border: `2px solid var(--border)`, borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />;
}
