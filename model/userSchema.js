const mongoose = require('mongoose')
const user = new mongoose.Schema({
    Name:{
        type:String,
        required:true
    },
    Email:{
        type:String,
        required:true
    },
    PhoneNumber:{
        type:Number,
    
    },
    resetToken:{
        type:String,
        default:null
    },
    password:{
        type:String,
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    cart:{
        products:[String]
    },
    Addresses:[{
        name:{
            type:String
        },
        phone:{
            type:String
        },
        email:{
            type:String
        },
        address:{
            type:String
        },
        pincode:{
            type:String
        },
        state:{
            type:String
        },
        city:{
            type:String
        }

    }]
})


const User = mongoose.model('User', user);
module.exports = User;
