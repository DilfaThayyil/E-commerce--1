const User = require('../model/userSchema')
const Product = require('../model/products')
const bcrypt =require('bcrypt')
const Category = require('../model/category')
const otpSchema = require('../model/otp')
const Cart = require('../model/cart')
const nodemailer = require('nodemailer');




const home = async(req,res)=>{
    try{
        const user=req.session.name
        const products = await Product.find({Status:'active'}).populate('Category')
        const product = products.filter(product => product.Category.Status !== "blocked");
        res.render('home',{product,user})
    }catch(err){
        console.log(err);
    }
}

const login = (req,res)=>{
    try{
        const msg = req.flash('err')
        res.render('login',{msg})
    }catch(err){
        console.log(err);
    }
}

const register = (req,res)=>{
    try{
        res.render('register')
    }catch(err){
        console.log(err);
    }
}

const registerSubmit = async (req,res)=>{
    try{
        const {name,email,mobileNumber,password} = req.body
        const check = await User.findOne({Email:email})
        if(check){
            const message = "email already exist"
            req.flash('err',message)
            res.redirect('/register')
        }else{  
           const bcryptPassword=  await bcrypt.hash(password,10)
            const user = {
                Name : name,
                Email : email,
                PhoneNumber : mobileNumber,
                password : bcryptPassword 
            }
            
            otp(email,name)
            
            req.session.userData = user
            res.redirect(`/otp`)
        }
    }catch(err){
        console.log(err);
    }
}

const loginSubmit = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({Email:email});
        console.log(email);
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password); 
            if (passwordMatch) {
                if(user.isBlocked){
                    const msg = 'Your account is blocked'
                    req.flash('err',msg)
                    res.redirect('/login')
                    
                }else{
                    req.session.user = user._id;
                    req.session.name = user.Name;
                    console.log(req.session.user);
                    res.redirect('/');
    
                }
            } else {
                const error = "Password is incorrect";
                req.flash('err', error);
                res.redirect('/login');
            }
        } else {
            const error = "Email not found";
            req.flash('err', error);
            res.redirect('/login');
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
}


const allProducts = async (req,res)=>{
    try{
        const products = await Product.find({Status:"active"}).populate('Category')
        const product = products.filter(product => product.Category.Status !== "blocked");
        const category = await Category.find({Status:"active"})
        
        res.render('allproducts',{product,category,message:req.query.message})
    }catch(err){
        console.log(err);
    }
}

const singleProduct = async(req,res)=>{
    try{
        const singleproductId =req.params.id
        const userId = req.session.user
        const product = await Product.findById(singleproductId).populate('Category')
        const recommend = await Product.find({Category:product.Category._id}).limit(4)
        const cart = await Cart.findOne({userid:userId})
    
        if(cart){
          let already=cart.products.forEach(product=>{
                if(product.productId==singleproductId){
                    return true
                }else{
                    return  false
                }
            })
            console.log(already);
        }
       
        res.render('singleproduct',{product,recommend})
    }catch(err){
        console.log(err);
    }
}

const categorybased = async(req,res)=>{
    try{
        const categoryid = req.params.id
        const totalProducts = await Product.find({Category:categoryid})
        console.log(totalProducts);
        const category = await Category.find({Status:"active"})
        res.render('categorybased', { category,totalProducts});
    }catch(err){
        console.log(err);
    }
}


async function otp  (Email,Name){
    let Otp = Math.floor(Math.random() * 9000) + 1000;
    const otp = new otpSchema({
        email:Email,
        name:Name,
        otp:Otp
    })
  let userotp = await otp.save()
// Create a transporter object using SMTP transport
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dilfathayyil@gmail.com', // Your Gmail address
        pass: 'ydwv upst yblp igrq' // Your Gmail password
    }
});

// Define email message options
let mailOptions = {
    from: 'dilfathayyil@gmail.com',
    to: `${Email}`,
    subject: 'Otp verification',
    text: `Dear ${Name} , Your otp is ${userotp.otp} . it will expire in 2 minutes`
};

// Send email
transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
        console.log('Error occurred:', error);
    } else {
        console.log('Email sent:', info.response);
    }
});


}

const otppage = async(req,res)=>{
    try{
        const errmsg = req.flash('err')
        let msg = 'Please check your mail'
        res.render('otp',{msg,errmsg})
    }catch(err){
        console.log(err);
    }
}




const otpSubmit = async (req, res) => {
    try {
        const { digit1, digit2, digit3, digit4 } = req.body;
        const otpnumber =  digit1 + digit2 + digit3 + digit4;
        const user = req.session.userData;
        console.log(otpnumber);
        const check = await otpSchema.findOne({ email: user.Email });
        
        if (check.otp == otpnumber) {
            const insertuser = new User(user);
            await insertuser.save();
            req.session.user = insertuser._id;
            req.session.name = insertuser.Name;
            req.session.userData = null;
            res.json({ success: true, message: "OTP verified successfully." });
        } else {
            res.status(400).json({ success: false, message: "OTP is invalid" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "An error occurred." });
    }
};

const resendotp = async (req,res)=>{
    try{
        const user = req.session.userData
        otp(user.Email,user.Name)
        res.json({success:true})
    }catch(err){
        console.log(err)
    }
}


const logout = async(req,res)=>{
    try{
        req.session.user=null
        req.session.name = null
        res.redirect('/')
    }catch(err){
        console.log(err);
    }
}

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
         console.log(productId+" : "+userId+" : "+quantity);
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
        console.log("productId : "+productid)
        console.log("result : "+result)

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



//         
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
        
        res.render('checkout',{user})
    }catch(err){
        console.log(err);
    }
}

const addressSubmit = async(req,res)=>{
    try{
        const {name,phone,email,address,pincode,state,city} = req.body
        
        const userid = req.session.user
        const user = await User.findById(userid)
        console.log("hekko");
        
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

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user
        const userCart = await Cart.find({userid:userId})
        const { address, city, state, pincode } = req.body;
        const orderData = {
            address,
            city,
            state,
            pincode,
        };

        await orderData.save()

        res.json({ success: true, message: 'Order placed successfully!', orderData });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, error: 'An error occurred while placing the order.' });
    }
};



const resetPassword = async(req,res)=>{
    try{
        const {email} = req.body
        const resetToken = generateResetToken()
        storeResetToken(email, resetToken)
        sendResetLink(email, resetToken)
        res.json({message:'Reset link send successfully'})
    }catch(err){
        console.log(err)
    }
}


// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dilfathayyil@gmail.com',
        pass: 'ydwv upst yblp igrq'
    }
});



// Function to send reset link
function sendResetLink(email, resetToken) {
    const mailOptions = {
        from: 'dilfathayyil@gmail.com',
        to: email,
        subject: 'Password Reset Link',
        html: `<p>Click the following link to reset your password:</p>
               <a href="http://yourwebsite.com/reset-password?token=${resetToken}">Reset Password</a>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending reset link:', error);
        } else {
            console.log('Reset link sent:', info.response);
        }
    });
}


async function storeResetToken(email, resetToken) {
    try {
        // Find the user by their email address
        const user = await User.findOne({ email });

        if (!user) {
            // Handle case where user with the provided email is not found
            console.error('User not found');
            return;
        }

        // Store the reset token in the user's document
        user.resetToken = resetToken;
        user.resetTokenExpires = Date.now() + 3600000; // Set expiration time (e.g., 1 hour)
        await user.save();

        console.log('Reset token stored successfully');
    } catch (error) {
        console.error('Error storing reset token:', error);
    }
}







module.exports={
    home,
    login,
    register,
    registerSubmit,
    loginSubmit,
    allProducts,
    singleProduct,
    categorybased,
    otppage,
    otpSubmit,
    logout,
    cart,
    addToCart,
    removeFromCart,
    updateCart,
    checkout,
    addressSubmit,
    resendotp,
    placeOrder,
    resetPassword,
    sendResetLink
}