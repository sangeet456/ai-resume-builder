const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  createResume, 
  getResumes, 
  getResumeById, 
  updateResume, 
  deleteResume, 
  tailorResume,
  generateAIResume
} = require('../controllers/resumeController');

// All routes are protected
router.use(protect);

// Resume CRUD
router.route('/')
  .get(getResumes)
  .post(createResume);

router.route('/:id')
  .get(getResumeById)
  .put(updateResume)
  .delete(deleteResume);

// AI Routes
router.post('/tailor/:id', tailorResume);
router.post('/generate-ai', generateAIResume);

module.exports = router;
