const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const TiffinAttendance = require("../models/TiffinAttendance");
const TiffinSubscription = require('../models/TiffinSubscription');
const generatePDF = require("../utils/generateStyledPDF");
const MonthlyMemberBill = require('../models/MonthlyMemberBill');
const User = require("../models/User");

const generateStyledPDF = async ({
  userName,
  fromDate,
  toDate,
  billRows = [], // [{ date, day, status, price }]
  totalDays,
  totalAmount,
}) => {
  const billFolder = path.join(__dirname, "../bills");
  if (!fs.existsSync(billFolder)) fs.mkdirSync(billFolder);

  const fileName = `${userName.replace(
    /\s+/g,
    "_"
  )}_${fromDate}_to_${toDate}.pdf`;
  const filePath = path.join(billFolder, fileName);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(filePath));

  // Header
  doc
    .fontSize(22)
    .fillColor("#0A74DA")
    .text("DhruvsCloudKitchen", { align: "center" });
  doc.moveDown(0.5);
  doc
    .strokeColor("#ccc")
    .lineWidth(1)
    .moveTo(40, doc.y)
    .lineTo(550, doc.y)
    .stroke();
  doc.moveDown(1.2);

  // Member Info
  doc
    .fontSize(13)
    .fillColor("#000")
    .text("Member Information", { underline: true });
  doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .text("Member Name: ", { continued: true })
    .font("Helvetica")
    .text(userName);
  doc
    .font("Helvetica-Bold")
    .text("Bill Period: ", { continued: true })
    .font("Helvetica")
    .text(`${fromDate} to ${toDate}`);
  doc.moveDown(1);

  // Table Header
  const tableTop = doc.y;
  const colX = [40, 160, 280, 400];
  doc.fillColor("#fff").rect(colX[0], tableTop, 460, 20).fill("#4CAF50");

  ["Date", "Day", "Status", "Price"].forEach((text, i) => {
    doc
      .fillColor("#fff")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(text, colX[i] + 5, tableTop + 5);
  });

  // Table Rows
  let y = tableTop + 20;
  billRows.forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? "#f9f9f9" : "#ffffff";
    doc.rect(colX[0], y, 460, 20).fill(bgColor);
    doc.fillColor("#000").fontSize(11);

    doc.text(row.date, colX[0] + 5, y + 5);
    doc.text(row.day, colX[1] + 5, y + 5);

    doc
      .fillColor(row.status === "Present" ? "#2E7D32" : "#D32F2F")
      .text(row.status, colX[2] + 5, y + 5);
    doc.fillColor("#000").text(`₹${row.price.toFixed(2)}`, colX[3] + 5, y + 5);

    y += 20;
  });

  doc.moveDown(2);

  // Summary
  doc
    .font("Helvetica-Bold")
    .text(`Total Present Days: ${totalDays}`, 40, y + 10);
  doc
    .fontSize(14)
    .fillColor("#000")
    .text(`Total Price: ₹${totalAmount.toFixed(2)}`, 400, y + 10, {
      align: "right",
    });

  doc.end();
  return filePath;
};
// ✅ 1. Generate Bill
const getUsers = async () => {
  return [
    { name: 'Sunil Chavan', email: 'sunil@example.com' },
    { name: 'Amit Yadav', email: 'amit@example.com' },
  ];
};
exports.generateUserBillNew = async (req, res) => {
  try {
    const { fromDate, endDate, invoiceMonth } = req.body;

    if (!fromDate || !endDate || !invoiceMonth) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fromDate, endDate, invoiceMonth',
      });
    }

    const users = await getUsers(); // Replace with DB logic
    const invoiceDataArray = [];

    for (const user of users) {
      const totalDays = 4; // Replace with real logic
      const totalAmount = totalDays * 70;

      const fileName = `${user.name.replace(/\s/g, "_")}_${fromDate}_to_${endDate}.pdf`;
      const filePath = path.join(__dirname, '../bills', fileName);

      await generatePDF({
        user,
        fromDate,
        endDate,
        invoiceMonth,
        totalDays,
        totalAmount,
        items: [
          { name: 'Tiffin Day 1', price: 70 },
          { name: 'Tiffin Day 2', price: 70 },
          { name: 'Tiffin Day 3', price: 70 },
          { name: 'Tiffin Day 4', price: 70 },
        ],
        filePath
      });

      invoiceDataArray.push({
        user: user.name,
        email: user.email,
        invoiceMonth,
        totalDays,
        totalAmount,
        invoicePdfUrl: filePath,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoices generated successfully',
      data: invoiceDataArray,
    });

  } catch (error) {
    console.error('❌ Error in generateUserBill:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message,
    });
  }
};
exports.generateUserBillOld = async (req, res) => {
  const { fromDate, endDate , userId } = req.body;
  const requester = req.user;

  if (!fromDate || !endDate) {
    return res.status(400).json({ success: false, message: "fromDate and toDate are required" });
  }

  const isAdmin = ["admin", "superadmin"].includes(requester.role);
  const targetUserIds = Array.isArray(userId)
    ? userId
    : userId
    ? [userId]
    : isAdmin
    ? []
    : [requester.id];

  try {
    const from = new Date(fromDate);
    const to = new Date(endDate);

    const query = {
      status: "active",
      fromDate: { $lte: from },
      endDate: { $gte: to },
    };

    if (targetUserIds.length) {
      query.userId = { $in: targetUserIds };
    }

    const subscriptions = await TiffinSubscription.find(query)
      .populate("userId", "name email")
      .populate("tiffinCategoryId", "name price");

    if (!subscriptions.length) {
      return res.status(404).json({
        success: false,
        message: "No subscriptions found for this date range.",
      });
    }

    const results = [];

    for (const sub of subscriptions) {
      if (!sub.userId || !sub.userId.name) continue;

      const attendanceRecords = await TiffinAttendance.find({
        userId: sub.userId._id,
        date: { $gte: from, $lte: to },
      });

      const attendanceMap = {};
      attendanceRecords.forEach((rec) => {
        const dateStr = rec.date.toISOString().split("T")[0];
        attendanceMap[dateStr] = rec;
      });

      const billRows = [];
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const record = attendanceMap[dateStr];

        const status = record?.status === "present" ? "Present" : "Absent";
        const shift = record?.tiffinShiftStatus || "N/A";
        const price = status === "Present" ? sub.tiffinCategoryId?.price || 0 : 0;

        billRows.push({
          date: dateStr,
          day: d.toLocaleDateString("en-IN", { weekday: "short" }),
          shift,
          status,
          price,
        });
      }

      const totalDays = billRows.filter((r) => r.status === "Present").length;
      const totalAmount = billRows.reduce((sum, r) => sum + r.price, 0);

      const userInitial = sub.userId.name.toLowerCase().replace(/\s+/g, "-").substring(0, 20);
      const invoiceId = `${userInitial}-${fromDate}-${endDate}`;
      const fileName = `${invoiceId}.pdf`;

      const folderPath = path.join(__dirname, "..", "public", "invoices", invoiceId);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const fullInvoicePath = path.join(folderPath, fileName);
      const invoicePdfUrls = `/invoices/${invoiceId}/${fileName}`;

      // Generate PDF
      const invoicePdfUrl = await generatePDF({
        userName: sub.userId.name,
        fromDate,
        endDate,
        billRows,
        totalDays,
        totalAmount,
        outputFile: fullInvoicePath,
      });
console.log("generatePDFUrl ====>",invoicePdfUrl );
      // Save to DB
      await MonthlyMemberBill.create({
        userId: sub.userId._id,
        invoiceMonth: invoiceId,
        invoicePdfUrl,
        invoiceBillStatus: "unpaid",
        invoiceDownloadStatus: "original",
      });

      results.push({
        user: sub.userId.name,
        email: sub.userId.email,
        invoiceMonth: invoiceId,
        totalDays,
        totalAmount,
        invoicePdfUrl,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Bills generated successfully.",
      results,
    });

  } catch (err) {
    console.error("Bill generation failed:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      details: err.message,
    });
  }
};
exports.generateUserBill = async (req, res) => {
  const { fromDate, endDate, userId } = req.body;
  const requester = req.user;

  if (!fromDate || !endDate) {
    return res.status(400).json({ success: false, message: "fromDate and endDate are required" });
  }

  const isAdmin = ["admin", "superadmin"].includes(requester.role);
  const targetUserIds = Array.isArray(userId)
    ? userId
    : userId
    ? [userId]
    : isAdmin
    ? []
    : [requester.id];

  try {
    const from = new Date(fromDate);
    const to = new Date(endDate);

    const query = {
      status: "active",
      fromDate: { $lte: from },
      endDate: { $gte: to },
    };

    if (targetUserIds.length) {
      query.userId = { $in: targetUserIds };
    }

    const subscriptions = await TiffinSubscription.find(query)
      .populate("userId", "name email")
      .populate("tiffinCategoryId", "name price");

    if (!subscriptions.length) {
      return res.status(404).json({ success: false, message: "No subscriptions found." });
    }

    const results = [];

    for (const sub of subscriptions) {
      if (!sub.userId || !sub.userId.name) continue;

      const attendanceRecords = await TiffinAttendance.find({
        userId: sub.userId._id,
        date: { $gte: from, $lte: to },
      });

      const attendanceMap = {};
      attendanceRecords.forEach(rec => {
        const dateStr = rec.date.toISOString().split("T")[0];
        attendanceMap[dateStr] = rec;
      });

      const billRows = [];
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const record = attendanceMap[dateStr];

        const status = record?.status === "present" ? "Present" : "Absent";
        const shift = record?.tiffinShiftStatus || "N/A";
        const price = status === "Present" ? sub.tiffinCategoryId?.price || 0 : 0;

        billRows.push({
          date: dateStr,
          day: d.toLocaleDateString("en-IN", { weekday: "short" }),
          shift,
          status,
          price,
        });
      }

      const totalDays = billRows.filter(r => r.status === "Present").length;
      const totalAmount = billRows.reduce((sum, r) => sum + r.price, 0);

      const invoiceId = `${sub.userId.name.toLowerCase().replace(/\s+/g, "-")}-${fromDate}-${endDate}`;
      const fileName = `${invoiceId}.pdf`;
      const folderPath = path.join(__dirname, "..", "public", "invoices", invoiceId);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const fullInvoicePath = path.join(folderPath, fileName);
      const publicInvoicePath = `/invoices/${invoiceId}/${fileName}`;

      const pdfGenratedUrl =await generateStyledPDF({
        userName: sub.userId.name,
        fromDate,
        toDate: endDate,
        billRows,
        totalDays,
        totalAmount,
        outputFile: fullInvoicePath,
      });

      await MonthlyMemberBill.create({
        userId: sub.userId._id,
        invoiceMonth: invoiceId,
        invoicePdfUrl: pdfGenratedUrl,
        invoiceBillStatus: "unpaid",
        invoiceDownloadStatus: "original",
      });

      results.push({
        user: sub.userId.name,
        email: sub.userId.email,
        invoiceMonth: invoiceId,
        totalDays,
        totalAmount,
        invoicePdfUrl: publicInvoicePath,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bills generated successfully.",
      results,
    });

  } catch (err) {
    console.error("❌ Bill generation failed:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      details: err.message,
    });
  }
};
// ✅ 2. Mark Attendance
exports.markTiffinAttendance = async (req, res) => {
  const { userId, date, tiffinShiftStatus } = req.body;
  const attendanceDate = new Date(date);

  let errors = [];
  let success = [];

  for (const uid of userId) {
    try {
      const subscription = await TiffinSubscription.findOne({ userId: uid });
      if (!subscription) {
        errors.push(`User ${uid} is not subscribed.`);
        continue;
      }

      const alreadyMarked = await TiffinAttendance.findOne({
        userId: uid,
        date: attendanceDate,
        tiffinShiftStatus,
      });

      if (alreadyMarked) {
        errors.push(`Attendance already marked for user ${uid}`);
        continue;
      }

      await TiffinAttendance.create({
        userId: uid,
        date: attendanceDate,
        status: "present",
        tiffinShiftStatus,
      });

      const user = await User.findById(uid);
      success.push(`Attendance marked for ${user.name || uid}`);
    } catch (err) {
      console.error("Error processing user", uid, err.message);
      errors.push(`Error processing user ${uid}: ${err.message}`);
    }
  }

  const message =
    success.length > 0 ? "Attendance marking completed." : "No attendance recorded";

  return res.status(200).json({
    message,
    data: success,
    errors,
  });
};



// ✅ 3. Update Attendance
exports.updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await TiffinAttendance.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Attendance not found" });

    res.json({
      success: true,
      message: "Attendance status updated",
      data: updated,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ 4. Delete (Mark as inactive)
exports.deleteAttendance = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await TiffinAttendance.findByIdAndUpdate(
      id,
      { status: "inactive" },
      { new: true }
    );
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Attendance not found" });

    res.json({
      success: true,
      message: "Attendance marked as inactive",
      data: deleted,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ✅ 5. Get Single Attendance
exports.getAttendanceById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await TiffinAttendance.findById(id).populate({
      path: "tiffinSubcription",
      populate: ["user", "tiffinCategory"],
    });
    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Attendance not found" });

    res.json({ success: true, data });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

exports.getAttendances = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortField = "createdAt",
      sortOrder = "desc",
      search = "",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    // Build filter conditionally based on search
    let filter = {};
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search, "i");
      filter = {
        $or: [
          { status: searchRegex },
          { tiffinShiftStatus: searchRegex },
        ],
      };
    }

    const total = await TiffinAttendance.countDocuments(filter);

    const data = await TiffinAttendance.find(filter)
      .populate({
        path: "userId",
        select: "name", // Only fetch user's name
      })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      data,
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};
