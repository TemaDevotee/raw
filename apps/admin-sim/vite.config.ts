import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  server: {
    host: true,
    port: Number(process.env.VITE_ADMIN_PORT) || 5175
  }
});
