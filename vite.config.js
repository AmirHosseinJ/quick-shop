import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
        https: {
            key: fs.readFileSync('C:/wamp64/bin/apache/apache2.4.62.1/conf/ssl/localhost-key.pem'),
            cert: fs.readFileSync('C:/wamp64/bin/apache/apache2.4.62.1/conf/ssl/localhost.pem'),
        },
        host: 'localhost',
        port: 5174,
    },
})
