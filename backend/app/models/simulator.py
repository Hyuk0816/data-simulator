from sqlalchemy import String, Integer, DateTime, Boolean, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from ..database import Base


class Simulator(Base):
    __tablename__ = "simulators"
    
    # Primary Key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Foreign Key - 사용자 참조
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 시뮬레이터 정보
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parameters: Mapped[str] = mapped_column(Text, nullable=False)  # JSON 문자열로 저장
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # 타임스탬프
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 관계 설정: Simulator와 User 간의 N:1 관계
    owner: Mapped["User"] = relationship("User", back_populates="simulators")