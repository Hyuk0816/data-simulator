from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class Simulator(Base):
    __tablename__ = "simulators"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    parameters = Column(Text, nullable=False)  # JSON 문자열로 저장
    is_active = Column(Boolean, default=True, nullable=False)
    
    # 관계 설정: Simulator와 User 간의 N:1 관계
    owner = relationship("User", back_populates="simulators")