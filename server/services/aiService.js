const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Analyze and tailor resume
exports.analyzeResume = async (resumeData, jobDescription) => {
  try {
    // Extract relevant information from resume
    const resumeInfo = {
      summary: resumeData.personalInfo?.summary || '',
      experience: resumeData.experience || [],
      education: resumeData.education || [],
      skills: resumeData.skills || [],
      projects: resumeData.projects || []
    };

    const prompt = `
      You are an expert resume optimizer and ATS specialist.
      
      RESUME DATA:
      ${JSON.stringify(resumeInfo, null, 2)}
      
      JOB DESCRIPTION:
      ${jobDescription}
      
      Please analyze this resume against the job description and provide:
      1. An ATS compatibility score (0-100)
      2. A list of important keywords from the JD that are missing in the resume
      3. Specific suggestions for improving bullet points (up to 3 suggestions)
      4. A rewritten professional summary tailored to this job
      5. Skills to add or highlight
      
      Return ONLY valid JSON with these fields:
      {
        "atsScore": number,
        "missingKeywords": [string],
        "improvementSuggestions": [string],
        "tailoredSummary": string,
        "suggestedSkills": [string]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      atsScore: 0,
      missingKeywords: [],
      improvementSuggestions: ['Could not analyze resume'],
      tailoredSummary: '',
      suggestedSkills: []
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      atsScore: 0,
      missingKeywords: [],
      improvementSuggestions: ['Error analyzing resume with AI'],
      tailoredSummary: '',
      suggestedSkills: []
    };
  }
};

// Generate general content with AI
exports.generateContent = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};
