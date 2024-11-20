const SuperAdminModel = require("../Model/SuperAdminAndAdmin/SuperAdmin");
const AppErr = require("../Services/AppErr");
const VerifyToken = require("../Services/Jwt/VerifyToken");

const IsSuperAdmin = async (req, res, next) => {
  try {
    let { token } = req.headers;
    let decoded = VerifyToken(token);
    req.super = decoded.id;
    console.log(decoded)
    if (!decoded) {
      return next(new AppErr("Invalid token", 404));
    }
    let superadmin = await SuperAdminModel.findById(decoded.id);
    if (!superadmin) {
      return next(new AppErr("Super Admin not found", 404));
    }
    next();
  } catch (error) {
    next(new AppErr(error.message, 500));
  }
};

module.exports = {
  IsSuperAdmin,
};
