"""
사용자 서비스 - 회원가입, 로그인, 프로필 관리 비즈니스 로직
"""
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select
from passlib.context import CryptContext
from jose import jwt, JWTError

from ..models.user import User
from ..schemas.user import UserCreate, UserUpdate, UserLogin, UserResponse
from ..schemas.auth import TokenData


# 비밀번호 해싱을 위한 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 설정
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


class UserService:
    """사용자 관련 비즈니스 로직을 처리하는 서비스 클래스"""
    
    # 클래스 속성으로 JWT 설정 추가
    SECRET_KEY = SECRET_KEY
    ALGORITHM = ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """비밀번호를 해시화하여 반환"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """평문 비밀번호와 해시된 비밀번호를 비교하여 검증"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        """JWT 액세스 토큰 생성"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def decode_access_token(token: str) -> Optional[TokenData]:
        """JWT 토큰을 디코드하여 사용자 정보 추출"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return TokenData(user_id=user_id)
        except JWTError:
            return None
    
    @staticmethod
    def get_user_by_user_id(db: Session, user_id: str) -> Optional[User]:
        """user_id로 사용자 조회"""
        stmt = select(User).where(User.user_id == user_id.lower())
        return db.scalar(stmt)
    
    @staticmethod
    def get_user_by_id(db: Session, id: int) -> Optional[User]:
        """id(PK)로 사용자 조회"""
        return db.get(User, id)
    
    @staticmethod
    def create_user(db: Session, user_create: UserCreate) -> User:
        """새 사용자 생성"""
        # user_id 중복 검사
        existing_user = UserService.get_user_by_user_id(db, user_create.user_id)
        if existing_user:
            raise ValueError("이미 존재하는 사용자 ID입니다.")
        
        # 비밀번호 해싱
        hashed_password = UserService.get_password_hash(user_create.password)
        
        # 사용자 생성
        db_user = User(
            name=user_create.name,
            user_id=user_create.user_id.lower(),  # 소문자로 저장
            password=hashed_password
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """사용자 정보 업데이트"""
        db_user = UserService.get_user_by_id(db, user_id)
        if not db_user:
            return None
        
        # 업데이트할 필드만 처리
        update_data = user_update.model_dump(exclude_unset=True)
        
        # password_confirm 필드 제거 (DB에 저장하지 않음)
        update_data.pop("password_confirm", None)
        
        # user_id 변경 시 중복 검사
        if "user_id" in update_data and update_data["user_id"]:
            new_user_id = update_data["user_id"].lower()
            if new_user_id != db_user.user_id:
                existing_user = UserService.get_user_by_user_id(db, new_user_id)
                if existing_user:
                    raise ValueError("이미 존재하는 사용자 ID입니다.")
                update_data["user_id"] = new_user_id
        
        # 비밀번호 변경 시 해싱
        if "password" in update_data and update_data["password"]:
            update_data["password"] = UserService.get_password_hash(update_data["password"])
        
        # 업데이트 적용
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def authenticate_user(db: Session, user_login: UserLogin) -> Optional[User]:
        """사용자 로그인 인증"""
        user = UserService.get_user_by_user_id(db, user_login.user_id)
        if not user:
            return None
        
        if not UserService.verify_password(user_login.password, user.password):
            return None
        
        return user
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """사용자 삭제"""
        db_user = UserService.get_user_by_id(db, user_id)
        if not db_user:
            return False
        
        db.delete(db_user)
        db.commit()
        return True