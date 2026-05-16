import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/CustomError.js';
import prisma from '../lib/prisma.js';

export const protectAdmin = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true }
      });
      
      if (!admin) {
        throw new CustomError('Not authorized, admin not found', 401);
      }
      
      req.admin = admin;
      next();
    } catch (error) {
      next(new CustomError('Not authorized, token failed', 401));
    }
  } else {
    next(new CustomError('Not authorized, no token', 401));
  }
};
