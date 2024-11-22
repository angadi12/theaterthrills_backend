const mongoose = require("mongoose");
const { Schema } = mongoose;

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    branch: {
        type: Schema.Types.ObjectId,
        ref: "Branch",
        required: [true, "Branch ID is required"],
    },
    role: {
      type: String,
      required: true,
      default: 'admin'
    },
    activate: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AdminModel = mongoose.model("Admin", AdminSchema);
module.exports = AdminModel;
