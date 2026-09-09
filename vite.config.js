import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // เปิดให้ bind กับ IP ทุกตัวในเครื่อง (0.0.0.0)
    port: 5173, // เปลี่ยน port ได้ตามต้องการ
  },
})