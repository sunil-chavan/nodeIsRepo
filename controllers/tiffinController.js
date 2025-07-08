const PDFDocument = require('pdfkit');
const fs = require('fs');
const UserTiffin = require('../models/UserTiffin');
const TiffinAttendance = require('../models/TiffinAttendance');
const User = require('../models/User');

// 1. Generate Monthly PDF Bill
exports.generateBillByDateRange = async (req, res) => {
    const { fromDate, toDate } = req.body;
    const userId = req.user.id;
  
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }
  
    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      const latestTiffin = await TiffinAttendance.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .populate('tiffinCategory');
  
      if (!latestTiffin || !latestTiffin.tiffinCategory) {
        return res.status(404).json({ error: 'No tiffin category found for this user' });
      }
  
      const pricePerDay = latestTiffin.tiffinCategory.price;
  
      const attendances = await TiffinAttendance.find({
        date: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        status: 'present'
      }).populate({
        path: 'userTiffin',
        match: { user: userId }
      });
  
      const filtered = attendances.filter(a => a.userTiffin);
      const presentDays = filtered.length;
      const total = presentDays * pricePerDay;
  
      // Create PDF
      const PDFDocument = require('pdfkit');
      const fs = require('fs');
      const path = require('path');
      const billFolder = path.join(__dirname, '../bills');
      if (!fs.existsSync(billFolder)) fs.mkdirSync(billFolder);
  
      const fileName = `${user.name.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.pdf`;
      const filePath = path.join(billFolder, fileName);
  
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(filePath));
      doc.fontSize(18).text('Tiffin Bill', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Name: ${user.name}`);
      doc.text(`Date Range: ${fromDate} to ${toDate}`);
      doc.text(`Plan: ${latestTiffin.tiffinCategory.name}`);
      doc.text(`Price per day: ₹${pricePerDay}`);
      doc.text(`Present Days: ${presentDays}`);
      doc.text(`Total Amount: ₹${total}`);
      doc.end();
  
      res.status(200).json({
        message: 'Bill generated successfully',
        filePath,
        total,
        presentDays
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

// 2. Mark Attendance (single or multiple users)
exports.markTiffinAttendance = async (req, res) => {
    const { records } = req.body;
    try {
      const results = await Promise.all(
        records.map(async ({ userTiffinId, date, status = 'present' }) => {
          try {
            const attendanceDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
  
            if (attendanceDate > today) {
              return {
                success: false,
                error: `Future date not allowed: ${date}`
              };
            }
            const data = await TiffinAttendance.findOneAndUpdate(
              { userTiffin: userTiffinId, date },
              { status },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            return { success: true, data };
          } catch (err) {
            return { success: false, error: `DB error on ${date}: ${err.message}` };
          }
        })
      );
      const successData = results.filter(r => r.success).map(r => r.data);
      const errors = results.filter(r => !r.success).map(r => r.error);
      const response = {
        message: successData.length
          ? 'Tiffin attendance recorded successfully'
          : 'No attendance was recorded',
        data: successData,
        errors
      };
      res.status(200).json(response);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

// 3. Update Single Attendance
exports.updateAttendance = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      const updated = await TiffinAttendance.findByIdAndUpdate(id, { status }, { new: true });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
      res.json({ success: true, message: 'Attendance status updated', data: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  };

// 4. Delete (mark as inactive)
exports.deleteAttendance = async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = await TiffinAttendance.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
      res.json({ success: true, message: 'Attendance marked as inactive', data: deleted });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  };

// 5. Get Single Attendance
exports.getAttendanceById = async (req, res) => {
    const { id } = req.params;
    try {
      const data = await TiffinAttendance.findById(id)
        .populate({
          path: 'userTiffin',
          populate: ['user', 'tiffinCategory']
        });
      if (!data) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
  
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  };
  
