const express = require('express')
const userRouter = express()
const userController = require('../controller/userController')
const middleware = require('../middleware/user')
userRouter.set('views','./view/user')


userRouter.get('/',middleware.isBlocked,userController.home)
userRouter.get('/login',middleware.isLoged,userController.login)
userRouter.get('/register',middleware.isLoged,userController.register)
userRouter.post('/registerSubmit',middleware.isBlocked,userController.registerSubmit)
userRouter.post('/loginSubmit',middleware.isBlocked,userController.loginSubmit)
userRouter.get('/allproducts',middleware.isBlocked,middleware.isBlocked,userController.allProducts)
userRouter.get('/product/:id',middleware.isBlocked,middleware.isBlocked,userController.singleProduct)
userRouter.get('/categorybased/:id',middleware.isBlocked,middleware.isBlocked,userController.categorybased)
userRouter.get('/otp',middleware.isLoged,userController.otppage)
userRouter.post('/otpSubmit',middleware.isBlocked,userController.otpSubmit)
userRouter.get('/logout',middleware.isBlocked,userController.logout)
userRouter.post('/addtocart/:id/:qnt',userController.addToCart)
userRouter.get('/cart',middleware.notLoged,userController.cart)
userRouter.delete('/removeFromCart/:id',userController.removeFromCart);
userRouter.post('/updatequantity/:id/:newQuantity',userController.updateCart)
userRouter.get('/checkout',middleware.notLoged,userController.checkout)
userRouter.post('/addressSubmit',userController.addressSubmit)
userRouter.post('/resendotp',userController.resendotp)
userRouter.get('/placeOrder',userController.placeOrder)
userRouter.post('/resetPassword',userController.resetPassword)

module.exports=userRouter