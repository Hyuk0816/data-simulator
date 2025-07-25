from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class Token(BaseModel):
    """JWT 토큰 응답 스키마"""
    access_token: str = Field(..., description="JWT 액세스 토큰")
    token_type: str = Field(default="bearer", description="토큰 타입")
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer"
                }
            ]
        }
    )


class TokenData(BaseModel):
    """JWT 토큰 페이로드 데이터"""
    user_id: Optional[str] = Field(None, description="사용자 ID")
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "user_id": "honggildong"
                }
            ]
        }
    )


class TokenPayload(BaseModel):
    """JWT 토큰 전체 페이로드"""
    sub: str = Field(..., description="Subject - 사용자 식별자")
    exp: Optional[int] = Field(None, description="만료 시간 (Unix timestamp)")
    iat: Optional[int] = Field(None, description="발급 시간 (Unix timestamp)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "sub": "honggildong",
                    "exp": 1704067200,
                    "iat": 1704060000
                }
            ]
        }
    )