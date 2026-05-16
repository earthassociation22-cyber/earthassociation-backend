import express from 'express';
import multer from 'multer';
import {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  importStudents
} from '../controllers/studentController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Apply auth middleware to all student routes
router.use(protectAdmin);

router.post('/import-excel', upload.single('file'), importStudents);

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/:id')
  .put(updateStudent)
  .delete(deleteStudent);

export default router;
