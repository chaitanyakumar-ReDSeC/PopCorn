import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

const subtitleProxyPlugin = (): Plugin => ({
  name: 'subtitle-proxy-plugin',
  configureServer(server) {
    server.middlewares.use('/api/subtitles', async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      try {
        const urlObj = new URL(req.url || '', 'http://localhost');
        const targetUrl = urlObj.searchParams.get('url');

        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing url parameter' }));
          return;
        }

        const upstreamRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PopCornMedia/1.0',
            'Accept': '*/*',
          },
        });

        if (!upstreamRes.ok) {
          res.statusCode = upstreamRes.status;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(`Upstream fetch failed: ${upstreamRes.statusText}`);
          return;
        }

        const subtitleText = await upstreamRes.text();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(subtitleText);
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(err?.message || 'Server proxy failed to fetch subtitle');
      }
    });
  },
});

export default defineConfig(() => {
  return {
    base: '/PopCorn/',
    plugins: [react(), tailwindcss(), subtitleProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
