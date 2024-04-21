const mongoose = require('mongoose')
const userOtpVerificationSchema = mongoose.Schema({
    email:{
        type:String,
    },
    name:{
        type:String
    },
    otp:{
        type:String,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
})
userOtpVerificationSchema.index({createdAt:1},{expireAfterSeconds:120})
const userOtpVerification=mongoose.model('userOtpVerification',userOtpVerificationSchema)

module.exports = userOtpVerification