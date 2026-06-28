// src/server.js
require('dotenv').config();

const express = require('express');
const connectDB = require('./db');
const { connectRabbitMQ } = require('./rabbitmq');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);

// Basit bir health check endpoint'i - servis ayakta mı kontrol etmek için
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth-service' });
});

async function start() {
    await connectDB();
    await connectRabbitMQ();

    const PORT = process.env.PORT || 4001;
    app.listen(PORT, () => {
        console.log(`🚀 auth-service çalışıyor: http://localhost:${PORT}`);
    });
}

start();