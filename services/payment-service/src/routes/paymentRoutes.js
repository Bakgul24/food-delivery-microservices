// src/routes/paymentRoutes.js
const express = require('express');
const Payment = require('../models/Payment');

const router = express.Router();

// ---- Ödeme işle (simülasyon) ----
router.post('/', async (req, res) => {
    try {
        const { orderId, customerId, amount } = req.body;

        if (!orderId || !customerId || amount === undefined) {
            return res.status(400).json({ error: 'orderId, customerId ve amount zorunlu' });
        }

        // GERÇEK bir ödeme sağlayıcısı (Stripe, iyzico vb.) burada çağrılırdı.
        // Biz simüle ediyoruz: %90 ihtimalle başarılı, %10 ihtimalle başarısız.
        const isSuccess = Math.random() > 0.1;

        const payment = await Payment.create({
            orderId,
            customerId,
            amount,
            status: isSuccess ? 'SUCCESS' : 'FAILED',
            failureReason: isSuccess ? null : 'Yetersiz bakiye (simüle edilmiş hata)',
        });

        if (!isSuccess) {
            // 402 = Payment Required, ödeme başarısız olduğunda kullanılan standart HTTP kodu
            return res.status(402).json({
                error: payment.failureReason,
                paymentId: payment._id,
            });
        }

        res.status(201).json({
            message: 'Ödeme başarılı',
            paymentId: payment._id,
        });
    } catch (err) {
        console.error('Ödeme işleme hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;