from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import user, simulator

# 데이터베이스 테이블 생성
user.Base.metadata.create_all(bind=engine)
simulator.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dynamic API Simulator",
    description="동적 API 시뮬레이터 웹 애플리케이션",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록 (추후 추가)
# app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
# app.include_router(users.router, prefix="/api/users", tags=["users"])
# app.include_router(simulators.router, prefix="/api/simulators", tags=["simulators"])

@app.get("/")
async def root():
    return {"message": "Dynamic API Simulator Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend server is operational"}