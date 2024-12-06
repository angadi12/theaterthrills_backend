const express = require("express");
const DbConnection = require("./Services/Db/Connection");
const morgan = require("morgan");
const helmet = require("helmet");
const mongosantize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
const cors = require("cors");
const globalErrHandler = require("./MiddleWare/GlobalError");
const AppErr = require("./Services/AppErr");

const {UserRouter}=require("./Route/User")
const {TheaterRouter}=require("./Route/Theater")
const {OTProuter}=require("./Route/OTP")
const {BookingRouter}=require("./Route/Booking")
const {ContactRouter}=require("./Route/Contact")
const {UnsavedBookingRouter}=require("./Route/Unsaved")
const {AdminRouter}=require("./Route/Admin")
const {Paymentrouter}=require("./Route/Payment")
const {expenseRouter}=require("./Route/Expenses")
const {CouponRouter}=require("./Route/Coupon")
const BranchRouter =require("./Route/Branch")
 DbConnection();


const { createServer } = require("http");
const { Server }= require("socket.io");
const {initSocket}=require("./Services/Socket")


const app = express();
const httpServer = createServer(app);
initSocket(httpServer)

app.use(cors());


//------IN Build Middleware----------/
app.use(morgan("combined"));
app.use(helmet());
// app.use(cors());
app.use(mongosantize());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



//--------------- Route Middleware ------------------//

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/Theater", TheaterRouter );
app.use("/api/v1/Auth", OTProuter );
app.use("/api/v1/Booking", BookingRouter );
app.use("/api/v1/Contact", ContactRouter );
app.use("/api/v1/Unsaved", UnsavedBookingRouter );
app.use("/api/v1/Branch", BranchRouter );
app.use("/api/v1/Admin", AdminRouter );
app.use("/api/v1/Payments", Paymentrouter );
app.use("/api/v1/Expenses", expenseRouter );
app.use("/api/v1/Coupon", CouponRouter );



//--------------Not Found Route-------------------//
app.get("*", (req, res, next) => {
  return next(new AppErr("Route not found ! please try after some time", 404));
});




//----------Global Error -----------//
app.use(globalErrHandler);

const PORT = process.env.PORT || 9100;
httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
