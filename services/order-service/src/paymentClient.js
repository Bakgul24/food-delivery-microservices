// src/paymentClient.js
const axios = require('axios');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL;

/**
 * payment-service'e ödeme talebi gönderir, SENKRON olarak cevabı bekler.
 * Çünkü kullanıcıya "siparişin onaylandı/onaylanmadı" demek için anında sonuca ihtiyacımız var.
 * @returns {Promise<{success: boolean, paymentId?: string, error?: string}>}
 */
async function requestPayment(orderId, customerId, amount) {
    try {
        const response = await axios.post(`${PAYMENT_SERVICE_URL}/payments`, {
            orderId,
            customerId,
            amount,
        });

        return { success: true, paymentId: response.data.paymentId };
    } catch (err) {
        // payment-service 4xx/5xx döndürdüyse veya hiç cevap vermediyse buraya düşer
        const errorMessage = err.response?.data?.error || err.message;
        console.error('❌ Ödeme isteği başarısız:', errorMessage);
        return { success: false, error: errorMessage };
    }
}

module.exports = { requestPayment };