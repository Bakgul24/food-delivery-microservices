// src/models/Courier.js
const mongoose = require('mongoose');

const courierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        isAvailable: {
            type: Boolean,
            default: true, // boşta mı, yoksa bir teslimatta mı
        },
        currentOrderId: {
            type: String,
            default: null,
        },
        currentLocation: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Courier', courierSchema);