// src/routes/restaurantRoutes.js
const express = require('express');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const router = express.Router();

// ---- Restoran oluştur ----
router.post('/', async (req, res) => {
    try {
        const { name, ownerId, description } = req.body;

        if (!name || !ownerId) {
            return res.status(400).json({ error: 'name ve ownerId zorunlu' });
        }

        const restaurant = await Restaurant.create({ name, ownerId, description });
        res.status(201).json(restaurant);
    } catch (err) {
        console.error('Restoran oluşturma hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ---- Tüm restoranları listele ----
router.get('/', async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ isOpen: true });
        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ---- Tek bir restoranı, menüsüyle birlikte getir ----
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restoran bulunamadı' });
        }

        const menuItems = await MenuItem.find({ restaurantId: restaurant._id, isAvailable: true });

        res.json({ ...restaurant.toObject(), menu: menuItems });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ---- Restorana menü öğesi ekle ----
router.post('/:id/menu', async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ error: 'name ve price zorunlu' });
        }

        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restoran bulunamadı' });
        }

        const menuItem = await MenuItem.create({
            restaurantId: restaurant._id,
            name,
            price,
        });

        res.status(201).json(menuItem);
    } catch (err) {
        console.error('Menü öğesi ekleme hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;