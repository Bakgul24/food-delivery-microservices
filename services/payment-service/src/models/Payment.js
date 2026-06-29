// src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: String, // order-service'teki sipariş ID'si
            required: true,
        },
        customerId: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ['SUCCESS', 'FAILED'],
            required: true,
        },
        failureReason: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);