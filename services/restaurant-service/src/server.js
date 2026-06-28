// src/server.js
require('dotenv').config();

const express = require('express');
const connectDB = require('./db');
const restaurantRoutes = require('./routes/restaurantRoutes');

const app = express();
app.use(express.json());

app.use('/restaurants', restaurantRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'restaurant-service' });
});

async function start() {
    await connectDB();

    const PORT = process.env.PORT || 4002;
    app.listen(PORT, () => {
        console.log(`🚀 restaurant-service çalışıyor: http://localhost:${PORT}`);
    });
}

start();