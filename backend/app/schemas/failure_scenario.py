from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
import json
from enum import Enum


class FailureScenarioBase(BaseModel):
    """기본 고장 시나리오 스키마"""
    name: str = Field(..., min_length=1, max_length=255, description="시나리오 이름")
    description: Optional[str] = Field(None, description="시나리오 설명")
    simulator_id: Optional[int] = Field(None, description="시뮬레이터 ID")
    # 고장 시 반환될 파라미터 값들 (정상값을 대체)
    failure_parameters: Dict[str, Any] = Field(
        ..., 
        description="고장 시 반환될 파라미터 값",
        example={
            "temperature": 999,
            "pressure": -100,
            "status": "ERROR"
        }
    )
    is_active: bool = Field(default=True, description="활성화 상태")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """시나리오 이름 검증"""
        return v.strip()
    
    @field_validator('failure_parameters')
    @classmethod
    def validate_parameters(cls, v: Dict) -> Dict:
        """고장 파라미터 검증"""
        if not v:
            raise ValueError('최소 하나 이상의 고장 파라미터가 필요합니다.')
        try:
            # JSON 직렬화 가능한지 확인
            json.dumps(v)
        except (TypeError, ValueError) as e:
            raise ValueError(f'파라미터는 JSON 직렬화가 가능해야 합니다: {str(e)}')
        return v
    
    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "examples": [
                {
                    "name": "온도 센서 고장",
                    "description": "온도 센서가 비정상적으로 높은 값을 반환",
                    "simulator_id": 1,
                    "failure_parameters": {
                        "temperature": 999,
                        "sensor_status": "FAULT"
                    },
                    "is_active": True
                }
            ]
        }
    )


class FailureScenarioCreate(FailureScenarioBase):
    """고장 시나리오 생성용 스키마"""
    pass


class FailureScenarioUpdate(BaseModel):
    """고장 시나리오 업데이트용 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    failure_parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """시나리오 이름 업데이트 시 검증"""
        if v is not None:
            return v.strip()
        return v
    
    @field_validator('failure_parameters')
    @classmethod
    def validate_parameters(cls, v: Optional[Dict]) -> Optional[Dict]:
        """고장 파라미터 업데이트 시 검증"""
        if v is not None:
            if not v:
                raise ValueError('최소 하나 이상의 고장 파라미터가 필요합니다.')
            try:
                json.dumps(v)
            except (TypeError, ValueError) as e:
                raise ValueError(f'파라미터는 JSON 직렬화가 가능해야 합니다: {str(e)}')
        return v
    
    model_config = ConfigDict(
        str_strip_whitespace=True
    )


class FailureScenarioResponse(BaseModel):
    """고장 시나리오 응답용 스키마"""
    id: int
    user_id: int
    simulator_id: Optional[int]
    name: str
    description: Optional[str]
    failure_parameters: Dict[str, Any]
    is_active: bool
    is_applied: bool
    created_at: datetime
    updated_at: datetime
    applied_at: Optional[datetime]
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "user_id": 1,
                    "simulator_id": 1,
                    "name": "온도 센서 고장",
                    "description": "온도 센서가 비정상적으로 높은 값을 반환",
                    "failure_parameters": {
                        "temperature": 999,
                        "sensor_status": "FAULT"
                    },
                    "is_active": True,
                    "is_applied": False,
                    "created_at": "2025-01-01T00:00:00",
                    "updated_at": "2025-01-01T00:00:00",
                    "applied_at": None
                }
            ]
        }
    )


class FailureScenarioApply(BaseModel):
    """고장 시나리오 적용 요청"""
    scenario_id: int = Field(..., description="적용할 시나리오 ID")
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "scenario_id": 1
                }
            ]
        }
    )


class FailureTypeEnum(str, Enum):
    """고장 유형"""
    SUDDEN = "sudden"
    GRADUAL = "gradual"
    INTERMITTENT = "intermittent"
    CYCLIC = "cyclic"
    RANDOM_WALK = "random_walk"
    DRIFT = "drift"


class NoiseTypeEnum(str, Enum):
    """노이즈 유형"""
    GAUSSIAN = "gaussian"
    UNIFORM = "uniform"
    EXPONENTIAL = "exponential"
    POISSON = "poisson"


class AdvancedFailureConfig(BaseModel):
    """고급 고장 시나리오 설정"""
    probability: Optional[float] = Field(None, ge=0.0, le=1.0, description="고장 발생 확률")
    parameters: Optional[Dict[str, Dict[str, Any]]] = Field(
        None,
        description="파라미터별 고급 설정",
        example={
            "temperature": {
                "failure_type": "gradual",
                "failure_value": 999,
                "duration_seconds": 60,
                "noise": {
                    "type": "gaussian",
                    "intensity": 0.1
                },
                "clamp": {
                    "min": -50,
                    "max": 1000
                }
            }
        }
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "probability": 0.8,
                    "parameters": {
                        "temperature": {
                            "failure_type": "gradual",
                            "failure_value": 999,
                            "duration_seconds": 60
                        },
                        "pressure": {
                            "failure_type": "cyclic",
                            "period_seconds": 30,
                            "amplitude": 50
                        }
                    }
                }
            ]
        }
    )


class FailureScenarioWithAdvanced(FailureScenarioBase):
    """고급 기능이 포함된 고장 시나리오"""
    advanced_config: Optional[AdvancedFailureConfig] = Field(
        None,
        description="NumPy 기반 고급 고장 설정"
    )


class SimulatorWithFailureResponse(BaseModel):
    """고장 시나리오가 적용된 시뮬레이터 응답"""
    simulator_id: int
    simulator_name: str
    active_scenario_id: Optional[int]
    active_scenario_name: Optional[str]
    original_parameters: Dict[str, Any]
    failure_parameters: Optional[Dict[str, Any]]
    current_response: Dict[str, Any]
    timestamp: datetime
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "simulator_id": 1,
                    "simulator_name": "ocean-simulator",
                    "active_scenario_id": 2,
                    "active_scenario_name": "온도 센서 고장",
                    "original_parameters": {
                        "temperature": 25,
                        "pressure": 100
                    },
                    "failure_parameters": {
                        "temperature": 999,
                        "sensor_status": "FAULT"
                    },
                    "current_response": {
                        "temperature": 999,
                        "pressure": 100,
                        "sensor_status": "FAULT"
                    },
                    "timestamp": "2025-01-01T00:00:00"
                }
            ]
        }
    )