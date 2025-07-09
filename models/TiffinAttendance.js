const mongoose = require("mongoose");

const tiffinAttendanceSchema = new mongoose.Schema(
  {
    userTiffin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserTiffin",
      required: true,
    },
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      default: "present",
    },
  },
  {
    timestamps: true,
  }
);
tiffinAttendanceSchema.index({ userTiffin: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("TiffinAttendance", tiffinAttendanceSchema);
