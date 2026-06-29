// src/routes/courierRoutes.js
const express = require('express');
const Courier = require('../models/Courier');

const router = express.Router();

// ---- Yeni kurye kaydet ----
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'name zorunlu' });
        }

        const courier = await Courier.create({ name });
        res.status(201).json(courier);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ---- Tüm kuryeleri listele ----
router.get('/', async (req, res) => {
    try {
        const couriers = await Courier.find();
        res.json(couriers);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ---- Teslimatı tamamla (kurye tekrar boşa düşer) ----
router.post('/:id/complete-delivery', async (req, res) => {
    try {
        const courier = await Courier.findById(req.params.id);
        if (!courier) {
            return res.status(404).json({ error: 'Kurye bulunamadı' });
        }

        courier.isAvailable = true;
        courier.currentOrderId = null;
        await courier.save();

        res.json(courier);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;