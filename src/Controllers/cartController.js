const cartModel = require("../Models/cartModel")
const userModel = require("../Models/userModel")
const productModel = require("../Models/productModel")
const orderModel = require("../Models/orderModel")
const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId
const { isValidRequestBody, isEmpty, isValidObjectId, checkImage, stringCheck, numCheck, anyObjectKeysEmpty, } = require("../Utilites/validation");
const { request } = require("express")


let createCart = async function (req, res) {
  try {
    let userId = req.params.userId;

    if (!(isValidObjectId(userId))) {
      return res.status(400).send({ status: false, message: "Please provide valid User Id" });
    }
    let data = req.body
    if (isValidRequestBody(data)) {
      return res.status(404).send({ status: false, msg: "plz provide the data" })
    }
    let { quantity, productId, cartId } = data;
    if (!(isValidObjectId(productId))) {
      return res.status(400).send({ status: false, message: "Please provide valid Product Id" });
    }
    let findUser = await userModel.findById({ _id: userId });
    if (!findUser) {
      return res.status(400).send({ status: false, message: `User doesn't exist by ${userId}` });
    }
    let findProduct = await productModel.findOne({ _id: productId, isDeleted: false });

    if (!findProduct) {
      return res.status(400).send({ status: false, message: `Product doesn't exist by ${productId}` });
    }
    let findUserCart = await cartModel.findOne({ userId: userId });
    console.log(findUserCart, "this for cart")
    if (!quantity) {
      quantity = 1;
    }

    if (!findUserCart) {
      var cartData = {
        userId: userId,
        items: [
          {
            productId: productId,
            quantity: quantity,
          },
        ],
        totalPrice: findProduct.price * quantity,
        totalItems: 1,
      };
      let createCart = await cartModel.create(cartData);
      return res.status(201).send({ status: true, message: `Success`, data: createCart });
    }
    //Increasing quantity
    if (!cartId) {
      let findCart = await cartModel.findOne({ userId: req.params.userId });
      let price = findCart.totalPrice + (quantity) * findProduct.price;
      let arr = findCart.items;
      for (i in arr) {
        if (arr[i].productId.toString() === productId) {
          arr[i].quantity += quantity
          let updatedCart = {
            items: arr,
            totalPrice: price,
            totalItems: arr.length,
          };

          let responseData = await cartModel.findOneAndUpdate(
            { _id: findCart._id },
            updatedCart,
            { new: true }
          );
          console.log(responseData);
          return res.status(201).send({ status: true, message: `Success`, data: responseData });
        }
      }
      arr.push({ productId: productId, quantity: quantity });
      let updatedCart = {
        items: arr,
        totalPrice: price,
        totalItems: arr.length,
      };

      let responseData = await cartModel.findOneAndUpdate({ _id: findUserCart._id }, updatedCart, { new: true });
      return res.status(201).send({ status: true, message: `Success`, data: responseData });
    }
    // pushing the product
    if (cartId) {
      if (!(isValidObjectId(cartId))) {
        return res.status(400).send({ status: false, message: "Please provide valid cart Id" });
      }
      let findCart = await cartModel.findOne({ _id: cartId });
      if (!findCart) {
        return res.status(400).send({ status: false, message: `Cart doesn't exist by ${cartId}` });
      }
      if (findCart) {
        if (findCart.userId != req.params.userId) {
          return res.status(400).send({ status: false, message: `Cart doesn't belong to loginUser` });
        }
        let price = findCart.totalPrice + (quantity) * findProduct.price;
        let arr = findCart.items;
        for (i in arr) {
          if (arr[i].productId.toString() === productId) {
            arr[i].quantity += quantity
            let updatedCart = {
              items: arr,
              totalPrice: price,
              totalItems: arr.length,
            };

            let responseData = await cartModel.findOneAndUpdate(
              { _id: findCart._id },
              updatedCart,
              { new: true }
            );
            console.log(responseData);
            return res.status(201).send({ status: true, message: `Success`, data: responseData });
          }
        }
        arr.push({ productId: productId, quantity: quantity });
        let updatedCart = {
          items: arr,
          totalPrice: price,
          totalItems: arr.length,
        };

        let responseData = await cartModel.findOneAndUpdate({ _id: findUserCart._id }, updatedCart, { new: true });
        return res.status(201).send({ status: true, message: `Success`, data: responseData });
      }
    }
  } catch (error) {
    return res.status(500).send({ msg: error.message })
  }
}
//============================================================================ updatecart =============================================================//

let updateCart = async function (req, res) {
  try {

    let data = req.body
    let userId = req.params.userId
    let userIdFromToken = req.decodeToken.userId
    console.log(data)

    let { productId, cartId, removeProduct } = data

    if (isValidRequestBody(data)) return res.status(400).send({ msg: "Data is required." })

    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: "UserId is not valid." })
    }
    let checkingUser = await userModel.findById({ _id: userId })
    if (!checkingUser) {
      return res.status(404).send({ status: false, message: "UserId not found." })
    }

    //================Authorization=================================//

    if (userIdFromToken != checkingUser._id) {
      return res.status(403).send({
        status: false,
        message: "Unauthorized access."
      })
    }


    if (!isValidObjectId(cartId)) {
      return res.status(400).send({ status: false, message: "cartId is not  valid." })
    }
    let cart = await cartModel.findOne({ _id: cartId })
    console.log(cart)
    if (!cart) {
      return res.status(404).send({ status: false, message: "cartId not found." })
    }

    //     let toUpdate = {_id:productId,isDeleted:false}
    //     if(removeProduct){
    //      if(typeof removeProduct===Number)
    //      toUpdate.removeProduct = removeProduct

    //      // console.log(data.items[1].quantity)
    //  }
    if (!isValidObjectId(productId)) {
      return res.status(400).send({ status: false, message: "ProductId is not valid." })
    }
    console.log(productId);
    let product = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!product) {
      return res.status(404).send({ status: false, message: `Product is not available with this id ${productId}` })

    }
    //.......find if products exits in cart

    let isProductinCart = await cartModel.findOne({ items: { $elemMatch: { productId: productId } } });

    if (!isProductinCart) {
      return res.status(400).send({ status: false, message: `This ${productId} product does not exits in the cart` });
    }
    //*...... removeProduct validation

    if (isNaN(removeProduct)) {
      return res.status(400).send({ status: false, message: `removeProduct should be a valid number either 0 or 1` });
    }
    if (!(removeProduct === 0 || removeProduct === 1)) {
      return res.status(400).send({
        status: false, message: "removeProduct should be 0 (product is to be removed) or 1(quantity has to be decremented by 1) "
      });
    }
    let findQuantity = cart.items.find((x) => x.productId.toString() === productId);

    if (removeProduct === 0) {
      let totalAmount = cart.totalPrice - (product.price * findQuantity.quantity) // substract the amount of product*quantity

      await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true }); //?pull the product from itmes  //https://stackoverflow.com/questions/15641492/mongodb-remove-object-from-array

      let quantity = cart.totalItems - 1;

      let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true }); //*update the cart with total items and totalprice

      return res.status(200).send({ status: true, message: `Success`, data: data });
    }

    //* decrement quantity

    let totalAmount = cart.totalPrice - product.price;
    let arr = cart.items;
    for (i in arr) {
      if (arr[i].productId.toString() == productId) {
        arr[i].quantity = arr[i].quantity - 1;
        if (arr[i].quantity < 1) {
          await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true });

          let quantity = cart.totalItems - 1;
          let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true });
          return res.status(400).send({ status: false, message: "no such Quantity present in this cart", data: data });
        }
      }
    }
    let datas = await cartModel.findOneAndUpdate({ _id: cartId }, { items: arr, totalPrice: totalAmount }, { new: true });
    return res.status(200).send({ status: true, message: `Success`, data: datas });


  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: error.message })
  }
}

// ========================================================================= get cart ==========================================================//
const getCart = async function (req, res) {
  try {
    let userId = req.params.userId
    if (!isValidObjectId(userId))
      return res.status(400).send({ status: false, message: "Invalid userId in params " })

    let validUser = await userModel.findOne({ _id: userId })
    if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })

    let tokenUserId = req.decodeToken.userId;
    if (userId !== tokenUserId) {
      return res.status(403).send({ status: false, message: "Unauthorized access" });
    }
    let validCart = await cartModel.findOne({ userId: userId })
    if (!validCart) {
      return res.status(404).send({ status: false, message: "No cart found " })
    }
    res.status(200).send({ status: true, message: "Success", data: validCart })
  }
  catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

// ============================================================ delete cart =========================================================//
const deleteCart = async function (req, res) {
  try {
    let userId = req.params.userId
    if (!isValidObjectId(userId))
      return res.status(400).send({ status: false, message: "Invalid userId in params " })

    let validUser = await userModel.findById({ _id: userId })
    if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })

    let tokenUserId = req.decodeToken.userId;
    if (userId !== tokenUserId) {
      return res.status(403).send({ status: false, message: "Unauthorized access" });
    }

    let validCart = await cartModel.findOne({ userId: userId })
    if (!validCart) return res.status(404).send({ status: false, message: "No cart found " })

    if (validCart) {
      let items = []
      let cartDeleted = await cartModel.findOneAndUpdate({ userId: userId },
        { $set: { items: items, totalItems: 0, totalPrice: 0 } }, { new: true })

      res.status(204).send({ status: true, message: "Success", data: cartDeleted })
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
}

module.exports = { createCart, updateCart, deleteCart, getCart }