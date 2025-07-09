// Required packages
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

// HTML template generator
function generateBillHTML({ userName, fromDate, toDate, billRows, totalDays, totalAmount }) {
  const tableRows = billRows.map(row => `
    <tr>
      <td>${row.date}</td>
      <td>${row.day}</td>
      <td class="status-${row.status.toLowerCase()}">${row.status}</td>
      <td>₹${row.price.toFixed(2)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DhruvsCloudKitchen</title>
  <style>
    body { font-family: Arial; margin: 20px; background: #f4f4f4; color: #333; }
    .container { max-width: 800px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; }
    h1 { text-align: center; color: #2c3e50; }
    .section-header { font-size: 1.2em; font-weight: bold; margin-top: 20px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
    .info-item { margin-bottom: 8px; }
    .info-item b { color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
    th { background: #4CAF50; color: white; }
    tr:nth-child(even) { background: #f2f2f2; }
    .status-present { color: green; font-weight: bold; }
    .status-absent { color: red; font-weight: bold; }
    .summary { margin-top: 30px; text-align: right; font-size: 1.1em; }
    .total { font-size: 1.3em; font-weight: bold; color: #2c3e50; }
  </style>
</head>
<body>
  <div class="container">
    <h1>DhruvsCloudKitchen</h1>
    <div class="info-item"><b>Member Name:</b> ${userName}</div>
    <div class="info-item"><b>Bill Period:</b> ${fromDate} to ${toDate}</div>
    <div class="section-header">Monthly Attendance Calendar</div>
    <table>
      <thead>
        <tr><th>Date</th><th>Day</th><th>Status</th><th>Price</th></tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div class="summary">
      <div><b>Total Present Days:</b> ${totalDays}</div>
      <div class="total"><b>Total Price:</b> ₹${totalAmount.toFixed(2)}</div>
    </div>
  </div>
</body>
</html>`;
}

// Convert HTML to PDF using Puppeteer
const generateStyledPDF = async ({ userName, fromDate, toDate, billRows, totalDays, totalAmount }) => {
  const html = generateBillHTML({ userName, fromDate, toDate, billRows, totalDays, totalAmount });
  const fileName = `${userName.replace(/\s+/g, "_")}_${fromDate}_to_${toDate}.pdf`;
  const filePath = path.join(__dirname, "../bills", fileName);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({ path: filePath, format: "A4", printBackground: true });
  await browser.close();

  return filePath;
};

module.exports = generateStyledPDF;
