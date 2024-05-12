const User = require('../model/userSchema')
const Product = require('../model/products')
const bcrypt =require('bcrypt')
const Category = require('../model/category')
const otpSchema = require('../model/otp')
const Cart = require('../model/cart')
const nodemailer = require('nodemailer');
const Order = require('../model/orderSchema')


const cart = async(req,res)=>{
    try{
        const userId = req.session.user
        const cart = await Cart.findOne({userid:userId}).populate({
            path:"products.productId",
            model:"Products"
        })
        if (!cart) {
            return res.render('cart', { cart: null, totalPrice: 0, subtotal: 0 });
        }

        const totalPrice = cart.products.reduce((total, product) => {
            return total + product.totalPrice;
        }, 0);
        subtotal = totalPrice
        
        res.render('cart',{cart,totalPrice,subtotal})
    }catch(err){
        console.log(err);
    }
}


const addToCart = async (req, res) => {
    try {
        const productId = req.params.id
        const userId = req.session.user
        const quantity=req.params.qnt
        const check = await Product.findById(productId)
        if (!userId) {
             res.json({ error: 'User not authenticated' });
        }    
        const userCart = await Cart.findOne({userid:userId});
        let PRODUCT={
            productId:productId,
            quantity:quantity,
            totalPrice:quantity*check.DiscountPrice
        }
        if (!userCart) {
            
             const userCart = new Cart({
                userid:userId,
                products:[PRODUCT]
               
             })
             await userCart.save()
        }else{
            userCart.products.push(PRODUCT)
            await userCart.save()
        }
         res.json({ message: 'Product added to cart successfully' });
    } catch (err) {
        console.log(err);
    }
};

const removeFromCart = async (req, res) => {
    try {
        const productid = req.params.id; 
        const result = await Cart.updateOne(
            { "products.productId": productid },
            { $pull: { products: { productId: productid } } }
        )
        

        if(result.deletedCount > 0){
            res.json({message: "Product removed from cart successfully" });
        }else{
            res.json({ error: "Product not found in cart" });
        }    
    } catch (err) {
        console.error(err);
        res.json({error: "Internal server error" });
    }
}


         
const updateCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const newQuantity = req.params.newQuantity;
        const userCart = await Cart.findOne({ userid: req.session.user });

        const cartProduct = userCart.products.find(p => p.productId.equals(productId));
        const findProduct = await Product.findById(productId);
        cartProduct.quantity = newQuantity;
        cartProduct.totalPrice = newQuantity * findProduct.DiscountPrice;
        const productprice=newQuantity * findProduct.DiscountPrice;
        await userCart.save();
        const totalPrice = userCart.products.reduce((total, product) => {
            return total + product.totalPrice;
        }, 0);
        subtotal = totalPrice
        res.json({success:true, cart: userCart, productprice ,subtotal, totalPrice}); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const checkout = async (req,res)=>{
    try{
        const userid = req.session.user
        const user = await User.findById(userid)
        const cartData = await Cart.findOne({userid:userid}).populate({
            path:"products.productId",
            model:"Products"
        })
        const totalPrice = cartData.products.reduce((total, product) => {
            return total + product.totalPrice;
        }, 0);
        subtotal = totalPrice
        res.render('checkout',{user,cartData,totalPrice,subtotal})
    }catch(err){
        console.log(err);
    }
}




const addressSubmit = async(req,res)=>{
    try{
        const {name,phone,email,address,pincode,state,city} = req.body
        console.log(req.body)
        const userid = req.session.user
        const user = await User.findById(userid)
        
        user.Addresses.push({
            name,
            email,
            phone,
            address,
            pincode,
            state,
            city
        })
        const updatedUser = await user.save()        
        res.redirect('/checkout')
    }catch(err){
        console.log(err)
        res.send('Internal Server Error');

    }
}


module.exports={
    cart,
    addToCart,
    removeFromCart,
    updateCart,
    checkout,
    addressSubmit
}