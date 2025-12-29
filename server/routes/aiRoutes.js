import express from 'express'
import protect from '../middlewares/authMiddleware.js';
import { enhanceJobDescription, enhanceProfessionalSummary, uploadResumeInDB } from '../controllers/aiController.js';

const aiRouter = express.Router();

aiRouter.post('/enhanced-prof-sum', protect, enhanceProfessionalSummary)
aiRouter.post('/enhanced-job-desc', protect, enhanceJobDescription)
aiRouter.post('/upload-resume', protect, uploadResumeInDB)

export default aiRouter
