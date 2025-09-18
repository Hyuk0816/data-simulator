import os
import sys
import logging
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from .database import engine, Base
from .models import user, simulator, failure_scenario
from .routers import auth, users, simulators, failure_scenarios, failure_analytics
from .utils.schema_updater import auto_update_schema, check_schema_differences

# 더 자세한 로깅 설정
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# 환경변수 로드
load_dotenv()

# DDL Auto 설정에 따른 테이블 생성/업데이트
ddl_auto = os.getenv("DDL_AUTO", "update").lower()  # 기본값을 update로 변경

if ddl_auto == "create":
    # 기존 테이블 삭제 후 재생성
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    logger.info("✅ DDL_AUTO=create: 모든 테이블을 재생성했습니다.")
elif ddl_auto == "update":
    # 스키마 차이점 확인
    differences = check_schema_differences(engine, Base.metadata)
    
    # 차이점 로깅
    if differences['missing_tables']:
        logger.info(f"생성할 테이블: {differences['missing_tables']}")
    if differences['missing_columns']:
        logger.info(f"추가할 컬럼: {differences['missing_columns']}")
    
    # 자동 스키마 업데이트 실행
    auto_update_schema(engine, Base.metadata)
    logger.info("✅ DDL_AUTO=update: 스키마를 자동으로 업데이트했습니다.")
elif ddl_auto == "validate":
    # 스키마 검증만 수행
    differences = check_schema_differences(engine, Base.metadata)
    if differences['missing_tables'] or differences['missing_columns']:
        logger.warning(f"⚠️ 스키마 불일치 감지: {differences}")
    else:
        logger.info("✅ DDL_AUTO=validate: 스키마가 일치합니다.")
elif ddl_auto == "none":
    logger.info("ℹ️ DDL_AUTO=none: 테이블 자동 생성이 비활성화되었습니다.")
else:
    logger.warning(f"⚠️ 알 수 없는 DDL_AUTO 값: {ddl_auto}. 기본값 'update'를 사용합니다.")
    auto_update_schema(engine, Base.metadata)

app = FastAPI(
    title="Dynamic API Simulator",
    description="동적 API 시뮬레이터 웹 애플리케이션",
    version="1.0.0",
    debug=True  # 디버그 모드 활성화
)

# 전역 예외 처리 미들웨어
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        # 자세한 에러 로깅
        logger.error(f"Unhandled exception: {str(e)}")
        logger.error(f"Request path: {request.url.path}")
        logger.error(f"Request method: {request.method}")
        logger.error(f"Full traceback:\n{traceback.format_exc()}")
        
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(e),
                "type": type(e).__name__,
                "traceback": traceback.format_exc() if os.getenv("DEBUG", "false").lower() == "true" else None
            }
        )

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:3001"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(simulators.router)
app.include_router(simulators.data_router)
app.include_router(failure_scenarios.router)
app.include_router(failure_analytics.router)

@app.get("/")
async def root():
    return {"message": "Dynamic API Simulator Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend server is operational"}