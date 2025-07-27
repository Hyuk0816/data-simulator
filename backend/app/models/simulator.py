from sqlalchemy import String, Integer, DateTime, Boolean, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import TYPE_CHECKING
from ..database import Base

if TYPE_CHECKING:
    from .user import User


class Simulator(Base):
    __tablename__ = "simulators"
    
    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Foreign Key - 사용자 참조
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 시뮬레이터 정보
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parameters: Mapped[str] = mapped_column(Text, nullable=False)  # JSON 문자열로 저장
    parameter_config: Mapped[str] = mapped_column(Text, nullable=True, default='{}')  # 파라미터 설정 JSON
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # 타임스탬프
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 관계 설정: Simulator와 User 간의 N:1 관계
    owner: Mapped["User"] = relationship("User", back_populates="simulators")
    
    def __repr__(self) -> str:
        return f"Simulator(id={self.id!r}, name={self.name!r}, user_id={self.user_id!r}, is_active={self.is_active!r})"