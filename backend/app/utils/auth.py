"""
인증 관련 유틸리티 함수들
"""
from typing import Optional
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from ..database import get_db
from ..schemas.auth import TokenData
from ..services.user_service import UserService


# OAuth2 설정
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# JWT 설정 (서비스에서 가져옴)
SECRET_KEY = UserService.SECRET_KEY
ALGORITHM = UserService.ALGORITHM


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """현재 인증된 사용자 정보를 가져오는 의존성"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 토큰 디코드
    token_data = UserService.decode_access_token(token)
    if token_data is None:
        raise credentials_exception
    
    # 사용자 조회
    user = UserService.get_user_by_user_id(db, user_id=token_data.user_id)
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user = Depends(get_current_user)
):
    """활성 사용자만 허용하는 의존성 (향후 비활성 사용자 처리를 위해)"""
    # 현재는 모든 사용자가 활성 상태라고 가정
    # 추후 is_active 필드 추가 시 여기서 체크
    return current_user