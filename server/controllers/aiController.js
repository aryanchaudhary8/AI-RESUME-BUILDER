console.log("MODEL:", process.env.OPENAI_MODEL)
console.log("KEY:", !!process.env.OPENAI_API_KEY)
import ai from "../configs/ai.js"
import Resume from "../models/Resume.js"


// ===============================
// Enhance Professional Summary
// ===============================
export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body

    if (!userContent) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume writer. Enhance the professional summary in 1-2 ATS-friendly sentences. Return text only."
        },
        {
          role: "user",
          content: userContent
        }
      ]
    })

    const enhancedContent = response.choices[0].message.content
    return res.status(200).json({ enhancedContent })
  } catch (error) {
    console.error("SUMMARY ERROR:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}


// ===============================
// Enhance Job Description
// ===============================
export const enhanceJobDescription = async (req, res) => {
  try {
    const { userContent } = req.body

    if (!userContent) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Enhance the job description in 1-2 concise ATS-friendly sentences. Use action verbs. Return text only."
        },
        {
          role: "user",
          content: userContent
        }
      ]
    })

    const enhancedContent = response.choices[0].message.content
    return res.status(200).json({ enhancedContent })
  } catch (error) {
    console.error("JOB DESC ERROR:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}


// ===============================
// Upload Resume & Extract Data
// ===============================
export const uploadResumeInDB = async (req, res) => {
  try {
    const { resumeText, title } = req.body
    const userId = req.userId

    if (!resumeText || !userId) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `
Extract resume data and return ONLY valid JSON using EXACTLY this schema:

{
  "professional_summary": "string",
  "skills": ["string"],
  "personal_info": {
    "full_name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "website": "string"
  },
  "experience": [
    {
      "company": "string",
      "position": "string",
      "start_date": "string",
      "end_date": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "end_date": "string",
      "gpa": "string"
    }
  ],
  "project": [
    {
      "name": "string",
      "description": "string"
    }
  ]
}

Rules:
- Use empty strings or empty arrays if data is missing
- No markdown
- No explanations
- JSON only
          `
        },
        {
          role: "user",
          content: resumeText
        }
      ]
    })

    let raw = response.choices[0].message.content

    // 🧹 Clean AI output
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim()
    raw = raw.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]")

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      console.error("❌ AI RAW OUTPUT:", raw)
      return res.status(500).json({ message: "AI returned malformed JSON" })
    }

    // 🛡️ Defensive fixes
    if (typeof parsed.skills === "string") {
      parsed.skills = parsed.skills.split(",").map(s => s.trim())
    }

    if (!parsed.professional_summary && parsed.summary) {
      parsed.professional_summary = parsed.summary
    }

    if (!parsed.personal_info) {
      parsed.personal_info = {}
    }

    if (!parsed.personal_info.full_name && parsed.name) {
      parsed.personal_info.full_name = parsed.name
    }

    // 🧠 Normalize structure
    const normalizedData = {
      professional_summary: parsed.professional_summary || "",

      skills: Array.isArray(parsed.skills) ? parsed.skills : [],

      personal_info: {
        full_name: parsed.personal_info.full_name || "",
        email: parsed.personal_info.email || "",
        phone: parsed.personal_info.phone || "",
        location: parsed.personal_info.location || "",
        linkedin: parsed.personal_info.linkedin || "",
        website: parsed.personal_info.website || "",
        image: ""
      },

      experience: Array.isArray(parsed.experience)
        ? parsed.experience.map(exp => ({
            company: exp.company || "",
            position: exp.position || exp.title || "",
            start_date: exp.start_date || "",
            end_date: exp.end_date || "",
            description: exp.description || "",
            is_current: false
          }))
        : [],

      education: Array.isArray(parsed.education)
        ? parsed.education.map(ed => ({
            institution: ed.institution || "",
            degree: ed.degree || "",
            field: ed.field || "",
            graduation_date: ed.end_date || "",
            gpa: ed.gpa || ""
          }))
        : [],

      project: Array.isArray(parsed.project)
        ? parsed.project.map(p => ({
            name: p.name || "",
            type: "",
            description: p.description || ""
          }))
        : []
    }

    // 💾 Save resume
    const newResume = await Resume.create({
      userId,
      title,
      ...normalizedData
    })

    return res.status(200).json({ resumeId: newResume._id })
  } catch (error) {
    console.error("UPLOAD RESUME ERROR:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
