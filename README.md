# Extension Doctor

> Audita los permisos de tus extensiones de Chrome y muestra un análisis de riesgo heurístico claro y humano.

## ⚠️ Disclaimer

Extension Doctor analiza los permisos declarados de tus extensiones de Chrome y calcula un nivel de riesgo orientativo.  
**No sustituye a un antivirus ni garantiza la ausencia de software malicioso.**

## Stack

- [WXT](https://wxt.dev) — Framework para extensiones de Chrome
- TypeScript
- React 19
- Tailwind CSS

## Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo con HMR
npm run dev

# Build de producción
npm run build

# Empaquetar como ZIP
npm run zip
```

## Estructura del proyecto

```
extension-doctor/
├── entrypoints/
│   ├── background.ts          # Service worker: análisis, alarmas, listeners
│   ├── popup/                 # Popup: dashboard de riesgo
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.html
│   │   └── style.css
│   └── options/               # Options page: configuración y privacidad
│       ├── OptionsApp.tsx
│       ├── main.tsx
│       ├── index.html
│       └── style.css
├── lib/
│   ├── types.ts               # Tipos centrales del proyecto
│   ├── analyzer.ts            # Motor de análisis heurístico
│   ├── permissions-dictionary.ts # Diccionario humano de permisos
│   ├── storage.ts             # Helpers de chrome.storage
│   └── risk-display.ts        # Utilidades de display para niveles de riesgo
├── public/
│   └── icon/                  # Iconos de la extensión
├── wxt.config.ts              # Configuración de WXT + manifest
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

## Documentación

- [PRODUCT_DESIGN.md](./PRODUCT_DESIGN.md) — Documento completo de diseño de producto
- [CHECKLIST.md](./CHECKLIST.md) — Estado del proyecto: qué está hecho y qué falta
