// src/server.js
require('dotenv').config();

const express = require('express');
const connectDB = require('./db');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
app.use(express.json());

app.use('/payments', paymentRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'payment-service' });
});

async function start() {
    await connectDB();

    const PORT = process.env.PORT || 4004;
    app.listen(PORT, () => {
        console.log(`🚀 payment-service çalışıyor: http://localhost:${PORT}`);
    });
}

start();