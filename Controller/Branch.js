const mongoose = require("mongoose");
const Branch = require("../Model/Branch");
const { validationResult } = require("express-validator");
const AppErr = require("../Services/AppErr");
const Booking = require('../Model/Booking'); // Adjust the path to your model
const Theater= require('../Model/Theater');
const User = require("../Model/User");

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
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    // Calculate IST date ranges
    const currentDateIST = new Date();
    currentDateIST.setHours(currentDateIST.getHours() + 5);
    currentDateIST.setMinutes(currentDateIST.getMinutes() + 30);
    
    const startOfDayIST = new Date(currentDateIST.setHours(0, 0, 0, 0));
    const endOfDayIST = new Date(startOfDayIST.getTime() + 86399999); // End of day
    
    const bookingSummary = await Booking.aggregate([
      {
        $match: {
          theater: { $exists: true },
        },
      },
      {
        $lookup: {
          from: "theaters", // Join Theater collection
          localField: "theater",
          foreignField: "_id",
          as: "theaterDetails",
        },
      },
      {
        $unwind: "$theaterDetails",
      },
      {
        $lookup: {
          from: "branches", // Join Branch collection to get branch details
          localField: "theaterDetails.branch",
          foreignField: "_id",
          as: "branchDetails",
        },
      },
      {
        $unwind: "$branchDetails",
      },
      {
        $match: {
          "branchDetails._id": new mongoose.Types.ObjectId(branchId), // Filter by branch ID
        },
      },
      {
        $addFields: {
          isActive: {
            $and: [
              { $gte: ["$date", startOfDayIST] },
              { $lte: ["$date", endOfDayIST] },
            ],
          },
          isUpcoming: {
            $gt: ["$date", endOfDayIST],
          },
          isCompleted: {
            $lt: ["$date", startOfDayIST],
          },
        },
      },
      {
        $group: {
          _id: "$branchDetails._id", // Group by branch ID
          branchName: { $first: "$branchDetails.name" }, // Use branch name from Branch collection
          activeBookings: { $sum: { $cond: ["$isActive", 1, 0] } },
          upcomingBookings: { $sum: { $cond: ["$isUpcoming", 1, 0] } },
          completedBookings: { $sum: { $cond: ["$isCompleted", 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          branchName: 1,
          activeBookings: 1,
          upcomingBookings: 1,
          completedBookings: 1,
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







const getBranchdetails = async (req, res) => {
  try {
    const { branchId } = req.params; // Extract branchId from the request parameters

    // Validate branchId
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    const branchObjectId = new mongoose.Types.ObjectId(branchId); // Convert to ObjectId

    // Fetch admin count for the branch
    const adminCountResult = await User.aggregate([
      { $match: { branch: branchObjectId, role: "admin" } }, // Filter by branch and role
      {
        $group: {
          _id: "$branch",
          adminCount: { $sum: 1 },
        },
      },
    ]);

    // Fetch theater count for the branch
    const theaterCountResult = await Theater.aggregate([
      { $match: { branch: branchObjectId } }, // Filter by branch
      {
        $group: {
          _id: "$branch",
          theaterCount: { $sum: 1 },
        },
      },
    ]);

    // Prepare the response
    const adminCount = adminCountResult.length > 0 ? adminCountResult[0].adminCount : 0;
    const theaterCount = theaterCountResult.length > 0 ? theaterCountResult[0].theaterCount : 0;

    res.status(200).json({
      success: true,
      data: {
        branch: branchId,
        adminCount,
        theaterCount,
      },
    });
  } catch (error) {
    console.error("Error fetching branch summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch branch summary",
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
  Getbranchsummary,
  getBranchdetails
};
