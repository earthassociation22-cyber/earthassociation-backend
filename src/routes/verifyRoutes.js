import express from 'express';
import { verifyStudent } from '../controllers/verifyController.js';

const router = express.Router();

router.post('/', verifyStudent);

export default router;
