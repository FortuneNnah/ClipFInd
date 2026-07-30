import express from 'express';
import { getJob } from '../controllers/jobController.js';

const router = express.Router();

router.get('/job/:id', getJob);

export default router;