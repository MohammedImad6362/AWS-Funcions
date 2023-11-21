const fs = require('fs');
const ExcelJS = require('exceljs');

async function getColumnData(filePath, columnNumber) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet(1);

  const columnData = [];

  worksheet.eachRow((row, rowNumber) => {
    const cell = row.getCell(columnNumber);
    if (rowNumber >= 1) {
      columnData.push(cell.value);
    }
  });

  return columnData;
}

async function saveArrayToFile(array, filename) {
  const jsCode = `const myArray = ${JSON.stringify(array, null, 2)};\n\nmodule.exports = myArray;`;

  try {
    await fs.promises.writeFile(filename, jsCode, 'utf8');
    console.log(`Array data saved to ${filename}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage example
const filePath = 'student.xlsx'; // Replace with your Excel file path
const columnNumber = 1; // Replace with the column number you want to extract

getColumnData(filePath, columnNumber)
  .then((data) => {
    // Specify the filename for the new JavaScript file
    const filename = 'arrayData.js';
    saveArrayToFile(data, filename);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
