// src/server.js
require('dotenv').config();

const express = require('express');
const connectDB = require('./db');
const { connectRabbitMQ } = require('./rabbitmq');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
app.use(express.json());

app.use('/orders', orderRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'order-service' });
});

async function start() {
    await connectDB();
    await connectRabbitMQ();

    const PORT = process.env.PORT || 4003;
    app.listen(PORT, () => {
        console.log(`🚀 order-service çalışıyor: http://localhost:${PORT}`);
    });
}

start();