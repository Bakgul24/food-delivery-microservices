// src/server.js
require('dotenv').config();

const express = require('express');
const http = require('http');
const connectDB = require('./db');
const { connectRabbitMQ, consumeOrderEvents } = require('./rabbitmq');
const { setupCourierSocket } = require('./courierSocket');
const courierRoutes = require('./routes/courierRoutes');

const app = express();
app.use(express.json());
app.use('/couriers', courierRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'courier-service' });
});

const httpServer = http.createServer(app);
setupCourierSocket(httpServer);

async function start() {
    await connectDB();
    await connectRabbitMQ();
    await consumeOrderEvents();

    const PORT = process.env.PORT || 4005;
    httpServer.listen(PORT, () => {
        console.log(`🚀 courier-service çalışıyor: http://localhost:${PORT}`);
        console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    });
}

start();