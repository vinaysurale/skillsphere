import uuid
from sqlalchemy import String, Text, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class CareerPath(Base):
    __tablename__ = "career_paths"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True, default="")
    avg_salary: Mapped[float] = mapped_column(Float, default=0.0)
    demand_level: Mapped[str] = mapped_column(String(20), default="High")  # Low/Medium/High/Very High
    icon: Mapped[str] = mapped_column(String(10), nullable=True, default="🎯")

    # Relationships
    required_skills = relationship("CareerPathSkill", back_populates="career_path", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description or "",
            "avg_salary": self.avg_salary,
            "demand_level": self.demand_level,
            "icon": self.icon or "🎯",
            "required_skills": [rs.to_dict() for rs in self.required_skills] if self.required_skills else [],
        }


class CareerPathSkill(Base):
    __tablename__ = "career_path_skills"

    career_path_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("career_paths.id", ondelete="CASCADE"), primary_key=True
    )
    skill_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True
    )
    importance: Mapped[str] = mapped_column(String(20), default="Required")  # Required/Recommended/Optional

    # Relationships
    career_path = relationship("CareerPath", back_populates="required_skills")
    skill = relationship("Skill", back_populates="career_paths")

    def to_dict(self):
        return {
            "skill_id": self.skill_id,
            "skill": self.skill.to_dict() if self.skill else None,
            "importance": self.importance,
        }
