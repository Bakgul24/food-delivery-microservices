// src/server.js
require('dotenv').config();

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Her route grubu, ilgili servise yönlendiriliyor (proxy).
// pathRewrite ile "/api/auth" önekini siliyoruz, çünkü auth-service kendi içinde
// path'i sadece "/auth/..." olarak bekliyor (gateway'in eklediği "/api" gerçek serviste yok).

app.use('/api/auth', createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/auth/' },
}));

app.use('/api/restaurants', createProxyMiddleware({
    target: process.env.RESTAURANT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/restaurants/' },
}));

app.use('/api/orders', createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/orders/' },
}));

app.use('/api/payments', createProxyMiddleware({
    target: process.env.PAYMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/payments/' },
}));

app.use('/api/couriers', createProxyMiddleware({
    target: process.env.COURIER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/couriers/' },
}));

// Gateway'in kendi health check'i (tüm sistemin "kapısı" ayakta mı diye)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'api-gateway' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚪 API Gateway çalışıyor: http://localhost:${PORT}`);
});