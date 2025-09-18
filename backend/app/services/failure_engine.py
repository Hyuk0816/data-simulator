"""
NumPy 기반 고장 시나리오 엔진
확률적 고장 발생, 시간 기반 패턴, 노이즈 생성 등의 고급 시뮬레이션 기능 제공
"""

import numpy as np
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
import json
import logging
from enum import Enum

logger = logging.getLogger(__name__)


class FailureType(Enum):
    """고장 유형 정의"""
    SUDDEN = "sudden"           # 갑작스런 고장
    GRADUAL = "gradual"         # 점진적 고장
    INTERMITTENT = "intermittent"  # 간헐적 고장
    CYCLIC = "cyclic"          # 주기적 고장
    RANDOM_WALK = "random_walk"  # 랜덤 워크
    DRIFT = "drift"            # 드리프트 (점진적 이탈)


class NoiseType(Enum):
    """노이즈 유형"""
    GAUSSIAN = "gaussian"       # 가우시안 노이즈
    UNIFORM = "uniform"        # 균일 분포 노이즈
    EXPONENTIAL = "exponential"  # 지수 분포 노이즈
    POISSON = "poisson"        # 포아송 분포 노이즈


class FailureEngine:
    """NumPy 기반 고장 시나리오 엔진"""
    
    def __init__(self, seed: Optional[int] = None):
        """
        Args:
            seed: 랜덤 시드 (재현 가능한 결과를 위해)
        """
        if seed is not None:
            np.random.seed(seed)
        
        self.failure_history = []
        self.start_time = datetime.now()
    
    def apply_failure_scenario(
        self,
        original_params: Dict[str, Any],
        failure_config: Dict[str, Any],
        current_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        고장 시나리오를 적용하여 파라미터 값을 변환
        
        Args:
            original_params: 원본 파라미터 값들
            failure_config: 고장 시나리오 설정
            current_time: 현재 시간 (시간 기반 패턴용)
            
        Returns:
            고장이 적용된 파라미터 값들
        """
        if current_time is None:
            current_time = datetime.now()
        
        result = original_params.copy()
        
        # 기본 고장 파라미터 적용
        if 'failure_parameters' in failure_config:
            result.update(failure_config['failure_parameters'])
        
        # 고급 기능 적용
        if 'advanced_config' in failure_config:
            result = self._apply_advanced_features(
                result, 
                failure_config['advanced_config'],
                current_time
            )
        
        return result
    
    def _apply_advanced_features(
        self,
        params: Dict[str, Any],
        config: Dict[str, Any],
        current_time: datetime
    ) -> Dict[str, Any]:
        """고급 고장 기능 적용"""
        result = params.copy()
        
        # 확률적 고장 발생
        if 'probability' in config:
            if not self._should_fail(config['probability']):
                return params  # 고장 미발생
        
        # 각 파라미터별 고급 설정 적용
        for param_name, param_config in config.get('parameters', {}).items():
            if param_name not in result:
                continue
            
            original_value = result[param_name]
            
            # 고장 유형별 처리
            if 'failure_type' in param_config:
                result[param_name] = self._apply_failure_type(
                    original_value,
                    param_config['failure_type'],
                    param_config,
                    current_time
                )
            
            # 노이즈 추가
            if 'noise' in param_config:
                result[param_name] = self._add_noise(
                    result[param_name],
                    param_config['noise']
                )
            
            # 값 범위 제한
            if 'clamp' in param_config:
                result[param_name] = self._clamp_value(
                    result[param_name],
                    param_config['clamp']
                )
        
        return result
    
    def _should_fail(self, probability: float) -> bool:
        """확률에 따라 고장 발생 여부 결정"""
        return np.random.random() < probability
    
    def _apply_failure_type(
        self,
        value: Any,
        failure_type: str,
        config: Dict[str, Any],
        current_time: datetime
    ) -> Any:
        """고장 유형별 값 변환"""
        
        # 숫자가 아닌 경우 원본 반환
        if not isinstance(value, (int, float)):
            return config.get('failure_value', value)
        
        failure_type = FailureType(failure_type)
        
        if failure_type == FailureType.SUDDEN:
            # 갑작스런 고장: 즉시 고장 값으로 변경
            return config.get('failure_value', value * 10)
        
        elif failure_type == FailureType.GRADUAL:
            # 점진적 고장: 시간에 따라 서서히 변화
            elapsed_time = (current_time - self.start_time).total_seconds()
            duration = config.get('duration_seconds', 60)
            progress = min(elapsed_time / duration, 1.0)
            
            target_value = config.get('failure_value', value * 10)
            return value + (target_value - value) * progress
        
        elif failure_type == FailureType.INTERMITTENT:
            # 간헐적 고장: 확률적으로 고장 값 반환
            failure_prob = config.get('failure_probability', 0.3)
            if np.random.random() < failure_prob:
                return config.get('failure_value', value * 10)
            return value
        
        elif failure_type == FailureType.CYCLIC:
            # 주기적 고장: 사인파 패턴
            elapsed_time = (current_time - self.start_time).total_seconds()
            period = config.get('period_seconds', 60)
            amplitude = config.get('amplitude', value * 0.5)
            
            phase = 2 * np.pi * elapsed_time / period
            return value + amplitude * np.sin(phase)
        
        elif failure_type == FailureType.RANDOM_WALK:
            # 랜덤 워크: 누적 랜덤 변화
            step_size = config.get('step_size', value * 0.1)
            steps = np.random.randn() * step_size
            return value + steps
        
        elif failure_type == FailureType.DRIFT:
            # 드리프트: 일정한 속도로 이탈
            elapsed_time = (current_time - self.start_time).total_seconds()
            drift_rate = config.get('drift_rate', 0.1)  # per second
            return value * (1 + drift_rate * elapsed_time)
        
        return value
    
    def _add_noise(self, value: Any, noise_config: Dict[str, Any]) -> Any:
        """값에 노이즈 추가"""
        
        # 숫자가 아닌 경우 원본 반환
        if not isinstance(value, (int, float)):
            return value
        
        noise_type = NoiseType(noise_config.get('type', 'gaussian'))
        intensity = noise_config.get('intensity', 0.1)
        
        if noise_type == NoiseType.GAUSSIAN:
            # 가우시안 노이즈
            noise = np.random.normal(0, intensity * abs(value))
            return value + noise
        
        elif noise_type == NoiseType.UNIFORM:
            # 균일 분포 노이즈
            noise = np.random.uniform(-intensity * abs(value), intensity * abs(value))
            return value + noise
        
        elif noise_type == NoiseType.EXPONENTIAL:
            # 지수 분포 노이즈 (항상 양수)
            noise = np.random.exponential(intensity * abs(value))
            return value + noise
        
        elif noise_type == NoiseType.POISSON:
            # 포아송 분포 노이즈
            if value > 0:
                return np.random.poisson(value)
            return value
        
        return value
    
    def _clamp_value(self, value: Any, clamp_config: Dict[str, Any]) -> Any:
        """값을 특정 범위로 제한"""
        
        # 숫자가 아닌 경우 원본 반환
        if not isinstance(value, (int, float)):
            return value
        
        min_val = clamp_config.get('min', float('-inf'))
        max_val = clamp_config.get('max', float('inf'))
        
        return np.clip(value, min_val, max_val)
    
    def generate_failure_pattern(
        self,
        base_value: float,
        pattern_type: str,
        duration_seconds: int = 60,
        sample_rate: int = 10
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        고장 패턴 시계열 데이터 생성
        
        Args:
            base_value: 기준 값
            pattern_type: 패턴 유형
            duration_seconds: 시뮬레이션 기간 (초)
            sample_rate: 초당 샘플 수
            
        Returns:
            (시간 배열, 값 배열)
        """
        num_samples = duration_seconds * sample_rate
        time_array = np.linspace(0, duration_seconds, num_samples)
        
        if pattern_type == 'step':
            # 계단 함수 패턴
            values = np.where(time_array < duration_seconds/2, base_value, base_value * 2)
        
        elif pattern_type == 'ramp':
            # 램프 함수 패턴
            values = base_value + (base_value * time_array / duration_seconds)
        
        elif pattern_type == 'sine':
            # 사인파 패턴
            values = base_value * (1 + 0.5 * np.sin(2 * np.pi * time_array / 10))
        
        elif pattern_type == 'noise':
            # 노이즈 패턴
            values = base_value + np.random.normal(0, base_value * 0.1, num_samples)
        
        elif pattern_type == 'spike':
            # 스파이크 패턴
            values = np.full(num_samples, base_value)
            spike_indices = np.random.choice(num_samples, size=int(num_samples * 0.05))
            values[spike_indices] = base_value * 5
        
        elif pattern_type == 'degradation':
            # 성능 저하 패턴
            degradation_rate = 0.02
            values = base_value * np.exp(-degradation_rate * time_array)
        
        else:
            # 기본: 상수 값
            values = np.full(num_samples, base_value)
        
        return time_array, values
    
    def analyze_failure_statistics(
        self,
        values: List[float]
    ) -> Dict[str, float]:
        """
        고장 데이터 통계 분석
        
        Args:
            values: 분석할 값들
            
        Returns:
            통계 정보
        """
        if not values:
            return {}
        
        arr = np.array(values)
        
        return {
            'mean': float(np.mean(arr)),
            'std': float(np.std(arr)),
            'min': float(np.min(arr)),
            'max': float(np.max(arr)),
            'median': float(np.median(arr)),
            'q25': float(np.percentile(arr, 25)),
            'q75': float(np.percentile(arr, 75)),
            'variance': float(np.var(arr)),
            'skewness': float(self._calculate_skewness(arr)),
            'kurtosis': float(self._calculate_kurtosis(arr))
        }
    
    def _calculate_skewness(self, arr: np.ndarray) -> float:
        """왜도 계산"""
        mean = np.mean(arr)
        std = np.std(arr)
        if std == 0:
            return 0
        return np.mean(((arr - mean) / std) ** 3)
    
    def _calculate_kurtosis(self, arr: np.ndarray) -> float:
        """첨도 계산"""
        mean = np.mean(arr)
        std = np.std(arr)
        if std == 0:
            return 0
        return np.mean(((arr - mean) / std) ** 4) - 3
    
    def predict_failure_probability(
        self,
        history: List[float],
        threshold: float,
        future_steps: int = 10
    ) -> float:
        """
        과거 데이터를 기반으로 미래 고장 확률 예측
        
        Args:
            history: 과거 데이터
            threshold: 고장 임계값
            future_steps: 예측할 미래 스텝 수
            
        Returns:
            고장 확률 (0.0 ~ 1.0)
        """
        if len(history) < 2:
            return 0.0
        
        # 간단한 선형 외삽
        arr = np.array(history)
        x = np.arange(len(arr))
        
        # 선형 회귀
        coeffs = np.polyfit(x, arr, 1)
        poly = np.poly1d(coeffs)
        
        # 미래 값 예측
        future_x = np.arange(len(arr), len(arr) + future_steps)
        future_values = poly(future_x)
        
        # 임계값 초과 확률 계산
        failures = np.sum(future_values > threshold)
        probability = failures / future_steps
        
        return float(np.clip(probability, 0, 1))