const AdminModel = require("../Model/SuperAdminAndAdmin/Admin");
const SuperAdminModel = require("../Model/SuperAdminAndAdmin/SuperAdmin");
const AppErr = require("../Services/AppErr");
const VerifyToken = require("../Services/Jwt/VerifyToken");

const IsSuperOrAdmin = async (req, res, next) => {

  try {
    let { token } = req.headers;
    let decoded = VerifyToken(token);
    console.log(decoded)
    req.super = decoded.id;
    if (!decoded) {
      return next(new AppErr("Invalid token", 404));
    }
    let superadmin = await SuperAdminModel.findById(decoded.id);
    let admin = await AdminModel.findById(decoded.id);


    if (!superadmin && !admin) {
      return next(new AppErr("Super Admin Or Admin not found", 404));
    }

    if (!superadmin) {
      return next(new AppErr("You Dont't Have Permission", 404));
    }

    if (!admin) {
      return next(new AppErr("You Dont't Have Permission", 404));
    }

    if (superadmin) {
      req.role = "owner";
      req.user = superadmin._id;
    } else {
      req.role = "admin";
      req.user = admin._id;
    }

    next();
  } catch (error) {
    next(new AppErr(error.message, 500));
  }
};

module.exports = {
  IsSuperOrAdmin,
};
