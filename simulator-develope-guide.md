# 동적 API 시뮬레이터 웹 애플리케이션 개발 가이드

## 개발 방법론
기능별로 **백엔드 → 프론트엔드 → 유저 테스트 → 피드백 → 수정** 순서로 개발을 진행합니다.

## 📋 개발 진행 상황 추적
모든 개발 진행 상황은 `develop-work-report.md` 파일에 기록됩니다.

### 기록 형식
```
[기능명] 개발 시작 - YYYY.MM.DD HH:MM
[기능명] 백엔드 개발 완료 - YYYY.MM.DD HH:MM
[기능명] 프론트엔드 개발 완료 - YYYY.MM.DD HH:MM
[기능명] 디자인 완료 - YYYY.MM.DD HH:MM
[기능명] 유저 테스트 완료 - YYYY.MM.DD HH:MM

-- 에러 발생 시 --
[기능명] [에러 내용] 발생 - YYYY.MM.DD HH:MM
[기능명] [해결책 적용] - YYYY.MM.DD HH:MM
[기능명] 유저 피드백을 받아 해결 확인 - YYYY.MM.DD HH:MM ✅
```

---

## 🏗️ 프로젝트 구조 설정

### Phase 0: 프로젝트 초기 설정
**목표**: 개발 환경 구축 및 기본 프로젝트 구조 생성

#### 백엔드 설정 (Python/FastAPI)
```bash
# 백엔드 디렉토리 생성 및 가상환경 설정
mkdir backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

**requirements.txt 생성**:
```
fastapi
uvicorn
sqlalchemy
psycopg2-binary
pydantic
python-jose
passlib
bcrypt
python-multipart
alembic
```

**기본 프로젝트 구조**:
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── simulator.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── simulator.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   └── simulators.py
│   └── utils/
│       ├── __init__.py
│       ├── auth.py
│       └── security.py
├── alembic/
├── requirements.txt
└── .env
```

#### 프론트엔드 설정 (React)
```bash
# 프론트엔드 디렉토리 생성
npx create-react-app frontend
cd frontend
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install axios react-router-dom
```

**기본 프로젝트 구조**:
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── auth/
│   │   └── simulator/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Dashboard.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   └── App.jsx
├── public/
└── package.json
```

## 🎯 프론트엔드 개발 유의사항

### 파일 확장자 규칙
- **`.js` 파일**: 순수 JavaScript 파일 (유틸리티, 서비스, 설정 파일)에만 사용
- **`.jsx` 파일**: React 컴포넌트 (JSX 문법 포함) 파일에만 사용

### JSX 문법 규칙
- **JSX 문법 금지**: `.js` 파일에서는 JSX 문법을 절대 사용하지 않음
- **JSX 문법 허용**: `.jsx` 파일에서만 JSX 문법 사용 가능
- **컴포넌트 생성**: 모든 React 컴포넌트는 `.jsx` 확장자로 생성

### 예시
```
✅ 올바른 사용:
- components/auth/Login.jsx (JSX 문법 포함)
- services/api.js (순수 JavaScript, JSX 없음)
- utils/helpers.js (순수 JavaScript, JSX 없음)

❌ 잘못된 사용:
- components/auth/Login.js (JSX 문법 포함하면 안됨)
- services/api.jsx (JSX 문법이 없는데 .jsx 사용)
```

---

## 🔐 Phase 1: 사용자 인증 시스템

### 1.1 백엔드 개발

#### 데이터베이스 모델 (models/user.py)
```python
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    user_id = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
```

#### 스키마 정의 (schemas/user.py)
```python
from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    user_id: str
    password: str
    password_confirm: str

class UserLogin(BaseModel):
    user_id: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    user_id: str
    
    class Config:
        from_attributes = True
```

#### 인증 라우터 (routers/auth.py)
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.user import UserCreate, UserLogin, UserResponse
from ..utils.auth import create_access_token, verify_password, get_password_hash

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # 회원가입 로직
    pass

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    # 로그인 로직
    pass
```

**개발 진행 기록**:
```
사용자 인증 시스템 개발 시작 - [시작 시간 기록]
사용자 인증 시스템 백엔드 개발 완료 - [완료 시간 기록]
```

### 1.2 프론트엔드 개발

#### 로그인 컴포넌트 (components/auth/Login.jsx)
```jsx
import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import axios from 'axios';

const Login = () => {
    const [formData, setFormData] = useState({
        user_id: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/auth/login', formData);
            // 로그인 성공 처리
        } catch (error) {
            // 에러 처리
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
                로그인
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="사용자 ID"
                    value={formData.user_id}
                    onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                    margin="normal"
                    required
                />
                <TextField
                    fullWidth
                    label="비밀번호"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    margin="normal"
                    required
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >
                    로그인
                </Button>
            </Box>
        </Paper>
    );
};

export default Login;
```

#### 회원가입 컴포넌트 (components/auth/Register.jsx)
```jsx
import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        user_id: '',
        password: '',
        password_confirm: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        
        try {
            const response = await axios.post('/api/auth/register', formData);
            // 회원가입 성공 처리
        } catch (error) {
            // 에러 처리
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
                회원가입
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="사용자 이름"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    margin="normal"
                    required
                />
                <TextField
                    fullWidth
                    label="사용자 ID"
                    value={formData.user_id}
                    onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                    margin="normal"
                    required
                />
                <TextField
                    fullWidth
                    label="비밀번호"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    margin="normal"
                    required
                />
                <TextField
                    fullWidth
                    label="비밀번호 확인"
                    type="password"
                    value={formData.password_confirm}
                    onChange={(e) => setFormData({...formData, password_confirm: e.target.value})}
                    margin="normal"
                    required
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >
                    회원가입
                </Button>
            </Box>
        </Paper>
    );
};

export default Register;
```

**개발 진행 기록**:
```
사용자 인증 시스템 프론트엔드 개발 완료 - [완료 시간 기록]
사용자 인증 시스템 디자인 완료 - [완료 시간 기록]
```

### 1.3 유저 테스트 & 피드백
- 회원가입 폼 테스트
- 로그인 기능 테스트
- 에러 처리 확인
- UI/UX 개선사항 수집

**개발 진행 기록**:
```
사용자 인증 시스템 유저 테스트 완료 - [완료 시간 기록]
```

---

## 🎛️ Phase 2: 시뮬레이터 관리 시스템

### 2.1 백엔드 개발

#### 시뮬레이터 모델 (models/simulator.py)
```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from .user import Base

class Simulator(Base):
    __tablename__ = "simulators"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    parameters = Column(Text, nullable=False)  # JSON 문자열
    is_active = Column(Boolean, default=True, nullable=False)
    
    owner = relationship("User", back_populates="simulators")
```

#### 시뮬레이터 스키마 (schemas/simulator.py)
```python
from pydantic import BaseModel
from typing import Dict, Any

class SimulatorCreate(BaseModel):
    name: str
    parameters: Dict[str, Any]

class SimulatorUpdate(BaseModel):
    name: str = None
    parameters: Dict[str, Any] = None
    is_active: bool = None

class SimulatorResponse(BaseModel):
    id: int
    name: str
    parameters: Dict[str, Any]
    is_active: bool
    
    class Config:
        from_attributes = True
```

#### 시뮬레이터 라우터 (routers/simulators.py)
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.simulator import SimulatorCreate, SimulatorResponse
from ..utils.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=SimulatorResponse)
def create_simulator(simulator: SimulatorCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 시뮬레이터 생성 로직
    pass

@router.get("/", response_model=List[SimulatorResponse])
def get_simulators(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 사용자의 시뮬레이터 목록 조회 로직
    pass

@router.get("/{user_id}-{simulator_name}")
def get_simulator_data(user_id: str, simulator_name: str, db: Session = Depends(get_db)):
    # 시뮬레이터 API 데이터 반환 로직
    pass

@router.put("/{simulator_id}", response_model=SimulatorResponse)
def update_simulator(simulator_id: int, simulator: SimulatorUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 시뮬레이터 업데이트 로직
    pass
```

**개발 진행 기록**:
```
시뮬레이터 관리 시스템 개발 시작 - [시작 시간 기록]
시뮬레이터 관리 시스템 백엔드 개발 완료 - [완료 시간 기록]
```

### 2.2 프론트엔드 개발

#### 시뮬레이터 생성 컴포넌트 (components/simulator/CreateSimulator.jsx)
```jsx
import React, { useState } from 'react';
import { 
    Box, 
    TextField, 
    Button, 
    Typography, 
    Paper, 
    IconButton,
    Grid
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import axios from 'axios';

const CreateSimulator = () => {
    const [name, setName] = useState('');
    const [parameters, setParameters] = useState([{ key: '', value: '' }]);

    const addParameter = () => {
        setParameters([...parameters, { key: '', value: '' }]);
    };

    const removeParameter = (index) => {
        setParameters(parameters.filter((_, i) => i !== index));
    };

    const updateParameter = (index, field, value) => {
        const updated = [...parameters];
        updated[index][field] = value;
        setParameters(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const parameterObj = {};
        parameters.forEach(param => {
            if (param.key && param.value) {
                parameterObj[param.key] = param.value;
            }
        });

        try {
            await axios.post('/api/simulators', {
                name,
                parameters: parameterObj
            });
            // 성공 처리
        } catch (error) {
            // 에러 처리
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" component="h2" gutterBottom>
                시뮬레이터 생성
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="시뮬레이터 이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    margin="normal"
                    required
                />
                
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                    파라미터 설정
                </Typography>
                
                {parameters.map((param, index) => (
                    <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                        <Grid item xs={5}>
                            <TextField
                                fullWidth
                                label="Key"
                                value={param.key}
                                onChange={(e) => updateParameter(index, 'key', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={5}>
                            <TextField
                                fullWidth
                                label="Value"
                                value={param.value}
                                onChange={(e) => updateParameter(index, 'value', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={2}>
                            <IconButton 
                                onClick={() => removeParameter(index)}
                                disabled={parameters.length === 1}
                            >
                                <Delete />
                            </IconButton>
                        </Grid>
                    </Grid>
                ))}
                
                <Button
                    startIcon={<Add />}
                    onClick={addParameter}
                    sx={{ mb: 2 }}
                >
                    파라미터 추가
                </Button>
                
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                >
                    시뮬레이터 생성
                </Button>
            </Box>
        </Paper>
    );
};

export default CreateSimulator;
```

**개발 진행 기록**:
```
시뮬레이터 관리 시스템 프론트엔드 개발 완료 - [완료 시간 기록]
시뮬레이터 관리 시스템 디자인 완료 - [완료 시간 기록]
```

### 2.3 유저 테스트 & 피드백
- 시뮬레이터 생성 테스트
- 파라미터 동적 추가/삭제 테스트
- API 엔드포인트 테스트
- 에러 처리 확인

**개발 진행 기록**:
```
시뮬레이터 관리 시스템 유저 테스트 완료 - [완료 시간 기록]
```

---

## 📊 Phase 3: 대시보드 시스템

### 3.1 백엔드 개발
- 시뮬레이터 목록 조회 API
- 시뮬레이터 활성화/비활성화 API
- 시뮬레이터 수정/삭제 API

**개발 진행 기록**:
```
대시보드 시스템 개발 시작 - [시작 시간 기록]
대시보드 시스템 백엔드 개발 완료 - [완료 시간 기록]
```

### 3.2 프론트엔드 개발

#### 대시보드 컴포넌트 (pages/Dashboard.jsx)
```jsx
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    Button,
    Chip
} from '@mui/material';
import axios from 'axios';

const Dashboard = () => {
    const [simulators, setSimulators] = useState([]);

    useEffect(() => {
        fetchSimulators();
    }, []);

    const fetchSimulators = async () => {
        try {
            const response = await axios.get('/api/simulators');
            setSimulators(response.data);
        } catch (error) {
            console.error('Error fetching simulators:', error);
        }
    };

    const toggleSimulator = async (id, isActive) => {
        try {
            await axios.put(`/api/simulators/${id}`, { is_active: !isActive });
            fetchSimulators();
        } catch (error) {
            console.error('Error toggling simulator:', error);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                시뮬레이터 대시보드
            </Typography>
            
            <Grid container spacing={3}>
                {simulators.map((simulator) => (
                    <Grid item xs={12} md={6} lg={4} key={simulator.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {simulator.name}
                                </Typography>
                                
                                <Chip 
                                    label={simulator.is_active ? "활성" : "비활성"}
                                    color={simulator.is_active ? "success" : "default"}
                                    sx={{ mb: 2 }}
                                />
                                
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    API 엔드포인트: /api/data/{simulator.user_id}-{simulator.name}
                                </Typography>
                                
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={simulator.is_active}
                                            onChange={() => toggleSimulator(simulator.id, simulator.is_active)}
                                        />
                                    }
                                    label={simulator.is_active ? "활성화" : "비활성화"}
                                />
                                
                                <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ ml: 2 }}
                                    onClick={() => window.open(`/api/data/${simulator.user_id}-${simulator.name}`)}
                                >
                                    API 테스트
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default Dashboard;
```

**개발 진행 기록**:
```
대시보드 시스템 프론트엔드 개발 완료 - [완료 시간 기록]
대시보드 시스템 디자인 완료 - [완료 시간 기록]
```

### 3.3 유저 테스트 & 피드백
- 시뮬레이터 목록 표시 테스트
- 활성화/비활성화 토글 테스트
- API 엔드포인트 접근 테스트
- 반응형 디자인 확인

**개발 진행 기록**:
```
대시보드 시스템 유저 테스트 완료 - [완료 시간 기록]
```

---

## 🔧 Phase 4: API 엔드포인트 시스템

### 4.1 백엔드 개발
- 동적 API 엔드포인트 생성
- 사용자별-시뮬레이터별 고유 경로 처리
- 활성화 상태에 따른 응답 분기

**개발 진행 기록**:
```
API 엔드포인트 시스템 개발 시작 - [시작 시간 기록]
API 엔드포인트 시스템 백엔드 개발 완료 - [완료 시간 기록]
```

### 4.2 프론트엔드 개발
- API 테스트 인터페이스
- 실시간 API 응답 확인
- 에러 상태 표시

**개발 진행 기록**:
```
API 엔드포인트 시스템 프론트엔드 개발 완료 - [완료 시간 기록]
API 엔드포인트 시스템 디자인 완료 - [완료 시간 기록]
```

### 4.3 유저 테스트 & 피드백
- 다양한 파라미터 조합 테스트
- 활성화/비활성화 상태 응답 확인
- API 성능 테스트

**개발 진행 기록**:
```
API 엔드포인트 시스템 유저 테스트 완료 - [완료 시간 기록]
```

---

## 🚀 Phase 5: 배포 및 최종 테스트

### 5.1 Docker 컨테이너화
```dockerfile
# backend/Dockerfile
FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# frontend/Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### 5.2 Docker Compose 설정
```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: simulator_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/simulator_db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

**개발 진행 기록**:
```
배포 및 최종 테스트 시작 - [시작 시간 기록]
Docker 컨테이너화 완료 - [완료 시간 기록]
배포 환경 구축 완료 - [완료 시간 기록]
최종 통합 테스트 완료 - [완료 시간 기록]
```

---

## 🐛 에러 처리 및 피드백 관리

### 일반적인 에러 시나리오와 해결책

#### 1. 백엔드 API 관련 에러
```
회원가입 API 테스트 시 422 에러 발생 - [시간]
원인: 프론트엔드에서 email 필드 누락
해결책: 회원가입 폼에 이메일 입력 필드 추가 - [시간]
유저 피드백을 받아 해결 확인 - [시간] ✅
```

#### 2. 데이터베이스 연결 에러
```
시뮬레이터 생성 시 500 에러 발생 - [시간]
원인: PostgreSQL 연결 설정 오류
해결책: DATABASE_URL 환경변수 수정 및 DB 재시작 - [시간]
유저 피드백을 받아 해결 확인 - [시간] ✅
```

#### 3. 프론트엔드 UI/UX 에러
```
대시보드에서 시뮬레이터 목록이 표시되지 않음 - [시간]
원인: API 요청 시 인증 토큰 누락
해결책: axios 인터셉터에 Authorization 헤더 자동 추가 - [시간]
유저 피드백을 받아 해결 확인 - [시간] ✅
```

### 피드백 수렴 프로세스
1. **이슈 발견**: 유저 테스트 중 문제점 발견
2. **원인 분석**: 로그 확인 및 디버깅
3. **해결책 적용**: 코드 수정 및 테스트
4. **재테스트**: 수정된 기능 재검증
5. **피드백 확인**: 유저에게 해결 완료 확인

---

## 📈 개발 완료 체크리스트

### Phase별 완료 기준
- [ ] **Phase 1**: 회원가입/로그인 정상 동작, JWT 토큰 기반 인증 구현
- [ ] **Phase 2**: 시뮬레이터 CRUD 작업 완료, 파라미터 동적 관리
- [ ] **Phase 3**: 대시보드에서 시뮬레이터 목록 조회 및 상태 관리
- [ ] **Phase 4**: 고유 API 엔드포인트 생성 및 JSON 응답 정상 동작
- [ ] **Phase 5**: Docker 컨테이너 배포 완료, 환경변수 설정 완료

### 최종 검증 항목
- [ ] 모든 API 엔드포인트 정상 동작
- [ ] 프론트엔드 모든 페이지 접근 가능
- [ ] 반응형 디자인 모바일 호환성 확인
- [ ] 보안 검증 (SQL 인젝션, XSS 방지)
- [ ] 성능 테스트 (응답 시간 1초 이내)

---

## 📝 추가 고려사항

### 보안 측면
- CORS 설정
- Rate Limiting 구현
- Input Validation 강화
- SQL Injection 방지

### 성능 최적화
- 데이터베이스 인덱싱
- API 응답 캐싱
- 프론트엔드 코드 분할
- 이미지 최적화

### 확장 가능성
- Redis 캐시 시스템 도입
- 로그 수집 시스템 구축
- 모니터링 대시보드 추가
- SimPy 기반 이산 사건 시뮬레이션 기능 추가

이 가이드를 따라 개발을 진행하며, 각 단계에서 발생하는 모든 이슈와 해결 과정을 `develop-work-report.md`에 상세히 기록하여 프로젝트 진행 상황을 체계적으로 관리합니다.