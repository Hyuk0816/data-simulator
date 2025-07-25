import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .database import engine, Base
from .models import user, simulator
from .routers import auth, users

# 환경변수 로드
load_dotenv()

# DDL Auto 설정에 따른 테이블 생성/업데이트
ddl_auto = os.getenv("DDL_AUTO", "none").lower()

if ddl_auto == "create":
    # 기존 테이블 삭제 후 재생성
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ DDL_AUTO=create: 모든 테이블을 재생성했습니다.")
elif ddl_auto == "update":
    # 테이블이 없으면 생성 (기존 데이터 유지)
    Base.metadata.create_all(bind=engine)
    print("✅ DDL_AUTO=update: 필요한 테이블을 생성/업데이트했습니다.")
elif ddl_auto == "none":
    print("ℹ️ DDL_AUTO=none: 테이블 자동 생성이 비활성화되었습니다.")
else:
    print(f"⚠️ 알 수 없는 DDL_AUTO 값: {ddl_auto}. 기본값 'none'을 사용합니다.")

app = FastAPI(
    title="Dynamic API Simulator",
    description="동적 API 시뮬레이터 웹 애플리케이션",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(users.router)
# app.include_router(simulators.router, prefix="/api/simulators", tags=["simulators"])

@app.get("/")
async def root():
    return {"message": "Dynamic API Simulator Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend server is operational"}