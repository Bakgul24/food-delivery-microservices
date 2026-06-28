// src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { publishEvent } = require('../rabbitmq');

const router = express.Router();

// ---- KAYIT (Register) ----
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'name, email ve password zorunlu' });
        }

        // Bu email zaten kayıtlı mı kontrol et
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Bu email ile zaten bir hesap var' });
        }

        // Şifreyi hashle (10 = "salt round" sayısı, güvenlik/performans dengesi)
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            passwordHash,
            role: role || 'customer',
        });

        const token = generateToken(user);

        // Diğer servislere "yeni kullanıcı kaydoldu" diye haber ver (asenkron, cevap beklemiyoruz)
        await publishEvent('user.registered', {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });

        res.status(201).json({
            message: 'Kayıt başarılı',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error('Register hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ---- GİRİŞ (Login) ----
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email ve password zorunlu' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Güvenlik notu: "kullanıcı yok" yerine genel bir mesaj veriyoruz,
            // saldırgana "bu email kayıtlı mı değil mi" bilgisini sızdırmamak için
            return res.status(401).json({ error: 'Email veya şifre hatalı' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email veya şifre hatalı' });
        }

        const token = generateToken(user);

        res.json({
            message: 'Giriş başarılı',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error('Login hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;