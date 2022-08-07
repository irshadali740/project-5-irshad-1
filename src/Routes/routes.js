const express = require("express");
const router = express.Router()
const mid = require('../Middlewares/auth')
const userController = require('../Controllers/userController')
const productController = require('../Controllers/productController')
const cartController = require('../Controllers/cartController')
const orderController = require('../Controllers/orderController')


//user api
router.post('/register', userController.createUser)
router.post('/login', userController.loginUser)
router.get('/user/:userId/profile', mid.mid1, userController.getUserProfile)
router.put('/user/:userId/profile', mid.mid1, userController.updateUser)

//product api
router.post('/products', productController.createProduct)
router.get('/products', productController.getProductByFilter)
router.get("/products/:productId",productController.productByid)
router.put("/products/:productId",productController.updateProductById)
router.delete("/products/:productId",productController.deleteProdutById)

//cart api
router.post("/users/:userId/cart",mid.mid1, cartController.createCart)
router.put("/users/:userId/cart",mid.mid1, cartController.updateCart)
router.get("/users/:userId/cart",mid.mid1, cartController.getCart)
router.delete("/users/:userId/cart",mid.mid1, cartController.deleteCart)

//order api
router.post("/users/:userId/orders",mid.mid1, orderController.createOrder)
router.put("/users/:userId/orders",mid.mid1, orderController.updateOrder)




// if api is invalid OR wrong URL
router.all("/*", function (req, res) {
    res.status(404).send({ status: false, msg: "The api you requested is not available" });
  });

module.exports = router