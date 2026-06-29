// src/routes/orderRoutes.js
const express = require('express');
const Order = require('../models/Order');
const { requestPayment } = require('../paymentClient');
const { publishEvent } = require('../rabbitmq');

const router = express.Router();

// ---- Yeni sipariş oluştur ----
router.post('/', async (req, res) => {
    try {
        const { customerId, restaurantId, items } = req.body;

        if (!customerId || !restaurantId || !items || items.length === 0) {
            return res.status(400).json({ error: 'customerId, restaurantId ve items zorunlu' });
        }

        // Toplam fiyatı hesapla
        const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // 1) Siparişi "ödeme bekliyor" durumunda oluştur
        const order = await Order.create({
            customerId,
            restaurantId,
            items,
            totalPrice,
            status: 'PENDING_PAYMENT',
        });

        // 2) payment-service'e SENKRON istek gönder, cevabı bekle
        const paymentResult = await requestPayment(order._id.toString(), customerId, totalPrice);

        if (!paymentResult.success) {
            // Ödeme başarısızsa siparişi iptal et
            order.status = 'CANCELLED';
            await order.save();

            return res.status(402).json({
                error: 'Ödeme başarısız',
                details: paymentResult.error,
                order,
            });
        }

        // 3) Ödeme başarılıysa siparişi onayla
        order.status = 'CONFIRMED';
        await order.save();

        // 4) Diğer servislere haber ver (ASENKRON, cevap beklemiyoruz)
        await publishEvent('order.created', {
            orderId: order._id,
            customerId,
            restaurantId,
            items,
            totalPrice,
            status: order.status,
        });

        res.status(201).json(order);
    } catch (err) {
        console.error('Sipariş oluşturma hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ---- Sipariş durumu görüntüle ----
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// ---- Sipariş durumunu güncelle (restoran/kurye kullanacak) ----
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Geçersiz durum' });
        }

        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        await publishEvent('order.status_changed', {
            orderId: order._id,
            status: order.status,
            customerId: order.customerId,
        });

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;