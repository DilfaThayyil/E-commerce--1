const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
                required: true
            },
            quantity:{
                type:Number,
                required:true
            },
            totalPrice:{
                type:Number,
                required:true
            }
        }
    ]            
})

const Order = mongoose.model("Order",orderSchema)
module.exports=Order