import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { CustomError } from '../utils/CustomError.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
export const authAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (admin && (await bcrypt.compare(password, admin.password))) {
    res.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        token: generateToken(admin.id),
      }
    });
  } else {
    throw new CustomError('Invalid email or password', 401);
  }
});
