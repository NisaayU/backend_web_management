const mongoose = require('mongoose');


const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }, 
    stock: {
        type: Number, 
        required: true,
        default: 0,
    },
    minStock: {
        type: Number,
        default: 5,
    }
},
    {timestamps: true}
);

module.exports = mongoose.model("Items", ItemSchema);