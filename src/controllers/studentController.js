import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { CustomError } from '../utils/CustomError.js';
import * as xlsx from 'xlsx';
import NodeCache from 'node-cache';

const studentCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// @desc    Create a new student
// @route   POST /api/students
// @access  Private
export const createStudent = asyncHandler(async (req, res) => {
  const {
    serialNo, name, fatherName, studentClass, mobileNumber,
    collegeName, joiningDate, endingDate, email, address,
    rollNumber, enrollmentNumber, category,
    certificateUrl, studentPhotoUrl
  } = req.body;

  // Check if serialNo already exists
  const existingStudent = await prisma.student.findUnique({ where: { serialNo } });
  if (existingStudent) {
    throw new CustomError('Serial number already exists', 400);
  }

  const student = await prisma.student.create({
    data: {
      serialNo, name, fatherName, studentClass, mobileNumber,
      collegeName, joiningDate, endingDate, email, address,
      rollNumber, enrollmentNumber, category,
      certificateUrl, studentPhotoUrl
    }
  });

  studentCache.flushAll();

  res.status(201).json({ success: true, data: student });
});

// @desc    Get all students (with search & pagination)
// @route   GET /api/students
// @access  Private
export const getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';

  const skip = (page - 1) * limit;
  const cacheKey = `students_${page}_${limit}_${search}`;

  const cachedData = studentCache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { serialNo: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { mobileNumber: { contains: search, mode: 'insensitive' } },
      { enrollmentNumber: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.student.count({ where })
  ]);

  const responseData = {
    success: true,
    data: students,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  };

  studentCache.set(cacheKey, responseData);
  res.json(responseData);
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  let certificateUrl = req.body.certificateUrl;
  let studentPhotoUrl = req.body.studentPhotoUrl;

  // Ensure serialNo is not duplicated if changed
  if (req.body.serialNo) {
    const existing = await prisma.student.findFirst({
      where: { serialNo: req.body.serialNo, NOT: { id } }
    });
    if (existing) throw new CustomError('Serial number already in use', 400);
  }

  const updatedStudent = await prisma.student.update({
    where: { id },
    data: {
      ...req.body,
      ...(certificateUrl && { certificateUrl }),
      ...(studentPhotoUrl && { studentPhotoUrl })
    }
  });

  studentCache.flushAll();

  res.json({ success: true, data: updatedStudent });
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.student.delete({ where: { id } });
  studentCache.flushAll();
  res.json({ success: true, message: 'Student removed' });
});

// @desc    Import students from Excel
// @route   POST /api/students/import-excel
// @access  Private
export const importStudents = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new CustomError('Please upload an Excel file', 400);
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse Excel to JSON, using first row as header keys
    // raw: false ensures dates are parsed as formatted strings instead of Excel numeric values
    const rawData = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: '' });

    if (!rawData || rawData.length === 0) {
      throw new CustomError('No data found in the Excel sheet', 400);
    }

    const normalizeKey = (key) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

    const data = rawData.map(row => {
      const normalizedRow = {};
      for (const key in row) {
        normalizedRow[normalizeKey(key)] = row[key];
      }
      return normalizedRow;
    });

    let processedCount = 0;
    let errors = [];

    const getVal = (row, keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          return row[key];
        }
      }
      return null;
    };

    for (const [index, row] of data.entries()) {
      try {
        const serialNo = getVal(row, ['serialno', 'seriolnumberoncertificate', 'serialnumber', 'sno']);
        
        if (!serialNo) {
           errors.push(`Row ${index + 2}: Missing Serial Number`);
           continue;
        }

        const mobileNumber = getVal(row, ['mobilenumber', 'mobile', 'phone']);
        const email = getVal(row, ['email', 'emailid']);
        const certificateUrl = getVal(row, ['certificateurl', 'certificatepoto', 'certificatephoto', 'certificate']);
        const studentPhotoUrl = getVal(row, ['studentphotourl', 'studentphoto', 'photo']);

        const updateData = {
          name: String(getVal(row, ['name', 'studentname']) || ''),
          fatherName: String(getVal(row, ['fathername', 'fathersname']) || ''),
          studentClass: String(getVal(row, ['studentclass', 'class', 'course']) || ''),
          mobileNumber: mobileNumber ? String(mobileNumber) : null,
          collegeName: String(getVal(row, ['collegename', 'nameofcollege', 'college']) || ''),
          joiningDate: String(getVal(row, ['joiningdate', 'dateofjoiningofinternshipprogramasgivenincertificate', 'startdate', 'dateofjoining']) || ''),
          endingDate: String(getVal(row, ['endingdate', 'internshipenddate', 'enddate']) || ''),
          email: email ? String(email) : null,
          address: String(getVal(row, ['address', 'homeadresspermanent', 'homeaddress']) || ''),
          rollNumber: String(getVal(row, ['rollnumber', 'rollno']) || ''),
          enrollmentNumber: String(getVal(row, ['enrollmentnumber', 'universityenrollmentnumber']) || ''),
          category: String(getVal(row, ['category']) || ''),
          certificateUrl: certificateUrl ? String(certificateUrl) : null,
          studentPhotoUrl: studentPhotoUrl ? String(studentPhotoUrl) : null,
        };

        await prisma.student.upsert({
          where: { serialNo: String(serialNo) },
          update: updateData,
          create: {
            serialNo: String(serialNo),
            ...updateData
          }
        });
        processedCount++;
      } catch (err) {
        errors.push(`Row ${index + 2}: ${err.message}`);
      }
    }

    studentCache.flushAll();

    res.status(200).json({
      success: true,
      message: `Import completed. Processed ${processedCount} students.`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    throw new CustomError('Failed to parse Excel file: ' + error.message, 400);
  }
});
