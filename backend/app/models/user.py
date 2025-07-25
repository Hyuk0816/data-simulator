from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    user_id = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # 해시 처리된 비밀번호
    
    # 관계 설정: User와 Simulator 간의 1:N 관계
    simulators = relationship("Simulator", back_populates="owner")