// utils/generatePDF.js
const generateStyledPDF = require('./generateStyledPDF');

module.exports = async function generatePDF(data) {
  try {
    await generateStyledPDF(data);
  } catch (err) {
    console.error('❌ Failed to generate PDF:', err);
    throw err;
  }
};
