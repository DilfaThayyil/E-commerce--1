const User = require('../model/userSchema')
const Product = require('../model/products')
const bcrypt =require('bcrypt')
const Category = require('../model/category')
const otpSchema = require('../model/otp')
const Cart = require('../model/cart')
const nodemailer = require('nodemailer');
const Order = require('../model/orderSchema')



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
            return res.redirect('/register')
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



const profileAddAddress = async(req,res)=>{
    try{
        const {name,phone,email,address,pincode,state,city} = req.body
        const userid = req.session.user
        const user = await User.findById(userid)

        user.Addresses.push({
            name,
            phone,
            email,
            address,
            pincode,
            state,
            city
        })
        await user.save()
        console.log(' address added');
        res.redirect('/userProfile')
    }catch(err){
        console.log(err);
    }
}



const forgotPassword = async(req,res)=>{
    try{
        const {email} = req.body
        console.log(email);
        const resetToken = Math.floor(Math.random() * 9000) + 1000;
        const token = await storeResetToken(email, resetToken);
        let message = ''
        if (token) {
            sendResetLink(email, resetToken);
            console.log("Reset link send");
            message = 'Reset link has been sent to your email.'
          setTimeout(()=>{
            res.redirect('/login')
          },10000)
        } else {
            console.log("Error sending reset link")
            res.render('forgotPassword',{msg,errmsg})
        }
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
               <a href="http://localhost:3000/resetPassword?token=${resetToken}">Reset Password</a>`
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
        const user = await User.findOne({Email:email });

        if (!user) {
            console.error('User not found');
            return;
        }

        user.resetToken = resetToken;
        user.resetTokenExpires = Date.now() + 3600000; 
        await user.save();

        console.log('Reset token stored successfully');
        return resetToken
    } catch (error) {
        console.error('Error storing reset token:', error);
        return
    }
}



const resetPassword=async(req,res)=>{
    try{
        const token=req.query.token
        res.render('resetPassword',{token})
    }catch(err){
        console.log(err)
    }
}


const resetPasswordSubmit=async(req,res)=>{
    try{
        const {confirmPassword} = req.body
        const token=req.body.token
        
        const user = await User.findOne({resetToken:token})

        
            const hashedPassword = await bcrypt.hash(confirmPassword,10);
            user.password = hashedPassword;
            user.resetToken = null;
            user.resetTokenExpirationDate = null; 
            await user.save();
            console.log("Password reset successfully")
            res.redirect('/login')
           
    }catch(err){
            console.log(err)
    }
}






const userProfile = async(req,res)=>{
    try{
        const userid = req.session.user
        let orders = await Order.find({userid:userid}).populate({
            path:"products.products",
            model:"Products"
        })
        orders = orders.sort((a, b) => b.date - a.date)
        const user = await User.findOne({_id:userid})
        res.render('profile',{orders,user})
    }catch(err){
        console.log(err);
    }
}


const editProfile = async(req,res)=>{
    try{
        const userid = req.session.user
        const {name,phone} = req.body
        const user = await User.findById(userid)
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
            user.Name = name
            user.PhoneNumber = phone
        await user.save()
        return res.json({success:true , message:'Profile updated successfully', user})
    }catch(err){
        console.log(err)
    }
}

const editAddress = async (req, res) => {
    try {
        const { name, phone, email, address, pincode, state, city, addressId } = req.body;
        const userid = req.session.user;
        const userAddress = await User.findById(userid);
        
        if (!userAddress) {
            return res.json({ message: 'User not found' });
        }

        try {
            await User.findOneAndUpdate(
                { _id: userid, 'Addresses._id': addressId }, // Search by user ID and address ID
                {
                    $set: {
                        'Addresses.$.name': name,
                        'Addresses.$.phone': phone,
                        'Addresses.$.email': email,
                        'Addresses.$.address': address,
                        'Addresses.$.pincode': pincode,
                        'Addresses.$.state': state,
                        'Addresses.$.city': city,
                    },
                }
            );

            console.log('Address updated successfully');
            res.json({ message: 'Address updated successfully' });
        } catch (error) {
            console.error('Error updating address:', error);
            res.json({ message: 'Internal Server Error' });
        }
    } catch (err) {
        console.log(err);
        res.json({ message: 'Internal server Error' });
    }
};




const removeAddress=async (req,res)=>{
    try{
        const userid = req.session.user
        const addressid = req.params.id

        const user = await User.findById(userid)
        if(!user){
            res.json({message:"user not found"})
        }

        user.Addresses.pull({_id:addressid})
        console.log("address removed successfully");
        res.json({message:"Address removed successfully"})
        await user.save()
    }catch(err){
        console.log(err);
    }

}



const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        console.log(req.body);
        const userId = req.session.user;
        const user = await User.findOne({ _id: userId });
        console.log(user);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const passwordMatch = await bcrypt.compare(currentPassword,user.password);
        console.log(passwordMatch);
        if (!passwordMatch) {
            return res.status(400).json({ error: "Incorrect current password" });
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedNewPassword;
        await user.save();
        
        res.json({ message: "Password changed successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};




  
    

module.exports={
    home,
    login,
    register,
    registerSubmit,
    loginSubmit,
    otppage,
    otpSubmit,
    logout,
    resendotp,
    forgotPassword,
    resetPassword,
    resetPasswordSubmit,
    userProfile,
    editProfile,
    editAddress,
    profileAddAddress,
    removeAddress,
    changePassword
}