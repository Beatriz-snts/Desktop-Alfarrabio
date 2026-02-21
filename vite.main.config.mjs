import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    target: 'node22',
    rollupOptions: {
      // Módulos nativos e electron NUNCA devem ser empacotados
      external: [
        'better-sqlite3',
        'electron',
        'bcryptjs',
      ],
      output: {
        // Preserva require() para módulos nativos
        format: 'cjs',
      },
    },
  },
});
