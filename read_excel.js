import xlsx from 'xlsx';
const workbook = xlsx.readFile("/Users/yuvrajbhati/Desktop/freelance work/drHemlata/Certificate QR code complete data duplicate sheet edited -2.xlsx");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
console.log(data[0]);
