// src/db.js
const mongoose = require('mongoose');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB bağlantısı başarılı (courier-db)');
    } catch (err) {
        console.error('❌ MongoDB bağlantı hatası:', err.message);
        process.exit(1);
    }
}

module.exports = connectDB;