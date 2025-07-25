from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from dotenv import load_dotenv
import os

# 환경 변수 로드
load_dotenv()

# 데이터베이스 URL 구성
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://simulator-admin:DBpass@localhost:5434/simulator_db")

# SQLAlchemy 엔진 생성
engine = create_engine(DATABASE_URL)

# 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# 베이스 클래스 생성 (SQLAlchemy 2.0 스타일)
class Base(DeclarativeBase):
    pass


# 의존성: 데이터베이스 세션
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()