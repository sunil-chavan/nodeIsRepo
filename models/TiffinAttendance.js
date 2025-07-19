const mongoose = require("mongoose");

const tiffinAttendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tiffinSubcription: { type: mongoose.Schema.Types.ObjectId, ref: "TiffinSubscription" },
    date: { type: Date, required: true },
    tiffinShiftStatus: {
      type: String,
      enum: ["morning", "evening", null],
      default: null,
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

tiffinAttendanceSchema.index(
  { userId: 1, date: 1, tiffinShiftStatus: 1 },
  { unique: true }
);

module.exports = mongoose.model("TiffinAttendance", tiffinAttendanceSchema);
