import uuid
from sqlalchemy import String, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    demand_score: Mapped[float] = mapped_column(Float, default=50.0)
    growth_score: Mapped[float] = mapped_column(Float, default=50.0)
    avg_salary: Mapped[float] = mapped_column(Float, default=0.0)
    description: Mapped[str] = mapped_column(Text, nullable=True, default="")
    icon: Mapped[str] = mapped_column(String(10), nullable=True, default="💡")

    # Relationships
    users = relationship("UserSkill", back_populates="skill")
    career_paths = relationship("CareerPathSkill", back_populates="skill")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "demand_score": self.demand_score,
            "growth_score": self.growth_score,
            "avg_salary": self.avg_salary,
            "description": self.description or "",
            "icon": self.icon or "💡",
        }
