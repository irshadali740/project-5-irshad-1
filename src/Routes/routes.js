const express = require("express");
const router = express.Router()
const mid = require('../Middlewares/auth')
const userController = require('../Controllers/userController')


//user routes
router.post('/register', userController.createUser)
router.post('/login', userController.loginUser)
router.get('/user/:userId/profile', mid.mid1, userController.getUserProfile)
router.put('/user/:userId/profile', mid.mid1, userController.updateUser)

// if api is invalid OR wrong URL
router.all("/*", function (req, res) {
    res.status(404).send({ status: false, msg: "The api you requested is not available" });
  });

module.exports = router