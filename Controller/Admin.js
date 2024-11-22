const { validationResult } = require("express-validator");
const User = require("../Model/User");
const AppErr = require("../Services/AppErr");
const Methods = require("../Services/GlobalMethod/Method");
const bcrypt = require("bcrypt");
const BranchModel = require("../Model/Branch");

const Api = new Methods();

const CreateAdmin = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, branch, role = "admin", authType, uid } = req.body;

    // Validate required fields
    if (!branch) {
      return next(new AppErr("Branch is required for admin", 400));
    }
    if (!authType) {
      return next(new AppErr("Authentication type (authType) is required", 400));
    }

    // Explicitly set uid to null if not provided
    const newAdmin = new User({
      fullName,
      email,
      phoneNumber,
      role,
      branch,
      authType,
      uid: uid || null, // If uid is not passed, store as null
    });

    await newAdmin.save();

    return res.status(201).json({
      success: true,
      statuscode: 201,
      message: "Admin created successfully",
      data: newAdmin,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppErr("Duplicate entry for a unique field (e.g., email, phone, or uid)", 400));
    }
    return next(new AppErr(error.message, 500));
  }
};



//-------------------------Update Admin --------------------------------//

const UpdateAdmin = async (req, res, next) => {
  try {
    //-------Validation Check--------------//
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new AppErr(result.errors[0].msg, 403));
    }
    let { id } = req.params;
    let { name, email, number, branch } = req.body;
    //---------------Check Email -------------------//
    let EmailFound = await AdminModel.find({ Email: email, _id: { $ne: id } });
    if (EmailFound.length > 0) {
      return next(new AppErr("Email Already Exists", 402));
    }
    //---------------Check Number ------------------//
    let NumberFound = await AdminModel.find({
      Number: number,
      _id: { $ne: id },
    });
    if (NumberFound.length > 0) {
      return next(new AppErr("Number Already Exists", 402));
    }

    //---------------Check Branch-------------------//
    let branchData = await BranchModel.findById(branch);
    if (!branchData) {
      return next(new AppErr("Branch Not Found", 404));
    }

    //----------------Create Admin ---------------//
    try {
      const response = await Api.update(AdminModel, id, req.body);
      if (response.status === 200) {
        return res.status(200).json({
          status: true,
          statuscode: 200,
          message: "Admin Updated successfully",
          data: response,
        });
      } else {
        return res.status(400).json({
          status: false,
          statuscode: 400,
          message: response,
        });
      }
    } catch (err) {
      return res.status(400).json({
        status: false,
        statuscode: 400,
        message: err.message,
      });
    }
  } catch (error) {
    return next(new AppErr(error.message, 500));
  }
};

//--------------------Update Admin Branch ----------------------//

const UpdateAdminBranch = async (req, res, next) => {
  try {
    let { branchid, adminid } = req.params;

    //-----------Chaeck admin ------------------//
    let admin = await AdminModel.findById(adminid);
    if (!admin) {
      return next(new AppErr("Admin not found", 404));
    }

    //-----------Check Admin Activate or not -----------//
    if (!admin.activate) {
      return next("Admin is not activated", 404);
    }

    //---------Check Branch ---------------//
    let branch = await BranchModel.findById(branchid);
    if (!branch) {
      return next(new AppErr("Branch not found", 404));
    }

    //------------Update Admin----------------//
    admin.branch = [];
    admin.branch.push(branchid);
    await admin.save();

    return res.status(200).json({
      status: true,
      statuscode: 200,
      message: "Branch Updated successfully",
    });
  } catch (error) {
    return next(new AppErr(error.message, 500));
  }
};

//-----------------------Toggle Active Admin-------------------//

const ToggleActiveAdmin = async (req, res, next) => {
  try {
    let { id } = req.params;
    //-----------Chaeck admin ------------------//
    let admin = await AdminModel.findById(id);
    if (!admin) {
      return next(new AppErr("Admin not found", 404));
    }

    if (admin.activate) {
      admin.activate = false;
    } else {
      admin.activate = true;
    }
    await admin.save();
    return res.status(200).json({
      status: true,
      statuscode: 200,
      message: "Admin successfully activated/deactivated",
    });
  } catch (error) {
    return next(new AppErr(error.message, 500));
  }
};

//------------Get All Admin ------------------//

const GetAllAdmin = async (req, res, next) => {
  try {
    const { branchid } = req.params;

    if (!branchid) {
      return next(new AppErr("Branch ID is required", 400));
    }

    // Fetch all admins for the specified branch
    const admins = await AdminModel.find({ branch: branchid }).populate("branch");

    if (!admins || admins.length === 0) {
      return next(new AppErr("No admins found for this branch", 404));
    }

    return res.status(200).json({
      success: true,
      statuscode: 200,
      message: "Admins fetched successfully",
      data: admins,
    });
  } catch (error) {
    console.error(error);
    return next(new AppErr(error.message, 500));
  }
};

//-------------------Get Single Admin -------------------//

const GetSingleAdmin = async (req, res, next) => {
  try {
    let { id } = req.params;
    console.log(id)
    let admin = await AdminModel.findById(id);
    return res.status(200).json({
      status: true,
      statuscode: 200,
      message: "Admin fetched successfully ",
      data: admin,
    });
  } catch (error) {
    return next(new AppErr(error.message, 500));
  }
};

//--------------------------Login Admin ------------------------//

const LoginAdmin = async (req, res, next) => {
  try {
    //-------Validation Check--------------//
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return next(new AppErr(result.errors[0].msg, 403));
    }
    let { Email, Password } = req.body;
    //---------Find Admin --------------//

    let admin = await AdminModel.find({ Email: Email });
    if (!admin) {
      return next(new AppErr("Admin not found", 404));
    }

    if (!admin[0].activate) {
      return next(new AppErr("Admin not activated! talk to super Admin", 404));
    }

    //--------------Check Password -------------//
    let PasswordCheck = bcrypt.compareSync(Password, admin[0].Password);
    if (!PasswordCheck) {
      return next(new AppErr("Invalid Password", 404));
    }

    //-----------Generate Token-----------------//
    const payload = { id: admin[0]._id,role:"admin" };
    const token = GenerateToken(payload);

    return res.status(200).json({
      status: true,
      statuscode: 200,
      message: "Login successful",
      data: admin,
      token: token,
    });
  } catch (error) {
    return next(new AppErr(error.message, 500));
  }
};

module.exports = {
  CreateAdmin,
  UpdateAdmin,
  UpdateAdminBranch,
  ToggleActiveAdmin,
  GetAllAdmin,
  GetSingleAdmin,
  LoginAdmin,
};
