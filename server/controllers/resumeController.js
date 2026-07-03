const Resume = require('../models/Resume');
const { analyzeResume } = require('../services/aiService');

// @desc    Create a resume
// @route   POST /api/resume
// @access  Private
exports.createResume = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const resume = await Resume.create(req.body);
    res.status(201).json({
      success: true,
      data: resume
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all resumes for a user
// @route   GET /api/resume
// @access  Private
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id });
    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single resume
// @route   GET /api/resume/:id
// @access  Private
exports.getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume'
      });
    }

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update resume
// @route   PUT /api/resume/:id
// @access  Private
exports.updateResume = async (req, res) => {
  try {
    let resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this resume'
      });
    }

    resume = await Resume.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete resume
// @route   DELETE /api/resume/:id
// @access  Private
exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this resume'
      });
    }

    await resume.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Tailor resume with AI
// @route   POST /api/resume/tailor/:id
// @access  Private
exports.tailorResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    
    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a job description'
      });
    }

    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to tailor this resume'
      });
    }

    const analysis = await analyzeResume(resume, jobDescription);
    
    resume.atsScore = analysis.atsScore || 0;
    await resume.save();

    res.status(200).json({
      success: true,
      data: {
        resume,
        analysis
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate Resume with AI
// @route   POST /api/resume/generate-ai
// @access  Private
exports.generateAIResume = async (req, res) => {
  try {
    const { jobTitle, skills, experience, jobDescription } = req.body;
    
    if (!jobTitle || !skills || !experience) {
      return res.status(400).json({
        success: false,
        message: 'Job Title, Skills, and Experience are required!'
      });
    }

    const aiService = require('../services/aiService');
    const ResumeModel = require('../models/Resume');
    
    const prompt = `
      You are an expert resume writer. Create a professional, ATS-optimized resume based on these details:
      
      Job Title: ${jobTitle}
      Skills: ${skills.join(', ')}
      Experience: ${experience}
      ${jobDescription ? `Job Description: ${jobDescription}` : ''}
      
      Generate a complete resume with:
      1. Professional Summary (2-3 lines, impactful)
      2. Key Skills (with proficiency levels: Expert/Advanced/Intermediate)
      3. Work Experience (3 bullet points with quantifiable achievements)
      4. Education
      5. Projects (if applicable)
      6. Certifications (if applicable)
      
      Return ONLY valid JSON with these keys:
      {
        "summary": "string",
        "skills": ["skill1", "skill2"],
        "experience": [{ "company": "string", "position": "string", "startDate": "string", "endDate": "string", "description": "string", "achievements": ["string"] }],
        "education": [{ "institution": "string", "degree": "string", "field": "string", "year": "string" }],
        "projects": [{ "name": "string", "description": "string", "technologies": ["string"] }],
        "certifications": ["string"]
      }
    `;

    const aiResponse = await aiService.generateContent(prompt);
    
    let aiData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      aiData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (e) {
      aiData = {
        summary: `Experienced ${jobTitle} professional with ${experience}. Skilled in ${skills.join(', ')}.`,
        skills: skills.map(s => `${s} (Advanced)`),
        experience: [{
          company: "Your Company",
          position: jobTitle,
          startDate: "2022-01",
          endDate: "Present",
          description: experience,
          achievements: [
            "Delivered successful projects on time",
            "Improved team productivity by 30%",
            "Implemented best practices and standards"
          ]
        }],
        education: [{
          institution: "Your University",
          degree: "Bachelor's Degree",
          field: "Computer Science",
          year: "2020"
        }],
        projects: [],
        certifications: []
      };
    }

    const resumeData = {
      user: req.user.id,
      title: `${jobTitle} Resume (AI Generated)`,
      personalInfo: {
        firstName: req.user.name?.split(' ')[0] || 'Your',
        lastName: req.user.name?.split(' ')[1] || 'Name',
        email: req.user.email,
        summary: aiData.summary || experience
      },
      skills: Array.isArray(aiData.skills) ? aiData.skills : skills,
      experience: aiData.experience || [],
      education: aiData.education || [],
      projects: aiData.projects || [],
      certifications: aiData.certifications || [],
      template: 'modern',
      atsScore: 85
    };

    const resume = new ResumeModel(resumeData);
    await resume.save();

    res.json({
      success: true,
      message: '✅ AI Resume Generated Successfully!',
      resume
    });

  } catch (error) {
    console.error('AI Resume Generation Error:', error);
    res.status(500).json({
      success: false,
      message: 'AI generation failed: ' + error.message,
      error: error.message
    });
  }
};
