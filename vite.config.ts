import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // Prefijo público con barra final; lo pasa el build de CI (BASE_PATH). VITE_BASE_PATH es el de VPS-04.
    base: process.env.BASE_PATH || process.env.VITE_BASE_PATH || '/gestion-personal-sytec/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: ['cncivil04.pjn.gov.ar'],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      allowedHosts: ['cncivil04.pjn.gov.ar'],
    },
  };
});
