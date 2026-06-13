import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=True)  # Null for OAuth users
    college: Mapped[str] = mapped_column(String(200), nullable=True, default="")
    degree: Mapped[str] = mapped_column(String(200), nullable=True, default="")
    graduation_year: Mapped[int] = mapped_column(nullable=True)
    career_goal: Mapped[str] = mapped_column(String(200), nullable=True, default="")
    experience_level: Mapped[str] = mapped_column(String(50), nullable=True, default="Beginner")
    auth_provider: Mapped[str] = mapped_column(String(20), default="local")  # 'local' or 'google'
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "college": self.college or "",
            "degree": self.degree or "",
            "graduation_year": self.graduation_year,
            "career_goal": self.career_goal or "",
            "experience_level": self.experience_level or "Beginner",
            "auth_provider": self.auth_provider,
            "avatar_url": self.avatar_url or "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
