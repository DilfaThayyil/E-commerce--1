const express = require('express')
const userRouter = express()
const userController = require('../controller/userController')
const cartController = require('../controller/cartController')
const orderController = require('../controller/orderController')
const productController = require('../controller/productController')
const middleware = require('../middleware/user')
userRouter.set('views','./view/user')


userRouter.get('/',middleware.isBlocked,userController.home)
userRouter.get('/login',middleware.isLoged,userController.login)
userRouter.get('/register',middleware.isLoged,userController.register)
userRouter.post('/registerSubmit',middleware.isBlocked,userController.registerSubmit)
userRouter.post('/loginSubmit',middleware.isBlocked,userController.loginSubmit)
userRouter.get('/allproducts',middleware.isBlocked,middleware.isBlocked,productController.allProducts)
userRouter.get('/product/:id',middleware.isBlocked,middleware.isBlocked,productController.singleProduct)
userRouter.get('/categorybased/:id',middleware.isBlocked,middleware.isBlocked,productController.categorybased)
userRouter.get('/otp',middleware.isLoged,userController.otppage)
userRouter.post('/otpSubmit',middleware.isBlocked,userController.otpSubmit)
userRouter.get('/logout',middleware.isBlocked,userController.logout)
userRouter.post('/addtocart/:id/:qnt',cartController.addToCart)
userRouter.get('/cart',middleware.notLoged,cartController.cart)
userRouter.delete('/removeFromCart/:id',cartController.removeFromCart);
userRouter.post('/updatequantity/:id/:newQuantity',cartController.updateCart)
userRouter.get('/checkout',middleware.notLoged,cartController.checkout)
userRouter.post('/addressSubmit',cartController.addressSubmit)
userRouter.post('/resendotp',userController.resendotp)
userRouter.post('/placeOrder',orderController.placeOrder)
userRouter.post('/forgotPassword',userController.forgotPassword)
userRouter.get('/resetPassword',userController.resetPassword)
userRouter.post('/resetPasswordSubmit',userController.resetPasswordSubmit)
userRouter.get('/userProfile',middleware.notLoged,userController.userProfile)
userRouter.post('/editProfile',userController.editProfile)
userRouter.get('/viewOrder/:id',orderController.viewOrder)
userRouter.post('/cancelOrder/:orderid/:productid',orderController.cancelOrder)
userRouter.post('/editAddress',userController.editAddress)
userRouter.post('/profileAddAddress',userController.profileAddAddress)
userRouter.delete('/removeAddress/:id',userController.removeAddress)
userRouter.post('/returnrequest/:orderid/:productid',orderController.returnRequest)
userRouter.get('/sortedProducts',productController.sortedProducts)
userRouter.get('/sortedProductsCat',productController.sortedProducts)
userRouter.post('/changePassword',userController.changePassword)






module.exports=userRouter