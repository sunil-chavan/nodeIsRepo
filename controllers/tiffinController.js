const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const UserTiffin = require("../models/UserTiffin");
const TiffinAttendance = require("../models/TiffinAttendance");
const generatePDF = require('../utils/generateStyledPDF');

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
exports.generateUserBill = async (req, res) => {
  const { fromDate, toDate, userId } = req.body;
  const requester = req.user;

  if (!fromDate || !toDate) {
    return res.status(400).json({ error: "fromDate and toDate are required" });
  }

  const isAdmin = ["admin", "superadmin"].includes(requester.role);
  const targetUserIds = isAdmin && !userId ? null : [userId || requester.id];
  try {
    const query = {
      status: "active",
      fromDate: { $lte: new Date(toDate) },
      endDate: { $gte: new Date(fromDate) },
    };
    if (targetUserIds) query.user = { $in: targetUserIds };
    const subscriptions = await UserTiffin.find(query)
      .populate("user")
      .populate("tiffinCategory");

    if (!subscriptions.length) {
      return res.status(404).json({ error: "No active user subscriptions found in this date range" });
    }
    const results = [];
    for (const sub of subscriptions) {
      const attendances = await TiffinAttendance.find({
        userTiffin: sub.user._id,
        date: { $gte: fromDate, $lte: toDate } 
      });
      const billRows = attendances.map((att) => {
        const dateObj = new Date(att.date);
        return {
          date: dateObj.toISOString().split("T")[0],
          day: dateObj.toLocaleDateString("en-IN", { weekday: "short" }),
          status: att.status === "present" ? "Present" : "Absent",
          price: att.status === "present" ? sub.tiffinCategory.price : 0
        };
      });
      const totalDays = billRows.filter(r => r.status === "Present").length;
      const totalAmount = billRows.reduce((sum, r) => sum + r.price, 0);
      console.log("billRows===>",billRows);
      const filePath = await generatePDF({
        userName: sub.user.name,
        fromDate,
        toDate,
        billRows,
        totalDays,
        totalAmount
      });
      results.push({
        user: sub.user.name,
        filePath,
        totalDays,
        totalAmount
      });
    }
    return res.status(200).json({
      message: "Bill(s) generated successfully",
      results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ 2. Mark Attendance
exports.markTiffinAttendance = async (req, res) => {
  const { records } = req.body;
  try {
    const results = await Promise.all(
      records.map(async ({ userTiffinId, date, status = "present" }) => {
        try {
          const attendanceDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (
            attendanceDate >= new Date(today.getTime() + 24 * 60 * 60 * 1000)
          ) {
            return {
              success: false,
              error: `Future date not allowed: ${date}`,
            };
          }

          const userTiffin = await UserTiffin.findById(userTiffinId).populate(
            "user"
          );
          if (!userTiffin || !userTiffin.user) {
            return {
              success: false,
              error: `Invalid userTiffinId: ${userTiffinId}`,
            };
          }

          const existing = await TiffinAttendance.findOne({
            userTiffin: userTiffinId,
            date: attendanceDate,
          });
          if (existing) {
            return {
              success: false,
              error: `Attendance already marked for user: ${userTiffin.user.name} on ${date}`,
            };
          }

          const data = await TiffinAttendance.create({
            userTiffin: userTiffinId,
            date: attendanceDate,
            status,
          });

          return { success: true, data };
        } catch (err) {
          return {
            success: false,
            error: `DB error on ${date}: ${err.message}`,
          };
        }
      })
    );

    const successData = results.filter((r) => r.success).map((r) => r.data);
    const errors = results.filter((r) => !r.success).map((r) => r.error);

    res.status(200).json({
      message: successData.length
        ? "Tiffin attendance recorded successfully"
        : "No attendance was recorded",
      data: successData,
      errors,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
      path: "userTiffin",
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
