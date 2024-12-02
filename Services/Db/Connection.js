const mongoose = require("mongoose");
const AppErr = require("../AppErr");
require("dotenv").config();
const DbConnection = () => {
  try {
    mongoose
      .connect("mongodb+srv://alok:HmjA87MZgewsCr5M@cluster0.qbpplab.mongodb.net/")
      .then((res) => {
        console.log("DATABASE CONNECTED SUCCESSFULLY");
      })
      .catch((err) => {
        console.log("Db connection error: " + err)
      });
  } catch (error) {
    console.log("Db connection error: " + error)
  }
};

module.exports = DbConnection;
