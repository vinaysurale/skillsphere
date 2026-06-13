from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.user_skill import UserSkill
from app.models.career_path import CareerPath
from app.models.skill import Skill
from app.routers.auth import get_current_user
from app.services.gap_service import analyze_skill_gap
from app.services.resume_service import parse_and_match_resume

router = APIRouter(prefix="/api/gap-analysis", tags=["Gap Analysis"])


@router.get("/career-paths")
def get_career_paths(db: Session = Depends(get_db)):
    """List all available career paths."""
    paths = db.query(CareerPath).all()
    return {
        "career_paths": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "icon": p.icon,
                "avg_salary": p.avg_salary,
                "demand_level": p.demand_level,
                "required_skills_count": len(p.required_skills),
            }
            for p in paths
        ]
    }


@router.get("/analyze/{career_path_id}")
def analyze_gap(
    career_path_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze skill gaps for a specific career path."""
    career_path = db.query(CareerPath).filter(CareerPath.id == career_path_id).first()
    if not career_path:
        raise HTTPException(status_code=404, detail="Career path not found")

    user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()

    result = analyze_skill_gap(user_skills, career_path)
    return result


@router.get("/analyze-by-goal")
def analyze_by_goal(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze skill gaps based on the user's career goal."""
    if not user.career_goal:
        raise HTTPException(status_code=400, detail="Please set a career goal in your profile first")

    # Find the closest matching career path
    career_path = db.query(CareerPath).filter(
        CareerPath.name.ilike(f"%{user.career_goal}%")
    ).first()

    if not career_path:
        # Try partial match
        paths = db.query(CareerPath).all()
        goal_words = user.career_goal.lower().split()
        best_match = None
        best_score = 0
        for p in paths:
            path_words = p.name.lower().split()
            score = len(set(goal_words) & set(path_words))
            if score > best_score:
                best_score = score
                best_match = p

        if best_match:
            career_path = best_match
        else:
            raise HTTPException(
                status_code=404,
                detail=f"No career path found matching '{user.career_goal}'. Try setting a specific goal."
            )

    user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()
    result = analyze_skill_gap(user_skills, career_path)
    return result


@router.post("/parse-resume")
async def parse_resume(
    career_path_id: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Parse a PDF resume and match it against required career path skills."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    career_path = db.query(CareerPath).filter(CareerPath.id == career_path_id).first()
    if not career_path:
        raise HTTPException(status_code=404, detail="Career path not found")
        
    # Read file bytes
    try:
        content = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read uploaded file")
        
    target_skills = [rs.skill.name for rs in career_path.required_skills if rs.skill]
    
    try:
        match_results = await parse_and_match_resume(content, target_skills)
        return match_results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/onboard")
async def onboard_user(
    career_path_id: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Onboard a new user by uploading a resume and selecting a target career path."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    career_path = db.query(CareerPath).filter(CareerPath.id == career_path_id).first()
    if not career_path:
        raise HTTPException(status_code=404, detail="Career path not found")
        
    try:
        content = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read uploaded file")
        
    target_skills = [rs.skill.name for rs in career_path.required_skills if rs.skill]
    
    try:
        match_results = await parse_and_match_resume(content, target_skills)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # Set user's career goal
    user.career_goal = career_path.name
    
    skills_added = []
    
    # Save matched skills (Default proficiency 70%)
    for skill_name in match_results.get("matched_skills", []):
        skill = db.query(Skill).filter(Skill.name.ilike(skill_name)).first()
        if skill:
            existing = db.query(UserSkill).filter(
                UserSkill.user_id == user.id,
                UserSkill.skill_id == skill.id
            ).first()
            if not existing:
                user_skill = UserSkill(
                    user_id=user.id,
                    skill_id=skill.id,
                    proficiency=70.0,
                    verified=True
                )
                db.add(user_skill)
                skills_added.append(skill.name)
                
    # Save other skills (Default proficiency 50%)
    for skill_name in match_results.get("other_skills", []):
        skill = db.query(Skill).filter(Skill.name.ilike(skill_name)).first()
        if skill:
            existing = db.query(UserSkill).filter(
                UserSkill.user_id == user.id,
                UserSkill.skill_id == skill.id
            ).first()
            if not existing:
                user_skill = UserSkill(
                    user_id=user.id,
                    skill_id=skill.id,
                    proficiency=50.0,
                    verified=True
                )
                db.add(user_skill)
                skills_added.append(skill.name)
                
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Onboarding completed successfully!",
        "career_goal": user.career_goal,
        "skills_added": skills_added,
        "match_percentage": match_results.get("match_percentage", 0),
        "strengths": match_results.get("strengths", []),
        "resume_summary": match_results.get("resume_summary", "")
    }


STUDY_PRESETS = {
    "python": {
        "materials": [
            {"title": "Python for Beginners (Full Course)", "type": "Video", "url": "https://www.youtube.com/watch?v=eWRfhZUzrEs", "duration": "6 hours", "difficulty": "Beginner"},
            {"title": "Official Python Tutorial", "type": "Documentation", "url": "https://docs.python.org/3/tutorial/", "duration": "Self-paced", "difficulty": "Beginner"},
            {"title": "Automate the Boring Stuff with Python", "type": "Book", "url": "https://automatetheboringstuff.com/", "duration": "20 hours", "difficulty": "Intermediate"}
        ],
        "flashcards": [
            {"question": "What is the difference between list and tuple in Python?", "answer": "Lists are mutable (can be changed) and defined with square brackets `[]`, while tuples are immutable (cannot be changed) and defined with parentheses `()`."},
            {"question": "What is a list comprehension?", "answer": "A concise way to create lists in Python. Example: `[x**2 for x in range(5)]` creates `[0, 1, 4, 9, 16]`."},
            {"question": "What does __init__ do in Python classes?", "answer": "It is the constructor method initialized automatically when a new instance of the class is created, used to set initial attributes."}
        ]
    },
    "sql": {
        "materials": [
            {"title": "SQL Tutorial - Full Database Course", "type": "Video", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "duration": "4 hours", "difficulty": "Beginner"},
            {"title": "SQLZoo Interactive Exercises", "type": "Tutorial", "url": "https://sqlzoo.net/", "duration": "10 hours", "difficulty": "Beginner"},
            {"title": "Mode Analytics SQL Tutorial", "type": "Tutorial", "url": "https://mode.com/sql-tutorial/", "duration": "15 hours", "difficulty": "Intermediate"}
        ],
        "flashcards": [
            {"question": "What is the difference between WHERE and HAVING?", "answer": "WHERE filters rows before any groupings are made, while HAVING filters group rows after the GROUP BY clause has been applied."},
            {"question": "What is a LEFT JOIN?", "answer": "A LEFT JOIN returns all records from the left table, and the matched records from the right table. If there is no match, it returns NULL for the right table columns."},
            {"question": "What is database normalization?", "answer": "The process of organizing data in a database to reduce redundancy and improve data integrity by splitting tables and defining relationships."}
        ]
    },
    "docker": {
        "materials": [
            {"title": "Docker Tutorial for Beginners", "type": "Video", "url": "https://www.youtube.com/watch?v=pTFZFxd4hOI", "duration": "2 hours", "difficulty": "Beginner"},
            {"title": "Docker Labs & Playgrounds", "type": "Tutorial", "url": "https://labs.play-with-docker.com/", "duration": "Self-paced", "difficulty": "Intermediate"},
            {"title": "Official Docker Get Started Guide", "type": "Documentation", "url": "https://docs.docker.com/get-started/", "duration": "3 hours", "difficulty": "Beginner"}
        ],
        "flashcards": [
            {"question": "What is the difference between an Image and a Container?", "answer": "An Image is a read-only template containing instructions for creating a container. A Container is a runnable, isolated instance of that image."},
            {"question": "What does the EXPOSE command do in a Dockerfile?", "answer": "It serves as documentation to tell users which ports the container intends to listen on at runtime. It does not actually publish the port."},
            {"question": "What is a Docker Volume?", "answer": "A mechanism for persisting data generated and used by Docker containers, mapping a directory inside the container to the host machine."}
        ]
    },
    "kubernetes": {
        "materials": [
            {"title": "Kubernetes Tutorial for Beginners", "type": "Video", "url": "https://www.youtube.com/watch?v=X48VuDVv0do", "duration": "3 hours", "difficulty": "Beginner"},
            {"title": "Interactive Kubernetes Scenarios", "type": "Tutorial", "url": "https://killercoda.com/playgrounds", "duration": "Self-paced", "difficulty": "Intermediate"},
            {"title": "Kubernetes Documentation Basics", "type": "Documentation", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "duration": "4 hours", "difficulty": "Beginner"}
        ],
        "flashcards": [
            {"question": "What is a Pod in Kubernetes?", "answer": "The smallest deployable unit in Kubernetes, representing a single instance of a running process and containing one or more tightly coupled containers."},
            {"question": "What is the role of the Kubelet?", "answer": "An agent running on each node in the cluster that ensures containers are running in a Pod as expected by communicating with the control plane."},
            {"question": "What is a Service in Kubernetes?", "answer": "An abstraction that defines a logical set of Pods and a policy to access them, providing a stable IP address and DNS name for load balancing."}
        ]
    },
    "aws": {
        "materials": [
            {"title": "AWS Certified Cloud Practitioner Training", "type": "Video", "url": "https://www.youtube.com/watch?v=SOTamWGuDKc", "duration": "13 hours", "difficulty": "Beginner"},
            {"title": "AWS Hands-On Tutorials", "type": "Tutorial", "url": "https://aws.amazon.com/getting-started/hands-on/", "duration": "Self-paced", "difficulty": "Intermediate"}
        ],
        "flashcards": [
            {"question": "What is EC2?", "answer": "Elastic Compute Cloud: secure and resizable virtual servers (compute capacity) in the AWS cloud."},
            {"question": "What is the difference between S3 and EBS?", "answer": "S3 is object storage accessible via the web, ideal for files and static assets. EBS is block storage mounted directly to EC2 instances, ideal for databases and operating systems."},
            {"question": "What is IAM in AWS?", "answer": "Identity and Access Management: a service to securely control user and group access to AWS resources and services."}
        ]
    }
}


@router.get("/study-materials/{skill_id}")
def get_study_materials(
    skill_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve study materials and flashcards for a specific skill."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
        
    skill_key = skill.name.lower()
    
    # Check if we have preset study guide
    if skill_key in STUDY_PRESETS:
        data = STUDY_PRESETS[skill_key]
    else:
        # Generate generic fallbacks
        data = {
            "materials": [
                {
                    "title": f"Getting Started with {skill.name}",
                    "type": "Tutorial",
                    "url": f"https://www.google.com/search?q={skill.name}+tutorial+guide",
                    "duration": "1-2 hours",
                    "difficulty": "Beginner"
                },
                {
                    "title": f"Mastering {skill.name} in Production",
                    "type": "Video",
                    "url": f"https://www.youtube.com/results?search_query={skill.name}+crash+course",
                    "duration": "3 hours",
                    "difficulty": "Intermediate"
                }
            ],
            "flashcards": [
                {
                    "question": f"What is the primary purpose of {skill.name}?",
                    "answer": f"{skill.description or 'It is a key technology used to build and scale applications.'}"
                },
                {
                    "question": f"Why is {skill.name} highly valued in the industry?",
                    "answer": f"It has a high market demand score of {skill.demand_score or 50}/100 and opens up many technical roles."
                }
            ]
        }
        
    return {
        "skill": skill.to_dict(),
        "materials": data["materials"],
        "flashcards": data["flashcards"]
    }



