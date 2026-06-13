import io
import json
import logging
from pypdf import PdfReader
from app.config import settings
import google.generativeai as genai

logger = logging.getLogger(__name__)

# List of standard skills to look for in keyword fallback
STANDARDIZED_SKILLS = [
    "Python", "TensorFlow", "SQL", "Docker", "AWS", "MLOps", "Git", "Kubernetes",
    "Java", "JavaScript", "TypeScript", "HTML", "CSS", "C++", "Go", "Rust",
    "PyTorch", "FastAPI", "React", "Node.js", "Tableau", "Spark", "Terraform",
    "CI/CD", "Machine Learning", "Deep Learning", "Data Science", "Cloud Architecture"
]

def _get_model():
    if not settings.GEMINI_API_KEY:
        return None
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel("gemini-1.5-flash")

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts raw text from a PDF file using pypdf."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error reading PDF: {e}")
        raise ValueError("Failed to extract text from PDF resume")

async def parse_and_match_resume(pdf_bytes: bytes, target_skills: list[str]) -> dict:
    """
    Parses the resume PDF and matches extracted skills against the target career path's skills.
    Uses Gemini if API key is present; otherwise falls back to rule-based keyword matching.
    """
    text = extract_text_from_pdf(pdf_bytes)
    
    model = _get_model()
    if model:
        try:
            prompt = f"""
            You are an expert resume parsing AI. Read the extracted text from a candidate's resume below.
            Identify all skills matching the following database skills list, or similar skills: {", ".join(target_skills)}.
            Also identify other general technical skills present in the resume.
            
            Resume Text:
            \"\"\"{text[:4000]}\"\"\"
            
            Respond ONLY in valid JSON format with this exact structure:
            {{
              "matched_skills": ["skill1", "skill2"],
              "other_skills": ["skillA", "skillB"],
              "strengths": ["1-sentence description of key strength"],
              "resume_summary": "Brief 2-3 sentence assessment of the candidate's experience level and fit"
            }}
            """
            response = model.generate_content(prompt)
            result = _parse_gemini_json(response.text)
            return _format_match_results(result, target_skills)
        except Exception as e:
            logger.error(f"Gemini resume parsing error: {e}")
            # Fall back to rule-based
            
    # Rule-based fallback
    return _rule_based_resume_match(text, target_skills)

def _parse_gemini_json(text: str) -> dict:
    try:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        return json.loads(cleaned)
    except Exception:
        return {
            "matched_skills": [],
            "other_skills": [],
            "strengths": [],
            "resume_summary": "Parsed using keyword matching due to AI service issue."
        }

def _rule_based_resume_match(text: str, target_skills: list[str]) -> dict:
    text_lower = text.lower()
    matched = []
    
    # 1. Match against target career path skills
    for skill in target_skills:
        # Check case-insensitive keyword match (with word boundaries where possible)
        if skill.lower() in text_lower:
            matched.append(skill)
            
    # 2. Match other common skills not in target list
    other = []
    for skill in STANDARDIZED_SKILLS:
        if skill not in target_skills and skill.lower() in text_lower:
            other.append(skill)
            
    # Formulate strengths
    strengths = []
    if len(matched) >= 3:
        strengths.append(f"Strong alignment with target career requirements, possessing {len(matched)} key skills.")
    elif len(matched) > 0:
        strengths.append(f"Has foundational skills like {', '.join(matched[:2])} matching the target role.")
    else:
        strengths.append("Found general technical skills, but direct role-specific skills need development.")
        
    summary = f"Parsed resume via keyword scanner. Found {len(matched)} out of {len(target_skills)} target skills."
    
    result = {
        "matched_skills": matched,
        "other_skills": other,
        "strengths": strengths,
        "resume_summary": summary
    }
    return _format_match_results(result, target_skills)

def _format_match_results(parsed_result: dict, target_skills: list[str]) -> dict:
    matched = [s for s in parsed_result.get("matched_skills", []) if s in target_skills]
    missing = [s for s in target_skills if s not in matched]
    
    total = len(target_skills)
    match_count = len(matched)
    match_percentage = round((match_count / total * 100)) if total > 0 else 0
    
    return {
        "match_percentage": match_percentage,
        "matched_skills": matched,
        "missing_skills": missing,
        "other_skills": parsed_result.get("other_skills", []),
        "strengths": parsed_result.get("strengths", []),
        "resume_summary": parsed_result.get("resume_summary", "Resume matched successfully.")
    }
