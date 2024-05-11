const express= require('express')
const adminRouter = express()
const adminController = require('../controller/adminController')
const multer=require('multer')
const adminMiddleware = require('../middleware/admin')
adminRouter.set('views','./view/admin')
const Products=require('../model/products')




const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    }
  });
  
  const upload = multer({ storage: storage });
  adminRouter.post('/addImage', upload.single('image'), async (req, res) => {
    try {
        const productId = req.body.productId; 
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
  
        if (req.file) {
            product.Images.push(req.file.filename);
        } else {
            return res.status(400).json({ error: 'No image file provided' });
        }
  
        await product.save();
  
        res.json({ success: true, message: 'Image added to the product successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  



adminRouter.get('/',adminController.dashboard)
adminRouter.get('/login',adminMiddleware.isLoged,adminController.login)
adminRouter.post('/loginsubmit',adminController.loginSubmit)
adminRouter.get('/allproducts',adminController.allProducts)
adminRouter.get('/allusers',adminController.allUsers)
adminRouter.get('/category',adminController.category)
adminRouter.get('/allorders',adminController.allOrders)
adminRouter.get('/addproducts',adminController.addProducts)
adminRouter.post('/addProductsSubmit',adminController.addProductsSubmit)
adminRouter.get('/addcategory',adminController.addCategory)
adminRouter.post('/addCategorySubmit',adminController.addCategorySubmit)
adminRouter.get('/blockuser/:id',adminController.blockUser)
adminRouter.get('/unblockuser/:id',adminController.unBlockUser)
adminRouter.get('/blockproduct/:id',adminController.blockProduct)
adminRouter.get('/unblockproduct/:id',adminController.unBlockProduct)
adminRouter.post('/blockcategory/',adminController.blockCategory)
adminRouter.get('/editcategory/:id',adminController.editCategory)
adminRouter.post('/editcategorysubmit/:id',adminController.editCategorySubmit)
adminRouter.get('/editproduct/:id',adminController.editProduct)
adminRouter.post('/editProductSubmit/:id',adminController.editProductSubmit)
adminRouter.post('/deleteimage/:imgid/:index/:proid',adminController.imagedelete)
adminRouter.post('/cancelOrder/:orderId',adminController.cancelOrder);
adminRouter.post('/updateStatus',adminController.updateStatus)
adminRouter.get('/orderDetails/:orderId/:productId',adminController.orderDetails)
adminRouter.post('/approveReturnRequest/:orderId/:productId',adminController.approveReturnRequest)




module.exports=adminRouter