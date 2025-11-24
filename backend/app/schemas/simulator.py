from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, Dict, Any, Literal
from datetime import datetime
import json
import re


class ParameterConfig(BaseModel):
    """파라미터 설정 스키마 - 랜덤 값 생성을 위한 메타데이터"""
    is_random: bool = Field(default=False, description="랜덤 값 생성 여부")
    type: Optional[Literal["integer", "float", "string"]] = Field(default=None, description="값 타입")
    min: Optional[float] = Field(default=None, description="최소값 (숫자 타입용)")
    max: Optional[float] = Field(default=None, description="최대값 (숫자 타입용)")
    
    @field_validator('min', 'max')
    @classmethod
    def validate_range(cls, v: Optional[float], info) -> Optional[float]:
        """범위 값 검증"""
        if v is not None and info.data.get('is_random') and info.data.get('type') in ['integer', 'float']:
            return v
        return v
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "is_random": True,
                    "type": "float",
                    "min": 10.0,
                    "max": 25.0
                },
                {
                    "is_random": False
                }
            ]
        }
    )


class SimulatorBase(BaseModel):
    """기본 시뮬레이터 스키마 - 공통 속성 정의"""
    name: str = Field(..., min_length=1, max_length=255, description="시뮬레이터 이름")
    parameters: Dict[str, Any] = Field(..., description="시뮬레이터 파라미터 (JSON 형태)")
    parameter_config: Optional[Dict[str, ParameterConfig]] = Field(default_factory=dict, description="파라미터 설정 (랜덤 값 생성용)")
    is_active: bool = Field(default=True, description="시뮬레이터 활성화 상태")

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """시뮬레이터 이름 검증 - 영문자, 숫자, 하이픈만 허용"""
        import re
        if not re.match(r'^[a-zA-Z0-9-]+$', v):
            raise ValueError('시뮬레이터 이름은 영문자, 숫자, 하이픈(-)만 포함할 수 있습니다.')
        return v.strip()

    @field_validator('parameters')
    @classmethod
    def validate_parameters(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """파라미터 검증 - JSON 직렬화 가능한지 확인"""
        if not v:
            raise ValueError('파라미터는 비어있을 수 없습니다')
        
        try:
            # JSON 직렬화 가능한지 테스트
            json.dumps(v)
        except (TypeError, ValueError) as e:
            raise ValueError(f'파라미터는 JSON 직렬화가 가능해야 합니다: {str(e)}')
        
        # 파라미터 키 검증 (영문자, 숫자, 언더스코어만 허용)
        for key in v.keys():
            if not isinstance(key, str) or not re.match(r'^[a-zA-Z][a-zA-Z0-9_]*$', key):
                raise ValueError(f'파라미터 키 "{key}"는 영문자로 시작하고 영문자, 숫자, 언더스코어(_)만 포함할 수 있습니다')
        
        return v

    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "examples": [
                {
                    "name": "test-simulator",
                    "parameters": {
                        "depth_data": 25,
                        "water_quality": 30,
                        "tool": "test"
                    },
                    "is_active": True
                }
            ]
        }
    )


class SimulatorCreate(SimulatorBase):
    """시뮬레이터 생성용 스키마"""
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "ocean-data-simulator",
                    "parameters": {
                        "depth_data": 25,
                        "water_quality": 30,
                        "temperature": 18.5,
                        "pressure": 2.1,
                        "tool": "sensor_v2"
                    },
                    "is_active": True
                }
            ]
        }
    )


class SimulatorUpdate(BaseModel):
    """시뮬레이터 업데이트용 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="시뮬레이터 이름")
    parameters: Optional[Dict[str, Any]] = Field(None, description="시뮬레이터 파라미터")
    parameter_config: Optional[Dict[str, ParameterConfig]] = Field(None, description="파라미터 설정 (랜덤 값 생성용)")
    is_active: Optional[bool] = Field(None, description="시뮬레이터 활성화 상태")

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """시뮬레이터 이름 업데이트 시 검증"""
        if v is not None:
            import re
            if not re.match(r'^[a-zA-Z0-9-]+$', v):
                raise ValueError('시뮬레이터 이름은 영문자, 숫자, 하이픈(-)만 포함할 수 있습니다.')
            return v.strip()
        return v

    @field_validator('parameters')
    @classmethod
    def validate_parameters(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """파라미터 업데이트 시 검증"""
        if v is not None:
            if not v:
                raise ValueError('파라미터는 비어있을 수 없습니다')
            
            try:
                # JSON 직렬화 가능한지 테스트
                json.dumps(v)
            except (TypeError, ValueError) as e:
                raise ValueError(f'파라미터는 JSON 직렬화가 가능해야 합니다: {str(e)}')
            
            # 파라미터 키 검증
            import re
            for key in v.keys():
                if not isinstance(key, str) or not re.match(r'^[a-zA-Z][a-zA-Z0-9_]*$', key):
                    raise ValueError(f'파라미터 키 "{key}"는 영문자로 시작하고 영문자, 숫자, 언더스코어(_)만 포함할 수 있습니다')
        
        return v

    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "examples": [
                {
                    "name": "updated-simulator",
                    "parameters": {
                        "depth_data": 30,
                        "water_quality": 35,
                        "temperature": 20.0
                    },
                    "is_active": False
                }
            ]
        }
    )


class SimulatorResponse(BaseModel):
    """시뮬레이터 응답용 스키마"""
    id: int
    user_id: int
    name: str
    parameters: Dict[str, Any]
    parameter_config: Optional[Dict[str, ParameterConfig]] = Field(default_factory=dict)
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,  # ORM 모드 활성화
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "user_id": 1,
                    "name": "ocean-data-simulator",
                    "parameters": {
                        "depth_data": 25,
                        "water_quality": 30,
                        "temperature": 18.5,
                        "tool": "sensor_v2"
                    },
                    "is_active": True,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            ]
        }
    )


class SimulatorDataResponse(BaseModel):
    """시뮬레이터 API 데이터 응답용 스키마"""
    data: Dict[str, Any] = Field(..., description="시뮬레이터 파라미터 데이터")
    simulator_name: str = Field(..., description="시뮬레이터 이름")
    user_id: str = Field(..., description="사용자 ID")
    timestamp: datetime = Field(default_factory=datetime.now, description="응답 생성 시간")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "data": {
                        "depth_data": 25,
                        "water_quality": 30,
                        "temperature": 18.5,
                        "tool": "sensor_v2"
                    },
                    "simulator_name": "ocean-data-simulator",
                    "user_id": "testuser",
                    "timestamp": datetime.now().isoformat()
                }
            ]
        }
    )


class SimulatorInactiveResponse(BaseModel):
    """비활성화된 시뮬레이터 응답용 스키마"""
    message: str = Field(default="해당 시뮬레이터는 비활성화 상태 입니다.", description="비활성화 메시지")
    simulator_name: str = Field(..., description="시뮬레이터 이름")
    user_id: str = Field(..., description="사용자 ID")
    timestamp: datetime = Field(default_factory=datetime.now, description="응답 생성 시간")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "message": "해당 시뮬레이터는 비활성화 상태 입니다.",
                    "simulator_name": "ocean-data-simulator",
                    "user_id": "testuser",
                    "timestamp": datetime.now().isoformat()
                }
            ]
        }
    )