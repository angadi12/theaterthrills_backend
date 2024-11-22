const mongoose = require("mongoose");

const BranchSchema = new mongoose.Schema(
  {
    Branchname: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    location: {
      type: String,
    },
    Number: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const BranchModel = mongoose.model("Branch", BranchSchema);
module.exports = BranchModel;
