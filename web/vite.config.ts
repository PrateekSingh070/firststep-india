import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jobs from './api/jobs.js';
import status from './api/status.js';
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'firststep-local-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = (req.url || '').split('?')[0];
          const handler =
            path === '/api/jobs'
              ? jobs
              : path === '/api/status'
                ? status
                : null;
          if (!handler) return next();
          const response = {
            setHeader: (key, value) => res.setHeader(key, value),
            status(code) {
              res.statusCode = code;
              return response;
            },
            json(body) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(body));
              return response;
            },
          };
          Promise.resolve(handler(req, response)).catch(next);
        });
      },
    },
  ],
});
