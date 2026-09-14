import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import marketSummaryHandler from './api/home/market-summary.js';
import fundHistoryHandler from './api/funds/history.js';

// Yerel Vite ortamında /api isteklerini karşılayan middleware
function apiMiddlewarePlugin() {
  return {
    name: 'api-middleware-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const fullUrl = req.url || '';
        const pathname = fullUrl.split('?')[0];

        if (pathname === '/api/home/market-summary') {
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

        if (pathname === '/api/funds/history') {
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };
          try {
            const parsedUrl = new URL(fullUrl, 'http://localhost');
            req.query = Object.fromEntries(parsedUrl.searchParams);
          } catch (_) {
            req.query = {};
          }
          return fundHistoryHandler(req, res);
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
