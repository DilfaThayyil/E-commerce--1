const express=require('express')
const app=express()
const Product=require('../model/products')
const Category=require('../model/category')
const User=require('../model/userSchema')
const path=require('path')
const multer=require('multer')
const fs = require('fs')
const Order = require('../model/orderSchema')
require('dotenv').config()




const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
  
const upload = multer({ storage: storage }).array("images", 4);
  
  
app.use(express.static(path.join(__dirname, "public")));


const dashboard =(req,res)=>{
    try{
        res.render('dashboard')
    }catch(err){
        console.log(err);
    }
}

const login = (req,res)=>{
    try{
        let msg=req.flash('err')
        res.render('login',{msg})
    }catch(err){
        console.log(err);
    }
}

const logout = async(req,res)=>{
    try{
         req.session.admin = null
         res.redirect('/admin')
    }catch(err){
        console.log(err)
    }
}

const loginSubmit = async(req,res)=>{
    try{
        const {email,password} = req.body
        if(email == process.env.adminEmail){
            if(password == process.env.adminPassword){
                res.redirect('/admin')
            }else{
                let err= "Password is incorrect"
               req.flash('err',err)
               res.redirect('/admin/login')
            }
        }else{
            let err= "email is incorrect"
            req.flash('err',err)
            res.redirect('/admin/login')
        }
    }catch(err){
        console.log(err)
    }
}



const allProducts = async (req, res) => {
    try {
        const admin = req.session.admin;
        const perPage = 5;
        const page = parseInt(req.query.page) || 1;
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / perPage);
  
        const products = await Product.find()
            .populate({
                path:"Category",
                model:"Category"
            })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();
  
        res.render('allproducts', { products, admin, totalPages, currentPage: page });
    } catch (err) {
        console.error(err);
        res.send('Internal Server Error');
    }
  };
  



const allUsers = async(req,res)=>{
    try{
        const users = await User.find()
        res.render('allusers',{users})
    }catch(err){
        console.log(err);
    }
}

const category = async(req,res)=>{
    try{
        const category = await Category.find()
       
        res.render('category',{category})
    }catch(err){
        console.log(err);
    }
}

const allOrders = async(req,res)=>{
    try{
    
      const perPage = 2; 
      const page = parseInt(req.query.page) || 1; 

      const totalOrders = await Order.countDocuments();
      const totalPages = Math.ceil(totalOrders / perPage);

      const orders = await Order.find()
          .populate({
              path: 'products.products',
              model: 'Products',
            })
          .populate({
                path: "userid",
                model: "User"
            })    
          .sort({date:-1})
          .skip((page - 1) * perPage)
          .limit(perPage)
          .exec();

      res.render('allorders', { orders, totalPages, currentPage: page });
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
}


    const orderDetails=async(req,res)=>{
        try{
            const { orderId, productId } = req.params;
            const order = await Order.findById(orderId).populate('userid')
            if (!order) {
                return res.json({ message: 'Order not found' });
            }
            const product = order.products.find(prod => prod.products.equals(productId));
            if (!product) {
                return res.status(404).json({ message: 'Product not found in order' });
            }
            const user = await User.findById(order.userid);
            const productDetails = await Product.findById(productId);
            
            res.render('orderDetails', {order,product,user,productDetails}); 
        } catch (error) {
            console.error('Error fetching order details:', error);
        }
    }



const cancelOrder = async (req, res) => {
    const orderId = req.params.orderId;
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        order.products.forEach(product => {
            if (product.Status !== 'cancelled') {
                product.Status = 'cancelled';
            }
        });
        await order.save();
        res.status(200).json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const approveReturnRequest = async (req, res) => {
    const { orderId, productId } = req.params;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const product = order.products.find(p => p._id.equals(productId));

        if (!product) {
            return res.status(404).json({ message: 'Product not found in order' });
        }

        product.Status = 'returned';
        
        const updatequantity=await Product.findById(product.products)
        updatequantity.Quantity+=product.quantity

        await updatequantity.save()
        await order.save();


        res.status(200).json({ success: true, message: 'Return request approved successfully' });
    } catch (error) {
        console.error('Error approving return request:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



const editProduct = async(req,res)=>{
    try{
        const product_id = req.params.id
        const product = await Product.findOne({_id:product_id}).populate('Category')
        const category= await Category.find({Status:'active'})
        res.render('editproduct',{product,category})
    }catch(err){
        console.log(err);
    }
}





const editProductSubmit = async (req, res) => {
    try{
        upload(req, res, async function (err) {
          if (err) {
            const errorMsg = "Image more than 4 is not allowed";
            req.flash("err", errorMsg);
            res.redirect("/admin/editproduct");
          } else {
    
    
        const productId = req.params.id;
        const updatedData = {
          Name: req.body.name,
          Description: req.body.description,
          Quantity: req.body.quantity,
          Price: req.body.price,
          DiscountPrice: req.body.discountPrice,
          Category:req.body.category,
       
        };
        
        Object.keys(updatedData).forEach(
          (key) => updatedData[key] == "" && delete updatedData[key]
        );
        const product = await Product.updateOne({ _id: productId }, updatedData);
        if (product) {
         
          res.redirect("/admin/allproducts");
        }
        }
      })
      }catch(err){
        console.log(err);
      }
    }
    


const addProducts = async(req,res)=>{
    try{
        const category =await Category.find()
        res.render('addproducts',{category})
    }catch(err){
        console.log(err);
    }
}

const addProductsSubmit = async(req,res)=>{
    try{
        upload(req, res, async function (err) {
            if (err) {
              const errorMsg = "Image more than 4 is not allowed";
              req.flash("err", errorMsg);
              return res.redirect("/admin/addproducts");
            }
         const {productname,categoryname,price,discountPrice,quantity,description} = req.body
        const checking= await Product.findOne({Name:productname})
        if(checking){
            const message="product name already exists"
            req.flash('err',message)
            res.redirect('/admin/addproducts')
        }else{
            const product=new Product({
                Name:productname,
                Description:description,
                Price:price,
                Category:categoryname,
                Quantity:quantity,
                DiscountPrice:discountPrice,
                Images: req.files.map((file) => file.filename),
                
            })
            await product.save()
            res.redirect('/admin/allproducts')
        }
    });
    }catch(err){
        console.log(err);
    }
}

const addCategory = async(req,res)=>{
    try{
        res.render('addcategory')
    }catch(err){
        console.log(err);
    }
}

const addCategorySubmit = async(req,res)=>{
    try{
        const {name,description} = req.body
        const check = await Category.findOne({Name:name})
        if(check){
            const message="category already exists"
            req.flash('error',message)
            return res.redirect('/admin/addcategory')
        }else{
            const category=new Category({
                Name:name,
                Description:description
            })
            await category.save()
            res.redirect('/admin/category')
        }
    }catch(err){
        console.log(err);
    }
}

const blockUser = async (req,res)=>{
    try{
        const userId = req.params.id
        const blockUser = await User.findById(userId)
        if(blockUser){
            blockUser.isBlocked=true
            await blockUser.save()
            res.redirect('/admin/allusers')
        }else{
            res.redirect('/admin/allusers')
        }
    }catch(err){
        console.log(err);
    }
}

const unBlockUser = async(req,res)=>{
    try{
        const userId = req.params.id
        const unBlockUser = await User.findById(userId)
        if(unBlockUser){
            unBlockUser.isBlocked=false
            await unBlockUser.save()
            res.redirect('/admin/allusers')
        }else{
            res.redirect('/admin/allusers')
        }
    }catch(err){
        console.log(err);
    }
}

const blockProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const blockproduct = await Product.findById(productId);
        if (blockproduct) {
            blockproduct.Status = 'blocked';
            await blockproduct.save();
            req.flash('success', 'Product blocked successfully');
        } else {
            req.flash('error', 'Product not found');
        }
        res.redirect('/admin/allproducts');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error blocking product');
        res.redirect('/admin/allproducts');
    }
};

const unBlockProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const unblockproduct = await Product.findById(productId);
        if (unblockproduct) {
            unblockproduct.Status = 'active';
            await unblockproduct.save();
            req.flash('success', 'Product unblocked successfully');
        } else {
            req.flash('error', 'Product not found');
        }
        res.redirect('/admin/allproducts');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error unblocking product');
        res.redirect('/admin/allproducts');
    }
};


const blockCategory = async (req, res) => {
    try {
        const categoryId = req.body.categoryId; 
        const action = req.body.action; 
        const check = await Category.findById(categoryId);
        if (check) {
          
            check.Status = action === 'block' ? 'blocked' : 'active';
            await check.save();
            res.json({ success: true });
        } else {
            res.json({ success: false }); 
        }
    } catch (err) {
        console.log(err);
    }
};


const editCategory= async (req,res)=>{
    try{
      const category_id=req.params.id
      const category  = await Category.findOne({_id:category_id})
      const err=req.flash('error')
      res.render('editcategory',{category,err })
    }catch(err){
      console.log(err);
    }
   }


   const editCategorySubmit= async(req,res)=>{
    try{

      const category_id= req.params.id
     const updatecategory= await Category.findOne({_id:category_id})
        
     const existingCategory = await Category.findOne({Name:req.body.name });
     if (existingCategory && existingCategory._id.toString() !== category_id) {
         req.flash('error', 'Category name already exists');
         return res.redirect('/admin/editcategory/' + category_id); 
     }

      if(updatecategory){
      await Category.findByIdAndUpdate({_id:category_id},{
        Name:req.body.name,
        Description:req.body.description
      })
     }else{
      res.redirect('/admin/category')
     }
     res.redirect('/admin/category')
    }catch(err){
      console.log(err);
    }
   }


   
const imagedelete = async (req, res) => {
    try {
  
    const imgid = req.params.imgid;
    const index = req.params.index;
    const productid = req.params.proid;
    const imagePath = path.join('public', 'uploads', imgid);
  
    const product = await Product.findOne({ _id: productid });
  
    if (!product) {
        return res.status(404).send('Product not found');
      }
  
      if (product.Images.length <= 1) {
        return res.status(400).send('Cannot delete the last image.');
      }
  
      await fs.promises.unlink(imagePath);
  
      product.Images.splice(index, 1);
  
      await product.save();
  
      res.status(200).send('Image deleted successfully');
    } catch (err) {
      console.error('Error deleting image:', err);
      res.status(500).send('Internal Server Error');
    }
  };


  const updateStatus = async(req,res)=>{
    try{
        const { status, orderId, productId } = req.body
        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const product = order.products.find(prod => prod.products._id.toString() === productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found in order' });
        }
        
        product.Status = status;
        await order.save();

        return res.status(200).json({ message: 'Status updated successfully', order });

        

    }catch(err){
        console.log(err);
    }
  }



  

  



module.exports = {
    dashboard,
    login,
    logout,
    allProducts,
    allUsers,
    category,
    allOrders,
    addProducts,
    addProductsSubmit,
    editProduct,
    editProductSubmit,
    addCategory,
    addCategorySubmit,
    blockUser,
    unBlockUser,
    blockProduct,
    unBlockProduct,
    blockCategory,
    editCategory,
    editCategorySubmit,
    imagedelete,
    loginSubmit,
    cancelOrder,
    updateStatus,
    orderDetails,
    approveReturnRequest
}