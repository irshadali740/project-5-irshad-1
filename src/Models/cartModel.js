const mongoose = require('mongoose');
let objectId = mongoose.Types.ObjectId

const cartSchema = new mongoose.Schema({
    userId: {
        type: objectId,
        ref: 'User'
    },
    items: [{
        productId:
            { type: objectId, ref: 'Product', required: true },
        quantity: {
            type: Number,
            default: 1
        }
    }],
    totalPrice: {
        type: Number,
    },
    totalItems: {
        type: Number
    },

}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema)