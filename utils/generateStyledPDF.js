const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

function generateBillHTML({ userName, fromDate, toDate, billRows, totalDays, totalAmount }) {
  const tableRows = billRows.map(row => `
    <tr>
      <td>${row.date}</td>
      <td>${row.day}</td>
      <td class="status-${row.status.toLowerCase()}">${row.status}</td>
      <td>₹${row.price.toFixed(2)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bill</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
    th { background-color: #4CAF50; color: white; }
    .status-present { color: green; font-weight: bold; }
    .status-absent { color: red; font-weight: bold; }
    .summary { margin-top: 20px; text-align: right; }
  </style>
</head>
<body>
  <h2>DhruvsCloudKitchen</h2>
  <p><b>User:</b> ${userName}</p>
  <p><b>Period:</b> ${fromDate} to ${toDate}</p>
  <table>
    <thead>
      <tr><th>Date</th><th>Day</th><th>Status</th><th>Price</th></tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  <div class="summary">
    <p><b>Total Days:</b> ${totalDays}</p>
    <p><b>Total Amount:</b> ₹${totalAmount.toFixed(2)}</p>
  </div>
</body>
</html>`;
}

const generateStyledPDF = async ({ userName, fromDate, toDate, billRows, totalDays, totalAmount, outputFile }) => {
  const html = generateBillHTML({ userName, fromDate, toDate, billRows, totalDays, totalAmount });

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({ path: outputFile, format: "A4", printBackground: true });

  await browser.close();

  return outputFile;
};

module.exports = generateStyledPDF;
