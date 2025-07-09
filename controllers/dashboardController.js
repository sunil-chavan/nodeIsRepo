// controllers/dashboardController.js
const User = require("../models/User");
const UserTiffin = require("../models/UserTiffin");
const TiffinCategory = require("../models/TiffinCategory");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const TiffinAttendance = require("../models/TiffinAttendance");
const mongoose = require("mongoose");

exports.getDashboardSummary = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // 1. Total users
    const totalUsers = await User.countDocuments();

    // 2. Subscribed users (active)
    const subscribedUsers = await UserTiffin.distinct("user", { status: "active" });
    const subscribedUserCount = subscribedUsers.length;

    // 3. Tiffin category wise subscription count
    const categoryCounts = await UserTiffin.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$tiffinCategory",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "tiffincategories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: "$category"
      },
      {
        $project: {
          categoryName: "$category.name",
          count: 1
        }
      }
    ]);

    // 4. Monthly income
    const monthlyIncome = await Income.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lt: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    // 5. Monthly expense
    const monthlyExpense = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lt: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    // 6. Tiffin Attendance-wise income for current month
    const attendanceWithIncome = await TiffinAttendance.aggregate([
      {
        $match: {
          date: {
            $gte: startOfMonth.toISOString().split("T")[0],
            $lt: endOfMonth.toISOString().split("T")[0]
          },
          status: "present"
        }
      },
      {
        $lookup: {
          from: "usertiffins",
          localField: "userTiffin",
          foreignField: "_id",
          as: "userTiffin"
        }
      },
      { $unwind: "$userTiffin" },
      {
        $lookup: {
          from: "tiffincategories",
          localField: "userTiffin.tiffinCategory",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category.name",
          totalIncome: { $sum: "$category.price" },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      totalUsers,
      subscribedUserCount,
      categoryCounts,
      monthlyIncome: monthlyIncome[0]?.total || 0,
      monthlyExpense: monthlyExpense[0]?.total || 0,
      attendanceIncome: attendanceWithIncome
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
