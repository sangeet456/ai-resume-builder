const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    default: 'My Resume'
  },
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    linkedin: String,
    portfolio: String,
    summary: String
  },
  experience: [{
    company: String,
    position: String,
    startDate: String,
    endDate: String,
    current: Boolean,
    description: String,
    bulletPoints: [String]
  }],
  education: [{
    institution: String,
    degree: String,
    field: String,
    startDate: String,
    endDate: String,
    gpa: String
  }],
  skills: [String],
  certifications: [String],
  projects: [{
    name: String,
    description: String,
    technologies: [String],
    link: String
  }],
  template: {
    type: String,
    enum: ['modern', 'professional', 'minimal'],
    default: 'modern'
  },
  atsScore: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', ResumeSchema);
