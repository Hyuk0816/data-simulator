from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import TYPE_CHECKING, List
from ..database import Base

if TYPE_CHECKING:
    from .simulator import Simulator
    from .failure_scenario import FailureScenario


class User(Base):
    __tablename__ = "users"
    
    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # 사용자 정보
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    user_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)  # 해시 처리된 비밀번호
    
    # 타임스탬프
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 관계 설정: User와 Simulator 간의 1:N 관계
    simulators: Mapped[List["Simulator"]] = relationship("Simulator", back_populates="owner", cascade="all, delete-orphan")
    # 관계 설정: User와 FailureScenario 간의 1:N 관계
    failure_scenarios: Mapped[List["FailureScenario"]] = relationship("FailureScenario", back_populates="owner", cascade="all, delete-orphan")