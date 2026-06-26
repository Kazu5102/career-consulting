// v6.51 - 2026-06-26 - API疎通可能性確保のためのローカル開発プロキシミドルウェア実装
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import handler from './api/gemini-proxy'

export const VERSION = "6.51";

// Custom local API proxy middleware for AI Studio preview environment
const localApiMiddleware = (): any => ({
  name: 'local-api-middleware',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url?.startsWith('/api/gemini-proxy')) {
        try {
          // JSON body parsing for Vite Connect middleware
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          await new Promise<void>((resolve) => req.on('end', () => resolve()));
          
          req.body = body ? JSON.parse(body) : {};
          
          // Mimic VercelResponse methods
          res.status = (statusCode: number) => {
            res.statusCode = statusCode;
            return res;
          };
          res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
          
          // Call the Vercel handler directly with mocked req/res
          await handler(req, res);
        } catch (error: any) {
          console.error("Vite API proxy error:", error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
          }
        }
      } else {
        next();
      }
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localApiMiddleware()],
})

