from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..utils.auth import get_current_user
from ..models.user import User
from ..models.simulator import Simulator
from ..models.failure_scenario import FailureScenario
from ..services.failure_engine import FailureEngine, FailureType, NoiseType
import json
import numpy as np

router = APIRouter(
    prefix="/api/failure-analytics",
    tags=["failure-analytics"]
)


@router.get("/patterns/{pattern_type}")
def generate_failure_pattern(
    pattern_type: str,
    base_value: float = Query(100.0, description="기준 값"),
    duration_seconds: int = Query(60, description="시뮬레이션 기간(초)"),
    sample_rate: int = Query(10, description="초당 샘플 수"),
    current_user: User = Depends(get_current_user)
):
    """
    고장 패턴 시계열 데이터 생성
    
    지원되는 패턴:
    - step: 계단 함수
    - ramp: 램프 함수
    - sine: 사인파
    - noise: 노이즈
    - spike: 스파이크
    - degradation: 성능 저하
    """
    try:
        engine = FailureEngine()
        time_array, values = engine.generate_failure_pattern(
            base_value=base_value,
            pattern_type=pattern_type,
            duration_seconds=duration_seconds,
            sample_rate=sample_rate
        )
        
        # numpy 배열을 리스트로 변환
        return {
            "pattern_type": pattern_type,
            "base_value": base_value,
            "duration_seconds": duration_seconds,
            "sample_rate": sample_rate,
            "time": time_array.tolist(),
            "values": values.tolist(),
            "statistics": {
                "mean": float(np.mean(values)),
                "std": float(np.std(values)),
                "min": float(np.min(values)),
                "max": float(np.max(values))
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"패턴 생성 실패: {str(e)}"
        )


@router.post("/simulate-advanced")
def simulate_advanced_failure(
    original_params: Dict[str, Any],
    advanced_config: Dict[str, Any],
    duration_seconds: int = Query(60, description="시뮬레이션 기간(초)"),
    sample_rate: int = Query(1, description="초당 샘플 수"),
    current_user: User = Depends(get_current_user)
):
    """
    고급 고장 시나리오 시뮬레이션
    
    advanced_config 예시:
    {
        "probability": 0.8,
        "parameters": {
            "temperature": {
                "failure_type": "gradual",
                "failure_value": 999,
                "duration_seconds": 60,
                "noise": {
                    "type": "gaussian",
                    "intensity": 0.1
                }
            }
        }
    }
    """
    try:
        engine = FailureEngine()
        num_samples = duration_seconds * sample_rate
        
        results = []
        timestamps = []
        
        start_time = datetime.now()
        
        for i in range(num_samples):
            current_time = start_time + timedelta(seconds=i/sample_rate)
            
            failure_config = {
                'failure_parameters': {},
                'advanced_config': advanced_config
            }
            
            result = engine.apply_failure_scenario(
                original_params,
                failure_config,
                current_time
            )
            
            results.append(result)
            timestamps.append(current_time.isoformat())
        
        # 각 파라미터별 시계열 데이터 생성
        time_series = {}
        for key in original_params.keys():
            if isinstance(original_params[key], (int, float)):
                time_series[key] = [r.get(key, original_params[key]) for r in results]
        
        # 통계 분석
        statistics = {}
        for key, values in time_series.items():
            statistics[key] = engine.analyze_failure_statistics(values)
        
        return {
            "original_parameters": original_params,
            "advanced_config": advanced_config,
            "duration_seconds": duration_seconds,
            "sample_rate": sample_rate,
            "timestamps": timestamps,
            "time_series": time_series,
            "statistics": statistics
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"시뮬레이션 실패: {str(e)}"
        )


@router.post("/predict-failure")
def predict_failure_probability(
    history: List[float],
    threshold: float,
    parameter_name: str = Query("value", description="파라미터 이름"),
    future_steps: int = Query(10, description="예측할 미래 스텝 수"),
    current_user: User = Depends(get_current_user)
):
    """
    과거 데이터를 기반으로 미래 고장 확률 예측
    
    Args:
        history: 과거 데이터 배열
        threshold: 고장 임계값
        parameter_name: 파라미터 이름
        future_steps: 예측할 미래 스텝 수
    """
    if len(history) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="예측을 위해 최소 2개 이상의 데이터 포인트가 필요합니다."
        )
    
    try:
        engine = FailureEngine()
        probability = engine.predict_failure_probability(
            history=history,
            threshold=threshold,
            future_steps=future_steps
        )
        
        # 간단한 선형 예측
        arr = np.array(history)
        x = np.arange(len(arr))
        coeffs = np.polyfit(x, arr, 1)
        poly = np.poly1d(coeffs)
        
        # 미래 값 예측
        future_x = np.arange(len(arr), len(arr) + future_steps)
        future_values = poly(future_x).tolist()
        
        return {
            "parameter_name": parameter_name,
            "history_length": len(history),
            "threshold": threshold,
            "future_steps": future_steps,
            "failure_probability": probability,
            "predicted_values": future_values,
            "trend": {
                "slope": float(coeffs[0]),
                "intercept": float(coeffs[1]),
                "direction": "increasing" if coeffs[0] > 0 else "decreasing"
            },
            "statistics": engine.analyze_failure_statistics(history)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"예측 실패: {str(e)}"
        )


@router.get("/failure-types")
def get_failure_types(current_user: User = Depends(get_current_user)):
    """사용 가능한 고장 유형 목록 조회"""
    return {
        "failure_types": [
            {
                "type": "sudden",
                "name": "갑작스런 고장",
                "description": "즉시 고장 값으로 변경",
                "parameters": ["failure_value"]
            },
            {
                "type": "gradual",
                "name": "점진적 고장",
                "description": "시간에 따라 서서히 변화",
                "parameters": ["failure_value", "duration_seconds"]
            },
            {
                "type": "intermittent",
                "name": "간헐적 고장",
                "description": "확률적으로 고장 발생",
                "parameters": ["failure_value", "failure_probability"]
            },
            {
                "type": "cyclic",
                "name": "주기적 고장",
                "description": "사인파 패턴으로 변화",
                "parameters": ["period_seconds", "amplitude"]
            },
            {
                "type": "random_walk",
                "name": "랜덤 워크",
                "description": "누적 랜덤 변화",
                "parameters": ["step_size"]
            },
            {
                "type": "drift",
                "name": "드리프트",
                "description": "일정한 속도로 이탈",
                "parameters": ["drift_rate"]
            }
        ]
    }


@router.get("/noise-types")
def get_noise_types(current_user: User = Depends(get_current_user)):
    """사용 가능한 노이즈 유형 목록 조회"""
    return {
        "noise_types": [
            {
                "type": "gaussian",
                "name": "가우시안 노이즈",
                "description": "정규 분포 노이즈",
                "parameters": ["intensity"]
            },
            {
                "type": "uniform",
                "name": "균일 분포 노이즈",
                "description": "균일한 범위의 노이즈",
                "parameters": ["intensity"]
            },
            {
                "type": "exponential",
                "name": "지수 분포 노이즈",
                "description": "지수 분포를 따르는 노이즈 (항상 양수)",
                "parameters": ["intensity"]
            },
            {
                "type": "poisson",
                "name": "포아송 분포 노이즈",
                "description": "이산 사건을 모델링하는 노이즈",
                "parameters": []
            }
        ]
    }


@router.get("/test-engine")
def test_failure_engine(current_user: User = Depends(get_current_user)):
    """고장 엔진 테스트 및 데모"""
    
    engine = FailureEngine(seed=42)  # 재현 가능한 결과를 위한 시드
    
    # 테스트 데이터
    original_params = {
        "temperature": 25.0,
        "pressure": 100.0,
        "flow_rate": 50.0
    }
    
    # 각 고장 유형별 테스트
    test_results = {}
    
    # 1. 갑작스런 고장
    sudden_config = {
        "failure_parameters": {"temperature": 999},
        "advanced_config": {
            "parameters": {
                "temperature": {
                    "failure_type": "sudden",
                    "failure_value": 999
                }
            }
        }
    }
    test_results["sudden"] = engine.apply_failure_scenario(
        original_params, sudden_config
    )
    
    # 2. 점진적 고장 with 노이즈
    gradual_config = {
        "failure_parameters": {},
        "advanced_config": {
            "parameters": {
                "pressure": {
                    "failure_type": "gradual",
                    "failure_value": 200,
                    "duration_seconds": 60,
                    "noise": {
                        "type": "gaussian",
                        "intensity": 0.05
                    }
                }
            }
        }
    }
    test_results["gradual_with_noise"] = engine.apply_failure_scenario(
        original_params, gradual_config
    )
    
    # 3. 확률적 고장
    probabilistic_config = {
        "failure_parameters": {"flow_rate": 0},
        "advanced_config": {
            "probability": 0.5,
            "parameters": {
                "flow_rate": {
                    "failure_type": "intermittent",
                    "failure_value": 0,
                    "failure_probability": 0.3
                }
            }
        }
    }
    test_results["probabilistic"] = engine.apply_failure_scenario(
        original_params, probabilistic_config
    )
    
    # 패턴 생성 테스트
    time_data, value_data = engine.generate_failure_pattern(
        base_value=100,
        pattern_type="sine",
        duration_seconds=10,
        sample_rate=5
    )
    
    return {
        "message": "NumPy 고장 엔진 테스트 완료",
        "original_parameters": original_params,
        "test_results": test_results,
        "pattern_sample": {
            "type": "sine",
            "samples": len(time_data),
            "first_5_values": value_data[:5].tolist()
        },
        "engine_capabilities": [
            "확률적 고장 발생",
            "시간 기반 패턴 생성",
            "다양한 노이즈 추가",
            "값 범위 제한",
            "고장 예측 분석"
        ]
    }