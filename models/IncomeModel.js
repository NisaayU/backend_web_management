const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Items",
    },
    // FIX: tambahkan field name agar bisa ditampilkan tanpa populate
    name: {
        type: String,
        trim: true,
        default: ''
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true
    }
});

const IncomeSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    title: {
        type: String,
        trim: true,
        maxLength: 50
    },
    items: {
        type: [ItemSchema],
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        trim: true,
        maxLength: 100
    },
    type: {
        type: String,
        default: "income"
    }
}, { timestamps: true });

module.exports = mongoose.model('Income', IncomeSchema);