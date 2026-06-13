from datetime import datetime
from sqlalchemy import String, Float, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class UserSkill(Base):
    __tablename__ = "user_skills"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    skill_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True
    )
    proficiency: Mapped[float] = mapped_column(Float, default=50.0)  # 0-100
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    added_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="skills")
    skill = relationship("Skill", back_populates="users")

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "skill_id": self.skill_id,
            "proficiency": self.proficiency,
            "verified": self.verified,
            "skill": self.skill.to_dict() if self.skill else None,
            "added_at": self.added_at.isoformat() if self.added_at else None,
        }
