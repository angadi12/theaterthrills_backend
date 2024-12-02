const mongoose = require("mongoose");
const AppErr = require("../AppErr");
require("dotenv").config();
const DbConnection = () => {
  try {
    mongoose
      .connect(process.env.MONGOURL)
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
