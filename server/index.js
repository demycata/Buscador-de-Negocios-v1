const express = require('express');
const cors = require('cors');
const axios = require('axios');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve React build in production
app.use(express.static(path.join(__dirname, '../client/build')));

const sleep = ms => new Promise(r => setTimeout(r, ms));

// SSE helper — sends progress events to the frontend
function createSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  return (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
}

// ─── SCRIPT 1: Buscar negocios sin web ───────────────────────
app.get('/api/buscar-negocios', async (req, res) => {
  const { apiKey, lat, lng, radius, type } = req.query;
  if (!apiKey || !lat || !lng) return res.status(400).json({ error: 'Faltan parámetros' });

  const emit = createSSE(res);
  const BASE = 'https://maps.googleapis.com/maps/api/place';
  const location = `${lat},${lng}`;
  const sinWeb = [];
  let pageToken = '';
  let pagina = 1;
  let totalAnalizados = 0;

  try {
    do {
      emit('status', { msg: `Buscando página ${pagina}...`, pagina });

      const params = { location, radius: radius || 1000, type: type || 'establishment', language: 'es', key: apiKey };
      if (pageToken) params.pagetoken = pageToken;

      const { data } = await axios.get(`${BASE}/nearbysearch/json`, { params });

      if (data.status === 'REQUEST_DENIED') {
        emit('error', { msg: 'API Key inválida o Places API no habilitada: ' + data.error_message });
        return res.end();
      }
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        emit('error', { msg: 'Error de Google: ' + data.status });
        return res.end();
      }

      const lugares = data.results || [];
      emit('status', { msg: `Página ${pagina}: ${lugares.length} negocios. Verificando sitios web...` });

      for (const lugar of lugares) {
        totalAnalizados++;
        try {
          const det = await axios.get(`${BASE}/details/json`, {
            params: { place_id: lugar.place_id, fields: 'name,website,formatted_address,formatted_phone_number,rating,types,url', language: 'es', key: apiKey }
          });
          const d = det.data.result || {};

          emit('progreso', { nombre: lugar.name, tieneWeb: !!d.website, total: totalAnalizados });

          if (!d.website) {
            const negocio = {
              nombre: d.name || lugar.name,
              direccion: d.formatted_address || lugar.vicinity || '',
              telefono: d.formatted_phone_number || '',
              rating: d.rating ? d.rating.toFixed(1) : '',
              tipos: (d.types || []).filter(t => !['point_of_interest','establishment'].includes(t)).slice(0,2).map(t => t.replace(/_/g,' ')).join(', '),
              maps_url: d.url || '',
              place_id: lugar.place_id,
            };
            sinWeb.push(negocio);
            emit('negocio', negocio);
          }
        } catch (e) {
          emit('status', { msg: `⚠️ Error con ${lugar.name}, continuando...` });
        }
        await sleep(200);
      }

      pageToken = data.next_page_token || '';
      pagina++;
      if (pageToken) await sleep(3000);

    } while (pageToken);

    emit('done', { total: totalAnalizados, sinWeb: sinWeb.length, negocios: sinWeb });

  } catch (e) {
    emit('error', { msg: e.message });
  }

  res.end();
});

// ─── SCRIPT 2: Buscar emails ──────────────────────────────────
app.post('/api/buscar-emails', async (req, res) => {
  const { negocios } = req.body;
  if (!negocios || !negocios.length) return res.status(400).json({ error: 'No hay negocios' });

  const emit = createSSE(res);

  function extraerEmails(texto) {
    const regex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const encontrados = texto.match(regex) || [];
    const blacklist = ['sentry', 'example', 'wix', 'google', 'png', 'jpg', 'svg', 'webp', '@2x', 'schema', 'apple'];
    return [...new Set(encontrados)].filter(e => !blacklist.some(b => e.toLowerCase().includes(b)));
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const resultados = [];

    for (let i = 0; i < negocios.length; i++) {
      const n = negocios[i];
      emit('status', { msg: `[${i+1}/${negocios.length}] Buscando: ${n.nombre}`, idx: i });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
      const emails = [];
      const fuentes = [];

      const buscar = async (query, fuente) => {
        try {
          await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es`, { waitUntil: 'domcontentloaded', timeout: 12000 });
          await sleep(1200);
          const texto = await page.evaluate(() => document.body.innerText);
          const found = extraerEmails(texto);
          if (found.length) { emails.push(...found); fuentes.push(fuente); }
        } catch(e) {}
      };

      const ciudad = n.direccion ? n.direccion.split(',').slice(-2).join(',').trim() : '';
      await buscar(`"${n.nombre}" ${ciudad} email OR contacto`, 'Google');
      await buscar(`site:facebook.com "${n.nombre}" ${ciudad}`, 'Facebook');
      await buscar(`site:instagram.com "${n.nombre}"`, 'Instagram');

      await page.close();

      const resultado = {
        ...n,
        emails: [...new Set(emails)].join(', '),
        fuente: fuentes.join(', ') || '',
      };
      resultados.push(resultado);
      emit('resultado', { ...resultado, idx: i, total: negocios.length });
      await sleep(1500);
    }

    await browser.close();
    emit('done', { resultados });

  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    emit('error', { msg: e.message });
  }

  res.end();
});

// ─── CSV export ───────────────────────────────────────────────
app.post('/api/export-csv', (req, res) => {
  const { negocios, campos } = req.body;
  if (!negocios?.length) return res.status(400).json({ error: 'Sin datos' });

  const headers = campos || ['nombre','direccion','telefono','rating','emails','fuente','maps_url'];
  const titleMap = { nombre:'Nombre', direccion:'Dirección', telefono:'Teléfono', rating:'Rating', emails:'Emails', fuente:'Fuente', maps_url:'Google Maps', tipos:'Tipos' };

  const csvRows = [headers.map(h => titleMap[h] || h).join(',')];
  for (const n of negocios) {
    csvRows.push(headers.map(h => `"${(n[h] || '').toString().replace(/"/g, '""')}"`).join(','));
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leadhunter_resultados.csv"');
  res.send('\uFEFF' + csvRows.join('\n'));
});

// Fallback for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`\n🚀 LeadHunter corriendo en http://localhost:${PORT}\n`));
