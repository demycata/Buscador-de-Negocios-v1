# LeadHunter 🔍

Encuentra negocios sin sitio web cerca tuyo y consigue sus emails automáticamente.

## Correr en local

```bash
# 1. Instalar dependencias del backend
npm install

# 2. Instalar dependencias del frontend
cd client && npm install && cd ..

# 3. Correr backend (puerto 3001)
npm start

# 4. En otra terminal, correr frontend (puerto 3000)
cd client && npm start
```

Abrí http://localhost:3000

## Deploy en Railway (recomendado, gratis)

1. Creá cuenta en **railway.app**
2. Nuevo proyecto → **Deploy from GitHub repo**
3. Conectá tu repo
4. Railway detecta automáticamente Node.js y corre `npm run build` + `npm start`
5. En Settings → Variables, agregá si necesitás variables de entorno

## Deploy en Render (alternativa gratis)

1. Creá cuenta en **render.com**
2. New → **Web Service** → conectá tu repo
3. Build command: `npm install && npm run build`
4. Start command: `node server/index.js`
5. Plan: **Free**

## Estructura del proyecto

```
leadhunter/
├── server/
│   └── index.js          # Backend Express + lógica de scraping
├── client/
│   ├── public/
│   └── src/
│       ├── App.js
│       └── components/
│           ├── ConfigStep.js     # Paso 1: configuración
│           ├── BuscarNegocios.js # Paso 2: Google Maps API
│           ├── BuscarEmails.js   # Paso 3: scraping de emails
│           └── Resultados.js     # Paso 4: tabla + export CSV
├── package.json
└── Procfile
```

## Requisitos

- Node.js 18+
- Google Maps API Key con **Places API** habilitada
- Sin restricciones de IP en la API Key (o agregar la IP del servidor)
