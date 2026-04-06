import React, { useState } from 'react';
import ConfigStep from './components/ConfigStep';
import BuscarNegocios from './components/BuscarNegocios';
import BuscarEmails from './components/BuscarEmails';
import Resultados from './components/Resultados';

const API = process.env.REACT_APP_API_URL || '';

export default function App() {
  const [step, setStep] = useState('config');
  const [config, setConfig] = useState({ apiKey: '', lat: '', lng: '', radius: '1000', type: 'establishment' });
  const [negocios, setNegocios] = useState([]);
  const [leads, setLeads] = useState([]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header step={step} />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
        {step === 'config' && (
          <ConfigStep config={config} setConfig={setConfig} onNext={() => setStep('negocios')} />
        )}
        {step === 'negocios' && (
          <BuscarNegocios
            config={config}
            api={API}
            onBack={() => setStep('config')}
            onNext={(data) => { setNegocios(data); setStep('emails'); }}
          />
        )}
        {step === 'emails' && (
          <BuscarEmails
            negocios={negocios}
            api={API}
            onBack={() => setStep('negocios')}
            onNext={(data) => { setLeads(data); setStep('resultados'); }}
            onSkip={() => { setLeads(negocios); setStep('resultados'); }}
          />
        )}
        {step === 'resultados' && (
          <Resultados
            leads={leads}
            api={API}
            onReset={() => { setStep('config'); setNegocios([]); setLeads([]); }}
          />
        )}
      </main>
    </div>
  );
}

function Header({ step }) {
  const steps = ['config', 'negocios', 'emails', 'resultados'];
  const labels = ['Configurar', 'Negocios', 'Emails', 'Resultados'];
  const current = steps.indexOf(step);

  return (
    <header style={{ borderBottom: '1px solid var(--border)', padding: '0 24px', marginBottom: 48 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="5" cy="5" r="3.5" stroke="#0a0a0a" strokeWidth="1.5"/>
              <path d="M8 8L12 12" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>LeadHunter</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20,
                background: i === current ? 'var(--accent)' : 'transparent',
                color: i === current ? '#0a0a0a' : i < current ? 'var(--text2)' : 'var(--text3)',
                fontSize: 12, fontWeight: i === current ? 600 : 400, transition: 'all 0.2s'
              }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                  background: i === current ? '#0a0a0a' : i < current ? 'var(--border2)' : 'var(--border)',
                  color: i === current ? 'var(--accent)' : i < current ? 'var(--text2)' : 'var(--text3)',
                  fontWeight: 600
                }}>{i < current ? '✓' : i + 1}</span>
                <span style={{ display: window.innerWidth < 600 ? 'none' : 'inline' }}>{labels[i]}</span>
              </div>
              {i < steps.length - 1 && <div style={{ width: 16, height: 1, background: 'var(--border)' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </header>
  );
}
