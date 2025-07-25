from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """기본 사용자 스키마 - 공통 속성 정의"""
    name: str = Field(..., min_length=1, max_length=255, description="사용자 이름")
    user_id: str = Field(..., min_length=3, max_length=50, description="고유 로그인 ID")

    model_config = ConfigDict(
        str_strip_whitespace=True,  # 문자열 양쪽 공백 제거
        json_schema_extra={
            "examples": [
                {
                    "name": "홍길동",
                    "user_id": "honggildong"
                }
            ]
        }
    )


class UserCreate(UserBase):
    """회원가입용 스키마"""
    password: str = Field(..., min_length=8, description="사용자 비밀번호 (최소 8자)")
    password_confirm: str = Field(..., description="비밀번호 확인")

    @field_validator('password_confirm')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """비밀번호와 비밀번호 확인이 일치하는지 검증"""
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('비밀번호가 일치하지 않습니다')
        return v

    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v: str) -> str:
        """user_id 형식 검증 - 영문자, 숫자, 언더스코어만 허용"""
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('사용자 ID는 영문자, 숫자, 언더스코어(_)만 포함할 수 있습니다')
        return v.lower()  # 일관성을 위해 소문자로 변환

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "홍길동",
                    "user_id": "honggildong",
                    "password": "securepassword123",
                    "password_confirm": "securepassword123"
                }
            ]
        }
    )


class UserUpdate(BaseModel):
    """사용자 프로필 업데이트용 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    user_id: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=8)
    password_confirm: Optional[str] = Field(None)

    @field_validator('password_confirm')
    @classmethod
    def passwords_match(cls, v: Optional[str], info) -> Optional[str]:
        """비밀번호 변경 시 비밀번호 확인 검증"""
        if v is not None and 'password' in info.data and info.data['password'] is not None:
            if v != info.data['password']:
                raise ValueError('비밀번호가 일치하지 않습니다')
        return v

    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v: Optional[str]) -> Optional[str]:
        """user_id 변경 시 형식 검증"""
        if v is not None:
            import re
            if not re.match(r'^[a-zA-Z0-9_]+$', v):
                raise ValueError('사용자 ID는 영문자, 숫자, 언더스코어(_)만 포함할 수 있습니다')
            return v.lower()
        return v

    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "examples": [
                {
                    "name": "홍길동 (수정)",
                    "user_id": "honggildong_new"
                }
            ]
        }
    )


class UserLogin(BaseModel):
    """로그인용 스키마"""
    user_id: str = Field(..., description="사용자 로그인 ID")
    password: str = Field(..., description="사용자 비밀번호")

    @field_validator('user_id')
    @classmethod
    def normalize_user_id(cls, v: str) -> str:
        """user_id를 소문자로 정규화"""
        return v.lower().strip()

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "user_id": "honggildong",
                    "password": "securepassword123"
                }
            ]
        }
    )


class UserResponse(BaseModel):
    """사용자 응답용 스키마 (비밀번호 제외)"""
    id: int
    name: str
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,  # ORM 모드 활성화 (Pydantic v2 문법)
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "홍길동",
                    "user_id": "honggildong",
                    "created_at": "2024-01-01T12:00:00",
                    "updated_at": "2024-01-01T12:00:00"
                }
            ]
        }
    )


class UserInDB(UserResponse):
    """데이터베이스 저장용 사용자 스키마 (해시된 비밀번호 포함)"""
    password: str  # 해시된 비밀번호

    model_config = ConfigDict(
        from_attributes=True
    )