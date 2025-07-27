"""
인증 관련 API 라우터 - 회원가입, 로그인 엔드포인트
"""
from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.user import UserCreate, UserResponse, UserLogin
from ..schemas.auth import Token
from ..services.user_service import UserService, ACCESS_TOKEN_EXPIRE_MINUTES
from ..models.user import User
from ..utils.auth import get_current_user


router = APIRouter(
    prefix="/api/auth",
    tags=["인증"],
    responses={404: {"description": "Not found"}}
)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="회원가입")
async def register(
    user_create: UserCreate,
    db: Session = Depends(get_db)
):
    """
    회원가입 엔드포인트
    
    - **name**: 사용자 이름
    - **user_id**: 로그인에 사용할 ID (영문자, 숫자, 언더스코어만 허용)
    - **password**: 비밀번호 (최소 8자)
    - **password_confirm**: 비밀번호 확인
    """
    try:
        # 사용자 생성
        new_user = UserService.create_user(db, user_create)
        
        # 응답 반환
        return UserResponse(
            id=new_user.id,
            name=new_user.name,
            user_id=new_user.user_id,
            created_at=new_user.created_at,
            updated_at=new_user.updated_at
        )
    except ValueError as e:
        # user_id 중복 등의 검증 에러
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # 기타 서버 에러
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="서버 오류가 발생했습니다"
        )


@router.post("/login", response_model=Token, summary="로그인")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    """
    로그인 엔드포인트
    
    OAuth2 표준을 따라 form data로 인증 정보를 받습니다:
    - **username**: 사용자 ID (OAuth2 표준에 따라 username 필드 사용)
    - **password**: 비밀번호
    
    성공 시 JWT 액세스 토큰을 반환합니다.
    """
    # OAuth2 표준에 따라 username 필드에 user_id가 전달됨
    user_login = UserLogin(
        user_id=form_data.username,
        password=form_data.password
    )
    
    # 사용자 인증
    user = UserService.authenticate_user(db, user_login)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 토큰 생성
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = UserService.create_access_token(
        data={"sub": user.user_id},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer"
    )


@router.get("/me", response_model=UserResponse, summary="현재 사용자 정보")
async def read_users_me(
    current_user: User = Depends(get_current_user)
):
    """
    현재 로그인한 사용자의 정보를 반환합니다.
    
    Authorization 헤더에 Bearer 토큰이 필요합니다.
    """
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        user_id=current_user.user_id,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )


@router.get("/check-id/{user_id}", summary="사용자 ID 중복 확인")
async def check_user_id(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    사용자 ID 중복 확인 엔드포인트
    
    - **user_id**: 확인할 사용자 ID
    
    Returns:
        - **available**: 사용 가능 여부 (true: 사용 가능, false: 이미 사용 중)
        - **message**: 결과 메시지
    """
    # 유효성 검사
    import re
    if not re.match(r'^[a-zA-Z0-9_]+$', user_id):
        return {
            "available": False,
            "message": "사용자 ID는 영문자, 숫자, 언더스코어(_)만 포함할 수 있습니다."
        }
    
    if len(user_id) < 3 or len(user_id) > 50:
        return {
            "available": False,
            "message": "사용자 ID는 3자 이상 50자 이하여야 합니다."
        }
    
    # 중복 확인
    is_available = UserService.check_user_id_availability(db, user_id)
    
    if is_available:
        return {
            "available": True,
            "message": "사용 가능한 ID입니다."
        }
    else:
        return {
            "available": False,
            "message": "이미 사용 중인 ID입니다."
        }