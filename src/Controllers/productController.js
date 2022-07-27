const productModel = require('../Models/productModel')
const { uploadFile } = require("../AWS_S3/awsUpload");
const { isValidRequestBody, isEmpty, isValidObjectId, checkImage, stringCheck, numCheck, anyObjectKeysEmpty,} = require("../Utilites/validation");

const createProduct = async (req, res) => {
    try {
        let data = JSON.parse(JSON.stringify(req.body));
        let productImage = req.files;
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data

        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Form data cannot be empty" });

        let checkdata = anyObjectKeysEmpty(data)
        if (checkdata) return res.status(400).send({ status: false, message: `${checkdata} can't be empty` });

        //Product Image Validation
        if (productImage.length == 0)
            return res.status(400).send({ status: false, message: "upload product image" });
        if (productImage.length > 1)
            return res.status(400).send({ status: false, message: "only one image at a time" });
        if (!checkImage(productImage[0].originalname))
            return res.status(400).send({ status: false, message: "format must be jpeg/jpg/png only" })

        if (isEmpty(title))
            return res.status(400).send({ status: false, message: "title required" });
        if (!stringCheck(title))
            return res.status(400).send({ status: false, message: "title invalid" });
        if (isEmpty(description))
            return res.status(400).send({ status: false, message: "description required" });

        if (isEmpty(price))
            return res.status(400).send({ status: false, message: "price required" });
        if (price == 0)
            return res.status(400).send({ status: false, message: "price can't be 0" })
        if (!price.match(/^\d{0,8}(\.\d{1,4})?$/))
            return res.status(400).send({ status: false, message: "price invalid" })

        if (!isEmpty(installments)) {
            if (!installments.match(/^[0-9]{1,2}$/))
                return res.status(400).send({ status: false, message: "installment invalid" });
        }

        if (isEmpty(currencyId))
            return res.status(400).send({ status: false, message: "currencyId required" });
        if (currencyId.trim() !== 'INR')
            return res.status(400).send({ status: false, message: "currencyId must be INR only" });

        if (isEmpty(currencyFormat))
            return res.status(400).send({ status: false, message: "currencyFormat required" });
        if (currencyFormat.trim() !== '₹')
            return res.status(400).send({ status: false, message: "currencyformat must be ₹ only" });

        if (typeof isFreeShipping != 'undefined') {
            isFreeShipping = isFreeShipping.trim()
            if (!["true", "false"].includes(isFreeShipping)) {
                return res.status(400).send({ status: false, message: "isFreeshipping is a boolean type only" });
            }
        }
        //--
        if (isEmpty(availableSizes))
            return res.status(400).send({ status: false, message: "availableSizes required" });
        //--
        if (availableSizes) {
            let validSizes = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            var InputSizes = availableSizes.toUpperCase().split(",").map((s) => s.trim())
            for (let i = 0; i < InputSizes.length; i++) {
                if (!validSizes.includes(InputSizes[i])) {
                    return res.status(400).send({ status: false, message: "availableSizes must be [S, XS, M, X, L, XXL, XL]" });
                }
            }
        }

        let uploadedFileURL = await uploadFile(productImage[0]);
        let obj = {
            title, description, price, currencyId, currencyFormat, isFreeShipping: isFreeShipping, style, installments, productImage: uploadedFileURL
        }
        let result = await productModel.create(obj)
        return res.status(201).send({ status: true, message: 'Success', data: result })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

const productByid = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Invalid ProductId in params" });

        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })
        res.status(200).send({ status: true, message: "Success", data: product })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


module.exports = { createProduct , productByid }