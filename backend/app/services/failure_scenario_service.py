from sqlalchemy.orm import Session
from sqlalchemy import and_, select
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from ..models.failure_scenario import FailureScenario
from ..models.simulator import Simulator
from ..schemas.failure_scenario import (
    FailureScenarioCreate,
    FailureScenarioUpdate,
)


class FailureScenarioService:
    """고장 시나리오 관련 비즈니스 로직"""
    
    @staticmethod
    def create_scenario(
        db: Session,
        scenario_data: FailureScenarioCreate,
        user_id: int
    ) -> FailureScenario:
        """새로운 고장 시나리오 생성"""
        # 시뮬레이터 권한 확인
        if scenario_data.simulator_id:
            stmt = select(Simulator).where(
                and_(
                    Simulator.id == scenario_data.simulator_id,
                    Simulator.user_id == user_id
                )
            )
            simulator = db.scalar(stmt)
            if not simulator:
                raise ValueError("해당 시뮬레이터에 대한 권한이 없습니다.")
        
        # 고장 시나리오 생성
        new_scenario = FailureScenario(
            user_id=user_id,
            simulator_id=scenario_data.simulator_id,
            name=scenario_data.name,
            description=scenario_data.description,
            failure_parameters=json.dumps(scenario_data.failure_parameters),
            is_active=scenario_data.is_active
        )
        
        db.add(new_scenario)
        db.commit()
        db.refresh(new_scenario)
        
        # JSON 문자열을 파싱하여 반환
        new_scenario.failure_parameters = json.loads(new_scenario.failure_parameters)
        return new_scenario
    
    @staticmethod
    def get_scenario(
        db: Session,
        scenario_id: int,
        user_id: int
    ) -> Optional[FailureScenario]:
        """특정 고장 시나리오 조회"""
        stmt = select(FailureScenario).where(
            and_(
                FailureScenario.id == scenario_id,
                FailureScenario.user_id == user_id
            )
        )
        scenario = db.scalar(stmt)
        
        if scenario:
            scenario.failure_parameters = json.loads(scenario.failure_parameters)
        
        return scenario
    
    @staticmethod
    def get_scenarios_by_user(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[FailureScenario]:
        """사용자의 모든 고장 시나리오 조회"""
        stmt = select(FailureScenario).where(
            FailureScenario.user_id == user_id
        ).offset(skip).limit(limit)
        scenarios = list(db.scalars(stmt).all())
        
        # JSON 문자열을 파싱
        for scenario in scenarios:
            scenario.failure_parameters = json.loads(scenario.failure_parameters)
        
        return scenarios
    
    @staticmethod
    def get_scenarios_by_simulator(
        db: Session,
        simulator_id: int,
        user_id: int
    ) -> List[FailureScenario]:
        """특정 시뮬레이터의 고장 시나리오 조회"""
        # 시뮬레이터 권한 확인
        stmt = select(Simulator).where(
            and_(
                Simulator.id == simulator_id,
                Simulator.user_id == user_id
            )
        )
        simulator = db.scalar(stmt)
        
        if not simulator:
            raise ValueError("해당 시뮬레이터에 대한 권한이 없습니다.")
        
        stmt = select(FailureScenario).where(
            FailureScenario.simulator_id == simulator_id
        )
        scenarios = list(db.scalars(stmt).all())
        
        # JSON 문자열을 파싱
        for scenario in scenarios:
            scenario.failure_parameters = json.loads(scenario.failure_parameters)
        
        return scenarios
    
    @staticmethod
    def update_scenario(
        db: Session,
        scenario_id: int,
        scenario_data: FailureScenarioUpdate,
        user_id: int
    ) -> Optional[FailureScenario]:
        """고장 시나리오 업데이트"""
        stmt = select(FailureScenario).where(
            and_(
                FailureScenario.id == scenario_id,
                FailureScenario.user_id == user_id
            )
        )
        scenario = db.scalar(stmt)
        
        if not scenario:
            return None
        
        # 업데이트할 필드만 적용
        if scenario_data.name is not None:
            scenario.name = scenario_data.name
        if scenario_data.description is not None:
            scenario.description = scenario_data.description
        if scenario_data.failure_parameters is not None:
            scenario.failure_parameters = json.dumps(scenario_data.failure_parameters)
        if scenario_data.is_active is not None:
            scenario.is_active = scenario_data.is_active
        
        db.commit()
        db.refresh(scenario)
        
        # JSON 문자열을 파싱하여 반환
        scenario.failure_parameters = json.loads(scenario.failure_parameters)
        return scenario
    
    @staticmethod
    def delete_scenario(
        db: Session,
        scenario_id: int,
        user_id: int
    ) -> bool:
        """고장 시나리오 삭제"""
        stmt = select(FailureScenario).where(
            and_(
                FailureScenario.id == scenario_id,
                FailureScenario.user_id == user_id
            )
        )
        scenario = db.scalar(stmt)
        
        if not scenario:
            return False
        
        # 적용 중인 시나리오는 삭제 불가
        if scenario.is_applied:
            raise ValueError("적용 중인 시나리오는 삭제할 수 없습니다. 먼저 해제해주세요.")
        
        db.delete(scenario)
        db.commit()
        return True
    
    @staticmethod
    def apply_scenario_to_simulator(
        db: Session,
        scenario_id: int,
        simulator_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """고장 시나리오를 시뮬레이터에 적용"""
        # 시뮬레이터 권한 확인
        stmt = select(Simulator).where(
            and_(
                Simulator.id == simulator_id,
                Simulator.user_id == user_id
            )
        )
        simulator = db.scalar(stmt)
        
        if not simulator:
            raise ValueError("해당 시뮬레이터에 대한 권한이 없습니다.")
        
        # 시나리오 확인
        stmt = select(FailureScenario).where(
            and_(
                FailureScenario.id == scenario_id,
                FailureScenario.user_id == user_id
            )
        )
        scenario = db.scalar(stmt)
        
        if not scenario:
            raise ValueError("해당 고장 시나리오를 찾을 수 없습니다.")
        
        if not scenario.is_active:
            raise ValueError("비활성화된 시나리오는 적용할 수 없습니다.")
        
        # 기존에 적용된 시나리오가 있다면 해제
        stmt = select(FailureScenario).where(
            and_(
                FailureScenario.simulator_id == simulator_id,
                FailureScenario.is_applied == True
            )
        )
        existing_applied = db.scalar(stmt)
        
        if existing_applied:
            existing_applied.is_applied = False
            existing_applied.applied_at = None
        
        # 새 시나리오 적용
        scenario.simulator_id = simulator_id
        scenario.is_applied = True
        scenario.applied_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "message": "고장 시나리오가 성공적으로 적용되었습니다.",
            "scenario_id": scenario_id,
            "simulator_id": simulator_id,
            "applied_at": scenario.applied_at
        }
    
    @staticmethod
    def release_scenario_from_simulator(
        db: Session,
        simulator_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """시뮬레이터에서 고장 시나리오 해제"""
        # 시뮬레이터 권한 확인
        stmt = select(Simulator).where(
            and_(
                Simulator.id == simulator_id,
                Simulator.user_id == user_id
            )
        )
        simulator = db.scalar(stmt)
        
        if not simulator:
            raise ValueError("해당 시뮬레이터에 대한 권한이 없습니다.")
        
        # 적용된 시나리오 찾기
        stmt = select(FailureScenario).where(
            and_(
                FailureScenario.simulator_id == simulator_id,
                FailureScenario.is_applied == True
            )
        )
        applied_scenario = db.scalar(stmt)
        
        if not applied_scenario:
            raise ValueError("현재 적용된 고장 시나리오가 없습니다.")
        
        # 시나리오 해제
        applied_scenario.is_applied = False
        applied_scenario.applied_at = None
        
        db.commit()
        
        return {
            "message": "고장 시나리오가 성공적으로 해제되었습니다.",
            "scenario_id": applied_scenario.id,
            "simulator_id": simulator_id
        }
    
    @staticmethod
    def get_simulator_with_failure(
        db: Session,
        simulator_id: int
    ) -> Dict[str, Any]:
        """고장 시나리오가 적용된 시뮬레이터의 현재 응답 데이터 조회"""
        stmt = select(Simulator).where(
            Simulator.id == simulator_id
        )
        simulator = db.scalar(stmt)
        
        if not simulator:
            raise ValueError("시뮬레이터를 찾을 수 없습니다.")
        
        # 원본 파라미터
        original_params = json.loads(simulator.parameters)
        
        # 적용된 고장 시나리오 확인
        stmt = select(FailureScenario).where(
            and_(
                FailureScenario.simulator_id == simulator_id,
                FailureScenario.is_applied == True
            )
        )
        applied_scenario = db.scalar(stmt)
        
        if applied_scenario:
            # 고장 파라미터로 원본 파라미터 덮어쓰기
            failure_params = json.loads(applied_scenario.failure_parameters)
            current_response = {**original_params, **failure_params}
            
            return {
                "simulator_id": simulator_id,
                "simulator_name": simulator.name,
                "active_scenario_id": applied_scenario.id,
                "active_scenario_name": applied_scenario.name,
                "original_parameters": original_params,
                "failure_parameters": failure_params,
                "current_response": current_response,
                "timestamp": datetime.utcnow()
            }
        else:
            # 고장 시나리오가 없으면 원본 파라미터 반환
            return {
                "simulator_id": simulator_id,
                "simulator_name": simulator.name,
                "active_scenario_id": None,
                "active_scenario_name": None,
                "original_parameters": original_params,
                "failure_parameters": None,
                "current_response": original_params,
                "timestamp": datetime.utcnow()
            }