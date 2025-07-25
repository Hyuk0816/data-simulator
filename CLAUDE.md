# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 Required Reading

**IMPORTANT**: Before working on this project, you must read and reference these key documents:

- **@simulator-plan.md** - Complete project specification including requirements, database schema, UI/UX principles, and deployment strategy
- **@simulator-develope-guide.md** - Detailed development workflow with phase-by-phase implementation guide, code examples, and progress tracking requirements

These documents contain essential project context, development methodology, and specific implementation requirements that must be followed.

## Project Overview

This is a Dynamic API Simulator web application that allows users to create dynamic API endpoints through a web interface. Users can define key-value parameters via the UI, and the system generates unique API endpoints that return the configured JSON data.

**Core Concept**: Users create simulators with custom parameters, and each simulator gets a unique endpoint at `{user_id}-{simulator_name}` that returns the configured JSON response.

## Architecture

### High-Level Structure
- **Backend**: Python/FastAPI with PostgreSQL database
- **Frontend**: React with Material-UI (MUI) components  
- **Database**: PostgreSQL with two main tables (users, simulators)
- **Future**: SimPy library integration for discrete-event simulation capabilities

### Project Layout
```
simulator/                    # Project root
├── backend/                  # Python/FastAPI application
│   ├── app/
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── schemas/         # Pydantic schemas for API
│   │   ├── routers/         # FastAPI route handlers
│   │   └── utils/           # Authentication and utilities
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment configuration
└── frontend/                # React application
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Page-level components
    │   └── services/        # API integration layer
    └── package.json         # Node.js dependencies
```

### Database Schema
- **users table**: id, name, user_id (login), password (hashed)
- **simulators table**: id, user_id (FK), name, parameters (JSONB), is_active (boolean)

### API Endpoint Pattern
Dynamic endpoints follow the pattern: `/api/data/{user_id}-{simulator_name}`
- Active simulators return configured JSON parameters
- Inactive simulators return: `{"message": "해당 시뮬레이터는 비활성화 상태 입니다."}`

## Development Commands

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload  # Development server
```

### Frontend Setup
```bash
cd frontend
npm install
npm start  # Development server
```

### Database Setup
```bash
# PostgreSQL setup with environment variables
docker-compose up -d  # If using Docker
alembic upgrade head  # Database migrations
```

### Docker Deployment
```bash
docker-compose up --build  # Full stack deployment
```

## Development Methodology

### Feature Development Process
Follow the strict order: **Backend → Frontend → User Testing → Feedback → Fixes**

### Progress Tracking
All development progress must be recorded in `develop-work-report.md` with timestamps:
```
[기능명] 개발 시작 - YYYY.MM.DD HH:MM
[기능명] 백엔드 개발 완료 - YYYY.MM.DD HH:MM
[기능명] 프론트엔드 개발 완료 - YYYY.MM.DD HH:MM
[기능명] 유저 테스트 완료 - YYYY.MM.DD HH:MM
```

**IMPORTANT**: When recording timestamps in work reports, you must first execute the `date` command to get the current time. Do NOT use arbitrary or estimated times. Always use the actual system time:
```bash
date "+%Y.%m.%d %H:%M"
```

### Error Handling
When errors occur, document in `develop-work-report.md`:
```
[기능명] [에러 내용] 발생 - YYYY.MM.DD HH:MM
[기능명] [해결책 적용] - YYYY.MM.DD HH:MM  
[기능명] 유저 피드백을 받아 해결 확인 - YYYY.MM.DD HH:MM ✅
```

## Development Phases

### Phase 1: User Authentication
- JWT-based authentication system
- Registration: name, user_id, password, password_confirm
- Login: user_id, password

### Phase 2: Simulator Management  
- CRUD operations for simulators
- Dynamic key-value parameter configuration
- JSON parameter storage and retrieval

### Phase 3: Dashboard System
- Simulator list management
- Toggle activation/deactivation with switches
- Real-time status monitoring

### Phase 4: Dynamic API Endpoints
- Generate unique endpoints per simulator
- Return configured JSON responses
- Handle active/inactive state responses

### Phase 5: Deployment & Testing
- Docker containerization
- Environment variable management
- Integration testing

## Technology Standards

### Backend Stack
- **FastAPI**: Latest stable version for API development
- **SQLAlchemy**: ORM for database operations  
- **Alembic**: Database migration management
- **JWT**: Authentication token system
- **Pydantic**: Data validation and serialization

### Frontend Stack
- **React**: Component-based UI development
- **Material-UI (MUI)**: Design system and components
- **Axios**: HTTP client for API calls
- **React Router**: Client-side routing

### Database
- **PostgreSQL**: Primary database with JSONB support for parameter storage
- Environment variables for connection: `DB_USER`, `DB_PASSWORD`, `DB_PORT`

## Key Implementation Details

### Dynamic Parameter Handling
Simulators store parameters as JSONB in PostgreSQL, allowing flexible key-value storage without schema changes.

### API Endpoint Generation
Each simulator creates a unique endpoint using the pattern `{user_id}-{simulator_name}` for namespace isolation.

### Authentication Flow
JWT-based authentication with secure password hashing using bcrypt.

### State Management
Simulator activation state controls API response behavior - active simulators return data, inactive return error messages.

## Future Enhancements

### SimPy Integration (Planned)
Integration with SimPy library for discrete-event simulation capabilities, allowing dynamic value generation based on conditions and probabilities rather than static responses.