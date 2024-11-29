const express = require("express");
const { body, param } = require("express-validator");
const {
    fetchAllPayments ,
    fetchsinglePayments
} = require("../Controller/Payment");

const Paymentrouter = express.Router();


Paymentrouter.get("/getAllpayments",fetchAllPayments);
Paymentrouter.get("/payments/:id", fetchsinglePayments); 


module.exports = { Paymentrouter };
