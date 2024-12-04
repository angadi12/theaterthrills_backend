const mongoose = require("mongoose");
const Branch = require("../Model/Branch");
const { validationResult } = require("express-validator");
const AppErr = require("../Services/AppErr");
const Booking = require('../Model/Booking'); // Adjust the path to your model
const Theater= require('../Model/Theater');

// Create a new branch
const CreateBranch = async (req, res, next) => {
  try {
    // Validate input fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppErr("Validation failed", 400, errors.array()));
    }

    const { Branchname, code, location, Number } = req.body;

    // Check if branch code already exists
    const existingBranch = await Branch.findOne({ code });
    if (existingBranch) {
      return next(new AppErr("Branch code already exists", 400));
    }

    // Create a new branch document
    const branch = new Branch({
      Branchname,
      code,
      location,
      Number,
    });

    // Save branch to the database
    await branch.save();

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });
  } catch (error) {
    console.error(error);
    next(new AppErr("Error creating branch", 500));
  }
};

// Update an existing branch
const UpdateBranch = async (req, res, next) => {
  try {
    // Validate input fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppErr("Validation failed", 400, errors.array()));
    }

    const { id } = req.params;
    const { Branchname, code, location, Number } = req.body;

    // Find the branch by ID and update it
    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      { Branchname, code, location, Number },
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return next(new AppErr("Branch not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: updatedBranch,
    });
  } catch (error) {
    console.error(error);
    next(new AppErr("Error updating branch", 500));
  }
};

// Get all branches
const GetAllBranch = async (req, res, next) => {
  try {
    const branches = await Branch.find();

    if (!branches || branches.length === 0) {
      return next(new AppErr("No branches found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Branches retrieved successfully",
      data: branches,
    });
  } catch (error) {
    console.log(error);
    next(new AppErr("Error fetching branches", 500));
  }
};

// Get a single branch by ID
const GetSingleBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppErr("Invalid branch ID", 400));
    }

    const branch = await Branch.findById(id);

    if (!branch) {
      return next(new AppErr("Branch not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Branch retrieved successfully",
      data: branch,
    });
  } catch (error) {
    console.error(error);
    next(new AppErr("Error fetching branch", 500));
  }
};

// Delete a branch by ID
const DeleteBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate the branch ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppErr("Invalid branch ID", 400));
    }

    // Find and delete the branch
    const deletedBranch = await Branch.findByIdAndDelete(id);

    if (!deletedBranch) {
      return next(new AppErr("Branch not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Branch deleted successfully",
      data: deletedBranch,
    });
  } catch (error) {
    console.error(error);
    next(new AppErr("Error deleting branch", 500));
  }
};

module.exports = {
  DeleteBranch,
};


const getBranchAnalytics = async (req, res) => {
  try {
    // Fetch all branches with their details
    const branches = await Branch.find();

    // Collect analytics for each branch
    const analytics = await Promise.all(
      branches.map(async (branch) => {
        // Find all theaters for the branch
        const theaters = await Theater.find({ branch: branch._id });

        // Collect all theater IDs
        const theaterIds = theaters.map((theater) => theater._id);

        // Fetch total bookings for the branch by theater IDs
        const totalBookings = await Booking.countDocuments({
          theater: { $in: theaterIds },
        });

        // Calculate total theaters in the branch
        const totalTheaters = theaters.length;

        return {
          branchDetails: branch, // Populate full branch details
          totalBookings,
          totalTheaters,
        };
      })
    );

    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





// const Getbranchsummary = async (req, res) => {
//   try {
//     const { branchId } = req.params; // Extract branchId from query parameters
//     const currentDate = new Date(); // Current date

//    // Validate branchId
//    if (!branchId) {
//     return res.status(400).json({
//       success: false,
//       message: "Branch ID is required",
//     });
//   }

//   const bookingSummary = await Theater.aggregate([
//     {
//       $match: {
//         branch: new mongoose.Types.ObjectId(branchId), // Use `new` keyword with ObjectId
//       },
//     },
//     {
//       $addFields: {
//         activeBookings: {
//           $size: {
//             $filter: {
//               input: "$slots",
//               as: "slot",
//               cond: {
//                 $and: [
//                   { $gte: [currentDate, { $arrayElemAt: ["$$slot.dates.date", 0] }] }, // Slot start date <= current date
//                   { $lte: [currentDate, { $arrayElemAt: ["$$slot.dates.date", -1] }] }, // Slot end date >= current date
//                 ],
//               },
//             },
//           },
//         },
//         upcomingBookings: {
//           $size: {
//             $filter: {
//               input: "$slots",
//               as: "slot",
//               cond: {
//                 $gt: [
//                   { $arrayElemAt: ["$$slot.dates.date", 0] }, // Slot start date
//                   currentDate, // Start date > current date
//                 ],
//               },
//             },
//           },
//         },
//         completedBookings: {
//           $size: {
//             $filter: {
//               input: "$slots",
//               as: "slot",
//               cond: {
//                 $and: [
//                   { $lt: [{ $arrayElemAt: ["$$slot.dates.date", -1] }, currentDate] }, // Slot end date < current date
//                   { $ne: [{ $size: "$$slot.dates" }, 0] }, // Dates array is not empty
//                 ],
//               },
//             },
//           },
//         },
//       },
//     },
//     {
//       $group: {
//         _id: "$branch",
//         branchName: { $first: "$branchDetails.Branchname" },
//         activeBookings: { $sum: "$activeBookings" },
//         upcomingBookings: { $sum: "$upcomingBookings" },
//         completedBookings: { $sum: "$completedBookings" },
//       },
//     },
//   ]);
 

//   res.status(200).json({
//     success: true,
//     data: bookingSummary,
//   });
// } catch (error) {
//   console.error("Error fetching booking summary:", error);
//   res.status(500).json({
//     success: false,
//     message: "An error occurred while fetching the booking summary",
//   });
// }
// }
// const Getbranchsummary = async (req, res) => {
//   try {
//     const { branchId } = req.params; // Extract branchId from query parameters
//     const currentDate = new Date(); // Current date
    
//     // Normalize the current date to midnight to avoid time issues
//     const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0)); // Normalize current date to 00:00:00
//     const endOfDay = new Date(startOfDay); 
//     endOfDay.setHours(23, 59, 59, 999); // End of day (23:59:59.999)

//     // Validate branchId
//     if (!branchId) {
//       return res.status(400).json({
//         success: false,
//         message: "Branch ID is required",
//       });
//     }

//     const bookingSummary = await Theater.aggregate([
//       {
//         $match: {
//           branch: new mongoose.Types.ObjectId(branchId), // Use `new` keyword with ObjectId
//         },
//       },
//       {
//         $addFields: {
//           activeBookings: {
//             $size: {
//               $filter: {
//                 input: "$slots",
//                 as: "slot",
//                 cond: {
//                   $and: [
//                     // Active bookings: Slot start date <= current date AND Slot end date >= current date
//                     { $lte: [{ $arrayElemAt: ["$$slot.dates.date", 0] }, endOfDay] }, // Slot start date <= current date
//                     { $gte: [{ $arrayElemAt: ["$$slot.dates.date", -1] }, startOfDay] }, // Slot end date >= current date
//                   ],
//                 },
//               },
//             },
//           },
//           upcomingBookings: {
//             $size: {
//               $filter: {
//                 input: "$slots",
//                 as: "slot",
//                 cond: {
//                   // Upcoming bookings: Slot start date > current date
//                   $gt: [{ $arrayElemAt: ["$$slot.dates.date", 0] }, endOfDay],
//                 },
//               },
//             },
//           },
//           completedBookings: {
//             $size: {
//               $filter: {
//                 input: "$slots",
//                 as: "slot",
//                 cond: {
//                   $and: [
//                     // Completed bookings: Slot end date < current date
//                     { $lt: [{ $arrayElemAt: ["$$slot.dates.date", -1] }, startOfDay] }, // Slot end date < current date
//                     // Ensure dates array is not empty (there are actual dates in the slot)
//                     { $ne: [{ $size: "$$slot.dates" }, 0] },
//                   ],
//                 },
//               },
//             },
//           },
//         },
//       },
//       {
//         $group: {
//           _id: "$branch",
//           branchName: { $first: "$branchDetails.Branchname" },
//           activeBookings: { $sum: "$activeBookings" },
//           upcomingBookings: { $sum: "$upcomingBookings" },
//           completedBookings: { $sum: "$completedBookings" },
//         },
//       },
//     ]);

//     res.status(200).json({
//       success: true,
//       data: bookingSummary,
//     });
//   } catch (error) {
//     console.error("Error fetching booking summary:", error);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred while fetching the booking summary",
//     });
//   }
// };

const Getbranchsummary = async (req, res) => {
  try {
    const { branchId } = req.params; // Extract branchId from query parameters
    const currentDate = new Date(); // Current date
    
    // Normalize the current date to midnight (removing time part)
    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0)); // Normalize current date to 00:00:00
    const endOfDay = new Date(startOfDay); 
    endOfDay.setHours(23, 59, 59, 999); // End of day (23:59:59.999)

    // Validate branchId
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    const bookingSummary = await Theater.aggregate([
      {
        $match: {
          branch: new mongoose.Types.ObjectId(branchId), // Use `new` keyword with ObjectId
        },
      },
      {
        $addFields: {
          activeBookings: {
            $size: {
              $filter: {
                input: "$slots",
                as: "slot",
                cond: {
                  $and: [
                    // Active bookings: Slot start date <= current date AND Slot end date >= current date
                    { $lte: [{ $arrayElemAt: ["$$slot.dates.date", 0] }, endOfDay] }, // Slot start date <= current date
                    { $gte: [{ $arrayElemAt: ["$$slot.dates.date", -1] }, startOfDay] }, // Slot end date >= current date
                  ],
                },
              },
            },
          },
          upcomingBookings: {
            $size: {
              $filter: {
                input: "$slots",
                as: "slot",
                cond: {
                  // Upcoming bookings: Slot start date > current date
                  $gt: [
                    { $arrayElemAt: ["$$slot.dates.date", 0] }, // Slot start date
                    startOfDay, // Start date > current date (normalized to start of day)
                  ],
                },
              },
            },
          },
          completedBookings: {
            $size: {
              $filter: {
                input: "$slots",
                as: "slot",
                cond: {
                  $and: [
                    // Completed bookings: Slot end date < current date
                    { $lt: [{ $arrayElemAt: ["$$slot.dates.date", -1] }, startOfDay] }, // Slot end date < current date
                    // Ensure dates array is not empty (there are actual dates in the slot)
                    { $ne: [{ $size: "$$slot.dates" }, 0] },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$branch",
          branchName: { $first: "$branchDetails.Branchname" },
          activeBookings: { $sum: "$activeBookings" },
          upcomingBookings: { $sum: "$upcomingBookings" },
          completedBookings: { $sum: "$completedBookings" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: bookingSummary,
    });
  } catch (error) {
    console.error("Error fetching booking summary:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the booking summary",
    });
  }
};


module.exports = {
  CreateBranch,
  UpdateBranch,
  GetAllBranch,
  GetSingleBranch,
  DeleteBranch,
  getBranchAnalytics,
  Getbranchsummary
};
