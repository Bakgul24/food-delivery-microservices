// src/models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
    {
        customerId: {
            type: String, // auth-service'teki kullanıcı ID'si (başka servisin verisi, sadece referans tutuyoruz)
            required: true,
        },
        restaurantId: {
            type: String, // restaurant-service'teki restoran ID'si
            required: true,
        },
        items: [orderItemSchema],
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING_PAYMENT', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'],
            default: 'PENDING_PAYMENT',
        },
        courierId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);