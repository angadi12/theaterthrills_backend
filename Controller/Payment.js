const razorpayInstance = require("../Services/Razorpayinstance");
const Booking = require("../Model/Booking");

const fetchAllPayments = async (req, res) => {
    try {
      const { from, to, count = 50, skip = 0 } = req.query;
      console.log("Query Params:", req.query);
  
      const options = {
        from:Number(from) ,
        to:Number(to),
        count: parseInt(count),
        skip: parseInt(skip),
      };
  
      console.log("Options for Razorpay API:", options);
  
      const razorpayPayments = await razorpayInstance.payments.all(options);
      console.log("Razorpay Response:", razorpayPayments);
  
      const orderIds = razorpayPayments.items.map(payment => payment.order_id);
      const bookings = await Booking.find({ orderId: { $in: orderIds } });
  
      const bookingMap = bookings.reduce((acc, booking) => {
        acc[booking.orderId] = booking;
        return acc;
      }, {});
  
      const mergedData = razorpayPayments.items.map(payment => ({
        ...payment,
        bookingDetails: bookingMap[payment.order_id] || null,
      }));
  
      res.status(200).json({
        success: true,
        data: mergedData,
      });
    } catch (error) {
      console.error("Error fetching payments:", error.stack);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payments",
        error: error.message,
      });
    }
  };
  

  const fetchsinglePayments = async (req, res) => {
    try {
      const { id } = req.params; 
      console.log(id)
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Payment ID is required",
        });
      }
  
      // Fetch payment details from Razorpay
      const razorpayPayment = await razorpayInstance.payments.fetch(id);
  
      // Fetch booking details if `order_id` is associated with this payment
      let bookingDetails = null;
      if (razorpayPayment.order_id) {
        bookingDetails = await Booking.findOne({ orderId: razorpayPayment.order_id });
      }
  
      res.status(200).json({
        success: true,
        data: {
          ...razorpayPayment,
          bookingDetails,
        },
      });
    } catch (error) {
      console.error("Error fetching single payment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment",
        error: error.message,
      });
    }
  };
  



module.exports = { fetchAllPayments,fetchsinglePayments };
