# Dynamic API Simulator

동적 API 시뮬레이터는 웹 UI를 통해 동적으로 파라미터와 값을 설정하면, 해당 데이터를 고유한 API 엔드포인트로 즉시 생성해주는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **사용자 인증**: JWT 기반 회원가입/로그인
- **시뮬레이터 관리**: CRUD 작업 및 파라미터 동적 설정
- **동적 API 생성**: 각 시뮬레이터마다 고유한 API 엔드포인트 자동 생성
- **랜덤 값 생성**: 파라미터별 랜덤 범위 설정
- **CSV/Excel 업로드**: 파일 업로드를 통한 파라미터 자동 생성
- **대시보드**: 시뮬레이터 목록 관리 및 상태 제어

## 🛠 기술 스택

- **Backend**: Python 3.11, FastAPI, PostgreSQL, SQLAlchemy
- **Frontend**: React 19, Material-UI, Vite
- **Deployment**: Docker, Docker Compose

## 📦 Docker를 사용한 배포

### 1. 사전 요구사항

- Docker 20.10 이상
- Docker Compose 2.0 이상

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 설정합니다:

```bash
# Database Configuration
DB_USER=simulator-admin
DB_PASSWORD=your-secure-password
DB_NAME=simulator_db
DB_PORT=5434

# Backend Configuration
SECRET_KEY=your-very-secure-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000
```

### 3. Docker Compose 실행

```bash
# 서비스 빌드 및 실행
docker-compose up --build

# 백그라운드에서 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down

# 볼륨까지 함께 삭제
docker-compose down -v
```

### 4. 서비스 접속

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 🔧 개발 환경 설정

### Backend 개발

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend 개발

```bash
cd frontend
npm install
npm run dev
```

## 📝 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 시뮬레이터
- `POST /api/simulators/` - 시뮬레이터 생성
- `GET /api/simulators/` - 시뮬레이터 목록 조회
- `PUT /api/simulators/{id}` - 시뮬레이터 수정
- `DELETE /api/simulators/{id}` - 시뮬레이터 삭제
- `PATCH /api/simulators/{id}/toggle` - 활성화 상태 토글
- `POST /api/simulators/upload` - CSV/Excel 파일 업로드

### 동적 API
- `GET /api/data/{user_id}/{simulator_name}` - 시뮬레이터 데이터 조회

## 🐳 Docker 구성

### 서비스 구조

- **dynamic-simulator-db**: PostgreSQL 15 데이터베이스
- **dynamic-simulator-backend**: FastAPI 백엔드 서버
- **dynamic-simulator-frontend**: React 프론트엔드 서버 (Nginx)

### 네트워크

모든 서비스는 `dynamic-simulator-network` 브리지 네트워크를 통해 통신합니다.

### 볼륨

PostgreSQL 데이터는 `dynamic-simulator-postgres-data` 볼륨에 영구 저장됩니다.

## 📄 라이센스

MIT License

## 👥 기여

이슈 및 PR은 언제든 환영합니다!