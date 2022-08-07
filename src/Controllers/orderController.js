const orderModel = require("../Models/orderModel.js");
const cartModel = require("../Models/cartModel.js");
const userModel = require("../Models/userModel.js");
const productModel = require("../Models/productModel.js");
const { isValidRequestBody, isEmpty, isValidObjectId, checkImage, stringCheck, numCheck, anyObjectKeysEmpty, } = require("../Utilites/validation");

const isValidStatus = function (status) {
    return ['pending', 'completed', 'cancelled'].indexOf(status) !== -1
}
const isValidBoolean = function (value) {
    if (!(typeof value === "boolean")) return false
    return true
}

// ================================================================= Create order ============================================================//
const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId ID" })
        }
        const findUser = await userModel.findOne({ _id: userId })
        if (!findUser) return res.status(404).send({ status: false, message: "User does not exists" })

        const tokenUserId = req.decodeToken.userId;
        if (tokenUserId !== userId) {
            return res.status(403).send({ status: false, message: "Unauthorized access" })
        }
        const data = req.body
        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Empty request body" });

        const { cartId } = data
        if (isEmpty(cartId)) return res.status(400).send({ status: false, message: "cart ID required" })
        if (!isValidObjectId(cartId))
            return res.status(400).send({ status: false, message: "Invalid cart ID" })

        const findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) return res.status(404).send({ status: false, message: "No cart found" })

        if (cartId !== findCart._id.toString()) {
            return res.status(403).send({ status: false, message: `Cart does not belong to login user` })
        }

        if (findCart.items.length === 0) return res.status(400).send({ status: false, message: "No Items in cart" })
        let totalQ = 0
        let cartItems = findCart.items
        let productId = []
        for (let i = 0; i < cartItems.length; i++) {
            totalQ += cartItems[i].quantity
            productId.push(cartItems[i].productId.toString());
        }

        data.userId = userId
        data.items = cartItems
        data.totalPrice = findCart.totalPrice
        data.totalItems = cartItems.length
        data.totalQuantity = totalQ

        //Change in cart model
        findCart.items = []
        findCart.totalItems = 0
        findCart.totalPrice = 0

        await findCart.save()
        const getOrder = await orderModel.create(data)
        return res.status(201).send({ status: true, message: "Success", data: getOrder })

    } catch (err) {
        return res.status(500).send({ status: false, err: err.message });
    }
}

// ============================================================ update order =================================================================//
const updateOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId ID" })
        }
        const validUser = await userModel.findOne({ _id: userId })
        if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })

        const tokenUserId = req.decodeToken.userId;
        if (tokenUserId !== validUser._id.toString())
            return res.status(403).send({ status: false, message: "Unauthorized access" })

        const data = req.body
        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Empty request body" })

        const { orderId, status } = data
        if (isEmpty(orderId)) return res.status(400).send({ status: false, message: "Order Id required" })
        if (!isValidObjectId(orderId)) {
        return res.status(400).send({ status: false, message: "Invalid order ID" })
        }
        const validOrder = await orderModel.findOne({ _id: orderId })
        if (!validOrder) return res.status(404).send({ status: false, message: "Order does not exists" })

        if (userId != validOrder.userId) return res.status(404).send({ status: false, message: "OrderId does not belong to login user" })

        if (isEmpty(status)) return res.status(400).send({ status: false, message: "please enter status." })

    
        if (!isValidStatus(data.status))
            return res.status(400).send({ status: false, message: `Order status should be 'pending', 'completed', 'cancelled' ` })

        if (validOrder.status == 'cancelled')
            return res.status(400).send({ status: false, message: "This order is already cancelled" })

        if (validOrder.status == 'completed')
            return res.status(400).send({ status: false, message: "This order is already completed" })

        if (status == 'cancelled') {
            if (validOrder.cancellable == false)
                return res.status(400).send({ status: false, message: "This order is not cancellable." })
        }

        validOrder.status = status
        await validOrder.save()
        return res.status(200).send({ status: true, message: "Success", data: validOrder })
    } catch (err) {
        return res.status(500).send({ status: false, err: err.message });
    }
}

module.exports = { createOrder, updateOrder }
