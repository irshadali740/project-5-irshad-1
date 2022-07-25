const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');



router.all('/*', async function(req, res){
    res.status(404).send({status: false, msg: "Page Not Found!!!"})
})

module.exports = router