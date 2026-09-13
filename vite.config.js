import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import marketSummaryHandler from './api/home/market-summary.js';

// Yerel Vite ortamında /api/home/market-summary isteklerini karşılayan middleware
function apiMiddlewarePlugin() {
  return {
    name: 'api-market-summary-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/home/market-summary') {
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };
          return marketSummaryHandler(req, res);
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiMiddlewarePlugin()],
});
