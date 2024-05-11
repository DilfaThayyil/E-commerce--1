const User = require('../model/userSchema')
const Product = require('../model/products')
const bcrypt =require('bcrypt')
const Category = require('../model/category')
const otpSchema = require('../model/otp')
const Cart = require('../model/cart')
const nodemailer = require('nodemailer');
const Order = require('../model/orderSchema')



const placeOrder = async (req, res) => {
    try {
        const userid = req.session.user
        const { selectedValue, total } = req.body;
        const cartData = await Cart.findOne({userid:userid}).populate({
            path:"products.productId",
            model:"Products"
        })

        const products = await Promise.all(cartData.products.map(async (cartProduct) => {
            const productDetails = await Product.findById(cartProduct.productId);
            productDetails.Quantity -= cartProduct.quantity;
            await productDetails.save();
            return {
                products: cartProduct.productId,
                name: productDetails.Name,
                price: productDetails.Price,
                quantity: cartProduct.quantity,
                total: cartProduct.totalPrice,
                orderStatus: cartProduct.status,
                image:cartProduct.image,
                reason: cartProduct.cancellationReason,
            };
        }));

        const newOrder = new Order({
            userid: userid,
            address: selectedValue,
            total: total,
            date: new Date(),
            products: products,
            status: 'placed'
        })
        await newOrder.save()
        await Cart.deleteOne({userid:req.session.user})
        
        res.json({ success: true, order: newOrder });
        
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, error: 'An error occurred while placing the order.' });
    }
};


const viewOrder = async(req,res)=>{
    try{
        const userid = req.session.user
        const user = await User.findById(userid)
        const orderId = req.params.id
        const order = await Order.findById(orderId).populate({
            path:"products.products",
            model:"Products",
            populate:{
                path:"Category",
                model:"Category"
            }
        })
        res.render('viewOrder',{user:user,order:order})
    }catch(err){
        console.log(err)
    }
}




const cancelOrder = async(req,res)=>{
    try{
        const {productid,orderid} = req.params

        const order=await Order.findById(orderid)

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        let cancelProduct = order.products.find(product=>
            product.products.toString() === productid
        )
        if (!cancelProduct) {
            return res.json({ success: false, message: 'Product not found in order' });
        }

        cancelProduct.Status='cancelled'
        await order.save()
        const product = await Product.findById(productid)
       
        if (!product) {
            return res.json({ success: false, message: 'Product not found' });
        }

        product.Quantity += cancelProduct.quantity
        await product.save()
        

        res.json({success: true,message: 'Product cancelled successfully'});

    }catch(err){
        console.log(err)
    }
}


const orderSummary= async (req,res)=>{
    try{
  
    const orderid=req.params.id
    const user = await User.findOne({ _id: req.session.user});
    const orders = await Order.find({ _id:orderid})
      .populate({
          path: 'products.products',
          model: 'Products'
      })
      .exec();
  
      res.render("viewOrder",{orders,user,orderid})
  
    }catch(err){
      console.log(err);
    }
}
  



const returnRequest = async (req, res) => {
    const { orderid, productid } = req.params;
    const { reason } = req.body; 

  
    try {
        const updatedOrder = await Order.findOne({_id:orderid});
        const orderproduct = updatedOrder.products.find(p => p.products.equals(productid));

        orderproduct.Status='request return'
        orderproduct.reason=reason
        await updatedOrder.save()
        

          res.json({
            success: true,
            message: 'Product return requested successfully',
            updatedOrder,
        });
    } catch (error) {
        console.error('Error requesting product return:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


module.exports={
    placeOrder,
    viewOrder,
    cancelOrder,
    orderSummary,
    returnRequest
}