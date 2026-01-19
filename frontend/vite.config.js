import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: "jsx", // Force loader to treat files as JSX
    include: /src\/.*\.js$/, // Apply to all .js files in src
    exclude: [],
  },
});