// src/models/Restaurant.js
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        ownerId: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: '',
        },
        isOpen: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);