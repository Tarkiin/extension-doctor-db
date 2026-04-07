import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Extension Doctor',
    description:
      'Audita los permisos de tus extensiones de Chrome y muestra un análisis de riesgo heurístico claro y humano.',
    version: '0.1.0',
    permissions: ['management', 'storage', 'alarms'],
    icons: {
      16: '/icon/16.png',
      32: '/icon/32.png',
      48: '/icon/48.png',
      128: '/icon/128.png',
    },
  },
});
