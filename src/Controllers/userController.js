const userModel = require("../Models/userModel");
const { uploadFile } = require("../AWS_S3/awsUpload");
const {
    isValidRequestBody,
    isEmpty,
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isValidObjectId,
    checkPincode,
    anyObjectKeysEmpty,
    checkImage
} = require("../Utilites/validation");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const createUser = async (req, res) => {
    try {
        let data = JSON.parse(JSON.stringify(req.body));

        let profileImage = req.files;
        let { fname, lname, email, phone, password, address } = data;

        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Form data cannot be empty" })

        let checkdata = anyObjectKeysEmpty(data)
        if (checkdata) return res.status(400).send({ status: false, message: `${checkdata} can't be empty` });

        if (isEmpty(fname))
            return res.status(400).send({ status: false, message: "fname required" });
        if (isEmpty(lname))
            return res.status(400).send({ status: false, message: "lname required" });
        if (isEmpty(email))
            return res.status(400).send({ status: false, message: "email required" });
        if (isEmpty(password))
            return res.status(400).send({ status: false, message: "password required" });
        if (isEmpty(phone))
            return res.status(400).send({ status: false, message: "phone required" });
        if (isEmpty(address))
            return res.status(400).send({ status: false, message: "address required" });

        //Address Validation
        let add = JSON.parse(address)
        if (isEmpty(add.shipping))
            return res.status(400).send({ status: false, message: "shipping address required" });
        if (isEmpty(add.billing))
            return res.status(400).send({ status: false, message: "billing address required" });
        if (isEmpty(add.shipping.city))
            return res.status(400).send({ status: false, message: "shipping city required" });
        if (isEmpty(add.shipping.street))
            return res.status(400).send({ status: false, message: "shipping street required" });
        if (isEmpty(add.shipping.pincode))
            return res.status(400).send({ status: false, message: "shipping pincode required" });
        if (!checkPincode(add.shipping.pincode))
            return res.status(400).send({ status: false, message: "shipping pincode invalid" });
        if (isEmpty(add.billing.street))
            return res.status(400).send({ status: false, message: "billing street required" });
        if (isEmpty(add.billing.city))
            return res.status(400).send({ status: false, message: "billing city required" });
        if (isEmpty(add.billing.pincode))
            return res.status(400).send({ status: false, message: "billing pincode required" });
        if (!checkPincode(add.billing.pincode))
            return res.status(400).send({ status: false, message: "billing pincode invalid" })

        //Regex validation
        if (!fname.match(/^[a-zA-Z\s]+$/))
            return res.status(400).send({ status: false, message: "enter valid fname (Only alpahabets)" });
        if (!lname.match(/^[a-zA-Z\s]+$/))
            return res.status(400).send({ status: false, message: "enter valid lname (Only alpahabets)" });
        if (!isValidEmail(email))
            return res.status(400).send({ status: false, message: "enter valid email" });
        if (!isValidPhone(phone))
            return res.status(400).send({ status: false, message: "phone number is not valid e.g-[+91897654321]" });
        if (!isValidPassword(password))
            return res.status(400).send({ status: false, message: "password should contain min one alphabet, number, specical character & Length 8-15" });

        //DB calls for phone and email
        let phoneCheck = await userModel.findOne({ phone: phone });
        if (phoneCheck) return res.status(400).send({ status: false, message: "phone number already exist" });

        let emailCheck = await userModel.findOne({ email: email });
        if (emailCheck) return res.status(400).send({ status: false, message: "email already exist" });

        //passowrd bcrypt
        const salt = await bcrypt.genSalt(saltRounds);
        const hashPassword = await bcrypt.hash(password, salt);

        //Profile Image validation
        if (profileImage.length == 0)
            return res.status(400).send({ status: false, message: "upload profile image" });
        if (profileImage.length > 1)
            return res.status(400).send({ status: false, message: "only one image at a time" });
        if (!checkImage(profileImage[0].originalname))
            return res.status(400).send({ status: false, message: "format must be jpeg/jpg/png only" })
        let uploadedFileURL = await uploadFile(profileImage[0]);

        let obj = {
            fname,
            lname,
            email,
            profileImage: uploadedFileURL,
            phone,
            password: hashPassword,
            address: add,
        };
        let result = await userModel.create(obj);
        return res.status(201).send({ status: true, message: 'Success', data: result });
    } catch (err) {
        console.log(err.message);
       return res.status(500).send({ status: false, message: err.message });
    }
};

//----Login
const loginUser = async function (req, res) {
    try {
        let data = JSON.parse(JSON.stringify(req.body));
        let { email, password } = data;
        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "No input by user" });
        if (isEmpty(email))
            return res.status(400).send({ status: false, msg: "email is required." });
        if (isEmpty(password))
            return res.status(400).send({ status: false, msg: "Password is required." });

        let getUser = await userModel.findOne({ email });
        if (!getUser) return res.status(404).send({ status: false, msg: "User not found or Email Id is invalid" });

        let matchPassword = await bcrypt.compare(password, getUser.password);
        if (!matchPassword) return res.status(401).send({ status: false, msg: "Password is incorrect." });

        //To create token
        let token = jwt.sign(
            {
                userId: getUser._id,
                exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
            }, "UrAnIuM#GrOuP@19")

        return res.status(200).send({ status: true, message: "User login sucessful", data: { userId: getUser._id, token: token }, });

    } catch (err) {
        console.log(err.message);
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
};

module.exports = { createUser, loginUser };