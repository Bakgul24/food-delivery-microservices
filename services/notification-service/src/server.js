// src/server.js
require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { consumeEvents } = require('./rabbitmq');

const app = express();
const httpServer = http.createServer(app);
const wss = new WebSocket.Server({ server: httpServer });

const clients = new Set();

wss.on('connection', (ws) => {
    console.log('🔌 Dashboard client bağlandı');
    clients.add(ws);

    ws.on('close', () => {
        clients.delete(ws);
        console.log('🔌 Dashboard client ayrıldı');
    });
});

function broadcast(eventName, data) {
    const message = JSON.stringify({ eventName, data, timestamp: Date.now() });
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'notification-service', connectedClients: clients.size });
});

async function start() {
    // RabbitMQ'dan gelen her event'i, bağlı tüm WebSocket client'larına ilet
    await consumeEvents((eventName, data) => {
        broadcast(eventName, data);
    });

    const PORT = process.env.PORT || 4006;
    httpServer.listen(PORT, () => {
        console.log(`🚀 notification-service çalışıyor: http://localhost:${PORT}`);
    });
}

start();