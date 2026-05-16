import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Verify student certificate
// @route   POST /api/verify
// @access  Public
export const verifyStudent = asyncHandler(async (req, res) => {
  const { serialNo, credential } = req.body;

  if (!serialNo || !credential) {
    return res.status(400).json({ verified: false, message: 'Please provide both serial number and a credential' });
  }

  const cleanSerial = serialNo.trim();
  const cleanCred = credential.trim();

  const student = await prisma.student.findFirst({
    where: {
      serialNo: { equals: cleanSerial, mode: 'insensitive' },
      OR: [
        { mobileNumber: { equals: cleanCred, mode: 'insensitive' } },
        { email: { equals: cleanCred, mode: 'insensitive' } },
        { enrollmentNumber: { equals: cleanCred, mode: 'insensitive' } }
      ]
    }
  });

  if (student) {
    // Log verification async
    prisma.verificationLog.create({
      data: {
        studentId: student.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    }).catch(err => console.error('Failed to log verification:', err));

    return res.json({
      verified: true,
      student
    });
  } else {
    return res.json({ verified: false });
  }
});
