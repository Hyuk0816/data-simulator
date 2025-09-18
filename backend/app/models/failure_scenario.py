from sqlalchemy import String, Integer, DateTime, Boolean, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import TYPE_CHECKING
from ..database import Base

if TYPE_CHECKING:
    from .user import User
    from .simulator import Simulator


class FailureScenario(Base):
    __tablename__ = "failure_scenarios"
    
    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    simulator_id: Mapped[int] = mapped_column(Integer, ForeignKey("simulators.id"), nullable=True)
    
    # 시나리오 정보
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    
    # 고장 시 반환될 파라미터 값들 (JSON)
    # 예: {"temperature": 999, "pressure": -100, "status": "ERROR"}
    failure_parameters: Mapped[str] = mapped_column(Text, nullable=False)
    
    # 고급 고장 설정 (JSON) - NumPy 엔진용
    # 확률적 고장, 시간 기반 패턴, 노이즈 등
    advanced_config: Mapped[str] = mapped_column(Text, nullable=True)
    
    # 상태
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_applied: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # 타임스탬프
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    applied_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    # 관계 설정
    owner: Mapped["User"] = relationship("User", back_populates="failure_scenarios", foreign_keys=[user_id])
    simulator: Mapped["Simulator"] = relationship("Simulator", back_populates="failure_scenarios", foreign_keys=[simulator_id])
    
    def __repr__(self) -> str:
        return f"FailureScenario(id={self.id!r}, name={self.name!r}, simulator_id={self.simulator_id!r}, is_applied={self.is_applied!r})"