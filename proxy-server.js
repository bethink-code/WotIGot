const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
});

const expoProxy = createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  ws: true,
  onProxyReq: (proxyReq) => {
    proxyReq.removeHeader('origin');
  },
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return apiProxy(req, res, next);
  }
  return expoProxy(req, res, next);
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Dev proxy on port 5000 -> API:3000, Expo:5001');
});
